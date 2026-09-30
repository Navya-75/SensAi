import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSignedInProfile } from "@/lib/auth/user";
import { syncSignedInUser } from "@/lib/auth/sync-user";
import { prisma } from "@/lib/db/prisma";

type RouteContext = { params: { id: string } };
const updateSchema = z.object({ title: z.string().trim().min(1).max(240), content: z.string().trim().min(1).max(8000) }).strict();

async function getOwner(clerkUserId: string) {
  const identity = await getSignedInProfile();
  if (!identity || identity.clerkUserId !== clerkUserId) return null;
  const sync = await syncSignedInUser(identity);
  return sync.status === "synced" ? sync.user : null;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Please sign in to access this letter." }, { status: 401 });
  try {
    const owner = await getOwner(userId);
    if (!owner) return NextResponse.json({ error: "Your account could not be verified." }, { status: 401 });
    const letter = await prisma.coverLetter.findFirst({ where: { id: params.id, userId: owner.id }, select: { id: true, title: true, content: true, createdAt: true, updatedAt: true } });
    if (!letter) return NextResponse.json({ error: "Cover letter not found." }, { status: 404 });
    return NextResponse.json({ letter: { ...letter, createdAt: letter.createdAt.toISOString(), updatedAt: letter.updatedAt.toISOString() } }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
  } catch { return NextResponse.json({ error: "SENSAI could not load this letter." }, { status: 503 }); }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Please sign in to edit this letter." }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "The letter data was not valid." }, { status: 400 }); }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Review the letter and try again." }, { status: 400 });
  try {
    const owner = await getOwner(userId);
    if (!owner) return NextResponse.json({ error: "Your account could not be verified." }, { status: 401 });
    const result = await prisma.coverLetter.updateMany({ where: { id: params.id, userId: owner.id }, data: parsed.data });
    if (result.count === 0) return NextResponse.json({ error: "Cover letter not found." }, { status: 404 });
    return NextResponse.json({ saved: true });
  } catch { return NextResponse.json({ error: "SENSAI could not save your changes." }, { status: 503 }); }
}
