"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { emptyOnboardingValues, type OnboardingValues } from "@/lib/validation/onboarding";

const steps = ["Basics", "Education", "Skills", "Preferences", "Goals", "Confirm"];
const inputClass = "mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-[#0b0f18] px-3.5 text-sm text-[#ecf1f8] outline-none placeholder:text-[#657187] focus:border-[#55dcd1]/55 focus:ring-2 focus:ring-[#55dcd1]/10";
const labelClass = "block text-xs font-medium text-[#bdc7d5]";

function splitList(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 20);
}

function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label htmlFor={id} className={labelClass}>
      {label}
      <input id={id} name={id} className={inputClass} type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function TextArea({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label htmlFor={id} className={labelClass}>
      {label}
      <textarea id={id} name={id} className={`${inputClass} min-h-28 resize-y py-3`} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

export function OnboardingWizard({
  initialValues,
  initialStep,
  storageAvailable,
}: {
  initialValues: OnboardingValues;
  initialStep: number;
  storageAvailable: boolean;
}) {
  const router = useRouter();
  const [values, setValues] = useState<OnboardingValues>(initialValues ?? emptyOnboardingValues);
  const [listText, setListText] = useState({
    skills: initialValues.skills.join(", "),
    softSkills: initialValues.softSkills.join(", "),
    learningGoals: initialValues.learningGoals.join(", "),
  });
  const [step, setStep] = useState(Math.max(0, Math.min(initialStep, steps.length - 1)));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof OnboardingValues>(key: K, value: OnboardingValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function updateList(key: keyof typeof listText, text: string) {
    setListText((current) => ({ ...current, [key]: text }));
    update(key, splitList(text));
  }

  async function save(stepNumber: number) {
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: stepNumber, values }),
      });
      const result = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) {
        setError(result?.error ?? (response.status === 503 ? "Profile storage is unavailable." : "Could not save your progress. Check the fields and try again."));
        return false;
      }
      return true;
    } catch {
      setError("We could not reach SENSAI. Check your connection and try again.");
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function next() {
    const stepNumber = step + 1;
    if (!(await save(stepNumber))) return;
    if (step === steps.length - 1) {
      router.push("/dashboard");
      router.refresh();
      return;
    }
    setStep((current) => current + 1);
  }

  function previous() {
    if (step === 0) return;
    setError(null);
    setStep((current) => Math.max(0, current - 1));
  }

  async function saveAndExit() {
    if (await save(step + 1)) router.push("/dashboard");
  }

  const progress = ((step + 1) / steps.length) * 100;

  return (
    <section className="mx-auto w-full max-w-[760px] rounded-2xl border border-white/[0.09] bg-[#101520] p-5 shadow-panel sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6de3d7]">Career profile · Step {step + 1} of {steps.length}</p><h1 className="mt-2 text-2xl font-medium tracking-[-0.04em] text-[#eff3f9] sm:text-[28px]">{steps[step]}</h1></div>
        <button type="button" onClick={saveAndExit} disabled={isSaving} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-white/10 px-3 text-[11px] font-medium text-[#aab5c6] transition-colors hover:bg-white/[0.045] disabled:opacity-50"><Save size={13} /> Save and exit</button>
      </div>

      <div className="mt-6 h-1 overflow-hidden rounded-full bg-white/[0.07]" role="progressbar" aria-label="Onboarding progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
        <div className="h-full rounded-full bg-[#59dfd3] transition-[width] duration-300" style={{ width: `${progress}%` }} />
      </div>
      <ol className="mt-3 hidden grid-cols-6 gap-2 sm:grid" aria-label="Onboarding steps">
        {steps.map((title, index) => <li key={title} className={`text-[10px] ${index <= step ? "text-[#bfece7]" : "text-[#657187]"}`}>{title}</li>)}
      </ol>

      {!storageAvailable && <p className="mt-5 rounded-xl border border-amber-300/15 bg-amber-200/[0.045] px-3.5 py-3 text-xs leading-5 text-[#d7c798]" role="status">Your account is signed in. Profile saving will be available when the database is configured.</p>}

      <div className="mt-7 min-h-[260px]">
        {step === 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField id="fullName" label="Full name" value={values.fullName} placeholder="Your name" onChange={(value) => update("fullName", value)} />
            <TextField id="phone" label="Phone (optional)" type="tel" value={values.phone} placeholder="+1 555 0100" onChange={(value) => update("phone", value)} />
            <p className="text-[11px] leading-5 text-[#79869b] sm:col-span-2">Use the name you want SENSAI to use. Your account email is managed securely by Clerk.</p>
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField id="education" label="Education" value={values.education} placeholder="University, college, or other" onChange={(value) => update("education", value)} />
            <TextField id="degree" label="Degree or qualification" value={values.degree} placeholder="B.Tech, B.Sc, diploma…" onChange={(value) => update("degree", value)} />
            <TextField id="branch" label="Branch or field of study" value={values.branch} placeholder="Computer science" onChange={(value) => update("branch", value)} />
            <TextField id="graduationYear" label="Graduation year (optional)" type="number" value={values.graduationYear?.toString() ?? ""} placeholder="2027" onChange={(value) => update("graduationYear", value ? Number(value) : null)} />
            <label htmlFor="experienceLevel" className={labelClass}>
              Experience level
              <select id="experienceLevel" className={inputClass} value={values.experienceLevel} onChange={(event) => update("experienceLevel", event.target.value as OnboardingValues["experienceLevel"])}>
                <option value="EXPLORING">Still exploring</option><option value="STUDENT">Student</option><option value="ENTRY_LEVEL">Entry level</option><option value="EARLY_CAREER">Early career</option><option value="MID_CAREER">Mid career</option><option value="SENIOR">Senior</option>
              </select>
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-5">
            <TextArea id="skills" label="Current skills" placeholder="JavaScript, React, SQL" value={listText.skills} onChange={(value) => updateList("skills", value)} />
            <p className="-mt-4 text-[10px] text-[#718097]">Separate skills with commas. Add only skills you currently have.</p>
            <TextArea id="softSkills" label="Soft skills (optional)" placeholder="Communication, collaboration" value={listText.softSkills} onChange={(value) => updateList("softSkills", value)} />
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField id="targetRole" label="Target job role" value={values.targetRole} placeholder="Frontend developer" onChange={(value) => update("targetRole", value)} />
            <TextField id="targetIndustry" label="Preferred industry" value={values.targetIndustry} placeholder="Technology, healthcare…" onChange={(value) => update("targetIndustry", value)} />
            <div className="sm:col-span-2"><TextField id="preferredLocation" label="Preferred location" value={values.preferredLocation} placeholder="City, region, or remote" onChange={(value) => update("preferredLocation", value)} /></div>
          </div>
        )}

        {step === 4 && (
          <div className="grid gap-4">
            <TextArea id="careerGoal" label="What would you like to work toward?" placeholder="Describe the kind of work or career direction that matters to you." value={values.careerGoal} onChange={(value) => update("careerGoal", value)} />
            <TextArea id="learningGoals" label="Learning goals (optional)" placeholder="Build a portfolio, learn TypeScript, practice interviews" value={listText.learningGoals} onChange={(value) => updateList("learningGoals", value)} />
            <p className="-mt-3 text-[10px] text-[#718097]">Separate learning goals with commas. These guide suggestions, not guarantees.</p>
          </div>
        )}

        {step === 5 && (
          <div>
            <p className="text-sm leading-6 text-[#9aa6b8]">Review your profile details. You can return to any step and update them before completing setup.</p>
            <dl className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                ["Name", values.fullName || "Not added"],
                ["Education", [values.degree, values.branch, values.education].filter(Boolean).join(" · ") || "Not added"],
                ["Experience", values.experienceLevel.replaceAll("_", " ").toLowerCase()],
                ["Skills", values.skills.join(", ") || "Not added"],
                ["Target role", values.targetRole || "Not added"],
                ["Preferred industry", values.targetIndustry || "Not added"],
                ["Preferred location", values.preferredLocation || "Not added"],
                ["Career goal", values.careerGoal || "Not added"],
              ].map(([label, value]) => <div key={label} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5"><dt className="text-[10px] uppercase tracking-[0.12em] text-[#78869b]">{label}</dt><dd className="mt-1.5 break-words text-xs leading-5 text-[#dce4ef]">{value}</dd></div>)}
            </dl>
            <p className="mt-4 flex items-center gap-2 text-[11px] leading-5 text-[#8290a5]"><Check size={13} className="shrink-0 text-[#67e3d8]" /> SENSAI uses this information to personalize your career workspace.</p>
          </div>
        )}
      </div>

      {error && <p className="mt-5 rounded-xl border border-rose-300/15 bg-rose-300/[0.045] px-3.5 py-3 text-xs text-[#e4a5ae]" role="alert">{error}</p>}

      <div className="mt-8 flex items-center justify-between border-t border-white/[0.07] pt-5">
        <Button variant="secondary" type="button" onClick={previous} disabled={step === 0 || isSaving} className="min-h-10 px-3 text-xs"><ArrowLeft size={14} /> Back</Button>
        <Button type="button" onClick={next} disabled={isSaving} className="min-h-10 px-4 text-xs">
          {isSaving ? "Saving…" : step === steps.length - 1 ? "Complete profile" : "Save and continue"}
          {!isSaving && <ArrowRight size={14} />}
        </Button>
      </div>
    </section>
  );
}
