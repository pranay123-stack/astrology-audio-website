import type { Track } from "@/components/audio/AudioPlayerProvider";
import { readingMinutes } from "./article";
import { premiumConfig } from "./config";
import { formatDurationLabel } from "./dates";
import { audioUrl, imageUrl } from "./media/urls";
import type { EpisodeListing } from "./types";

export function episodeHref(e: Pick<EpisodeListing, "slug" | "category">): string {
  return e.category.section === "cricket" ? `/cricket-astrology/${e.slug}` : `/astrology-audios/${e.slug}`;
}

export function hasAudio(e: Pick<EpisodeListing, "audio_storage_path">): boolean {
  return !!e.audio_storage_path;
}

export function hasArticle(e: Pick<EpisodeListing, "has_article">): boolean {
  return e.has_article;
}

/** "48 sec", "3 min read", or both. Premium article text is not sent to visitors, so it shows just "Article". */
export function lengthLabel(e: Pick<EpisodeListing, "audio_storage_path" | "article" | "has_article" | "duration_seconds">): string {
  const parts: string[] = [];
  if (hasAudio(e)) parts.push(formatDurationLabel(e.duration_seconds));
  if (e.has_article) parts.push(e.article ? `${readingMinutes(e.article)} min read` : "Article");
  return parts.join(" · ");
}

export function toTrack(e: EpisodeListing): Track {
  return {
    id: e.id,
    title: e.title,
    category: e.match ? `${e.match.competition.short_name} · ${e.category.name}` : e.category.name,
    coverUrl: imageUrl(e.cover_image_path),
    href: episodeHref(e),
    src: audioUrl(e.id),
    durationHint: e.duration_seconds,
  };
}

/** Contact page link for asking about the full premium package, with the subject pre-filled. */
export function premiumContactHref(title?: string): string {
  const subject = title ? `Premium package: ${title}` : "Premium package";
  return `/contact?subject=${encodeURIComponent(subject.slice(0, 160))}`;
}

/** Whether visitors see this episode as locked. The audio route enforces the same rule server-side. */
export function isLockedForVisitors(e: Pick<EpisodeListing, "is_premium">): boolean {
  return e.is_premium && !premiumConfig.enabled;
}
