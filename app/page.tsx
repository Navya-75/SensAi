import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  AudioLines,
  BookOpenCheck,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  Check,
  ChevronRight,
  CircleHelp,
  Compass,
  FileSearch2,
  FileText,
  Layers3,
  LockKeyhole,
  MoveUpRight,
  Sparkles,
  Target,
  Waypoints,
} from "lucide-react";
import Link from "next/link";
import { FeatureCard } from "@/components/feature-card";
import { SiteHeader } from "@/components/site-header";
import { BrandMark } from "@/components/ui/brand-mark";
import { ButtonLink } from "@/components/ui/button";

const features = [
  {
    icon: FileSearch2,
    number: "01",
    title: "Resume intelligence",
    description:
      "See the skills and experience already present in your resume, with practical suggestions for making your story clearer.",
  },
  {
    icon: Target,
    number: "02",
    title: "Skill-gap clarity",
    description:
      "Compare your current strengths with the skills associated with a role you want to pursue.",
  },
  {
    icon: Waypoints,
    number: "03",
    title: "A career roadmap",
    description:
      "Turn a career goal into focused learning, project, and interview preparation steps you can track.",
  },
  {
    icon: BriefcaseBusiness,
    number: "04",
    title: "Thoughtful job matching",
    description:
      "Explore roles against your skills and preferences, with a clear view of where a match comes from.",
  },
  {
    icon: AudioLines,
    number: "05",
    title: "Interview practice",
    description:
      "Practice technical, behavioral, and HR questions, then review feedback to guide your next session.",
  },
  {
    icon: ChartNoAxesCombined,
    number: "06",
    title: "Progress that adds up",
    description:
      "Keep your preparation, roadmap tasks, and practice activity in one place as your goals evolve.",
  },
];

const steps = [
  { number: "01", title: "Build your profile", copy: "Share your background, interests, and the direction you want to explore." },
  { number: "02", title: "Understand your starting point", copy: "Bring in a resume and see a grounded picture of your skills and experience." },
  { number: "03", title: "Choose your next steps", copy: "Follow a practical plan, explore relevant roles, and practice at your pace." },
];

const skillTags = ["TypeScript", "React", "SQL", "Communication"];

