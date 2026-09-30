import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSignedInProfile } from "@/lib/auth/user";
import { syncSignedInUser } from "@/lib/auth/sync-user";
import { GeminiConfigurationError, GeminiResponseError, generateGeminiStructuredOutput } from "@/lib/ai/gemini";
import { interviewQuestionsJsonSchema, interviewQuestionsSchema } from "@/lib/ai/schemas/interview";
import { interviewQuestionInstruction } from "@/lib/ai/prompts/interview";
import { isAiProcessingAllowed } from "@/lib/privacy/ai-consent";
import { prisma } from "@/lib/db/prisma";
import { consumeAiAllowance } from "@/lib/security/ai-limits";

export const runtime = "nodejs";
export const maxDuration = 60;
const startSchema = z.object({
  targetRole: z.string().trim().min(2).max(120),
  type: z.enum(["TECHNICAL", "HR", "BEHAVIORAL", "MIXED"]),
  experienceLevel: z.enum(["EXPLORING", "STUDENT", "ENTRY_LEVEL", "EARLY_CAREER", "MID_CAREER", "SENIOR"]),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  questionCount: z.number().int().min(3).max(10),
}).strict();

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Please sign in to start an interview." }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "The interview settings were not valid." }, { status: 400 }); }
  const parsed = startSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Check the role and interview settings." }, { status: 400 });
  try {
    const identity = await getSignedInProfile();
    if (!identity || identity.clerkUserId !== userId) return NextResponse.json({ error: "Your session could not be verified." }, { status: 401 });
    const synced = await syncSignedInUser(identity);
    if (synced.status !== "synced") return NextResponse.json({ error: "Interview storage is not configured." }, { status: 503 });
    if (!(await isAiProcessingAllowed(synced.user.id))) return NextResponse.json({ error: "AI processing is turned off in your privacy settings." }, { status: 403 });
    if (!(await consumeAiAllowance(synced.user.id, "INTERVIEW_START", 5))) return NextResponse.json({ error: "You have reached the hourly interview setup limit. Try again later." }, { status: 429 });
    const skills = await prisma.userSkill.findMany({ where: { userId: synced.user.id }, select: { skill: { select: { name: true } } } });
    const generated = await generateGeminiStructuredOutput({
      input: JSON.stringify({ ...parsed.data, currentSkills: skills.map(({ skill }) => skill.name) }),
      systemInstruction: interviewQuestionInstruction,
      responseSchema: interviewQuestionsJsonSchema,
      validator: interviewQuestionsSchema,
      maxOutputTokens: Math.min(2600, 400 + parsed.data.questionCount * 220),
    });
    if (generated.result.questions.length !== parsed.data.questionCount) throw new GeminiResponseError();
    const session = await prisma.interview.create({
      data: {
        userId: synced.user.id,
        targetRole: parsed.data.targetRole,
        type: parsed.data.type,
        experienceLevel: parsed.data.experienceLevel,
        difficulty: parsed.data.difficulty,
        questionCount: parsed.data.questionCount,
        status: "IN_PROGRESS",
        startedAt: new Date(),
        questions: { create: generated.result.questions.map((question, position) => ({ position: position + 1, prompt: question.prompt, category: question.category })) },
      },
      include: { questions: { orderBy: { position: "asc" }, select: { id: true, position: true, prompt: true, category: true } } },
    });
    return NextResponse.json({ interview: session }, { status: 201, headers: { "Cache-Control": "private, no-store, max-age=0" } });
  } catch (error) {
    if (error instanceof GeminiConfigurationError) return NextResponse.json({ error: "Gemini is not configured. Add GEMINI_API_KEY to the server environment." }, { status: 503 });
    if (error instanceof GeminiResponseError) return NextResponse.json({ error: "Gemini could not generate the requested interview questions." }, { status: 502 });
    return NextResponse.json({ error: "SENSAI could not start the interview." }, { status: 502 });
  }
}
