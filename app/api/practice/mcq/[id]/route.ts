import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSignedInProfile } from "@/lib/auth/user";
import { syncSignedInUser } from "@/lib/auth/sync-user";
import { prisma } from "@/lib/db/prisma";

type RouteContext = { params: { id: string } };
const answerSchema = z.object({ selectedOptionIndex: z.number().int().min(0).max(7) }).strict();

export async function POST(request: Request, { params }: RouteContext) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Please sign in to submit an answer." }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Choose an answer to continue." }, { status: 400 }); }
  const parsed = answerSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Choose one of the listed answers." }, { status: 400 });
  try {
    const identity = await getSignedInProfile();
    if (!identity || identity.clerkUserId !== userId) return NextResponse.json({ error: "Your session could not be verified." }, { status: 401 });
    const synced = await syncSignedInUser(identity);
    if (synced.status !== "synced") return NextResponse.json({ error: "Practice storage is not configured." }, { status: 503 });
    const question = await prisma.mcq.findFirst({ where: { id: params.id, isDemo: true }, select: { id: true, options: true, correctOptionIndex: true, explanation: true } });
    if (!question || parsed.data.selectedOptionIndex >= question.options.length) return NextResponse.json({ error: "Practice question not found." }, { status: 404 });
    const isCorrect = parsed.data.selectedOptionIndex === question.correctOptionIndex;
    await prisma.$transaction([
      prisma.mcqAttempt.create({ data: { userId: synced.user.id, mcqId: question.id, selectedOptionIndex: parsed.data.selectedOptionIndex, isCorrect } }),
      prisma.userActivity.create({ data: { userId: synced.user.id, type: "PRACTICE_COMPLETED", summary: isCorrect ? "Answered a practice question correctly" : "Completed a practice question", referenceType: "MCQ", referenceId: question.id } }),
    ]);
    return NextResponse.json({ result: { isCorrect, correctOptionIndex: question.correctOptionIndex, explanation: question.explanation } }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
  } catch { return NextResponse.json({ error: "SENSAI could not save this answer." }, { status: 503 }); }
}
