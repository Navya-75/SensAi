import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getSignedInProfile } from "@/lib/auth/user";
import { syncSignedInUser } from "@/lib/auth/sync-user";
import { prisma } from "@/lib/db/prisma";
import { resumeBuilderSaveSchema } from "@/lib/validation/resume-builder";

export async function PATCH(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Please sign in to save your resume." }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "The resume data was not valid." }, { status: 400 }); }
  const parsed = resumeBuilderSaveSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Review your resume fields and try again." }, { status: 400 });

  try {
    const identity = await getSignedInProfile();
    if (!identity || identity.clerkUserId !== userId) return NextResponse.json({ error: "Your session could not be verified." }, { status: 401 });
    const synced = await syncSignedInUser(identity);
    if (synced.status !== "synced") return NextResponse.json({ error: "Resume builder storage is not configured." }, { status: 503 });
    const saved = await prisma.resumeBuilderDocument.upsert({
      where: { userId: synced.user.id },
      create: { userId: synced.user.id, ...parsed.data },
      update: parsed.data,
      select: { id: true, title: true, templateKey: true, updatedAt: true },
    });
    await prisma.progressTracking.create({ data: { userId: synced.user.id, category: "RESUME", metricKey: "builder_completion", value: 1, target: 1, sourceId: saved.id } });
    return NextResponse.json({ saved: { ...saved, updatedAt: saved.updatedAt.toISOString() } }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
  } catch {
    return NextResponse.json({ error: "SENSAI could not save your resume. Please try again." }, { status: 503 });
  }
}
