import { z } from "zod";

const entrySchema = z.object({
  id: z.string().min(1).max(80),
  title: z.string().trim().max(160),
  subtitle: z.string().trim().max(200),
  details: z.string().trim().max(3000),
}).strict();

export const resumeSectionsSchema = z.object({
  contact: z.object({
    fullName: z.string().trim().max(120),
    email: z.string().trim().max(254),
    phone: z.string().trim().max(32),
    location: z.string().trim().max(120),
    website: z.string().trim().max(300),
    linkedin: z.string().trim().max(300),
  }).strict(),
  summary: z.string().trim().max(1500),
  education: z.array(entrySchema).max(20),
  skills: z.array(z.string().trim().min(1).max(100)).max(60),
  experience: z.array(entrySchema).max(30),
  projects: z.array(entrySchema).max(30),
  certifications: z.array(entrySchema).max(30),
  achievements: z.array(entrySchema).max(30),
}).strict();

export const resumeBuilderSaveSchema = z.object({
  title: z.string().trim().min(1).max(120),
  templateKey: z.enum(["ats", "modern"]),
  sections: resumeSectionsSchema,
}).strict();

export type ResumeSections = z.infer<typeof resumeSectionsSchema>;
export type ResumeBuilderData = z.infer<typeof resumeBuilderSaveSchema>;

export const emptyResumeSections: ResumeSections = {
  contact: { fullName: "", email: "", phone: "", location: "", website: "", linkedin: "" },
  summary: "",
  education: [],
  skills: [],
  experience: [],
  projects: [],
  certifications: [],
  achievements: [],
};
