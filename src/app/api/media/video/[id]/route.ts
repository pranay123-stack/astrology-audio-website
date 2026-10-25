import { decideMediaAccess } from "@/lib/access";
import { getAdmin } from "@/lib/auth/admin";
import { premiumConfig } from "@/lib/config";
import { getAdminRepository, getPublicRepository } from "@/lib/data";
import { mediaResponse } from "@/lib/media/storage";

/**
 * Streams an episode's uploaded video after checking access on the server for every
 * request, with the same rules as audio: premium video is refused to visitors until the
 * premium module is enabled, and unpublished video is visible only to an administrator.
 */
async function handle(request: Request, ctx: RouteContext<"/api/media/video/[id]">): Promise<Response> {
  const { id } = await ctx.params;
  const noStore = { "cache-control": "private, no-store" };
  if (!/^[0-9a-f-]{36}$/i.test(id)) return Response.json({ error: "Episode not found" }, { status: 404, headers: noStore });

  const admin = await getAdmin();
  const repo = admin ? await getAdminRepository() : getPublicRepository();
  const episode = await repo.getEpisodeById(id, { includeUnpublished: !!admin });

  const decision = decideMediaAccess(episode, "video", { isAdmin: !!admin, hasPremiumAccess: false }, premiumConfig.enabled);
  if (!decision.allowed) {
    return Response.json({ error: decision.reason }, { status: decision.status, headers: noStore });
  }
  return mediaResponse(episode!.video_storage_path!, episode!.video_mime_type, request, episode!.is_premium ? 300 : 3600);
}

export const GET = handle;
export const HEAD = handle;
