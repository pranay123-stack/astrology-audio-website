import Link from "next/link";
import { BookOpen } from "lucide-react";
import { PlayButton } from "@/components/audio/PlayButton";
import { episodeHref, hasAudio, isLockedForVisitors, toTrack } from "@/lib/episodes";
import type { EpisodeListing } from "@/lib/types";

/** The play button for posts with audio, or a "Read" button for article-only posts. */
export function MediaAction({ episode, size = "md", label }: { episode: EpisodeListing; size?: "md" | "lg"; label?: string }) {
  if (hasAudio(episode)) {
    return <PlayButton track={toTrack(episode)} locked={isLockedForVisitors(episode)} size={size} label={label} />;
  }
  const dims = size === "lg" ? "h-14 w-14" : "h-11 w-11";
  return (
    <Link
      href={episodeHref(episode)}
      className={`${dims} flex shrink-0 items-center justify-center rounded-full border border-gold/60 bg-night/70 text-gold-soft transition hover:scale-105 hover:bg-night`}
      aria-label={`Read ${episode.title}`}
      data-testid="read-button"
    >
      <BookOpen className={size === "lg" ? "h-6 w-6" : "h-5 w-5"} aria-hidden />
    </Link>
  );
}
