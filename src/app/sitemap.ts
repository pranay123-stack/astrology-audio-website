import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config";
import { episodeHref } from "@/lib/episodes";
import { getEpisodes } from "@/lib/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const pages = ["", "/cricket-astrology", "/astrology-audios", "/premium", "/about", "/contact", "/privacy", "/terms", "/disclaimer"];
  const { items } = await getEpisodes({ sort: "latest" });
  return [
    ...pages.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    // Sample episodes are excluded; they are placeholders, not real content.
    ...items
      .filter((e) => !e.is_demo)
      .map((e) => ({ url: `${base}${episodeHref(e)}`, lastModified: e.updated_at, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
