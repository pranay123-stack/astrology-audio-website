"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { premiumContactHref } from "@/lib/episodes";
import { useAudioPlayer, type Track } from "./AudioPlayerProvider";
import { PlayPauseIcon } from "./PlayerControls";

/** Play/pause button for an episode card. Locked premium episodes link to the contact page instead. */
export function PlayButton({
  track,
  locked = false,
  size = "md",
  label,
}: {
  track: Track;
  locked?: boolean;
  size?: "md" | "lg";
  label?: string;
}) {
  const player = useAudioPlayer();
  const current = player.isCurrent(track.id);
  const status = current ? player.status : "idle";
  const dims = size === "lg" ? "h-14 w-14" : "h-11 w-11";

  if (locked) {
    return (
      <Link
        href={premiumContactHref(track.title)}
        className={`${dims} flex shrink-0 items-center justify-center rounded-full border border-gold/50 bg-night/70 text-gold-soft hover:bg-night`}
        aria-label={`${track.title} is premium audio. Contact the astrologer for the full package`}
        title="Premium: contact the astrologer for the full package"
      >
        <Lock className="h-5 w-5" aria-hidden />
      </Link>
    );
  }

  const verb = status === "playing" ? "Pause" : "Play";
  return (
    <button
      type="button"
      onClick={() => player.toggle(track)}
      className={`${dims} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-soft to-gold text-night shadow-[0_8px_24px_-8px_rgb(212_175_55/0.8)] transition hover:scale-105 hover:brightness-110`}
      aria-label={label ? `${verb}: ${label}` : `${verb} ${track.title}`}
      aria-pressed={status === "playing"}
      data-testid="play-button"
    >
      <PlayPauseIcon status={status} className={size === "lg" ? "h-6 w-6" : "h-5 w-5"} />
    </button>
  );
}
