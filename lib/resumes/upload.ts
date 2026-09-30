import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { getStorageProvider } from "@/lib/storage";
import { extractPdfText, ResumeProcessingError } from "@/lib/resumes/pdf-extraction";
import { MAX_RESUME_BYTES } from "@/lib/resumes/constants";

export class ResumeUploadError extends Error {
  constructor(
    message: string,
    public readonly status: 400 | 413 | 503,
  ) {
    super(message);
    this.name = "ResumeUploadError";
  }
}

function sanitizeFilename(filename: string) {
  return filename
    .replace(/[\\/\u0000-\u001f\u007f]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160) || "resume.pdf";
}

function looksLikePdf(bytes: Uint8Array) {
  const header = Buffer.from(bytes.subarray(0, Math.min(bytes.length, 1024))).toString("latin1");
  return header.includes("%PDF-");
}

export async function uploadResumeForUser({
  userId,
  filename,
  bytes,
}: {
  userId: string;
  filename: string;
  bytes: Uint8Array;
}) {
  if (!process.env.DATABASE_URL) throw new ResumeUploadError("Profile storage is not configured yet.", 503);
  if (bytes.byteLength < 8 || bytes.byteLength > MAX_RESUME_BYTES) {
    throw new ResumeUploadError("Choose a PDF smaller than 4 MB.", bytes.byteLength > MAX_RESUME_BYTES ? 413 : 400);
  }
  if (!filename.toLowerCase().endsWith(".pdf") || !looksLikePdf(bytes)) {
    throw new ResumeUploadError("Only valid PDF files can be uploaded.", 400);
  }

  let extracted: Awaited<ReturnType<typeof extractPdfText>>;
  try {
    extracted = await extractPdfText(bytes);
  } catch (error) {
    if (error instanceof ResumeProcessingError) {
      throw new ResumeUploadError(error.message, error.code === "PDF_TOO_MANY_PAGES" || error.code === "PDF_TEXT_TOO_LONG" ? 413 : 400);
    }
    throw new ResumeUploadError("SENSAI could not process this PDF. Please try another file.", 400);
  }

  let storage;
  try {
    storage = getStorageProvider();
  } catch {
    throw new ResumeUploadError("Private file storage is not configured yet.", 503);
  }

  const storageKey = `${userId}/${randomUUID()}.pdf`;
  const contentHash = createHash("sha256").update(bytes).digest("hex");
  try {
    await storage.put(storageKey, bytes, "application/pdf");
  } catch (error) {
    console.error("Private resume storage write failed", {
      provider: storage.name,
      errorName: error instanceof Error ? error.name : "UnknownError",
      errorCode: error && typeof error === "object" && "code" in error ? String(error.code) : undefined,
      errorMessage: error instanceof Error ? error.message.replace(/[A-Za-z]:\\[^:\r\n]*/g, "[path]").slice(0, 180) : undefined,
    });
    throw new ResumeUploadError("Private resume storage is unavailable. Check its configuration and try again.", 503);
  }

  try {
    return await prisma.$transaction(async (tx) => {
      await tx.resume.updateMany({ where: { userId, isActive: true }, data: { isActive: false } });
      const resume = await tx.resume.create({
        data: {
          userId,
          originalFilename: sanitizeFilename(filename),
          mimeType: "application/pdf",
          sizeBytes: bytes.byteLength,
          storageProvider: storage.name,
          storageKey,
          contentHash,
          extractedText: extracted.text,
          status: "UPLOADED",
          isActive: true,
        },
        select: {
          id: true,
          originalFilename: true,
          sizeBytes: true,
          status: true,
          isActive: true,
          uploadedAt: true,
        },
      });

      await tx.userActivity.create({
        data: {
          userId,
          type: "RESUME_UPLOADED",
          summary: "Resume uploaded",
          referenceType: "Resume",
          referenceId: resume.id,
        },
      });

      return { ...resume, pageCount: extracted.pageCount };
    });
  } catch {
    await storage.delete(storageKey).catch(() => undefined);
    throw new ResumeUploadError("SENSAI could not save the resume record. Please try again.", 503);
  }
}
