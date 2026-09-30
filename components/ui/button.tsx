import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

type ButtonVariant = "primary" | "secondary" | "quiet";

const styles: Record<ButtonVariant, string> = {
  primary:
    "border border-[#67eee0] bg-[#54e3d5] text-[#071312] shadow-[0_8px_30px_rgba(67,218,206,.12)] hover:bg-[#78f1e4]",
  secondary:
    "border border-white/10 bg-white/[0.035] text-[#e9eef7] hover:border-white/20 hover:bg-white/[0.07]",
  quiet: "border border-transparent text-[#aab4c6] hover:bg-white/[0.06] hover:text-white",
};

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#63e9dc] disabled:pointer-events-none disabled:opacity-50";

export function buttonClassName(variant: ButtonVariant = "primary", className = "") {
  return `${base} ${styles[variant]} ${className}`.trim();
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  children: ReactNode;
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return <button className={buttonClassName(variant, className)} {...props} />;
}

export function ButtonLink({
  href,
  variant = "primary",
  className = "",
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={buttonClassName(variant, className)}>
      {children}
    </Link>
  );
}
