import { normalizeSkillName } from "@/lib/skills/normalize";

type JobForMatch = {
  title: string;
  location: string | null;
  experienceLevel: string;
  skills: { name: string; isRequired: boolean }[];
};

const roleStopWords = new Set(["and", "or", "the", "for", "to", "a", "an", "developer", "engineer", "specialist"]);

function roleFit(targetRole: string | null, title: string) {
  if (!targetRole?.trim()) return 0.5;
  const targetTerms = targetRole.toLowerCase().split(/[^a-z0-9+#.]+/).filter((term) => term.length > 1 && !roleStopWords.has(term));
  if (targetTerms.length === 0) return 0.5;
  const jobTerms = new Set(title.toLowerCase().split(/[^a-z0-9+#.]+/));
  const overlap = targetTerms.filter((term) => jobTerms.has(term)).length / targetTerms.length;
  return Math.min(1, overlap + (title.toLowerCase().includes(targetRole.toLowerCase()) ? 0.35 : 0));
}

function experienceFit(userLevel: string, jobLevel: string) {
  if (jobLevel === "ANY") return 1;
  const ranks: Record<string, number> = { EXPLORING: 0, STUDENT: 0, INTERNSHIP: 0, ENTRY_LEVEL: 1, EARLY_CAREER: 1, ASSOCIATE: 2, MID_CAREER: 2, MID_LEVEL: 2, SENIOR: 3, LEAD: 4 };
  const difference = Math.abs((ranks[userLevel] ?? 1) - (ranks[jobLevel] ?? 1));
  return difference === 0 ? 1 : difference === 1 ? 0.65 : 0.3;
}

function locationFit(preference: string | null, jobLocation: string | null) {
  if (!preference?.trim()) return 0.5;
  if (!jobLocation) return 0.35;
  const location = jobLocation.toLowerCase();
  if (location.includes("remote") || location.includes(preference.toLowerCase())) return 1;
  return 0;
}

export function calculateJobMatch({
  job,
  currentSkillNames,
  targetRole,
  experienceLevel,
  preferredLocation,
}: {
  job: JobForMatch;
  currentSkillNames: string[];
  targetRole: string | null;
  experienceLevel: string;
  preferredLocation: string | null;
}) {
  const userKeys = new Set(currentSkillNames.map((name) => normalizeSkillName(name).normalizedKey));
  const required = job.skills.filter((skill) => skill.isRequired);
  const preferred = job.skills.filter((skill) => !skill.isRequired);
  const matchingSkills = job.skills.filter((skill) => userKeys.has(normalizeSkillName(skill.name).normalizedKey)).map((skill) => skill.name);
  const missingSkills = required.filter((skill) => !userKeys.has(normalizeSkillName(skill.name).normalizedKey)).map((skill) => skill.name);
  const requiredCoverage = required.length ? matchingSkills.filter((name) => required.some((skill) => skill.name === name)).length / required.length : 0.5;
  const preferredCoverage = preferred.length ? matchingSkills.filter((name) => preferred.some((skill) => skill.name === name)).length / preferred.length : 0.5;
  const roleScore = roleFit(targetRole, job.title);
  const experienceScore = experienceFit(experienceLevel, job.experienceLevel);
  const locationScore = locationFit(preferredLocation, job.location);
  const skillScore = requiredCoverage * 0.8 + preferredCoverage * 0.2;
  const matchPercent = Math.round((skillScore * 0.75 + roleScore * 0.1 + experienceScore * 0.1 + locationScore * 0.05) * 100);
  const matchReasons = [
    `${Math.round(requiredCoverage * 100)}% of listed required skills match your saved skills.`,
    targetRole ? (roleScore >= 0.5 ? `The role title overlaps with your target role, ${targetRole}.` : `The role differs from your current target, ${targetRole}.`) : "Add a target role to your profile for a more focused role comparison.",
    experienceScore >= 0.65 ? "The experience level is reasonably aligned with your profile." : "The listed experience level may differ from your current profile level.",
  ];
  return { matchPercent, matchingSkills, missingSkills, matchReasons };
}
