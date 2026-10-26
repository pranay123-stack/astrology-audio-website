import { describe, expect, it } from "vitest";
import { formatDurationLabel } from "@/lib/dates";
import { episodeHref, lengthLabel, premiumContactHref } from "@/lib/episodes";
import { getDict, localePath, localizeCategory, localizeEpisode, localizeProfile, splitLocale } from "@/lib/i18n";
import { en } from "@/lib/i18n/en";
import { hi } from "@/lib/i18n/hi";
import type { EpisodeListing, Profile } from "@/lib/types";

function post(over: Partial<EpisodeListing> = {}): EpisodeListing {
  return {
    id: "e1",
    title: "बुध",
    slug: "budh",
    excerpt: "बुध ग्रह का विश्लेषण",
    description: "",
    has_article: true,
    article_lang: "hi",
    title_alt: "",
    excerpt_alt: "",
    description_alt: "",
    has_article_alt: false,
    category_id: "c1",
    audio_storage_path: null,
    audio_mime_type: null,
    cover_image_path: null,
    video_storage_path: null,
    video_mime_type: null,
    video_format: "video",
    video_link: "",
    audio_link: "",
    gallery_paths: [],
    duration_seconds: 0,
    is_published: true,
    is_premium: false,
    is_demo: false,
    play_count: 0,
    published_at: "2026-10-17T00:00:00Z",
    created_at: "2026-10-17T00:00:00Z",
    updated_at: "2026-10-17T00:00:00Z",
    article: "## बुध\n\nहिंदी लेख",
    article_alt: "",
    category: { id: "c1", name: "Planets (Grahas)", name_hi: "ग्रह", slug: "planets-grahas", section: "general" },
    match: null,
    ...over,
  };
}

describe("locale paths", () => {
  it("keeps English at plain URLs and prefixes Hindi with /hi", () => {
    expect(localePath("en", "/contact")).toBe("/contact");
    expect(localePath("hi", "/contact")).toBe("/hi/contact");
    expect(localePath("hi", "/")).toBe("/hi");
    expect(localePath("hi", "/contact?subject=x")).toBe("/hi/contact?subject=x");
  });

  it("splits a public pathname into language and path", () => {
    expect(splitLocale("/")).toEqual({ lang: "en", path: "/" });
    expect(splitLocale("/hi")).toEqual({ lang: "hi", path: "/" });
    expect(splitLocale("/hi/astrology-audios/budh")).toEqual({ lang: "hi", path: "/astrology-audios/budh" });
    // A page that merely starts with "hi" is not Hindi.
    expect(splitLocale("/history")).toEqual({ lang: "en", path: "/history" });
  });

  it("builds language-aware episode and premium links", () => {
    expect(episodeHref(post(), "hi")).toBe("/hi/astrology-audios/budh");
    expect(episodeHref(post())).toBe("/astrology-audios/budh");
    expect(premiumContactHref("बुध", "hi")).toBe(`/hi/contact?subject=${encodeURIComponent("प्रीमियम पैकेज: बुध")}`);
  });
});

describe("dictionaries", () => {
  it("Hindi provides every English key", () => {
    const keys = (o: object, prefix = ""): string[] =>
      Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`]));
    expect(keys(hi).sort()).toEqual(keys(en).sort());
  });

  it("formats lengths in the page language", () => {
    expect(formatDurationLabel(48, "hi")).toBe("48 सेकंड");
    expect(formatDurationLabel(3900, "en")).toBe("1 hr 5 min");
    expect(lengthLabel(post(), "hi")).toBe("1 मिनट का पाठ");
    expect(getDict("hi").common.showing(3, 9)).toBe("9 में से 3 दिखाए जा रहे हैं");
  });
});

describe("localizeEpisode", () => {
  it("shows a Hindi-only post unchanged on the English site, marked as Hindi text", () => {
    const e = localizeEpisode(post(), "en");
    expect(e.title).toBe("बुध");
    expect(e.text_lang).toBe("hi");
    expect(e.article_lang).toBe("hi");
    expect(e.category.name).toBe("Planets (Grahas)");
  });

  it("uses the Hindi category name on the Hindi site", () => {
    expect(localizeEpisode(post(), "hi").category.name).toBe("ग्रह");
  });

  it("swaps in the translation when it matches the visitor's language", () => {
    const e = localizeEpisode(
      post({ title_alt: "Mercury", excerpt_alt: "", has_article_alt: true, article_alt: "English article" }),
      "en",
    );
    expect(e.title).toBe("Mercury");
    expect(e.excerpt).toBe("बुध ग्रह का विश्लेषण"); // empty translated summary falls back
    expect(e.text_lang).toBe("en");
    expect(e.article).toBe("English article");
    expect(e.article_lang).toBe("en");
  });

  it("keeps the main text for visitors of the main language", () => {
    const e = localizeEpisode(post({ title_alt: "Mercury", has_article_alt: true, article_alt: "English article" }), "hi");
    expect(e.title).toBe("बुध");
    expect(e.article).toBe("## बुध\n\nहिंदी लेख");
  });

  it("shows whichever article exists when only the other language has one", () => {
    const e = localizeEpisode(post({ has_article: false, article: "", has_article_alt: true, article_alt: "Only English" }), "hi");
    expect(e.has_article).toBe(true);
    expect(e.article).toBe("Only English");
    expect(e.article_lang).toBe("en");
  });

  it("keeps premium articles locked in either language", () => {
    const e = localizeEpisode(post({ is_premium: true, article: "", has_article_alt: true, article_alt: "", title_alt: "Mercury" }), "en");
    expect(e.has_article).toBe(true);
    expect(e.article).toBe("");
  });
});

describe("localizeCategory / localizeProfile", () => {
  it("falls back to English when a Hindi field is empty", () => {
    const c = { name: "Daily Astrology", name_hi: "", description: "Daily", description_hi: "" };
    expect(localizeCategory(c, "hi").name).toBe("Daily Astrology");
    expect(localizeCategory({ ...c, name_hi: "दैनिक ज्योतिष" }, "hi").name).toBe("दैनिक ज्योतिष");
  });

  it("overrides only the filled-in Hindi profile fields", () => {
    const p = {
      display_name: "Astro Cricket Amit",
      tagline: "English tagline",
      biography: "English bio",
      experience: "",
      specializations: ["Vedic astrology"],
      location: "",
      consultation_info: "",
      hi: { tagline: "हिंदी टैगलाइन", biography: "  ", specializations: [] },
    } as unknown as Profile;
    const h = localizeProfile(p, "hi");
    expect(h.tagline).toBe("हिंदी टैगलाइन");
    expect(h.biography).toBe("English bio");
    expect(h.display_name).toBe("Astro Cricket Amit");
    expect(h.specializations).toEqual(["Vedic astrology"]);
    expect(localizeProfile(p, "en").tagline).toBe("English tagline");
  });
});
