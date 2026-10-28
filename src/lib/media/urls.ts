import { getDataBackend } from "../config";

/** Public URL of an image in storage. Safe to call from client and server code. */
export function imageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (getDataBackend() === "supabase" && supabaseUrl) {
    return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/images/${path}`;
  }
  return `/api/media/image/${path}`;
}

/** Public URL of a PDF (free to read and download). */
export function documentUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (getDataBackend() === "supabase" && supabaseUrl) {
    return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/documents/${path}`;
  }
  return `/api/media/document/${path}`;
}

/** Audio is never addressed by its storage path; this route checks access first. */
export function audioUrl(episodeId: string): string {
  return `/api/media/audio/${episodeId}`;
}

/** Uploaded video, like audio, goes through an access-checked route. */
export function videoUrl(episodeId: string): string {
  return `/api/media/video/${episodeId}`;
}
