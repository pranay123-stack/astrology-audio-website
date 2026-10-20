import type { Metadata, Viewport } from "next";
import { siteConfig } from "@/lib/config";

/** Metadata shared by both root layouts (public site and admin). */
export const baseMetadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  // Test deployments are hidden from search engines; pages without their own robots setting inherit this.
  ...(siteConfig.noIndex ? { robots: { index: false, follow: false } } : {}),
  applicationName: siteConfig.name,
  openGraph: { type: "website", siteName: siteConfig.name },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#3d0606",
  colorScheme: "dark",
};
