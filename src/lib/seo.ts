import type { Metadata } from "next";
import { localePath } from "./i18n";
import type { Locale } from "./types";

/** Canonical URL for this language plus hreflang links to both language versions of `path`. */
export function alternatesFor(lang: Locale, path: string): NonNullable<Metadata["alternates"]> {
  return {
    canonical: localePath(lang, path),
    languages: { en: localePath("en", path), hi: localePath("hi", path), "x-default": localePath("en", path) },
  };
}
