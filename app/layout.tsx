import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { siteUrl } from "@/lib/site";
import { WorkspaceBackBar } from "@/components/ui/workspace-back-bar";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SENSAI — AI Career Coach",
    template: "%s | SENSAI",
  },
  description:
    "Understand your skills, build a thoughtful career plan, and prepare for your next opportunity with SENSAI.",
  applicationName: "SENSAI",
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "SENSAI — AI Career Coach",
    description:
      "Understand your skills. Build your career. Prepare for opportunities.",
    siteName: "SENSAI",
    type: "website",
    url: siteUrl,
  },
  twitter: { card: "summary_large_image", title: "SENSAI — AI Career Coach", description: "Understand your skills. Build your career. Prepare for opportunities." },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className="linkedin-theme">
        <ClerkProvider
          appearance={{
            variables: {
              colorPrimary: "#0a66c2",
              colorBackground: "#ffffff",
              colorText: "#191919",
              colorTextSecondary: "#56616b",
              colorInputBackground: "#f3f2ef",
              colorInputText: "#191919",
              borderRadius: "0.8rem",
            },
          }}
        >
          <WorkspaceBackBar />
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
