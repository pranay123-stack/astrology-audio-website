import type {
  ArticleLang,
  Category,
  Competition,
  ContactMessage,
  CricketMatch,
  Episode,
  EpisodeListing,
  EpisodePage,
  EpisodeQuery,
  Profile,
  Team,
  PostFormat,
  VideoFormat,
} from "../types";
import { dayBounds } from "../dates";
import type { CompetitionData, ProfileData, TeamData } from "../validation";

/** Episode fields written by the admin form, after validation and slug resolution. */
export interface EpisodeWrite {
  title: string;
  slug: string;
  excerpt: string;
  description: string;
  article: string;
  article_lang: ArticleLang;
  title_alt: string;
  excerpt_alt: string;
  description_alt: string;
  article_alt: string;
  category_id: string;
  audio_storage_path: string | null;
  audio_mime_type: string | null;
  cover_image_path: string | null;
  video_storage_path: string | null;
  video_mime_type: string | null;
  video_format: VideoFormat;
  video_link: string;
  audio_link: string;
  gallery_paths: string[];
  pdf_storage_path: string | null;
  pdf_link: string;
  is_archived: boolean;
  duration_seconds: number;
  is_published: boolean;
  is_premium: boolean;
  published_at: string | null;
  match: Omit<CricketMatch, "id" | "episode_id"> | null;
}

export interface DashboardStats {
  total: number;
  published: number;
  drafts: number;
  scheduled: number;
  premium: number;
  demo: number;
  unreadMessages: number;
  byCategory: { category: Category; count: number }[];
}

export interface Repository {
  listCategories(): Promise<Category[]>;
  listCompetitions(): Promise<Competition[]>;
  listTeams(): Promise<Team[]>;
  getProfile(): Promise<Profile>;

  queryEpisodes(query: EpisodeQuery): Promise<EpisodePage>;
  getEpisodeBySlug(slug: string, opts?: { includeUnpublished?: boolean }): Promise<EpisodeListing | null>;
  getEpisodeById(id: string, opts?: { includeUnpublished?: boolean }): Promise<EpisodeListing | null>;
  listEpisodeSlugs(): Promise<{ id: string; slug: string }[]>;
  /** The current slug of the post that used to live at `oldSlug`, or null. */
  resolveOldSlug(oldSlug: string): Promise<string | null>;
  incrementPlayCount(id: string): Promise<void>;

  createEpisode(data: EpisodeWrite): Promise<Episode>;
  updateEpisode(id: string, data: EpisodeWrite): Promise<Episode>;
  setEpisodePublished(id: string, published: boolean): Promise<Episode>;
  /** Returns the deleted row so the caller can remove its media files. */
  deleteEpisode(id: string): Promise<Episode | null>;
  deleteDemoEpisodes(): Promise<Episode[]>;
  /** Every storage path still referenced by any row (used before deleting a file). */
  isStoragePathReferenced(path: string): Promise<boolean>;

  updateProfile(data: ProfileData): Promise<Profile>;
  saveCompetition(data: CompetitionData): Promise<Competition>;
  deleteCompetition(id: string): Promise<void>;
  saveTeam(data: TeamData): Promise<Team>;
  deleteTeam(id: string): Promise<Team | null>;

  createContactMessage(msg: Pick<ContactMessage, "name" | "email" | "subject" | "message">): Promise<void>;
  listContactMessages(): Promise<ContactMessage[]>;
  setContactMessageRead(id: string, isRead: boolean): Promise<void>;
  deleteContactMessage(id: string): Promise<void>;

  stats(): Promise<DashboardStats>;
}

export class RepositoryError extends Error {
  constructor(
    message: string,
    public readonly code: "not_found" | "conflict" | "invalid" | "backend" = "backend",
  ) {
    super(message);
    this.name = "RepositoryError";
  }
}

/** A published episode needs something to consume: audio, an article (in either language), a video or photos. */
export function hasContent(
  e: Pick<
    Episode,
    "audio_storage_path" | "audio_link" | "has_article" | "has_article_alt" | "video_storage_path" | "video_link" | "gallery_paths" | "pdf_storage_path" | "pdf_link"
  >,
): boolean {
  return (
    !!e.audio_storage_path ||
    !!e.audio_link || e.has_article || e.has_article_alt || !!e.video_storage_path || !!e.video_link || e.gallery_paths.length > 0 ||
    !!e.pdf_storage_path || !!e.pdf_link
  );
}

