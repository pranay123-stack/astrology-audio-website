import type { Track } from "@/components/audio/AudioPlayerProvider";
import { readingMinutes } from "./article";
import { premiumConfig } from "./config";
import { formatDurationLabel } from "./dates";
import { getDict, localePath } from "./i18n";
import { audioUrl, imageUrl } from "./media/urls";
import { parseVideoLink } from "./media/video-link";
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

/** Audio played from Google Drive (no uploaded file). */
export function hasDriveAudio(e: Pick<EpisodeListing, "audio_storage_path" | "audio_link">): boolean {
  return !e.audio_storage_path && !!e.audio_link;
}

/** The post's picture: its cover image, else the thumbnail of its YouTube video, else null. */
export function posterUrl(e: Pick<EpisodeListing, "cover_image_path" | "video_link">): string | null {
  return imageUrl(e.cover_image_path) ?? (e.video_link ? (parseVideoLink(e.video_link)?.thumbnailUrl ?? null) : null);
}

/** An uploaded video or an embeddable link. */
export function hasVideo(e: Pick<EpisodeListing, "video_storage_path" | "video_link">): boolean {
  return !!e.video_storage_path || !!e.video_link;
}

/** "48 sec", "3 min read", "Reel", "4 photos" or a mix. Premium article text is not sent to visitors, so it shows just "Article". */
export function lengthLabel(
  e: Pick<
    EpisodeListing,
    | "audio_storage_path"
    | "audio_link"
    | "audio_chapters"
    | "article"
    | "has_article"
    | "duration_seconds"
    | "video_storage_path"
    | "video_link"
    | "video_format"
    | "gallery_paths"
    | "pdf_storage_path"
    | "pdf_link"
  >,
  lang: Locale = "en",
): string {
  const t = getDict(lang).length;
  const parts: string[] = [];
  if (hasAudio(e)) parts.push(formatDurationLabel(e.duration_seconds, lang));
  else if (e.audio_link) {
    if (e.audio_chapters.length) parts.push(getDict(lang).episode.chapters(e.audio_chapters.length));
    if (e.duration_seconds || !e.audio_chapters.length) parts.push(e.duration_seconds ? formatDurationLabel(e.duration_seconds, lang) : t.audio);
  }
  if (hasVideo(e)) parts.push(e.video_format === "reel" ? t.reel : t.video);
  if (e.has_article) parts.push(e.article ? t.read(readingMinutes(e.article)) : t.article);
  if (e.gallery_paths.length) parts.push(t.photos(e.gallery_paths.length));
  if (e.pdf_storage_path || e.pdf_link) parts.push("PDF");
  return parts.join(" · ");
}

export function toTrack(e: EpisodeListing, lang: Locale = "en"): Track {
  return {
    id: e.id,
    title: e.title,
    category: e.match ? `${e.match.competition.short_name} · ${e.category.name}` : e.category.name,
    coverUrl: posterUrl(e),
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
