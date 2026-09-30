import "server-only";
import { prisma } from "@/lib/db/prisma";

export async function isAiProcessingAllowed(userId: string) {
  const preferences = await prisma.userPreference.findUnique({
    where: { userId },
    select: { allowAiProcessing: true },
  });

  return preferences?.allowAiProcessing ?? true;
}
