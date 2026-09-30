import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, Clock3 } from "lucide-react";
import { getSignedInProfile } from "@/lib/auth/user";
import { syncSignedInUser } from "@/lib/auth/sync-user";
import { prisma } from "@/lib/db/prisma";

function strings(value: unknown) { return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []; }

export default async function InterviewHistoryPage() {
  const identity = await getSignedInProfile();
  if (!identity) redirect("/sign-in");
  let sessions: { id: string; targetRole: string; type: string; status: string; createdAt: string; questionCount: number; answeredCount: number; score: number | null; improvements: string[] }[] = [];
  let available = false;
  try {
    const sync = await syncSignedInUser(identity);
    if (sync.status === "synced") {
      const records = await prisma.interview.findMany({
        where: { userId: sync.user.id }, orderBy: { createdAt: "desc" }, take: 30,
        include: { questions: { select: { answer: { select: { id: true } } } }, evaluations: { where: { questionId: null }, orderBy: { createdAt: "desc" }, take: 1, select: { overallScore: true, improvementAreas: true } } },
      });
      sessions = records.map((item) => ({ id: item.id, targetRole: item.targetRole, type: item.type, status: item.status, createdAt: item.createdAt.toISOString(), questionCount: item.questionCount, answeredCount: item.questions.filter((question) => question.answer).length, score: item.evaluations[0]?.overallScore ?? null, improvements: strings(item.evaluations[0]?.improvementAreas) }));
      available = true;
    }
  } catch { available = false; }

  return <main className="min-h-screen bg-[#0b0e17] text-[#eef3f9]"><header className="border-b border-white/[0.07]"><div className="mx-auto flex h-[68px] w-[min(100%-40px,1000px)] items-center justify-between"><Link href="/dashboard" className="text-sm font-bold tracking-[0.2em]">SENSAI</Link><Link href="/interview/mock" className="text-xs text-[#73e8dc]">Start an interview <ArrowUpRight size={12} className="inline" /></Link></div></header><section className="mx-auto w-[min(100%-40px,1000px)] py-11 sm:py-14"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6de3d7]">Interview practice</p><h1 className="mt-3 text-3xl font-medium tracking-[-0.05em]">Interview history</h1><p className="mt-2 text-sm text-[#98a4b7]">Review saved sessions, scores, and the areas to practice next.</p>{!available && <p className="mt-6 rounded-xl border border-amber-300/15 bg-amber-200/[0.045] p-4 text-xs text-[#d7c798]">Interview history is unavailable until PostgreSQL is connected.</p>}{available && sessions.length === 0 && <div className="mt-6 rounded-2xl border border-white/[0.08] bg-[#111621] px-5 py-12 text-center"><Clock3 size={20} className="mx-auto text-[#7ce7dc]" /><h2 className="mt-4 text-sm font-semibold">No sessions yet</h2><p className="mt-2 text-xs text-[#8794a9]">Your completed mock interviews will appear here.</p><Link href="/interview/mock" className="mt-4 inline-block text-[10px] text-[#73e8dc]">Start your first session →</Link></div>}{sessions.length > 0 && <div className="mt-6 space-y-3">{sessions.map((session) => <Link key={session.id} href={`/interview/history/${session.id}`} className="block rounded-2xl border border-white/[0.08] bg-[#111621] p-4 transition-colors hover:border-[#63e4d9]/20 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-sm font-semibold">{session.targetRole}</h2><p className="mt-1.5 text-[10px] text-[#8794a9]">{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(session.createdAt))} · {session.type} · {session.answeredCount}/{session.questionCount} questions answered</p></div><div className="flex items-center gap-3"><span className={`rounded-full px-2.5 py-1 text-[8px] ${session.status === "COMPLETED" ? "bg-[#4bdccd]/[0.08] text-[#9debe3]" : "bg-white/[0.05] text-[#9aa7ba]"}`}>{session.status.replaceAll("_", " ")}</span>{session.score !== null && <span className="text-xs font-semibold text-[#73e8dc]">{session.score.toFixed(1)}/5</span>}</div></div>{session.improvements.length > 0 && <p className="mt-3 text-[10px] leading-5 text-[#9ba8b9]">To practice: {session.improvements.slice(0, 2).join(" · ")}</p>}</Link>)}</div>}</section></main>;
}
