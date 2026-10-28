import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config";
import { episodeHref } from "@/lib/episodes";
import { localePath, LOCALES } from "@/lib/i18n";
import { getEpisodes } from "@/lib/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const pages = [
    "/",
    "/astrology",
    "/astrology/planets-bhav",
    "/astrology/kp-research",
    "/astro-cricket",
    "/astro-cricket/videos",
    "/astro-cricket/old-videos",
    "/book",
    "/horoscope-research",
    "/horoscope-research/matches",
    "/horoscope-research/players",
    "/kp-chart",
    "/cricket-astrology",
    "/astrology-audios",
    "/premium",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    "/disclaimer",
  ];
  const { items } = await getEpisodes({ sort: "latest" });
  // Every page exists in English and Hindi; each entry lists both versions as alternates.
  const languages = (path: string) => ({ en: `${base}${localePath("en", path)}`, hi: `${base}${localePath("hi", path)}` });
  const strip = (url: string) => (url === "/" ? "" : url);
  return [
    ...pages.flatMap((p) =>
      LOCALES.map((lang) => ({
        url: `${base}${strip(localePath(lang, p))}`,
        changeFrequency: "weekly" as const,
        priority: p === "/" ? 1 : 0.7,
        alternates: { languages: languages(p) },
      })),
    ),
    // Sample episodes are excluded; they are placeholders, not real content.
    ...items
      .filter((e) => !e.is_demo)
      .flatMap((e) =>
        LOCALES.map((lang) => ({
          url: `${base}${episodeHref(e, lang)}`,
          lastModified: e.updated_at,
          changeFrequency: "monthly" as const,
          priority: 0.6,
          alternates: { languages: languages(episodeHref(e)) },
        })),
      ),
  ];
}
