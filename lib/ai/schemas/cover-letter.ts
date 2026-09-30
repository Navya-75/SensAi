import { z } from "zod";

export const coverLetterSchema = z.object({
  opening: z.string().trim().min(1).max(1000),
  body: z.string().trim().min(1).max(5000),
  closing: z.string().trim().min(1).max(1000),
}).strict();

export type CoverLetterDraft = z.infer<typeof coverLetterSchema>;
export const coverLetterJsonSchema = {
  type: "object",
  properties: { opening: { type: "string" }, body: { type: "string" }, closing: { type: "string" } },
  required: ["opening", "body", "closing"],
  additionalProperties: false,
  propertyOrdering: ["opening", "body", "closing"],
};

export const coverLetterRequestSchema = z.object({
  jobId: z.string().min(1).max(64).optional(),
  jobTitle: z.string().trim().min(2).max(160),
  company: z.string().trim().min(1).max(160),
  jobDescription: z.string().trim().min(10).max(12000),
}).strict();
