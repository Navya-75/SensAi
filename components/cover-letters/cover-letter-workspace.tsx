"use client";

import { useState } from "react";
import Link from "next/link";
import { Clipboard, Download, LoaderCircle, Save, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

type Letter = { id: string; title: string; content: string; createdAt: string };
type JobOption = { id: string; title: string; company: string; description: string };

export function CoverLetterWorkspace({ available, aiAvailable, initialLetters, jobs }: { available: boolean; aiAvailable: boolean; initialLetters: Letter[]; jobs: JobOption[] }) {
  const [letters, setLetters] = useState(initialLetters);
  const [letter, setLetter] = useState<Letter | null>(initialLetters[0] ?? null);
  const [jobId, setJobId] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [historyBusy, setHistoryBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setBusy(true); setError(null); setMessage(null);
    try {
      const response = await fetch("/api/cover-letters/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...(jobId ? { jobId } : {}), jobTitle, company, jobDescription }) });
      const payload = await response.json().catch(() => null) as { error?: string; letter?: Letter } | null;
      if (!response.ok || !payload?.letter) { setError(payload?.error ?? "The cover letter could not be generated."); return; }
      setLetter(payload.letter);
      setLetters((current) => [payload.letter!, ...current.filter((item) => item.id !== payload.letter!.id)].slice(0, 10));
      setMessage("Draft generated and saved. Review every claim before using it.");
    } catch { setError("We could not reach SENSAI. Check your connection and try again."); }
    finally { setBusy(false); }
  }

  async function save() {
    if (!letter) return;
    setBusy(true); setError(null); setMessage(null);
    try {
      const response = await fetch(`/api/cover-letters/${encodeURIComponent(letter.id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: letter.title, content: letter.content }) });
      const payload = await response.json().catch(() => null) as { error?: string; saved?: boolean } | null;
      if (!response.ok || !payload?.saved) { setError(payload?.error ?? "The letter could not be saved."); return; }
      setLetters((current) => current.map((item) => item.id === letter.id ? letter : item));
      setMessage("Your edits are saved.");
    } catch { setError("We could not reach SENSAI. Check your connection and try again."); }
    finally { setBusy(false); }
  }

  async function loadLetter(id: string) {
    setHistoryBusy(true); setError(null); setMessage(null);
    try {
      const response = await fetch(`/api/cover-letters/${encodeURIComponent(id)}`);
      const payload = await response.json().catch(() => null) as { error?: string; letter?: Letter } | null;
      if (!response.ok || !payload?.letter) { setError(payload?.error ?? "The saved letter could not be loaded."); return; }
      setLetter(payload.letter);
    } catch { setError("We could not reach SENSAI. Check your connection and try again."); }
    finally { setHistoryBusy(false); }
  }

  async function copy() {
    if (!letter) return;
    try { await navigator.clipboard.writeText(letter.content); setMessage("Cover letter copied to clipboard."); }
    catch { setError("Clipboard access was denied. Select the letter text to copy it."); }
  }

  function download() {
    if (!letter) return;
    const blob = new Blob([letter.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${letter.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "cover-letter"}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function selectJob(id: string) {
    setJobId(id);
    const job = jobs.find((item) => item.id === id);
    if (job) { setJobTitle(job.title); setCompany(job.company); setJobDescription(job.description); }
  }

  return <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
    <aside className="space-y-4">
      <section className="rounded-2xl border border-white/[0.08] bg-[#111621] p-4"><h2 className="text-xs font-semibold">Role details</h2>
        {jobs.length > 0 && <label className="mt-3 block text-[9px] text-[#8d9aaf]">Choose a saved listing<select value={jobId} onChange={(event) => selectJob(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-white/[0.08] bg-[#0b0e17] px-2.5 text-[10px] text-white"><option value="">Custom job description</option>{jobs.map((job) => <option key={job.id} value={job.id}>{job.title} · {job.company}</option>)}</select></label>}
        <label className="mt-3 block text-[9px] text-[#8d9aaf]">Job title<input value={jobTitle} onChange={(event) => { setJobId(""); setJobTitle(event.target.value); }} maxLength={160} className="mt-1 h-9 w-full rounded-lg border border-white/[0.08] bg-[#0b0e17] px-2.5 text-[10px] text-white outline-none" /></label>
        <label className="mt-3 block text-[9px] text-[#8d9aaf]">Company<input value={company} onChange={(event) => { setJobId(""); setCompany(event.target.value); }} maxLength={160} className="mt-1 h-9 w-full rounded-lg border border-white/[0.08] bg-[#0b0e17] px-2.5 text-[10px] text-white outline-none" /></label>
        <label className="mt-3 block text-[9px] text-[#8d9aaf]">Job description<textarea value={jobDescription} onChange={(event) => { setJobId(""); setJobDescription(event.target.value); }} maxLength={12000} rows={8} className="mt-1 w-full rounded-lg border border-white/[0.08] bg-[#0b0e17] px-2.5 py-2 text-[10px] leading-5 text-white outline-none" /></label>
        <Button type="button" onClick={() => void generate()} disabled={!available || !aiAvailable || busy || jobTitle.trim().length < 2 || !company.trim() || jobDescription.trim().length < 10} className="mt-4 w-full min-h-10 px-3 text-xs">{busy && !letter ? <LoaderCircle size={13} className="animate-spin" /> : <Sparkles size={13} />} Generate grounded draft</Button>
        {!available && <p className="mt-3 text-[9px] text-[#d7c798]">Connect PostgreSQL to save letters.</p>}{!aiAvailable && <p className="mt-2 text-[9px] text-[#d7c798]">Add GEMINI_API_KEY to enable generation.</p>}
      </section>
      <section className="rounded-2xl border border-white/[0.08] bg-[#111621] p-4"><h2 className="text-xs font-semibold">Saved letters</h2>{letters.length ? <ul className="mt-3 space-y-1.5">{letters.map((item) => <li key={item.id}><button type="button" disabled={historyBusy || busy} onClick={() => void loadLetter(item.id)} className={`w-full rounded-lg border px-2.5 py-2 text-left text-[10px] ${letter?.id === item.id ? "border-[#63e4d9]/25 bg-[#4bdccd]/[0.04] text-[#b8f4ee]" : "border-white/[0.05] text-[#98a5b8] hover:bg-white/[0.03]"}`}>{item.title}</button></li>)}</ul> : <p className="mt-2 text-[10px] leading-5 text-[#7f8ca1]">Your saved drafts will appear here.</p>}</section>
    </aside>

    <section className="min-w-0 rounded-2xl border border-white/[0.08] bg-[#111621] p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#73e8dc]">Editable draft</p><p className="mt-1 text-[10px] text-[#8794a9]">Generated content is not verified; check every detail against your experience.</p></div><div className="flex flex-wrap gap-2"><Button type="button" variant="secondary" onClick={() => void copy()} disabled={!letter || busy} className="min-h-9 px-2.5 text-[9px]"><Clipboard size={12} /> Copy</Button><Button type="button" variant="secondary" onClick={download} disabled={!letter || busy} className="min-h-9 px-2.5 text-[9px]"><Download size={12} /> Download</Button><Button type="button" onClick={() => void save()} disabled={!letter || busy} className="min-h-9 px-2.5 text-[9px]">{busy && letter ? <LoaderCircle size={12} className="animate-spin" /> : <Save size={12} />} Save edits</Button></div></div>
      {message && <p role="status" className="mt-4 rounded-lg border border-[#5de1d5]/15 bg-[#4bdccd]/[0.04] px-3 py-2.5 text-[10px] text-[#9debe3]">{message}</p>}{error && <p role="alert" className="mt-4 rounded-lg border border-rose-200/15 bg-rose-200/[0.04] px-3 py-2.5 text-[10px] leading-5 text-[#e4a5ae]">{error}</p>}
      {letter ? <><label className="mt-5 block text-[9px] text-[#8d9aaf]">Draft title<input value={letter.title} onChange={(event) => setLetter({ ...letter, title: event.target.value })} maxLength={240} className="mt-1 h-9 w-full rounded-lg border border-white/[0.08] bg-[#0b0e17] px-3 text-[10px] text-white outline-none" /></label><label className="mt-3 block text-[9px] text-[#8d9aaf]">Letter text<textarea value={letter.content} onChange={(event) => setLetter({ ...letter, content: event.target.value })} maxLength={8000} rows={28} className="mt-1 w-full rounded-xl border border-white/[0.08] bg-[#0b0e17] p-4 text-[11px] leading-6 text-[#dce4ef] outline-none focus:border-[#63e4d9]/40" /></label></> : <div className="flex min-h-[420px] flex-col items-center justify-center text-center"><span className="grid size-11 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.025] text-[#7ce7dc]"><Sparkles size={18} /></span><h2 className="mt-4 text-sm font-semibold">Your cover letter appears here</h2><p className="mt-2 max-w-sm text-xs leading-5 text-[#8794a9]">Add a role and job description. SENSAI will use only evidence from your resume and profile.</p><Link href="/resume/analyzer" className="mt-4 text-[10px] text-[#71e5db]">Analyze a resume first →</Link></div>}
    </section>
  </div>;
}
