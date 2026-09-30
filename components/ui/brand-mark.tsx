import { Sparkles } from "lucide-react";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5" aria-label="SENSAI home">
      <span className="grid size-8 place-items-center rounded-[10px] border border-[#68eade]/25 bg-[#44d8ca]/10 text-[#72eee2]">
        <Sparkles size={16} strokeWidth={1.8} aria-hidden="true" />
      </span>
      {!compact && (
        <span className="text-[15px] font-bold tracking-[0.18em] text-[#f1f5fb]">
          SENSAI
        </span>
      )}
    </span>
  );
}
