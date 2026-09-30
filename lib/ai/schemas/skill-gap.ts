import { z } from "zod";

export const skillGapSchema = z.object({
  roleContext: z.string().trim().min(1).max(260),
  requiredSkills: z.array(z.object({
    name: z.string().trim().min(1).max(100),
    category: z.enum(["programming", "framework", "database", "cloud", "tool", "technical", "soft", "other"]),
    priority: z.enum(["high", "medium", "low"]),
    rationale: z.string().trim().min(1).max(220),
    learningTopics: z.array(z.string().trim().min(1).max(120)).max(3),
  }).strict()).max(12),
}).strict();

export type SkillGapResult = z.infer<typeof skillGapSchema> & {
  currentSkills: { name: string; category: string }[];
  matchedSkills: string[];
  missingSkills: SkillGapResult["requiredSkills"];
};

const str = { type: "string" } as const;
const arr = (items: Record<string, unknown>, maxItems?: number) => ({ type: "array", items, ...(maxItems ? { maxItems: String(maxItems) } : {}) });
const obj = (properties: Record<string, unknown>) => ({
  type: "object", properties, required: Object.keys(properties), additionalProperties: false, propertyOrdering: Object.keys(properties),
});

export const skillGapJsonSchema = obj({
  roleContext: str,
  requiredSkills: arr(obj({
    name: str,
    category: { type: "string", enum: ["programming", "framework", "database", "cloud", "tool", "technical", "soft", "other"] },
    priority: { type: "string", enum: ["high", "medium", "low"] },
    rationale: str,
    learningTopics: arr(str, 3),
  }), 12),
});
