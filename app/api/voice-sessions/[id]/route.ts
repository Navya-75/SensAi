import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSignedInProfile } from "@/lib/auth/user";
import { syncSignedInUser } from "@/lib/auth/sync-user";
import { prisma } from "@/lib/db/prisma";

type RouteContext = { params: { id: string } };
const updateSchema = z.object({
  status: z.enum(["CREATED", "RECORDING", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED"]),
  transcriptText: z.string().max(8000).optional(),
}).strict();

export async function PATCH(request: Request, { params }: RouteContext) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Please sign in to update this voice session." }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "The voice-session update was not valid." }, { status: 400 }); }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "The voice-session update was not valid." }, { status: 400 });
  try {
    const identity = await getSignedInProfile();
    if (!identity || identity.clerkUserId !== userId) return NextResponse.json({ error: "Your session could not be verified." }, { status: 401 });
    const synced = await syncSignedInUser(identity);
    if (synced.status !== "synced") return NextResponse.json({ error: "Voice session storage is not configured." }, { status: 503 });
    const existing = await prisma.voiceSession.findFirst({ where: { id: params.id, userId: synced.user.id }, select: { id: true, status: true, startedAt: true } });
    if (!existing) return NextResponse.json({ error: "Voice session not found." }, { status: 404 });
    if (["COMPLETED", "CANCELLED", "FAILED"].includes(existing.status)) return NextResponse.json({ error: "This voice session is already closed." }, { status: 409 });
    const updated = await prisma.voiceSession.update({
      where: { id: existing.id },
      data: {
        status: parsed.data.status,
        ...(parsed.data.transcriptText !== undefined ? { transcriptText: parsed.data.transcriptText } : {}),
        ...(parsed.data.status === "RECORDING" && !existing.startedAt ? { startedAt: new Date() } : {}),
        ...(["COMPLETED", "CANCELLED", "FAILED"].includes(parsed.data.status) ? { endedAt: new Date() } : {}),
      },
      select: { id: true, status: true, updatedAt: true },
    });
    return NextResponse.json({ session: { ...updated, updatedAt: updated.updatedAt.toISOString() } });
  } catch { return NextResponse.json({ error: "SENSAI could not update the voice session." }, { status: 503 }); }
}