/** Whether a post contains `format`; mirrors the SQL filter in the Supabase adapter. */
export function hasFormat(
  e: Pick<Episode, "has_article" | "has_article_alt" | "audio_storage_path" | "audio_link" | "video_storage_path" | "video_link" | "video_format" | "pdf_storage_path" | "pdf_link">,
  format: PostFormat,
): boolean {
  const video = !!e.video_storage_path || !!e.video_link;
  switch (format) {
    case "article":
      return e.has_article || e.has_article_alt;
    case "audio":
      return !!e.audio_storage_path || !!e.audio_link;
    case "video":
      return video && e.video_format === "video";
    case "reel":
      return video && e.video_format === "reel";
    case "pdf":
      return !!e.pdf_storage_path || !!e.pdf_link;
  }
}

export function isLive(e: Pick<Episode, "is_published" | "published_at">, now = Date.now()): boolean {
  return e.is_published && !!e.published_at && Date.parse(e.published_at) <= now;
}

export type EpisodeStatus = "live" | "scheduled" | "draft";

export function episodeStatus(e: Pick<Episode, "is_published" | "published_at">, now = Date.now()): EpisodeStatus {
  if (!e.is_published) return "draft";
  return isLive(e, now) ? "live" : "scheduled";
}

/** In-memory implementation of EpisodeQuery semantics; the Supabase adapter mirrors these in SQL. */
export function filterAndSort(rows: EpisodeListing[], q: EpisodeQuery, now = Date.now()): EpisodePage {
  const needle = q.search?.trim().toLowerCase();
  const from = q.dateFrom ? (dayBounds(q.dateFrom)?.start ?? null) : null;
  const to = q.dateTo ? (dayBounds(q.dateTo)?.end ?? null) : null;

  const filtered = rows.filter((r) => {
    if (!q.includeUnpublished && !isLive(r, now)) return false;
    if (q.excludeId && r.id === q.excludeId) return false;
    if (q.section && r.category.section !== q.section) return false;
    if (q.withMatch && !r.match) return false;
    if (q.format && !hasFormat(r, q.format)) return false;
    if (q.formats?.length && !q.formats.some((f) => hasFormat(r, f))) return false;
    if (q.categorySlug && r.category.slug !== q.categorySlug) return false;
    if (q.categorySlugs?.length && !q.categorySlugs.includes(r.category.slug)) return false;
    if (q.archived !== undefined && r.is_archived !== q.archived) return false;
    if (q.competitionSlug && r.match?.competition.slug !== q.competitionSlug) return false;
    if (q.access === "free" && r.is_premium) return false;
    if (q.access === "premium" && !r.is_premium) return false;
    if (q.timing) {
      if (!r.match) return false;
      const start = Date.parse(r.match.match_date);
      if (q.timing === "upcoming" && start < now) return false;
      if (q.timing === "past" && start >= now) return false;
    }
    if (from !== null || to !== null) {
      const stamp = r.match ? r.match.match_date : r.published_at;
      const t = stamp ? Date.parse(stamp) : NaN;
      if (Number.isNaN(t)) return false;
      if (from !== null && t < from) return false;
      if (to !== null && t > to) return false;
    }
    if (needle) {
      const hay = [
        r.title,
        r.excerpt,
        r.description,
        r.article,
        r.title_alt,
        r.excerpt_alt,
        r.description_alt,
        r.article_alt,
        r.category.name,
        r.category.name_hi,
        r.match?.team_a.name,
        r.match?.team_a.short_name,
        r.match?.team_b.name,
        r.match?.team_b.short_name,
        r.match?.competition.name,
        r.match?.competition.short_name,
        r.match?.venue,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    return true;
  });

  const byPublished = (a: EpisodeListing, b: EpisodeListing) =>
    Date.parse(b.published_at ?? b.created_at) - Date.parse(a.published_at ?? a.created_at);
  const matchTime = (r: EpisodeListing) => (r.match ? Date.parse(r.match.match_date) : Number.MAX_SAFE_INTEGER);

  const sorted = [...filtered];
  switch (q.sort ?? "latest") {
    case "popular":
      sorted.sort((a, b) => b.play_count - a.play_count || byPublished(a, b));
      break;
    case "match_date_asc":
      sorted.sort((a, b) => matchTime(a) - matchTime(b) || byPublished(a, b));
      break;
    case "match_date_desc":
      sorted.sort((a, b) => matchTime(b) - matchTime(a) || byPublished(a, b));
      break;
    default:
      sorted.sort(byPublished);
  }

  const offset = q.offset ?? 0;
  const items = q.limit ? sorted.slice(offset, offset + q.limit) : sorted.slice(offset);
  return { items, total: filtered.length };
}
