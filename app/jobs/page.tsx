import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, BriefcaseBusiness, MapPin, Sparkles } from "lucide-react";
import { getSignedInProfile } from "@/lib/auth/user";
import { syncSignedInUser } from "@/lib/auth/sync-user";
import { getJobMatches } from "@/lib/jobs/matches";

const experienceOptions = ["INTERNSHIP", "ENTRY_LEVEL", "ASSOCIATE", "MID_LEVEL", "SENIOR", "LEAD", "ANY"] as const;
const employmentOptions = ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "TEMPORARY", "APPRENTICESHIP"] as const;
type Search = { q?: string; location?: string; level?: string; type?: string; skill?: string };

export default async function JobsPage({ searchParams }: { searchParams?: Search }) {
  const identity = await getSignedInProfile();
  if (!identity) redirect("/sign-in");
  const sync = await syncSignedInUser(identity);
  const filters = {
    query: searchParams?.q?.trim().slice(0, 100),
    location: searchParams?.location?.trim().slice(0, 100),
    experienceLevel: experienceOptions.includes(searchParams?.level as typeof experienceOptions[number]) ? searchParams?.level : undefined,
    employmentType: employmentOptions.includes(searchParams?.type as typeof employmentOptions[number]) ? searchParams?.type : undefined,
    skill: searchParams?.skill?.trim().slice(0, 80),
  };
  let jobs: Awaited<ReturnType<typeof getJobMatches>> = [];
  let storageAvailable = sync.status === "synced";
  if (sync.status === "synced") {
    try { jobs = await getJobMatches(sync.user.id, filters); } catch { storageAvailable = false; }
  }

  return (
    <main className="min-h-screen bg-[#0b0e17] text-[#eef3f9]">
      <header className="border-b border-white/[0.07]"><div className="mx-auto flex h-[68px] w-[min(100%-40px,1120px)] items-center justify-between"><Link href="/dashboard" className="text-sm font-bold tracking-[0.2em]">SENSAI</Link><nav className="flex gap-4 text-xs text-[#a4afc0]"><Link href="/career/skills" className="hover:text-white">Skill gaps</Link><Link href="/career/roadmap" className="hover:text-white">Roadmap</Link></nav></div></header>
      <section className="mx-auto w-[min(100%-40px,1120px)] py-11 sm:py-14">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6de3d7]">Career opportunities</p><h1 className="mt-3 text-3xl font-medium tracking-[-0.05em]">Jobs for your next step</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#98a4b7]">Explore curated listings and see how your saved skills align. Match scores describe profile fit, not your chance of being hired.</p>
        <form action="/jobs" className="mt-6 grid gap-2 rounded-2xl border border-white/[0.08] bg-[#111621] p-4 sm:grid-cols-2 lg:grid-cols-6">
          <label className="lg:col-span-2"><span className="sr-only">Role or keyword</span><input name="q" defaultValue={searchParams?.q} placeholder="Role or keyword" className="h-10 w-full rounded-lg border border-white/[0.08] bg-[#0b0e17] px-3 text-[11px] outline-none focus:border-[#63e4d9]/40" /></label>
          <label><span className="sr-only">Location</span><input name="location" defaultValue={searchParams?.location} placeholder="Location" className="h-10 w-full rounded-lg border border-white/[0.08] bg-[#0b0e17] px-3 text-[11px] outline-none focus:border-[#63e4d9]/40" /></label>
          <label><span className="sr-only">Required skill</span><input name="skill" defaultValue={searchParams?.skill} placeholder="Skill" className="h-10 w-full rounded-lg border border-white/[0.08] bg-[#0b0e17] px-3 text-[11px] outline-none focus:border-[#63e4d9]/40" /></label>
          <label><span className="sr-only">Experience level</span><select name="level" defaultValue={searchParams?.level ?? ""} className="h-10 w-full rounded-lg border border-white/[0.08] bg-[#0b0e17] px-3 text-[11px] text-[#bfc9d7] outline-none"><option value="">Any experience</option>{experienceOptions.map((level) => <option key={level} value={level}>{level.replaceAll("_", " ")}</option>)}</select></label>
          <div className="flex gap-2"><label className="min-w-0 flex-1"><span className="sr-only">Employment type</span><select name="type" defaultValue={searchParams?.type ?? ""} className="h-10 w-full rounded-lg border border-white/[0.08] bg-[#0b0e17] px-3 text-[11px] text-[#bfc9d7] outline-none"><option value="">Any type</option>{employmentOptions.map((type) => <option key={type} value={type}>{type.replaceAll("_", " ")}</option>)}</select></label><button className="rounded-lg bg-[#54e3d5] px-3 text-[10px] font-semibold text-[#071312]">Filter</button></div>
        </form>
        {!storageAvailable && <p className="mt-5 rounded-xl border border-amber-300/15 bg-amber-200/[0.045] p-4 text-xs leading-5 text-[#d7c798]">Job storage is unavailable. Connect PostgreSQL to browse curated or development demo listings.</p>}
        {storageAvailable && jobs.length === 0 && <div className="mt-5 rounded-2xl border border-white/[0.08] bg-[#111621] px-5 py-12 text-center"><span className="mx-auto grid size-11 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.025] text-[#7ce7dc]"><BriefcaseBusiness size={18} /></span><h2 className="mt-4 text-sm font-semibold">No listings match these filters</h2><p className="mx-auto mt-2 max-w-md text-xs leading-5 text-[#8794a9]">Try broadening the filters. Development demo listings can be loaded with the database seed command.</p></div>}
        {jobs.length > 0 && <div className="mt-5 grid gap-4 lg:grid-cols-2">{jobs.map(({ job, matchPercent, matchingSkills, missingSkills, matchReasons }) => <article key={job.id} className="rounded-2xl border border-white/[0.08] bg-[#111621] p-5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-semibold">{job.title}</h2>{job.isDemo && <span className="rounded-full border border-amber-200/15 bg-amber-100/[0.04] px-2 py-1 text-[8px] uppercase tracking-[0.1em] text-[#d7c798]">Demo listing</span>}</div><p className="mt-1.5 text-xs text-[#9ba8bb]">{job.company}</p></div><div className="shrink-0 text-right"><span className="text-lg font-semibold text-[#72e5db]">{matchPercent}%</span><span className="mt-0.5 block text-[8px] text-[#718097]">profile match</span></div></div><div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[9px] text-[#8290a5]">{job.location && <span><MapPin size={11} className="mr-1 inline" />{job.location}</span>}{job.employmentType && <span>{job.employmentType.replaceAll("_", " ")}</span>}<span>{job.experienceLevel.replaceAll("_", " ")}</span></div><p className="mt-4 line-clamp-3 text-[11px] leading-5 text-[#a6b1c2]">{job.description}</p><div className="mt-4 flex flex-wrap gap-1.5">{job.skills.map((skill) => <span key={skill.name} className={`rounded-md border px-2 py-1 text-[8px] ${matchingSkills.includes(skill.name) ? "border-[#63e4d9]/20 text-[#9debe3]" : "border-white/[0.07] text-[#8d9aaf]"}`}>{skill.name}{skill.isRequired ? " · required" : " · preferred"}</span>)}</div><p className="mt-3 text-[9px] leading-5 text-[#8492a6]"><Sparkles size={11} className="mr-1 inline text-[#73e8dc]" />{matchReasons[0]}{missingSkills.length > 0 ? ` Missing: ${missingSkills.join(", ")}.` : ""}</p><div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3"><span className="text-[8px] text-[#718097]">{job.sourceName ?? (job.isDemo ? "SENSAI demonstration data" : "Curated listing")}{job.salaryMin || job.salaryMax ? ` · ${job.salaryCurrency ?? ""} ${job.salaryMin ?? ""}${job.salaryMax ? `–${job.salaryMax}` : ""}` : " · Compensation not provided"}</span><Link prefetch={false} href={`/jobs/${job.id}`} className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#73e8dc] hover:text-white">View details <ArrowUpRight size={12} /></Link></div></article>)}</div>}
      </section>
    </main>
  );
}
