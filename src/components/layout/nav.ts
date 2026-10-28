import type { Dict } from "@/lib/i18n";

/** One menu entry: paths are language-free (`external` links are absolute); labels come from the dictionary. */
export interface MenuNode {
  key: keyof Dict["menu"];
  href: string;
  external?: boolean;
  children?: MenuNode[];
  /** Older pages that belong to this top-level item, so it shows as the current one there. */
  also?: string[];
}

/**
 * The site menu, as the astrologer laid it out: Astrology, Astro Cricket, Book, Horoscope
 * Research, Make Your KP Chart, Contact. Premium appears only while a premium post is published,
 * so visitors never land on an empty page; YouTube only when the channel link is set.
 */
export function siteMenu({ showPremium, youtube }: { showPremium: boolean; youtube?: string }): MenuNode[] {
  const menu: MenuNode[] = [
    {
      key: "astrology",
      href: "/astrology",
      also: ["/astrology-audios"],
      children: [
        {
          key: "planetsBhav",
          href: "/astrology/planets-bhav",
          children: [
            { key: "video", href: "/astrology/planets-bhav?format=video" },
            { key: "audio", href: "/astrology/planets-bhav?format=audio" },
            { key: "read", href: "/astrology/planets-bhav?format=article" },
          ],
        },
        { key: "kpAstrology", href: "/astrology/kp-research", children: [{ key: "kpResearch", href: "/astrology/kp-research" }] },
      ],
    },
    {
      key: "astroCricket",
      href: "/astro-cricket",
      children: [
        { key: "podcast", href: "/astro-cricket/videos" },
        { key: "oldVideos", href: "/astro-cricket/old-videos" },
        ...(youtube ? [{ key: "youtube" as const, href: youtube, external: true }] : []),
      ],
    },
    {
      key: "book",
      href: "/book",
      children: [
        { key: "audioHi", href: "/book#audio-hindi" },
        { key: "audioEn", href: "/book#audio-english" },
        { key: "pdfHi", href: "/book#pdf-hindi" },
        { key: "pdfEn", href: "/book#pdf-english" },
      ],
    },
    {
      key: "research",
      href: "/horoscope-research",
      also: ["/cricket-astrology"],
      children: [
        {
          key: "matches",
          href: "/horoscope-research/matches",
          children: [
            { key: "bbl", href: "/horoscope-research/matches?competition=bbl" },
            { key: "ipl", href: "/horoscope-research/matches?competition=ipl" },
            { key: "t20i", href: "/horoscope-research/matches?competition=t20i" },
          ],
        },
        { key: "players", href: "/horoscope-research/players" },
      ],
    },
    { key: "kpChart", href: "/kp-chart" },
    { key: "contact", href: "/contact" },
  ];
  if (showPremium) menu.splice(4, 0, { key: "premium", href: "/premium" });
  return menu;
}

/**
 * "Learn Cricket Astrology": the contact page with the subject filled in, scrolled to the
 * questionnaire (the Google Form) when one is set up. `subject` is the localised subject line.
 */
export function learnPath(subject: string): string {
  return `/contact?subject=${encodeURIComponent(subject)}#questionnaire`;
}
