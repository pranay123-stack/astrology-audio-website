import { z } from "zod";
import { ARTICLE_LANGS, MATCH_STATUSES } from "./types";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HEX_RE = /^#[0-9a-fA-F]{6}$/;
/** Storage keys created by the upload endpoint: `<folder>/<uuid>.<ext>`. */
const STORAGE_PATH_RE = /^(audio|covers|teams|profile)\/[0-9a-f-]{36}\.[a-z0-9]{2,5}$/;

const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .refine((v) => v === "" || /^https?:\/\/\S+$/i.test(v), "Enter a full URL starting with https://")
  .default("");

export const storagePathSchema = z.string().regex(STORAGE_PATH_RE, "Invalid file reference");

export const matchInputSchema = z
  .object({
    competition_id: z.string().min(1, "Choose a competition"),
    team_a_id: z.string().min(1, "Choose team A"),
    team_b_id: z.string().min(1, "Choose team B"),
    /** ISO-8601 instant (the form converts the local date/time input before submitting). */
    match_date: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Enter the match date and time"),
    venue: z.string().trim().max(160).default(""),
    match_status: z.enum(MATCH_STATUSES).default("scheduled"),
  })
  .refine((m) => m.team_a_id !== m.team_b_id, {
    message: "Team A and Team B must be different",
    path: ["team_b_id"],
  });

export const episodeInputSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(3, "Title is too short").max(160),
  slug: z
    .string()
    .trim()
    .max(90)
    .refine((v) => v === "" || SLUG_RE.test(v), "Use lowercase letters, numbers and hyphens only")
    .default(""),
  excerpt: z.string().trim().min(10, "Add a short description (10+ characters)").max(280),
  description: z.string().trim().max(10000).default(""),
  article: z.string().trim().max(60000, "Article is too long (60,000 characters max)").default(""),
  article_lang: z.enum(ARTICLE_LANGS).default("hi"),
  category_id: z.string().min(1, "Choose a category"),
  audio_storage_path: storagePathSchema.nullable(),
  cover_image_path: storagePathSchema.nullable(),
  duration_seconds: z.number().int().min(0).max(60 * 60 * 12),
  is_published: z.boolean(),
  is_premium: z.boolean(),
  /** ISO-8601 instant; empty means "now" when publishing. */
  published_at: z
    .string()
    .refine((v) => v === "" || !Number.isNaN(Date.parse(v)), "Invalid publication date")
    .default(""),
  match: matchInputSchema.nullable(),
});
export type EpisodeInput = z.input<typeof episodeInputSchema>;
export type EpisodeData = z.output<typeof episodeInputSchema>;

export const profileInputSchema = z.object({
  display_name: z.string().trim().min(2).max(120),
  tagline: z.string().trim().max(200).default(""),
  biography: z.string().trim().max(6000).default(""),
  experience: z.string().trim().max(3000).default(""),
  specializations: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
  profile_image_path: storagePathSchema.nullable(),
  contact_email: z
    .string()
    .trim()
    .max(200)
    .refine((v) => v === "" || z.email().safeParse(v).success, "Enter a valid email")
    .default(""),
  contact_phone: z.string().trim().max(40).default(""),
  location: z.string().trim().max(120).default(""),
  consultation_info: z.string().trim().max(3000).default(""),
  social_links: z
    .object({
      youtube: optionalUrl,
      instagram: optionalUrl,
      facebook: optionalUrl,
      x: optionalUrl,
      whatsapp: optionalUrl,
      spotify: optionalUrl,
      telegram: optionalUrl,
      amazon: optionalUrl,
      linktree: optionalUrl,
    })
    .default({ youtube: "", instagram: "", facebook: "", x: "", whatsapp: "", spotify: "", telegram: "", amazon: "", linktree: "" }),
  legal_business_name: z.string().trim().max(160).default(""),
  legal_jurisdiction: z.string().trim().max(160).default(""),
});
export type ProfileInput = z.input<typeof profileInputSchema>;
export type ProfileData = z.output<typeof profileInputSchema>;

export const competitionInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2).max(120),
  short_name: z.string().trim().min(2).max(16),
  description: z.string().trim().max(1000).default(""),
  is_active: z.boolean().default(true),
});
export type CompetitionData = z.output<typeof competitionInputSchema>;

export const teamInputSchema = z.object({
  id: z.string().optional(),
  competition_id: z.string().min(1),
  name: z.string().trim().min(2).max(120),
  short_name: z.string().trim().min(2).max(6),
  primary_color: z.string().regex(HEX_RE, "Use a hex colour such as #1d4ed8").default("#4c1d95"),
  logo_path: storagePathSchema.nullable().default(null),
});
export type TeamData = z.output<typeof teamInputSchema>;

export const contactInputSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(120),
  email: z.email("Please enter a valid email").max(200),
  subject: z.string().trim().max(160).default(""),
  message: z.string().trim().min(10, "Please write a little more (10+ characters)").max(5000),
  /** Honeypot: real visitors never see or fill this field. */
  website: z.string().max(0).optional().default(""),
});
export type ContactInput = z.input<typeof contactInputSchema>;

export const loginInputSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Enter your password").max(200),
});

export const uploadRequestSchema = z.object({
  kind: z.enum(["audio", "cover", "team", "profile"]),
  filename: z.string().min(1).max(255),
  contentType: z.string().min(1).max(100),
  size: z.number().int().positive(),
});
export type UploadRequest = z.infer<typeof uploadRequestSchema>;

/** Flattens Zod issues into `{ "match.team_b_id": "message" }` for form display. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
