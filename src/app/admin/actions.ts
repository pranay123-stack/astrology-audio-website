"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { loginAdmin, logoutAdmin, requireAdmin } from "@/lib/auth/admin";
import { getAdminRepository, RepositoryError, type EpisodeWrite } from "@/lib/data";
import { EXT_TO_MIME } from "@/lib/media/file-types";
import { removeStoredFile, verifyStoredFile } from "@/lib/media/storage";
import { CONTENT_TAG } from "@/lib/queries";
import type { Episode } from "@/lib/types";
import { slugify, uniqueSlug } from "@/lib/slug";
import {
  competitionInputSchema,
  episodeInputSchema,
  fieldErrors,
  loginInputSchema,
  profileInputSchema,
  teamInputSchema,
  type EpisodeInput,
  type ProfileInput,
} from "@/lib/validation";

export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : { data: T }))
  | { ok: false; error: string; fields?: Record<string, string> };

function failure(err: unknown): { ok: false; error: string } {
  if (err instanceof RepositoryError) return { ok: false, error: err.message };
  console.error("admin action failed", err);
  return { ok: false, error: "Something went wrong. Please try again." };
}

/** Removes a stored file once nothing references it any more. */
async function cleanup(path: string | null | undefined) {
  if (!path) return;
  try {
    const repo = await getAdminRepository();
    if (!(await repo.isStoragePathReferenced(path))) await removeStoredFile(path);
  } catch (err) {
    console.error("media cleanup failed", path, err);
  }
}

/** Removes every media file of a deleted episode that nothing else uses. */
async function cleanupAll(e: Pick<Episode, "audio_storage_path" | "cover_image_path" | "video_storage_path" | "gallery_paths">) {
  for (const p of [e.audio_storage_path, e.cover_image_path, e.video_storage_path, ...e.gallery_paths]) await cleanup(p);
}

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

export async function loginAction(input: { email: string; password: string }): Promise<ActionResult> {
  const parsed = loginInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Enter your email and password.", fields: fieldErrors(parsed.error) };
  const result = await loginAdmin(parsed.data.email, parsed.data.password);
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

export async function logoutAction(): Promise<void> {
  await logoutAdmin();
  redirect("/admin/login");
}

// ---------------------------------------------------------------------------
// Episodes
// ---------------------------------------------------------------------------

export async function saveEpisode(input: EpisodeInput): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const parsed = episodeInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fields: fieldErrors(parsed.error) };
  const d = parsed.data;

  try {
    const repo = await getAdminRepository();
    const [categories, existing, slugs] = await Promise.all([
      repo.listCategories(),
      d.id ? repo.getEpisodeById(d.id, { includeUnpublished: true }) : Promise.resolve(null),
      repo.listEpisodeSlugs(),
    ]);
    if (d.id && !existing) return { ok: false, error: "This episode no longer exists." };

    const category = categories.find((c) => c.id === d.category_id);
    if (!category) return { ok: false, error: "Choose a category.", fields: { category_id: "Choose a category" } };
    // Match readings need teams and a date; cricket guide articles do not.
    const isCricket = category.requires_match;
    if (isCricket && !d.match) {
      return { ok: false, error: "Add the match details for cricket episodes.", fields: { "match.competition_id": "Choose a competition" } };
    }
    const hasSomething =
      !!d.audio_storage_path || !!d.article.trim() || !!d.article_alt.trim() || !!d.video_storage_path || !!d.video_link || d.gallery_paths.length > 0;
    if (d.is_published && !hasSomething) {
      const msg = "Add audio, an article, a video or photos to publish";
      return { ok: false, error: `${msg}.`, fields: { audio_storage_path: msg, article: msg } };
    }

    // Each file must sit in the folder for its field.
    const folders = [
      ["audio_storage_path", d.audio_storage_path, "audio/"],
      ["cover_image_path", d.cover_image_path, "covers/"],
      ["video_storage_path", d.video_storage_path, "video/"],
      ...d.gallery_paths.map((g) => ["gallery_paths", g, "gallery/"] as const),
    ] as const;
    for (const [field, path, folder] of folders) {
      if (path && !path.startsWith(folder)) return { ok: false, error: "Invalid file reference.", fields: { [field]: "Invalid file" } };
    }
    if (new Set(d.gallery_paths).size !== d.gallery_paths.length) {
      return { ok: false, error: "The same photo is in the gallery twice.", fields: { gallery_paths: "Duplicate photo" } };
    }

    // New files must exist in storage and their bytes must match the declared type.
    const before = new Set([existing?.audio_storage_path, existing?.cover_image_path, existing?.video_storage_path, ...(existing?.gallery_paths ?? [])]);
    for (const [field, path] of folders) {
      if (path && !before.has(path) && !(await verifyStoredFile(path))) {
        return { ok: false, error: "An uploaded file could not be verified. Please upload it again.", fields: { [field]: "Upload failed verification" } };
      }
    }

    const taken = new Set(slugs.filter((s) => s.id !== d.id).map((s) => s.slug));
    const desired = d.slug || slugify(d.title);
    if (d.slug && taken.has(d.slug)) {
      return { ok: false, error: "That URL slug is already used by another episode.", fields: { slug: "Slug already in use" } };
    }
    const slug = uniqueSlug(desired, taken);

    let publishedAt = d.published_at ? new Date(d.published_at).toISOString() : null;
    if (d.is_published && !publishedAt) publishedAt = new Date().toISOString();

    const ext = d.audio_storage_path?.split(".").pop() ?? "";
    const videoExt = d.video_storage_path?.split(".").pop() ?? "";
    const write: EpisodeWrite = {
      title: d.title,
      slug,
      excerpt: d.excerpt,
      description: d.description,
      article: d.article,
      article_lang: d.article_lang,
      title_alt: d.title_alt,
      excerpt_alt: d.excerpt_alt,
      description_alt: d.description_alt,
      article_alt: d.article_alt,
      category_id: d.category_id,
      audio_storage_path: d.audio_storage_path,
      audio_mime_type: d.audio_storage_path ? (EXT_TO_MIME[ext] ?? null) : null,
      cover_image_path: d.cover_image_path,
      video_storage_path: d.video_storage_path,
      video_mime_type: d.video_storage_path ? (EXT_TO_MIME[videoExt] ?? null) : null,
      video_format: d.video_format,
      video_link: d.video_link,
      gallery_paths: d.gallery_paths,
      duration_seconds: d.audio_storage_path ? d.duration_seconds : 0,
      is_published: d.is_published,
      is_premium: d.is_premium,
      published_at: publishedAt,
      match: isCricket && d.match ? { ...d.match, match_date: new Date(d.match.match_date).toISOString() } : null,
    };

    const saved = d.id ? await repo.updateEpisode(d.id, write) : await repo.createEpisode(write);
    if (existing) {
      if (existing.audio_storage_path !== write.audio_storage_path) await cleanup(existing.audio_storage_path);
      if (existing.cover_image_path !== write.cover_image_path) await cleanup(existing.cover_image_path);
      if (existing.video_storage_path !== write.video_storage_path) await cleanup(existing.video_storage_path);
      for (const g of existing.gallery_paths) if (!write.gallery_paths.includes(g)) await cleanup(g);
    }
    updateTag(CONTENT_TAG);
    return { ok: true, data: { id: saved.id } };
  } catch (err) {
    return failure(err);
  }
}

