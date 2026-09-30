import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getSignedInProfile } from "@/lib/auth/user";
import { syncSignedInUser } from "@/lib/auth/sync-user";
import { GeminiConfigurationError, GeminiResponseError } from "@/lib/ai/gemini";
import { analyzeOwnedResume, ResumeAnalysisError } from "@/lib/ai/resume-analysis";
import { resumeAnalysisSchema } from "@/lib/ai/schemas/resume-analysis";
import { prisma } from "@/lib/db/prisma";

type RouteContext = { params: { id: string } };

export const runtime = "nodejs";
export const maxDuration = 60;

async function getAppUser(clerkUserId: string) {
  const profile = await getSignedInProfile();
  if (!profile || profile.clerkUserId !== clerkUserId) return null;
  const result = await syncSignedInUser(profile);
  return result.status === "synced" ? result.user : null;
}

export async function GET(request: Request, { params }: RouteContext) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return NextResponse.json({ error: "Please sign in to access this analysis." }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Resume analysis storage is not configured." }, { status: 503 });

  try {
    const user = await getAppUser(clerkUserId);
    if (!user) return NextResponse.json({ error: "Your account could not be verified." }, { status: 401 });
    const ownedResume = await prisma.resume.findFirst({
      where: { id: params.id, userId: user.id },
      select: { id: true },
    });
    if (!ownedResume) return NextResponse.json({ error: "Resume not found." }, { status: 404 });

    const requestedAnalysisId = new URL(request.url).searchParams.get("analysisId");
    const analysis = await prisma.resumeAnalysis.findFirst({
      where: { resumeId: ownedResume.id, userId: user.id, ...(requestedAnalysisId ? { id: requestedAnalysisId } : {}) },
      orderBy: { createdAt: "desc" },
      select: { id: true, model: true, result: true, createdAt: true },
    });
    if (!analysis) return NextResponse.json({ analysis: null });
    const parsed = resumeAnalysisSchema.safeParse(analysis.result);
    if (!parsed.success) return NextResponse.json({ error: "The saved analysis is invalid. Run it again to replace it." }, { status: 409 });

    return NextResponse.json({
      analysis: { id: analysis.id, model: analysis.model, result: parsed.data, createdAt: analysis.createdAt.toISOString() },
    }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
  } catch {
    return NextResponse.json({ error: "SENSAI could not load this analysis. Please try again." }, { status: 503 });
  }
}

export async function POST(_request: Request, { params }: RouteContext) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return NextResponse.json({ error: "Please sign in to analyze this resume." }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Resume analysis storage is not configured." }, { status: 503 });

  try {
    const user = await getAppUser(clerkUserId);
    if (!user) return NextResponse.json({ error: "Your account could not be verified." }, { status: 401 });
    const analysis = await analyzeOwnedResume(user.id, params.id);
    return NextResponse.json({ analysis }, { status: 201, headers: { "Cache-Control": "private, no-store, max-age=0" } });
  } catch (error) {
    if (error instanceof ResumeAnalysisError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof GeminiConfigurationError) return NextResponse.json({ error: "Gemini is not configured yet. Add GEMINI_API_KEY to the server environment." }, { status: 503 });
    if (error instanceof GeminiResponseError) return NextResponse.json({ error: "Gemini could not return a valid analysis. Please try again." }, { status: 502 });
    return NextResponse.json({ error: "SENSAI could not complete the analysis. Please try again." }, { status: 502 });
  }
}
