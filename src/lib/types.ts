export type Section = "cricket" | "general";
export const ARTICLE_LANGS = ["hi", "en"] as const;
export type ArticleLang = (typeof ARTICLE_LANGS)[number];
/** Site interface languages. English lives at /..., Hindi at /hi/... */
export type Locale = ArticleLang;

export const MATCH_STATUSES = [
  "scheduled",
  "live",
  "completed",
  "abandoned",
  "postponed",
] as const;
export type MatchStatus = (typeof MATCH_STATUSES)[number];

/** "video" is shown landscape (16:9), "reel" as a short vertical clip (9:16). */
export const VIDEO_FORMATS = ["video", "reel"] as const;
export type VideoFormat = (typeof VIDEO_FORMATS)[number];
/** What a post can be filtered by on the listing pages. A post with several media matches several. */
export const POST_FORMATS = ["article", "audio", "video", "reel", "pdf"] as const;
export type PostFormat = (typeof POST_FORMATS)[number];
/** Most photos a post's gallery can hold. */
export const GALLERY_MAX = 12;

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  /** Hindi name and description; empty means "use the English one". */
  name_hi: string;
  description_hi: string;
  section: Section;
  /** Posts in this category are readings of a match and must have match details. */
  requires_match: boolean;
  sort_order: number;
}

export interface Competition {
  id: string;
  name: string;
  short_name: string;
  slug: string;
  description: string;
  is_active: boolean;
}

export interface Team {
  id: string;
  competition_id: string;
  name: string;
  short_name: string;
  logo_path: string | null;
  primary_color: string;
}

export interface Episode {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  description: string;
  /** True when the post has a written article (the body is stored separately, see EpisodeListing.article). */
  has_article: boolean;
  /** The post's main language: title, excerpt, description and article are written in it. */
  article_lang: ArticleLang;
  /** Optional version in the other language (empty = not translated). */
  title_alt: string;
  excerpt_alt: string;
  description_alt: string;
  has_article_alt: boolean;
  category_id: string;
  audio_storage_path: string | null;
  audio_mime_type: string | null;
  cover_image_path: string | null;
  /** Uploaded video (private bucket, streamed through the access-checked video route). */
  video_storage_path: string | null;
  video_mime_type: string | null;
  video_format: VideoFormat;
  /** YouTube or Instagram link embedded on the page ("" = none). Visible to everyone. */
  video_link: string;
  /** Google Drive link to an audio file (e.g. an audiobook) played with Drive's player ("" = none). Visible to everyone. */
  audio_link: string;
  /** Photo gallery (public images bucket), in display order. */
  gallery_paths: string[];
  /** PDF in the public documents bucket (free to read and download). */
  pdf_storage_path: string | null;
  /** Google Drive link to a PDF, for files over the upload limit ("" = none). */
  pdf_link: string;
  /** Marked "old video" by the admin: listed under Astro Cricket › Old Videos instead of the current videos. */
  is_archived: boolean;
  duration_seconds: number;
  is_published: boolean;
  is_premium: boolean;
  is_demo: boolean;
  play_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CricketMatch {
  id: string;
  episode_id: string;
  competition_id: string;
  team_a_id: string;
  team_b_id: string;
  match_date: string;
  venue: string;
  match_status: MatchStatus;
}

export interface SocialLinks {
  youtube?: string;
  instagram?: string;
  facebook?: string;
  x?: string;
  whatsapp?: string;
  spotify?: string;
  telegram?: string;
  amazon?: string;
  linktree?: string;
  /** Google Form link (questionnaire), embedded on the contact page. */
  google_form?: string;
}

/** Hindi versions of the profile's text fields; any missing field falls back to English. */
export interface ProfileHindi {
  display_name?: string;
  tagline?: string;
  biography?: string;
  experience?: string;
  specializations?: string[];
  location?: string;
  consultation_info?: string;
}

/** The astrologer's public profile. There is exactly one row. */
export interface Profile {
  id: string;
  display_name: string;
  tagline: string;
  biography: string;
  experience: string;
  specializations: string[];
  profile_image_path: string | null;
  contact_email: string;
  contact_phone: string;
  location: string;
  consultation_info: string;
  social_links: SocialLinks;
  legal_business_name: string;
  legal_jurisdiction: string;
  hi: ProfileHindi;
  updated_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface TeamSummary {
  id: string;
  name: string;
  short_name: string;
  logo_path: string | null;
  primary_color: string;
}

/** An episode joined with its category and (for cricket) match details. */
export interface EpisodeListing extends Episode {
  /**
   * Article body (light formatting, often Hindi). Empty when there is no article, and also
   * for premium posts in public reads: visitors never receive premium article text.
   */
  article: string;
  /** The other-language article body, under the same premium rule. */
  article_alt: string;
  category: Pick<Category, "id" | "name" | "name_hi" | "slug" | "section">;
  match: (CricketMatch & {
    competition: Pick<Competition, "id" | "name" | "short_name" | "slug">;
    team_a: TeamSummary;
    team_b: TeamSummary;
  }) | null;
}

export type SortOrder = "latest" | "popular" | "match_date_asc" | "match_date_desc";

export interface EpisodeQuery {
  section?: Section;
  categorySlug?: string;
  /** Any of these categories (ignored when empty). */
  categorySlugs?: string[];
  /** true: only posts marked "old video"; false: only the others. */
  archived?: boolean;
  competitionSlug?: string;
  search?: string;
  access?: "free" | "premium";
  /** Cricket only: matches starting now or later vs. already started. */
  timing?: "upcoming" | "past";
  /** Inclusive date bounds (YYYY-MM-DD) on match date for cricket, published date otherwise. */
  dateFrom?: string;
  dateTo?: string;
  sort?: SortOrder;
  limit?: number;
  offset?: number;
  excludeId?: string;
  /** Only posts containing this kind of media. */
  format?: PostFormat;
  /** Only posts containing any of these kinds of media (ignored when empty). */
  formats?: PostFormat[];
  /** Only posts with match details (match readings), excluding cricket guide articles. */
  withMatch?: boolean;
  /** Admin listings include drafts and scheduled episodes. */
  includeUnpublished?: boolean;
}

export interface EpisodePage {
  items: EpisodeListing[];
  total: number;
}
