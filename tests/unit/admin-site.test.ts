import { describe, expect, it } from "vitest";
import { siteMenu } from "@/components/layout/nav";
import { ADMIN_SECTIONS, adminSlot, categoriesByMenu, sectionOfCategory } from "@/lib/admin-site";
import { SITE_CONTENT_DEFAULTS, siteContentSchemas } from "@/lib/site-content";
import type { Category } from "@/lib/types";
import { categories, competitions } from "../../seed/content";

describe("admin follows the website menu", () => {
  it("has one section per menu item, in menu order", () => {
    const menu = siteMenu({ showPremium: false }).map((m) => m.key);
    expect(ADMIN_SECTIONS.map((s) => s.key)).toEqual(menu);
  });

  it("every Add button files its post under a category that exists", () => {
    const slugs = new Set(categories.map((c) => c.slug));
    for (const section of ADMIN_SECTIONS) for (const slot of section.slots) expect(slugs, slot.id).toContain(slot.add.category);
  });

  it("slot ids are unique, so an Add link opens the right place", () => {
    const ids = ADMIN_SECTIONS.flatMap((s) => s.slots.map((slot) => slot.id));
    expect(new Set(ids).size).toBe(ids.length);
    expect(adminSlot("book-pdf-hindi")).toMatchObject({ add: { category: "book-hindi", fields: ["pdf"], lang: "hi" }, section: { key: "book" } });
  });

  it("Prediction Records holds match audio by competition, men and women; Testimonials each league's message proof", () => {
    const slots = (key: string) => ADMIN_SECTIONS.find((s) => s.key === key)!.slots.map((s) => s.id);
    expect(slots("predictionRecords")).toEqual(["bbl", "ipl", "t20", "odi"].flatMap((id) => [`predictions-${id}-men`, `predictions-${id}-women`]));
    expect(slots("research").slice(0, 8)).toEqual(["bbl", "ipl", "t20", "odi"].flatMap((id) => [`matches-${id}-men`, `matches-${id}-women`]));
    expect(adminSlot("matches-odi-women")).toMatchObject({ add: { category: "cricket-astrology", competition: "wodi" }, query: { competitionSlug: "wodi" } });
    expect(slots("testimonials")).toEqual(["bbl", "ipl", "t20", "odi"].flatMap((id) => [`testimonials-${id}-men`, `testimonials-${id}-women`]));
    expect(adminSlot("predictions-ipl-women")).toMatchObject({ add: { category: "prediction-records", fields: ["audio"], competition: "wpl" }, query: { competitionSlug: "wpl" } });
    expect(adminSlot("testimonials-ipl-men")).toMatchObject({ add: { category: "testimonial-messages-ipl", fields: ["photos"] } });
    expect(adminSlot("testimonials-odi-women")).toMatchObject({ add: { category: "testimonial-messages-wodi", fields: ["photos"] } });
    const menu = siteMenu({ showPremium: false });
    expect(menu.find((m) => m.key === "testimonials")!.children![0].children![1].children!.map((g) => g.href)).toEqual(["/testimonials#ipl-men", "/testimonials#ipl-women"]);
    expect(menu.find((m) => m.key === "predictionRecords")!.children![0].children![3].children!.map((g) => g.href)).toEqual(["/prediction-records#odi-men", "/prediction-records#odi-women"]);
  });

  it("Latest Matches has a men's and a women's place for BBL, IPL, T20 and ODI, each its own competition", () => {
    const slots = ADMIN_SECTIONS.find((s) => s.key === "latestMatches")!.slots;
    expect(slots.map((s) => s.id)).toEqual(["bbl", "ipl", "t20", "odi"].flatMap((id) => [`latest-${id}-men`, `latest-${id}-women`]));
    expect(slots.map((s) => s.add.competition)).toEqual(["bbl", "wbbl", "ipl", "wpl", "t20i", "wt20i", "odi", "wodi"]);
    const known = new Set(competitions.map((c) => c.slug));
    for (const slot of slots) {
      expect(known, slot.id).toContain(slot.add.competition);
      expect(slot.query).toMatchObject({ categorySlug: "latest-matches", competitionSlug: slot.add.competition });
    }
    const cricket = siteMenu({ showPremium: false }).find((m) => m.key === "latestMatches")!.children![0];
    expect(cricket.key).toBe("matches");
    expect(cricket.children!.map((c) => [c.key, c.children!.map((g) => g.href)])).toEqual([
      ["seriesBbl", ["/latest-matches#bbl-men", "/latest-matches#bbl-women"]],
      ["ipl", ["/latest-matches#ipl-men", "/latest-matches#ipl-women"]],
      ["seriesT20", ["/latest-matches#t20-men", "/latest-matches#t20-women"]],
      ["seriesOdi", ["/latest-matches#odi-men", "/latest-matches#odi-women"]],
    ]);
  });

  it("a category with posts on a menu page is grouped under that menu item", () => {
    expect(sectionOfCategory("book-english")?.key).toBe("book");
    expect(sectionOfCategory("spirituality-and-meditation")?.key).toBe("astrology");
    const cats = [{ slug: "share-market", name: "Share" }, { slug: "nowhere", name: "Lost" }] as Category[];
    expect(categoriesByMenu(cats).map((g) => g.label)).toEqual([ADMIN_SECTIONS.find((s) => s.key === "futureResearch")!.title, "Other"]);
  });
});

describe("page text", () => {
  it("the bundled text passes the checks applied when saving", () => {
    for (const key of ["rules", "krishna", "quotes"] as const) {
      expect(siteContentSchemas[key].safeParse(SITE_CONTENT_DEFAULTS[key]).success, key).toBe(true);
    }
  });

  it("rejects an empty rule", () => {
    const { spiritual, cricket, shani } = SITE_CONTENT_DEFAULTS.rules;
    expect(siteContentSchemas.rules.safeParse({ spiritual: [...spiritual, { title: " " }], cricket, shani }).success).toBe(false);
  });
});
