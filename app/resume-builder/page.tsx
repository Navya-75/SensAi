import Link from "next/link";
import { redirect } from "next/navigation";
import { ResumeBuilder } from "@/components/resume-builder/resume-builder";
import { getSignedInProfile } from "@/lib/auth/user";
import { syncSignedInUser } from "@/lib/auth/sync-user";
import { prisma } from "@/lib/db/prisma";
import { emptyResumeSections, resumeSectionsSchema, type ResumeBuilderData } from "@/lib/validation/resume-builder";
import { resumeAnalysisSchema } from "@/lib/ai/schemas/resume-analysis";

function entry(id: string, title: string, subtitle = "", details = "") {
  return { id, title, subtitle, details };
}

export default async function ResumeBuilderPage() {
  const identity = await getSignedInProfile();
  if (!identity) redirect("/sign-in");
  let available = false;
  let initial: ResumeBuilderData = { title: "My resume", templateKey: "ats", sections: emptyResumeSections };
  try {
    const sync = await syncSignedInUser(identity);
    if (sync.status === "synced") {
      const [saved, user, latest] = await Promise.all([
        prisma.resumeBuilderDocument.findUnique({ where: { userId: sync.user.id }, select: { title: true, templateKey: true, sections: true } }),
        prisma.user.findUnique({ where: { id: sync.user.id }, select: { fullName: true, email: true, phone: true, onboardingProfile: { select: { education: true, degree: true, branch: true, graduationYear: true } }, skills: { select: { skill: { select: { name: true } } } } } }),
        prisma.resumeAnalysis.findFirst({ where: { userId: sync.user.id }, orderBy: { createdAt: "desc" }, select: { result: true } }),
      ]);
      if (saved) {
        const sections = resumeSectionsSchema.safeParse(saved.sections);
        if (sections.success && (saved.templateKey === "ats" || saved.templateKey === "modern")) initial = { title: saved.title, templateKey: saved.templateKey, sections: sections.data };
      } else if (user) {
        const analysis = latest ? resumeAnalysisSchema.safeParse(latest.result) : null;
        const source = analysis?.success ? analysis.data : null;
        initial = {
          title: "My resume",
          templateKey: "ats",
          sections: {
            ...emptyResumeSections,
            contact: { ...emptyResumeSections.contact, fullName: user.fullName ?? "", email: user.email ?? "", phone: user.phone ?? "" },
            skills: [...new Set(user.skills.map(({ skill }) => skill.name))],
            education: user.onboardingProfile?.degree || user.onboardingProfile?.education ? [entry("profile-education", [user.onboardingProfile.degree, user.onboardingProfile.branch].filter(Boolean).join(" · "), user.onboardingProfile.education ?? "", user.onboardingProfile.graduationYear ? String(user.onboardingProfile.graduationYear) : "")] : [],
            experience: source?.experience.flatMap((item, index) => item.evidence ? [entry(`resume-experience-${index}`, item.title ?? "", [item.organization, item.dates].filter(Boolean).join(" · "), item.evidence)] : []) ?? [],
            projects: source?.projects.flatMap((item, index) => item.evidence ? [entry(`resume-project-${index}`, item.name ?? "Project", item.skills.join(" · "), item.evidence)] : []) ?? [],
            certifications: source?.certifications.map((item, index) => entry(`resume-cert-${index}`, item.evidence)) ?? [],
            achievements: source?.achievements.map((item, index) => entry(`resume-achievement-${index}`, item.evidence)) ?? [],
          },
        };
      }
      available = true;
    }
  } catch {
    available = false;
  }

  return <main className="min-h-screen bg-[#0b0e17] text-[#eef3f9]"><header className="print:hidden border-b border-white/[0.07]"><div className="mx-auto flex h-[68px] w-[min(100%-40px,1120px)] items-center justify-between"><Link href="/dashboard" className="text-sm font-bold tracking-[0.2em]">SENSAI</Link><nav className="flex gap-4 text-xs text-[#a4afc0]"><Link href="/resume/analyzer" className="hover:text-white">Resume analysis</Link><Link href="/cover-letters" className="hover:text-white">Cover letters</Link></nav></div></header><section className="mx-auto w-[min(100%-40px,1120px)] py-10 print:w-full print:p-0"><p className="print:hidden text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6de3d7]">Resume workspace</p><h1 className="print:hidden mt-3 text-3xl font-medium tracking-[-0.05em]">Resume builder</h1><p className="print:hidden mt-2 text-sm text-[#98a4b7]">Edit every section, keep claims grounded in your experience, and export through your browser’s PDF print dialog.</p><div className="mt-6 print:mt-0"><ResumeBuilder available={available} aiAvailable={Boolean(process.env.GEMINI_API_KEY)} initialData={initial} /></div></section></main>;
}
