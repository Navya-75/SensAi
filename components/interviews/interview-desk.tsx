"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, Check, LoaderCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

type Feedback = {
  relevance: number | null;
  technicalCorrectness: number | null;
  clarity: number | null;
  structure: number | null;
  completeness: number | null;
  overallScore: number | null;
  summary: string | null;
  strengths: unknown;
  improvementAreas: unknown;
  preparationSuggestions: unknown;
};
type Question = { id: string; position: number; prompt: string; category: string | null; answer: { answerText: string } | null; evaluation: Feedback | null };
type Interview = { id: string; targetRole: string; type: string; difficulty: string; status: string; questions: Question[] };
type FinalReport = { summary: string; strengths: string[]; weaknesses: string[]; preparationSuggestions: string[] };
const interviewFontSizes = [16, 20, 24] as const;
const interviewFontSizeLabels = ["Small", "Default", "Large"] as const;

export function InterviewDesk({
  available,
  aiAvailable,
  initialRole,
  initialExperience,
  initialInterview,
}: {
  available: boolean;
  aiAvailable: boolean;
  initialRole: string;
  initialExperience: string;
  initialInterview: Interview | null;
}) {
  const [role, setRole] = useState(initialInterview?.targetRole ?? initialRole);
  const [type, setType] = useState("MIXED");
  const [difficulty, setDifficulty] = useState("INTERMEDIATE");
  const [experienceLevel, setExperienceLevel] = useState(initialExperience);
  const [questionCount, setQuestionCount] = useState(5);
  const [interview, setInterview] = useState<Interview | null>(initialInterview);
  const [textSizeIndex, setTextSizeIndex] = useState(1);
  const [answerText, setAnswerText] = useState("");
  const [finalReport, setFinalReport] = useState<FinalReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const question = interview?.questions.find((item) => !item.answer) ?? null;
  const latestFeedback = interview?.questions.filter((item) => item.evaluation).at(-1)?.evaluation ?? null;
  const interviewFontSize = interviewFontSizes[textSizeIndex];

  async function start(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(null); setFinalReport(null);
    try {
      const response = await fetch("/api/interviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetRole: role, type, experienceLevel, difficulty, questionCount }) });
      const payload = await response.json().catch(() => null) as { error?: string; interview?: Omit<Interview, "questions"> & { questions: Omit<Question, "answer" | "evaluation">[] } } | null;
      if (!response.ok || !payload?.interview) { setError(payload?.error ?? "The interview could not be started."); return; }
      setInterview({ ...payload.interview, questions: payload.interview.questions.map((item) => ({ ...item, answer: null, evaluation: null })) });
      setAnswerText("");
    } catch { setError("We could not reach SENSAI. Check your connection and try again."); }
    finally { setBusy(false); }
  }

  async function submitAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!interview || !question || busy) return;
    setBusy(true); setError(null);
    try {
      const response = await fetch(`/api/interviews/${encodeURIComponent(interview.id)}/answers`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ questionId: question.id, answerText }) });
      const payload = await response.json().catch(() => null) as { error?: string; evaluation?: Feedback; nextQuestion?: { id: string }; completed?: boolean; finalReport?: FinalReport | null } | null;
      if (!response.ok || !payload?.evaluation) { setError(payload?.error ?? "Your answer could not be evaluated."); return; }
      setInterview((current) => current ? ({ ...current, status: payload.completed ? "COMPLETED" : current.status, questions: current.questions.map((item) => item.id === question.id ? { ...item, answer: { answerText }, evaluation: payload.evaluation! } : item) }) : current);
      setFinalReport(payload.finalReport ?? null);
      setAnswerText("");
    } catch { setError("We could not reach SENSAI. Your answer was not submitted."); }
    finally { setBusy(false); }
  }

  if (!available) return <p className="rounded-xl border border-amber-300/15 bg-amber-200/[0.045] p-4 text-xs leading-5 text-[#d7c798]">Connect PostgreSQL to save interview sessions and feedback.</p>;
  if (!interview) return <section className="rounded-2xl border border-white/[0.08] bg-[#111621] p-5 sm:p-7">
    <form onSubmit={start} className="grid gap-4 md:grid-cols-2">
      <label className="md:col-span-2 text-[10px] text-[#9ba8bb]">Target role<input value={role} onChange={(event) => setRole(event.target.value)} required minLength={2} maxLength={120} className="mt-1.5 h-10 w-full rounded-lg border border-white/[0.08] bg-[#0b0e17] px-3 text-xs text-white outline-none" /></label>
      <label className="text-[10px] text-[#9ba8bb]">Interview type<select value={type} onChange={(event) => setType(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-white/[0.08] bg-[#0b0e17] px-3 text-xs text-white">{[["TECHNICAL", "Technical"], ["HR", "HR"], ["BEHAVIORAL", "Behavioral"], ["MIXED", "Mixed"]].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label className="text-[10px] text-[#9ba8bb]">Difficulty<select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-white/[0.08] bg-[#0b0e17] px-3 text-xs text-white">{[["BEGINNER", "Beginner"], ["INTERMEDIATE", "Intermediate"], ["ADVANCED", "Advanced"]].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label className="text-[10px] text-[#9ba8bb]">Experience level<select value={experienceLevel} onChange={(event) => setExperienceLevel(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-white/[0.08] bg-[#0b0e17] px-3 text-xs text-white">{[["EXPLORING", "Exploring"], ["STUDENT", "Student"], ["ENTRY_LEVEL", "Entry level"], ["EARLY_CAREER", "Early career"], ["MID_CAREER", "Mid career"], ["SENIOR", "Senior"]].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label className="text-[10px] text-[#9ba8bb]">Questions<select value={questionCount} onChange={(event) => setQuestionCount(Number(event.target.value))} className="mt-1.5 h-10 w-full rounded-lg border border-white/[0.08] bg-[#0b0e17] px-3 text-xs text-white">{[3, 5, 7, 10].map((count) => <option key={count} value={count}>{count}</option>)}</select></label>
      <div className="md:col-span-2"><Button type="submit" disabled={busy || !aiAvailable || role.trim().length < 2} className="min-h-10 px-4 text-xs">{busy ? <><LoaderCircle size={14} className="animate-spin" /> Preparing questions…</> : <><Sparkles size={14} /> Start interview</>}</Button>{!aiAvailable && <p className="mt-2 text-[9px] text-[#d7c798]">Add GEMINI_API_KEY to enable interviews.</p>}</div>
    </form>
    {error && <p role="alert" className="mt-4 text-[11px] text-[#e4a5ae]">{error}</p>}
  </section>;

  const answeredCount = interview.questions.filter((item) => item.answer).length;
  return <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
    <section className="rounded-2xl border border-white/[0.08] bg-[#111621] p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#73e8dc]">{interview.type} · {interview.difficulty}</p><h2 className="mt-1.5 text-base font-semibold">{interview.targetRole}</h2></div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/[0.08] px-3 py-1.5 text-[9px] text-[#9aa7ba]">Question {Math.min(answeredCount + 1, interview.questions.length)} of {interview.questions.length}</span>
          <div role="group" aria-label="Interview text size" className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.025] px-1.5 py-1">
            <span className="px-1 text-[9px] text-[#9ba8bb]">Text</span>
            <button type="button" onClick={() => setTextSizeIndex((current) => Math.max(0, current - 1))} disabled={textSizeIndex === 0} aria-label="Decrease interview text size" className="grid size-7 place-items-center rounded-md text-xs font-semibold hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50">A−</button>
            <output aria-live="polite" className="min-w-12 text-center text-[9px] text-[#695743]">{interviewFontSizeLabels[textSizeIndex]}</output>
            <button type="button" onClick={() => setTextSizeIndex((current) => Math.min(interviewFontSizes.length - 1, current + 1))} disabled={textSizeIndex === interviewFontSizes.length - 1} aria-label="Increase interview text size" className="grid size-7 place-items-center rounded-md text-xs font-semibold hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50">A+</button>
          </div>
        </div>
      </div>
      {error && <p role="alert" className="mt-4 rounded-lg border border-rose-200/15 bg-rose-200/[0.04] px-3 py-2.5 text-[10px] text-[#e4a5ae]">{error}</p>}
      {question ? <><article className="mt-6 rounded-xl border border-white/[0.07] bg-[#0b0e17] p-4 sm:p-5"><p className="text-[9px] uppercase tracking-[0.12em] text-[#748197]">Question {question.position}{question.category ? ` · ${question.category}` : ""}</p><h3 style={{ fontSize: `${interviewFontSize}px`, lineHeight: 1.55 }} className="mt-3 text-sm text-[#e5ebf4]">{question.prompt}</h3></article><form onSubmit={submitAnswer} className="mt-4"><label htmlFor="interview-answer" className="text-[10px] text-[#9ba8bb]">Your answer<textarea id="interview-answer" required minLength={10} maxLength={8000} value={answerText} onChange={(event) => setAnswerText(event.target.value)} rows={9} placeholder="Answer in your own words. Use a real example when relevant." style={{ fontSize: `${interviewFontSize}px`, lineHeight: 1.6 }} className="mt-2 w-full resize-y rounded-xl border border-white/[0.08] bg-[#0b0e17] p-3.5 leading-6 text-white outline-none focus:border-[#63e4d9]/40" /></label><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><span className="text-[9px] text-[#718097]">Your answer is saved with this private interview session.</span><Button type="submit" disabled={busy || answerText.trim().length < 10} className="min-h-10 px-4 text-xs">{busy ? <><LoaderCircle size={14} className="animate-spin" /> Evaluating…</> : <>Submit answer <ArrowRight size={13} /></>}</Button></div></form></> : <div className="rounded-xl border border-[#63e4d9]/15 bg-[#4bdccd]/[0.03] p-5"><Check size={17} className="text-[#73e8dc]" /><h3 className="mt-3 text-sm font-semibold">All questions answered</h3><p className="mt-1 text-[10px] text-[#8996aa]">Your final report is saved in interview history.</p><div className="mt-3 flex gap-4"><Link href="/interview/history" className="text-[10px] text-[#73e8dc]">Open history →</Link><button type="button" onClick={() => { setInterview(null); setFinalReport(null); }} className="text-[10px] text-[#9ba8bb]">Start another</button></div></div>}
      {finalReport && <section className="mt-6 rounded-xl border border-[#63e4d9]/15 bg-[#4bdccd]/[0.035] p-4"><h3 className="text-xs font-semibold">Final report</h3><p className="mt-2 text-[11px] leading-5 text-[#aeb9c9]">{finalReport.summary}</p><div className="mt-4 grid gap-3 sm:grid-cols-3">{[["Strengths", finalReport.strengths], ["Areas to improve", finalReport.weaknesses], ["Preparation", finalReport.preparationSuggestions]].map(([title, items]) => <div key={title as string}><h4 className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#8d9aaf]">{title as string}</h4><ul className="mt-2 space-y-1.5 text-[10px] leading-5 text-[#aab5c6]">{(items as string[]).map((item) => <li key={item}>· {item}</li>)}</ul></div>)}</div></section>}
      {latestFeedback && <section className="mt-5 rounded-xl border border-white/[0.07] p-4"><h3 className="text-xs font-semibold">Last answer feedback</h3><p className="mt-2 text-[10px] leading-5 text-[#aab5c6]">{latestFeedback.summary}</p><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">{[["Relevance", latestFeedback.relevance], ["Correctness", latestFeedback.technicalCorrectness], ["Clarity", latestFeedback.clarity], ["Structure", latestFeedback.structure], ["Completeness", latestFeedback.completeness]].map(([label, score]) => <div key={label as string} className="rounded-lg bg-white/[0.025] p-2 text-center"><p className="text-sm font-semibold text-[#75e5db]">{score ?? "—"}/5</p><p className="mt-1 text-[8px] text-[#8190a5]">{label as string}</p></div>)}</div></section>}
    </section>
    <aside className="h-fit rounded-2xl border border-white/[0.08] bg-[#111621] p-4"><h2 className="text-xs font-semibold">Session progress</h2><div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.07]"><div className="h-full bg-[#59dfd3]" style={{ width: `${Math.round((answeredCount / interview.questions.length) * 100)}%` }} /></div><p className="mt-2 text-[9px] text-[#8290a5]">{answeredCount} of {interview.questions.length} completed</p><ol className="mt-4 space-y-2">{interview.questions.map((item) => <li key={item.id} className="flex gap-2 text-[9px] leading-4 text-[#8996aa]"><span className={item.answer ? "text-[#73e8dc]" : "text-[#68758a]"}>{item.answer ? "✓" : "•"}</span><span className="line-clamp-2">{item.prompt}</span></li>)}</ol><Link href="/interview/history" className="mt-4 block border-t border-white/[0.07] pt-3 text-[9px] text-[#73e8dc]">View past sessions</Link></aside>
  </div>;
}
