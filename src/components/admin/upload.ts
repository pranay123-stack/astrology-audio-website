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
 * Takes a still from a video file in the browser as a JPEG, max 1280 px wide, or null if the
 * browser cannot decode it. It tries about a tenth of the way in (at most 3 s, to skip lead-in),
 * then later points, and skips frames that come out black: drawn straight after the seek, the
 * frame was sometimes not decoded yet, which gave two posts an all-black cover.
 */
export function captureVideoFrame(file: File): Promise<File | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    let settled = false;
    let times: number[] = [];
    const done = (v: File | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      URL.revokeObjectURL(url);
      resolve(v);
    };
    const timer = setTimeout(() => done(null), 20_000);
    const next = () => {
      const t = times.shift();
      if (t === undefined) return done(null);
      video.currentTime = t;
    };
    const grab = () => {
      const scale = Math.min(1, 1280 / (video.videoWidth || 1280));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round((video.videoWidth || 1280) * scale);
      canvas.height = Math.round((video.videoHeight || 720) * scale);
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx || !video.videoWidth) return done(null);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      if (isDark(ctx, canvas.width, canvas.height)) return next();
      canvas.toBlob((blob) => done(blob ? new File([blob], "video-thumbnail.jpg", { type: "image/jpeg" }) : null), "image/jpeg", 0.85);
    };
    video.onerror = () => done(null);
    video.onloadedmetadata = () => {
      const d = Number.isFinite(video.duration) ? video.duration : 0;
      times = [Math.min(3, d * 0.1), d * 0.25, d * 0.5].filter((t, i, all) => t >= 0 && all.indexOf(t) === i);
      next();
    };
    // The element is never on the page, so frame callbacks don't fire; give the decoder a moment instead.
    video.onseeked = () => setTimeout(grab, 200);
    video.src = url;
  });
}

/** Average brightness of a small grid of samples below about 6%: a black (or not yet painted) frame. */
function isDark(ctx: CanvasRenderingContext2D, w: number, h: number): boolean {
  const { data } = ctx.getImageData(0, 0, w, h);
  let sum = 0;
  let n = 0;
  for (let y = 0; y < h; y += Math.max(1, Math.floor(h / 24))) {
    for (let x = 0; x < w; x += Math.max(1, Math.floor(w / 24))) {
      const k = (y * w + x) * 4;
      sum += (data[k] + data[k + 1] + data[k + 2]) / 3;
      n++;
    }
  }
  return n > 0 && sum / n < 15;
}
