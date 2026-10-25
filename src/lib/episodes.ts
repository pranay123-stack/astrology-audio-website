import type { Track } from "@/components/audio/AudioPlayerProvider";
import { readingMinutes } from "./article";
import { premiumConfig } from "./config";
import { formatDurationLabel } from "./dates";
import { getDict, localePath } from "./i18n";
import { audioUrl, imageUrl } from "./media/urls";
import type { EpisodeListing, Locale } from "./types";

export function episodeHref(e: Pick<EpisodeListing, "slug" | "category">, lang: Locale = "en"): string {
  return localePath(lang, e.category.section === "cricket" ? `/cricket-astrology/${e.slug}` : `/astrology-audios/${e.slug}`);
}

export function hasAudio(e: Pick<EpisodeListing, "audio_storage_path">): boolean {
  return !!e.audio_storage_path;
}

export function hasArticle(e: Pick<EpisodeListing, "has_article">): boolean {
  return e.has_article;
}

/** An uploaded video or an embeddable link. */
export function hasVideo(e: Pick<EpisodeListing, "video_storage_path" | "video_link">): boolean {
  return !!e.video_storage_path || !!e.video_link;
}

/** "48 sec", "3 min read", "Reel", "4 photos" or a mix. Premium article text is not sent to visitors, so it shows just "Article". */
export function lengthLabel(
  e: Pick<
    EpisodeListing,
    "audio_storage_path" | "article" | "has_article" | "duration_seconds" | "video_storage_path" | "video_link" | "video_format" | "gallery_paths"
  >,
  lang: Locale = "en",
): string {
  const t = getDict(lang).length;
  const parts: string[] = [];
  if (hasAudio(e)) parts.push(formatDurationLabel(e.duration_seconds, lang));
  if (hasVideo(e)) parts.push(e.video_format === "reel" ? t.reel : t.video);
  if (e.has_article) parts.push(e.article ? t.read(readingMinutes(e.article)) : t.article);
  if (e.gallery_paths.length) parts.push(t.photos(e.gallery_paths.length));
  return parts.join(" · ");
}

export function toTrack(e: EpisodeListing, lang: Locale = "en"): Track {
  return {
    id: e.id,
    title: e.title,
    category: e.match ? `${e.match.competition.short_name} · ${e.category.name}` : e.category.name,
    coverUrl: imageUrl(e.cover_image_path),
    href: episodeHref(e, lang),
    src: audioUrl(e.id),
    durationHint: e.duration_seconds,
  };
}

/** Contact page link for asking about the full premium package, with the subject pre-filled. */
export function premiumContactHref(title?: string, lang: Locale = "en"): string {
  const subject = getDict(lang).premium.subject(title);
  return localePath(lang, `/contact?subject=${encodeURIComponent(subject.slice(0, 160))}`);
}

/** Whether visitors see this episode as locked. The audio route enforces the same rule server-side. */
export function isLockedForVisitors(e: Pick<EpisodeListing, "is_premium">): boolean {
  return e.is_premium && !premiumConfig.enabled;
}
