"use client";

import { useState } from "react";
import { Check, LoaderCircle, ShieldCheck, Trash2 } from "lucide-react";
import { defaultUserSettings, type UserSettings } from "@/lib/validation/settings";
import { Button } from "@/components/ui/button";

function Toggle({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start justify-between gap-5 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
      <span><span className="block text-xs font-semibold text-[#dce4ef]">{label}</span><span className="mt-1.5 block max-w-[460px] text-[11px] leading-5 text-[#8794a9]">{description}</span></span>
      <span className="relative mt-0.5 shrink-0">
        <input id={id} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="peer sr-only" />
        <span aria-hidden="true" className="block h-6 w-11 rounded-full border border-white/10 bg-[#242b38] transition-colors peer-checked:border-[#55dcd1]/40 peer-checked:bg-[#44cfc3]/40 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#63e9dc]" />
        <span aria-hidden="true" className="absolute left-1 top-1 size-4 rounded-full bg-[#9ca8b9] transition-transform peer-checked:translate-x-5 peer-checked:bg-[#8df5e9]" />
      </span>
    </label>
  );
}

export function SettingsForm({
  initialSettings,
  storageAvailable,
  hasOpenDeletionRequest,
}: {
  initialSettings: UserSettings;
  storageAvailable: boolean;
  hasOpenDeletionRequest: boolean;
}) {
  const [settings, setSettings] = useState<UserSettings>(initialSettings ?? defaultUserSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const [requestOpen, setRequestOpen] = useState(hasOpenDeletionRequest);
  const [isRequesting, setIsRequesting] = useState(false);

  function update(key: keyof UserSettings, value: boolean) {
    setSettings((current) => ({ ...current, [key]: value }));
    setMessage(null);
  }

  async function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const result = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) {
        setError(result?.error ?? "Could not save settings. Try again.");
        return;
      }
      setMessage("Your settings have been saved.");
    } catch {
      setError("We could not reach SENSAI. Check your connection and try again.");
    } finally {
      setIsSaving(false);
    }
  }

  async function requestDeletion() {
    setIsRequesting(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/account-deletion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation }),
      });
      const result = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) {
        setError(result?.error ?? "Could not record the request. Try again.");
        return;
      }
      setRequestOpen(true);
      setMessage("Your application data deletion request has been recorded.");
      setConfirmation("");
    } catch {
      setError("We could not reach SENSAI. Check your connection and try again.");
    } finally {
      setIsRequesting(false);
    }
  }

  return (
    <div className="grid gap-5">
      {!storageAvailable && <p className="rounded-xl border border-amber-300/15 bg-amber-200/[0.045] px-4 py-3 text-xs leading-5 text-[#d7c798]" role="status">Settings will be saved when SENSAI database storage is connected.</p>}

      <form onSubmit={saveSettings} className="rounded-2xl border border-white/[0.08] bg-[#111621] p-5 sm:p-6">
        <div className="flex items-center gap-2"><ShieldCheck size={16} className="text-[#6de3d7]" /><h2 className="text-sm font-semibold">Privacy and AI controls</h2></div>
        <p className="mt-2 text-[11px] leading-5 text-[#8794a9]">Choose how SENSAI may use your profile data to provide career guidance.</p>
        <div className="mt-5 grid gap-3">
          <Toggle id="allowAiProcessing" label="Allow AI-assisted career features" description="When enabled, information you submit may be sent to the configured AI provider to generate requested career assistance. Turn this off to disable those features." checked={settings.allowAiProcessing} onChange={(value) => update("allowAiProcessing", value)} />
        </div>
        <div className="mt-7 border-t border-white/[0.07] pt-5"><h3 className="text-xs font-semibold text-[#dce4ef]">Notifications</h3><div className="mt-3 grid gap-3"><Toggle id="emailNotifications" label="Email updates" description="Receive account and product updates by email." checked={settings.emailNotifications} onChange={(value) => update("emailNotifications", value)} /><Toggle id="weeklyProgressSummary" label="Weekly progress summary" description="Receive a summary of saved roadmap and practice progress." checked={settings.weeklyProgressSummary} onChange={(value) => update("weeklyProgressSummary", value)} /></div></div>
        {message && <p className="mt-4 flex items-center gap-2 text-xs text-[#7fe8dd]" role="status"><Check size={14} /> {message}</p>}
        {error && <p className="mt-4 text-xs text-[#e4a5ae]" role="alert">{error}</p>}
        <div className="mt-5"><Button type="submit" disabled={isSaving || !storageAvailable} className="min-h-10 px-4 text-xs">{isSaving ? <><LoaderCircle size={14} className="animate-spin" /> Saving…</> : "Save settings"}</Button></div>
      </form>

      <section className="rounded-2xl border border-rose-200/[0.12] bg-[#111621] p-5 sm:p-6">
        <div className="flex items-center gap-2"><Trash2 size={15} className="text-[#d99ba6]" /><h2 className="text-sm font-semibold">Application data</h2></div>
        <p className="mt-2 max-w-[650px] text-[11px] leading-5 text-[#929eb1]">Request deletion of your SENSAI application data. Your Clerk sign-in account is managed separately and will not be deleted by this request.</p>
        {requestOpen ? <p className="mt-4 rounded-lg border border-[#5de1d5]/15 bg-[#4bdccd]/[0.04] px-3.5 py-3 text-xs text-[#9debe3]" role="status">A deletion request is on file for this account.</p> : (
          <div className="mt-4 max-w-[430px]">
            <label htmlFor="confirmDeletion" className="block text-[11px] font-medium text-[#b9c4d3]">Type <span className="font-mono text-[#e6bac1]">DELETE</span> to confirm</label>
            <input id="confirmDeletion" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-2 min-h-10 w-full rounded-lg border border-white/10 bg-[#0b0f18] px-3 text-xs text-white outline-none focus:border-rose-200/40" autoComplete="off" />
            <Button type="button" variant="secondary" disabled={!storageAvailable || confirmation !== "DELETE" || isRequesting} onClick={requestDeletion} className="mt-3 min-h-10 border-rose-200/15 px-3.5 text-xs text-[#e3a7b0] hover:bg-rose-200/[0.06]">{isRequesting ? "Sending request…" : "Request data deletion"}</Button>
          </div>
        )}
      </section>
    </div>
  );
}
