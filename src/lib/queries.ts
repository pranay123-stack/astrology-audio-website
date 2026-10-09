import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { getPublicRepository } from "./data";
import type { EpisodeQuery } from "./types";

/**
 * Cached reads for public pages. Every admin mutation calls `updateTag(CONTENT_TAG)`,
 * so edits appear immediately; the one-minute lifetime also picks up scheduled
 * publication times and moves matches from "upcoming" to "past" as time passes.
 */
export const CONTENT_TAG = "content";

function contentCache() {
  cacheTag(CONTENT_TAG);
  // `stale` must be at least 5 minutes for this data to be part of each route's App Shell
  // (shorter values push it out of the shell). Server-side freshness comes from
  // `revalidate` and from updateTag() after admin edits, not from `stale`.
  cacheLife({ stale: 300, revalidate: 60, expire: 3600 });
}

export async function getProfile() {
  "use cache";
  contentCache();
  return getPublicRepository().getProfile();
}

export async function getCategories() {
  "use cache";
  contentCache();
  return getPublicRepository().listCategories();
}

export async function getCompetitions() {
  "use cache";
  contentCache();
  return getPublicRepository().listCompetitions();
}

export async function getEpisodes(query: EpisodeQuery) {
  "use cache";
  contentCache();
  return getPublicRepository().queryEpisodes({ ...query, includeUnpublished: false });
}

export async function getEpisodeBySlug(slug: string) {
  "use cache";
  contentCache();
  return getPublicRepository().getEpisodeBySlug(slug);
}

export async function getDemoContentCount() {
  "use cache";
  contentCache();
  const { items } = await getPublicRepository().queryEpisodes({});
  return items.filter((e) => e.is_demo).length;
}
