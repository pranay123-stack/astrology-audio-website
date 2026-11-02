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
  predictionRecords: { categorySlug: "prediction-records", sort: "match_date_desc" },
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

/**
 * The leagues under Testimonials, in menu order: message proof has a category per league.
 */
export const LEAGUES = [
  { id: "bbl", key: "bbl", messagesCategory: "testimonial-messages-bbl" },
  { id: "ipl", key: "ipl", messagesCategory: "testimonial-messages-ipl" },
] as const;

export type League = (typeof LEAGUES)[number];

export const messagesQuery = (league: League) => ({ categorySlug: league.messagesCategory, sort: "latest" }) satisfies EpisodeQuery;

/** The Testimonials categories, for the home page's "What people say". */
export const TESTIMONIAL_CATEGORIES = LEAGUES.map((l) => l.messagesCategory);

/**
 * Cricket Matches under Latest Matches, Horoscope Research and Prediction Records: each game, in
 * menu order, with its men's and women's competitions. A post's match says which one it is in.
 */
export const CRICKET_SERIES = [
  { id: "bbl", key: "seriesBbl", men: "bbl", women: "wbbl" },
  { id: "ipl", key: "ipl", men: "ipl", women: "wpl" },
  { id: "t20", key: "seriesT20", men: "t20i", women: "wt20i" },
  { id: "odi", key: "seriesOdi", men: "odi", women: "wodi" },
] as const;

export const SERIES_GENDERS = ["men", "women"] as const;

/** Every men's and women's place, in menu order. */
export const MATCH_COMPETITIONS = CRICKET_SERIES.flatMap((series) => SERIES_GENDERS.map((gender) => ({ slug: series[gender], series, gender })));

export const latestQuery = (competitionSlug: string) => ({ categorySlug: "latest-matches", competitionSlug, sort: "match_date_desc" }) satisfies EpisodeQuery;
export const predictionQuery = (competitionSlug: string) => ({ ...TOPICS.predictionRecords, competitionSlug }) satisfies EpisodeQuery;

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
