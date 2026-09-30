import Link from "next/link";
import { redirect } from "next/navigation";
import { CareerRoadmapView } from "@/components/career/roadmap-view";
import { getSignedInProfile } from "@/lib/auth/user";
import { syncSignedInUser } from "@/lib/auth/sync-user";
import { prisma } from "@/lib/db/prisma";

function stringList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export default async function CareerRoadmapPage() {
  const identity = await getSignedInProfile();
  if (!identity) redirect("/sign-in");
  let available = false;
  let targetRole = "";
  let roadmap = null;
  try {
    const sync = await syncSignedInUser(identity);
    if (sync.status === "synced") {
      available = true;
      const [profile, found] = await Promise.all([
        prisma.onboardingProfile.findUnique({ where: { userId: sync.user.id }, select: { targetRole: true } }),
        prisma.careerRoadmap.findFirst({
          where: { userId: sync.user.id, status: "ACTIVE" },
          orderBy: { updatedAt: "desc" },
          include: { phases: { orderBy: { position: "asc" }, include: { tasks: { orderBy: { position: "asc" }, select: { id: true, title: true, description: true, status: true } } } } },
        }),
      ]);
      targetRole = profile?.targetRole ?? "";
      if (found) roadmap = {
        id: found.id,
        targetRole: found.targetRole,
        title: found.title,
        description: found.description,
        phases: found.phases.map((phase) => ({
          id: phase.id,
          title: phase.title,
          description: phase.description,
          skills: stringList(phase.skills),
          resources: stringList(phase.resources),
          tasks: phase.tasks,
        })),
      };
    }
  } catch {
    available = false;
  }

  return (
    <main className="min-h-screen bg-[#0b0e17] text-[#eef3f9]">
      <header className="border-b border-white/[0.07]"><div className="mx-auto flex h-[68px] w-[min(100%-40px,1040px)] items-center justify-between"><Link href="/dashboard" className="text-sm font-bold tracking-[0.2em]">SENSAI</Link><nav className="flex gap-4 text-xs text-[#a4afc0]"><Link href="/career/skills" className="hover:text-white">Skill gaps</Link><Link href="/jobs" className="hover:text-white">Jobs</Link></nav></div></header>
      <section className="mx-auto w-[min(100%-40px,1040px)] py-11 sm:py-14">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6de3d7]">Career planning</p>
        <h1 className="mt-3 text-3xl font-medium tracking-[-0.05em]">Your career roadmap</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#98a4b7]">A practical plan built around your target role and current profile. Progress is saved as you complete tasks.</p>
        <div className="mt-7"><CareerRoadmapView available={available} aiAvailable={Boolean(process.env.GEMINI_API_KEY)} initialRole={targetRole} initialRoadmap={roadmap} /></div>
      </section>
    </main>
  );
}
