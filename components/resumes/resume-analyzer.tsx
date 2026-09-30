"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, BriefcaseBusiness, GraduationCap, LoaderCircle, Sparkles } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import type { ResumeAnalysisResult } from "@/lib/ai/schemas/resume-analysis";

type Analysis = { id: string; model: string | null; result: ResumeAnalysisResult; createdAt: string };
type ResumeItem = {
  id: string;
  originalFilename: string;
  status: string;
  uploadedAt: string;
  latestAnalysis: Analysis | null;
  analysisHistory: { id: string; model: string | null; createdAt: string }[];
};

function Evidence({ children }: { children: string }) {
  return <p className="mt-2 border-l border-[#63e4d9]/25 pl-3 text-[11px] leading-5 text-[#7f8ca1]">“{children}”</p>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value));
}

export function ResumeAnalyzer({
  available,
  aiAvailable,
  resumes: initialResumes,
}: {
  available: boolean;
  aiAvailable: boolean;
  resumes: ResumeItem[];
}) {
  const [resumes, setResumes] = useState(initialResumes);
  const [selectedId, setSelectedId] = useState(initialResumes[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [historyBusy, setHistoryBusy] = useState(false);
  const [viewingAnalysis, setViewingAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const selected = resumes.find((resume) => resume.id === selectedId) ?? null;
  const displayedAnalysis = viewingAnalysis ?? selected?.latestAnalysis ?? null;
  const result = displayedAnalysis?.result ?? null;

  async function analyze() {
    if (!selected || busy || !aiAvailable) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/resumes/${encodeURIComponent(selected.id)}/analysis`, { method: "POST" });
      const payload = await response.json().catch(() => null) as { error?: string; analysis?: Analysis } | null;
      if (!response.ok || !payload?.analysis) {
        setError(payload?.error ?? "The analysis could not be completed. Please try again.");
        return;
      }
      setResumes((current) => current.map((resume) => resume.id === selected.id
        ? {
            ...resume,
            status: "ANALYZED",
            latestAnalysis: payload.analysis!,
            analysisHistory: [payload.analysis!, ...resume.analysisHistory.filter((item) => item.id !== payload.analysis!.id)]
              .slice(0, 5)
              .map(({ id, model, createdAt }) => ({ id, model, createdAt })),
          }
        : resume));
      setViewingAnalysis(payload.analysis);
    } catch {
      setError("We could not reach SENSAI. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function viewPastAnalysis(analysisId: string) {
    if (!selected || historyBusy || busy) return;
    setHistoryBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/resumes/${encodeURIComponent(selected.id)}/analysis?analysisId=${encodeURIComponent(analysisId)}`);
      const payload = await response.json().catch(() => null) as { error?: string; analysis?: Analysis } | null;
      if (!response.ok || !payload?.analysis) {
        setError(payload?.error ?? "The previous analysis could not be loaded.");
        return;
      }
      setViewingAnalysis(payload.analysis);
    } catch {
      setError("We could not reach SENSAI. Check your connection and try again.");
    } finally {
      setHistoryBusy(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="h-fit rounded-2xl border border-white/[0.08] bg-[#111621] p-4">
        <div className="flex items-center justify-between"><h2 className="text-xs font-semibold">Your resumes</h2><Link href="/resume/upload" className="text-[10px] text-[#69e4d8] hover:text-white">Upload</Link></div>
        {!available && <p className="mt-4 rounded-xl border border-amber-300/15 bg-amber-200/[0.045] p-3 text-[11px] leading-5 text-[#d7c798]">Connect PostgreSQL to load your private resume library.</p>}
        {available && resumes.length === 0 && <div className="mt-5 rounded-xl border border-white/[0.07] px-3 py-5 text-center"><p className="text-xs font-medium">No resumes to analyze</p><p className="mt-1.5 text-[10px] leading-5 text-[#8794a9]">Upload a text based PDF to get started.</p><ButtonLink href="/resume/upload" className="mt-4 min-h-9 px-3 text-[10px]">Upload PDF <ArrowUpRight size={12} /></ButtonLink></div>}
        {resumes.length > 0 && <div className="mt-3 space-y-2">{resumes.map((resume) => (
          <button key={resume.id} type="button" disabled={busy || historyBusy} aria-pressed={selectedId === resume.id} onClick={() => { setSelectedId(resume.id); setViewingAnalysis(null); setError(null); }} className={`w-full rounded-xl border px-3 py-3 text-left transition-colors disabled:opacity-60 ${selectedId === resume.id ? "border-[#63e4d9]/35 bg-[#4bdccd]/[0.06]" : "border-white/[0.06] bg-white/[0.015] hover:border-white/[0.14]"}`}>
            <span className="block truncate text-[11px] font-medium text-[#e4eaf3]">{resume.originalFilename}</span>
            <span className="mt-1.5 flex items-center justify-between text-[9px] text-[#7f8ca1]"><span>{formatDate(resume.uploadedAt)}</span><span>{resume.latestAnalysis ? "Analyzed" : "Ready"}</span></span>
          </button>
        ))}</div>}
      </aside>

      <section className="min-w-0 rounded-2xl border border-white/[0.08] bg-[#111621] p-5 sm:p-7">
        {!selected && <div className="py-10 text-center"><span className="mx-auto grid size-11 place-items-center rounded-xl border border-[#59ded3]/15 bg-[#4bdccd]/[0.06] text-[#70e6da]"><Sparkles size={18} /></span><h2 className="mt-4 text-sm font-semibold">Your resume insights will appear here</h2><p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-[#8794a9]">Choose a resume from your library to review its extracted skills and experience.</p></div>}
        {selected && <>
          <div className="flex flex-col gap-4 border-b border-white/[0.07] pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0"><p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#73e8dc]">Selected resume</p><h2 className="mt-2 truncate text-base font-semibold">{selected.originalFilename}</h2><p className="mt-1 text-[10px] text-[#7f8ca1]">{displayedAnalysis ? `Viewing analysis from ${formatDate(displayedAnalysis.createdAt)}` : "No analysis yet"}</p></div>
            <Button type="button" onClick={() => void analyze()} disabled={busy || historyBusy || !aiAvailable} className="min-h-10 shrink-0 px-3.5 text-xs">{busy ? <><LoaderCircle size={14} className="animate-spin" /> Analyzing…</> : <><Sparkles size={14} /> {result ? "Analyze again" : "Analyze resume"}</>}</Button>
          </div>
          {!aiAvailable && <p className="mt-4 rounded-xl border border-amber-300/15 bg-amber-200/[0.045] px-3.5 py-3 text-[11px] leading-5 text-[#d7c798]">Gemini is not configured. Add GEMINI_API_KEY to the server environment to enable analysis.</p>}
          {error && <p role="alert" className="mt-4 rounded-xl border border-rose-200/15 bg-rose-200/[0.04] px-3.5 py-3 text-[11px] leading-5 text-[#e4a5ae]">{error}</p>}
          {selected.analysisHistory.length > 1 && <div className="mt-4 flex flex-wrap items-center gap-2"><span className="mr-1 text-[9px] uppercase tracking-[0.12em] text-[#77859a]">Previous analyses</span>{selected.analysisHistory.filter((item) => item.id !== selected.latestAnalysis?.id).map((item) => <button key={item.id} type="button" disabled={busy || historyBusy} onClick={() => void viewPastAnalysis(item.id)} className="rounded-lg border border-white/[0.08] px-2.5 py-1.5 text-[9px] text-[#9ba8ba] hover:border-[#63e4d9]/30 hover:text-white disabled:opacity-50">{formatDate(item.createdAt)}</button>)}{viewingAnalysis && viewingAnalysis.id !== selected.latestAnalysis?.id && <button type="button" disabled={busy || historyBusy} onClick={() => setViewingAnalysis(null)} className="rounded-lg border border-[#63e4d9]/20 px-2.5 py-1.5 text-[9px] text-[#69e4d8] hover:text-white disabled:opacity-50">Return to latest</button>}{historyBusy && <LoaderCircle size={12} className="animate-spin text-[#70e6da]" />}</div>}
          {result && <div className="pt-5">
            {result.summary && <section><h3 className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#8e9cb1]">Profile summary</h3><p className="mt-2 text-sm leading-6 text-[#dce4ef]">{result.summary}</p></section>}

            <section className="mt-6"><div className="flex items-center justify-between"><h3 className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#8e9cb1]">Skills found</h3><span className="text-[9px] text-[#748197]">{result.skills.length} supported by your resume</span></div>{result.skills.length ? <div className="mt-3 grid gap-2 sm:grid-cols-2">{result.skills.map((skill, index) => <article key={`${skill.name}-${index}`} className="rounded-xl border border-white/[0.07] bg-white/[0.015] p-3"><div className="flex items-center justify-between gap-3"><span className="text-xs font-medium">{skill.name}</span><span className="rounded-full bg-white/[0.05] px-2 py-1 text-[8px] capitalize text-[#92a0b5]">{skill.category}</span></div><Evidence>{skill.evidence}</Evidence></article>)}</div> : <p className="mt-3 text-xs text-[#7f8ca1]">No specific skills could be supported from the extracted text.</p>}</section>

            <section className="mt-7"><h3 className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#8e9cb1]">Experience</h3>{result.experience.length ? <div className="mt-3 space-y-3">{result.experience.map((item, index) => <article key={`${item.organization}-${item.title}-${index}`} className="rounded-xl border border-white/[0.07] bg-white/[0.015] p-4"><div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1"><h4 className="text-xs font-semibold">{item.title || "Role not specified"}{item.organization ? <span className="font-normal text-[#a3aec0]"> · {item.organization}</span> : null}</h4>{item.dates && <span className="text-[9px] text-[#78859a]">{item.dates}</span>}</div>{item.details.length > 0 && <ul className="mt-3 space-y-3">{item.details.map((detail, detailIndex) => <li key={`${detail.description}-${detailIndex}`} className="text-[11px] leading-5 text-[#a9b4c5]">{detail.description}<Evidence>{detail.evidence}</Evidence></li>)}</ul>}<Evidence>{item.evidence}</Evidence></article>)}</div> : <p className="mt-3 text-xs text-[#7f8ca1]">No experience entries were identified in the extracted text.</p>}</section>

            {result.achievements.length > 0 && <section className="mt-7"><h3 className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#8e9cb1]">Achievements</h3><div className="mt-3 grid gap-2 sm:grid-cols-2">{result.achievements.map((item, index) => <article key={index} className="rounded-xl border border-white/[0.07] p-3.5"><p className="text-xs leading-5 text-[#dce4ef]">{item.description}</p><Evidence>{item.evidence}</Evidence></article>)}</div></section>}

            <div className="mt-7 grid gap-5 md:grid-cols-2">
              <section><h3 className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.13em] text-[#8e9cb1]"><GraduationCap size={14} /> Education</h3>{result.education.length ? <div className="mt-3 space-y-2">{result.education.map((item, index) => <article key={`${item.institution}-${index}`} className="rounded-xl border border-white/[0.07] p-3"><p className="text-xs font-medium">{item.qualification || item.field || "Education"}</p><p className="mt-1 text-[10px] text-[#8d9aaf]">{[item.institution, item.field, item.dates].filter(Boolean).join(" · ")}</p><Evidence>{item.evidence}</Evidence></article>)}</div> : <p className="mt-3 text-[11px] text-[#7f8ca1]">No education details identified.</p>}</section>
              <section><h3 className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.13em] text-[#8e9cb1]"><BriefcaseBusiness size={13} /> Projects & certifications</h3>{result.projects.length === 0 && result.certifications.length === 0 && <p className="mt-3 text-[11px] text-[#7f8ca1]">No projects or certifications identified.</p>}{result.projects.map((item, index) => <article key={`project-${index}`} className="mt-3 rounded-xl border border-white/[0.07] p-3"><p className="text-xs font-medium">{item.name || "Project"}</p><p className="mt-1 text-[10px] leading-5 text-[#9ca8b9]">{item.description}</p>{item.skills.length > 0 && <p className="mt-2 text-[9px] text-[#69ded3]">{item.skills.join(" · ")}</p>}<Evidence>{item.evidence}</Evidence></article>)}{result.certifications.map((item, index) => <article key={`cert-${index}`} className="mt-2 rounded-xl border border-white/[0.07] p-3"><p className="text-xs font-medium">{item.name}</p><p className="mt-1 text-[10px] text-[#8d9aaf]">{[item.issuer, item.date].filter(Boolean).join(" · ")}</p><Evidence>{item.evidence}</Evidence></article>)}</section>
            </div>

            {(result.strengths.length > 0 || result.weaknesses.length > 0) && <div className="mt-7 grid gap-4 md:grid-cols-2">
              {result.strengths.length > 0 && <section className="rounded-xl border border-[#63e4d9]/12 bg-[#4bdccd]/[0.025] p-4"><h3 className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#73e8dc]">Resume strengths</h3><div className="mt-3 space-y-3">{result.strengths.map((item, index) => <article key={index}><h4 className="text-xs font-medium">{item.label}</h4><p className="mt-1 text-[10px] leading-5 text-[#a9b4c5]">{item.rationale}</p><Evidence>{item.evidence}</Evidence></article>)}</div></section>}
              {result.weaknesses.length > 0 && <section className="rounded-xl border border-white/[0.07] p-4"><h3 className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#a7b4c7]">Visible resume gaps</h3><p className="mt-1.5 text-[9px] leading-5 text-[#7f8ca1]">These describe the document, not your ability or potential.</p><div className="mt-3 space-y-3">{result.weaknesses.map((item, index) => <article key={index}><h4 className="text-xs font-medium">{item.observation}</h4><p className="mt-1 text-[10px] leading-5 text-[#9ca8b9]">{item.reason}</p></article>)}</div></section>}
            </div>}

            {result.roleSuggestions.length > 0 && <section className="mt-7 rounded-xl border border-[#63e4d9]/15 bg-[#4bdccd]/[0.035] p-4"><h3 className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#73e8dc]">Possible role directions</h3><p className="mt-1.5 text-[10px] leading-5 text-[#8593a7]">These are suggestions based on the resume text, not hiring predictions.</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{result.roleSuggestions.map((item, index) => <article key={`${item.title}-${index}`} className="rounded-lg border border-white/[0.06] bg-black/10 p-3"><h4 className="text-xs font-semibold">{item.title}</h4><p className="mt-1.5 text-[10px] leading-5 text-[#a9b4c5]">{item.rationale}</p>{item.supportingEvidence.map((evidence, evidenceIndex) => <Evidence key={evidenceIndex}>{evidence}</Evidence>)}</article>)}</div></section>}

            {result.atsSuggestions.length > 0 && <section className="mt-7"><h3 className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#8e9cb1]">ATS improvements</h3><p className="mt-1.5 text-[10px] leading-5 text-[#7f8ca1]">Suggestions to make the document easier for applicant tracking systems to parse.</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{result.atsSuggestions.map((item, index) => <article key={index} className="rounded-xl border border-white/[0.07] p-3.5"><h4 className="text-xs font-medium">{item.suggestion}</h4><p className="mt-1.5 text-[10px] leading-5 text-[#8996aa]">{item.reason}</p></article>)}</div></section>}

            {result.missingInformation.length > 0 && <section className="mt-7"><h3 className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#8e9cb1]">Details you could add</h3><p className="mt-1.5 text-[10px] leading-5 text-[#7f8ca1]">These details were not visible in the resume text. Their absence here does not mean you lack the experience.</p><ul className="mt-3 grid gap-2 sm:grid-cols-2">{result.missingInformation.map((item, index) => <li key={index} className="rounded-lg border border-white/[0.06] px-3 py-2.5 text-[11px] leading-5 text-[#a9b4c5]">{item}</li>)}</ul></section>}
          </div>}
          {!result && !busy && <div className="py-12 text-center"><span className="mx-auto grid size-11 place-items-center rounded-xl border border-[#59ded3]/15 bg-[#4bdccd]/[0.06] text-[#70e6da]"><Sparkles size={18} /></span><h3 className="mt-4 text-sm font-semibold">Ready for a closer look?</h3><p className="mx-auto mt-2 max-w-md text-xs leading-5 text-[#8794a9]">SENSAI will identify resume details and include supporting text so you can review what it found.</p></div>}
          {busy && <div role="status" className="flex flex-col items-center py-14 text-center"><LoaderCircle size={22} className="animate-spin text-[#70e6da]" /><p className="mt-4 text-xs font-medium">Reading your resume</p><p className="mt-1 text-[10px] text-[#8794a9]">This can take a short while.</p></div>}
        </>}
      </section>
    </div>
  );
}
