"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Question = { id: string; topic: string; question: string; options: string[]; difficulty: string };
type AnswerResult = { isCorrect: boolean; correctOptionIndex: number; explanation: string };

export function McqDesk() {
  const [topics, setTopics] = useState<string[]>([]);
  const [topic, setTopic] = useState("");
  const [question, setQuestion] = useState<Question | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [stats, setStats] = useState({ answered: 0, correct: 0 });
  const [completed, setCompleted] = useState(false);
  const [replayMode, setReplayMode] = useState(false);
  const [excludedIds, setExcludedIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadQuestion = useCallback(async (nextTopic: string, replay = false, excluded: string[] = []) => {
    setBusy(true); setError(null); setResult(null); setSelected(null); setQuestion(null); setCompleted(false);
    try {
      const params = new URLSearchParams();
      if (nextTopic) params.set("topic", nextTopic);
      if (replay) params.set("replay", "1");
      if (excluded.length) params.set("exclude", excluded.join(","));
      const query = params.size ? `?${params.toString()}` : "";
      const response = await fetch(`/api/practice/mcq${query}`, { cache: "no-store" });
      const payload = await response.json() as { error?: string; topics?: string[]; question?: Question | null; completed?: boolean; stats?: typeof stats };
      if (!response.ok) throw new Error(payload.error ?? "Questions could not be loaded.");
      setTopics(payload.topics ?? []); setQuestion(payload.question ?? null); setStats(payload.stats ?? { answered: 0, correct: 0 });
      setCompleted(Boolean(payload.completed)); setExcludedIds(excluded);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Questions could not be loaded."); }
    finally { setBusy(false); }
  }, []);

  useEffect(() => { void loadQuestion("", false, []); }, [loadQuestion]);

  async function submitAnswer() {
    if (!question || selected === null || busy) return;
    setBusy(true); setError(null);
    try {
      const response = await fetch(`/api/practice/mcq/${encodeURIComponent(question.id)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ selectedOptionIndex: selected }) });
      const payload = await response.json() as { error?: string; result?: AnswerResult };
      if (!response.ok || !payload.result) throw new Error(payload.error ?? "Your answer could not be saved.");
      setResult(payload.result);
      await loadStats();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Your answer could not be saved."); }
    finally { setBusy(false); }
  }

  async function loadStats() {
    const query = topic ? `?topic=${encodeURIComponent(topic)}` : "";
    const response = await fetch(`/api/practice/mcq${query}`, { cache: "no-store" });
    const payload = await response.json() as { stats?: typeof stats };
    if (payload.stats) setStats(payload.stats);
  }

  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-[#111621] p-4"><label className="text-[10px] text-[#9ba8bb]">Topic<select value={topic} onChange={(event) => { const value = event.target.value; setTopic(value); setReplayMode(false); setExcludedIds([]); void loadQuestion(value, false, []); }} className="ml-2 min-h-9 rounded-lg border border-white/[0.1] bg-[#0b0e17] px-3 text-[10px] text-white"><option value="">All topics</option>{topics.map((item) => <option key={item}>{item}</option>)}</select></label><p className="text-[10px] text-[#9ba8bb]" aria-live="polite">Answered {stats.answered} · Correct {stats.correct}{stats.answered ? ` · ${Math.round(stats.correct / stats.answered * 100)}% accuracy` : ""}</p></div>
    {error && <p role="alert" className="rounded-lg border border-rose-200/15 bg-rose-200/[0.04] px-3 py-2.5 text-[10px] text-[#e4a5ae]">{error}</p>}
    {busy && !question && <div role="status" className="rounded-2xl border border-white/[0.08] bg-[#111621] p-6 text-xs text-[#9ba8bb]">Loading practice question…</div>}
    {!busy && !question && !error && <div className="rounded-2xl border border-white/[0.08] bg-[#111621] p-6"><h2 className="text-sm font-semibold">{completed ? replayMode ? "You finished this practice round" : "You’ve completed this question set" : "No questions are available yet"}</h2><p className="mt-2 text-xs leading-5 text-[#9ba8bb]">{completed ? "You’ve reached the end of the available questions. Start a fresh round or choose another topic." : <>Run <code>npm run db:seed</code> after configuring the database to add the sample question set.</>}</p>{completed && <div className="mt-4 flex flex-wrap gap-2"><Button type="button" variant="secondary" onClick={() => { setReplayMode(true); void loadQuestion(topic, true, []); }} className="min-h-10 px-4 text-xs">Repeat this set</Button>{topic && <Button type="button" variant="secondary" onClick={() => { setTopic(""); setReplayMode(false); setExcludedIds([]); void loadQuestion("", false, []); }} className="min-h-10 px-4 text-xs">Continue with all topics</Button>}</div>}</div>}
    {question && <section className="rounded-2xl border border-white/[0.08] bg-[#111621] p-5 sm:p-7"><div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.12em] text-[#73e8dc]"><span>{question.topic}</span><span aria-hidden="true">·</span><span>{question.difficulty}</span><span aria-hidden="true">·</span><span>Sample practice</span></div><h2 className="mt-3 text-base font-semibold leading-7">{question.question}</h2><fieldset className="mt-5 space-y-2.5"><legend className="sr-only">Choose an answer</legend>{question.options.map((option, index) => { const isCorrect = result?.correctOptionIndex === index; const isWrongSelection = result && selected === index && !result.isCorrect; return <label key={`${question.id}-${index}`} className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-3 text-xs leading-5 transition ${isCorrect ? "border-emerald-300/30 bg-emerald-200/[0.05]" : isWrongSelection ? "border-rose-200/25 bg-rose-200/[0.04]" : selected === index ? "border-[#63e4d9]/30 bg-[#63e4d9]/[0.05]" : "border-white/[0.07] bg-[#0b0e17] hover:border-white/[0.15]"}`}><input type="radio" name="mcq-answer" value={index} checked={selected === index} disabled={Boolean(result) || busy} onChange={() => setSelected(index)} className="mt-1 accent-[#63e4d9]" /><span>{option}{isCorrect ? <span className="ml-2 text-emerald-200">Correct answer</span> : null}</span></label>; })}</fieldset>
      {result && <div role="status" className="mt-4 rounded-xl border border-white/[0.07] bg-[#0b0e17] p-4"><p className={`text-xs font-semibold ${result.isCorrect ? "text-emerald-200" : "text-[#f0c9a1]"}`}>{result.isCorrect ? "Correct" : "Not quite"}</p><p className="mt-2 text-[10px] leading-5 text-[#a5b1c3]">{result.explanation}</p></div>}
      <div className="mt-5 flex flex-wrap gap-2"><Button type="button" onClick={() => void submitAnswer()} disabled={selected === null || Boolean(result) || busy} className="min-h-10 px-4 text-xs">Check answer</Button>{result && <Button type="button" variant="secondary" onClick={() => void loadQuestion(topic, replayMode, [...new Set([...excludedIds, question.id])])} disabled={busy} className="min-h-10 px-4 text-xs">Next question</Button>}</div>
    </section>}
  </div>;
}
