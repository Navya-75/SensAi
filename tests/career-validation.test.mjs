import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import ts from "typescript";
import { normalizeSkillName, getSkillCategory } from "../lib/skills/normalize.ts";
import { skillGapSchema } from "../lib/ai/schemas/skill-gap.ts";
import { emptyResumeSections, resumeSectionsSchema } from "../lib/validation/resume-builder.ts";

const normalizeSource = await readFile(new URL("../lib/skills/normalize.ts", import.meta.url), "utf8");
const normalizeJavascript = ts.transpileModule(normalizeSource, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const normalizeModuleUrl = `data:text/javascript;base64,${Buffer.from(normalizeJavascript).toString("base64")}`;
const matchingSource = await readFile(new URL("../lib/jobs/matching.ts", import.meta.url), "utf8");
const matchingWithResolvedImport = matchingSource.replace('"@/lib/skills/normalize"', JSON.stringify(normalizeModuleUrl));
const matchingJavascript = ts.transpileModule(matchingWithResolvedImport, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { calculateJobMatch } = await import(`data:text/javascript;base64,${Buffer.from(matchingJavascript).toString("base64")}`);

test("skill names normalize common aliases to stable display names and keys", () => {
  assert.deepEqual(normalizeSkillName("  JS  "), { name: "JavaScript", normalizedKey: "javascript" });
  assert.deepEqual(normalizeSkillName("nextjs"), { name: "Next.js", normalizedKey: "next.js" });
  assert.deepEqual(normalizeSkillName("  PostgreSQL  "), { name: "PostgreSQL", normalizedKey: "postgresql" });
});

test("skill categories distinguish technical and explicitly marked soft skills", () => {
  assert.equal(getSkillCategory("React"), "FRAMEWORK");
  assert.equal(getSkillCategory("PostgreSQL"), "DATABASE");
  assert.equal(getSkillCategory("Communication", true), "SOFT");
  assert.equal(getSkillCategory(""), "OTHER");
});

test("job match explains normalized skill matches and missing requirements", () => {
  const result = calculateJobMatch({
    job: { title: "Frontend Developer", location: "Remote", experienceLevel: "ENTRY_LEVEL", skills: [{ name: "JavaScript", isRequired: true }, { name: "React", isRequired: true }, { name: "Node.js", isRequired: true }] },
    currentSkillNames: ["js", "react"],
    targetRole: "Frontend Developer",
    experienceLevel: "ENTRY_LEVEL",
    preferredLocation: "Pune",
  });
  assert.deepEqual(result.matchingSkills, ["JavaScript", "React"]);
  assert.deepEqual(result.missingSkills, ["Node.js"]);
  assert.equal(result.matchPercent, 73);
});

test("skill-gap output rejects malformed fields and accepts a bounded role plan", () => {
  const valid = { roleContext: "Example role expectations", requiredSkills: [{ name: "SQL", category: "database", priority: "high", rationale: "Used to query structured data.", learningTopics: ["Joins"] }] };
  assert.equal(skillGapSchema.safeParse(valid).success, true);
  assert.equal(skillGapSchema.safeParse({ ...valid, extra: true }).success, false);
  assert.equal(skillGapSchema.safeParse({ ...valid, requiredSkills: [{ ...valid.requiredSkills[0], priority: "urgent" }] }).success, false);
});

test("resume sections accept the empty draft and reject unbounded or unexpected fields", () => {
  assert.equal(resumeSectionsSchema.safeParse(emptyResumeSections).success, true);
  assert.equal(resumeSectionsSchema.safeParse({ ...emptyResumeSections, privateNotes: "unexpected" }).success, false);
  assert.equal(resumeSectionsSchema.safeParse({ ...emptyResumeSections, skills: Array.from({ length: 61 }, () => "React") }).success, false);
});
