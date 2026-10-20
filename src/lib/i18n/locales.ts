import type { Locale } from "../types";

/**
 * The site speaks English and Hindi. English keeps the plain URLs (/contact), Hindi lives
 * under /hi (/hi/contact). Internally every public page sits under the [lang] segment;
 * the proxy rewrites plain URLs to /en/... so visitors never see /en.
 */
export const LOCALES = ["en", "hi"] as const satisfies readonly Locale[];
export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(v: unknown): v is Locale {
  return v === "en" || v === "hi";
}

/** BCP-47 tag for Intl formatting (dates in Hindi use Hindi month names). */
export function intlLocale(lang: Locale): string {
  return lang === "hi" ? "hi-IN" : "en-IN";
}

/** Public URL of `path` (which starts with "/") in `lang`. Query strings and hashes are kept. */
export function localePath(lang: Locale, path: string): string {
  if (lang === DEFAULT_LOCALE) return path;
  if (path === "/") return "/hi";
  if (path.startsWith("/?") || path.startsWith("/#")) return `/hi${path.slice(1)}`;
  return `/hi${path}`;
}

/** Splits a public pathname into its language and the language-free path. */
export function splitLocale(pathname: string): { lang: Locale; path: string } {
  if (pathname === "/hi") return { lang: "hi", path: "/" };
  if (pathname.startsWith("/hi/")) return { lang: "hi", path: pathname.slice(3) };
  return { lang: "en", path: pathname || "/" };
}
