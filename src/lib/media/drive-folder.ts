import type { AudioChapter } from "../types";

/**
 * Shared Google Drive folders ("Anyone with the link") holding an audiobook, one file per chapter.
 * Admin pastes the folder link; the server reads Drive's public folder page and turns its audio
 * files into the post's chapter list.
 */

const FOLDER_ID = /^[A-Za-z0-9_-]{20,100}$/;

/** The folder id from drive.google.com/drive/folders/<id> (also /drive/u/0/folders/<id>), else null. */
export function parseDriveFolderLink(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (url.hostname.toLowerCase() !== "drive.google.com") return null;
  const parts = url.pathname.split("/").filter(Boolean);
  const at = parts.indexOf("folders");
  const id = parts[0] === "drive" && at > 0 ? parts[at + 1] : null;
  return id && FOLDER_ID.test(id) ? id : null;
}

/** Drive's embeddable folder page: plain HTML listing every file, readable without signing in. */
export function driveFolderPageUrl(folderId: string): string {
  return `https://drive.google.com/embeddedfolderview?id=${encodeURIComponent(folderId)}`;
}

export interface DriveFolderEntry {
  fileId: string;
  name: string;
  /** e.g. "audio/mpeg"; "" when the page doesn't say. */
  mimeType: string;
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", "#x27": "'" };
const decode = (s: string) => s.replace(/&(amp|lt|gt|quot|#39|#x27);/g, (_, e: string) => ENTITIES[e]);

/** The files on a folder page (see driveFolderPageUrl), in page order. */
export function parseDriveFolderPage(html: string): DriveFolderEntry[] {
  const entries: DriveFolderEntry[] = [];
  for (const block of html.split('<div class="flip-entry"').slice(1)) {
    const id = /^\s+id="entry-([A-Za-z0-9_-]{20,100})"/.exec(block)?.[1];
    const name = /<div class="flip-entry-title">([^<]*)<\/div>/.exec(block)?.[1];
    // Sub-folders link to /drive/folders/…, files to /file/d/<id>/….
    if (!id || name === undefined || !block.includes(`/file/d/${id}/`)) continue;
    const mimeType = /googleusercontent\.com\/\d+\/type\/([a-z]+\/[A-Za-z0-9.+-]+)/.exec(block)?.[1] ?? "";
    entries.push({ fileId: id, name: decode(name).trim(), mimeType });
  }
  return entries;
}

const AUDIO_EXT = /\.(mp3|m4a|m4b|aac|ogg|oga|opus|wav|flac)$/i;
const OPENING = /\b(open|opening|opning|intro|introduction|prologue|preface)\b/i;
const CLOSING = /\b(end|ending|outro|epilogue|closing)\b/i;
/** Store samples and trailers aren't part of the book; they go last, for Admin to remove. */
const EXTRA = /\b(sample|preview|trailer|promo)\b/i;

/** "chapter-06 .mp3" → "Chapter 06". */
export function chapterTitle(fileName: string): string {
  const t = fileName.replace(AUDIO_EXT, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  return (t.charAt(0).toUpperCase() + t.slice(1)).slice(0, 120);
}

/**
 * The folder's audio files as chapters: openings/intros first, then by name with numbers in
 * number order (Chapter 2 before Chapter 10), then endings, then samples. Admin can reorder or remove them.
 */
export function chaptersFromFolder(entries: DriveFolderEntry[]): AudioChapter[] {
  const rank = (name: string) => (EXTRA.test(name) ? 3 : OPENING.test(name) ? 0 : CLOSING.test(name) ? 2 : 1);
  const byName = new Intl.Collator("en", { numeric: true, sensitivity: "base" });
  return entries
    .filter((e) => e.mimeType.startsWith("audio/") || AUDIO_EXT.test(e.name))
    .map((e) => ({ ...e, title: chapterTitle(e.name) }))
    .sort((a, b) => rank(a.title) - rank(b.title) || byName.compare(a.title, b.title))
    .map((e) => ({ title: e.title, link: `https://drive.google.com/file/d/${e.fileId}/view` }));
}
