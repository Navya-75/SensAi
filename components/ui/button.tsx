import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

type ButtonVariant = "primary" | "secondary" | "quiet";

const styles: Record<ButtonVariant, string> = {
  primary:
    "linkedin-primary border border-[#0a66c2] bg-[#0a66c2] text-white shadow-sm hover:bg-[#004182]",
  secondary:
    "linkedin-secondary border border-[#bfc5ca] bg-white text-[#0a66c2] hover:border-[#0a66c2] hover:bg-[#f7fbff]",
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
