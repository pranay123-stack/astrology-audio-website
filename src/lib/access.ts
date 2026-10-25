import type { Episode } from "./types";
import { isLive } from "./data/repository";

export interface Viewer {
  isAdmin: boolean;
  /** True only when the premium module is enabled and the viewer holds a paid entitlement. */
  hasPremiumAccess: boolean;
}

export type AudioDecision =
  | { allowed: true }
  | { allowed: false; status: 401 | 403 | 404; reason: string };

type MediaEpisode = Pick<Episode, "is_published" | "published_at" | "is_premium" | "audio_storage_path" | "video_storage_path">;

/**
 * The single rule for who may stream an episode's audio or uploaded video. The media
 * routes apply it server-side for every request; hiding a player in the UI is never relied on.
 */
export function decideMediaAccess(
  episode: Partial<MediaEpisode> & Pick<Episode, "is_published" | "published_at" | "is_premium"> | null,
  kind: "audio" | "video",
  viewer: Viewer,
  premiumEnabled: boolean,
  now = Date.now(),
): AudioDecision {
  const noun = kind === "audio" ? "Audio" : "Video";
  if (!episode) return { allowed: false, status: 404, reason: "Episode not found" };
  if (!viewer.isAdmin && !isLive(episode, now)) return { allowed: false, status: 404, reason: "Episode not found" };
  if (!(kind === "audio" ? episode.audio_storage_path : episode.video_storage_path)) {
    return { allowed: false, status: 404, reason: `${noun} file is unavailable` };
  }
  if (viewer.isAdmin || !episode.is_premium) return { allowed: true };
  if (!premiumEnabled) {
    return { allowed: false, status: 403, reason: `Premium ${noun.toLowerCase()}: contact the astrologer for the full package` };
  }
  if (!viewer.hasPremiumAccess) {
    return { allowed: false, status: 403, reason: `This premium ${noun.toLowerCase()} requires a purchase or subscription` };
  }
  return { allowed: true };
}

/** Audio access; see decideMediaAccess. */
export function decideAudioAccess(
  episode: Pick<Episode, "is_published" | "published_at" | "is_premium" | "audio_storage_path"> | null,
  viewer: Viewer,
  premiumEnabled: boolean,
  now = Date.now(),
): AudioDecision {
  return decideMediaAccess(episode, "audio", viewer, premiumEnabled, now);
}
