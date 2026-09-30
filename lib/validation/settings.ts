import { z } from "zod";

export const settingsSchema = z.object({
  allowAiProcessing: z.boolean(),
  emailNotifications: z.boolean(),
  weeklyProgressSummary: z.boolean(),
});

export const deletionRequestSchema = z.object({
  confirmation: z.literal("DELETE"),
});

export type UserSettings = z.infer<typeof settingsSchema>;

export const defaultUserSettings: UserSettings = {
  allowAiProcessing: true,
  emailNotifications: false,
  weeklyProgressSummary: false,
};
