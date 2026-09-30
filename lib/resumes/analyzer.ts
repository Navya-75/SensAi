import "server-only";
import { syncSignedInUser } from "@/lib/auth/sync-user";
import type { SignedInProfile } from "@/lib/auth/user";
import { prisma } from "@/lib/db/prisma";
import { resumeAnalysisSchema } from "@/lib/ai/schemas/resume-analysis";

export async function getResumeAnalyzerData(profile: SignedInProfile) {
  if (!process.env.DATABASE_URL) return { available: false as const, resumes: [] };
  const sync = await syncSignedInUser(profile);
  if (sync.status !== "synced") return { available: false as const, resumes: [] };

  const resumes = await prisma.resume.findMany({
    where: { userId: sync.user.id },
    orderBy: { uploadedAt: "desc" },
    select: { id: true, originalFilename: true, status: true, uploadedAt: true },
  });
  const historyByResumeId = new Map(await Promise.all(resumes.map(async (resume) => {
    const records = await prisma.resumeAnalysis.findMany({
      where: { userId: sync.user.id, resumeId: resume.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, model: true, result: true, createdAt: true },
    });
    const validRecords = records.flatMap((record) => {
      const parsed = resumeAnalysisSchema.safeParse(record.result);
      return parsed.success ? [{
        id: record.id,
        model: record.model,
        result: parsed.data,
        createdAt: record.createdAt.toISOString(),
      }] : [];
    });
    return [resume.id, validRecords] as const;
  })));

  return {
    available: true as const,
    resumes: resumes.map((resume) => ({
      id: resume.id,
      originalFilename: resume.originalFilename,
      status: resume.status,
      uploadedAt: resume.uploadedAt.toISOString(),
      latestAnalysis: historyByResumeId.get(resume.id)?.[0] ?? null,
      analysisHistory: (historyByResumeId.get(resume.id) ?? []).map(({ id, model, createdAt }) => ({ id, model, createdAt })),
    })),
  };
}
