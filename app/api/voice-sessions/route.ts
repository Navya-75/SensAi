import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSignedInProfile } from "@/lib/auth/user";
import { syncSignedInUser } from "@/lib/auth/sync-user";
import { prisma } from "@/lib/db/prisma";

const createSchema = z.object({ interviewId: z.string().min(1).max(64) }).strict();

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Please sign in to start a voice session." }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "The voice session request was not valid." }, { status: 400 }); }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Start a mock interview before enabling voice." }, { status: 400 });
  try {
    const identity = await getSignedInProfile();
    if (!identity || identity.clerkUserId !== userId) return NextResponse.json({ error: "Your session could not be verified." }, { status: 401 });
    const synced = await syncSignedInUser(identity);
    if (synced.status !== "synced") return NextResponse.json({ error: "Voice session storage is not configured." }, { status: 503 });
    const interview = await prisma.interview.findFirst({ where: { id: parsed.data.interviewId, userId: synced.user.id, status: "IN_PROGRESS" }, select: { id: true } });
    if (!interview) return NextResponse.json({ error: "An active interview owned by your account is required." }, { status: 404 });
    const session = await prisma.voiceSession.create({ data: { userId: synced.user.id, interviewId: interview.id, provider: "web-speech-api", status: "CREATED" }, select: { id: true, status: true, provider: true } });
    return NextResponse.json({ session }, { status: 201, headers: { "Cache-Control": "private, no-store, max-age=0" } });
  } catch { return NextResponse.json({ error: "SENSAI could not create the voice session." }, { status: 503 }); }
}
