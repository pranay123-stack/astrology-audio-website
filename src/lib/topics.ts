import type { EpisodeQuery, PostFormat } from "./types";

/**
 * Which posts each page of the site menu lists. Posts are filed under categories in Admin; the
 * menu groups them: e.g. "12 Planets & 12 Bhav" shows the Planets and Astrology Learning categories,
 * "Old Videos" any post the admin marked as an old video.
 */
export const TOPICS = {
  planetsBhav: { categorySlugs: ["planets-grahas", "astrology-learning"] },
  kpResearch: { categorySlug: "kp-research", sort: "match_date_desc" },
  /** The cricket astrology guide (how the KP method reads a match), shown under KP Astrology. */
  kpGuide: { categorySlug: "cricket-astrology-guide", sort: "latest" },
  podcast: { section: "cricket", formats: ["video", "reel"], archived: false },
  oldVideos: { formats: ["video", "reel"], archived: true },
  matches: { categorySlug: "cricket-astrology", withMatch: true, sort: "match_date_desc" },
  players: { categorySlug: "player-horoscopes" },
  testimonialAudio: { categorySlug: "testimonial-audio", sort: "match_date_desc" },
  testimonialMessages: { categorySlug: "testimonial-messages", sort: "latest" },
  footballAstro: { categorySlug: "football-astro", sort: "latest" },
  shareMarket: { categorySlug: "share-market", sort: "latest" },
  bitcoinForex: { categorySlug: "bitcoin-forex", sort: "latest" },
  lotteryNumber: { categorySlug: "lottery-number", sort: "latest" },
  bookHindi: { categorySlug: "book-hindi", sort: "latest" },
  bookEnglish: { categorySlug: "book-english", sort: "latest" },
  rulesPosts: { categorySlug: "rules-posts", sort: "latest" },
  krishnaPosts: { categorySlug: "krishna-consciousness", sort: "latest" },
} satisfies Record<string, EpisodeQuery>;

/** The Video / Audio / Read tabs of "12 Planets & 12 Bhav". */
export const PLANET_FORMATS = ["video", "audio", "article"] as const satisfies readonly PostFormat[];

/** Competitions listed under Horoscope Research › Cricket Matches, in menu order. */
export const MATCH_COMPETITIONS = ["bbl", "ipl", "t20i"] as const;

/** Future Research Topics: menu anchor and query of each topic. */
export const FUTURE_TOPICS = [
  { id: "football", key: "footballAstro", query: TOPICS.footballAstro },
  { id: "share-market", key: "shareMarket", query: TOPICS.shareMarket },
  { id: "bitcoin-forex", key: "bitcoinForex", query: TOPICS.bitcoinForex },
  { id: "lottery", key: "lotteryNumber", query: TOPICS.lotteryNumber },
] as const;

/** Book sections: menu anchor, query and format. */
export const BOOK_PARTS = [
  { id: "audio-hindi", key: "audioHi", query: TOPICS.bookHindi, format: "audio" },
  { id: "audio-english", key: "audioEn", query: TOPICS.bookEnglish, format: "audio" },
  { id: "pdf-hindi", key: "pdfHi", query: TOPICS.bookHindi, format: "pdf" },
  { id: "pdf-english", key: "pdfEn", query: TOPICS.bookEnglish, format: "pdf" },
] as const;
