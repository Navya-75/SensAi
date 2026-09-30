import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSignedInProfile } from "@/lib/auth/user";
import { syncSignedInUser } from "@/lib/auth/sync-user";
import { GeminiConfigurationError, GeminiResponseError, generateGeminiStructuredOutput } from "@/lib/ai/gemini";
import { roadmapJsonSchema, roadmapSchema } from "@/lib/ai/schemas/roadmap";
import { roadmapSystemInstruction } from "@/lib/ai/prompts/roadmap";
import { isAiProcessingAllowed } from "@/lib/privacy/ai-consent";
import { consumeAiAllowance } from "@/lib/security/ai-limits";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";
export const maxDuration = 60;
const requestSchema = z.object({ targetRole: z.string().trim().min(2).max(120).optional() }).strict();

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Please sign in to generate a roadmap." }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "The roadmap request was not valid." }, { status: 400 }); }
  const parsedBody = requestSchema.safeParse(body);
  if (!parsedBody.success) return NextResponse.json({ error: "Enter a target role between 2 and 120 characters." }, { status: 400 });

  try {
    const identity = await getSignedInProfile();
    if (!identity || identity.clerkUserId !== userId) return NextResponse.json({ error: "Your session could not be verified." }, { status: 401 });
    const synced = await syncSignedInUser(identity);
    if (synced.status !== "synced") return NextResponse.json({ error: "Roadmap storage is not configured." }, { status: 503 });
    if (!(await isAiProcessingAllowed(synced.user.id))) return NextResponse.json({ error: "AI processing is turned off in your privacy settings." }, { status: 403 });

    const [profile, skills, latestAnalysis, activeResume] = await Promise.all([
      prisma.onboardingProfile.findUnique({ where: { userId: synced.user.id }, select: { targetRole: true, targetIndustry: true, careerGoal: true, experienceLevel: true } }),
      prisma.userSkill.findMany({ where: { userId: synced.user.id }, select: { skill: { select: { name: true } } } }),
      prisma.resumeAnalysis.findFirst({ where: { userId: synced.user.id }, orderBy: { createdAt: "desc" }, select: { result: true } }),
      prisma.resume.findFirst({ where: { userId: synced.user.id, isActive: true }, orderBy: { uploadedAt: "desc" }, select: { id: true } }),
    ]);
    const targetRole = parsedBody.data.targetRole ?? profile?.targetRole;
    if (!targetRole) return NextResponse.json({ error: "Add a target role to your profile before generating a roadmap." }, { status: 400 });
    if (!(await consumeAiAllowance(synced.user.id, "ROADMAP", 3))) return NextResponse.json({ error: "You have reached the hourly roadmap limit. Try again later." }, { status: 429 });
    const resumeSummary = latestAnalysis?.result && typeof latestAnalysis.result === "object" && "summary" in latestAnalysis.result && typeof latestAnalysis.result.summary === "string"
      ? latestAnalysis.result.summary
      : null;

    const generated = await generateGeminiStructuredOutput({
      input: JSON.stringify({
        targetRole,
        targetIndustry: profile?.targetIndustry ?? null,
        careerGoal: profile?.careerGoal ?? null,
        experienceLevel: profile?.experienceLevel ?? "EXPLORING",
        currentSkills: skills.map(({ skill }) => skill.name),
        resumeSummary,
      }),
      systemInstruction: roadmapSystemInstruction,
      responseSchema: roadmapJsonSchema,
      validator: roadmapSchema,
      maxOutputTokens: 3072,
    });

    const roadmap = await prisma.$transaction(async (tx) => {
      await tx.careerRoadmap.updateMany({ where: { userId: synced.user.id, status: "ACTIVE" }, data: { status: "PAUSED" } });
      const created = await tx.careerRoadmap.create({
        data: {
          userId: synced.user.id,
          sourceResumeId: activeResume?.id,
          targetRole,
          title: generated.result.title,
          description: generated.result.description,
          phases: { create: generated.result.phases.map((phase, phaseIndex) => ({
            position: phaseIndex + 1,
            title: phase.title,
            description: phase.description,
            skills: phase.skills,
            resources: phase.resources,
            tasks: { create: phase.tasks.map((task, taskIndex) => ({ position: taskIndex + 1, title: task.title, description: task.description })) },
          })) },
        },
        select: { id: true, title: true, description: true },
      });
      const taskCount = generated.result.phases.reduce((sum, phase) => sum + phase.tasks.length, 0);
      await tx.progressTracking.create({ data: { userId: synced.user.id, category: "ROADMAP", metricKey: "roadmap_completion", value: 0, target: taskCount, sourceId: created.id } });
      await tx.userActivity.create({ data: { userId: synced.user.id, type: "ROADMAP_GENERATED", summary: "Career roadmap generated", referenceType: "roadmap", referenceId: created.id } });
      return created;
    }, { maxWait: 10_000, timeout: 30_000 });
    return NextResponse.json({ roadmapId: roadmap.id }, { status: 201, headers: { "Cache-Control": "private, no-store, max-age=0" } });
  } catch (error) {
    if (error instanceof GeminiConfigurationError) return NextResponse.json({ error: "Gemini is not configured. Add GEMINI_API_KEY to the server environment." }, { status: 503 });
    if (error instanceof GeminiResponseError) return NextResponse.json({ error: "Gemini could not return a valid roadmap. Please try again." }, { status: 502 });
    return NextResponse.json({ error: "SENSAI could not create the roadmap. Please try again." }, { status: 502 });
  }
}
