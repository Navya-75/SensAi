import "server-only";
import type { SignedInProfile } from "@/lib/auth/user";
import { syncSignedInUser } from "@/lib/auth/sync-user";
import { prisma } from "@/lib/db/prisma";

export async function getResumeLibrary(profile: SignedInProfile) {
  if (!process.env.DATABASE_URL) return { available: false as const, resumes: [] };
  const sync = await syncSignedInUser(profile);
  if (sync.status !== "synced") return { available: false as const, resumes: [] };

  const resumes = await prisma.resume.findMany({
    where: { userId: sync.user.id },
    orderBy: { uploadedAt: "desc" },
    select: {
      id: true,
      originalFilename: true,
      sizeBytes: true,
      status: true,
      isActive: true,
      uploadedAt: true,
    },
  });

  return {
    available: true as const,
    resumes: resumes.map((resume) => ({ ...resume, uploadedAt: resume.uploadedAt.toISOString() })),
  };
}
