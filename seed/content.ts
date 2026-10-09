/**
 * Seed data. Everything marked `demo` is DEMONSTRATION CONTENT: the fixtures use
 * fictional "Demo Team" names, the audio is a placeholder tone, and no prediction
 * is made. Remove it from Admin → Dashboard → "Remove demo content" once real
 * episodes are published.
 *
 * The eight Big Bash League club names are listed so the astrologer can pick real
 * teams when publishing real predictions. No club logos are bundled (they are
 * trademarks); upload licensed logos in Admin → Leagues & Teams, or the site shows
 * a monogram badge in the club colour.
 */

export const categories = [
  { slug: "cricket-astrology", name: "Cricket Astrology", section: "cricket", description: "Astrological readings of cricket matches, starting with the Big Bash League." },
  { slug: "daily-astrology", name: "Daily Astrology", section: "general", description: "Short daily readings of the day's planetary weather." },
  { slug: "horoscope-insights", name: "Horoscope Insights", section: "general", description: "Weekly and monthly horoscope discussions for every sign." },
  { slug: "planetary-transits", name: "Planetary Transits", section: "general", description: "What major planetary movements may mean, explained in plain language." },
  { slug: "zodiac-sign-guidance", name: "Zodiac Sign Guidance", section: "general", description: "Sign-by-sign guidance on temperament, relationships and timing." },
  { slug: "vedic-astrology", name: "Vedic Astrology", section: "general", description: "Jyotish concepts: nakshatras, dashas, houses and remedies." },
  { slug: "spirituality-and-meditation", name: "Spirituality and Meditation", section: "general", description: "Guided reflections and meditations inspired by astrological themes." },
  { slug: "astrology-learning", name: "Astrology Learning", section: "general", description: "Lessons for listeners who want to learn astrology themselves." },
] as const;

export const competitions = [
  { slug: "bbl", name: "Big Bash League", short_name: "BBL", description: "Australia's men's T20 domestic league." },
] as const;

export const bblTeams = [
  { name: "Adelaide Strikers", short_name: "STR", primary_color: "#0077c8" },
  { name: "Brisbane Heat", short_name: "HEA", primary_color: "#00a3ad" },
  { name: "Hobart Hurricanes", short_name: "HUR", primary_color: "#6c2c91" },
  { name: "Melbourne Renegades", short_name: "REN", primary_color: "#d71920" },
  { name: "Melbourne Stars", short_name: "STA", primary_color: "#00953b" },
  { name: "Perth Scorchers", short_name: "SCO", primary_color: "#f26522" },
  { name: "Sydney Sixers", short_name: "SIX", primary_color: "#e6007e" },
  { name: "Sydney Thunder", short_name: "THU", primary_color: "#8cc63f" },
] as const;

export const demoTeams = [
  { name: "Demo Team A", short_name: "DTA", primary_color: "#7c3aed" },
  { name: "Demo Team B", short_name: "DTB", primary_color: "#d4a017" },
  { name: "Demo Team C", short_name: "DTC", primary_color: "#0ea5e9" },
  { name: "Demo Team D", short_name: "DTD", primary_color: "#e11d48" },
] as const;

export const profile = {
  display_name: "Your Astrologer Name",
  tagline: "Astrology through audio — cricket readings and everyday cosmic guidance",
  biography:
    "This is placeholder text. Replace it in Admin → Profile with the astrologer's own introduction: who they are, how they came to astrology, and what listeners can expect from the audio content on this site.",
  experience:
    "Placeholder: describe the astrologer's training, years of practice and areas of focus here. Only include details that can be stated accurately.",
  specializations: ["Vedic astrology", "Cricket match astrology", "Planetary transits", "Horoscope readings"],
  contact_email: "",
  contact_phone: "",
  location: "",
  consultation_info:
    "Placeholder: explain how personal consultations work (format, typical length, how to book). Pricing can be added here once it is decided.",
  social_links: { youtube: "", instagram: "", facebook: "", x: "", whatsapp: "", spotify: "" },
  legal_business_name: "",
  legal_jurisdiction: "",
};

