import {
  BookOpen,
  CalendarClock,
  ClipboardList,
  Compass,
  Crown,
  Flower2,
  MessageSquareQuote,
  Moon,
  Orbit,
  Radio,
  ScrollText,
  Sparkles,
  Telescope,
  Video,
  type LucideIcon,
} from "lucide-react";
import { createElement } from "react";
import type { Dict } from "@/lib/i18n";
import type { MenuNode } from "./nav";

type MenuKey = keyof Dict["menu"];

/** The header's four dropdowns; Home and Contact stay plain links either side of them. */
export const NAV_GROUPS = ["matches", "learn", "research", "tools"] as const;
export type NavGroupKey = (typeof NAV_GROUPS)[number];

/**
 * Which menu item goes in which dropdown. The menu itself (siteMenu) keeps the astrologer's 15 items in
 * his order; the header only groups them, so Admin, the footer and every page link stay as they are.
 */
const GROUP_OF: Partial<Record<MenuKey, NavGroupKey>> = {
  latestMatches: "matches",
  predictionRecords: "matches",
  testimonials: "matches",
  astrology: "learn",
  astroCricket: "learn",
  book: "learn",
  rules: "learn",
  premium: "learn",
  krishna: "learn",
  research: "research",
  futureResearch: "research",
  kpChart: "tools",
  nakshatraDasha: "tools",
};

/** Shortcuts shown in a dropdown besides its own items: Fixing (under Horoscope Research) is also a match page. */
const SHORTCUTS: Partial<Record<NavGroupKey, MenuNode[]>> = {
  matches: [{ key: "fixing", href: "/horoscope-research/fixing" }],
};

export type NavEntry = { kind: "link"; node: MenuNode } | { kind: "group"; key: NavGroupKey; items: MenuNode[] };

/**
 * Home, Matches, Learn, Research, Free Tools, Contact. A menu item not listed in GROUP_OF goes under Learn,
 * so a page added to the menu later is never missing from the header.
 */
export function groupMenu(menu: MenuNode[]): NavEntry[] {
  const groups = new Map<NavGroupKey, MenuNode[]>(NAV_GROUPS.map((g) => [g, []]));
  let home: MenuNode | undefined;
  let contact: MenuNode | undefined;
  for (const node of menu) {
    if (node.key === "home") home = node;
    else if (node.key === "contact") contact = node;
    else groups.get(GROUP_OF[node.key] ?? "learn")!.push(node);
  }
  for (const [g, extra] of Object.entries(SHORTCUTS) as [NavGroupKey, MenuNode[]][]) groups.get(g)!.push(...extra);
  return [
    ...(home ? [{ kind: "link" as const, node: home }] : []),
    ...NAV_GROUPS.map((key) => ({ kind: "group" as const, key, items: groups.get(key)! })),
    ...(contact ? [{ kind: "link" as const, node: contact }] : []),
  ];
}

/**
 * Quick links under an item: its sub-pages, with a "Cricket Matches" level replaced by its competitions
 * (BBL, IPL, T20, ODI), which is what a visitor is looking for.
 */
export function quickLinks(node: MenuNode): MenuNode[] {
  return (node.children ?? []).flatMap((c) => (c.key === "matches" && c.children ? c.children : [c]));
}

/** An icon for every page in the menu. */
export const MENU_ICONS: Partial<Record<MenuKey, LucideIcon>> = {
  latestMatches: Radio,
  predictionRecords: ClipboardList,
  testimonials: MessageSquareQuote,
  fixing: Orbit,
  astrology: Sparkles,
  astroCricket: Video,
  book: BookOpen,
  rules: ScrollText,
  premium: Crown,
  krishna: Flower2,
  research: Telescope,
  futureResearch: CalendarClock,
  kpChart: Compass,
  nakshatraDasha: Moon,
};

export const iconFor = (key: MenuKey): LucideIcon => MENU_ICONS[key] ?? Sparkles;

/** A menu page's icon as an element (works in server and client components). */
export const menuIcon = (key: MenuKey, className: string) => createElement(iconFor(key), { className, "aria-hidden": true });
