import type { LucideIcon } from "lucide-react";

export function FeatureCard({
  icon: Icon,
  number,
  title,
  description,
}: {
  icon: LucideIcon;
  number: string;
  title: string;
  description: string;
}) {
  return (
    <article className="group rounded-2xl border border-white/[0.075] bg-white/[0.025] p-5 transition-colors hover:border-[#5de5d7]/25 hover:bg-white/[0.04] sm:p-6">
      <div className="mb-8 flex items-center justify-between">
        <span className="grid size-10 place-items-center rounded-xl border border-[#51dccc]/15 bg-[#44d8ca]/[0.07] text-[#68e5da] transition-colors group-hover:bg-[#44d8ca]/[0.12]">
          <Icon size={18} strokeWidth={1.7} aria-hidden="true" />
        </span>
        <span className="font-mono text-[11px] text-[#667286]">{number}</span>
      </div>
      <h3 className="text-[16px] font-semibold tracking-[-0.02em] text-[#ebf0f8]">{title}</h3>
      <p className="mt-2.5 text-[13px] leading-6 text-[#929eb2]">{description}</p>
    </article>
  );
}
