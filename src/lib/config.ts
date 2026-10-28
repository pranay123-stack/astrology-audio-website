/**
 * Central, typed access to environment configuration.
 *
 * Only values prefixed with NEXT_PUBLIC_ are safe to read in client components.
 * Everything else here is read on the server.
 */

export type DataBackend = "local" | "supabase";

function bool(value: string | undefined, fallback = false): boolean {
  if (value === undefined || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

function int(value: string | undefined, fallback: number): number {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || "Astro Cricket",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3460").replace(/\/$/, ""),
  /** IANA timezone used to display match start times and publication dates. */
  timeZone: process.env.NEXT_PUBLIC_SITE_TIMEZONE || "Asia/Kolkata",
  locale: process.env.NEXT_PUBLIC_SITE_LOCALE || "en-IN",
  /**
   * Hide the whole site from search engines (robots.txt, meta tag and X-Robots-Tag header).
   * Use on test deployments such as a temporary *.vercel.app address; leave unset at launch.
   */
  noIndex: process.env.NEXT_PUBLIC_NOINDEX === "true",
  /**
   * Public source code. The site is AGPL-3.0 licensed (the KP chart uses the AGPL Swiss
   * Ephemeris), so every page links to its source.
   */
  sourceUrl: process.env.NEXT_PUBLIC_SOURCE_URL || "https://github.com/pranay123-stack/astrology-audio-website",
};

/**
 * Supabase is used when both the URL and the publishable (anon) key are present.
 * Otherwise the app runs in local mode, which stores data in a JSON file and media
 * on the local disk. Local mode is for development and demos only.
 */
export function getDataBackend(): DataBackend {
  const forced = process.env.NEXT_PUBLIC_DATA_BACKEND;
  if (forced === "local" || forced === "supabase") return forced;
  return process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? "supabase"
    : "local";
}

export const premiumConfig = {
  /**
   * Payments stay disabled until the business owner supplies pricing and payment
   * provider credentials. While disabled, premium audio is never streamed to visitors.
   */
  enabled: bool(process.env.PREMIUM_ENABLED, false),
};

export const uploadLimits = {
  audioMaxBytes: int(process.env.MAX_AUDIO_UPLOAD_MB, 200) * 1024 * 1024,
  imageMaxBytes: int(process.env.MAX_IMAGE_UPLOAD_MB, 5) * 1024 * 1024,
  // 50 MB is the Supabase Free plan's per-file cap; the video bucket enforces the same.
  videoMaxBytes: int(process.env.MAX_VIDEO_UPLOAD_MB, 50) * 1024 * 1024,
  // Same cap as video: the documents bucket's limit on the Supabase Free plan.
  pdfMaxBytes: int(process.env.MAX_PDF_UPLOAD_MB, 50) * 1024 * 1024,
};

export const localPaths = {
  dataDir: process.env.LOCAL_DATA_DIR || ".data",
};
