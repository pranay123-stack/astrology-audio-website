import { describe, expect, it } from "vitest";
import { siteMenu } from "@/components/layout/nav";
import { groupMenu, MENU_ICONS, quickLinks } from "@/components/layout/navGroups";
import { getDict } from "@/lib/i18n";

describe("grouped header menu", () => {
  const menu = siteMenu({ showPremium: true, youtube: "https://youtube.com/@x" });
  const entries = groupMenu(menu);

  it("is Home, Matches, Learn, Research, Free Tools, Contact", () => {
    expect(entries.map((e) => (e.kind === "link" ? e.node.key : e.key))).toEqual(["home", "matches", "learn", "research", "tools", "contact"]);
  });

  it("holds every page of the astrologer's menu exactly once (plus the Fixing shortcut)", () => {
    const shown = entries.flatMap((e) => (e.kind === "link" ? [e.node.key] : e.items.map((n) => n.key)));
    expect(shown.filter((k) => k !== "fixing").sort()).toEqual(menu.map((m) => m.key).sort());
    expect(new Set(shown).size).toBe(shown.length);
    const group = (k: string) => entries.find((e) => e.kind === "group" && e.key === k)!;
    expect(group("matches")).toMatchObject({ items: [{ key: "latestMatches" }, { key: "predictionRecords" }, { key: "testimonials" }, { key: "fixing", href: "/horoscope-research/fixing" }] });
    expect(group("tools")).toMatchObject({ items: [{ key: "kpChart" }, { key: "nakshatraDasha" }] });
  });

  it("puts a menu item it does not know under Learn, so nothing goes missing", () => {
    const withNew = groupMenu([...menu, { key: "about", href: "/about" }]);
    const learn = withNew.find((e) => e.kind === "group" && e.key === "learn");
    expect(learn && learn.kind === "group" && learn.items.at(-1)).toMatchObject({ key: "about" });
  });

  it("gives every grouped page an icon and a line in English and Hindi", () => {
    for (const e of entries) {
      if (e.kind !== "group") continue;
      for (const n of e.items) {
        expect(MENU_ICONS[n.key], n.key).toBeDefined();
        for (const lang of ["en", "hi"] as const) expect((getDict(lang).nav.desc as Record<string, string>)[n.key], `${lang} ${n.key}`).toBeTruthy();
      }
    }
  });

  it("offers a page's competitions as quick links instead of a 'Cricket Matches' level", () => {
    const latest = menu.find((m) => m.key === "latestMatches")!;
    expect(quickLinks(latest).map((n) => n.href)).toEqual(["/latest-matches#bbl", "/latest-matches#ipl", "/latest-matches#t20", "/latest-matches#odi", "/latest-matches#course-teaching"]);
  });
});
