"use client";

import { useState, type FormEvent } from "react";
import { LoaderCircle, Printer, Save, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EntryEditor, type EntrySectionKey, type ResumeEntry } from "@/components/resume-builder/entry-editor";
import { type ResumeBuilderData, type ResumeSections, type ResumeTemplateKey } from "@/lib/validation/resume-builder";
import { groupResumeSkills, resumeSkillGroupLabels, resumeSkillGroupOrder, type ResumeSkillGroup } from "@/lib/skills/resume-groups";

type Suggestion = { summarySuggestion: string; notes: string[] };

const resumeTemplates: { key: ResumeTemplateKey; name: string; description: string }[] = [
  { key: "ats", name: "ATS friendly", description: "Traditional single column, plain headings" },
  { key: "modern", name: "Modern", description: "Teal header band and clean section rules" },
  { key: "minimal", name: "Minimal", description: "Open spacing and understated type" },
  { key: "classic", name: "Classic", description: "Centered serif header and navy dividers" },
  { key: "executive", name: "Executive", description: "Warm ivory page and gold accents" },
  { key: "creative", name: "Creative", description: "Blue sidebar with skills and contact" },
];

const previewStyles: Record<ResumeTemplateKey, { page: string; header: string; headerContent: string; name: string; contact: string; section: string }> = {
  ats: { page: "bg-white text-[#202938]", header: "border-b border-[#d8dde5]", headerContent: "", name: "text-[#202938]", contact: "text-[#515d6e]", section: "border-b border-[#e2e5ea] text-[#202938]" },
  modern: { page: "bg-white text-[#202938]", header: "-mx-7 -mt-7 mb-6 border-b-4 border-[#2da99e] bg-[#e8f6f4] p-6 sm:-mx-9 sm:-mt-9 sm:p-9", headerContent: "", name: "text-[#146b64]", contact: "text-[#385b58]", section: "border-b-2 border-[#2da99e] text-[#146b64]" },
  minimal: { page: "bg-[#fffefa] text-[#292929]", header: "mb-7", headerContent: "", name: "text-[#292929] font-normal", contact: "text-[#66645f]", section: "text-[#55534e]" },
  classic: { page: "font-serif bg-white text-[#263247]", header: "border-b-[3px] border-[#263247] pb-5 text-center", headerContent: "", name: "text-[#263247]", contact: "text-[#566176]", section: "border-b-2 border-[#263247] text-[#263247]" },
  executive: { page: "bg-[#fffaf0] text-[#272c36]", header: "mb-6 border-b-4 border-[#9a7735] bg-[#f2ead7] p-5", headerContent: "", name: "text-[#202d43]", contact: "text-[#5d5c57]", section: "border-b-2 border-[#b08a43] text-[#71561d]" },
  creative: { page: "bg-[#f7fbff] text-[#202938]", header: "rounded-lg bg-[#eaf3fc] p-4", headerContent: "", name: "text-[#0a477f]", contact: "text-[#445b70]", section: "border-b-2 border-[#0a66c2] text-[#0a66c2]" },
};

function TemplateThumbnail({ templateKey }: { templateKey: ResumeTemplateKey }) {
  const line = <span className="block h-1 rounded bg-slate-300" />;
  if (templateKey === "creative") return <span aria-hidden="true" className="flex h-14 overflow-hidden rounded border border-slate-200 bg-white"><span className="w-1/3 bg-blue-100 p-2"><span className="mb-2 block h-2 w-4/5 rounded bg-blue-600" />{line}<span className="mt-1">{line}</span></span><span className="flex-1 space-y-2 p-2">{line}{line}{line}<span className="block h-1 w-2/3 rounded bg-slate-300" /></span></span>;
  if (templateKey === "executive") return <span aria-hidden="true" className="block h-14 overflow-hidden rounded border border-amber-200 bg-[#fffaf0] p-2"><span className="mb-2 block h-5 rounded bg-[#f2ead7] p-1"><span className="block h-1.5 w-1/2 rounded bg-[#202d43]" /></span><span className="mb-1 block h-1 w-1/3 rounded bg-amber-600" />{line}</span>;
  if (templateKey === "classic") return <span aria-hidden="true" className="block h-14 overflow-hidden rounded border border-slate-200 bg-white p-2"><span className="mx-auto mb-1 block h-1.5 w-1/3 rounded bg-indigo-900" /><span className="mx-auto mb-2 block h-1 w-1/2 rounded bg-slate-400" /><span className="mb-1 block h-1 w-1/3 bg-indigo-900" />{line}</span>;
  if (templateKey === "modern") return <span aria-hidden="true" className="block h-14 overflow-hidden rounded border border-teal-100 bg-white"><span className="mb-2 block h-5 border-b-2 border-teal-600 bg-teal-50 p-1"><span className="block h-1.5 w-1/2 rounded bg-teal-700" /></span><span className="px-2"><span className="mb-1 block h-1 w-1/3 rounded bg-teal-600" />{line}</span></span>;
  if (templateKey === "minimal") return <span aria-hidden="true" className="block h-14 overflow-hidden rounded border border-stone-100 bg-[#fffefa] p-3"><span className="mb-2 block h-2 w-1/2 rounded bg-stone-500" /><span className="mb-2 block h-1 w-1/3 rounded bg-stone-300" />{line}</span>;
  return <span aria-hidden="true" className="block h-14 overflow-hidden rounded border border-slate-200 bg-white p-2"><span className="mb-2 block h-2 w-1/3 rounded bg-slate-800" /><span className="mb-1 block h-1 w-1/3 bg-slate-500" />{line}<span className="mt-2 block h-1 w-1/3 bg-slate-500" /></span>;
}

