import Link from "next/link";
import { redirect } from "next/navigation";
import { InterviewDesk } from "@/components/interviews/interview-desk";
import { getSignedInProfile } from "@/lib/auth/user";
import { syncSignedInUser } from "@/lib/auth/sync-user";
import { prisma } from "@/lib/db/prisma";

export default async function MockInterviewPage() {
  const identity = await getSignedInProfile();
  if (!identity) redirect("/sign-in");
  let targetRole = "";
  let experienceLevel: "EXPLORING" | "STUDENT" | "ENTRY_LEVEL" | "EARLY_CAREER" | "MID_CAREER" | "SENIOR" = "EXPLORING";
  let activeInterview = null;
  let available = false;
  try {
    const sync = await syncSignedInUser(identity);
    if (sync.status === "synced") {
      const [profile, found] = await Promise.all([
        prisma.onboardingProfile.findUnique({ where: { userId: sync.user.id }, select: { targetRole: true, experienceLevel: true } }),
        prisma.interview.findFirst({ where: { userId: sync.user.id, status: "IN_PROGRESS" }, orderBy: { startedAt: "desc" }, include: { questions: { orderBy: { position: "asc" }, include: { answer: { select: { answerText: true } }, evaluations: { where: { questionId: { not: null } }, orderBy: { createdAt: "desc" }, take: 1, select: { relevance: true, technicalCorrectness: true, clarity: true, structure: true, completeness: true, overallScore: true, summary: true, strengths: true, improvementAreas: true, preparationSuggestions: true } } } } } }),
      ]);
      targetRole = profile?.targetRole ?? "";
      experienceLevel = profile?.experienceLevel ?? "EXPLORING";
      if (found) activeInterview = {
        id: found.id,
        targetRole: found.targetRole,
        type: found.type,
        difficulty: found.difficulty,
        status: found.status,
        questions: found.questions.map((question) => ({ ...question, evaluation: question.evaluations[0] ?? null })),
      };
      available = true;
    }
  } catch { available = false; }

  return <main className="min-h-screen bg-[#0b0e17] text-[#eef3f9]"><header className="border-b border-white/[0.07]"><div className="mx-auto flex h-[68px] w-[min(100%-40px,1040px)] items-center justify-between"><Link href="/dashboard" className="text-sm font-bold tracking-[0.2em]">SENSAI</Link><nav className="flex gap-4 text-xs text-[#a4afc0]"><Link href="/interview/history" className="hover:text-white">Interview history</Link><Link href="/interview/voice" className="hover:text-white">Voice interview</Link></nav></div></header><section className="mx-auto w-[min(100%-40px,1040px)] py-11 sm:py-14"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6de3d7]">Interview practice</p><h1 className="mt-3 text-3xl font-medium tracking-[-0.05em]">AI mock interview</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#98a4b7]">Answer one question at a time and get feedback on relevance, correctness, clarity, structure, and completeness.</p><div className="mt-7"><InterviewDesk available={available} aiAvailable={Boolean(process.env.GEMINI_API_KEY)} initialRole={targetRole} initialExperience={experienceLevel} initialInterview={activeInterview} /></div></section></main>;
}
