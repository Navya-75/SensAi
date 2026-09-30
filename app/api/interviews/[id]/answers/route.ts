import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSignedInProfile } from "@/lib/auth/user";
import { syncSignedInUser } from "@/lib/auth/sync-user";
import { GeminiConfigurationError, GeminiResponseError, generateGeminiStructuredOutput } from "@/lib/ai/gemini";
import { interviewEvaluationJsonSchema, interviewEvaluationSchema } from "@/lib/ai/schemas/interview";
import { interviewEvaluationInstruction } from "@/lib/ai/prompts/interview";
import { isAiProcessingAllowed } from "@/lib/privacy/ai-consent";
import { prisma } from "@/lib/db/prisma";
import { consumeAiAllowance } from "@/lib/security/ai-limits";

type RouteContext = { params: { id: string } };
const answerSchema = z.object({ questionId: z.string().min(1).max(64), answerText: z.string().trim().min(10).max(8000) }).strict();

function uniqueFeedbackItems(values: unknown[]): string[] {
  const seen = new Set<string>();
  return values.flatMap((value) => Array.isArray(value) ? value : [])
    .filter((value): value is string => typeof value === "string" && Boolean(value.trim()))
    .map((value) => value.trim())
    .filter((value) => {
      const normalized = value.toLowerCase();
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    })
    .slice(0, 5);
}

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request, { params }: RouteContext) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Please sign in to submit your answer." }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "The answer was not valid." }, { status: 400 }); }
  const parsed = answerSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Enter an answer of at least 10 characters." }, { status: 400 });
  try {
    const identity = await getSignedInProfile();
    if (!identity || identity.clerkUserId !== userId) return NextResponse.json({ error: "Your session could not be verified." }, { status: 401 });
    const synced = await syncSignedInUser(identity);
    if (synced.status !== "synced") return NextResponse.json({ error: "Interview storage is not configured." }, { status: 503 });
    if (!(await isAiProcessingAllowed(synced.user.id))) return NextResponse.json({ error: "AI processing is turned off in your privacy settings." }, { status: 403 });
    const interview = await prisma.interview.findFirst({
      where: { id: params.id, userId: synced.user.id },
      include: { questions: { orderBy: { position: "asc" }, include: { answer: { select: { id: true } } } } },
    });
    if (!interview) return NextResponse.json({ error: "Interview not found." }, { status: 404 });
    if (interview.status !== "IN_PROGRESS") return NextResponse.json({ error: "This interview is no longer accepting answers." }, { status: 409 });
    const nextQuestion = interview.questions.find((question) => !question.answer);
    if (!nextQuestion || nextQuestion.id !== parsed.data.questionId) return NextResponse.json({ error: "Answer the current question before continuing." }, { status: 409 });
    const isFinal = interview.questions.every((question) => question.id === nextQuestion.id || question.answer !== null);
    if (!(await consumeAiAllowance(synced.user.id, "INTERVIEW_EVALUATION", 15))) return NextResponse.json({ error: "You have reached the hourly interview evaluation limit. Try again later." }, { status: 429 });
    const evaluated = await generateGeminiStructuredOutput({
      input: JSON.stringify({ role: interview.targetRole, type: interview.type, difficulty: interview.difficulty, question: nextQuestion.prompt, answer: parsed.data.answerText }),
      systemInstruction: interviewEvaluationInstruction,
      responseSchema: interviewEvaluationJsonSchema,
      validator: interviewEvaluationSchema,
      maxOutputTokens: 900,
    });
    const score = (evaluated.result.relevance + evaluated.result.technicalCorrectness + evaluated.result.clarity + evaluated.result.structure + evaluated.result.completeness) / 5;
    let finalReport: { summary: string; strengths: string[]; weaknesses: string[]; preparationSuggestions: string[] } | null = null;
    let allScores = [score];
    if (isFinal) {
      const previousEvaluations = await prisma.interviewEvaluation.findMany({ where: { interviewId: interview.id, questionId: { not: null } }, orderBy: { createdAt: "asc" }, select: { relevance: true, technicalCorrectness: true, clarity: true, structure: true, completeness: true, summary: true, strengths: true, improvementAreas: true, preparationSuggestions: true } });
      allScores = [...previousEvaluations.map((item) => ((item.relevance ?? 0) + (item.technicalCorrectness ?? 0) + (item.clarity ?? 0) + (item.structure ?? 0) + (item.completeness ?? 0)) / 5), score];
      const cleanEvaluations = [...previousEvaluations, evaluated.result].map((item) => ({ summary: item.summary, strengths: item.strengths, improvementAreas: "improvementAreas" in item ? item.improvementAreas : [], preparationSuggestions: item.preparationSuggestions }));
      const averageScore = allScores.reduce((sum, value) => sum + value, 0) / allScores.length;
      finalReport = {
        summary: `You completed ${interview.questionCount} questions for ${interview.targetRole}. Your average score was ${averageScore.toFixed(1)} out of 5 across relevance, correctness, clarity, structure, and completeness.`,
        strengths: uniqueFeedbackItems(cleanEvaluations.map((item) => item.strengths)),
        weaknesses: uniqueFeedbackItems(cleanEvaluations.map((item) => item.improvementAreas)),
        preparationSuggestions: uniqueFeedbackItems(cleanEvaluations.map((item) => item.preparationSuggestions)),
      };
    }

    const response = await prisma.$transaction(async (tx) => {
      const answer = await tx.interviewAnswer.create({ data: { questionId: nextQuestion.id, answerText: parsed.data.answerText } });
      await tx.interviewEvaluation.create({
        data: {
          interviewId: interview.id,
          questionId: nextQuestion.id,
          answerId: answer.id,
          relevance: evaluated.result.relevance,
          technicalCorrectness: evaluated.result.technicalCorrectness,
          clarity: evaluated.result.clarity,
          structure: evaluated.result.structure,
          completeness: evaluated.result.completeness,
          overallScore: score,
          summary: evaluated.result.summary,
          strengths: evaluated.result.strengths,
          improvementAreas: evaluated.result.improvementAreas,
          preparationSuggestions: evaluated.result.preparationSuggestions,
        },
      });
      const next = interview.questions.find((question) => !question.answer && question.id !== nextQuestion.id) ?? null;
      if (isFinal && finalReport) {
        await tx.interviewEvaluation.create({ data: {
          interviewId: interview.id,
          overallScore: allScores.reduce((sum, value) => sum + value, 0) / allScores.length,
          summary: finalReport.summary,
          strengths: finalReport.strengths,
          improvementAreas: finalReport.weaknesses,
          preparationSuggestions: finalReport.preparationSuggestions,
        } });
        await tx.interview.update({ where: { id: interview.id }, data: { status: "COMPLETED", completedAt: new Date() } });
        await tx.progressTracking.create({ data: { userId: synced.user.id, category: "INTERVIEW", metricKey: "interview_score", value: allScores.reduce((sum, value) => sum + value, 0) / allScores.length, target: 5, sourceId: interview.id } });
        await tx.userActivity.create({ data: { userId: synced.user.id, type: "INTERVIEW_COMPLETED", summary: "Mock interview completed", referenceType: "interview", referenceId: interview.id } });
      }
      return { answerId: answer.id, next };
    });

    return NextResponse.json({ evaluation: evaluated.result, nextQuestion: response.next, finalReport, completed: isFinal }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
  } catch (error) {
    if (error instanceof GeminiConfigurationError) return NextResponse.json({ error: "Gemini is not configured. Add GEMINI_API_KEY to the server environment." }, { status: 503 });
    if (error instanceof GeminiResponseError) return NextResponse.json({ error: "Gemini could not evaluate this response. Your answer was not saved; try again." }, { status: 502 });
    return NextResponse.json({ error: "SENSAI could not save the answer. Please try again." }, { status: 503 });
  }
}