export default function HomePage() {
  return (
    <main className="overflow-hidden">
      <SiteHeader />

      <section className="relative border-b border-white/[0.055]">
        <div className="grid-glow absolute inset-x-0 top-0 h-[740px] opacity-55" aria-hidden="true" />
        <div className="hero-orb hero-orb-cyan -right-24 top-24 size-[560px] opacity-80" aria-hidden="true" />
        <div className="hero-orb hero-orb-violet -left-52 top-52 size-[500px] opacity-70" aria-hidden="true" />

        <div className="page-shell relative grid min-h-[650px] items-center gap-14 py-16 lg:grid-cols-[1.02fr_.98fr] lg:gap-10 lg:py-20">
          <div className="max-w-[600px]">
            <div className="eyebrow">
              <span className="size-1.5 rounded-full bg-[#5fe7d9] shadow-[0_0_12px_#5fe7d9]" />
              AI career coach
            </div>
            <h1 className="mt-6 max-w-[620px] text-[clamp(44px,6.5vw,76px)] font-medium leading-[0.99] tracking-[-0.075em] text-[#f4f7fb]">
              Make your next
              <br />
              move <span className="text-[#67e4d9]">make sense.</span>
            </h1>
            <p className="mt-6 max-w-[505px] text-[16px] leading-[1.8] text-[#a1adbf] sm:text-[17px]">
              Understand your skills. Build your career. Prepare for opportunities.
              SENSAI brings your next steps into focus.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <ButtonLink href="/sign-up" className="min-h-12 px-5">
                Get started <ArrowUpRight size={16} aria-hidden="true" />
              </ButtonLink>
              <ButtonLink href="#platform" variant="secondary" className="min-h-12 px-5">
                Explore features <ArrowRight size={15} aria-hidden="true" />
              </ButtonLink>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-[#8793a7]">
              <span className="inline-flex items-center gap-2"><LockKeyhole size={13} className="text-[#67dacf]" /> Your career data stays yours</span>
              <span className="hidden h-3 w-px bg-white/15 sm:block" aria-hidden="true" />
              <span>Built around your goals, not guesswork</span>
            </div>
          </div>

          <div className="hero-preview mx-auto w-full max-w-[520px] lg:ml-auto">
            <div className="absolute -left-7 top-[19%] z-10 hidden items-center gap-2.5 rounded-xl border border-white/10 bg-[#111722]/95 px-3 py-2.5 shadow-panel backdrop-blur md:flex">
              <span className="grid size-8 place-items-center rounded-lg bg-[#4fdbcd]/10 text-[#68e7dc]"><Sparkles size={15} /></span>
              <span><span className="block text-[11px] font-semibold text-[#e8eff7]">Career direction</span><span className="mt-0.5 block text-[10px] text-[#8793a7]">A clearer next step</span></span>
            </div>
            <div className="absolute -right-4 bottom-[13%] z-10 hidden items-center gap-2 rounded-xl border border-white/10 bg-[#111722]/95 px-3 py-2.5 shadow-panel backdrop-blur md:flex">
              <span className="grid size-8 place-items-center rounded-lg bg-[#a58aff]/10 text-[#b3a0ff]"><Check size={15} /></span>
              <span><span className="block text-[11px] font-semibold text-[#e8eff7]">One step at a time</span><span className="mt-0.5 block text-[10px] text-[#8793a7]">Keep your plan moving</span></span>
            </div>

            <div className="rounded-[25px] border border-white/[0.11] bg-[#111621]/95 p-3 shadow-[0_28px_110px_rgba(0,0,0,.48)] backdrop-blur sm:p-4">
              <div className="flex items-center justify-between border-b border-white/[0.07] px-2 pb-3">
                <div className="flex items-center gap-2.5">
                  <BrandMark compact />
                  <span className="text-[12px] font-medium text-[#e6ebf3]">Your career workspace</span>
                </div>
                <span className="rounded-md border border-white/[0.08] px-2 py-1 text-[9px] uppercase tracking-[0.12em] text-[#8290a5]">Preview</span>
              </div>
              <div className="grid gap-3 p-1 pt-3 sm:grid-cols-[1.1fr_.9fr]">
                <div className="rounded-xl border border-white/[0.07] bg-[#151b27] p-3.5">
                  <div className="flex items-start justify-between">
                    <div><p className="text-[10px] text-[#95a1b4]">Career focus</p><p className="mt-1 text-[14px] font-semibold text-[#eff3f9]">Frontend engineer</p></div>
                    <span className="grid size-8 place-items-center rounded-lg bg-[#4fdbcd]/10 text-[#71e8dd]"><Compass size={15} /></span>
                  </div>
                  <div className="preview-grid relative mt-4 h-[116px] overflow-hidden rounded-lg border border-white/[0.04]">
                    <div className="absolute inset-x-0 bottom-0 h-[82%] line-chart opacity-70" />
                    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 280 120" fill="none" preserveAspectRatio="none" aria-label="Illustrative career progress trend">
                      <path d="M0 88L34 76L66 82L94 54L126 66L154 42L182 50L210 30L241 36L280 12" stroke="#b18d67" strokeWidth="2" />
                      <circle cx="280" cy="12" r="3.5" fill="#d3b995" />
                    </svg>
                    <span className="absolute bottom-2 left-2 text-[9px] text-[#768399]">Illustrative progress view</span>
                  </div>
                </div>
                <div className="rounded-xl border border-white/[0.07] bg-[#151b27] p-3.5">
                  <div className="flex items-center justify-between"><p className="text-[10px] text-[#95a1b4]">Skill profile</p><Layers3 size={14} className="text-[#7f8ca2]" /></div>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {skillTags.map((skill) => <span key={skill} className="rounded-md border border-white/[0.07] bg-white/[0.025] px-2 py-1.5 text-[9px] text-[#c1cad8]">{skill}</span>)}
                  </div>
                  <div className="mt-4 rounded-lg border border-[#61ded2]/10 bg-[#46d7ca]/[0.04] p-2.5">
                    <div className="flex items-center gap-1.5 text-[9px] font-medium text-[#7ce8dd]"><Sparkles size={11} /> Suggested next step</div>
                    <p className="mt-1.5 text-[10px] leading-4 text-[#a6b0c0]">Connect your skills to a focused learning plan.</p>
                  </div>
                </div>
                <div className="rounded-xl border border-white/[0.07] bg-[#151b27] p-3.5 sm:col-span-2">
                  <div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="grid size-7 place-items-center rounded-lg bg-[#9b83ff]/10 text-[#b3a0ff]"><Waypoints size={14} /></span><div><p className="text-[10px] font-semibold text-[#e2e8f1]">Career roadmap</p><p className="mt-0.5 text-[9px] text-[#8793a7]">A plan shaped around your goal</p></div></div><ChevronRight size={15} className="text-[#78859a]" /></div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {["Build foundations", "Create projects", "Prepare to interview"].map((step, index) => (
                      <div key={step} className="flex items-center gap-2 rounded-lg border border-white/[0.055] bg-white/[0.018] p-2">
                        <span className={`grid size-5 shrink-0 place-items-center rounded-full border text-[8px] ${index === 0 ? "border-[#5de5d7]/35 bg-[#4ddacc]/10 text-[#7de9df]" : "border-white/10 text-[#7b879b]"}`}>{index === 0 ? <Check size={10} /> : index + 1}</span>
                        <span className="text-[9px] leading-3.5 text-[#abb5c4]">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-3 text-center text-[10px] text-[#647186]">Illustrative workspace preview · Your experience will reflect your own profile</p>
          </div>
        </div>
        <a href="#platform" aria-label="Scroll to platform features" className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 text-[#6d7a90] transition-colors hover:text-[#b3c0d3] lg:block">
          <ArrowDown size={17} />
        </a>
      </section>

      <section id="platform" className="page-shell py-24 sm:py-28">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <span className="eyebrow">One connected platform</span>
            <h2 className="section-heading">Everything you need to move forward with intention.</h2>
          </div>
          <p className="section-copy md:mb-1 md:max-w-[365px]">A connected set of tools for the decisions and practice that shape your career journey.</p>
        </div>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => <FeatureCard key={feature.number} {...feature} />)}
        </div>
      </section>

      <section id="about" className="border-y border-white/[0.055] bg-[#0d111b]">
        <div className="page-shell grid gap-12 py-20 sm:py-24 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
          <div>
            <span className="eyebrow">Career clarity, connected</span>
            <h2 className="section-heading">Your story, skills, and goals belong in the same conversation.</h2>
            <p className="section-copy">Career preparation can feel scattered across documents, tabs, and advice. SENSAI is designed to help you bring those pieces together and choose a next step you can act on.</p>
            <div className="mt-7 flex items-center gap-3 text-[12px] text-[#a9b4c5]"><span className="grid size-8 place-items-center rounded-lg border border-[#55d9ce]/15 bg-[#46d7ca]/[0.06] text-[#6de4d9]"><CircleHelp size={15} /></span> Suggestions stay suggestions. Your choices stay yours.</div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <article className="rounded-2xl border border-white/[0.075] bg-[#121722] p-5 sm:translate-y-6">
              <span className="grid size-10 place-items-center rounded-xl bg-[#4bdccd]/[0.08] text-[#67e5d8]"><FileText size={18} /></span>
              <h3 className="mt-5 text-[15px] font-semibold text-[#edf2f9]">Start with what you have</h3>
              <p className="mt-2 text-[12px] leading-6 text-[#929eb2]">Make your resume and existing experience easier to understand and build on.</p>
              <div className="mt-5 h-px bg-gradient-to-r from-[#4fe1d4]/40 to-transparent" />
            </article>
            <article className="rounded-2xl border border-white/[0.075] bg-[#121722] p-5">
              <span className="grid size-10 place-items-center rounded-xl bg-[#a58aff]/[0.08] text-[#b3a1ff]"><BookOpenCheck size={18} /></span>
              <h3 className="mt-5 text-[15px] font-semibold text-[#edf2f9]">Practice with purpose</h3>
              <p className="mt-2 text-[12px] leading-6 text-[#929eb2]">Use your target roles and learning goals to guide preparation and interviews.</p>
              <div className="mt-5 h-px bg-gradient-to-r from-[#a58aff]/40 to-transparent" />
            </article>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="page-shell py-24 sm:py-28">
        <div className="mx-auto max-w-[680px] text-center">
          <span className="eyebrow">A path you can follow</span>
          <h2 className="section-heading mx-auto">Small, clear steps can change how the whole journey feels.</h2>
          <p className="section-copy mx-auto">Start from where you are. SENSAI helps you turn a broad ambition into a more practical plan.</p>
        </div>
        <div className="relative mt-14 grid gap-4 md:grid-cols-3 md:gap-5">
          <div className="workflow-line absolute left-[16%] right-[16%] top-[22px] hidden h-px md:block" aria-hidden="true" />
          {steps.map((step) => (
            <article key={step.number} className="relative rounded-2xl border border-white/[0.075] bg-[#101520] p-5 sm:p-6">
              <div className="relative z-10 grid size-11 place-items-center rounded-full border border-[#58e0d4]/25 bg-[#10201f] font-mono text-[11px] font-semibold text-[#7bece1] shadow-[0_0_24px_rgba(73,216,204,.08)]">{step.number}</div>
              <h3 className="mt-6 text-[16px] font-semibold text-[#eaf0f8]">{step.title}</h3>
              <p className="mt-2.5 text-[13px] leading-6 text-[#929eb2]">{step.copy}</p>
              <span className="mt-6 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.13em] text-[#68768c]">Step {step.number} <ArrowRight size={12} /></span>
            </article>
          ))}
        </div>
      </section>

      <section className="relative border-y border-white/[0.055] bg-[#0d111b]">
        <div className="hero-orb hero-orb-cyan right-[6%] top-1/2 size-[420px] -translate-y-1/2 opacity-45" aria-hidden="true" />
        <div className="page-shell relative grid gap-10 py-16 md:grid-cols-[1fr_auto] md:items-center sm:py-20">
          <div>
            <span className="eyebrow">Designed for thoughtful preparation</span>
            <h2 className="mt-4 max-w-[650px] text-[clamp(30px,4vw,42px)] font-medium leading-[1.13] tracking-[-0.055em] text-[#f0f4fa]">A calmer way to make progress on your career goals.</h2>
            <p className="mt-4 max-w-[540px] text-[14px] leading-7 text-[#97a3b7]">Bring your profile, resume, learning plan, and interview practice into one place.</p>
          </div>
          <ButtonLink href="/sign-up" className="w-fit min-h-12 px-5">
            Start your journey <MoveUpRight size={16} aria-hidden="true" />
          </ButtonLink>
        </div>
      </section>

      <section className="page-shell py-14">
        <div className="flex flex-col gap-6 rounded-2xl border border-white/[0.075] bg-[#111621] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div className="flex items-start gap-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#56ddd2]/15 bg-[#4bdccd]/[0.07] text-[#71e9dd]"><Layers3 size={18} /></span>
            <div><p className="text-[14px] font-semibold text-[#e8eef6]">A considered foundation</p><p className="mt-1.5 max-w-[610px] text-[12px] leading-6 text-[#8f9bb0]">Built as a secure, modular web application with a clear separation between your experience, data, and AI-assisted services.</p></div>
          </div>
          <span className="inline-flex w-fit shrink-0 items-center gap-2 rounded-lg border border-white/[0.07] px-3 py-2 text-[10px] font-medium text-[#9ca9bc]"><LockKeyhole size={13} className="text-[#67ddd2]" /> Privacy-minded by design</span>
        </div>
      </section>

      <section className="page-shell pb-20 pt-5 sm:pb-24">
        <div className="relative overflow-hidden rounded-[26px] border border-[#5bded2]/15 bg-[#111b23] px-6 py-12 text-center sm:px-12 sm:py-16">
          <div className="hero-orb hero-orb-cyan left-1/2 top-1/2 size-[520px] -translate-x-1/2 -translate-y-1/2 opacity-45" aria-hidden="true" />
          <div className="relative mx-auto max-w-[670px]">
            <span className="eyebrow">Your next chapter starts here</span>
            <h2 className="mt-4 text-[clamp(34px,5vw,54px)] font-medium leading-[1.06] tracking-[-0.06em] text-[#f2f6fb]">Make space for the career you want to build.</h2>
            <p className="mx-auto mt-4 max-w-[500px] text-[14px] leading-7 text-[#a1adbd]">Start with your goals, get clear on your strengths, and take the next step with confidence.</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <ButtonLink href="/sign-up" className="min-h-12 px-5">Get started <ArrowUpRight size={16} /></ButtonLink>
              <ButtonLink href="#platform" variant="secondary" className="min-h-12 px-5">Explore the platform <ArrowRight size={15} /></ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] bg-[#090c13]">
        <div className="page-shell flex flex-col gap-7 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div><BrandMark /><p className="mt-3 max-w-[290px] text-[11px] leading-5 text-[#778398]">Understand your skills. Build your career. Prepare for opportunities.</p></div>
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-5 gap-y-3 text-[11px] text-[#8d99ac]">
            <Link href="#platform" className="transition-colors hover:text-white">Features</Link>
            <Link href="#how-it-works" className="transition-colors hover:text-white">How it works</Link>
            <Link href="#about" className="transition-colors hover:text-white">About SENSAI</Link>
            <Link href="mailto:hello@sensai.careers" className="transition-colors hover:text-white">Contact</Link>
            <Link href="/privacy" className="transition-colors hover:text-white">Privacy</Link>
            <Link href="/terms" className="transition-colors hover:text-white">Terms</Link>
          </nav>
        </div>
        <div className="border-t border-white/[0.045]">
          <div className="page-shell flex flex-col gap-2 py-4 text-[10px] text-[#5f6b7e] sm:flex-row sm:items-center sm:justify-between"><span>© {new Date().getFullYear()} SENSAI. All rights reserved.</span><span className="inline-flex items-center gap-1.5">Built to help you move forward <ChevronRight size={12} className="text-[#64dcd1]" /></span></div>
        </div>
      </footer>
    </main>
  );
}
