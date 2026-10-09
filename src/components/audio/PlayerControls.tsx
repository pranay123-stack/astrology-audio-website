"use client";

import { Loader2, Pause, Play, RotateCcw, RotateCw, Volume1, Volume2, VolumeX } from "lucide-react";
import { formatDuration } from "@/lib/dates";
import { PLAYBACK_RATES, useAudioPlayer } from "./AudioPlayerProvider";

export function PlayPauseIcon({ status, className = "h-5 w-5" }: { status: string; className?: string }) {
  if (status === "loading") return <Loader2 className={`${className} animate-spin`} aria-hidden />;
  if (status === "playing") return <Pause className={className} aria-hidden fill="currentColor" />;
  return <Play className={`${className} translate-x-[1px]`} aria-hidden fill="currentColor" />;
}

export function SeekBar({ compact = false }: { compact?: boolean }) {
  const { currentTime, duration, seek, track } = useAudioPlayer();
  const max = duration > 0 ? duration : track?.durationHint || 0;
  const pct = max > 0 ? Math.min(100, (currentTime / max) * 100) : 0;
  return (
    <div className="flex w-full items-center gap-3">
      <span className="w-12 shrink-0 text-right text-xs tabular-nums text-muted" aria-hidden>
        {formatDuration(currentTime)}
      </span>
      <input
        type="range"
        className="range w-full"
        min={0}
        max={max || 1}
        step={0.1}
        value={Math.min(currentTime, max || 1)}
        onChange={(e) => seek(Number(e.target.value))}
        style={{ ["--pct" as string]: `${pct}%` }}
        aria-label="Seek"
        aria-valuetext={`${formatDuration(currentTime)} of ${formatDuration(max)}`}
        disabled={!track}
      />
      <span className={`w-12 shrink-0 text-xs tabular-nums text-muted ${compact ? "" : ""}`} aria-hidden>
        {formatDuration(max)}
      </span>
    </div>
  );
}

export function VolumeControl() {
  const { volume, muted, setVolume, toggleMute } = useAudioPlayer();
  const effective = muted ? 0 : volume;
  const Icon = effective === 0 ? VolumeX : effective < 0.5 ? Volume1 : Volume2;
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={toggleMute} className="rounded-full p-1.5 text-muted hover:text-ink" aria-label={muted ? "Unmute" : "Mute"}>
        <Icon className="h-5 w-5" aria-hidden />
      </button>
      <input
        type="range"
        className="range w-20"
        min={0}
        max={1}
        step={0.05}
        value={effective}
        onChange={(e) => setVolume(Number(e.target.value))}
        style={{ ["--pct" as string]: `${effective * 100}%` }}
        aria-label="Volume"
        aria-valuetext={`${Math.round(effective * 100)}%`}
      />
    </div>
  );
}

export function SpeedControl() {
  const { rate, setRate } = useAudioPlayer();
  return (
    <label className="flex items-center gap-1 text-xs text-muted">
      <span className="sr-only">Playback speed</span>
      <select
        value={rate}
        onChange={(e) => setRate(Number(e.target.value))}
        className="rounded-lg border border-line bg-night/70 px-2 py-1 text-xs font-semibold text-ink focus:border-gold/60 focus:outline-none"
        aria-label="Playback speed"
      >
        {PLAYBACK_RATES.map((r) => (
          <option key={r} value={r}>
            {r}x
          </option>
        ))}
      </select>
    </label>
  );
}

export function SkipButton({ delta }: { delta: number }) {
  const { skip, track } = useAudioPlayer();
  const Icon = delta < 0 ? RotateCcw : RotateCw;
  return (
    <button
      type="button"
      onClick={() => skip(delta)}
      disabled={!track}
      className="relative rounded-full p-2 text-muted transition hover:text-ink disabled:opacity-40"
      aria-label={delta < 0 ? `Back ${-delta} seconds` : `Forward ${delta} seconds`}
    >
      <Icon className="h-5 w-5" aria-hidden />
      <span className="absolute inset-0 flex items-center justify-center pt-0.5 text-[8px] font-bold">{Math.abs(delta)}</span>
    </button>
  );
}
