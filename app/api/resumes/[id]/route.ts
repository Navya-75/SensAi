import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getStorageProvider, isStorageProviderName } from "@/lib/storage";

type RouteContext = { params: { id: string } };

async function findOwnedResume(id: string, clerkUserId: string) {
  if (!process.env.DATABASE_URL) return null;
  const user = await prisma.user.findUnique({ where: { clerkUserId }, select: { id: true } });
  if (!user) return null;
  const resume = await prisma.resume.findFirst({
    where: { id, userId: user.id },
    select: { id: true, userId: true, originalFilename: true, storageProvider: true, storageKey: true, isActive: true },
  });
  return resume;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Please sign in to access this resume." }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Resume storage is not configured." }, { status: 503 });

  try {
    const resume = await findOwnedResume(params.id, userId);
    if (!resume) return NextResponse.json({ error: "Resume not found." }, { status: 404 });
    if (!isStorageProviderName(resume.storageProvider)) return NextResponse.json({ error: "Resume storage is unavailable." }, { status: 503 });

    const file = await getStorageProvider(resume.storageProvider).get(resume.storageKey);
    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=\"resume.pdf\"",
        "Content-Length": String(file.byteLength),
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "SENSAI could not retrieve this resume." }, { status: 503 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Please sign in to delete this resume." }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Resume storage is not configured." }, { status: 503 });

  try {
    const resume = await findOwnedResume(params.id, userId);
    if (!resume) return NextResponse.json({ error: "Resume not found." }, { status: 404 });
    if (!isStorageProviderName(resume.storageProvider)) return NextResponse.json({ error: "Resume storage is unavailable." }, { status: 503 });

    await getStorageProvider(resume.storageProvider).delete(resume.storageKey);
    await prisma.$transaction(async (tx) => {
      await tx.resume.delete({ where: { id: resume.id } });
      if (resume.isActive) {
        const replacement = await tx.resume.findFirst({
          where: { userId: resume.userId },
          orderBy: { uploadedAt: "desc" },
          select: { id: true },
        });
        if (replacement) await tx.resume.update({ where: { id: replacement.id }, data: { isActive: true } });
      }
    });

    return new Response(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "SENSAI could not delete this resume. Please try again." }, { status: 503 });
  }
}
