import { getDict } from "@/lib/i18n";
import { BOOK_PARTS, FUTURE_TOPICS, LEAGUES, MATCH_COMPETITIONS, messagesQuery, predictionQuery, TOPICS } from "@/lib/topics";
import type { Category, EpisodeQuery } from "@/lib/types";
import type { SiteContentKey } from "@/lib/site-content";

/** Which parts of the post form a place on the website uses. */
export type PostField = "article" | "audio" | "video" | "photos" | "pdf";

/** One place on the website that lists posts, with what its Add button sets up. */
export interface AdminSlot {
  id: string;
  title: string;
  /** Public page, language-free. */
  page: string;
  hint: string;
  query: EpisodeQuery;
  add: {
    category: string;
    fields: PostField[];
    lang?: "hi" | "en";
    archived?: boolean;
    competition?: string;
  };
}

/** A link to an admin page that holds this menu item's other content. */
export interface AdminLink {
  href: string;
  label: string;
  hint: string;
}

/** One item of the website menu, as Admin shows it. */
export interface AdminSection {
  /** The siteMenu() key this mirrors. */
  key: keyof ReturnType<typeof getDict>["menu"];
  title: string;
  page: string;
  intro: string;
  slots: AdminSlot[];
  /** Page text edited right on this section's page. */
  editor?: SiteContentKey;
  links?: AdminLink[];
}

const m = getDict("en").menu;
const PROFILE = "/admin/profile";

/** Categories that are on the website only through "Other astrology posts". */
const OTHER_ASTROLOGY = ["spirituality-and-meditation", "vedic-astrology", "daily-astrology", "horoscope-insights", "planetary-transits", "zodiac-sign-guidance"];

const planetSlot = (format: "video" | "audio" | "article", title: string, fields: PostField[]): AdminSlot => ({
  id: `planets-${format}`,
  title: `${m.planetsBhav} › ${title}`,
  page: `/astrology/planets-bhav?format=${format}`,
  hint: `Shown on the ${title} tab.`,
  query: { ...TOPICS.planetsBhav, format },
  add: { category: "planets-grahas", fields },
});

const bookField = { audio: ["audio"], pdf: ["pdf"] } as const;

/**
 * The website menu, for Admin: the same order and names as siteMenu(), each item saying where its
 * content comes from, so the astrologer never needs to know the category behind a page.
 * tests/unit/admin-site.test.ts fails if the menu gains an item that is missing here.
 */