export type DemoAudio = "demo-tone-a.mp3" | "demo-tone-b.mp3" | "demo-tone-c.mp3";
export const demoAudioDurations: Record<DemoAudio, number> = {
  "demo-tone-a.mp3": 48,
  "demo-tone-b.mp3": 63,
  "demo-tone-c.mp3": 77,
};

const DEMO_NOTE =
  "\n\nDemonstration content: this sample shows how an episode page looks. The audio is a placeholder tone, not a recording, and no reading or prediction is made here.";

export interface DemoEpisode {
  slug: string;
  title: string;
  excerpt: string;
  description: string;
  category: (typeof categories)[number]["slug"];
  audio: DemoAudio;
  cover: { hue: number; glyph: "sun" | "moon" | "wheel" | "star" | "planet" | "bat" };
  premium?: boolean;
  /** Days relative to seeding time. */
  publishedDaysAgo: number;
  playCount: number;
  match?: { teamA: string; teamB: string; inDays: number; hourLocal: number; venue: string; status: "scheduled" | "completed" };
}

export const demoEpisodes: DemoEpisode[] = [
  {
    slug: "sample-bbl-astrology-demo-team-a-vs-demo-team-b",
    title: "Sample: BBL Match Astrology Prediction — Demo Team A vs Demo Team B",
    excerpt: "Sample listing that shows how an upcoming Big Bash League match reading will appear.",
    description: "When the astrologer publishes a real match reading, this space holds the episode notes: the chart considerations discussed in the audio and the time the reading was prepared." + DEMO_NOTE,
    category: "cricket-astrology",
    audio: "demo-tone-a.mp3",
    cover: { hue: 265, glyph: "bat" },
    publishedDaysAgo: 0.2,
    playCount: 12,
    match: { teamA: "Demo Team A", teamB: "Demo Team B", inDays: 2, hourLocal: 19, venue: "Sample Venue", status: "scheduled" },
  },
  {
    slug: "sample-bbl-astrology-demo-team-c-vs-demo-team-d",
    title: "Sample: BBL Match Astrology Prediction — Demo Team C vs Demo Team D",
    excerpt: "A second sample of an upcoming match listing, marked as premium to show the locked state.",
    description: "Premium readings are shown with a lock until the premium module is switched on." + DEMO_NOTE,
    category: "cricket-astrology",
    audio: "demo-tone-b.mp3",
    cover: { hue: 220, glyph: "bat" },
    premium: true,
    publishedDaysAgo: 0.5,
    playCount: 4,
    match: { teamA: "Demo Team C", teamB: "Demo Team D", inDays: 4, hourLocal: 16, venue: "Sample Venue", status: "scheduled" },
  },
  {
    slug: "sample-bbl-astrology-demo-team-b-vs-demo-team-c",
    title: "Sample: BBL Match Astrology Prediction — Demo Team B vs Demo Team C",
    excerpt: "Sample listing for a later fixture, showing how the upcoming list is ordered by match date.",
    description: "Upcoming readings are ordered by match start time, soonest first." + DEMO_NOTE,
    category: "cricket-astrology",
    audio: "demo-tone-c.mp3",
    cover: { hue: 290, glyph: "bat" },
    publishedDaysAgo: 1,
    playCount: 7,
    match: { teamA: "Demo Team B", teamB: "Demo Team C", inDays: 6, hourLocal: 19, venue: "Sample Venue", status: "scheduled" },
  },
  {
    slug: "sample-bbl-astrology-demo-team-d-vs-demo-team-a",
    title: "Sample: BBL Match Astrology Prediction — Demo Team D vs Demo Team A",
    excerpt: "Sample of a past match listing. Past readings stay available in the archive.",
    description: "After a match starts, its reading moves to the past matches list." + DEMO_NOTE,
    category: "cricket-astrology",
    audio: "demo-tone-a.mp3",
    cover: { hue: 245, glyph: "bat" },
    publishedDaysAgo: 4,
    playCount: 31,
    match: { teamA: "Demo Team D", teamB: "Demo Team A", inDays: -3, hourLocal: 19, venue: "Sample Venue", status: "completed" },
  },
  {
    slug: "sample-daily-astrology-reading",
    title: "Sample: Daily Astrology Reading",
    excerpt: "Placeholder episode showing how a short daily reading is presented.",
    description: "Daily readings usually run a few minutes and cover the day's lunar placement and major aspects." + DEMO_NOTE,
    category: "daily-astrology",
    audio: "demo-tone-a.mp3",
    cover: { hue: 40, glyph: "sun" },
    publishedDaysAgo: 0.1,
    playCount: 25,
  },
  {
    slug: "sample-weekly-horoscope-insights",
    title: "Sample: Weekly Horoscope Insights for All Signs",
    excerpt: "Placeholder episode for the horoscope insights category.",
    description: "A weekly horoscope episode would walk through each of the twelve signs in turn." + DEMO_NOTE,
    category: "horoscope-insights",
    audio: "demo-tone-c.mp3",
    cover: { hue: 300, glyph: "wheel" },
    publishedDaysAgo: 2,
    playCount: 40,
  },
  {
    slug: "sample-planetary-transit-explainer",
    title: "Sample: Understanding a Planetary Transit",
    excerpt: "Placeholder episode for the planetary transits category.",
    description: "Transit episodes explain what a planet's movement into a new sign is traditionally associated with." + DEMO_NOTE,
    category: "planetary-transits",
    audio: "demo-tone-b.mp3",
    cover: { hue: 200, glyph: "planet" },
    publishedDaysAgo: 3,
    playCount: 18,
  },
  {
    slug: "sample-zodiac-sign-guidance",
    title: "Sample: Zodiac Sign Guidance",
    excerpt: "Placeholder episode for sign-by-sign guidance.",
    description: "Guidance episodes focus on one sign's temperament and themes." + DEMO_NOTE,
    category: "zodiac-sign-guidance",
    audio: "demo-tone-a.mp3",
    cover: { hue: 330, glyph: "star" },
    publishedDaysAgo: 5,
    playCount: 9,
  },
  {
    slug: "sample-vedic-astrology-nakshatras",
    title: "Sample: Introduction to Nakshatras",
    excerpt: "Placeholder episode for the Vedic astrology category, marked premium to show the locked state.",
    description: "A Vedic astrology episode might introduce the 27 lunar mansions." + DEMO_NOTE,
    category: "vedic-astrology",
    audio: "demo-tone-c.mp3",
    cover: { hue: 20, glyph: "moon" },
    premium: true,
    publishedDaysAgo: 6,
    playCount: 14,
  },
  {
    slug: "sample-full-moon-meditation",
    title: "Sample: Full Moon Reflection",
    excerpt: "Placeholder episode for the spirituality and meditation category.",
    description: "Meditation episodes are calm, guided audio sessions." + DEMO_NOTE,
    category: "spirituality-and-meditation",
    audio: "demo-tone-b.mp3",
    cover: { hue: 185, glyph: "moon" },
    publishedDaysAgo: 8,
    playCount: 52,
  },
  {
    slug: "sample-astrology-lesson-houses",
    title: "Sample: Astrology Lesson — The Twelve Houses",
    excerpt: "Placeholder episode for the astrology learning category.",
    description: "Learning episodes teach one concept at a time, with examples." + DEMO_NOTE,
    category: "astrology-learning",
    audio: "demo-tone-c.mp3",
    cover: { hue: 140, glyph: "wheel" },
    publishedDaysAgo: 10,
    playCount: 21,
  },
  {
    slug: "sample-daily-astrology-reading-earlier",
    title: "Sample: Daily Astrology Reading (Earlier Episode)",
    excerpt: "A second daily placeholder, so the category shows more than one episode.",
    description: "Older daily readings remain in the archive." + DEMO_NOTE,
    category: "daily-astrology",
    audio: "demo-tone-b.mp3",
    cover: { hue: 55, glyph: "sun" },
    publishedDaysAgo: 1.1,
    playCount: 11,
  },
];
