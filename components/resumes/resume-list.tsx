"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowDownToLine, FileText, LoaderCircle, Trash2 } from "lucide-react";

type ResumeListItem = {
  id: string;
  originalFilename: string;
  sizeBytes: number;
  status: string;
  isActive: boolean;
  uploadedAt: string;
};

function formatBytes(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function ResumeList({ resumes }: { resumes: ResumeListItem[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function deleteResume(resume: ResumeListItem) {
    if (!window.confirm(`Delete “${resume.originalFilename}” from your SENSAI account?`)) return;
    setDeletingId(resume.id);
    setError(null);
    try {
      const response = await fetch(`/api/resumes/${encodeURIComponent(resume.id)}`, { method: "DELETE" });
      const result = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) {
        setError(result?.error ?? "The resume could not be deleted. Try again.");
        return;
      }
      router.refresh();
    } catch {
      setError("We could not reach SENSAI. Check your connection and try again.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      {error && <p className="mb-3 rounded-lg border border-rose-200/15 bg-rose-200/[0.04] px-3 py-2.5 text-xs text-[#e4a5ae]" role="alert">{error}</p>}
      <ul className="grid gap-3">
        {resumes.map((resume) => (
          <li key={resume.id} className="flex flex-col gap-4 rounded-xl border border-white/[0.075] bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/[0.07] bg-[#111621] text-[#7ce7dc]"><FileText size={17} /></span>
              <div className="min-w-0"><p className="truncate text-xs font-semibold text-[#dfe6f0]">{resume.originalFilename}</p><p className="mt-1 text-[10px] text-[#7e8ba0]">{new Date(resume.uploadedAt).toISOString().slice(0, 10)} · {formatBytes(resume.sizeBytes)} · {resume.status.toLowerCase()}</p></div>
              {resume.isActive && <span className="shrink-0 rounded-md border border-[#5bded2]/15 bg-[#4bdccd]/[0.04] px-2 py-1 text-[9px] font-medium text-[#81e9df]">Active</span>}
            </div>
            <div className="flex items-center gap-2 pl-[52px] sm:pl-0">
              <Link href={`/api/resumes/${encodeURIComponent(resume.id)}`} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/10 px-3 text-[10px] font-semibold text-[#b9c4d3] transition-colors hover:bg-white/[0.05]"><ArrowDownToLine size={13} /> Download</Link>
              <button type="button" onClick={() => void deleteResume(resume)} disabled={deletingId === resume.id} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-rose-200/10 px-3 text-[10px] font-semibold text-[#d9a2aa] transition-colors hover:bg-rose-200/[0.05] disabled:opacity-50">
                {deletingId === resume.id ? <LoaderCircle size={13} className="animate-spin" /> : <Trash2 size={13} />}
                {deletingId === resume.id ? "Deleting" : "Delete"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
