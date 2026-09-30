import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ResumeUploader } from "@/components/resumes/resume-uploader";
import { getSignedInProfile } from "@/lib/auth/user";

export default async function ResumeUploadPage() {
  const profile = await getSignedInProfile();
  if (!profile) redirect("/sign-in");

  return (
    <main className="min-h-screen bg-[#0b0e17] text-[#eef3f9]">
      <header className="border-b border-white/[0.07]"><div className="mx-auto flex h-[68px] w-[min(100%-40px,820px)] items-center justify-between"><Link href="/dashboard" className="text-sm font-bold tracking-[0.2em]">SENSAI</Link><Link href="/resume" className="text-xs text-[#a4afc0] hover:text-white">Resume history</Link></div></header>
      <section className="mx-auto w-[min(100%-40px,820px)] py-11 sm:py-14">
        <Link href="/resume" className="inline-flex items-center gap-1.5 text-[11px] text-[#8592a7] hover:text-white"><ArrowLeft size={13} /> Resume history</Link>
        <div className="mt-5 max-w-[640px]"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6de3d7]">Resume workspace</p><h1 className="mt-3 text-3xl font-medium tracking-[-0.05em]">Upload your resume</h1><p className="mt-2 text-sm leading-6 text-[#98a4b7]">SENSAI validates the PDF, extracts selectable text, and stores it in your private account workspace.</p></div>
        <div className="mt-7"><ResumeUploader databaseAvailable={Boolean(process.env.DATABASE_URL)} /></div>
      </section>
    </main>
  );
}
