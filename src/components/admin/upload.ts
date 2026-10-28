"use client";

export type UploadKind = "audio" | "video" | "cover" | "gallery" | "team" | "profile" | "pdf";

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
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  pdf: "application/pdf",
};

/** Some browsers report an empty type for .m4a/.aac (and some .mov) files. */
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

/**
 * Takes a still from a video file in the browser (about a tenth of the way in, at most 3 s, to
 * skip black lead-in frames) as a JPEG, max 1280 px wide. Null if the browser cannot decode it.
 */
export function captureVideoFrame(file: File): Promise<File | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    let settled = false;
    const done = (v: File | null) => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(url);
      resolve(v);
    };
    const timer = setTimeout(() => done(null), 15_000);
    video.onerror = () => {
      clearTimeout(timer);
      done(null);
    };
    video.onloadedmetadata = () => {
      const d = Number.isFinite(video.duration) ? video.duration : 0;
      video.currentTime = Math.min(3, d * 0.1);
    };
    video.onseeked = () => {
      clearTimeout(timer);
      const scale = Math.min(1, 1280 / (video.videoWidth || 1280));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round((video.videoWidth || 1280) * scale);
      canvas.height = Math.round((video.videoHeight || 720) * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx || !video.videoWidth) return done(null);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => done(blob ? new File([blob], "video-thumbnail.jpg", { type: "image/jpeg" }) : null), "image/jpeg", 0.85);
    };
    video.src = url;
  });
}
