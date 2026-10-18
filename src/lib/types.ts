export type Section = "cricket" | "general";
export const ARTICLE_LANGS = ["hi", "en"] as const;
export type ArticleLang = (typeof ARTICLE_LANGS)[number];

export const MATCH_STATUSES = [
  "scheduled",
  "live",
  "completed",
  "abandoned",
  "postponed",
] as const;
export type MatchStatus = (typeof MATCH_STATUSES)[number];

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  section: Section;
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
  article_lang: ArticleLang;
  category_id: string;
  audio_storage_path: string | null;
  audio_mime_type: string | null;
  cover_image_path: string | null;
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
  category: Pick<Category, "id" | "name" | "slug" | "section">;
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
  /** Admin listings include drafts and scheduled episodes. */
  includeUnpublished?: boolean;
}

export interface EpisodePage {
  items: EpisodeListing[];
  total: number;
}
