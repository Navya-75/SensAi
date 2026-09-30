import Link from "next/link";
import { redirect } from "next/navigation";
import { ResumeAnalyzer } from "@/components/resumes/resume-analyzer";
import { getSignedInProfile } from "@/lib/auth/user";
import { getResumeAnalyzerData } from "@/lib/resumes/analyzer";
import { isGeminiConfigured } from "@/lib/ai/gemini";

export default async function ResumeAnalyzerPage() {
  const profile = await getSignedInProfile();
  if (!profile) redirect("/sign-in");

  let data: Awaited<ReturnType<typeof getResumeAnalyzerData>> = { available: false, resumes: [] };
  try {
    data = await getResumeAnalyzerData(profile);
  } catch {
    data = { available: false, resumes: [] };
  }

  return (
    <main className="min-h-screen bg-[#0b0e17] text-[#eef3f9]">
      <header className="border-b border-white/[0.07]"><div className="mx-auto flex h-[68px] w-[min(100%-40px,1080px)] items-center justify-between"><Link href="/dashboard" className="text-sm font-bold tracking-[0.2em]">SENSAI</Link><nav className="flex items-center gap-4"><Link href="/resume" className="text-xs text-[#a4afc0] hover:text-white">Resume history</Link><Link href="/settings" className="text-xs text-[#a4afc0] hover:text-white">Privacy settings</Link></nav></div></header>
      <section className="mx-auto w-[min(100%-40px,1080px)] py-11 sm:py-14">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6de3d7]">Resume workspace</p>
        <h1 className="mt-3 text-3xl font-medium tracking-[-0.05em]">Resume analyzer</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#98a4b7]">Review skills and experience found in your resume, with supporting text for extracted facts and clearly labeled career suggestions.</p>
        <div className="mt-7"><ResumeAnalyzer available={data.available} aiAvailable={isGeminiConfigured()} resumes={data.resumes} /></div>
      </section>
    </main>
  );
}
