import { describe, expect, it } from "vitest";
import { siteMenu } from "@/components/layout/nav";
import { ADMIN_SECTIONS, adminSlot, categoriesByMenu, sectionOfCategory } from "@/lib/admin-site";
import { SITE_CONTENT_DEFAULTS, siteContentSchemas } from "@/lib/site-content";
import type { Category } from "@/lib/types";
import { categories } from "../../seed/content";

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
