import "server-only";
import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, open, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { getDataBackend, localPaths, uploadLimits } from "../config";
import { signToken } from "../auth/tokens";
import { createServiceClient } from "../data/supabase-clients";
import { AUDIO_TYPES, contentMatchesExtension, IMAGE_TYPES } from "./file-types";
import { parseRange } from "./range";

export type UploadKind = "audio" | "cover" | "team" | "profile";

const FOLDERS: Record<UploadKind, string> = { audio: "audio", cover: "covers", team: "teams", profile: "profile" };

export interface UploadTarget {
  path: string;
  method: "PUT";
  url: string;
  headers: Record<string, string>;
}

export class UploadRejected extends Error {}

/** Validates a requested upload and allocates a fresh, unguessable storage path. */
export function planUpload(kind: UploadKind, contentType: string, size: number): { path: string; maxBytes: number } {
  const isAudio = kind === "audio";
  const ext = (isAudio ? AUDIO_TYPES : IMAGE_TYPES)[contentType.toLowerCase()];
  if (!ext) {
    throw new UploadRejected(
      isAudio ? "Unsupported audio format. Use MP3, M4A, AAC, OGG or WAV." : "Unsupported image format. Use JPG, PNG, WebP or AVIF.",
    );
  }
  const maxBytes = isAudio ? uploadLimits.audioMaxBytes : uploadLimits.imageMaxBytes;
  if (size > maxBytes) {
    throw new UploadRejected(`File is too large. The limit is ${Math.round(maxBytes / 1024 / 1024)} MB.`);
  }
  return { path: `${FOLDERS[kind]}/${randomUUID()}.${ext}`, maxBytes };
}

const bucketOf = (p: string) => (p.startsWith("audio/") ? "audio" : "images");

export function localStorageRoot(): string {
  return path.resolve(localPaths.dataDir, "storage");
}

/** Resolves a storage path inside the local storage root, refusing traversal. */
export function localFilePath(p: string): string {
  const root = localStorageRoot();
  const full = path.resolve(root, p);
  if (!full.startsWith(root + path.sep)) throw new UploadRejected("Invalid path");
  return full;
}

export async function createUploadTarget(p: string, contentType: string, maxBytes: number): Promise<UploadTarget> {
  if (getDataBackend() === "local") {
    const token = signToken({ path: p, ct: contentType, max: maxBytes, purpose: "upload" }, 30 * 60);
    return { path: p, method: "PUT", url: `/api/admin/uploads/local?token=${encodeURIComponent(token)}`, headers: { "content-type": contentType } };
  }
  const service = createServiceClient();
  const { data, error } = await service.storage.from(bucketOf(p)).createSignedUploadUrl(p);
  if (error || !data) throw new Error(`Could not create upload URL: ${error?.message}`);
  return {
    path: p,
    method: "PUT",
    url: data.signedUrl,
    headers: {
      "content-type": contentType,
      "x-upsert": "false",
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    },
  };
}

/** Streams a request body to local storage, enforcing the size limit and checking the file signature. */
export async function writeLocalUpload(p: string, body: ReadableStream<Uint8Array>, maxBytes: number): Promise<number> {
  const target = localFilePath(p);
  await mkdir(/*turbopackIgnore: true*/ path.dirname(target), { recursive: true });
  const tmp = `${target}.part`;
  if (await stat(/*turbopackIgnore: true*/ target).then(() => true, () => false)) throw new UploadRejected("This upload link has already been used");
  const handle = await open(/*turbopackIgnore: true*/ tmp, "wx");
  let written = 0;
  let head = new Uint8Array(0);
  try {
    const reader = body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      written += value.byteLength;
      if (written > maxBytes) {
        await reader.cancel();
        throw new UploadRejected("File exceeds the upload size limit");
      }
      if (head.length < 32) {
        const merged = new Uint8Array(head.length + value.length);
        merged.set(head);
        merged.set(value, head.length);
        head = merged.slice(0, 32);
      }
      await handle.write(value);
    }
  } catch (err) {
    await handle.close();
    await rm(/*turbopackIgnore: true*/ tmp, { force: true });
    throw err;
  }
  await handle.close();
  const ext = path.extname(p).slice(1);
  if (written === 0 || !contentMatchesExtension(head, ext)) {
    await rm(/*turbopackIgnore: true*/ tmp, { force: true });
    throw new UploadRejected("The file contents do not match its declared type");
  }
  await rename(/*turbopackIgnore: true*/ tmp, target);
  return written;
}

