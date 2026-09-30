import { z } from "zod";

export const interviewQuestionsSchema = z.object({
  questions: z.array(z.object({ prompt: z.string().trim().min(20).max(1200), category: z.string().trim().min(2).max(60) }).strict()).min(3).max(10),
}).strict();

export const interviewEvaluationSchema = z.object({
  relevance: z.number().int().min(1).max(5),
  technicalCorrectness: z.number().int().min(1).max(5),
  clarity: z.number().int().min(1).max(5),
  structure: z.number().int().min(1).max(5),
  completeness: z.number().int().min(1).max(5),
  summary: z.string().trim().min(1).max(1200),
  strengths: z.array(z.string().trim().min(1).max(300)).max(8),
  improvementAreas: z.array(z.string().trim().min(1).max(300)).max(8),
  preparationSuggestions: z.array(z.string().trim().min(1).max(300)).max(8),
}).strict();

export const interviewFinalReportSchema = z.object({
  summary: z.string().trim().min(1).max(1800),
  strengths: z.array(z.string().trim().min(1).max(300)).max(10),
  weaknesses: z.array(z.string().trim().min(1).max(300)).max(10),
  preparationSuggestions: z.array(z.string().trim().min(1).max(300)).max(10),
}).strict();

const str = { type: "string" } as const;
const arr = (items: Record<string, unknown>) => ({ type: "array", items });
const obj = (properties: Record<string, unknown>) => ({ type: "object", properties, required: Object.keys(properties), additionalProperties: false, propertyOrdering: Object.keys(properties) });

export const interviewQuestionsJsonSchema = obj({ questions: arr(obj({ prompt: str, category: str })) });
export const interviewEvaluationJsonSchema = obj({
  relevance: { type: "integer", minimum: 1, maximum: 5 },
  technicalCorrectness: { type: "integer", minimum: 1, maximum: 5 },
  clarity: { type: "integer", minimum: 1, maximum: 5 },
  structure: { type: "integer", minimum: 1, maximum: 5 },
  completeness: { type: "integer", minimum: 1, maximum: 5 },
  summary: str,
  strengths: arr(str),
  improvementAreas: arr(str),
  preparationSuggestions: arr(str),
});
export const interviewFinalReportJsonSchema = obj({ summary: str, strengths: arr(str), weaknesses: arr(str), preparationSuggestions: arr(str) });
