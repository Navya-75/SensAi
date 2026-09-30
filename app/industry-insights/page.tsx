import Link from "next/link";
import { redirect } from "next/navigation";
import { getSignedInProfile } from "@/lib/auth/user";
import { syncSignedInUser } from "@/lib/auth/sync-user";
import { prisma } from "@/lib/db/prisma";

export default async function IndustryInsightsPage() {
  const identity = await getSignedInProfile();
  if (!identity) redirect("/sign-in");
  let items: { id: string; title: string; summary: string; industry: string; skills: string[]; sourceName: string; sourceUrl: string; publishedAt: Date | null }[] = [];
  try {
    const synced = await syncSignedInUser(identity);
    if (synced.status === "synced") items = await prisma.industryInsight.findMany({ orderBy: [{ publishedAt: "desc" }, { title: "asc" }], take: 50, select: { id: true, title: true, summary: true, industry: true, skills: true, sourceName: true, sourceUrl: true, publishedAt: true } });
  } catch { items = []; }
  return <main className="min-h-screen bg-[#0b0e17] text-[#eef3f9]"><header className="border-b border-white/[0.07]"><div className="mx-auto flex h-[68px] w-[min(100%-40px,1000px)] items-center justify-between"><Link href="/dashboard" className="text-sm font-bold tracking-[0.2em]">SENSAI</Link><nav className="flex gap-4 text-xs text-[#a4afc0]"><Link href="/practice/mcq" className="hover:text-white">MCQ practice</Link><Link href="/career/skills" className="hover:text-white">Skills</Link></nav></div></header><section className="mx-auto w-[min(100%-40px,1000px)] py-10 sm:py-14"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6de3d7]">Learning library</p><h1 className="mt-3 text-3xl font-medium tracking-[-0.05em]">Industry and skill references</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#98a4b7]">A small collection of primary documentation and learning guides. These links are reference material, not dated industry news or salary claims.</p><div className="mt-7 grid gap-3 md:grid-cols-2">{items.map((item) => <article key={item.id} className="rounded-2xl border border-white/[0.08] bg-[#111621] p-5"><p className="text-[9px] uppercase tracking-[0.12em] text-[#73e8dc]">{item.industry}</p><h2 className="mt-2 text-sm font-semibold leading-5">{item.title}</h2><p className="mt-2 text-[10px] leading-5 text-[#a0adbf]">{item.summary}</p><div className="mt-3 flex flex-wrap gap-1.5">{item.skills.map((skill) => <span key={skill} className="rounded-md border border-white/[0.07] px-2 py-1 text-[8px] text-[#9eabbd]">{skill}</span>)}</div><div className="mt-4 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-3"><span className="text-[8px] text-[#7f8ca0]">{item.sourceName} · publication date not verified</span><a href={item.sourceUrl} target="_blank" rel="noreferrer" className="shrink-0 text-[9px] font-semibold text-[#73e8dc] hover:text-white">Open reference ↗</a></div></article>)}</div>{items.length === 0 && <p className="rounded-xl border border-white/[0.08] bg-[#111621] p-5 text-xs leading-5 text-[#98a4b7]">No resources are stored yet. After configuring PostgreSQL, run <code>npm run db:seed</code> to load a small set of verified primary documentation links.</p>}</section></main>;
}
