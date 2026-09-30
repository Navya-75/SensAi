import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getSignedInProfile } from "@/lib/auth/user";
import { syncSignedInUser } from "@/lib/auth/sync-user";
import { prisma } from "@/lib/db/prisma";

type RouteContext = { params: { id: string } };

export async function GET(_request: Request, { params }: RouteContext) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Please sign in to access this interview." }, { status: 401 });
  try {
    const identity = await getSignedInProfile();
    if (!identity || identity.clerkUserId !== userId) return NextResponse.json({ error: "Your session could not be verified." }, { status: 401 });
    const synced = await syncSignedInUser(identity);
    if (synced.status !== "synced") return NextResponse.json({ error: "Interview storage is not configured." }, { status: 503 });
    const interview = await prisma.interview.findFirst({
      where: { id: params.id, userId: synced.user.id },
      include: {
        questions: { orderBy: { position: "asc" }, include: { answer: { select: { id: true, answerText: true, answeredAt: true } }, evaluations: { orderBy: { createdAt: "asc" }, select: { relevance: true, technicalCorrectness: true, clarity: true, structure: true, completeness: true, overallScore: true, summary: true, strengths: true, improvementAreas: true, preparationSuggestions: true, questionId: true } } } },
        evaluations: { where: { questionId: null }, orderBy: { createdAt: "desc" }, take: 1, select: { overallScore: true, summary: true, strengths: true, improvementAreas: true, preparationSuggestions: true } },
      },
    });
    if (!interview) return NextResponse.json({ error: "Interview not found." }, { status: 404 });
    return NextResponse.json({ interview }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
  } catch { return NextResponse.json({ error: "SENSAI could not load this interview." }, { status: 503 }); }
}
