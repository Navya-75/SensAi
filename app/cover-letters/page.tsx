import Link from "next/link";
import { redirect } from "next/navigation";
import { CoverLetterWorkspace } from "@/components/cover-letters/cover-letter-workspace";
import { getSignedInProfile } from "@/lib/auth/user";
import { syncSignedInUser } from "@/lib/auth/sync-user";
import { prisma } from "@/lib/db/prisma";

export default async function CoverLettersPage() {
  const identity = await getSignedInProfile();
  if (!identity) redirect("/sign-in");
  let available = false;
  let letters: { id: string; title: string; content: string; createdAt: string }[] = [];
  let jobs: { id: string; title: string; company: string; description: string }[] = [];
  try {
    const sync = await syncSignedInUser(identity);
    if (sync.status === "synced") {
      const [savedLetters, availableJobs] = await Promise.all([
        prisma.coverLetter.findMany({ where: { userId: sync.user.id }, orderBy: { updatedAt: "desc" }, take: 10, select: { id: true, title: true, content: true, createdAt: true } }),
        prisma.job.findMany({ where: { OR: [{ source: "CURATED" }, { source: "DEMO", isDemo: true }], AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }] }, orderBy: { createdAt: "desc" }, take: 30, select: { id: true, title: true, company: true, description: true } }),
      ]);
      letters = savedLetters.map((letter) => ({ ...letter, createdAt: letter.createdAt.toISOString() }));
      jobs = availableJobs;
      available = true;
    }
  } catch { available = false; }

  return <main className="min-h-screen bg-[#0b0e17] text-[#eef3f9]"><header className="border-b border-white/[0.07]"><div className="mx-auto flex h-[68px] w-[min(100%-40px,1060px)] items-center justify-between"><Link href="/dashboard" className="text-sm font-bold tracking-[0.2em]">SENSAI</Link><nav className="flex gap-4 text-xs text-[#a4afc0]"><Link href="/resume-builder" className="hover:text-white">Resume builder</Link><Link href="/jobs" className="hover:text-white">Jobs</Link></nav></div></header><section className="mx-auto w-[min(100%-40px,1060px)] py-11 sm:py-14"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6de3d7]">Application toolkit</p><h1 className="mt-3 text-3xl font-medium tracking-[-0.05em]">Cover letters</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#98a4b7]">Generate a role-specific draft from your verified profile evidence, then edit, save, copy, or download it.</p><div className="mt-7"><CoverLetterWorkspace available={available} aiAvailable={Boolean(process.env.GEMINI_API_KEY)} initialLetters={letters} jobs={jobs} /></div></section></main>;
}
