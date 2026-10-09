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

/**
 * The single rule for who may stream an episode's audio. The audio route applies it
 * server-side for every request; hiding a player in the UI is never relied on.
 */
export function decideAudioAccess(
  episode: Pick<Episode, "is_published" | "published_at" | "is_premium" | "audio_storage_path"> | null,
  viewer: Viewer,
  premiumEnabled: boolean,
  now = Date.now(),
): AudioDecision {
  if (!episode) return { allowed: false, status: 404, reason: "Episode not found" };
  if (!viewer.isAdmin && !isLive(episode, now)) return { allowed: false, status: 404, reason: "Episode not found" };
  if (!episode.audio_storage_path) return { allowed: false, status: 404, reason: "Audio file is unavailable" };
  if (viewer.isAdmin || !episode.is_premium) return { allowed: true };
  if (!premiumEnabled) {
    return { allowed: false, status: 403, reason: "Premium audio: contact the astrologer for the full package" };
  }
  if (!viewer.hasPremiumAccess) {
    return { allowed: false, status: 403, reason: "This premium audio requires a purchase or subscription" };
  }
  return { allowed: true };
}