export const ADMIN_SECTIONS: AdminSection[] = [
  {
    key: "home",
    title: m.home,
    page: "/",
    intro: "The home page fills itself: it shows your newest posts, reels and categories. Here you change the quote at the top.",
    slots: [],
    editor: "quotes",
    links: [{ href: PROFILE, label: "Your photo, name and tagline", hint: "Shown on the home page and on About." }],
  },
  {
    key: "astrology",
    title: m.astrology,
    page: "/astrology",
    intro: "12 Planets & 12 Bhav, KP Astrology and other astrology posts.",
    slots: [
      planetSlot("video", m.video, ["video"]),
      planetSlot("audio", m.audio, ["audio"]),
      planetSlot("article", m.read, ["article"]),
      {
        id: "kp-research",
        title: `${m.kpAstrology} › ${m.kpResearch}`,
        page: "/astrology/kp-research",
        hint: "A KP reading of a match. It needs the teams and the match date.",
        query: TOPICS.kpResearch,
        add: { category: "kp-research", fields: ["article", "audio", "video"] },
      },
      {
        id: "kp-guide",
        title: `${m.kpAstrology} › Cricket astrology guide`,
        page: "/astrology/kp-research",
        hint: "Lessons on how the KP method reads a match.",
        query: TOPICS.kpGuide,
        add: { category: "cricket-astrology-guide", fields: ["article", "audio", "video"] },
      },
      {
        id: "other-astrology",
        title: "Other astrology posts",
        page: "/astrology-audios",
        hint: "Spirituality, daily astrology, transits and similar. Choose the category in the form.",
        query: { categorySlugs: OTHER_ASTROLOGY },
        add: { category: OTHER_ASTROLOGY[0], fields: ["article", "audio", "video"] },
      },
    ],
  },
  {
    key: "astroCricket",
    title: m.astroCricket,
    page: "/astro-cricket",
    intro: "Your cricket videos and reels. Upload a short clip or paste a YouTube or Instagram link.",
    slots: [
      {
        id: "cricket-videos",
        title: m.podcast,
        page: "/astro-cricket/videos",
        hint: "Current videos and reels.",
        query: TOPICS.podcast,
        add: { category: "cricket-podcast", fields: ["video"] },
      },
      {
        id: "old-videos",
        title: m.oldVideos,
        page: "/astro-cricket/old-videos",
        hint: "Any video with “Old video” ticked moves here.",
        query: TOPICS.oldVideos,
        add: { category: "cricket-podcast", fields: ["video"], archived: true },
      },
    ],
    links: [{ href: PROFILE, label: "YouTube channel link", hint: "The YouTube menu item appears once this is set (Profile › Social media)." }],
  },
  {
    key: "book",
    title: m.book,
    page: "/book",
    intro: "The book as audio and as a free PDF, in Hindi and English.",
    slots: BOOK_PARTS.map((part) => ({
      id: `book-${part.id}`,
      title: m[part.key],
      page: `/book#${part.id}`,
      hint: part.format === "audio" ? "Upload a file, or paste a Google Drive link for long audio." : "Visitors read and download it free. Up to 50 MB, or a Google Drive link.",
      query: { ...part.query, format: part.format },
      add: { category: part.query.categorySlug, fields: [...bookField[part.format]], lang: part.id.endsWith("hindi") ? "hi" : "en" },
    })),
  },
  {
    key: "research",
    title: m.research,
    page: "/horoscope-research",
    intro: "Match readings by competition, and player horoscopes.",
    slots: [
      ...MATCH_COMPETITIONS.map((c) => ({
        id: `matches-${c}`,
        title: `${m.matches} › ${m[c]}`,
        page: `/horoscope-research/matches?competition=${c}`,
        hint: "Needs the two teams and the match date.",
        query: { ...TOPICS.matches, competitionSlug: c },
        add: { category: TOPICS.matches.categorySlug, fields: ["article", "audio", "video"] as PostField[], competition: c },
      })),
      {
        id: "players",
        title: m.players,
        page: "/horoscope-research/players",
        hint: "A player's horoscope reading.",
        query: TOPICS.players,
        add: { category: "player-horoscopes", fields: ["article", "audio", "video", "photos"] },
      },
    ],
    links: [{ href: "/admin/leagues", label: "Leagues & teams", hint: "Add the teams of a competition before posting its matches." }],
  },
  {
    key: "kpChart",
    title: m.kpChart,
    page: "/kp-chart",
    intro: "Nothing to upload: visitors make their charts here. Every chart is public.",
    slots: [],
    links: [{ href: "/kp-chart/all", label: "See all charts", hint: "Opens the public list of charts." }],
  },
  {
    key: "contact",
    title: m.contact,
    page: "/contact",
    intro: "The contact page shows your details from Profile. Messages from visitors arrive in Messages.",
    slots: [],
    links: [
      { href: PROFILE, label: "Contact details and Google Form", hint: "WhatsApp, email, social links and the questionnaire (Profile)." },
      { href: "/admin/messages", label: "Messages", hint: "What visitors sent through the contact form." },
    ],
  },
  {
    key: "rules",
    title: m.rules,
    page: "/rules",
    intro: "Add, change, reorder or remove any rule below. You can also add audio or video under the rules.",
    slots: [
      {
        id: "rules-posts",
        title: "Audio and video on the Rules page",
        page: "/rules",
        hint: "Appears below the rules.",
        query: TOPICS.rulesPosts,
        add: { category: "rules-posts", fields: ["audio", "video"] },
      },
    ],
    editor: "rules",
  },
  {
    key: "predictionRecords",
    title: m.predictionRecords,
    page: "/prediction-records",
    intro: "Audio of your match predictions with the match data, for each league.",
    slots: LEAGUES.map((league) => ({
      id: `predictions-${league.id}`,
      title: m[league.key],
      page: `/prediction-records#${league.id}`,
      hint: `Audio about a ${m[league.key]} match. It needs the teams and the match date.`,
      query: predictionQuery(league),
      add: { category: "prediction-records", fields: ["audio"], competition: league.id },
    })),
  },
  {
    key: "testimonials",
    title: m.testimonials,
    page: "/testimonials",
    intro: "Screenshots of messages, for each league.",
    slots: LEAGUES.map((league) => ({
      id: `testimonials-${league.id}`,
      title: `${m[league.key]} › ${m.messageProof}`,
      page: `/testimonials#${league.id}`,
      hint: "Screenshots of messages, up to 12 photos in one post.",
      query: messagesQuery(league),
      add: { category: league.messagesCategory, fields: ["photos"] },
    })),
  },
  {
    key: "futureResearch",
    title: m.futureResearch,
    page: "/future-research",
    intro: "Each topic says “coming soon” until it has a post.",
    slots: FUTURE_TOPICS.map((topic) => ({
      id: topic.id,
      title: m[topic.key],
      page: `/future-research#${topic.id}`,
      hint: "Article, audio, video, photos or a PDF.",
      query: topic.query,
      add: { category: topic.query.categorySlug, fields: ["article", "audio", "video", "photos", "pdf"] as PostField[] },
    })),
  },
  {
    key: "krishna",
    title: m.krishna,
    page: "/krishna-consciousness",
    intro: "Change the essay below. You can also add audio or video under it.",
    slots: [
      {
        id: "krishna-posts",
        title: "Audio and video on this page",
        page: "/krishna-consciousness",
        hint: "Appears below the essay.",
        query: TOPICS.krishnaPosts,
        add: { category: "krishna-consciousness", fields: ["audio", "video"] },
      },
    ],
    editor: "krishna",
  },
];

export const adminSection = (key: string) => ADMIN_SECTIONS.find((s) => s.key === key);

export function adminSlot(id: string): (AdminSlot & { section: AdminSection }) | undefined {
  for (const section of ADMIN_SECTIONS) {
    const slot = section.slots.find((s) => s.id === id);
    if (slot) return { ...slot, section };
  }
}

/** The menu item a category's posts appear under. */
export function sectionOfCategory(slug: string): AdminSection | undefined {
  return ADMIN_SECTIONS.find((s) => s.slots.some((slot) => slot.add.category === slug || slot.query.categorySlugs?.includes(slug)));
}

/** Categories grouped by the menu item they fill, for the post form. */
export function categoriesByMenu(categories: Category[]): { label: string; items: Category[] }[] {
  const groups = new Map<string, Category[]>();
  for (const c of categories) {
    const label = sectionOfCategory(c.slug)?.title ?? "Other";
    groups.set(label, [...(groups.get(label) ?? []), c]);
  }
  const order = ADMIN_SECTIONS.map((s) => s.title as string);
  return [...groups].sort(([a], [b]) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99)).map(([label, items]) => ({ label, items }));
}
