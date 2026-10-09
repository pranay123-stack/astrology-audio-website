"use client";

import Link from "next/link";
import { AlertCircle, Lock, Mail } from "lucide-react";
import { premiumContactHref } from "@/lib/episodes";
import { formatDuration } from "@/lib/dates";
import { useAudioPlayer, type Track } from "./AudioPlayerProvider";
import { PlayPauseIcon, SeekBar, SkipButton, SpeedControl, VolumeControl } from "./PlayerControls";

/** Full player for an episode page; drives the same site-wide audio element as the mini-player. */
export function EpisodePlayer({ track, locked }: { track: Track; locked: boolean }) {
  const player = useAudioPlayer();
  const current = player.isCurrent(track.id);

  if (locked) {
    return (
      <div className="card flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center" data-testid="locked-player">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-gold/50 text-gold-soft">
          <Lock className="h-6 w-6" aria-hidden />
        </div>
        <div className="flex-1">
          <p className="font-semibold">Premium reading</p>
          <p className="text-sm text-muted">
            This episode is part of the astrologer&apos;s full premium package. Get in touch with the astrologer to get the full
            package and listen.
          </p>
        </div>
        <Link href={premiumContactHref(track.title)} className="btn-gold" data-testid="premium-contact">
          <Mail className="h-4 w-4" aria-hidden /> Contact for full package
        </Link>
      </div>
    );
  }

  return (
    <div className="card p-5 sm:p-6" data-testid="episode-player">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => player.toggle(track)}
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-soft to-gold text-night shadow-[0_10px_30px_-8px_rgb(212_175_55/0.8)] transition hover:scale-105"
          aria-label={current && player.status === "playing" ? "Pause episode" : "Play episode"}
          data-testid="episode-play"
        >
          <PlayPauseIcon status={current ? player.status : "idle"} className="h-7 w-7" />
        </button>
        <div className="min-w-0 flex-1">
          {current ? (
            player.error ? (
              <p role="alert" className="flex items-center gap-2 text-sm text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden /> {player.error}
              </p>
            ) : (
              <SeekBar />
            )
          ) : (
            <p className="text-sm text-muted">
              Press play to listen · {formatDuration(track.durationHint)}
              <span className="block text-xs">Playback continues in the bar below while you browse.</span>
            </p>
          )}
        </div>
      </div>
      {current && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <div className="flex items-center gap-1">
            <SkipButton delta={-15} />
            <SkipButton delta={15} />
          </div>
          <div className="flex items-center gap-4">
            <SpeedControl />
            <VolumeControl />
          </div>
        </div>
      )}
    </div>
  );
}
