import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  // Test deployments: ask every crawler to stay away and do not advertise the sitemap.
  if (siteConfig.noIndex) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] }],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
