"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, LoaderCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SkillGapResult } from "@/lib/ai/schemas/skill-gap";

export function SkillGapExplorer({
  available,
  aiAvailable,
  initialRole,
  initialSkills,
}: {
  available: boolean;
  aiAvailable: boolean;
  initialRole: string;
  initialSkills: { name: string; category: string }[];
}) {
  const [role, setRole] = useState(initialRole);
  const [result, setResult] = useState<SkillGapResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);
    setBusy(true);
    try {
      const response = await fetch("/api/career/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetRole: role }),
      });
      const payload = await response.json().catch(() => null) as { error?: string; result?: SkillGapResult } | null;
      if (!response.ok || !payload?.result) {
        setError(payload?.error ?? "The skill-gap plan could not be generated.");
        return;
      }
      setResult(payload.result);
    } catch {
      setError("We could not reach SENSAI. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  const progress = result?.requiredSkills.length ? Math.round((result.matchedSkills.length / result.requiredSkills.length) * 100) : 0;

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-white/[0.08] bg-[#111621] p-5 sm:p-6">
        <form onSubmit={analyze} className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <label className="block"><span className="text-xs font-medium text-[#dce4ef]">Target role</span><input value={role} onChange={(event) => setRole(event.target.value)} required minLength={2} maxLength={120} placeholder="e.g. Frontend Developer" className="mt-2 h-11 w-full rounded-xl border border-white/[0.1] bg-[#0b0e17] px-3.5 text-sm text-white outline-none placeholder:text-[#657187] focus:border-[#63e4d9]/50" /></label>
          <Button type="submit" disabled={busy || !available || !aiAvailable || role.trim().length < 2} className="min-h-11 px-4 text-xs">{busy ? <><LoaderCircle size={14} className="animate-spin" /> Comparing skills…</> : <><Sparkles size={14} /> Analyze skill gaps</>}</Button>
        </form>
        {!available && <p role="status" className="mt-4 rounded-xl border border-amber-300/15 bg-amber-200/[0.045] px-3.5 py-3 text-[11px] leading-5 text-[#d7c798]">Connect PostgreSQL to use the skills saved in your profile.</p>}
        {!aiAvailable && <p role="status" className="mt-4 rounded-xl border border-amber-300/15 bg-amber-200/[0.045] px-3.5 py-3 text-[11px] leading-5 text-[#d7c798]">Add GEMINI_API_KEY to the server environment to enable role analysis.</p>}
        {error && <p role="alert" className="mt-4 rounded-xl border border-rose-200/15 bg-rose-200/[0.04] px-3.5 py-3 text-[11px] leading-5 text-[#e4a5ae]">{error}</p>}
      </section>

      <div className="grid gap-5 lg:grid-cols-[.78fr_1.22fr]">
        <section className="h-fit rounded-2xl border border-white/[0.08] bg-[#111621] p-5">
          <h2 className="text-xs font-semibold">Current skills</h2>
          <p className="mt-1.5 text-[10px] leading-5 text-[#7f8ca1]">From your profile and analyzed resumes.</p>
          {initialSkills.length ? <div className="mt-4 flex flex-wrap gap-2">{initialSkills.map((skill) => <span key={`${skill.category}-${skill.name}`} className="rounded-lg border border-white/[0.08] bg-white/[0.025] px-2.5 py-1.5 text-[10px] text-[#c0cad8]">{skill.name}</span>)}</div> : <p className="mt-4 rounded-xl border border-white/[0.06] p-3 text-[11px] leading-5 text-[#8794a9]">No skills saved yet. Add skills in your <Link href="/onboarding" className="text-[#72e5db] hover:text-white">career profile</Link> or analyze a resume.</p>}
          {result && <div className="mt-6 border-t border-white/[0.07] pt-5"><div className="flex items-center justify-between"><h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8997ac]">Role skill coverage</h3><span className="text-xs font-semibold text-[#72e5db]">{progress}%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.07]"><div className="h-full rounded-full bg-[#59dfd3] transition-[width]" style={{ width: `${progress}%` }} /></div><p className="mt-2 text-[9px] text-[#7f8ca1]">{result.matchedSkills.length} of {result.requiredSkills.length} typical skills currently matched</p></div>}
        </section>

        <section className="rounded-2xl border border-white/[0.08] bg-[#111621] p-5 sm:p-6">
          {!result && <div className="py-10 text-center"><span className="mx-auto grid size-11 place-items-center rounded-xl border border-[#59ded3]/15 bg-[#4bdccd]/[0.06] text-[#70e6da]"><Sparkles size={18} /></span><h2 className="mt-4 text-sm font-semibold">Choose a target role</h2><p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-[#8794a9]">SENSAI will compare typical role requirements with the skills saved in your profile.</p></div>}
          {result && <>
            <div className="border-b border-white/[0.07] pb-4"><p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#73e8dc]">Target role</p><h2 className="mt-1.5 text-lg font-semibold">{role}</h2><p className="mt-2 text-[10px] leading-5 text-[#8593a7]">AI-generated typical requirements; actual job descriptions differ. {result.roleContext}</p></div>
            <div className="mt-5 flex flex-wrap gap-2"><span className="rounded-full border border-[#63e4d9]/20 bg-[#4bdccd]/[0.04] px-3 py-1.5 text-[9px] text-[#9debe3]"><Check size={11} className="mr-1 inline" />{result.matchedSkills.length} matched</span><span className="rounded-full border border-amber-200/15 bg-amber-100/[0.035] px-3 py-1.5 text-[9px] text-[#d7c798]">{result.missingSkills.length} to explore</span></div>

            {result.requiredSkills.length > 0 ? <div className="mt-4 space-y-2">{result.requiredSkills.map((skill) => {
              const isMatched = result.matchedSkills.includes(skill.name);
              return <article key={skill.name} className="rounded-xl border border-white/[0.07] bg-white/[0.015] p-3.5"><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><span className={`grid size-5 place-items-center rounded-full ${isMatched ? "bg-[#4bdccd]/[0.12] text-[#72e5db]" : "bg-amber-100/[0.08] text-[#d7c798]"}`}>{isMatched ? <Check size={12} /> : <span className="size-1 rounded-full bg-current" />}</span><h3 className="text-xs font-medium">{skill.name}</h3></div><span className="rounded-full bg-white/[0.05] px-2 py-1 text-[8px] capitalize text-[#91a0b5]">{skill.priority} priority · {skill.category}</span></div><p className="mt-2 pl-7 text-[10px] leading-5 text-[#a0adbf]">{skill.rationale}</p>{!isMatched && skill.learningTopics.length > 0 && <div className="mt-2 pl-7"><p className="text-[9px] uppercase tracking-[0.1em] text-[#748197]">Learning topics to explore</p><ul className="mt-1 flex flex-wrap gap-1.5">{skill.learningTopics.map((topic) => <li key={topic} className="rounded-md border border-white/[0.06] px-2 py-1 text-[9px] text-[#93a0b4]">{topic}</li>)}</ul></div>}</article>;
            })}</div> : <p className="mt-5 rounded-xl border border-white/[0.06] p-4 text-xs text-[#8794a9]">No role skills were returned. Try a more specific target role.</p>}
            <div className="mt-5 flex flex-wrap gap-2"><Link href="/career/roadmap" className="inline-flex items-center gap-1.5 rounded-lg bg-[#54e3d5] px-3 py-2 text-[10px] font-semibold text-[#071312]">Generate roadmap <ArrowUpRight size={12} /></Link><Link href="/jobs" className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-[10px] font-semibold text-[#dce4ef]">View job matches <ArrowUpRight size={12} /></Link></div>
          </>}
        </section>
      </div>
    </div>
  );
}
