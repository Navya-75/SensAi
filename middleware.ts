import { clerkMiddleware } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";

const protectedRoutePrefixes = [
  "/dashboard",
  "/onboarding",
  "/profile",
  "/settings",
  "/resume",
  "/resume-builder",
  "/career",
  "/jobs",
  "/interview",
  "/cover-letter",
  "/cover-letters",
  "/industry-insights",
  "/practice",
];

function isProtectedPath(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  return protectedRoutePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export default clerkMiddleware(async (auth, request) => {
  if (isProtectedPath(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
