import { describe, expect, it } from "vitest";
import { decideAudioAccess } from "@/lib/access";
import { dayBounds, formatDuration, fromZonedInputValue, toZonedInputValue, zonedTimeToUtc } from "@/lib/dates";
import { slugify, uniqueSlug } from "@/lib/slug";

const NOW = Date.parse("2026-10-09T00:00:00Z");
const base = { is_published: true, published_at: "2026-10-01T00:00:00Z", is_premium: false, audio_storage_path: "audio/x.mp3" };
const visitor = { isAdmin: false, hasPremiumAccess: false };
const admin = { isAdmin: true, hasPremiumAccess: false };

describe("decideAudioAccess", () => {
  it("allows free published audio", () => {
    expect(decideAudioAccess(base, visitor, false, NOW)).toEqual({ allowed: true });
  });
  it("hides drafts and scheduled episodes from visitors as 404", () => {
    expect(decideAudioAccess({ ...base, is_published: false }, visitor, false, NOW)).toMatchObject({ allowed: false, status: 404 });
    expect(decideAudioAccess({ ...base, published_at: "2026-12-01T00:00:00Z" }, visitor, false, NOW)).toMatchObject({ status: 404 });
  });
  it("lets admins preview drafts", () => {
    expect(decideAudioAccess({ ...base, is_published: false }, admin, false, NOW)).toEqual({ allowed: true });
  });
  it("refuses premium audio while the premium module is disabled", () => {
    expect(decideAudioAccess({ ...base, is_premium: true }, visitor, false, NOW)).toMatchObject({ allowed: false, status: 403 });
    // Even a viewer flagged as entitled is refused while payments are off.
    expect(decideAudioAccess({ ...base, is_premium: true }, { isAdmin: false, hasPremiumAccess: true }, false, NOW)).toMatchObject({ status: 403 });
  });
  it("requires an entitlement once premium is enabled", () => {
    expect(decideAudioAccess({ ...base, is_premium: true }, visitor, true, NOW)).toMatchObject({ status: 403 });
    expect(decideAudioAccess({ ...base, is_premium: true }, { isAdmin: false, hasPremiumAccess: true }, true, NOW)).toEqual({ allowed: true });
  });
  it("returns 404 when no audio is attached or the episode is missing", () => {
    expect(decideAudioAccess({ ...base, audio_storage_path: null }, visitor, false, NOW)).toMatchObject({ status: 404 });
    expect(decideAudioAccess(null, admin, false, NOW)).toMatchObject({ status: 404 });
  });
});

describe("timezone helpers (Australia/Sydney)", () => {
  it("converts wall-clock time across the DST change", () => {
    // AEST (UTC+10) before 5 Oct 2026, AEDT (UTC+11) after.
    expect(new Date(zonedTimeToUtc(2026, 9, 1, 19, 0)).toISOString()).toBe("2026-09-01T09:00:00.000Z");
    expect(new Date(zonedTimeToUtc(2026, 10, 11, 19, 0)).toISOString()).toBe("2026-10-11T08:00:00.000Z");
  });
  it("computes local day bounds", () => {
    const b = dayBounds("2026-10-11")!;
    expect(new Date(b.start).toISOString()).toBe("2026-10-10T13:00:00.000Z");
    expect(new Date(b.end).toISOString()).toBe("2026-10-11T12:59:59.999Z");
    expect(dayBounds("not-a-date")).toBeNull();
  });
  it("round-trips datetime-local values", () => {
    const iso = fromZonedInputValue("2026-12-20T19:30");
    expect(iso).toBe("2026-12-20T08:30:00.000Z");
    expect(toZonedInputValue(iso)).toBe("2026-12-20T19:30");
  });
  it("formats durations", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(77)).toBe("1:17");
    expect(formatDuration(3725)).toBe("1:02:05");
    expect(formatDuration(Number.NaN)).toBe("0:00");
  });
});

describe("slugs", () => {
  it("slugifies titles", () => {
    expect(slugify("BBL Match Astrology Prediction — Team A vs Team B")).toBe("bbl-match-astrology-prediction-team-a-vs-team-b");
    expect(slugify("Saturn & Jupiter: Ārdrā!")).toBe("saturn-and-jupiter-ardra");
  });
  it("makes slugs unique", () => {
    expect(uniqueSlug("a", new Set())).toBe("a");
    expect(uniqueSlug("a", new Set(["a", "a-2"]))).toBe("a-3");
  });
});

describe("launch checklist", async () => {
  const { createHash } = await import("node:crypto");
  const { PLACEHOLDER_PROFILE_IMAGE, launchChecks } = await import("@/lib/launch-checks");
  const seedContent = await import("../../seed/content");

  it("knows the seed's placeholder portrait path", () => {
    const h = createHash("sha256").update("placeholder-profile").digest("hex");
    const id = `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
    expect(PLACEHOLDER_PROFILE_IMAGE).toBe(`profile/${id}.webp`);
  });

  it("flags every seeded placeholder and passes once real details exist", () => {
    const stats = { total: 12, published: 12, drafts: 0, scheduled: 0, premium: 2, demo: 12, unreadMessages: 0, byCategory: [] };
    const seeded = { id: "p", updated_at: "", ...seedContent.profile, profile_image_path: PLACEHOLDER_PROFILE_IMAGE };
    const pending = launchChecks(seeded, stats).filter((c) => !c.done).map((c) => c.id);
    expect(pending).toEqual(["name", "photo", "bio", "consult", "contact", "legal", "demo", "episodes", "url"]);

    const real = {
      ...seeded,
      display_name: "Real Name",
      profile_image_path: "profile/0f8fad5b-d9cb-469f-a165-70867728950e.jpg",
      biography: "A real introduction.",
      experience: "Real experience.",
      consultation_info: "How it works.",
      contact_email: "hello@example.com",
      legal_business_name: "Real Astro",
      legal_jurisdiction: "NSW, Australia",
    };
    const done = launchChecks(real, { ...stats, demo: 0, published: 3 }).filter((c) => c.done).map((c) => c.id);
    expect(done).toEqual(["name", "photo", "bio", "consult", "contact", "legal", "demo", "episodes", "brand"]);
  });
});