export function ResumeBuilder({ available, aiAvailable, initialData }: { available: boolean; aiAvailable: boolean; initialData: ResumeBuilderData }) {
  const [data, setData] = useState(initialData);
  const [skillGroupsDraft, setSkillGroupsDraft] = useState(initialData.sections.skillGroups ?? groupResumeSkills(initialData.sections.skills.map((name) => ({ name }))));
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
  function updateSkillGroup(group: ResumeSkillGroup, value: string) {
    const nextGroups = { ...skillGroupsDraft, [group]: value.split(/[\n,]/).map((item) => item.trim()).filter(Boolean).slice(0, 60) };
    setSkillGroupsDraft(nextGroups);
    setData((current) => ({
      ...current,
      sections: {
        ...current.sections,
        skillGroups: nextGroups,
        skills: resumeSkillGroupOrder.flatMap((key) => nextGroups[key]).slice(0, 240),
      },
    }));
  }

  async function save() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const sectionsToSave = { ...data.sections, skillGroups: skillGroupsDraft, skills: resumeSkillGroupOrder.flatMap((key) => skillGroupsDraft[key]) };
      const response = await fetch("/api/resume-builder", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, sections: sectionsToSave }) });
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
  const selectedTemplate = previewStyles[data.templateKey];
  const visibleSkillGroups = resumeSkillGroupOrder.map((key) => ({ key, label: resumeSkillGroupLabels[key], skills: skillGroupsDraft[key] })).filter(({ skills }) => skills.length > 0);
  const entries = (key: EntrySectionKey) => sections[key] as ResumeEntry[];
  const printableEntrySections: [string, ResumeEntry[]][] = [
    ["Experience", sections.experience], ["Projects", sections.projects], ["Education", sections.education],
    ["Certifications", sections.certifications], ["Achievements", sections.achievements],
  ];
  const renderContactHeader = () => <header className={`pb-4 ${selectedTemplate.header}`}><div className={selectedTemplate.headerContent}><h1 className={`text-2xl font-bold tracking-tight ${selectedTemplate.name}`}>{sections.contact.fullName || "Your Name"}</h1><div className={`mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[9px] ${selectedTemplate.contact} ${data.templateKey === "classic" ? "justify-center" : ""}`}>{[sections.contact.email, sections.contact.phone, sections.contact.location, sections.contact.website, sections.contact.linkedin].filter(Boolean).map((item) => <span key={item}>{item}</span>)}</div></div></header>;
  const renderSkills = () => visibleSkillGroups.length > 0 ? <section className="mt-5 break-inside-avoid"><h2 className={`pb-1 text-[10px] font-bold uppercase tracking-[0.1em] ${selectedTemplate.section}`}>Skills</h2><dl className={`mt-2 grid gap-x-4 gap-y-2 ${data.templateKey === "creative" ? "grid-cols-1" : "grid-cols-2"}`}>{visibleSkillGroups.map(({ key, label, skills }) => <div key={key} className="break-inside-avoid"><dt className="text-[9px] font-semibold">{label}</dt><dd className="mt-0.5 text-[9px] leading-4 text-[#465366]">{skills.join(" · ")}</dd></div>)}</dl></section> : null;
  const renderSummary = () => sections.summary ? <section className="mt-5"><h2 className={`pb-1 text-[10px] font-bold uppercase tracking-[0.1em] ${selectedTemplate.section}`}>Summary</h2><p className="mt-1.5 whitespace-pre-line text-[10px] leading-5 text-[#394556]">{sections.summary}</p></section> : null;
  const renderEntrySections = (items: [string, ResumeEntry[]][]) => items.map(([title, entries]) => {
    const visible = entries.filter((item) => item.title || item.subtitle || item.details);
    return visible.length ? <section key={title} className="mt-5 break-inside-avoid"><h2 className={`pb-1 text-[10px] font-bold uppercase tracking-[0.1em] ${selectedTemplate.section}`}>{title}</h2><div className="mt-2 space-y-3">{visible.map((item) => <div key={item.id} className="break-inside-avoid"><div className="flex flex-wrap justify-between gap-x-4"><h3 className="text-[10px] font-semibold">{item.title}</h3>{item.subtitle && <p className="text-[9px] text-[#657185]">{item.subtitle}</p>}</div>{item.details && <p className="mt-1 whitespace-pre-line text-[9px] leading-4 text-[#465366]">{item.details}</p>}</div>)}</div></section> : null;
  });
  const creativeMainSections = printableEntrySections.filter(([title]) => title !== "Education");
  const creativeSidebarSections = printableEntrySections.filter(([title]) => title === "Education");

  return <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,.95fr)] print:block">
    <section className="space-y-4 print:hidden">
      <div className="flex flex-wrap items-end justify-between gap-3 rounded-xl border border-white/[0.08] bg-[#111621] p-4"><label className="min-w-[180px] flex-1 text-xs text-[#8d9aaf]">Resume title<input value={data.title} onChange={(event) => setData((current) => ({ ...current, title: event.target.value }))} maxLength={120} className="mt-1 h-10 w-full rounded-lg border border-white/[0.08] bg-[#0b0e17] px-3 text-sm text-white outline-none" /></label><Button type="button" variant="secondary" disabled={!available || busy} onClick={() => void save()} className="min-h-10 px-4 text-xs">{busy ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />} Save</Button><Button type="button" disabled={!available} onClick={() => window.print()} className="min-h-10 px-4 text-xs"><Printer size={15} /> Save as PDF</Button></div>
      <fieldset className="rounded-xl border border-white/[0.07] bg-[#111621] p-4"><legend className="px-1 text-sm font-semibold">Choose a template</legend><div className="grid gap-3 sm:grid-cols-2">{resumeTemplates.map((template) => <button key={template.key} type="button" aria-pressed={data.templateKey === template.key} onClick={() => setData((current) => ({ ...current, templateKey: template.key }))} className={`rounded-lg border p-3 text-left transition ${data.templateKey === template.key ? "border-[#0a66c2] bg-[#0a66c2]/[0.08] ring-1 ring-[#0a66c2]" : "border-white/[0.08] hover:border-white/[0.2]"}`}><TemplateThumbnail templateKey={template.key} /><span className="mt-2 block text-sm font-semibold">{template.name}</span><span className="mt-1 block text-xs text-[#929eb1]">{template.description}</span></button>)}</div></fieldset>
      {!available && <p className="rounded-xl border border-amber-200/15 bg-amber-100/[0.04] px-3 py-2.5 text-[10px] text-[#d7c798]">Connect PostgreSQL to save your resume builder document.</p>}
      {message && <p role="status" className="rounded-lg border border-[#5de1d5]/15 bg-[#4bdccd]/[0.04] px-3 py-2.5 text-[10px] text-[#9debe3]">{message}</p>}{error && <p role="alert" className="rounded-lg border border-rose-200/15 bg-rose-200/[0.04] px-3 py-2.5 text-[10px] text-[#e4a5ae]">{error}</p>}

      <section className="rounded-xl border border-white/[0.07] bg-[#111621] p-4"><h2 className="text-xs font-semibold">Contact</h2><div className="mt-3 grid gap-3 sm:grid-cols-2">{([ ["fullName", "Full name"], ["email", "Email"], ["phone", "Phone"], ["location", "Location"], ["website", "Website"], ["linkedin", "LinkedIn"] ] as const).map(([key, label]) => <label key={key} className="text-[9px] text-[#8d9aaf]">{label}<input value={sections.contact[key]} onChange={(event) => updateContact(key, event.target.value)} maxLength={300} className="mt-1 h-9 w-full rounded-lg border border-white/[0.08] bg-[#0b0e17] px-2.5 text-[11px] text-white outline-none focus:border-[#63e4d9]/40" /></label>)}</div></section>

      <section className="rounded-xl border border-white/[0.07] bg-[#111621] p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-xs font-semibold">Professional summary</h2><Button type="button" variant="secondary" disabled={suggestionBusy || !aiAvailable} onClick={() => void suggestSummary()} className="min-h-8 px-2.5 text-[9px]">{suggestionBusy ? <LoaderCircle size={12} className="animate-spin" /> : <Sparkles size={12} />} Suggest with AI</Button></div><label htmlFor="resume-summary" className="sr-only">Professional summary</label><textarea id="resume-summary" value={sections.summary} onChange={(event) => update("summary", event.target.value)} maxLength={1500} rows={4} placeholder="Write a concise summary based on your actual experience." className="mt-3 w-full resize-y rounded-lg border border-white/[0.08] bg-[#0b0e17] px-3 py-2.5 text-[11px] leading-5 text-white outline-none focus:border-[#63e4d9]/40" />{!aiAvailable && <p className="mt-2 text-[9px] text-[#d7c798]">Add GEMINI_API_KEY to enable AI suggestions.</p>}{suggestion && <form onSubmit={applySuggestion} className="mt-3 rounded-lg border border-[#63e4d9]/15 bg-[#4bdccd]/[0.03] p-3"><p className="text-[9px] font-semibold text-[#79e7dc]">Editable AI draft — review every claim</p><textarea value={suggestion.summarySuggestion} onChange={(event) => setSuggestion({ ...suggestion, summarySuggestion: event.target.value })} maxLength={1500} rows={4} className="mt-2 w-full rounded-lg border border-white/[0.08] bg-[#0b0e17] p-2.5 text-[10px] leading-5 text-white" />{suggestion.notes.map((note, index) => <textarea aria-label={`Editable AI note ${index + 1}`} key={index} value={note} onChange={(event) => setSuggestion({ ...suggestion, notes: suggestion.notes.map((value, noteIndex) => noteIndex === index ? event.target.value : value) })} maxLength={260} rows={2} className="mt-2 w-full rounded-lg border border-white/[0.06] bg-[#0b0e17] p-2 text-[9px] leading-4 text-[#9ba8bb]" />)}<Button type="submit" disabled={!suggestion.summarySuggestion.trim()} className="mt-2 min-h-8 px-2.5 text-[9px]">Use editable summary</Button></form>}</section>

      <section className="rounded-xl border border-white/[0.07] bg-[#111621] p-4"><h2 className="text-sm font-semibold">Skills by category</h2><p className="mt-1 text-xs leading-5 text-[#929eb1]">Enter skills in the matching group. Separate multiple skills with commas.</p><div className="mt-3 grid gap-3 sm:grid-cols-2">{resumeSkillGroupOrder.map((group) => <label key={group} htmlFor={`resume-skills-${group}`} className="text-xs font-medium text-[#aeb9c9]">{resumeSkillGroupLabels[group]}<textarea id={`resume-skills-${group}`} value={skillGroupsDraft[group].join(", ")} onChange={(event) => updateSkillGroup(group, event.target.value)} maxLength={2500} rows={3} placeholder={group === "frontend" ? "React, HTML, CSS" : group === "backend" ? "Node.js, PostgreSQL, APIs" : group === "programming" ? "JavaScript, Python, Java" : "Git, testing, problem solving"} className="mt-1.5 w-full rounded-lg border border-white/[0.08] bg-[#0b0e17] px-3 py-2.5 text-sm leading-5 text-white outline-none focus:border-[#63e4d9]/40" /></label>)}</div></section>

      {(["experience", "projects", "education", "certifications", "achievements"] as EntrySectionKey[]).map((key) => <EntryEditor key={key} section={key} entries={entries(key)} onChange={(value) => update(key, value)} />)}
    </section>

    <div className="min-w-0"><div className="mb-3 flex items-center justify-between print:hidden"><h2 className="text-sm font-semibold text-[#aab6c8]">Live preview</h2><span className="text-xs text-[#718097]">{resumeTemplates.find((template) => template.key === data.templateKey)?.name}</span></div><article className={`resume-print-preview min-h-[900px] rounded-xl border border-white/[0.1] p-7 shadow-2xl sm:p-9 ${selectedTemplate.page}`}>
      {data.templateKey === "creative" ? <div className="grid gap-5 sm:grid-cols-[minmax(140px,.72fr)_minmax(0,1.65fr)]"><aside className="rounded-xl bg-[#eaf3fc] p-4">{renderContactHeader()}{renderSkills()}{renderEntrySections(creativeSidebarSections)}</aside><div>{renderSummary()}{renderEntrySections(creativeMainSections)}</div></div> : <>{renderContactHeader()}{renderSummary()}{renderSkills()}{renderEntrySections(printableEntrySections)}</>}
      {!sections.summary && printableEntrySections.every(([, items]) => items.every((item) => !item.title && !item.subtitle && !item.details)) && visibleSkillGroups.length === 0 && <p className="mt-8 text-xs text-[#798597]">Add resume details in the editor to preview them here.</p>}
    </article></div>
  </div>;
}
