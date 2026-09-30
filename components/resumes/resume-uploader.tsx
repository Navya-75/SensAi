"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileUp, LoaderCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAX_RESUME_BYTES } from "@/lib/resumes/constants";

export function ResumeUploader({ databaseAvailable }: { databaseAvailable: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function upload(file?: File) {
    if (!file) return;
    setMessage(null);
    setError(null);
    if (!databaseAvailable) {
      setError("Resume storage is not configured yet.");
      return;
    }
    if (!file.name.toLowerCase().endsWith(".pdf") || (file.type && file.type !== "application/pdf")) {
      setError("Choose a PDF file.");
      return;
    }
    if (file.size > MAX_RESUME_BYTES) {
      setError("Choose a PDF smaller than 4 MB.");
      return;
    }

    setIsUploading(true);
    const form = new FormData();
    form.set("file", file);
    try {
      const response = await fetch("/api/resumes", { method: "POST", body: form });
      const result = await response.json().catch(() => null) as { error?: string; resume?: { originalFilename: string; pageCount: number } } | null;
      if (!response.ok) {
        setError(result?.error ?? "The resume could not be processed. Try again.");
        return;
      }
      const pageCount = result?.resume?.pageCount ?? 0;
      const pageLabel = pageCount === 1 ? "1 page" : `${pageCount} pages`;
      setMessage(`Uploaded ${result?.resume?.originalFilename ?? file.name}. Extracted selectable text from ${pageLabel}.`);
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    } catch {
      setError("We could not reach SENSAI. Check your connection and try again.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/[0.08] bg-[#111621] p-5 sm:p-6">
      <h2 className="text-sm font-semibold text-[#eaf0f8]">Upload a resume</h2>
      <p className="mt-1.5 text-xs leading-5 text-[#909db1]">Upload a text-based PDF. SENSAI extracts the text securely on the server.</p>
      <div
        onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsDragging(false); }}
        onDrop={(event) => { event.preventDefault(); setIsDragging(false); void upload(event.dataTransfer.files[0]); }}
        className={`mt-5 rounded-xl border border-dashed px-4 py-8 text-center transition-colors sm:py-10 ${isDragging ? "border-[#65e4d9]/60 bg-[#4bdccd]/[0.06]" : "border-white/15 bg-white/[0.015]"}`}
      >
        <span className="mx-auto grid size-11 place-items-center rounded-xl border border-[#59ded3]/15 bg-[#4bdccd]/[0.06] text-[#70e6da]"><FileUp size={19} /></span>
        <p className="mt-4 text-xs font-semibold text-[#dce4ef]">Drag a PDF here or browse your files</p>
        <p className="mt-1.5 text-[10px] text-[#7f8ba0]">PDF · up to 4 MB</p>
        <input
          ref={inputRef}
          id="resume-file"
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          aria-label="Choose a PDF resume"
          onChange={(event) => void upload(event.target.files?.[0])}
          disabled={isUploading || !databaseAvailable}
        />
        <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()} disabled={isUploading || !databaseAvailable} className="mt-4 min-h-9 px-3.5 text-[11px]">
          {isUploading ? <><LoaderCircle size={14} className="animate-spin" /> Processing PDF…</> : "Choose file"}
        </Button>
      </div>
      <p className="mt-4 flex items-center gap-2 text-[10px] leading-5 text-[#7f8ba0]"><ShieldCheck size={13} className="shrink-0 text-[#67dacf]" /> Private to your account. Audio or other files are not accepted.</p>
      {!databaseAvailable && <div className="mt-4 rounded-xl border border-[#dfd0bd] bg-[#f2e9dc] p-4 text-left" role="status"><p className="text-[11px] font-semibold text-[#49382d]">PostgreSQL is not connected yet</p><p className="mt-1.5 text-[10px] leading-5 text-[#716254]">Resume uploads need a database to save the private file record. Add your pooled <code>DATABASE_URL</code> and direct <code>DIRECT_URL</code> to <code>.env.local</code>, run <code>npm run db:deploy</code>, then restart the development server. Keep those connection strings private.</p><Link href="/dashboard" className="mt-2 inline-block text-[10px] font-semibold text-[#805a40]">Back to your workspace →</Link></div>}
      {message && <p className="mt-4 rounded-lg border border-[#5de1d5]/15 bg-[#4bdccd]/[0.04] px-3 py-2.5 text-xs text-[#9debe3]" role="status">{message}</p>}
      {error && <p className="mt-4 rounded-lg border border-rose-200/15 bg-rose-200/[0.04] px-3 py-2.5 text-xs text-[#e4a5ae]" role="alert">{error}</p>}
    </section>
  );
}
