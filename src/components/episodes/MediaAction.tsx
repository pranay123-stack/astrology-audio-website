import Link from "next/link";
import { BookOpen, Images, Play } from "lucide-react";
import { PlayButton } from "@/components/audio/PlayButton";
import { getDict } from "@/lib/i18n";
import { episodeHref, hasArticle, hasAudio, hasVideo, isLockedForVisitors, toTrack } from "@/lib/episodes";
import type { EpisodeListing, Locale } from "@/lib/types";

/** The play button for posts with audio; otherwise a link to watch, read or view the post. Expects a localized episode. */
export function MediaAction({
  episode,
  lang,
  size = "md",
  label,
}: {
  episode: EpisodeListing;
  lang: Locale;
  size?: "md" | "lg";
  label?: string;
}) {
  if (hasAudio(episode)) {
    return <PlayButton track={toTrack(episode, lang)} locked={isLockedForVisitors(episode)} size={size} label={label} />;
  }
  const dims = size === "lg" ? "h-14 w-14" : "h-11 w-11";
  const t = getDict(lang).episode;
  const icon = size === "lg" ? "h-6 w-6" : "h-5 w-5";
  // Video wins over article and photos: it is what a visitor most likely came for.
  const [Icon, aria, testId] = hasVideo(episode)
    ? [Play, t.watchAria(episode.title), "watch-button"]
    : hasArticle(episode) || episode.gallery_paths.length === 0
      ? [BookOpen, t.readAria(episode.title), "read-button"]
      : [Images, t.viewAria(episode.title), "view-button"];
  return (
    <Link
      href={episodeHref(episode, lang)}
      className={`${dims} flex shrink-0 items-center justify-center rounded-full border border-gold/60 bg-night/70 text-gold-soft transition hover:scale-105 hover:bg-night`}
      aria-label={aria}
      data-testid={testId}
    >
      <Icon className={icon} aria-hidden />
    </Link>
  );
}
