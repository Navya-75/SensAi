import "server-only";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import type { z } from "zod";
import { resumeAnalysisJsonSchema, resumeAnalysisSchema, type ResumeAnalysisResult } from "@/lib/ai/schemas/resume-analysis";
import { buildResumeAnalysisPrompt, resumeAnalysisSystemInstruction } from "@/lib/ai/prompts/resume-analysis";

export class GeminiConfigurationError extends Error {
  constructor() {
    super("Gemini is not configured.");
    this.name = "GeminiConfigurationError";
  }
}

export class GeminiResponseError extends Error {
  constructor() {
    super("Gemini returned an invalid analysis.");
    this.name = "GeminiResponseError";
  }
}

export function isGeminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

export function getGeminiModelName() {
  return process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash-lite";
}

export async function generateGeminiStructuredOutput<T>({
  input,
  systemInstruction,
  responseSchema,
  validator,
  maxOutputTokens = 8192,
}: {
  input: string;
  systemInstruction: string;
  responseSchema: Record<string, unknown>;
  validator: z.ZodType<T>;
  maxOutputTokens?: number;
}): Promise<{ model: string; result: T }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new GeminiConfigurationError();

  const model = getGeminiModelName();
  const client = new GoogleGenAI({ apiKey });
  const response = await client.models.generateContent({
    model,
    contents: input,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema,
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      maxOutputTokens,
      httpOptions: { timeout: 30_000 },
    },
  });

  if (!response.text) throw new GeminiResponseError();

  let decoded: unknown;
  try {
    decoded = JSON.parse(response.text);
  } catch {
    throw new GeminiResponseError();
  }

  const parsed = validator.safeParse(decoded);
  if (!parsed.success) throw new GeminiResponseError();
  return { model, result: parsed.data };
}

export async function analyzeResumeWithGemini(resumeText: string): Promise<{ model: string; result: ResumeAnalysisResult }> {
  return generateGeminiStructuredOutput({
    input: buildResumeAnalysisPrompt(resumeText),
    systemInstruction: resumeAnalysisSystemInstruction,
    responseSchema: resumeAnalysisJsonSchema,
    validator: resumeAnalysisSchema,
  });
}
