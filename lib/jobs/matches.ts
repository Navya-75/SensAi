import "server-only";
import { prisma } from "@/lib/db/prisma";
import { DatabaseJobProvider, type JobFilters } from "@/lib/jobs/provider";
import { calculateJobMatch } from "@/lib/jobs/matching";

const provider = new DatabaseJobProvider();

export async function getJobMatches(userId: string, filters: JobFilters = {}) {
  const [user, profile, userSkills, jobs] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
    prisma.onboardingProfile.findUnique({ where: { userId }, select: { targetRole: true, preferredLocation: true, experienceLevel: true, softSkills: true } }),
    prisma.userSkill.findMany({ where: { userId }, select: { skill: { select: { name: true } } } }),
    provider.list(filters),
  ]);
  if (!user) return [];

  const currentSkillNames = [...new Set([...userSkills.map(({ skill }) => skill.name), ...(profile?.softSkills ?? [])])];
  const matches = jobs.map((job) => ({
    job,
    ...calculateJobMatch({
      job,
      currentSkillNames,
      targetRole: profile?.targetRole ?? null,
      experienceLevel: profile?.experienceLevel ?? "EXPLORING",
      preferredLocation: profile?.preferredLocation ?? null,
    }),
  })).sort((a, b) => b.matchPercent - a.matchPercent);

  for (const match of matches) {
    await prisma.jobMatch.upsert({
      where: { userId_jobId: { userId, jobId: match.job.id } },
      create: { userId, jobId: match.job.id, matchPercent: match.matchPercent, matchingSkills: match.matchingSkills, missingSkills: match.missingSkills, matchReasons: match.matchReasons },
      update: { matchPercent: match.matchPercent, matchingSkills: match.matchingSkills, missingSkills: match.missingSkills, matchReasons: match.matchReasons, calculatedAt: new Date() },
    });
  }
  return matches;
}
