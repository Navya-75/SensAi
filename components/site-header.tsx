"use client";

import { useState } from "react";
import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { BrandMark } from "@/components/ui/brand-mark";
import { ButtonLink } from "@/components/ui/button";

const links = [
  { href: "#platform", label: "Platform" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#about", label: "About" },
];

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="relative z-20 border-b border-white/[0.06] bg-[#0b0e17]/75 backdrop-blur-xl">
      <div className="page-shell flex h-[72px] items-center justify-between">
        <Link href="/" aria-label="SENSAI home" onClick={() => setIsOpen(false)}>
          <BrandMark />
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[13px] text-[#98a3b6] transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-5 md:flex">
          <SignedOut>
            <Link
              href="/sign-in"
              className="text-[13px] font-medium text-[#bac3d1] transition-colors hover:text-white"
            >
              Sign in
            </Link>
            <ButtonLink href="/sign-up" className="min-h-10 rounded-[10px] px-3.5 text-[12px]">
              Get started <ArrowUpRight size={15} aria-hidden="true" />
            </ButtonLink>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard" className="text-[13px] font-medium text-[#bac3d1] transition-colors hover:text-white">
              Dashboard
            </Link>
            <UserButton />
          </SignedIn>
        </div>

        <button
          type="button"
          className="grid size-10 place-items-center rounded-xl border border-white/10 text-[#dbe2ee] md:hidden"
          aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isOpen}
          aria-controls="mobile-navigation"
          onClick={() => setIsOpen((open) => !open)}
        >
          {isOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {isOpen && (
        <nav
          id="mobile-navigation"
          aria-label="Mobile navigation"
          className="absolute inset-x-0 top-full border-b border-white/10 bg-[#0b0e17] px-5 pb-5 pt-2 shadow-2xl md:hidden"
        >
          <div className="mx-auto flex max-w-xl flex-col">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="border-b border-white/[0.06] py-3.5 text-sm text-[#b6c0d0]"
              >
                {link.label}
              </Link>
            ))}
            <div className="flex items-center gap-3 pt-4">
              <SignedOut>
                <Link href="/sign-in" onClick={() => setIsOpen(false)} className="flex-1">
                  <span className="flex min-h-11 items-center justify-center rounded-xl border border-white/10 text-sm font-semibold text-[#dce3ef]">
                    Sign in
                  </span>
                </Link>
                <ButtonLink href="/sign-up" className="flex-1">
                  Get started <ArrowUpRight size={15} aria-hidden="true" />
                </ButtonLink>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard" onClick={() => setIsOpen(false)} className="flex-1">
                  <span className="flex min-h-11 items-center justify-center rounded-xl border border-white/10 text-sm font-semibold text-[#dce3ef]">
                    Dashboard
                  </span>
                </Link>
                <UserButton />
              </SignedIn>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
