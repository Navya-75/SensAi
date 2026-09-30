import Link from "next/link";
import { redirect } from "next/navigation";
import { VoiceInterview } from "@/components/interviews/voice-interview";
import { getSignedInProfile } from "@/lib/auth/user";

export default async function VoiceInterviewPage() {
  const identity = await getSignedInProfile();
  if (!identity) redirect("/sign-in");
  return <main className="min-h-screen bg-[#0b0e17] text-[#eef3f9]"><header className="border-b border-white/[0.07]"><div className="mx-auto flex h-[68px] w-[min(100%-40px,960px)] items-center justify-between"><Link href="/dashboard" className="text-sm font-bold tracking-[0.2em]">SENSAI</Link><nav className="flex gap-4 text-xs text-[#a4afc0]"><Link href="/interview/mock" className="hover:text-white">Text interview</Link><Link href="/interview/history" className="hover:text-white">History</Link></nav></div></header><section className="mx-auto w-[min(100%-40px,960px)] py-11 sm:py-14"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6de3d7]">Interview practice</p><h1 className="mt-3 text-3xl font-medium tracking-[-0.05em]">Voice interview</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#98a4b7]">Use your browser’s speech recognition to draft an answer, then submit it for the same feedback as a text interview. SENSAI does not save audio.</p><div className="mt-7"><VoiceInterview available={Boolean(process.env.DATABASE_URL)} aiAvailable={Boolean(process.env.GEMINI_API_KEY)} /></div></section></main>;
}
