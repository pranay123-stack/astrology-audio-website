import { describe, expect, it } from "vitest";
import { parseListParams, toQueryString } from "@/lib/list-params";
import { contactInputSchema, episodeInputSchema, fieldErrors, profileInputSchema } from "@/lib/validation";

const validEpisode = {
  title: "A valid title",
  slug: "",
  excerpt: "A short description here",
  description: "",
  category_id: "c",
  audio_storage_path: "audio/0f8fad5b-d9cb-469f-a165-70867728950e.mp3",
  cover_image_path: null,
  duration_seconds: 300,
  is_published: true,
  is_premium: false,
  published_at: "",
  match: null,
};

describe("episode validation", () => {
  it("accepts a valid episode", () => expect(episodeInputSchema.safeParse(validEpisode).success).toBe(true));

  it("rejects storage paths that were not issued by the upload endpoint", () => {
    for (const bad of ["../../etc/passwd", "audio/x.mp3", "https://evil.example/a.mp3", "private/0f8fad5b-d9cb-469f-a165-70867728950e.mp3"]) {
      expect(episodeInputSchema.safeParse({ ...validEpisode, audio_storage_path: bad }).success).toBe(false);
    }
  });

  it("rejects malformed slugs", () => {
    expect(episodeInputSchema.safeParse({ ...validEpisode, slug: "Bad Slug!" }).success).toBe(false);
  });

  it("rejects a match between the same team and reports the field path", () => {
    const r = episodeInputSchema.safeParse({
      ...validEpisode,
      match: { competition_id: "bbl", team_a_id: "t1", team_b_id: "t1", match_date: "2026-12-01T08:00:00Z", venue: "", match_status: "scheduled" },
    });
    expect(r.success).toBe(false);
    if (!r.success) expect(fieldErrors(r.error)["match.team_b_id"]).toMatch(/different/);
  });
});

describe("contact and profile validation", () => {
  it("requires a real email and a message", () => {
    expect(contactInputSchema.safeParse({ name: "Al", email: "nope", message: "short" }).success).toBe(false);
    expect(contactInputSchema.safeParse({ name: "Al", email: "al@example.com", message: "A proper question here" }).success).toBe(true);
  });
  it("flags the honeypot", () => {
    expect(contactInputSchema.safeParse({ name: "Al", email: "al@example.com", message: "A proper question here", website: "spam" }).success).toBe(false);
  });
  it("only accepts http(s) social links", () => {
    const base = { display_name: "Astro", profile_image_path: null };
    expect(profileInputSchema.safeParse({ ...base, social_links: { youtube: "javascript:alert(1)" } }).success).toBe(false);
    expect(profileInputSchema.safeParse({ ...base, social_links: { youtube: "https://youtube.com/@x" } }).success).toBe(true);
  });
});

describe("list params", () => {
  it("falls back to defaults on junk input", () => {
    expect(parseListParams({ page: "-4", access: "vip", when: "tomorrow", from: "01/02/2026", category: "<script>" })).toMatchObject({
      page: 1, access: "", when: "upcoming", from: "", category: "",
    });
  });
  it("caps the page number", () => expect(parseListParams({ page: "9999" }).page).toBe(50));
  it("omits defaults from query strings", () => {
    expect(toQueryString({ q: "", page: 1, when: "upcoming", sort: "latest" })).toBe("");
    expect(toQueryString({ q: "heat", page: 2, when: "past" })).toBe("?q=heat&page=2&when=past");
  });
});
