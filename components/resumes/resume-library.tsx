import Link from "next/link";
import { ArrowLeft, ArrowUpRight, FileText } from "lucide-react";
import { ResumeList } from "@/components/resumes/resume-list";
import { ButtonLink } from "@/components/ui/button";

type ResumeItem = {
  id: string;
  originalFilename: string;
  sizeBytes: number;
  status: string;
  isActive: boolean;
  uploadedAt: string;
};

export function ResumeLibrary({
  title,
  available,
  resumes,
}: {
  title: string;
  available: boolean;
  resumes: ResumeItem[];
}) {
  return (
    <main className="min-h-screen bg-[#0b0e17] text-[#eef3f9]">
      <header className="border-b border-white/[0.07]"><div className="mx-auto flex h-[68px] w-[min(100%-40px,980px)] items-center justify-between"><Link href="/dashboard" className="text-sm font-bold tracking-[0.2em]">SENSAI</Link><Link href="/profile" className="text-xs text-[#a4afc0] hover:text-white">Career profile</Link></div></header>
      <section className="mx-auto w-[min(100%-40px,980px)] py-11 sm:py-14">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-[11px] text-[#8592a7] hover:text-white"><ArrowLeft size={13} /> Dashboard</Link>
        <div className="mt-5 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6de3d7]">Resume workspace</p><h1 className="mt-3 text-3xl font-medium tracking-[-0.05em]">{title}</h1><p className="mt-2 text-sm text-[#98a4b7]">Your resumes are private to your account.</p></div>
          <div className="flex flex-wrap gap-2">
            <ButtonLink href="/resume/analyzer" variant="secondary" className="w-fit min-h-10 px-3.5 text-xs">Analyze resume <ArrowUpRight size={14} /></ButtonLink>
            <ButtonLink href="/resume/upload" className="w-fit min-h-10 px-3.5 text-xs">Upload PDF <ArrowUpRight size={14} /></ButtonLink>
          </div>
        </div>

        {!available && <p className="mt-7 rounded-xl border border-amber-300/15 bg-amber-200/[0.045] px-4 py-3.5 text-xs leading-5 text-[#d7c798]">Resume history is unavailable until SENSAI database storage is connected.</p>}
        {available && resumes.length === 0 && <div className="mt-7 rounded-2xl border border-white/[0.08] bg-[#111621] px-5 py-12 text-center"><span className="mx-auto grid size-11 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.025] text-[#7ce7dc]"><FileText size={18} /></span><h2 className="mt-4 text-sm font-semibold">No resumes yet</h2><p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-[#8794a9]">Upload a text-based PDF to keep it in your private SENSAI workspace.</p><ButtonLink href="/resume/upload" className="mt-5 min-h-10 px-3.5 text-xs">Upload a resume <ArrowUpRight size={13} /></ButtonLink></div>}
        {available && resumes.length > 0 && <div className="mt-7"><ResumeList resumes={resumes} /></div>}
      </section>
    </main>
  );
}
