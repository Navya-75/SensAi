import { redirect } from "next/navigation";
import { Activity, ArrowUpRight, BookOpenCheck, BriefcaseBusiness, FileText, GraduationCap, Mic, PenLine, Radar, Sparkles, Waypoints } from "lucide-react";
import Link from "next/link";
import { getSignedInProfile } from "@/lib/auth/user";
import { syncSignedInUser, type UserSyncResult } from "@/lib/auth/sync-user";
import { prisma } from "@/lib/db/prisma";

type DashboardMetrics = {
  profileComplete: boolean;
  resumes: number;
  skills: number;
  practice: number;
  interviews: number;
  roadmap: { completed: number; total: number };
  activities: { id: string; summary: string; createdAt: Date }[];
};

const emptyMetrics: DashboardMetrics = { profileComplete: false, resumes: 0, skills: 0, practice: 0, interviews: 0, roadmap: { completed: 0, total: 0 }, activities: [] };

const tools = [
  { icon: FileText, title: "Resume analysis", text: "Review experience and evidence from your resume.", href: "/resume/analyzer" },
  { icon: PenLine, title: "Resume builder", text: "Edit a resume and export it through print to PDF.", href: "/resume-builder" },
  { icon: Waypoints, title: "Career roadmap", text: "Generate learning steps and track progress.", href: "/career/roadmap" },
  { icon: Radar, title: "Skill gaps", text: "Compare your skills with estimated role expectations.", href: "/career/skills" },
  { icon: BriefcaseBusiness, title: "Job matches", text: "Filter roles and inspect transparent match factors.", href: "/jobs" },
  { icon: BookOpenCheck, title: "Cover letters", text: "Draft and edit letters grounded in your profile.", href: "/cover-letters" },
  { icon: Mic, title: "Mock interviews", text: "Practice interview questions and review feedback.", href: "/interview/mock" },
  { icon: GraduationCap, title: "MCQ practice", text: "Answer knowledge questions and review explanations.", href: "/practice/mcq" },
  { icon: Sparkles, title: "Learning references", text: "Open primary docs and role learning resources.", href: "/industry-insights" },
];

