"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export interface Track {
  id: string;
  title: string;
  category: string;
  coverUrl: string | null;
  href: string;
  src: string;
  /** Duration stored with the episode; replaced by the real value once metadata loads. */
  durationHint: number;
}

export type PlayerStatus = "idle" | "loading" | "playing" | "paused" | "error";
export const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 2] as const;

interface PlayerState {
  track: Track | null;
  status: PlayerStatus;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  rate: number;
  error: string | null;
}

interface PlayerApi extends PlayerState {
  play: (track?: Track) => void;
  pause: () => void;
  toggle: (track?: Track) => void;
  seek: (seconds: number) => void;
  skip: (delta: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  setRate: (r: number) => void;
  close: () => void;
  isCurrent: (id: string) => boolean;
}

const PlayerContext = createContext<PlayerApi | null>(null);

const STORAGE_KEY = "audio-player-prefs";

/** Turns an HTTP status from the audio route into a message a listener can act on. */
async function diagnose(src: string, mediaError: MediaError | null): Promise<string> {
  try {
    const res = await fetch(src, { method: "HEAD", cache: "no-store" });
    if (res.status === 403) return "This is premium audio. Contact the astrologer for the full package to listen.";
    if (res.status === 404) return "This audio file is unavailable right now. Please try again later.";
    if (res.status >= 500) return "The audio server had a problem. Please try again in a moment.";
  } catch {
    return "Could not reach the server. Check your connection and try again.";
  }
  if (mediaError?.code === MediaError.MEDIA_ERR_DECODE || mediaError?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
    return "Your browser could not play this audio format.";
  }
  if (mediaError?.code === MediaError.MEDIA_ERR_NETWORK) return "The audio stopped loading because of a network problem.";
  return "This audio could not be played.";
}

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const countedRef = useRef<Set<string>>(new Set());
  const [state, setState] = useState<PlayerState>({
    track: null,
    status: "idle",
    currentTime: 0,
    duration: 0,
    volume: 1,
    muted: false,
    rate: 1,
    error: null,
  });
  const trackRef = useRef<Track | null>(null);

