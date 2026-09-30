import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, MapPin, UserRound } from "lucide-react";
import { getSignedInProfile } from "@/lib/auth/user";
import { syncSignedInUser } from "@/lib/auth/sync-user";
import { prisma } from "@/lib/db/prisma";
import { ButtonLink } from "@/components/ui/button";

export default async function ProfilePage() {
  const identity = await getSignedInProfile();
  if (!identity) redirect("/sign-in");

  let profileData: {
    fullName: string | null;
    email: string | null;
    phone: string | null;
    targetRole: string | null;
    targetIndustry: string | null;
    preferredLocation: string | null;
    education: string | null;
    degree: string | null;
    branch: string | null;
    graduationYear: number | null;
    skills: string[];
    softSkills: string[];
    isComplete: boolean;
  } | null = null;

  try {
    const sync = await syncSignedInUser(identity);
    if (sync.status === "synced") {
      const user = await prisma.user.findUnique({
        where: { id: sync.user.id },
        select: {
          fullName: true,
          email: true,
          phone: true,
          skills: { select: { skill: { select: { name: true } } } },
          onboardingProfile: {
            select: {
              targetRole: true,
              targetIndustry: true,
              preferredLocation: true,
              education: true,
              degree: true,
              branch: true,
              graduationYear: true,
              softSkills: true,
              isComplete: true,
            },
          },
        },
      });
      if (user) {
        profileData = {
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          targetRole: user.onboardingProfile?.targetRole ?? null,
          targetIndustry: user.onboardingProfile?.targetIndustry ?? null,
          preferredLocation: user.onboardingProfile?.preferredLocation ?? null,
          education: user.onboardingProfile?.education ?? null,
          degree: user.onboardingProfile?.degree ?? null,
          branch: user.onboardingProfile?.branch ?? null,
          graduationYear: user.onboardingProfile?.graduationYear ?? null,
          skills: user.skills.map(({ skill }) => skill.name),
          softSkills: user.onboardingProfile?.softSkills ?? [],
          isComplete: user.onboardingProfile?.isComplete ?? false,
        };
      }
    }
  } catch {
    profileData = null;
  }

  const displayName = profileData?.fullName || [identity.firstName, identity.lastName].filter(Boolean).join(" ") || "Your profile";

  return (
    <main className="min-h-screen bg-[#0b0e17] text-[#eef3f9]">
      <header className="border-b border-white/[0.07]"><div className="mx-auto flex h-[68px] w-[min(100%-40px,1040px)] items-center justify-between"><Link href="/dashboard" className="text-sm font-bold tracking-[0.2em]">SENSAI</Link><Link href="/settings" className="text-xs text-[#a4afc0] hover:text-white">Settings</Link></div></header>
      <section className="mx-auto w-[min(100%-40px,1040px)] py-11 sm:py-14">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6de3d7]">Career profile</p><h1 className="mt-3 text-3xl font-medium tracking-[-0.05em]">{displayName}</h1><p className="mt-2 text-sm text-[#98a4b7]">Your background and preferences help shape your SENSAI workspace.</p></div>
          <ButtonLink href="/onboarding" className="w-fit min-h-10 px-3.5 text-xs">Edit profile <ArrowUpRight size={14} /></ButtonLink>
        </div>

        {!profileData && <p className="mt-7 rounded-xl border border-amber-300/15 bg-amber-200/[0.045] px-4 py-3.5 text-xs leading-5 text-[#d7c798]">Profile storage is not available. Connect the PostgreSQL database to view and save your career profile.</p>}

        {profileData && (
          <div className="mt-8 grid gap-4 lg:grid-cols-[.85fr_1.15fr]">
            <section className="rounded-2xl border border-white/[0.08] bg-[#111621] p-5 sm:p-6">
              <span className="grid size-10 place-items-center rounded-xl border border-[#5de1d5]/15 bg-[#4bdccd]/[0.06] text-[#70e6da]"><UserRound size={18} /></span>
              <h2 className="mt-5 text-sm font-semibold">Basic information</h2>
              <dl className="mt-4 space-y-4 text-xs">
                <div><dt className="text-[#748197]">Email</dt><dd className="mt-1 text-[#d6deea]">{profileData.email || "Not provided"}</dd></div>
                <div><dt className="text-[#748197]">Phone</dt><dd className="mt-1 text-[#d6deea]">{profileData.phone || "Not provided"}</dd></div>
                <div><dt className="text-[#748197]">Education</dt><dd className="mt-1 text-[#d6deea]">{[profileData.degree, profileData.branch, profileData.education].filter(Boolean).join(" · ") || "Not added"}{profileData.graduationYear ? ` · ${profileData.graduationYear}` : ""}</dd></div>
              </dl>
            </section>
            <section className="rounded-2xl border border-white/[0.08] bg-[#111621] p-5 sm:p-6">
              <div className="flex items-center gap-2"><MapPin size={15} className="text-[#70e6da]" /><h2 className="text-sm font-semibold">Career direction</h2></div>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2 text-xs">
                <div><dt className="text-[#748197]">Target role</dt><dd className="mt-1 text-[#d6deea]">{profileData.targetRole || "Not added"}</dd></div>
                <div><dt className="text-[#748197]">Industry</dt><dd className="mt-1 text-[#d6deea]">{profileData.targetIndustry || "Not added"}</dd></div>
                <div><dt className="text-[#748197]">Preferred location</dt><dd className="mt-1 text-[#d6deea]">{profileData.preferredLocation || "Not added"}</dd></div>
                <div><dt className="text-[#748197]">Profile status</dt><dd className="mt-1 text-[#d6deea]">{profileData.isComplete ? "Complete" : "In progress"}</dd></div>
              </dl>
              <div className="mt-5 border-t border-white/[0.07] pt-4"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#748197]">Skills</p><div className="mt-2 flex flex-wrap gap-1.5">{profileData.skills.length ? profileData.skills.map((skill) => <span key={skill} className="rounded-lg border border-white/[0.08] bg-white/[0.025] px-2.5 py-1.5 text-[10px] text-[#c0cad8]">{skill}</span>) : <span className="text-xs text-[#8895a8]">No skills added yet.</span>}</div>{profileData.softSkills.length > 0 && <p className="mt-3 text-[10px] leading-5 text-[#8793a7]">Soft skills: {profileData.softSkills.join(", ")}</p>}</div>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
