"use client";

import { createContext, useContext } from "react";
import type { Locale } from "../types";
import { en, type Dict } from "./en";
import { hi } from "./hi";
import { localePath } from "./locales";

const LocaleContext = createContext<Locale>("en");

/** Provides the page language to client components (set once in the [lang] layout). */
export function I18nProvider({ lang, children }: { lang: Locale; children: React.ReactNode }) {
  return <LocaleContext.Provider value={lang}>{children}</LocaleContext.Provider>;
}

/** The current language, its dictionary, and a helper that prefixes paths for that language. */
export function useI18n(): { lang: Locale; t: Dict; href: (path: string) => string } {
  const lang = useContext(LocaleContext);
  return { lang, t: lang === "hi" ? hi : en, href: (path: string) => localePath(lang, path) };
}
