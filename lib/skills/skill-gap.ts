import "server-only";
import { prisma } from "@/lib/db/prisma";
import { isAiProcessingAllowed } from "@/lib/privacy/ai-consent";
import { generateGeminiStructuredOutput } from "@/lib/ai/gemini";
import { buildSkillGapPrompt, skillGapSystemInstruction } from "@/lib/ai/prompts/skill-gap";
import { skillGapJsonSchema, skillGapSchema, type SkillGapResult } from "@/lib/ai/schemas/skill-gap";
import { resumeAnalysisSchema } from "@/lib/ai/schemas/resume-analysis";
import { normalizeSkillName } from "@/lib/skills/normalize";

export class SkillGapError extends Error {
  constructor(message: string, public readonly status: number) { super(message); this.name = "SkillGapError"; }
}

export async function generateSkillGap(userId: string, targetRole: string): Promise<SkillGapResult> {
  if (!(await isAiProcessingAllowed(userId))) throw new SkillGapError("AI processing is turned off in your privacy settings.", 403);
  const [profile, skills, latestAnalysis] = await Promise.all([
    prisma.onboardingProfile.findUnique({ where: { userId }, select: { experienceLevel: true, targetIndustry: true, careerGoal: true, softSkills: true } }),
    prisma.userSkill.findMany({ where: { userId }, select: { skill: { select: { name: true, category: true } } } }),
    prisma.resumeAnalysis.findFirst({ where: { userId }, orderBy: { createdAt: "desc" }, select: { result: true } }),
  ]);
  const analysis = latestAnalysis ? resumeAnalysisSchema.safeParse(latestAnalysis.result) : null;
  const currentSkills = new Map<string, { name: string; category: string }>();
  for (const userSkill of skills) {
    const normalized = normalizeSkillName(userSkill.skill.name);
    if (!currentSkills.has(normalized.normalizedKey)) currentSkills.set(normalized.normalizedKey, { name: normalized.name, category: userSkill.skill.category });
  }
  if (profile?.softSkills) {
    for (const raw of profile.softSkills) {
      const normalized = normalizeSkillName(raw);
      currentSkills.set(normalized.normalizedKey, { name: normalized.name, category: "SOFT" });
    }
  }

  const generated = await generateGeminiStructuredOutput({
    input: buildSkillGapPrompt({
      targetRole,
      experienceLevel: profile?.experienceLevel ?? "EXPLORING",
      targetIndustry: profile?.targetIndustry ?? null,
      careerGoal: profile?.careerGoal ?? null,
      resumeSummary: analysis?.success ? analysis.data.summary || null : null,
      currentSkills: [...currentSkills.values()].map((skill) => skill.name),
    }),
    systemInstruction: skillGapSystemInstruction,
    responseSchema: skillGapJsonSchema,
    validator: skillGapSchema,
    maxOutputTokens: 2048,
  });

  const currentByKey = currentSkills;
  const normalizedRequired = generated.result.requiredSkills.map((skill) => {
    const normalized = normalizeSkillName(skill.name);
    return { ...skill, name: normalized.name, normalizedKey: normalized.normalizedKey };
  });
  const uniqueRequired = [...new Map(normalizedRequired.map((skill) => [skill.normalizedKey, skill])).values()];
  const matchedSkills = uniqueRequired.flatMap((skill) => currentByKey.has(skill.normalizedKey) ? [skill.name] : []);
  const toPublicSkill = (skill: (typeof uniqueRequired)[number]) => ({
    name: skill.name,
    category: skill.category,
    priority: skill.priority,
    rationale: skill.rationale,
    learningTopics: skill.learningTopics,
  });
  const missingSkills = uniqueRequired.filter((skill) => !currentByKey.has(skill.normalizedKey)).map(toPublicSkill);
  return {
    ...generated.result,
    requiredSkills: uniqueRequired.map(toPublicSkill),
    currentSkills: [...currentSkills.values()],
    matchedSkills,
    missingSkills,
  };
}
