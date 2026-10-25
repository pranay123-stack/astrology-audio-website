/**
 * Allowed upload types. The browser-declared MIME type is checked when an upload
 * is requested, and the file's leading bytes are checked again after upload, so a
 * renamed executable cannot be published as audio or video.
 */

export const AUDIO_TYPES: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/aac": "aac",
  "audio/ogg": "ogg",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/wave": "wav",
};

export const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export const VIDEO_TYPES: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

export const EXT_TO_MIME: Record<string, string> = {
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  aac: "audio/aac",
  ogg: "audio/ogg",
  wav: "audio/wav",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
};

export const AUDIO_ACCEPT = ".mp3,.m4a,.aac,.ogg,.wav,audio/mpeg,audio/mp4,audio/aac,audio/ogg,audio/wav";
export const IMAGE_ACCEPT = ".jpg,.jpeg,.png,.webp,.avif,image/jpeg,image/png,image/webp,image/avif";
export const VIDEO_ACCEPT = ".mp4,.webm,.mov,video/mp4,video/webm,video/quicktime";

function startsWith(bytes: Uint8Array, sig: number[], offset = 0): boolean {
  if (bytes.length < offset + sig.length) return false;
  return sig.every((b, i) => bytes[offset + i] === b);
}

function ascii(bytes: Uint8Array, start: number, end: number): string {
  return String.fromCharCode(...bytes.slice(start, end));
}

/** Identifies a file from its first 16+ bytes. Returns the canonical extension or null. */
export function sniffFileType(bytes: Uint8Array): string | null {
  if (startsWith(bytes, [0x49, 0x44, 0x33])) return "mp3"; // ID3 tag
  if (bytes.length >= 2 && bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) {
    // MPEG audio frame sync; ADTS AAC shares the sync word but has layer bits 00.
    return (bytes[1] & 0x06) === 0 ? "aac" : "mp3";
  }
  if (ascii(bytes, 4, 8) === "ftyp") return /avi[fs]/.test(ascii(bytes, 8, 12)) ? "avif" : "m4a";
  if (ascii(bytes, 0, 4) === "OggS") return "ogg";
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WAVE") return "wav";
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "jpg";
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP") return "webp";
  if (startsWith(bytes, [0x1a, 0x45, 0xdf, 0xa3])) return "webm"; // EBML header (WebM / Matroska)
  return null;
}

const AUDIO_FAMILY = new Set(["mp3", "m4a", "aac", "ogg", "wav"]);
const IMAGE_FAMILY = new Set(["jpg", "png", "webp", "avif"]);
// MP4 and MOV share M4A's ISO base media container ("ftyp" box), which the sniffer reports as m4a.
const ISO_VIDEO = new Set(["mp4", "mov"]);

/** True when the sniffed bytes are consistent with the extension the path was created with. */
export function contentMatchesExtension(bytes: Uint8Array, ext: string): boolean {
  const sniffed = sniffFileType(bytes);
  if (!sniffed) return false;
  if (ext === "m4a") return sniffed === "m4a";
  if (AUDIO_FAMILY.has(ext)) return sniffed === ext || (ext === "mp3" && sniffed === "aac") || (ext === "aac" && sniffed === "mp3");
  if (IMAGE_FAMILY.has(ext)) return sniffed === ext;
  if (ISO_VIDEO.has(ext)) return sniffed === "m4a";
  if (ext === "webm") return sniffed === "webm";
  return false;
}
