import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getSignedInProfile } from "@/lib/auth/user";
import { syncSignedInUser } from "@/lib/auth/sync-user";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Please sign in to practice." }, { status: 401 });
  try {
    const identity = await getSignedInProfile();
    if (!identity || identity.clerkUserId !== userId) return NextResponse.json({ error: "Your session could not be verified." }, { status: 401 });
    const synced = await syncSignedInUser(identity);
    if (synced.status !== "synced") return NextResponse.json({ error: "Practice storage is not configured." }, { status: 503 });
    const searchParams = new URL(request.url).searchParams;
    const topic = searchParams.get("topic")?.slice(0, 60);
    const replay = searchParams.get("replay") === "1";
    const excludedIds = new Set((searchParams.get("exclude") ?? "")
      .split(",")
      .slice(0, 100)
      .map((id) => id.trim())
      .filter((id) => id.length > 0 && id.length <= 64));
    const [topics, attempts, questions] = await Promise.all([
      prisma.mcq.findMany({ where: { isDemo: true }, distinct: ["topic"], select: { topic: true }, orderBy: { topic: "asc" } }),
      prisma.mcqAttempt.findMany({ where: { userId: synced.user.id }, select: { mcqId: true, isCorrect: true } }),
      prisma.mcq.findMany({ where: { isDemo: true, ...(topic ? { topic } : {}) }, select: { id: true, topic: true, question: true, options: true, difficulty: true }, orderBy: [{ topic: "asc" }, { createdAt: "asc" }], take: 100 }),
    ]);
    const answered = new Set(attempts.map((attempt) => attempt.mcqId));
    const question = questions.find((candidate) => (replay || !answered.has(candidate.id)) && !excludedIds.has(candidate.id)) ?? null;
    return NextResponse.json({ topics: topics.map(({ topic: name }) => name), question, completed: questions.length > 0 && question === null, stats: { answered: attempts.length, correct: attempts.filter((attempt) => attempt.isCorrect).length } }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
  } catch {
    return NextResponse.json({ error: "SENSAI could not load practice questions." }, { status: 503 });
  }
}
