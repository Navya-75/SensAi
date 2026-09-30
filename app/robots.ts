import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard", "/onboarding", "/profile", "/settings", "/resume", "/resume-builder", "/career", "/jobs", "/interview", "/cover-letters", "/practice", "/industry-insights"],
    }],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
