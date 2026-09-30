import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getSignedInProfile } from "@/lib/auth/user";
import { syncSignedInUser } from "@/lib/auth/sync-user";
import { prisma } from "@/lib/db/prisma";
import { getSkillCategory, normalizeSkillName } from "@/lib/skills/normalize";
import { onboardingCompleteSchema, onboardingSaveSchema } from "@/lib/validation/onboarding";

function nullable(value: string) {
  return value.trim() || null;
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Please sign in to save your profile." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "The profile data was not valid." }, { status: 400 });
  }

  const base = onboardingSaveSchema.safeParse(body);
  if (!base.success) {
    return NextResponse.json({ error: base.error.issues[0]?.message ?? "Review the profile fields and try again." }, { status: 400 });
  }

  const parsed = base.data.step === 6 ? onboardingCompleteSchema.safeParse(body) : base;
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Complete the required fields before continuing." }, { status: 400 });
  }

  const profile = await getSignedInProfile();
  if (!profile || profile.clerkUserId !== userId) {
    return NextResponse.json({ error: "Your session could not be verified. Please sign in again." }, { status: 401 });
  }

  let syncedUser;
  try {
    syncedUser = await syncSignedInUser(profile);
  } catch {
    return NextResponse.json({ error: "SENSAI could not connect to profile storage. Try again shortly." }, { status: 503 });
  }
  if (syncedUser.status !== "synced") {
    return NextResponse.json({ error: "Profile storage is not configured yet." }, { status: 503 });
  }

  const { step, values } = parsed.data;

  try {
    const saved = await prisma.$transaction(async (tx) => {
      const existing = await tx.onboardingProfile.findUnique({ where: { userId: syncedUser.user.id } });
      const nextIsComplete = step === 6 || (existing?.isComplete ?? false);

      await tx.user.update({
        where: { id: syncedUser.user.id },
        data: {
          fullName: nullable(values.fullName) ?? syncedUser.user.fullName,
          phone: nullable(values.phone),
        },
      });

      const onboardingProfile = await tx.onboardingProfile.upsert({
        where: { userId: syncedUser.user.id },
        create: {
          userId: syncedUser.user.id,
          education: nullable(values.education),
          degree: nullable(values.degree),
          branch: nullable(values.branch),
          graduationYear: values.graduationYear,
          experienceLevel: values.experienceLevel,
          targetRole: nullable(values.targetRole),
          targetIndustry: nullable(values.targetIndustry),
          preferredLocation: nullable(values.preferredLocation),
          careerGoal: nullable(values.careerGoal),
          learningGoals: values.learningGoals,
          softSkills: values.softSkills,
          completedSteps: step,
          isComplete: nextIsComplete,
        },
        update: {
          education: nullable(values.education),
          degree: nullable(values.degree),
          branch: nullable(values.branch),
          graduationYear: values.graduationYear,
          experienceLevel: values.experienceLevel,
          targetRole: nullable(values.targetRole),
          targetIndustry: nullable(values.targetIndustry),
          preferredLocation: nullable(values.preferredLocation),
          careerGoal: nullable(values.careerGoal),
          learningGoals: values.learningGoals,
          softSkills: values.softSkills,
          completedSteps: Math.max(existing?.completedSteps ?? 0, step),
          isComplete: nextIsComplete,
        },
        select: { completedSteps: true, isComplete: true },
      });

      if (step >= 3) {
        const uniqueSkills = new Map(
          values.skills.map((value) => {
            const skill = normalizeSkillName(value);
            return [skill.normalizedKey, skill] as const;
          }),
        );
        const skills = [...uniqueSkills.values()];
        const normalizedKeys = skills.map((skill) => skill.normalizedKey);

        if (skills.length > 0) {
          await tx.skill.createMany({
            data: skills.map((skill) => ({ ...skill, category: getSkillCategory(skill.name) })),
            skipDuplicates: true,
          });
        }

        const skillRows = normalizedKeys.length
          ? await tx.skill.findMany({ where: { normalizedKey: { in: normalizedKeys } }, select: { id: true } })
          : [];
        const skillIds = skillRows.map((skill) => skill.id);

        await tx.userSkill.deleteMany({
          where: {
            userId: syncedUser.user.id,
            source: "PROFILE",
            ...(skillIds.length ? { skillId: { notIn: skillIds } } : {}),
          },
        });

        if (skillIds.length) {
          await tx.userSkill.createMany({
            data: skillIds.map((skillId) => ({ userId: syncedUser.user.id, skillId, source: "PROFILE" as const })),
            skipDuplicates: true,
          });
        }
      }

      return onboardingProfile;
    });

    return NextResponse.json({ saved: true, ...saved });
  } catch {
    return NextResponse.json({ error: "SENSAI could not save your profile. Please try again." }, { status: 503 });
  }
}
