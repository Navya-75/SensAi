import "server-only";
import { prisma } from "@/lib/db/prisma";
import { isAiProcessingAllowed } from "@/lib/privacy/ai-consent";
import { analyzeResumeWithGemini } from "@/lib/ai/gemini";
import { syncResumeSkills } from "@/lib/skills/sync-resume-skills";

export class ResumeAnalysisError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "ResumeAnalysisError";
  }
}

const MAX_ANALYSIS_CHARS = 100_000;
const MAX_ANALYSES_PER_HOUR = 5;

export async function analyzeOwnedResume(userId: string, resumeId: string) {
  const resume = await prisma.resume.findFirst({
    where: { id: resumeId, userId },
    select: { id: true, extractedText: true, status: true },
  });
  if (!resume) throw new ResumeAnalysisError("Resume not found.", 404);
  if (!(await isAiProcessingAllowed(userId))) {
    throw new ResumeAnalysisError("AI processing is turned off in your privacy settings.", 403);
  }

  const text = resume.extractedText?.trim();
  if (!text) throw new ResumeAnalysisError("This resume has no extractable text to analyze.", 422);
  if (text.length > MAX_ANALYSIS_CHARS) {
    throw new ResumeAnalysisError("This resume is too long for analysis. Upload a shorter version.", 413);
  }

  const since = new Date(Date.now() - 60 * 60 * 1000);
  const recentCount = await prisma.resumeAnalysis.count({ where: { userId, createdAt: { gte: since } } });
  if (recentCount >= MAX_ANALYSES_PER_HOUR) {
    throw new ResumeAnalysisError("You have reached the analysis limit. Try again in about an hour.", 429);
  }

  const analysis = await analyzeResumeWithGemini(text);
  const saved = await prisma.$transaction(async (tx) => {
    const record = await tx.resumeAnalysis.create({
      data: { userId, resumeId, model: analysis.model, result: analysis.result },
      select: { id: true, model: true, result: true, createdAt: true },
    });
    await tx.resume.update({ where: { id: resumeId }, data: { status: "ANALYZED" } });
    await syncResumeSkills(tx, userId, analysis.result);
    await tx.userActivity.create({
      data: {
        userId,
        type: "RESUME_ANALYZED",
        summary: "Resume analysis completed",
        referenceType: "resume",
        referenceId: resumeId,
      },
    });
    return record;
  });

  return {
    id: saved.id,
    model: saved.model,
    result: analysis.result,
    createdAt: saved.createdAt.toISOString(),
  };
}

export async function getLatestResumeAnalyses(userId: string, resumeIds: string[]) {
  if (resumeIds.length === 0) return new Map<string, { result: unknown; model: string | null; createdAt: string }>();
  const records = await prisma.resumeAnalysis.findMany({
    where: { userId, resumeId: { in: resumeIds } },
    orderBy: { createdAt: "desc" },
    distinct: ["resumeId"],
    select: { resumeId: true, result: true, model: true, createdAt: true },
  });
  return new Map(records.map((record) => [record.resumeId, {
    result: record.result,
    model: record.model,
    createdAt: record.createdAt.toISOString(),
  }]));
}
