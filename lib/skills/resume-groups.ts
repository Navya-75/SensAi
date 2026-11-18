export const resumeSkillGroupOrder = ["frontend", "backend", "core", "programming"] as const;
export type ResumeSkillGroup = (typeof resumeSkillGroupOrder)[number];

export const resumeSkillGroupLabels: Record<ResumeSkillGroup, string> = {
  frontend: "Frontend",
  backend: "Backend",
  core: "Core skills",
  programming: "Programming languages",
};

const frontendSkills = new Set(["html", "css", "sass", "less", "react", "next.js", "angular", "vue", "svelte", "tailwind css", "bootstrap"]);
const backendSkills = new Set(["node.js", "express", "express.js", "nestjs", "django", "flask", "fastapi", "spring", ".net", "laravel", "rails", "rest apis", "graphql", "postgresql", "mysql", "mongodb", "redis", "sqlite"]);
const programmingLanguages = new Set(["javascript", "typescript", "python", "java", "c", "c++", "c#", "go", "rust", "ruby", "php", "swift", "kotlin", "scala", "r", "sql"]);

export function groupResumeSkills(skills: { name: string; category?: string }[]): Record<ResumeSkillGroup, string[]> {
  const groups: Record<ResumeSkillGroup, string[]> = {
    frontend: [],
    backend: [],
    core: [],
    programming: [],
  };
  const seen = new Set<string>();

  for (const skill of skills) {
    const name = skill.name.trim();
    if (!name) continue;
    const normalized = name.toLowerCase();
    if (seen.has(normalized)) continue;
    seen.add(normalized);

    const category = skill.category?.toUpperCase();
    const group: ResumeSkillGroup = category === "PROGRAMMING_LANGUAGE" || programmingLanguages.has(normalized)
      ? "programming"
      : category === "DATABASE" || category === "BACKEND" || backendSkills.has(normalized)
        ? "backend"
        : category === "FRONTEND" || frontendSkills.has(normalized)
          ? "frontend"
          : "core";
    groups[group].push(name);
  }

  return groups;
}
