import type { Category, EpisodeListing, Locale, Profile } from "../types";
import { en, type Dict } from "./en";
import { hi } from "./hi";

export { DEFAULT_LOCALE, LOCALES, intlLocale, isLocale, localePath, splitLocale } from "./locales";
export type { Dict };

const DICTS: Record<Locale, Dict> = { en, hi };

export function getDict(lang: Locale): Dict {
  return DICTS[lang];
}

/** A post as shown in one interface language, plus which language its text is actually in. */
export type LocalizedEpisode = EpisodeListing & {
  /** Language of the title/excerpt/description being shown. */
  text_lang: Locale;
};

/**
 * Picks the version of a post that matches `lang`. Each post is written in its main language
 * (article_lang) and may carry an optional translation (*_alt). Missing pieces fall back to the
 * other language, so a Hindi-only post still appears on the English site (marked "In Hindi").
 * After this, `article`/`article_lang` describe the article to show and `article_alt` the other one.
 */
export function localizeEpisode(e: EpisodeListing, lang: Locale): LocalizedEpisode {
  const category = { ...e.category, name: lang === "hi" && e.category.name_hi ? e.category.name_hi : e.category.name };
  const other: Locale = e.article_lang === "hi" ? "en" : "hi";
  const main = { lang: e.article_lang, has: e.has_article, body: e.article };
  const alt = { lang: other, has: e.has_article_alt, body: e.article_alt };
  const [first, second] = lang === e.article_lang ? [main, alt] : [alt, main];
  const shown = first.has ? first : second;
  const hidden = shown === first ? second : first;
  const article = {
    article: shown.body,
    has_article: shown.has,
    article_lang: shown.lang,
    article_alt: hidden.body,
    has_article_alt: hidden.has,
  };

  const useAltText = lang !== e.article_lang && e.title_alt.trim() !== "";
  if (!useAltText) return { ...e, ...article, category, text_lang: e.article_lang };
  return {
    ...e,
    ...article,
    category,
    title: e.title_alt,
    excerpt: e.excerpt_alt.trim() || e.excerpt,
    description: e.description_alt.trim() || e.description,
    text_lang: lang,
  };
}

export function localizeCategory<T extends Pick<Category, "name" | "name_hi"> & Partial<Pick<Category, "description" | "description_hi">>>(
  c: T,
  lang: Locale,
): T {
  if (lang !== "hi") return c;
  return {
    ...c,
    name: c.name_hi || c.name,
    ...(c.description !== undefined ? { description: c.description_hi || c.description } : {}),
  };
}

/** The profile in `lang`: Hindi fields override the English ones only where they are filled in. */
export function localizeProfile(p: Profile, lang: Locale): Profile {
  if (lang !== "hi" || !p.hi) return p;
  const h = p.hi;
  const pick = (v: string | undefined, fallback: string) => (v && v.trim() ? v : fallback);
  return {
    ...p,
    display_name: pick(h.display_name, p.display_name),
    tagline: pick(h.tagline, p.tagline),
    biography: pick(h.biography, p.biography),
    experience: pick(h.experience, p.experience),
    location: pick(h.location, p.location),
    consultation_info: pick(h.consultation_info, p.consultation_info),
    specializations: h.specializations && h.specializations.length > 0 ? h.specializations : p.specializations,
  };
}
