"use client";

import Image from "next/image";
import Link from "next/link";
import { AlertCircle, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { useAudioPlayer } from "./AudioPlayerProvider";
import { PlayPauseIcon, SeekBar, SkipButton, SpeedControl, VolumeControl } from "./PlayerControls";

/** Persistent bottom player. Rendered once in the root layout, so it stays while visitors browse. */
export function MiniPlayer() {
  const player = useAudioPlayer();
  const { t } = useI18n();
  const { track, status, error } = player;
  if (!track) return null;

  return (
    <>
      <div className="h-32 sm:h-24" aria-hidden />
      <section
        aria-label={t.player.region}
        className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-night/95 shadow-[0_-10px_40px_-10px_rgb(0_0_0/0.8)] backdrop-blur-md"
        data-testid="mini-player"
      >
        <div className="container-page flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-5">
          <div className="flex min-w-0 items-center gap-3 sm:w-72 sm:shrink-0">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-line bg-plum">
              {track.coverUrl && <Image src={track.coverUrl} alt="" fill sizes="48px" className="object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <Link href={track.href} className="block truncate text-sm font-semibold hover:text-gold-soft" data-testid="mini-player-title">
                {track.title}
              </Link>
              <p className="truncate text-xs text-muted">{track.category}</p>
            </div>
            <button
              type="button"
              onClick={player.close}
              className="rounded-full p-1.5 text-muted hover:text-ink sm:hidden"
              aria-label={t.player.close}
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-1">
            {error ? (
              <p role="alert" className="flex items-center gap-2 text-sm text-red-300" data-testid="player-error">
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden /> {t.player.errors[error]}
              </p>
            ) : (
              <SeekBar compact />
            )}
          </div>

          <div className="flex items-center justify-between gap-2 sm:justify-end">
            <div className="flex items-center gap-1">
              <SkipButton delta={-15} />
              <button
                type="button"
                onClick={() => player.toggle()}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-gold-soft to-gold text-night shadow-lg hover:brightness-110"
                aria-label={status === "playing" ? t.player.pause : status === "error" ? t.player.retry : t.player.play}
                data-testid="mini-player-toggle"
              >
                <PlayPauseIcon status={status} />
              </button>
              <SkipButton delta={15} />
            </div>
            <div className="flex items-center gap-3">
              <SpeedControl />
              <div className="hidden md:block">
                <VolumeControl />
              </div>
              <button
                type="button"
                onClick={player.close}
                className="hidden rounded-full p-1.5 text-muted hover:text-ink sm:block"
                aria-label={t.player.close}
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
