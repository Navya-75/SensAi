import Link from "next/link";
import { redirect } from "next/navigation";
import { SkillGapExplorer } from "@/components/career/skill-gap-explorer";
import { getSignedInProfile } from "@/lib/auth/user";
import { syncSignedInUser } from "@/lib/auth/sync-user";
import { prisma } from "@/lib/db/prisma";

export default async function SkillGapPage() {
  const identity = await getSignedInProfile();
  if (!identity) redirect("/sign-in");

  let available = false;
  let initialRole = "";
  let skills: { name: string; category: string }[] = [];
  try {
    const sync = await syncSignedInUser(identity);
    if (sync.status === "synced") {
      const [profile, userSkills] = await Promise.all([
        prisma.onboardingProfile.findUnique({ where: { userId: sync.user.id }, select: { targetRole: true, softSkills: true } }),
        prisma.userSkill.findMany({ where: { userId: sync.user.id }, select: { skill: { select: { name: true, category: true } } } }),
      ]);
      initialRole = profile?.targetRole ?? "";
      skills = userSkills.map(({ skill }) => ({ name: skill.name, category: skill.category }));
      for (const name of profile?.softSkills ?? []) if (!skills.some((skill) => skill.name.toLowerCase() === name.toLowerCase())) skills.push({ name, category: "SOFT" });
      available = true;
    }
  } catch {
    available = false;
  }

  return (
    <main className="min-h-screen bg-[#0b0e17] text-[#eef3f9]">
      <header className="border-b border-white/[0.07]"><div className="mx-auto flex h-[68px] w-[min(100%-40px,1040px)] items-center justify-between"><Link href="/dashboard" className="text-sm font-bold tracking-[0.2em]">SENSAI</Link><nav className="flex gap-4 text-xs text-[#a4afc0]"><Link href="/resume/analyzer" className="hover:text-white">Resume analysis</Link><Link href="/career/roadmap" className="hover:text-white">Roadmap</Link></nav></div></header>
      <section className="mx-auto w-[min(100%-40px,1040px)] py-11 sm:py-14">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6de3d7]">Career planning</p>
        <h1 className="mt-3 text-3xl font-medium tracking-[-0.05em]">Skill gap analysis</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#98a4b7]">Compare the skills in your profile with common expectations for a target role, then focus on practical learning topics.</p>
        <div className="mt-7"><SkillGapExplorer available={available} aiAvailable={Boolean(process.env.GEMINI_API_KEY)} initialRole={initialRole} initialSkills={skills} /></div>
      </section>
    </main>
  );
}
