import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getSignedInProfile } from "@/lib/auth/user";
import { syncSignedInUser } from "@/lib/auth/sync-user";
import { GeminiConfigurationError, GeminiResponseError, generateGeminiStructuredOutput } from "@/lib/ai/gemini";
import { coverLetterJsonSchema, coverLetterRequestSchema, coverLetterSchema } from "@/lib/ai/schemas/cover-letter";
import { coverLetterSystemInstruction } from "@/lib/ai/prompts/cover-letter";
import { isAiProcessingAllowed } from "@/lib/privacy/ai-consent";
import { resumeAnalysisSchema } from "@/lib/ai/schemas/resume-analysis";
import { prisma } from "@/lib/db/prisma";
import { consumeAiAllowance } from "@/lib/security/ai-limits";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Please sign in to generate a cover letter." }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "The cover-letter request was not valid." }, { status: 400 }); }
  const parsed = coverLetterRequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the role and job description." }, { status: 400 });

  try {
    const identity = await getSignedInProfile();
    if (!identity || identity.clerkUserId !== userId) return NextResponse.json({ error: "Your session could not be verified." }, { status: 401 });
    const synced = await syncSignedInUser(identity);
    if (synced.status !== "synced") return NextResponse.json({ error: "Cover-letter storage is not configured." }, { status: 503 });
    if (!(await isAiProcessingAllowed(synced.user.id))) return NextResponse.json({ error: "AI processing is turned off in your privacy settings." }, { status: 403 });

    let jobId: string | null = null;
    let title = parsed.data.jobTitle;
    let company = parsed.data.company;
    let jobDescription = parsed.data.jobDescription;
    if (parsed.data.jobId) {
      const job = await prisma.job.findFirst({ where: { id: parsed.data.jobId, OR: [{ source: "CURATED" }, { source: "DEMO", isDemo: true }], AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }] }, select: { id: true, title: true, company: true, description: true } });
      if (!job) return NextResponse.json({ error: "The selected job is no longer available." }, { status: 404 });
      jobId = job.id;
      title = job.title;
      company = job.company;
      jobDescription = job.description;
    }

    const [user, skills, latestAnalysis] = await Promise.all([
      prisma.user.findUnique({ where: { id: synced.user.id }, select: { fullName: true } }),
      prisma.userSkill.findMany({ where: { userId: synced.user.id }, select: { skill: { select: { name: true } } } }),
      prisma.resumeAnalysis.findFirst({ where: { userId: synced.user.id }, orderBy: { createdAt: "desc" }, select: { result: true, resumeId: true } }),
    ]);
    const parsedAnalysis = latestAnalysis ? resumeAnalysisSchema.safeParse(latestAnalysis.result) : null;
    const resumeFacts = parsedAnalysis?.success ? {
      summary: parsedAnalysis.data.summary,
      skills: parsedAnalysis.data.skills.map(({ name, evidence }) => ({ name, evidence })),
      experience: parsedAnalysis.data.experience.map(({ title: role, organization, dates, details }) => ({ role, organization, dates, details: details.map(({ evidence }) => evidence) })),
      education: parsedAnalysis.data.education.map(({ evidence }) => evidence),
      projects: parsedAnalysis.data.projects.map(({ evidence }) => evidence),
      certifications: parsedAnalysis.data.certifications.map(({ evidence }) => evidence),
      achievements: parsedAnalysis.data.achievements.map(({ evidence }) => evidence),
    } : null;
    const currentSkills = [...new Set(skills.map(({ skill }) => skill.name))];
    if (!resumeFacts && currentSkills.length === 0) return NextResponse.json({ error: "Add profile skills or analyze a resume before generating a grounded cover letter." }, { status: 422 });
    if (!(await consumeAiAllowance(synced.user.id, "COVER_LETTER", 5))) return NextResponse.json({ error: "You have reached the hourly cover-letter limit. Try again later." }, { status: 429 });

    const generated = await generateGeminiStructuredOutput({
      input: JSON.stringify({ applicantName: user?.fullName ?? "", currentSkills, resumeEvidence: resumeFacts, targetRole: title, targetCompany: company, jobDescription }),
      systemInstruction: coverLetterSystemInstruction,
      responseSchema: coverLetterJsonSchema,
      validator: coverLetterSchema,
      maxOutputTokens: 4096,
    });
    const content = [generated.result.opening, generated.result.body, generated.result.closing].join("\n\n");
    const saved = await prisma.$transaction(async (tx) => {
      const letter = await tx.coverLetter.create({
        data: { userId: synced.user.id, jobId, resumeId: latestAnalysis?.resumeId ?? null, title: `Cover letter — ${title} at ${company}`.slice(0, 240), content },
        select: { id: true, title: true, content: true, createdAt: true, updatedAt: true },
      });
      await tx.userActivity.create({ data: { userId: synced.user.id, type: "COVER_LETTER_GENERATED", summary: "Cover letter generated", referenceType: "cover-letter", referenceId: letter.id } });
      return letter;
    });
    return NextResponse.json({ letter: { ...saved, createdAt: saved.createdAt.toISOString(), updatedAt: saved.updatedAt.toISOString() } }, { status: 201, headers: { "Cache-Control": "private, no-store, max-age=0" } });
  } catch (error) {
    if (error instanceof GeminiConfigurationError) return NextResponse.json({ error: "Gemini is not configured. Add GEMINI_API_KEY to the server environment." }, { status: 503 });
    if (error instanceof GeminiResponseError) return NextResponse.json({ error: "Gemini could not return a valid cover letter." }, { status: 502 });
    return NextResponse.json({ error: "SENSAI could not generate this cover letter." }, { status: 502 });
  }
}
