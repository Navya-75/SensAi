import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  FileText,
  GraduationCap,
  LockKeyhole,
  MessageSquareText,
  Sparkles,
  Target,
  Waypoints,
} from "lucide-react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { BrandMark } from "@/components/ui/brand-mark";
import { ButtonLink } from "@/components/ui/button";

const tools = [
  {
    icon: FileText,
    title: "Resume review",
    description: "Upload your resume, understand your experience, and find ways to strengthen it.",
    href: "/resume/upload",
    action: "Upload resume",
  },
  {
    icon: Target,
    title: "Skill match",
    description: "Compare your current skills with the requirements for the role you want.",
    href: "/career/skills",
    action: "Find skill gaps",
  },
  {
    icon: Waypoints,
    title: "Career roadmap",
    description: "Turn your goal into a practical learning and project plan you can follow.",
    href: "/career/roadmap",
    action: "Build a roadmap",
  },
  {
    icon: BriefcaseBusiness,
    title: "Job matches",
    description: "Explore roles that line up with your skills, interests, and career direction.",
    href: "/jobs",
    action: "Explore jobs",
  },
  {
    icon: MessageSquareText,
    title: "Mock interviews",
    description: "Practice interview questions and get feedback on your answers.",
    href: "/interview/mock",
    action: "Practice interviews",
  },
  {
    icon: GraduationCap,
    title: "Question practice",
    description: "Build confidence with role related multiple choice questions and explanations.",
    href: "/practice/mcq",
    action: "Practice questions",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f3f2ef] text-[#191919]">
      <SiteHeader />

      <div className="page-shell py-6 sm:py-9">
        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_310px]">
          <div className="rounded-xl border border-[#d6d9dc] bg-white p-6 shadow-sm sm:p-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#e8f3ff] px-3 py-1.5 text-xs font-semibold text-[#0a66c2]">
              <Sparkles size={14} aria-hidden="true" />
              Your career workspace
            </div>
            <h1 className="mt-5 max-w-3xl text-[clamp(34px,5vw,58px)] font-semibold leading-[1.08] tracking-[-0.045em] text-[#191919]">
              Find your next step. Build your future.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#56616b] sm:text-lg">
              SENSAI brings resume feedback, skill discovery, job exploration, and interview practice together in one place.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <ButtonLink href="/sign-up" className="min-h-11 rounded-full px-5">
                Create your profile <ArrowUpRight size={16} aria-hidden="true" />
              </ButtonLink>
              <ButtonLink href="/sign-in" variant="secondary" className="min-h-11 rounded-full px-5">
                Sign in
              </ButtonLink>
            </div>
            <div className="mt-7 flex items-center gap-2 text-xs text-[#56616b]">
              <LockKeyhole size={14} className="text-[#0a66c2]" aria-hidden="true" />
              Your resume and career activity stay in your account.
            </div>
          </div>

          <aside id="getting-started" className="rounded-xl border border-[#d6d9dc] bg-white p-5 shadow-sm sm:p-6">
            <div className="grid size-11 place-items-center rounded-full bg-[#e8f3ff] text-[#0a66c2]">
              <Target size={20} aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-[#191919]">Start with your goal</h2>
            <p className="mt-2 text-sm leading-6 text-[#56616b]">
              Add your profile and target role so SENSAI can shape recommendations around you.
            </p>
            <ol className="mt-5 space-y-3 border-t border-[#e2e5e8] pt-4 text-sm text-[#3d454c]">
              <li className="flex items-center gap-2"><span className="grid size-6 place-items-center rounded-full bg-[#e8f3ff] text-xs font-semibold text-[#0a66c2]">1</span> Set up your profile</li>
              <li className="flex items-center gap-2"><span className="grid size-6 place-items-center rounded-full bg-[#e8f3ff] text-xs font-semibold text-[#0a66c2]">2</span> Add your resume and skills</li>
              <li className="flex items-center gap-2"><span className="grid size-6 place-items-center rounded-full bg-[#e8f3ff] text-xs font-semibold text-[#0a66c2]">3</span> Explore your next steps</li>
            </ol>
            <Link href="/sign-up" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#0a66c2] hover:underline">
              Get started <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </aside>
        </section>

        <section id="career-tools" className="mt-6 rounded-xl border border-[#d6d9dc] bg-white p-5 shadow-sm sm:mt-8 sm:p-7" aria-labelledby="tools-heading">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0a66c2]">Explore SENSAI</p>
              <h2 id="tools-heading" className="mt-2 text-2xl font-semibold tracking-tight text-[#191919]">Career tools for your next move</h2>
            </div>
            <Link href="/sign-up" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0a66c2] hover:underline">
              View your workspace <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {tools.map(({ icon: Icon, title, description, href, action }) => (
              <Link
                key={href}
                href={href}
                className="group rounded-lg border border-[#d6d9dc] p-4 transition-colors hover:border-[#0a66c2] hover:bg-[#f7fbff] sm:p-5"
              >
                <span className="grid size-10 place-items-center rounded-lg bg-[#e8f3ff] text-[#0a66c2]">
                  <Icon size={19} aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-semibold text-[#191919]">{title}</h3>
                <p className="mt-2 min-h-12 text-sm leading-6 text-[#56616b]">{description}</p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0a66c2]">
                  {action}<ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <footer className="flex flex-col gap-3 px-1 py-7 text-xs text-[#56616b] sm:flex-row sm:items-center sm:justify-between">
          <div><BrandMark /><p className="mt-2">A clearer path from your experience to your next opportunity.</p></div>
          <nav aria-label="Footer links" className="flex flex-wrap gap-4">
            <Link href="/sign-up" className="hover:text-[#0a66c2]">Create profile</Link>
            <Link href="/sign-in" className="hover:text-[#0a66c2]">Sign in</Link>
            <Link href="/settings" className="hover:text-[#0a66c2]">Privacy settings</Link>
          </nav>
        </footer>
      </div>
    </main>
  );
}
