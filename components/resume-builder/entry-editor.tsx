"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import type { ResumeSections } from "@/lib/validation/resume-builder";

export type ResumeEntry = ResumeSections["education"][number];
export type EntrySectionKey = "education" | "experience" | "projects" | "certifications" | "achievements";

const config: Record<EntrySectionKey, { title: string; singular: string; firstLabel: string; secondLabel: string; detailsLabel: string }> = {
  education: { title: "Education", singular: "education", firstLabel: "Degree or qualification", secondLabel: "Institution", detailsLabel: "Field, dates, or details" },
  experience: { title: "Experience", singular: "position", firstLabel: "Role title", secondLabel: "Company and dates", detailsLabel: "Responsibilities and outcomes · one per line" },
  projects: { title: "Projects", singular: "project", firstLabel: "Project name", secondLabel: "Skills or tools", detailsLabel: "Project details" },
  certifications: { title: "Certifications", singular: "certification", firstLabel: "Certification name", secondLabel: "Issuer and date", detailsLabel: "Relevant details" },
  achievements: { title: "Achievements", singular: "achievement", firstLabel: "Achievement", secondLabel: "Context", detailsLabel: "Evidence or detail" },
};

function newEntry(): ResumeEntry {
  return { id: globalThis.crypto?.randomUUID?.() ?? `resume-${Date.now()}-${Math.random().toString(36).slice(2)}`, title: "", subtitle: "", details: "" };
}

export function EntryEditor({ section, entries, onChange }: { section: EntrySectionKey; entries: ResumeEntry[]; onChange: (entries: ResumeEntry[]) => void }) {
  const labels = config[section];
  function update(index: number, field: keyof ResumeEntry, value: string) {
    onChange(entries.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));
  }
  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= entries.length) return;
    const reordered = [...entries];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    onChange(reordered);
  }

  return <section className="rounded-xl border border-white/[0.07] bg-[#0d121c] p-4">
    <div className="flex items-center justify-between"><h3 className="text-xs font-semibold">{labels.title}</h3><button type="button" onClick={() => onChange([...entries, newEntry()])} className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-white/[0.08] px-2.5 text-[9px] text-[#91e8df] hover:bg-white/[0.04]"><Plus size={12} /> Add {labels.singular}</button></div>
    {entries.length === 0 && <p className="mt-3 text-[10px] text-[#77859a]">Nothing added yet. Use Add to include verified details.</p>}
    <div className="mt-3 space-y-3">{entries.map((item, index) => <article key={item.id} className="rounded-lg border border-white/[0.06] bg-[#0b0e17] p-3">
      <div className="mb-2 flex justify-end gap-1"><button type="button" aria-label={`Move ${labels.singular} up`} disabled={index === 0} onClick={() => move(index, -1)} className="grid size-7 place-items-center rounded border border-white/[0.07] text-[#99a6b8] disabled:opacity-30"><ArrowUp size={12} /></button><button type="button" aria-label={`Move ${labels.singular} down`} disabled={index === entries.length - 1} onClick={() => move(index, 1)} className="grid size-7 place-items-center rounded border border-white/[0.07] text-[#99a6b8] disabled:opacity-30"><ArrowDown size={12} /></button><button type="button" aria-label={`Delete ${labels.singular}`} onClick={() => onChange(entries.filter((_, itemIndex) => itemIndex !== index))} className="grid size-7 place-items-center rounded border border-rose-200/10 text-[#df9aa4]"><Trash2 size={12} /></button></div>
      <label className="block text-[9px] text-[#8d9aaf]">{labels.firstLabel}<input value={item.title} onChange={(event) => update(index, "title", event.target.value)} maxLength={160} className="mt-1 h-9 w-full rounded-lg border border-white/[0.08] bg-[#111621] px-2.5 text-[11px] text-white outline-none focus:border-[#63e4d9]/40" /></label>
      <label className="mt-2 block text-[9px] text-[#8d9aaf]">{labels.secondLabel}<input value={item.subtitle} onChange={(event) => update(index, "subtitle", event.target.value)} maxLength={200} className="mt-1 h-9 w-full rounded-lg border border-white/[0.08] bg-[#111621] px-2.5 text-[11px] text-white outline-none focus:border-[#63e4d9]/40" /></label>
      <label className="mt-2 block text-[9px] text-[#8d9aaf]">{labels.detailsLabel}<textarea value={item.details} onChange={(event) => update(index, "details", event.target.value)} maxLength={3000} rows={3} className="mt-1 w-full resize-y rounded-lg border border-white/[0.08] bg-[#111621] px-2.5 py-2 text-[11px] leading-5 text-white outline-none focus:border-[#63e4d9]/40" /></label>
    </article>)}</div>
  </section>;
}
