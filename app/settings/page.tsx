import Link from "next/link";
import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/settings/settings-form";
import { getSignedInProfile } from "@/lib/auth/user";
import { syncSignedInUser } from "@/lib/auth/sync-user";
import { prisma } from "@/lib/db/prisma";
import { defaultUserSettings, type UserSettings } from "@/lib/validation/settings";

export default async function SettingsPage() {
  const identity = await getSignedInProfile();
  if (!identity) redirect("/sign-in");

  let settings: UserSettings = defaultUserSettings;
  let storageAvailable = false;
  let hasOpenDeletionRequest = false;

  try {
    const sync = await syncSignedInUser(identity);
    if (sync.status === "synced") {
      const [preferences, request] = await Promise.all([
        prisma.userPreference.upsert({
          where: { userId: sync.user.id },
          create: { userId: sync.user.id },
          update: {},
          select: { allowAiProcessing: true, emailNotifications: true, weeklyProgressSummary: true },
        }),
        prisma.dataDeletionRequest.findFirst({
          where: { clerkUserId: identity.clerkUserId, status: "REQUESTED" },
          select: { id: true },
        }),
      ]);
      settings = preferences;
      hasOpenDeletionRequest = Boolean(request);
      storageAvailable = true;
    }
  } catch {
    storageAvailable = false;
  }

  return (
    <main className="min-h-screen bg-[#0b0e17] text-[#eef3f9]">
      <header className="border-b border-white/[0.07]"><div className="mx-auto flex h-[68px] w-[min(100%-40px,900px)] items-center justify-between"><Link href="/dashboard" className="text-sm font-bold tracking-[0.2em]">SENSAI</Link><Link href="/profile" className="text-xs text-[#a4afc0] hover:text-white">Career profile</Link></div></header>
      <section className="mx-auto w-[min(100%-40px,900px)] py-11 sm:py-14">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6de3d7]">Account</p>
        <h1 className="mt-3 text-3xl font-medium tracking-[-0.05em]">Settings</h1>
        <p className="mt-2 text-sm text-[#98a4b7]">Manage your AI preferences, notifications, and application data requests.</p>
        <div className="mt-7"><SettingsForm initialSettings={settings} storageAvailable={storageAvailable} hasOpenDeletionRequest={hasOpenDeletionRequest} /></div>
      </section>
    </main>
  );
}
