"use client";

import { ArrowLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

export function WorkspaceBackBar() {
  const pathname = usePathname();
  const router = useRouter();

  if (
    !pathname ||
    pathname === "/" ||
    pathname === "/dashboard" ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up")
  ) {
    return null;
  }

  function goBack() {
    try {
      const referrer = document.referrer;
      if (referrer && new URL(referrer).origin === window.location.origin) {
        router.back();
        return;
      }
    } catch {
      // Fall through to the dashboard when the previous page is unavailable.
    }
    router.push("/dashboard");
  }

  return (
    <div className="border-b border-[#d8c9b6] bg-[#e8ddcc]">
      <div className="mx-auto flex h-10 w-[min(100%-40px,1120px)] items-center">
        <button
          type="button"
          onClick={goBack}
          aria-label="Go back to the previous page"
          className="inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-semibold text-[#694e38] transition-colors hover:bg-[#d8c9b6]"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Back
        </button>
      </div>
    </div>
  );
}
