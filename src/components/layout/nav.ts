import type { Dict } from "@/lib/i18n";

/** Main navigation: paths are language-free; labels come from the dictionary. */
export const NAV_LINKS = [
  { href: "/", key: "home" },
  { href: "/astrology-audios", key: "general" },
  { href: "/cricket-astrology", key: "cricket" },
  // Shown only while at least one premium post is published, so visitors never land on an empty page.
  { href: "/premium", key: "premium", premiumOnly: true },
  { href: "/kp-chart", key: "kp" },
  { href: "/about", key: "about" },
  { href: "/contact", key: "contact" },
] as const satisfies readonly { href: string; key: keyof Dict["nav"]; premiumOnly?: boolean }[];

export type NavLink = (typeof NAV_LINKS)[number];

export function navLinks(showPremium: boolean): readonly NavLink[] {
  return NAV_LINKS.filter((l) => showPremium || !("premiumOnly" in l));
}

/**
 * "Learn Cricket Astrology": the contact page with the subject filled in, scrolled to the
 * questionnaire (the Google Form) when one is set up. `subject` is the localised subject line.
 */
export function learnPath(subject: string): string {
  return `/contact?subject=${encodeURIComponent(subject)}#questionnaire`;
}
