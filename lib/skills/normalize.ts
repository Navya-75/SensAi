const skillAliases: Record<string, string> = {
  js: "JavaScript",
  javascript: "JavaScript",
  ts: "TypeScript",
  typescript: "TypeScript",
  reactjs: "React",
  react: "React",
  nodejs: "Node.js",
  node: "Node.js",
  postgres: "PostgreSQL",
  postgresql: "PostgreSQL",
  nextjs: "Next.js",
  next: "Next.js",
  mongodb: "MongoDB",
  mongo: "MongoDB",
  amazonwebservices: "AWS",
  aws: "AWS",
  gcp: "Google Cloud",
  googlecloudplatform: "Google Cloud",
  dotnet: ".NET",
};

const programmingLanguages = new Set(["javascript", "typescript", "python", "java", "c", "c++", "c#", "go", "rust", "ruby", "php", "swift", "kotlin", "scala", "r", "sql"]);
const frameworks = new Set(["react", "next.js", "angular", "vue", "svelte", "express", "nestjs", "django", "flask", "fastapi", "spring", ".net", "laravel", "rails"]);
const databases = new Set(["postgresql", "mysql", "sqlite", "mongodb", "redis", "dynamodb", "firebase", "supabase", "oracle"]);
const cloudPlatforms = new Set(["aws", "amazon web services", "azure", "google cloud", "gcp", "heroku", "vercel"]);
const tools = new Set(["git", "docker", "kubernetes", "linux", "jira", "figma", "postman", "terraform", "jenkins"]);

export function normalizeSkillName(input: string) {
  const displayName = input.trim().replace(/\s+/g, " ");
  const aliasKey = displayName.toLowerCase().replace(/[^a-z0-9]/g, "");
  const canonicalName = skillAliases[aliasKey] ?? displayName;
  const normalizedKey = canonicalName.toLowerCase().replace(/\s+/g, " ");

  return { name: canonicalName, normalizedKey };
}

export function getSkillCategory(name: string, isSoftSkill = false): "PROGRAMMING_LANGUAGE" | "FRAMEWORK" | "DATABASE" | "CLOUD" | "TOOL" | "TECHNICAL" | "SOFT" | "OTHER" {
  if (isSoftSkill) return "SOFT";
  const key = name.trim().toLowerCase();
  if (programmingLanguages.has(key)) return "PROGRAMMING_LANGUAGE";
  if (frameworks.has(key)) return "FRAMEWORK";
  if (databases.has(key)) return "DATABASE";
  if (cloudPlatforms.has(key)) return "CLOUD";
  if (tools.has(key)) return "TOOL";
  return key ? "TECHNICAL" : "OTHER";
}
