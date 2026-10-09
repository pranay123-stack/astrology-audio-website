import { getPublicRepository } from "@/lib/data";
import { rateLimit } from "@/lib/rate-limit";

/** Counts a play for the "Popular" listings. Best-effort and rate limited per IP and episode. */
export async function POST(request: Request, ctx: RouteContext<"/api/episodes/[id]/play">) {
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response(null, { status: 404 });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`play:${ip}:${id}`, 3, 60 * 60 * 1000).ok) return new Response(null, { status: 204 });
  try {
    await getPublicRepository().incrementPlayCount(id);
  } catch (err) {
    console.error("play count failed", err);
  }
  return new Response(null, { status: 204 });
}
