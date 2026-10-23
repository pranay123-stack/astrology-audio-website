import type { Dict } from "@/lib/i18n";

/** Main navigation: paths are language-free; labels come from the dictionary. */
export const NAV_LINKS = [
  { href: "/", key: "home" },
  { href: "/astrology-audios", key: "general" },
  { href: "/cricket-astrology", key: "cricket" },
  { href: "/premium", key: "premium" },
  { href: "/kp-chart", key: "kp" },
  { href: "/about", key: "about" },
  { href: "/contact", key: "contact" },
] as const satisfies readonly { href: string; key: keyof Dict["nav"] }[];
