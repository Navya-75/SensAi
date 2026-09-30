import "server-only";
import type { SignedInProfile } from "@/lib/auth/user";
import { getSignedInProfile } from "@/lib/auth/user";
import { prisma } from "@/lib/db/prisma";

export type UserSyncResult =
  | { status: "synced"; user: { id: string; fullName: string | null } }
  | { status: "unauthenticated" | "database-unconfigured" | "database-unavailable" };

function displayName(profile: SignedInProfile) {
  return [profile.firstName, profile.lastName].filter(Boolean).join(" ") || null;
}

/** Keep the app's user row aligned with Clerk without copying password or private metadata. */
export async function syncSignedInUser(profile?: SignedInProfile | null): Promise<UserSyncResult> {
  const clerkProfile = profile === undefined ? await getSignedInProfile() : profile;
  if (!clerkProfile) return { status: "unauthenticated" };
  if (!process.env.DATABASE_URL) return { status: "database-unconfigured" };

  const fullName = displayName(clerkProfile);
  const user = await prisma.user.upsert({
    where: { clerkUserId: clerkProfile.clerkUserId },
    update: {
      email: clerkProfile.email,
      fullName,
      profileImageUrl: clerkProfile.imageUrl,
    },
    create: {
      clerkUserId: clerkProfile.clerkUserId,
      email: clerkProfile.email,
      fullName,
      profileImageUrl: clerkProfile.imageUrl,
    },
    select: { id: true, fullName: true },
  });

  return { status: "synced", user };
}
