/**
 * YouTube and Instagram links that can be embedded on a post. Anything else is rejected,
 * so the page only ever frames these two players.
 */
export interface VideoEmbed {
  provider: "youtube" | "instagram";
  /** iframe src */
  embedUrl: string;
  /** Link that opens the video on its own site. */
  watchUrl: string;
  /** YouTube Shorts and Instagram reels are vertical clips. */
  vertical: boolean;
  /** Public still image of the video (YouTube only; Instagram offers none without an API key). */
  thumbnailUrl: string | null;
}

const YT_ID = /^[A-Za-z0-9_-]{11}$/;
const IG_CODE = /^[A-Za-z0-9_-]{5,40}$/;

export function parseVideoLink(raw: string): VideoEmbed | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.toLowerCase().replace(/^(www\.|m\.)/, "");
  const parts = url.pathname.split("/").filter(Boolean);

  if (host === "youtu.be" || host === "youtube.com" || host === "music.youtube.com") {
    let id: string | null = null;
    let vertical = false;
    if (host === "youtu.be") id = parts[0] ?? null;
    else if (parts[0] === "watch") id = url.searchParams.get("v");
    else if (["shorts", "embed", "live", "v"].includes(parts[0] ?? "")) {
      id = parts[1] ?? null;
      vertical = parts[0] === "shorts";
    }
    if (!id || !YT_ID.test(id)) return null;
    return {
      provider: "youtube",
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}?rel=0`,
      watchUrl: vertical ? `https://www.youtube.com/shorts/${id}` : `https://www.youtube.com/watch?v=${id}`,
      vertical,
      thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    };
  }

  if (host === "instagram.com") {
    // instagram.com/reel/CODE, /reels/CODE, /p/CODE, /tv/CODE (optionally after a username).
    const at = parts.findIndex((p) => ["reel", "reels", "p", "tv"].includes(p));
    const kind = at >= 0 ? parts[at] : null;
    const code = at >= 0 ? parts[at + 1] : null;
    if (!kind || !code || !IG_CODE.test(code)) return null;
    const type = kind === "p" ? "p" : kind === "tv" ? "tv" : "reel";
    return {
      provider: "instagram",
      embedUrl: `https://www.instagram.com/${type}/${code}/embed`,
      watchUrl: `https://www.instagram.com/${type}/${code}/`,
      vertical: type === "reel",
      thumbnailUrl: null,
    };
  }
  return null;
}
