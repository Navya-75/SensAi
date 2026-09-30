import { z } from "zod";

export const resumeBuilderSuggestionSchema = z.object({
  summarySuggestion: z.string().trim().max(1500),
  notes: z.array(z.string().trim().min(1).max(260)).max(6),
}).strict();

export type ResumeBuilderSuggestion = z.infer<typeof resumeBuilderSuggestionSchema>;
export const resumeBuilderSuggestionJsonSchema = {
  type: "object",
  properties: {
    summarySuggestion: { type: "string" },
    notes: { type: "array", items: { type: "string" } },
  },
  required: ["summarySuggestion", "notes"],
  additionalProperties: false,
  propertyOrdering: ["summarySuggestion", "notes"],
};