export async function setPublished(id: string, published: boolean): Promise<ActionResult> {
  await requireAdmin();
  try {
    await (await getAdminRepository()).setEpisodePublished(id, published);
    updateTag(CONTENT_TAG);
    return { ok: true };
  } catch (err) {
    return failure(err);
  }
}

export async function deleteEpisode(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    const deleted = await (await getAdminRepository()).deleteEpisode(id);
    if (deleted) {
      await cleanupAll(deleted);
    }
    updateTag(CONTENT_TAG);
    return { ok: true };
  } catch (err) {
    return failure(err);
  }
}

export async function deleteDemoContent(): Promise<ActionResult<{ count: number }>> {
  await requireAdmin();
  try {
    const removed = await (await getAdminRepository()).deleteDemoEpisodes();
    for (const e of removed) {
      await cleanupAll(e);
    }
    updateTag(CONTENT_TAG);
    return { ok: true, data: { count: removed.length } };
  } catch (err) {
    return failure(err);
  }
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export async function saveProfile(input: ProfileInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = profileInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fields: fieldErrors(parsed.error) };
  try {
    const repo = await getAdminRepository();
    const current = await repo.getProfile();
    const img = parsed.data.profile_image_path;
    if (img && img !== current.profile_image_path) {
      if (!img.startsWith("profile/") || !(await verifyStoredFile(img))) {
        return { ok: false, error: "The photo could not be verified. Please upload it again.", fields: { profile_image_path: "Upload failed verification" } };
      }
    }
    await repo.updateProfile(parsed.data);
    if (current.profile_image_path !== img) await cleanup(current.profile_image_path);
    updateTag(CONTENT_TAG);
    return { ok: true };
  } catch (err) {
    return failure(err);
  }
}

// ---------------------------------------------------------------------------
// Competitions and teams
// ---------------------------------------------------------------------------

export async function saveCompetition(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = competitionInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fields: fieldErrors(parsed.error) };
  try {
    await (await getAdminRepository()).saveCompetition(parsed.data);
    updateTag(CONTENT_TAG);
    return { ok: true };
  } catch (err) {
    return failure(err);
  }
}

export async function deleteCompetition(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    await (await getAdminRepository()).deleteCompetition(id);
    updateTag(CONTENT_TAG);
    return { ok: true };
  } catch (err) {
    return failure(err);
  }
}

export async function saveTeam(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = teamInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fields: fieldErrors(parsed.error) };
  try {
    const repo = await getAdminRepository();
    const before = parsed.data.id ? (await repo.listTeams()).find((t) => t.id === parsed.data.id) : undefined;
    const logo = parsed.data.logo_path;
    if (logo && logo !== before?.logo_path && (!logo.startsWith("teams/") || !(await verifyStoredFile(logo)))) {
      return { ok: false, error: "The logo could not be verified. Please upload it again.", fields: { logo_path: "Upload failed verification" } };
    }
    await repo.saveTeam(parsed.data);
    if (before?.logo_path && before.logo_path !== logo) await cleanup(before.logo_path);
    updateTag(CONTENT_TAG);
    return { ok: true };
  } catch (err) {
    return failure(err);
  }
}

export async function deleteTeam(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    const removed = await (await getAdminRepository()).deleteTeam(id);
    await cleanup(removed?.logo_path);
    updateTag(CONTENT_TAG);
    return { ok: true };
  } catch (err) {
    return failure(err);
  }
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export async function setMessageRead(id: string, isRead: boolean): Promise<ActionResult> {
  await requireAdmin();
  try {
    await (await getAdminRepository()).setContactMessageRead(id, isRead);
    return { ok: true };
  } catch (err) {
    return failure(err);
  }
}

export async function deleteMessage(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    await (await getAdminRepository()).deleteContactMessage(id);
    return { ok: true };
  } catch (err) {
    return failure(err);
  }
}
