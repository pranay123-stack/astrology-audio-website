import { describe, expect, it } from "vitest";
import { hasFormat } from "@/lib/data/repository";
import { parseListParams } from "@/lib/list-params";
import { slugify } from "@/lib/slug";
import { transliterateDevanagari } from "@/lib/transliterate";

describe("Hindi titles → readable addresses", () => {
  it("spells Devanagari in Latin letters as Hindi is spoken", () => {
    // The real titles of the astrologer's planet videos.
    expect(slugify("सूर्य ग्रह: स्वभाव, उपाय और हर भाव में प्रभाव")).toBe("surya-grah-svabhav-upay-aur-har-bhav-men-prabhav");
    expect(slugify("शुक्र ग्रह: स्वभाव, उपाय और हर भाव में प्रभाव")).toBe("shukra-grah-svabhav-upay-aur-har-bhav-men-prabhav");
    expect(slugify("चंद्रमा ग्रह")).toBe("chandrama-grah");
    for (const [hi, en] of [
      ["ज्योतिष", "jyotish"],
      ["धर्म", "dharm"],
      ["इन्द्र", "indra"],
      ["सब लॉर्ड", "sab lord"],
      ["ज़िंदगी", "zindagi"],
      ["न", "na"],
      ["७ चक्र", "7 chakra"],
    ]) {
      expect(transliterateDevanagari(hi)).toBe(en);
    }
  });

  it("keeps English as before and mixes both", () => {
    expect(slugify("Saturn Transit & You")).toBe("saturn-transit-and-you");
    expect(slugify("KP पद्धति 2026")).toBe("kp-paddhati-2026");
  });

  it("cuts long titles at a word boundary", () => {
    const s = slugify("कुंडली ".repeat(20));
    expect(s.length).toBeLessThanOrEqual(80);
    expect(s.endsWith("kundali")).toBe(true);
  });
});

describe("post types (format filter)", () => {
  const base = {
    has_article: false,
    has_article_alt: false,
    audio_storage_path: null,
    audio_link: "",
    video_storage_path: null,
    video_link: "",
    video_format: "video" as const,
    pdf_storage_path: null,
    pdf_link: "",
  };
  it("classifies posts by what they contain; a post can be several types", () => {
    const both = { ...base, has_article: true, video_link: "https://youtu.be/dQw4w9WgXcQ" };
    expect(hasFormat(both, "article")).toBe(true);
    expect(hasFormat(both, "video")).toBe(true);
    expect(hasFormat(both, "reel")).toBe(false);
    expect(hasFormat({ ...base, video_storage_path: "video/x.mp4", video_format: "reel" }, "reel")).toBe(true);
    expect(hasFormat({ ...base, audio_link: "https://drive.google.com/file/d/x/view" }, "audio")).toBe(true);
    // The format alone (without any video) is not a video.
    expect(hasFormat({ ...base, video_format: "reel" }, "reel")).toBe(false);
    expect(hasFormat({ ...base, pdf_storage_path: "documents/x.pdf" }, "pdf")).toBe(true);
    expect(hasFormat({ ...base, pdf_link: "https://drive.google.com/file/d/x/view" }, "pdf")).toBe(true);
    expect(hasFormat(base, "pdf")).toBe(false);
  });

  it("reads ?format= from the address, ignoring anything unknown", () => {
    expect(parseListParams({ format: "reel" }).format).toBe("reel");
    expect(parseListParams({ format: "pdf" }).format).toBe("pdf");
    expect(parseListParams({ format: "podcast" }).format).toBe("");
    expect(parseListParams({}).format).toBe("");
  });
});

describe("errors after a new deployment", () => {
  it("recognises the errors an outdated tab gets, and nothing else", async () => {
    const { isStaleDeployError } = await import("@/lib/stale-deploy");
    const err = (name: string, message: string) => Object.assign(new Error(message), { name });
    expect(isStaleDeployError(err("ChunkLoadError", "Loading chunk 123 failed."))).toBe(true);
    expect(isStaleDeployError(err("TypeError", "Failed to fetch dynamically imported module: /_next/static/chunks/x.js"))).toBe(true);
    expect(isStaleDeployError(err("Error", 'Failed to find Server Action "abc". This request might be from an older or newer deployment.'))).toBe(true);
    expect(isStaleDeployError(err("Error", "Database unreachable"))).toBe(false);
  });
});

describe("Hindi first", () => {
  it("only treats browsers whose first language is Hindi as Hindi", async () => {
    const { prefersHindi } = await import("@/proxy");
    expect(prefersHindi("hi-IN,hi;q=0.9,en-US;q=0.8")).toBe(true);
    expect(prefersHindi("hi")).toBe(true);
    expect(prefersHindi("en-IN,en;q=0.9,hi;q=0.8")).toBe(false);
    expect(prefersHindi("")).toBe(false);
    expect(prefersHindi(null)).toBe(false);
  });
});

describe("PDF uploads", () => {
  it("accepts only real PDF files", async () => {
    const { contentMatchesExtension, sniffFileType } = await import("@/lib/media/file-types");
    const pdf = new TextEncoder().encode("%PDF-1.7\n%âãÏÓ\n1 0 obj");
    expect(sniffFileType(pdf)).toBe("pdf");
    expect(contentMatchesExtension(pdf, "pdf")).toBe(true);
    expect(contentMatchesExtension(new TextEncoder().encode("<html><body>not a pdf</body>"), "pdf")).toBe(false);
  });
});

describe("site menu", () => {
  it("follows the astrologer's layout and links YouTube only when it is set", async () => {
    const { siteMenu } = await import("@/components/layout/nav");
    const menu = siteMenu({ showPremium: false });
    expect(menu.map((m) => m.key)).toEqual(["home", "astrology", "astroCricket", "book", "research", "kpChart", "contact", "rules", "testimonials", "futureResearch", "krishna"]);
    const cricket = menu.find((m) => m.key === "astroCricket")!;
    expect(cricket.children!.map((c) => c.key)).toEqual(["podcast", "oldVideos"]);
    const withYoutube = siteMenu({ showPremium: true, youtube: "https://www.youtube.com/@ASTROCRICKET" });
    expect(withYoutube.find((m) => m.key === "astroCricket")!.children!.at(-1)).toMatchObject({ key: "youtube", external: true });
    expect(withYoutube.map((m) => m.key)).toContain("premium");
    const research = menu.find((m) => m.key === "research")!;
    expect(research.children![0].children!.map((c) => c.href)).toEqual([
      "/horoscope-research/matches?competition=bbl",
      "/horoscope-research/matches?competition=ipl",
      "/horoscope-research/matches?competition=t20i",
    ]);
  });
});
