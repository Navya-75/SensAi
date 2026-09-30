import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getSignedInProfile } from "@/lib/auth/user";
import { syncSignedInUser } from "@/lib/auth/sync-user";
import { prisma } from "@/lib/db/prisma";
import { settingsSchema } from "@/lib/validation/settings";

export async function PATCH(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Please sign in to update settings." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "The settings were not valid." }, { status: 400 });
  }

  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Review your settings and try again." }, { status: 400 });

  const profile = await getSignedInProfile();
  if (!profile || profile.clerkUserId !== userId) {
    return NextResponse.json({ error: "Your session could not be verified. Please sign in again." }, { status: 401 });
  }

  try {
    const synced = await syncSignedInUser(profile);
    if (synced.status !== "synced") {
      return NextResponse.json({ error: "Settings storage is not configured yet." }, { status: 503 });
    }

    const preferences = await prisma.userPreference.upsert({
      where: { userId: synced.user.id },
      create: { userId: synced.user.id, ...parsed.data },
      update: parsed.data,
      select: {
        allowAiProcessing: true,
        emailNotifications: true,
        weeklyProgressSummary: true,
      },
    });
    return NextResponse.json({ preferences });
  } catch {
    return NextResponse.json({ error: "SENSAI could not save your settings. Please try again." }, { status: 503 });
  }
}
