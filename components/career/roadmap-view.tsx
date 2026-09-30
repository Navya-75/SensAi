"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Check, LoaderCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

type RoadmapData = {
  id: string;
  targetRole: string;
  title: string;
  description: string;
  phases: {
    id: string;
    title: string;
    description: string;
    skills: string[];
    resources: string[];
    tasks: { id: string; title: string; description: string; status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" }[];
  }[];
};

export function CareerRoadmapView({
  available,
  aiAvailable,
  initialRole,
  initialRoadmap,
}: {
  available: boolean;
  aiAvailable: boolean;
  initialRole: string;
  initialRoadmap: RoadmapData | null;
}) {
  const router = useRouter();
  const [role, setRole] = useState(initialRoadmap?.targetRole ?? initialRole);
  const [roadmap, setRoadmap] = useState(initialRoadmap);
  const [busy, setBusy] = useState(false);
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const tasks = roadmap?.phases.flatMap((phase) => phase.tasks) ?? [];
  const completedCount = tasks.filter((task) => task.status === "COMPLETED").length;
  const progress = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;

  async function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/career/roadmap", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetRole: role }) });
      const payload = await response.json().catch(() => null) as { error?: string; roadmapId?: string } | null;
      if (!response.ok || !payload?.roadmapId) { setError(payload?.error ?? "The roadmap could not be generated."); return; }
      router.refresh();
      window.location.assign("/career/roadmap");
    } catch {
      setError("We could not reach SENSAI. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleTask(taskId: string, completed: boolean) {
    if (!roadmap || pendingTaskId) return;
    setPendingTaskId(taskId);
    setError(null);
    try {
      const response = await fetch(`/api/career/roadmap/tasks/${encodeURIComponent(taskId)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ completed }) });
      const payload = await response.json().catch(() => null) as { error?: string; task?: { id: string; status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" } } | null;
      if (!response.ok || !payload?.task) { setError(payload?.error ?? "Progress could not be saved."); return; }
      setRoadmap((current) => current ? ({ ...current, phases: current.phases.map((phase) => ({ ...phase, tasks: phase.tasks.map((task) => task.id === taskId ? { ...task, status: payload!.task!.status } : task) })) }) : current);
    } catch {
      setError("We could not save progress. Check your connection and try again.");
    } finally {
      setPendingTaskId(null);
    }
  }

  if (!roadmap) return <section className="rounded-2xl border border-white/[0.08] bg-[#111621] p-5 sm:p-7">
    <div className="mx-auto max-w-xl py-7 text-center"><span className="mx-auto grid size-11 place-items-center rounded-xl border border-[#59ded3]/15 bg-[#4bdccd]/[0.06] text-[#70e6da]"><Sparkles size={18} /></span><h2 className="mt-4 text-base font-semibold">Build your first roadmap</h2><p className="mt-2 text-xs leading-5 text-[#8794a9]">SENSAI will create five practical phases using your saved skills, profile, and target role.</p>
      <form onSubmit={generate} className="mt-5 flex flex-col gap-2 sm:flex-row"><label className="sr-only" htmlFor="roadmap-role">Target role</label><input id="roadmap-role" value={role} onChange={(event) => setRole(event.target.value)} required minLength={2} maxLength={120} placeholder="Target role" className="h-11 min-w-0 flex-1 rounded-xl border border-white/[0.1] bg-[#0b0e17] px-3.5 text-xs outline-none placeholder:text-[#657187] focus:border-[#63e4d9]/50" /><Button disabled={busy || !available || !aiAvailable} className="min-h-11 px-4 text-xs">{busy ? <><LoaderCircle size={14} className="animate-spin" /> Building…</> : "Generate roadmap"}</Button></form>
      {!available && <p className="mt-4 text-[10px] text-[#d7c798]">Connect PostgreSQL to save a roadmap.</p>}{!aiAvailable && <p className="mt-2 text-[10px] text-[#d7c798]">Gemini is not configured. Add GEMINI_API_KEY to enable generation.</p>}{error && <p role="alert" className="mt-4 text-[11px] text-[#e4a5ae]">{error}</p>}
      <div className="mt-5 flex justify-center gap-4 text-[10px]"><Link href="/career/skills" className="text-[#72e5db]">Review skill gaps <ArrowUpRight size={11} className="inline" /></Link><Link href="/onboarding" className="text-[#9aa7ba]">Update profile</Link></div>
    </div>
  </section>;

  return <div className="space-y-5">
    <section className="rounded-2xl border border-[#63e4d9]/15 bg-[#111621] p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#73e8dc]">Roadmap for</p><h2 className="mt-2 text-lg font-semibold">{roadmap.title}</h2><p className="mt-1 text-xs text-[#97a4b7]">{roadmap.targetRole}</p></div><Button type="button" variant="secondary" disabled={busy || !aiAvailable} onClick={() => { setRoadmap(null); setError(null); }} className="min-h-9 px-3 text-[10px]">Create another plan</Button></div><p className="mt-4 max-w-3xl text-xs leading-6 text-[#a9b4c5]">{roadmap.description}</p><div className="mt-5 flex items-center justify-between text-[10px]"><span className="text-[#8997ac]">{completedCount} of {tasks.length} tasks complete</span><span className="font-semibold text-[#72e5db]">{progress}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.07]"><div className="h-full rounded-full bg-[#59dfd3] transition-[width]" style={{ width: `${progress}%` }} /></div>{error && <p role="alert" className="mt-4 text-[11px] text-[#e4a5ae]">{error}</p>}</section>
    <div className="space-y-3">{roadmap.phases.map((phase, index) => <details key={phase.id} open={index === 0} className="group rounded-2xl border border-white/[0.08] bg-[#111621]"><summary className="flex cursor-pointer list-none items-center gap-4 p-4 sm:p-5"><span className="grid size-8 shrink-0 place-items-center rounded-full border border-[#63e4d9]/20 text-[10px] font-semibold text-[#72e5db]">{String(index + 1).padStart(2, "0")}</span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{phase.title}</span><span className="mt-1 block truncate text-[10px] text-[#8290a5]">{phase.description}</span></span><span className="text-[9px] text-[#8190a5]">{phase.tasks.filter((task) => task.status === "COMPLETED").length}/{phase.tasks.length}</span></summary><div className="border-t border-white/[0.06] px-4 pb-5 pt-4 sm:px-5"><p className="text-xs leading-6 text-[#a9b4c5]">{phase.description}</p>{phase.skills.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{phase.skills.map((skill) => <span key={skill} className="rounded-md border border-white/[0.07] px-2 py-1 text-[9px] text-[#9aa8bc]">{skill}</span>)}</div>}<ul className="mt-4 space-y-2">{phase.tasks.map((task) => <li key={task.id} className="flex gap-3 rounded-xl border border-white/[0.055] bg-white/[0.015] p-3"><label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3"><input type="checkbox" checked={task.status === "COMPLETED"} disabled={pendingTaskId === task.id} onChange={(event) => void toggleTask(task.id, event.target.checked)} className="sr-only" /><span aria-hidden="true" className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded border ${task.status === "COMPLETED" ? "border-[#62e4d8] bg-[#62e4d8] text-[#071312]" : "border-white/20 text-transparent"}`}>{pendingTaskId === task.id ? <LoaderCircle size={11} className="animate-spin text-[#72e5db]" /> : <Check size={11} />}</span><span><span className={`block text-[11px] font-medium ${task.status === "COMPLETED" ? "text-[#7f8ca1] line-through" : "text-[#dce4ef]"}`}>{task.title}</span><span className="mt-1 block text-[10px] leading-5 text-[#8996aa]">{task.description}</span></span></label><span className="sr-only">{task.status === "COMPLETED" ? "Completed" : "Not completed"}</span></li>)}</ul>{phase.resources.length > 0 && <div className="mt-4"><h3 className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#718097]">Suggested resources to verify</h3><ul className="mt-2 flex flex-wrap gap-2">{phase.resources.map((resource) => <li key={resource} className="rounded-lg border border-white/[0.06] px-2.5 py-1.5 text-[9px] text-[#8996aa]">{resource}</li>)}</ul></div>}</div></details>)}</div>
    <div className="flex flex-wrap gap-3 rounded-xl border border-white/[0.07] p-4 text-[10px]"><Link href="/career/skills" className="text-[#72e5db]">Revisit skill gaps <ArrowUpRight size={11} className="inline" /></Link><Link href="/jobs" className="text-[#a1aec0]">Find matching jobs <ArrowUpRight size={11} className="inline" /></Link><Link href="/interview/mock" className="text-[#a1aec0]">Practice an interview <ArrowUpRight size={11} className="inline" /></Link></div>
  </div>;
}
