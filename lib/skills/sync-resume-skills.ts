import "server-only";
import type { Prisma } from "@prisma/client";
import type { ResumeAnalysisResult } from "@/lib/ai/schemas/resume-analysis";
import { getSkillCategory, normalizeSkillName } from "@/lib/skills/normalize";

export async function syncResumeSkills(
  tx: Prisma.TransactionClient,
  userId: string,
  analysis: ResumeAnalysisResult,
) {
  const skills = new Map<string, { name: string; normalizedKey: string; category: ReturnType<typeof getSkillCategory> }>();
  for (const item of analysis.skills) {
    const normalized = normalizeSkillName(item.name);
    const category = getSkillCategory(normalized.name, item.category === "soft");
    const existing = skills.get(normalized.normalizedKey);
    if (!existing || (existing.category === "OTHER" && category !== "OTHER")) {
      skills.set(normalized.normalizedKey, { ...normalized, category });
    }
  }

  const entries = [...skills.values()];
  if (entries.length > 0) {
    await tx.skill.createMany({ data: entries, skipDuplicates: true });
  }
  const normalizedKeys = entries.map(({ normalizedKey }) => normalizedKey);
  const rows = normalizedKeys.length > 0
    ? await tx.skill.findMany({ where: { normalizedKey: { in: normalizedKeys } }, select: { id: true } })
    : [];
  const skillIds = rows.map(({ id }) => id);

  await tx.userSkill.deleteMany({
    where: { userId, source: "AI_ANALYSIS", ...(skillIds.length > 0 ? { skillId: { notIn: skillIds } } : {}) },
  });
  if (skillIds.length > 0) {
    await tx.userSkill.createMany({
      data: skillIds.map((skillId) => ({ userId, skillId, source: "AI_ANALYSIS" as const })),
      skipDuplicates: true,
    });
  }
}
