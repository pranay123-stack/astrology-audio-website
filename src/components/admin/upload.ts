"use client";

export type UploadKind = "audio" | "cover" | "team" | "profile";

interface UploadTarget {
  path: string;
  method: "PUT";
  url: string;
  headers: Record<string, string>;
}

/**
 * Uploads a file in two steps: ask the server for a one-time target (it validates
 * type and size and checks the admin session), then PUT the bytes directly to it
 * with progress reporting. Returns the storage path to save with the record.
 */
export async function uploadFile(kind: UploadKind, file: File, onProgress: (pct: number) => void): Promise<string> {
  const res = await fetch("/api/admin/uploads", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ kind, filename: file.name, contentType: file.type || guessType(file.name), size: file.size }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? "Could not start the upload");
  const target = body as UploadTarget;

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(target.method, target.url);
    for (const [k, v] of Object.entries(target.headers)) xhr.setRequestHeader(k, v);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      let message = `Upload failed (HTTP ${xhr.status})`;
      try {
        const parsed = JSON.parse(xhr.responseText);
        message = parsed.error ?? parsed.message ?? message;
      } catch {
        /* keep default */
      }
      reject(new Error(message));
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(file);
  });
  onProgress(100);
  return target.path;
}

const EXT_TYPES: Record<string, string> = {
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  aac: "audio/aac",
  ogg: "audio/ogg",
  wav: "audio/wav",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
};

/** Some browsers report an empty type for .m4a/.aac files. */
export function guessType(name: string): string {
  return EXT_TYPES[name.split(".").pop()?.toLowerCase() ?? ""] ?? "application/octet-stream";
}

/** Reads an audio file's duration in the browser (seconds, rounded), or null if it cannot be decoded. */
export function readAudioDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    audio.preload = "metadata";
    const done = (v: number | null) => {
      URL.revokeObjectURL(url);
      resolve(v);
    };
    audio.onloadedmetadata = () => done(Number.isFinite(audio.duration) ? Math.round(audio.duration) : null);
    audio.onerror = () => done(null);
    audio.src = url;
  });
}
