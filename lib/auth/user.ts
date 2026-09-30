import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";

export type SignedInProfile = {
  clerkUserId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  imageUrl: string;
};

/** Return the active Clerk identity in a small, frontend-safe shape. */
export async function getSignedInProfile(): Promise<SignedInProfile | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  if (!user || user.id !== userId) return null;

  return {
    clerkUserId: user.id,
    email: user.primaryEmailAddress?.emailAddress ?? null,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    imageUrl: user.imageUrl,
  };
}
