import { z } from "zod";

const experienceLevels = [
  "EXPLORING",
  "STUDENT",
  "ENTRY_LEVEL",
  "EARLY_CAREER",
  "MID_CAREER",
  "SENIOR",
] as const;

const textList = z.array(z.string().trim().min(1).max(120)).max(20);

export const onboardingValuesSchema = z.object({
  fullName: z.string().trim().max(120),
  phone: z.string().trim().max(32).regex(/^[+()\d\s.-]*$/, "Enter a valid phone number."),
  education: z.string().trim().max(120),
  degree: z.string().trim().max(120),
  branch: z.string().trim().max(120),
  graduationYear: z.number().int().min(1950).max(new Date().getFullYear() + 10).nullable(),
  experienceLevel: z.enum(experienceLevels),
  skills: textList,
  softSkills: textList,
  targetRole: z.string().trim().max(120),
  targetIndustry: z.string().trim().max(120),
  preferredLocation: z.string().trim().max(120),
  careerGoal: z.string().trim().max(2000),
  learningGoals: textList,
});

export const onboardingSaveSchema = z.object({
  step: z.number().int().min(1).max(6),
  values: onboardingValuesSchema,
});

export const onboardingCompleteSchema = onboardingSaveSchema.extend({
  step: z.literal(6),
  values: onboardingValuesSchema.extend({
    fullName: z.string().trim().min(1, "Add your name to continue.").max(120),
    targetRole: z.string().trim().min(1, "Choose a target role to continue.").max(120),
    careerGoal: z.string().trim().min(1, "Add a career goal to continue.").max(2000),
  }),
});

export type OnboardingValues = z.infer<typeof onboardingValuesSchema>;

export const emptyOnboardingValues: OnboardingValues = {
  fullName: "",
  phone: "",
  education: "",
  degree: "",
  branch: "",
  graduationYear: null,
  experienceLevel: "EXPLORING",
  skills: [],
  softSkills: [],
  targetRole: "",
  targetIndustry: "",
  preferredLocation: "",
  careerGoal: "",
  learningGoals: [],
};
