import { z } from "zod";

const evidenceSchema = z.string().trim().min(1).max(700);
const optionalText = z.string().trim().max(500);

export const resumeAnalysisSchema = z.object({
  summary: z.string().trim().max(1400),
  skills: z.array(z.object({
    name: z.string().trim().min(1).max(100),
    category: z.enum(["technical", "soft", "domain", "other"]),
    evidence: evidenceSchema,
  }).strict()).max(60),
  experience: z.array(z.object({
    title: optionalText,
    organization: optionalText,
    dates: optionalText,
    details: z.array(z.object({
      description: z.string().trim().min(1).max(500),
      evidence: evidenceSchema,
    }).strict()).max(12),
    evidence: evidenceSchema,
  }).strict()).max(20),
  education: z.array(z.object({
    institution: optionalText,
    qualification: optionalText,
    field: optionalText,
    dates: optionalText,
    evidence: evidenceSchema,
  }).strict()).max(20),
  projects: z.array(z.object({
    name: optionalText,
    description: z.string().trim().min(1).max(500),
    skills: z.array(z.string().trim().min(1).max(100)).max(20),
    evidence: evidenceSchema,
  }).strict()).max(20),
  certifications: z.array(z.object({
    name: z.string().trim().min(1).max(200),
    issuer: optionalText,
    date: optionalText,
    evidence: evidenceSchema,
  }).strict()).max(30),
  achievements: z.array(z.object({
    description: z.string().trim().min(1).max(400),
    evidence: evidenceSchema,
  }).strict()).max(30),
  strengths: z.array(z.object({
    label: z.string().trim().min(1).max(140),
    rationale: z.string().trim().min(1).max(400),
    evidence: evidenceSchema,
  }).strict()).max(12),
  weaknesses: z.array(z.object({
    observation: z.string().trim().min(1).max(250),
    reason: z.string().trim().min(1).max(400),
  }).strict()).max(12),
  roleSuggestions: z.array(z.object({
    title: z.string().trim().min(1).max(140),
    rationale: z.string().trim().min(1).max(500),
    supportingEvidence: z.array(evidenceSchema).max(5),
  }).strict()).max(8),
  atsSuggestions: z.array(z.object({
    suggestion: z.string().trim().min(1).max(500),
    reason: z.string().trim().min(1).max(500),
  }).strict()).max(12),
  missingInformation: z.array(z.string().trim().min(1).max(240)).max(15),
}).strict();

export type ResumeAnalysisResult = z.infer<typeof resumeAnalysisSchema>;

/** Keep the provider schema to Gemini's portable JSON Schema subset; Zod enforces field limits. */
const string = { type: "string" } as const;
const array = (items: Record<string, unknown>) => ({ type: "array", items });
const object = (properties: Record<string, unknown>) => ({
  type: "object",
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
  propertyOrdering: Object.keys(properties),
});

export const resumeAnalysisJsonSchema = object({
  summary: string,
  skills: array(object({ name: string, category: { type: "string", enum: ["technical", "soft", "domain", "other"] }, evidence: string })),
  experience: array(object({
    title: string,
    organization: string,
    dates: string,
    details: array(object({ description: string, evidence: string })),
    evidence: string,
  })),
  education: array(object({ institution: string, qualification: string, field: string, dates: string, evidence: string })),
  projects: array(object({ name: string, description: string, skills: array(string), evidence: string })),
  certifications: array(object({ name: string, issuer: string, date: string, evidence: string })),
  achievements: array(object({ description: string, evidence: string })),
  strengths: array(object({ label: string, rationale: string, evidence: string })),
  weaknesses: array(object({ observation: string, reason: string })),
  roleSuggestions: array(object({ title: string, rationale: string, supportingEvidence: array(string) })),
  atsSuggestions: array(object({ suggestion: string, reason: string })),
  missingInformation: array(string),
});
