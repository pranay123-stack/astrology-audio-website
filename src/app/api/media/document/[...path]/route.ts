import { readFile } from "node:fs/promises";
import { getDataBackend } from "@/lib/config";
import { localFilePath } from "@/lib/media/storage";

/** Local mode only: serves uploaded PDFs (free to read and download, like public images). */
export async function GET(_request: Request, ctx: RouteContext<"/api/media/document/[...path]">) {
  if (getDataBackend() !== "local") return new Response("Not found", { status: 404 });
  const { path: parts } = await ctx.params;
  if (parts.length !== 2 || parts[0] !== "documents" || !/^[0-9a-f-]{36}\.pdf$/.test(parts[1])) {
    return new Response("Not found", { status: 404 });
  }
  try {
    const data = await readFile(/*turbopackIgnore: true*/ localFilePath(parts.join("/")));
    return new Response(data, {
      headers: {
        "content-type": "application/pdf",
        // Paths are random UUIDs and never reused, so they can be cached forever.
        "cache-control": "public, max-age=31536000, immutable",
        "x-content-type-options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
