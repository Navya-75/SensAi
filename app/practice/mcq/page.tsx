import Link from "next/link";
import { redirect } from "next/navigation";
import { McqDesk } from "@/components/practice/mcq-desk";
import { getSignedInProfile } from "@/lib/auth/user";

export default async function McqPracticePage() {
  if (!(await getSignedInProfile())) redirect("/sign-in");
  return <main className="min-h-screen bg-[#0b0e17] text-[#eef3f9]"><header className="border-b border-white/[0.07]"><div className="mx-auto flex h-[68px] w-[min(100%-40px,960px)] items-center justify-between"><Link href="/dashboard" className="text-sm font-bold tracking-[0.2em]">SENSAI</Link><nav className="flex gap-4 text-xs text-[#a4afc0]"><Link href="/interview/mock" className="hover:text-white">Mock interviews</Link><Link href="/industry-insights" className="hover:text-white">Learning references</Link></nav></div></header><section className="mx-auto w-[min(100%-40px,960px)] py-10 sm:py-14"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6de3d7]">Interview preparation</p><h1 className="mt-3 text-3xl font-medium tracking-[-0.05em]">Multiple-choice practice</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#98a4b7]">Answer technical and web fundamentals questions, review explanations, and track your saved attempts. These questions are practice material, not a certification exam.</p><div className="mt-7"><McqDesk /></div></section></main>;
}