export default async function DashboardPage() {
  const user = await getSignedInProfile();
  if (!user) redirect("/sign-in");
  const displayName = user.firstName || user.username || "there";
  let syncStatus: UserSyncResult["status"] = "database-unavailable";
  let metrics = emptyMetrics;

  try {
    const sync = await syncSignedInUser(user);
    syncStatus = sync.status;
    if (sync.status === "synced") {
      const [profile, resumeCount, skillCount, practiceCount, interviewCount, roadmap, activities] = await Promise.all([
        prisma.onboardingProfile.findUnique({ where: { userId: sync.user.id }, select: { isComplete: true } }),
        prisma.resume.count({ where: { userId: sync.user.id, status: { not: "DELETED" } } }),
        prisma.userSkill.count({ where: { userId: sync.user.id } }),
        prisma.mcqAttempt.count({ where: { userId: sync.user.id } }),
        prisma.interview.count({ where: { userId: sync.user.id, status: "COMPLETED" } }),
        prisma.careerRoadmap.findFirst({ where: { userId: sync.user.id, status: "ACTIVE" }, orderBy: { updatedAt: "desc" }, select: { id: true } }),
        prisma.userActivity.findMany({ where: { userId: sync.user.id }, orderBy: { createdAt: "desc" }, take: 6, select: { id: true, summary: true, createdAt: true } }),
      ]);
      const [roadmapTotal, roadmapCompleted] = roadmap ? await Promise.all([
        prisma.roadmapTask.count({ where: { phase: { roadmapId: roadmap.id } } }),
        prisma.roadmapTask.count({ where: { phase: { roadmapId: roadmap.id }, status: "COMPLETED" } }),
      ]) : [0, 0];
      metrics = {
        profileComplete: profile?.isComplete ?? false,
        resumes: resumeCount,
        skills: skillCount,
        practice: practiceCount,
        interviews: interviewCount,
        roadmap: { completed: roadmapCompleted, total: roadmapTotal },
        activities,
      };
    }
  } catch {
    console.error("SENSAI could not load account progress for the dashboard.");
  }

  const progress = [
    { label: "Profile", value: metrics.profileComplete ? "Complete" : "In progress" },
    { label: "Resumes", value: String(metrics.resumes) },
    { label: "Skills", value: String(metrics.skills) },
    { label: "MCQ attempts", value: String(metrics.practice) },
    { label: "Interviews completed", value: String(metrics.interviews) },
    { label: "Roadmap tasks", value: `${metrics.roadmap.completed}/${metrics.roadmap.total}` },
  ];

  return <main className="min-h-screen bg-[#0b0e17] text-[#eff3f9]">
    <header className="border-b border-white/[0.07]"><div className="mx-auto flex min-h-[72px] w-[min(100%-32px,1160px)] flex-wrap items-center justify-between gap-3 py-3"><Link href="/dashboard" className="text-lg font-bold tracking-[0.2em]">SENSAI</Link><nav aria-label="Account navigation" className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium text-[#a5b0c1]"><span className="hidden text-[#8f9bb0] sm:block">{user.email}</span><Link href="/profile" className="hover:text-white">Profile</Link><Link href="/settings" className="hover:text-white">Settings</Link><Link href="/" className="hover:text-white">Home</Link></nav></div></header>
    <section className="mx-auto w-[min(100%-32px,1160px)] py-9 sm:py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#68e2d7]">Your workspace</p><h1 className="mt-3 text-3xl font-medium tracking-[-0.045em] sm:text-4xl">Welcome, {displayName}.</h1><p className="mt-3 max-w-2xl text-base leading-7 text-[#9ba7ba]">Your career tools, progress, and recent account activity in one place.</p>
      <nav aria-label="Start here" className="mt-5 flex flex-wrap gap-3"><Link href="/resume/upload" className="rounded-full border border-white/10 bg-[#111621] px-4 py-2.5 text-sm font-semibold text-[#eaf0f8]">Upload resume</Link><Link href="/career/skills" className="rounded-full border border-white/10 bg-[#111621] px-4 py-2.5 text-sm font-semibold text-[#eaf0f8]">Find skills</Link><Link href="/interview/mock" className="rounded-full border border-white/10 bg-[#111621] px-4 py-2.5 text-sm font-semibold text-[#eaf0f8]">Interview practice</Link><Link href="/practice/mcq" className="rounded-full border border-white/10 bg-[#111621] px-4 py-2.5 text-sm font-semibold text-[#eaf0f8]">Question practice</Link></nav>
      <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{progress.map((item) => <article key={item.label} className="rounded-xl border border-white/[0.07] bg-[#111621] px-4 py-4"><p className="text-xs text-[#8794a8]">{item.label}</p><p className="mt-1 text-lg font-semibold text-[#eaf0f7]">{item.value}</p></article>)}</div>
      {syncStatus !== "synced" && <div role="status" className="mt-4 rounded-xl border border-amber-200/15 bg-amber-100/[0.04] p-4"><h2 className="text-base font-semibold">Workspace data is unavailable</h2><p className="mt-1 text-sm leading-6 text-[#c1b58f]">Sign-in is working, but PostgreSQL is not connected. Saved progress and dashboard metrics will appear after the database is configured.</p></div>}
      {!metrics.profileComplete && syncStatus === "synced" && <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#5de1d5]/15 bg-[#4bdccd]/[0.035] p-4"><div><h2 className="text-base font-semibold">Finish your career profile</h2><p className="mt-1 text-sm text-[#9ba7ba]">Adding your goals and experience improves the tools throughout your workspace.</p></div><Link href="/onboarding" className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#54e3d5] px-4 text-sm font-semibold text-[#071312]">Continue profile <ArrowUpRight size={16} /></Link></div>}
      <div className="mt-8 flex items-center gap-2.5"><Activity size={18} className="text-[#71e5db]" /><h2 className="text-lg font-semibold">Career workspace</h2></div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{tools.map(({ icon: Icon, title, text, href }) => <Link key={href} href={href} className="group rounded-xl border border-white/[0.07] bg-[#111621] p-5 transition hover:border-[#63e4d9]/25 hover:bg-[#131a27]"><div className="flex items-center justify-between"><span className="grid size-10 place-items-center rounded-lg border border-[#5de1d5]/15 bg-[#4bdccd]/[0.06] text-[#70e6da]"><Icon size={18} /></span><ArrowUpRight size={16} className="text-[#68778d] transition group-hover:text-[#73e8dc]" /></div><h3 className="mt-4 text-base font-semibold">{title}</h3><p className="mt-1.5 text-sm leading-6 text-[#929eb1]">{text}</p></Link>)}</div>
      <section className="mt-8 rounded-2xl border border-white/[0.07] bg-[#111621] p-5 sm:p-6" aria-labelledby="activity-heading"><div className="flex items-center justify-between"><h2 id="activity-heading" className="text-base font-semibold">Recent activity</h2><span className="text-xs text-[#718097]">Saved in your account</span></div>{metrics.activities.length ? <ol className="mt-3 divide-y divide-white/[0.05]">{metrics.activities.map((item) => <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-3"><span className="text-sm text-[#aab5c6]">{item.summary}</span><time dateTime={item.createdAt.toISOString()} className="text-xs text-[#748198]">{item.createdAt.toLocaleDateString()}</time></li>)}</ol> : <p className="mt-3 text-sm leading-6 text-[#8f9bb0]">Your activity will appear here as you use the workspace.</p>}</section>
    </section>
  </main>;
}
