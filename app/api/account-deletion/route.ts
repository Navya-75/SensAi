import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getSignedInProfile } from "@/lib/auth/user";
import { syncSignedInUser } from "@/lib/auth/sync-user";
import { prisma } from "@/lib/db/prisma";
import { deletionRequestSchema } from "@/lib/validation/settings";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Please sign in to request data deletion." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Confirm the request and try again." }, { status: 400 });
  }

  const parsed = deletionRequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Type DELETE to confirm this request." }, { status: 400 });

  const profile = await getSignedInProfile();
  if (!profile || profile.clerkUserId !== userId) {
    return NextResponse.json({ error: "Your session could not be verified. Please sign in again." }, { status: 401 });
  }

  try {
    const synced = await syncSignedInUser(profile);
    if (synced.status !== "synced") {
      return NextResponse.json({ error: "Data request storage is not configured yet." }, { status: 503 });
    }

    const existing = await prisma.dataDeletionRequest.findFirst({
      where: { clerkUserId: profile.clerkUserId, status: "REQUESTED" },
      select: { id: true },
    });
    if (existing) return NextResponse.json({ requested: true });

    await prisma.dataDeletionRequest.create({
      data: { userId: synced.user.id, clerkUserId: profile.clerkUserId },
      select: { id: true },
    });
    return NextResponse.json({ requested: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "SENSAI could not record the request. Please try again." }, { status: 503 });
  }
}