  // Restore volume and speed preferences.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
      const volume = typeof saved.volume === "number" ? Math.min(1, Math.max(0, saved.volume)) : 1;
      const rate = PLAYBACK_RATES.includes(saved.rate) ? saved.rate : 1;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from localStorage
      setState((s) => ({ ...s, volume, rate }));
      if (audioRef.current) {
        audioRef.current.volume = volume;
        audioRef.current.playbackRate = rate;
      }
    } catch {
      /* storage unavailable: keep defaults */
    }
  }, []);

  const savePrefs = useCallback((volume: number, rate: number) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ volume, rate }));
    } catch {
      /* ignore */
    }
  }, []);

  // Wire media element events to state.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const update = (patch: Partial<PlayerState>) => setState((s) => ({ ...s, ...patch }));
    const onTime = () => update({ currentTime: audio.currentTime });
    const onDuration = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) update({ duration: audio.duration });
    };
    const onPlaying = () => {
      update({ status: "playing", error: null });
      const t = trackRef.current;
      if (t && !countedRef.current.has(t.id)) {
        countedRef.current.add(t.id);
        // Fire-and-forget play counter used for "Popular" listings.
        fetch(`/api/episodes/${t.id}/play`, { method: "POST", keepalive: true }).catch(() => undefined);
      }
    };
    const onPause = () => setState((s) => (s.status === "error" ? s : { ...s, status: "paused" }));
    const onWaiting = () => update({ status: "loading" });
    const onEnded = () => update({ status: "paused", currentTime: audio.duration || 0 });
    const onError = () => {
      const t = trackRef.current;
      if (!t || !audio.getAttribute("src")) return;
      const mediaError = audio.error;
      update({ status: "error", error: "Checking the audio file…" });
      diagnose(t.src, mediaError).then((message) => {
        if (trackRef.current?.id === t.id) update({ status: "error", error: message });
      });
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("durationchange", onDuration);
    audio.addEventListener("loadedmetadata", onDuration);
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("durationchange", onDuration);
      audio.removeEventListener("loadedmetadata", onDuration);
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, []);

  const startPlayback = useCallback((audio: HTMLAudioElement) => {
    audio.play().catch((err: DOMException) => {
      // NotAllowedError: autoplay blocked; AbortError: superseded by another load. The error event covers real failures.
      if (err?.name === "NotAllowedError") setState((s) => ({ ...s, status: "paused" }));
    });
  }, []);

  const play = useCallback(
    (track?: Track) => {
      const audio = audioRef.current;
      if (!audio) return;
      const current = trackRef.current;
      if (track && track.id !== current?.id) {
        trackRef.current = track;
        setState((s) => ({
          ...s,
          track,
          status: "loading",
          currentTime: 0,
          duration: track.durationHint,
          error: null,
        }));
        audio.src = track.src;
        audio.playbackRate = state.rate;
        audio.load();
        startPlayback(audio);
        return;
      }
      if (!current) return;
      if (state.status === "error") {
        // Retry: reload the source.
        setState((s) => ({ ...s, status: "loading", error: null }));
        audio.load();
      }
      startPlayback(audio);
    },
    [startPlayback, state.rate, state.status],
  );

  const pause = useCallback(() => audioRef.current?.pause(), []);

  const toggle = useCallback(
    (track?: Track) => {
      const audio = audioRef.current;
      if (!audio) return;
      const isSame = !track || track.id === trackRef.current?.id;
      if (isSame && (state.status === "playing" || state.status === "loading") && !audio.paused) audio.pause();
      else play(track);
    },
    [play, state.status],
  );

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(seconds)) return;
    const max = Number.isFinite(audio.duration) ? audio.duration : seconds;
    audio.currentTime = Math.min(Math.max(0, seconds), max);
    setState((s) => ({ ...s, currentTime: audio.currentTime }));
  }, []);

  const skip = useCallback((delta: number) => {
    const audio = audioRef.current;
    if (audio) seek(audio.currentTime + delta);
  }, [seek]);

  const setVolume = useCallback(
    (v: number) => {
      const audio = audioRef.current;
      const volume = Math.min(1, Math.max(0, v));
      if (audio) {
        audio.volume = volume;
        audio.muted = volume === 0;
      }
      setState((s) => ({ ...s, volume, muted: volume === 0 }));
      savePrefs(volume, state.rate);
    },
    [savePrefs, state.rate],
  );

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    if (!audio.muted && audio.volume === 0) audio.volume = 0.5;
    setState((s) => ({ ...s, muted: audio.muted, volume: audio.volume }));
  }, []);

  const setRate = useCallback(
    (r: number) => {
      const audio = audioRef.current;
      if (audio) audio.playbackRate = r;
      setState((s) => ({ ...s, rate: r }));
      savePrefs(state.volume, r);
    },
    [savePrefs, state.volume],
  );

  const close = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    trackRef.current = null;
    setState((s) => ({ ...s, track: null, status: "idle", currentTime: 0, duration: 0, error: null }));
  }, []);

  // Lock-screen / hardware media keys.
  useEffect(() => {
    if (!("mediaSession" in navigator) || !state.track) return;
    const t = state.track;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: t.title,
      artist: t.category,
      artwork: t.coverUrl ? [{ src: new URL(t.coverUrl, location.href).href, sizes: "600x600" }] : [],
    });
    navigator.mediaSession.setActionHandler("play", () => play());
    navigator.mediaSession.setActionHandler("pause", () => pause());
    navigator.mediaSession.setActionHandler("seekbackward", () => skip(-15));
    navigator.mediaSession.setActionHandler("seekforward", () => skip(15));
  }, [state.track, play, pause, skip]);

  const api = useMemo<PlayerApi>(
    () => ({
      ...state,
      play,
      pause,
      toggle,
      seek,
      skip,
      setVolume,
      toggleMute,
      setRate,
      close,
      isCurrent: (id: string) => state.track?.id === id,
    }),
    [state, play, pause, toggle, seek, skip, setVolume, toggleMute, setRate, close],
  );

  return (
    <PlayerContext value={api}>
      {children}
      {/* The single audio element for the whole site; it lives in the root layout so playback survives navigation. */}
      <audio ref={audioRef} preload="metadata" className="hidden" data-testid="site-audio" />
    </PlayerContext>
  );
}

export function useAudioPlayer(): PlayerApi {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("useAudioPlayer must be used inside AudioPlayerProvider");
  return ctx;
}
