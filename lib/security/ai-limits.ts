import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

/** Records one bounded AI action in the same serializable transaction as its hourly limit check. */
export async function consumeAiAllowance(userId: string, feature: string, maximumPerHour: number) {
  const cutoff = new Date(Date.now() - 60 * 60 * 1000);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(async (tx) => {
        const count = await tx.aiUsageEvent.count({ where: { userId, feature, createdAt: { gte: cutoff } } });
        if (count >= maximumPerHour) return false;
        await tx.aiUsageEvent.create({ data: { userId, feature } });
        return true;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034" && attempt < 2) continue;
      throw error;
    }
  }
  return false;
}
