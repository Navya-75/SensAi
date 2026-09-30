"use client";

import { useState, type FormEvent } from "react";
import { LoaderCircle, Printer, Save, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EntryEditor, type EntrySectionKey, type ResumeEntry } from "@/components/resume-builder/entry-editor";
import { type ResumeBuilderData, type ResumeSections } from "@/lib/validation/resume-builder";

type Suggestion = { summarySuggestion: string; notes: string[] };

export function ResumeBuilder({ available, aiAvailable, initialData }: { available: boolean; aiAvailable: boolean; initialData: ResumeBuilderData }) {
  const [data, setData] = useState(initialData);
  const [skillsDraft, setSkillsDraft] = useState(initialData.sections.skills.join(", "));
  const [busy, setBusy] = useState(false);
  const [suggestionBusy, setSuggestionBusy] = useState(false);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof ResumeSections>(key: K, value: ResumeSections[K]) {
    setData((current) => ({ ...current, sections: { ...current.sections, [key]: value } }));
  }
  function updateContact(key: keyof ResumeSections["contact"], value: string) {
    setData((current) => ({ ...current, sections: { ...current.sections, contact: { ...current.sections.contact, [key]: value } } }));
  }

  async function save() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/resume-builder", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const payload = await response.json().catch(() => null) as { error?: string; saved?: { updatedAt: string } } | null;
      if (!response.ok || !payload?.saved) { setError(payload?.error ?? "Your resume could not be saved."); return; }
      setMessage(`Saved at ${new Date(payload.saved.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`);
    } catch { setError("We could not reach SENSAI. Check your connection and try again."); }
    finally { setBusy(false); }
  }

  async function suggestSummary() {
    setSuggestionBusy(true);
    setError(null);
    setSuggestion(null);
    try {
      const response = await fetch("/api/resume-builder/suggestions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data.sections) });
      const payload = await response.json().catch(() => null) as { error?: string; suggestion?: Suggestion } | null;
      if (!response.ok || !payload?.suggestion) { setError(payload?.error ?? "The suggestion could not be created."); return; }
      setSuggestion(payload.suggestion);
    } catch { setError("We could not reach SENSAI. Check your connection and try again."); }
    finally { setSuggestionBusy(false); }
  }

  function applySuggestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!suggestion) return;
    update("summary", suggestion.summarySuggestion);
    setMessage("Suggestion added to your editable summary. Save when you are ready.");
    setSuggestion(null);
  }

  const sections = data.sections;
  const entries = (key: EntrySectionKey) => sections[key] as ResumeEntry[];
  const printableEntrySections: [string, ResumeEntry[]][] = [
    ["Experience", sections.experience], ["Projects", sections.projects], ["Education", sections.education],
    ["Skills", sections.skills.map((skill, index) => ({ id: `skill-${index}`, title: skill, subtitle: "", details: "" }))],
    ["Certifications", sections.certifications], ["Achievements", sections.achievements],
  ];

  return <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,.95fr)] print:block">
    <section className="space-y-4 print:hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-[#111621] p-4"><label className="min-w-[180px] flex-1 text-[9px] text-[#8d9aaf]">Resume title<input value={data.title} onChange={(event) => setData((current) => ({ ...current, title: event.target.value }))} maxLength={120} className="mt-1 h-9 w-full rounded-lg border border-white/[0.08] bg-[#0b0e17] px-2.5 text-xs text-white outline-none" /></label><label className="text-[9px] text-[#8d9aaf]">Template<select value={data.templateKey} onChange={(event) => setData((current) => ({ ...current, templateKey: event.target.value as "ats" | "modern" }))} className="mt-1 block h-9 rounded-lg border border-white/[0.08] bg-[#0b0e17] px-2 text-[10px] text-white"><option value="ats">ATS friendly</option><option value="modern">Clean modern</option></select></label><Button type="button" variant="secondary" disabled={!available || busy} onClick={() => void save()} className="min-h-9 px-3 text-[10px]">{busy ? <LoaderCircle size={13} className="animate-spin" /> : <Save size={13} />} Save</Button><Button type="button" disabled={!available} onClick={() => window.print()} className="min-h-9 px-3 text-[10px]"><Printer size={13} /> Save as PDF</Button></div>
      {!available && <p className="rounded-xl border border-amber-200/15 bg-amber-100/[0.04] px-3 py-2.5 text-[10px] text-[#d7c798]">Connect PostgreSQL to save your resume builder document.</p>}
      {message && <p role="status" className="rounded-lg border border-[#5de1d5]/15 bg-[#4bdccd]/[0.04] px-3 py-2.5 text-[10px] text-[#9debe3]">{message}</p>}{error && <p role="alert" className="rounded-lg border border-rose-200/15 bg-rose-200/[0.04] px-3 py-2.5 text-[10px] text-[#e4a5ae]">{error}</p>}

      <section className="rounded-xl border border-white/[0.07] bg-[#111621] p-4"><h2 className="text-xs font-semibold">Contact</h2><div className="mt-3 grid gap-3 sm:grid-cols-2">{([ ["fullName", "Full name"], ["email", "Email"], ["phone", "Phone"], ["location", "Location"], ["website", "Website"], ["linkedin", "LinkedIn"] ] as const).map(([key, label]) => <label key={key} className="text-[9px] text-[#8d9aaf]">{label}<input value={sections.contact[key]} onChange={(event) => updateContact(key, event.target.value)} maxLength={300} className="mt-1 h-9 w-full rounded-lg border border-white/[0.08] bg-[#0b0e17] px-2.5 text-[11px] text-white outline-none focus:border-[#63e4d9]/40" /></label>)}</div></section>

      <section className="rounded-xl border border-white/[0.07] bg-[#111621] p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-xs font-semibold">Professional summary</h2><Button type="button" variant="secondary" disabled={suggestionBusy || !aiAvailable} onClick={() => void suggestSummary()} className="min-h-8 px-2.5 text-[9px]">{suggestionBusy ? <LoaderCircle size={12} className="animate-spin" /> : <Sparkles size={12} />} Suggest with AI</Button></div><label htmlFor="resume-summary" className="sr-only">Professional summary</label><textarea id="resume-summary" value={sections.summary} onChange={(event) => update("summary", event.target.value)} maxLength={1500} rows={4} placeholder="Write a concise summary based on your actual experience." className="mt-3 w-full resize-y rounded-lg border border-white/[0.08] bg-[#0b0e17] px-3 py-2.5 text-[11px] leading-5 text-white outline-none focus:border-[#63e4d9]/40" />{!aiAvailable && <p className="mt-2 text-[9px] text-[#d7c798]">Add GEMINI_API_KEY to enable AI suggestions.</p>}{suggestion && <form onSubmit={applySuggestion} className="mt-3 rounded-lg border border-[#63e4d9]/15 bg-[#4bdccd]/[0.03] p-3"><p className="text-[9px] font-semibold text-[#79e7dc]">Editable AI draft — review every claim</p><textarea value={suggestion.summarySuggestion} onChange={(event) => setSuggestion({ ...suggestion, summarySuggestion: event.target.value })} maxLength={1500} rows={4} className="mt-2 w-full rounded-lg border border-white/[0.08] bg-[#0b0e17] p-2.5 text-[10px] leading-5 text-white" />{suggestion.notes.map((note, index) => <textarea aria-label={`Editable AI note ${index + 1}`} key={index} value={note} onChange={(event) => setSuggestion({ ...suggestion, notes: suggestion.notes.map((value, noteIndex) => noteIndex === index ? event.target.value : value) })} maxLength={260} rows={2} className="mt-2 w-full rounded-lg border border-white/[0.06] bg-[#0b0e17] p-2 text-[9px] leading-4 text-[#9ba8bb]" />)}<Button type="submit" disabled={!suggestion.summarySuggestion.trim()} className="mt-2 min-h-8 px-2.5 text-[9px]">Use editable summary</Button></form>}</section>

      <section className="rounded-xl border border-white/[0.07] bg-[#111621] p-4"><h2 className="text-xs font-semibold">Skills</h2><label htmlFor="resume-skills" className="sr-only">Skills, separated by commas or new lines</label><textarea id="resume-skills" value={skillsDraft} onChange={(event) => { const value = event.target.value; setSkillsDraft(value); update("skills", value.split(/[\n,]/).map((item) => item.trim()).filter(Boolean).slice(0, 60)); }} maxLength={6000} rows={3} placeholder="JavaScript, React, SQL" className="mt-3 w-full rounded-lg border border-white/[0.08] bg-[#0b0e17] px-3 py-2.5 text-[11px] leading-5 text-white outline-none" /></section>

      {(["experience", "projects", "education", "certifications", "achievements"] as EntrySectionKey[]).map((key) => <EntryEditor key={key} section={key} entries={entries(key)} onChange={(value) => update(key, value)} />)}
    </section>

    <div className="min-w-0"><div className="mb-3 flex items-center justify-between print:hidden"><h2 className="text-xs font-semibold text-[#aab6c8]">Live preview</h2><span className="text-[9px] text-[#718097]">{data.templateKey === "ats" ? "ATS friendly" : "Clean modern"}</span></div><article className={`resume-print-preview min-h-[900px] rounded-xl border border-white/[0.1] bg-white p-7 text-[#202938] shadow-2xl sm:p-9 ${data.templateKey === "modern" ? "border-t-4 border-t-[#2da99e]" : ""}`}>
      <header className="border-b border-[#d8dde5] pb-4"><h1 className="text-2xl font-bold tracking-tight">{sections.contact.fullName || "Your Name"}</h1><div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[9px] text-[#515d6e]">{[sections.contact.email, sections.contact.phone, sections.contact.location, sections.contact.website, sections.contact.linkedin].filter(Boolean).map((item) => <span key={item}>{item}</span>)}</div></header>
      {sections.summary && <section className="mt-5"><h2 className="text-[10px] font-bold uppercase tracking-[0.1em]">Summary</h2><p className="mt-1.5 whitespace-pre-line text-[10px] leading-5 text-[#394556]">{sections.summary}</p></section>}
      {printableEntrySections.map(([title, items]) => { const visible = items.filter((item) => item.title || item.subtitle || item.details); return visible.length ? <section key={title} className="mt-5 break-inside-avoid"><h2 className="border-b border-[#e2e5ea] pb-1 text-[10px] font-bold uppercase tracking-[0.1em]">{title}</h2><div className="mt-2 space-y-3">{visible.map((item) => <div key={item.id} className="break-inside-avoid"><div className="flex flex-wrap justify-between gap-x-4"><h3 className="text-[10px] font-semibold">{item.title}</h3>{item.subtitle && <p className="text-[9px] text-[#657185]">{item.subtitle}</p>}</div>{item.details && <p className="mt-1 whitespace-pre-line text-[9px] leading-4 text-[#465366]">{item.details}</p>}</div>)}</div></section> : null; })}
      {!sections.summary && printableEntrySections.every(([, items]) => items.every((item) => !item.title && !item.subtitle && !item.details)) && <p className="mt-8 text-xs text-[#798597]">Add resume details in the editor to preview them here.</p>}
    </article></div>
  </div>;
}
