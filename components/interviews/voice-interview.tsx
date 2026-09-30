"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { Check, LoaderCircle, Mic, MicOff, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BrowserSpeechRecognitionAdapter } from "@/lib/voice/provider";

type VoiceWindow = Window & { SpeechRecognition?: new () => BrowserSpeechRecognitionAdapter; webkitSpeechRecognition?: new () => BrowserSpeechRecognitionAdapter };
type InterviewQuestion = { id: string; position: number; prompt: string; category: string | null; answer: null | { answerText: string } };
type ActiveSession = { interviewId: string; voiceSessionId: string; targetRole: string; questions: InterviewQuestion[] };
type Evaluation = { relevance: number; technicalCorrectness: number; clarity: number; structure: number; completeness: number; summary: string };
type FinalReport = { summary: string; strengths: string[]; weaknesses: string[]; preparationSuggestions: string[] };
type RecognitionResultEvent = Event & { resultIndex: number; results: { length: number; [index: number]: { isFinal: boolean; 0: { transcript: string } } } };

export function VoiceInterview({ available, aiAvailable }: { available: boolean; aiAvailable: boolean }) {
  const recognizer = useRef<BrowserSpeechRecognitionAdapter | null>(null);
  const [supported, setSupported] = useState(false);
  const [role, setRole] = useState("");
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [transcript, setTranscript] = useState("");
  const [transcriptHistory, setTranscriptHistory] = useState("");
  const [interim, setInterim] = useState("");
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Evaluation | null>(null);
  const [finalReport, setFinalReport] = useState<FinalReport | null>(null);

  useEffect(() => {
    const browserWindow = window as VoiceWindow;
    setSupported(Boolean(browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition));
    return () => recognizer.current?.stop();
  }, []);

  async function startInterview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(null); setNotice(null);
    try {
      const response = await fetch("/api/interviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetRole: role, type: "MIXED", experienceLevel: "EXPLORING", difficulty: "INTERMEDIATE", questionCount: 3 }) });
      const payload = await response.json().catch(() => null) as { error?: string; interview?: { id: string; targetRole: string; questions: Omit<InterviewQuestion, "answer">[] } } | null;
      if (!response.ok || !payload?.interview) { setError(payload?.error ?? "The voice interview could not start."); return; }
      const voiceResponse = await fetch("/api/voice-sessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ interviewId: payload.interview.id }) });
      const voicePayload = await voiceResponse.json().catch(() => null) as { error?: string; session?: { id: string } } | null;
      if (!voiceResponse.ok || !voicePayload?.session) { setError(voicePayload?.error ?? "The voice session could not be created."); return; }
      setSession({ interviewId: payload.interview.id, voiceSessionId: voicePayload.session.id, targetRole: payload.interview.targetRole, questions: payload.interview.questions.map((item) => ({ ...item, answer: null })) });
      setTranscript(""); setTranscriptHistory(""); setFeedback(null); setFinalReport(null);
    } catch { setError("We could not reach SENSAI. Check your connection and try again."); }
    finally { setBusy(false); }
  }

  async function updateVoiceSession(status: "CREATED" | "RECORDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED", transcriptText?: string) {
    if (!session) return;
    const response = await fetch(`/api/voice-sessions/${encodeURIComponent(session.voiceSessionId)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, ...(transcriptText !== undefined ? { transcriptText } : {}) }) });
    const payload = await response.json().catch(() => null) as { error?: string } | null;
    if (!response.ok) throw new Error(payload?.error ?? "Voice session could not be updated.");
  }

  function startRecording() {
    if (!session || recording) return;
    setError(null); setNotice(null); setInterim("");
    const browserWindow = window as VoiceWindow;
    const SpeechRecognition = browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) { setError("Speech recognition is not available in this browser. Use the text interview instead."); return; }
    try {
      const instance = new SpeechRecognition();
      instance.continuous = true;
      instance.interimResults = true;
      instance.lang = navigator.language || "en-US";
      instance.onresult = (rawEvent) => {
        const event = rawEvent as RecognitionResultEvent;
        let finalText = "";
        let interimText = "";
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const item = event.results[index];
          if (item.isFinal) finalText += item[0].transcript;
          else interimText += item[0].transcript;
        }
        if (finalText) setTranscript((current) => `${current}${current && !current.endsWith(" ") ? " " : ""}${finalText}`.trimStart());
        setInterim(interimText);
      };
      instance.onerror = (rawEvent) => {
        const errorType = (rawEvent as Event & { error?: string }).error;
        if (errorType === "not-allowed" || errorType === "service-not-allowed") setError("Microphone or speech-recognition permission was denied. Allow access in your browser settings or use the text interview.");
        else if (errorType === "audio-capture") setError("No microphone was found. Connect one or use the text interview.");
        else if (errorType !== "no-speech" && errorType !== "aborted") setError("Speech recognition stopped unexpectedly. Try again or use the text interview.");
      };
      instance.onend = () => { setRecording(false); setInterim(""); };
      instance.start();
      recognizer.current = instance;
      setRecording(true);
      void updateVoiceSession("RECORDING").catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Voice session could not be updated."));
    } catch {
      setError("The microphone could not be started. Check browser permission and try again.");
    }
  }

  async function stopRecording() {
    recognizer.current?.stop();
    setRecording(false);
    setInterim("");
    try { await updateVoiceSession("PROCESSING"); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Voice session could not be updated."); }
  }

  async function submitAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session || busy) return;
    const question = session.questions.find((item) => !item.answer);
    if (!question) return;
    setBusy(true); setError(null); setNotice(null);
    try {
      await updateVoiceSession("PROCESSING");
      const response = await fetch(`/api/interviews/${encodeURIComponent(session.interviewId)}/answers`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ questionId: question.id, answerText: transcript }) });
      const payload = await response.json().catch(() => null) as { error?: string; evaluation?: Evaluation; completed?: boolean; finalReport?: FinalReport | null } | null;
      if (!response.ok || !payload?.evaluation) { setError(payload?.error ?? "The answer could not be evaluated."); return; }
      const updatedTranscript = [transcriptHistory, `Q${question.position}: ${question.prompt}\nA: ${transcript}`].filter(Boolean).join("\n\n");
      await updateVoiceSession(payload.completed ? "COMPLETED" : "CREATED", updatedTranscript.slice(-8000));
      setTranscriptHistory(updatedTranscript);
      setSession((current) => current ? ({ ...current, questions: current.questions.map((item) => item.id === question.id ? { ...item, answer: { answerText: transcript } } : item) }) : current);
      setFeedback(payload.evaluation);
      setFinalReport(payload.finalReport ?? null);
      setTranscript("");
      setNotice(payload.completed ? "Voice interview complete. Your report is saved in history." : "Answer saved. Continue to the next question when ready.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The answer could not be saved. Check your connection and retry.");
    } finally { setBusy(false); }
  }

  async function endSession() {
    recognizer.current?.stop();
    setRecording(false);
    try { await updateVoiceSession("CANCELLED"); setSession(null); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "The voice session could not be closed."); }
  }

  const question = session?.questions.find((item) => !item.answer) ?? null;
  const completedCount = session?.questions.filter((item) => item.answer).length ?? 0;

  return <div className="space-y-5">
    <div className="rounded-xl border border-white/[0.07] bg-[#111621] p-4 text-[10px] leading-5 text-[#8996aa]">Speech recognition runs through your browser or its configured speech service. SENSAI does not receive or store microphone audio; submitted transcripts and answers are saved with your interview session.</div>
    {!supported && <div role="status" className="rounded-xl border border-amber-200/15 bg-amber-100/[0.04] p-4 text-[10px] leading-5 text-[#d7c798]">This browser does not expose the Web Speech Recognition API. Try a supported browser or use the <Link href="/interview/mock" className="text-[#73e8dc]">text interview</Link>.</div>}
    {error && <p role="alert" className="rounded-lg border border-rose-200/15 bg-rose-200/[0.04] px-3 py-2.5 text-[10px] leading-5 text-[#e4a5ae]">{error}</p>}{notice && <p role="status" className="rounded-lg border border-[#5de1d5]/15 bg-[#4bdccd]/[0.04] px-3 py-2.5 text-[10px] text-[#9debe3]">{notice}</p>}
    {!session && <form onSubmit={startInterview} className="rounded-2xl border border-white/[0.08] bg-[#111621] p-5 sm:p-6"><label className="block text-[10px] text-[#9ba8bb]">Target role<input value={role} onChange={(event) => setRole(event.target.value)} required minLength={2} maxLength={120} placeholder="e.g. Data analyst" className="mt-1.5 h-10 w-full rounded-lg border border-white/[0.08] bg-[#0b0e17] px-3 text-xs text-white outline-none" /></label><div className="mt-4 flex flex-wrap items-center gap-3"><Button type="submit" disabled={!available || !aiAvailable || !supported || busy || role.trim().length < 2} className="min-h-10 px-4 text-xs">{busy ? <><LoaderCircle size={14} className="animate-spin" /> Preparing voice interview…</> : <><Sparkles size={14} /> Start 3-question voice interview</>}</Button>{!available && <span className="text-[9px] text-[#d7c798]">Connect PostgreSQL.</span>}{!aiAvailable && <span className="text-[9px] text-[#d7c798]">Gemini is not configured.</span>}</div></form>}
    {session && <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]"><section className="rounded-2xl border border-white/[0.08] bg-[#111621] p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-[#73e8dc]">Voice session</p><h2 className="mt-1.5 text-sm font-semibold">{session.targetRole}</h2></div><button type="button" onClick={() => void endSession()} disabled={busy || recording} className="text-[9px] text-[#929fb2] hover:text-white">End session</button></div>
      {question ? <><article className="mt-5 rounded-xl border border-white/[0.07] bg-[#0b0e17] p-4"><p className="text-[9px] uppercase tracking-[0.1em] text-[#748197]">Question {question.position}</p><h3 className="mt-2 text-sm leading-6">{question.prompt}</h3></article><div className="mt-4 flex flex-wrap gap-2"><Button type="button" variant={recording ? "secondary" : "primary"} disabled={!supported || busy} onClick={recording ? () => void stopRecording() : startRecording} className="min-h-10 px-3 text-[10px]">{recording ? <><MicOff size={14} /> Stop recording</> : <><Mic size={14} /> Start recording</>}</Button><span role="status" className="self-center text-[9px] text-[#8290a5]">{recording ? "Listening…" : "Microphone is off"}</span></div><form onSubmit={submitAnswer} className="mt-4"><label htmlFor="voice-transcript" className="text-[10px] text-[#9ba8bb]">Transcript · edit before submitting<textarea id="voice-transcript" required minLength={10} maxLength={8000} value={`${transcript}${interim ? `${transcript ? " " : ""}${interim}` : ""}`} onChange={(event) => { setTranscript(event.target.value); setInterim(""); }} rows={8} placeholder="Start recording or type your answer here." className="mt-2 w-full resize-y rounded-xl border border-white/[0.08] bg-[#0b0e17] p-3.5 text-xs leading-6 text-white outline-none focus:border-[#63e4d9]/40" /></label><Button type="submit" disabled={busy || recording || transcript.trim().length < 10} className="mt-3 min-h-10 px-4 text-xs">{busy ? <><LoaderCircle size={14} className="animate-spin" /> Evaluating…</> : "Submit answer"}</Button></form></> : <div className="rounded-xl border border-[#63e4d9]/15 p-5"><Check size={18} className="text-[#73e8dc]" /><h3 className="mt-3 text-sm font-semibold">Voice interview complete</h3><p className="mt-1 text-[10px] leading-5 text-[#8e9cb1]">Your answers and feedback are saved in <Link href="/interview/history" className="text-[#73e8dc]">interview history</Link>.</p><button type="button" onClick={() => setSession(null)} className="mt-3 text-[10px] text-[#aab6c8]">Start another session</button></div>}
      {feedback && <div className="mt-5 rounded-xl border border-white/[0.07] p-4"><h3 className="text-xs font-semibold">Answer feedback</h3><p className="mt-2 text-[10px] leading-5 text-[#aab5c6]">{feedback.summary}</p><div className="mt-3 flex flex-wrap gap-2">{[["Relevance", feedback.relevance], ["Correctness", feedback.technicalCorrectness], ["Clarity", feedback.clarity], ["Structure", feedback.structure], ["Completeness", feedback.completeness]].map(([label, score]) => <span key={label as string} className="rounded-md bg-white/[0.04] px-2 py-1 text-[8px] text-[#9aa7ba]">{label as string} {score}/5</span>)}</div></div>}
      {finalReport && <div className="mt-4 rounded-xl border border-[#63e4d9]/15 p-4"><h3 className="text-xs font-semibold">Final report</h3><p className="mt-2 text-[10px] leading-5 text-[#aab5c6]">{finalReport.summary}</p></div>}
    </section><aside className="h-fit rounded-2xl border border-white/[0.08] bg-[#111621] p-4"><h2 className="text-xs font-semibold">Progress</h2><p className="mt-2 text-[10px] text-[#8290a5]">{completedCount}/{session.questions.length} answers submitted</p><ol className="mt-3 space-y-2">{session.questions.map((item) => <li key={item.id} className="text-[9px] leading-4 text-[#94a1b4]">{item.answer ? "✓" : "•"} {item.prompt}</li>)}</ol></aside></div>}
  </div>;
}
