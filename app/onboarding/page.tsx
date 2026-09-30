import { redirect } from "next/navigation";
import Link from "next/link";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { emptyOnboardingValues, type OnboardingValues } from "@/lib/validation/onboarding";
import { getSignedInProfile } from "@/lib/auth/user";
import { syncSignedInUser } from "@/lib/auth/sync-user";
import { prisma } from "@/lib/db/prisma";

export default async function OnboardingPage() {
  const clerkProfile = await getSignedInProfile();
  if (!clerkProfile) redirect("/sign-in");

  let initialValues: OnboardingValues = {
    ...emptyOnboardingValues,
    fullName: [clerkProfile.firstName, clerkProfile.lastName].filter(Boolean).join(" "),
  };
  let initialStep = 0;
  let storageAvailable = false;

  try {
    const sync = await syncSignedInUser(clerkProfile);
    if (sync.status === "synced") {
      const user = await prisma.user.findUnique({
        where: { clerkUserId: clerkProfile.clerkUserId },
        select: {
          fullName: true,
          phone: true,
          onboardingProfile: true,
          skills: {
            where: { source: "PROFILE" },
            select: { skill: { select: { name: true, category: true } } },
          },
        },
      });

      if (user) {
        const profile = user.onboardingProfile;
        initialValues = {
          fullName: user.fullName ?? initialValues.fullName,
          phone: user.phone ?? "",
          education: profile?.education ?? "",
          degree: profile?.degree ?? "",
          branch: profile?.branch ?? "",
          graduationYear: profile?.graduationYear ?? null,
          experienceLevel: profile?.experienceLevel ?? "EXPLORING",
          skills: user.skills.map(({ skill }) => skill.name),
          softSkills: profile?.softSkills ?? [],
          targetRole: profile?.targetRole ?? "",
          targetIndustry: profile?.targetIndustry ?? "",
          preferredLocation: profile?.preferredLocation ?? "",
          careerGoal: profile?.careerGoal ?? "",
          learningGoals: profile?.learningGoals ?? [],
        };
        initialStep = profile?.completedSteps ?? 0;
      }
      storageAvailable = true;
    }
  } catch {
    storageAvailable = false;
  }

  return (
    <main className="min-h-screen bg-[#0b0e17] px-4 py-7 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-[920px]">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-[#e9eff7]">SENSAI <span className="font-normal tracking-normal text-[#7f8ba0]">/ Career profile</span></Link>
        <p className="mt-5 text-sm leading-6 text-[#8f9bb0]">A few details help make your career workspace more relevant to you. You can update your profile at any time.</p>
        <div className="mt-7">
          <OnboardingWizard initialValues={initialValues} initialStep={initialStep} storageAvailable={storageAvailable} />
        </div>
      </div>
    </main>
  );
}
