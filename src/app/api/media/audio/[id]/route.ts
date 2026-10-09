import { decideAudioAccess } from "@/lib/access";
import { getAdmin } from "@/lib/auth/admin";
import { premiumConfig } from "@/lib/config";
import { getAdminRepository, getPublicRepository } from "@/lib/data";
import { audioResponse } from "@/lib/media/storage";

/**
 * Streams an episode's audio after checking access on the server for every request.
 * Premium audio is refused unless the premium module is enabled and the listener is
 * entitled; unpublished audio is visible only to a signed-in administrator (preview).
 */
async function handle(request: Request, ctx: RouteContext<"/api/media/audio/[id]">): Promise<Response> {
  const { id } = await ctx.params;
  const noStore = { "cache-control": "private, no-store" };
  if (!/^[0-9a-f-]{36}$/i.test(id)) return Response.json({ error: "Episode not found" }, { status: 404, headers: noStore });

  const admin = await getAdmin();
  const repo = admin ? await getAdminRepository() : getPublicRepository();
  const episode = await repo.getEpisodeById(id, { includeUnpublished: !!admin });

  // Entitlements require customer accounts and payments, which stay disabled until configured.
  const decision = decideAudioAccess(episode, { isAdmin: !!admin, hasPremiumAccess: false }, premiumConfig.enabled);
  if (!decision.allowed) {
    return Response.json({ error: decision.reason }, { status: decision.status, headers: noStore });
  }
  return audioResponse(episode!.audio_storage_path!, episode!.audio_mime_type, request, episode!.is_premium ? 300 : 3600);
}

export const GET = handle;
export const HEAD = handle;
