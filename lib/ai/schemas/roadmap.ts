import { z } from "zod";

export const roadmapSchema = z.object({
  title: z.string().trim().min(4).max(140),
  description: z.string().trim().min(20).max(800),
  phases: z.array(z.object({
    title: z.string().trim().min(3).max(120),
    description: z.string().trim().min(20).max(700),
    skills: z.array(z.string().trim().min(1).max(100)).max(12),
    resources: z.array(z.string().trim().min(1).max(200)).max(3),
    tasks: z.array(z.object({
      title: z.string().trim().min(3).max(140),
      description: z.string().trim().min(12).max(500),
    }).strict()).length(3),
  }).strict()).length(5),
}).strict();

export type RoadmapDraft = z.infer<typeof roadmapSchema>;

const str = { type: "string" } as const;
const arr = (items: Record<string, unknown>) => ({ type: "array", items });
const obj = (properties: Record<string, unknown>) => ({ type: "object", properties, required: Object.keys(properties), additionalProperties: false, propertyOrdering: Object.keys(properties) });
const phase = obj({
  title: str,
  description: str,
  skills: arr(str),
  resources: arr(str),
  tasks: { type: "array", items: obj({ title: str, description: str }), minItems: "3", maxItems: "3" },
});

export const roadmapJsonSchema = obj({ title: str, description: str, phases: { type: "array", items: phase, minItems: "5", maxItems: "5" } });
