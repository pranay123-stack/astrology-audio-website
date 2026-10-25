import { readFile } from "node:fs/promises";
import path from "node:path";
import { getDataBackend } from "@/lib/config";
import { EXT_TO_MIME, IMAGE_TYPES } from "@/lib/media/file-types";
import { localFilePath } from "@/lib/media/storage";

const IMAGE_FOLDERS = new Set(["covers", "gallery", "teams", "profile"]);
const IMAGE_EXTS = new Set(Object.values(IMAGE_TYPES));

/** Local mode only: serves public images. Audio is never reachable through this route. */
export async function GET(_request: Request, ctx: RouteContext<"/api/media/image/[...path]">) {
  if (getDataBackend() !== "local") return new Response("Not found", { status: 404 });
  const { path: parts } = await ctx.params;
  const rel = parts.join("/");
  const ext = path.extname(rel).slice(1).toLowerCase();
  if (parts.length !== 2 || !IMAGE_FOLDERS.has(parts[0]) || !IMAGE_EXTS.has(ext) || !/^[0-9a-f-]{36}\.[a-z]+$/.test(parts[1])) {
    return new Response("Not found", { status: 404 });
  }
  try {
    const data = await readFile(/*turbopackIgnore: true*/ localFilePath(rel));
    return new Response(data, {
      headers: {
        "content-type": EXT_TO_MIME[ext],
        // Paths are random UUIDs and never reused, so they can be cached forever.
        "cache-control": "public, max-age=31536000, immutable",
        "x-content-type-options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