/** First bytes of a stored file, or null if it does not exist. */
export async function readHead(p: string, bytes = 32): Promise<Uint8Array | null> {
  if (getDataBackend() === "local") {
    try {
      const handle = await open(/*turbopackIgnore: true*/ localFilePath(p), "r");
      try {
        const buf = new Uint8Array(bytes);
        const { bytesRead } = await handle.read(buf, 0, bytes, 0);
        return buf.slice(0, bytesRead);
      } finally {
        await handle.close();
      }
    } catch {
      return null;
    }
  }
  const service = createServiceClient();
  const { data } = await service.storage.from(bucketOf(p)).createSignedUrl(p, 60);
  if (!data?.signedUrl) return null;
  const res = await fetch(data.signedUrl, { headers: { range: `bytes=0-${bytes - 1}` } });
  if (!res.ok) return null;
  return new Uint8Array(await res.arrayBuffer()).slice(0, bytes);
}

/** True when the object exists and its leading bytes match the extension it was uploaded under. */
export async function verifyStoredFile(p: string): Promise<boolean> {
  const head = await readHead(p);
  return !!head && contentMatchesExtension(head, path.extname(p).slice(1));
}

export async function removeStoredFile(p: string | null | undefined): Promise<void> {
  if (!p) return;
  if (getDataBackend() === "local") {
    await rm(/*turbopackIgnore: true*/ localFilePath(p), { force: true });
    return;
  }
  const service = createServiceClient();
  await service.storage.from(bucketOf(p)).remove([p]);
}

/**
 * Responds with the audio for an already-authorised request. Local mode streams
 * the file with Range support. Supabase mode redirects to a short-lived signed
 * URL, so the private bucket path itself is never published.
 */
export async function audioResponse(p: string, mime: string | null, request: Request, ttlSeconds: number): Promise<Response> {
  const noStore = { "cache-control": "private, no-store" };
  if (getDataBackend() !== "local") {
    const service = createServiceClient();
    const { data, error } = await service.storage.from("audio").createSignedUrl(p, ttlSeconds);
    if (error || !data) return Response.json({ error: "Audio file is unavailable" }, { status: 404, headers: noStore });
    return new Response(null, { status: 302, headers: { location: data.signedUrl, ...noStore } });
  }

  let file: string;
  let size: number;
  try {
    file = localFilePath(p);
    size = (await stat(/*turbopackIgnore: true*/ file)).size;
  } catch {
    return Response.json({ error: "Audio file is unavailable" }, { status: 404, headers: noStore });
  }
  const headers: Record<string, string> = {
    "content-type": mime || "audio/mpeg",
    "accept-ranges": "bytes",
    ...noStore,
  };
  const range = parseRange(request.headers.get("range"), size);
  if (range === "unsatisfiable") {
    return new Response(null, { status: 416, headers: { ...headers, "content-range": `bytes */${size}` } });
  }
  if (request.method === "HEAD") {
    return new Response(null, { status: 200, headers: { ...headers, "content-length": String(size) } });
  }
  const { start, end } = range ?? { start: 0, end: size - 1 };
  const stream = Readable.toWeb(createReadStream(/*turbopackIgnore: true*/ file, { start, end })) as ReadableStream<Uint8Array>;
  return new Response(stream, {
    status: range ? 206 : 200,
    headers: {
      ...headers,
      "content-length": String(end - start + 1),
      ...(range ? { "content-range": `bytes ${start}-${end}/${size}` } : {}),
    },
  });
}
