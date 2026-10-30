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
  { slug: "cricket-astrology", requires_match: true, name: "Cricket Astrology", name_hi: "क्रिकेट ज्योतिष", description_hi: "क्रिकेट मैचों का ज्योतिषीय विश्लेषण, बिग बैश लीग से शुरुआत।", section: "cricket", description: "Astrological readings of cricket matches, starting with the Big Bash League." },
  { slug: "daily-astrology", requires_match: false, name: "Daily Astrology", name_hi: "दैनिक ज्योतिष", description_hi: "दिन की ग्रह-स्थिति पर छोटे दैनिक विचार।", section: "general", description: "Short daily readings of the day's planetary weather." },
  { slug: "horoscope-insights", requires_match: false, name: "Horoscope Insights", name_hi: "राशिफल विचार", description_hi: "हर राशि के लिए साप्ताहिक और मासिक राशिफल चर्चा।", section: "general", description: "Weekly and monthly horoscope discussions for every sign." },
  { slug: "planetary-transits", requires_match: false, name: "Planetary Transits", name_hi: "ग्रह गोचर", description_hi: "बड़े ग्रह-गोचर का क्या अर्थ हो सकता है, सरल भाषा में।", section: "general", description: "What major planetary movements may mean, explained in plain language." },
  { slug: "zodiac-sign-guidance", requires_match: false, name: "Zodiac Sign Guidance", name_hi: "राशि मार्गदर्शन", description_hi: "हर राशि के स्वभाव, रिश्तों और समय पर मार्गदर्शन।", section: "general", description: "Sign-by-sign guidance on temperament, relationships and timing." },
  { slug: "vedic-astrology", requires_match: false, name: "Vedic Astrology", name_hi: "वैदिक ज्योतिष", description_hi: "ज्योतिष की मूल बातें: नक्षत्र, दशा, भाव और उपाय।", section: "general", description: "Jyotish concepts: nakshatras, dashas, houses and remedies." },
  { slug: "spirituality-and-meditation", requires_match: false, name: "Spirituality and Meditation", name_hi: "अध्यात्म और ध्यान", description_hi: "ज्योतिषीय विषयों से प्रेरित चिंतन और ध्यान।", section: "general", description: "Guided reflections and meditations inspired by astrological themes." },
  { slug: "astrology-learning", requires_match: false, name: "Astrology Learning", name_hi: "ज्योतिष सीखें", description_hi: "उन श्रोताओं के लिए पाठ जो स्वयं ज्योतिष सीखना चाहते हैं।", section: "general", description: "Lessons for listeners who want to learn astrology themselves." },
  { slug: "planets-grahas", requires_match: false, name: "Planets (Grahas)", name_hi: "ग्रह", description_hi: "शनि, शुक्र, गुरु और अन्य ग्रह: उनका स्वभाव, प्रभाव और उपाय।", section: "general", description: "Shani, Shukra, Guru and the other grahas: their nature, influence and remedies." },
  { slug: "cricket-astrology-guide", requires_match: false, name: "Cricket Astrology Guide", name_hi: "क्रिकेट ज्योतिष ज्ञान", description_hi: "ज्योतिषी क्रिकेट मैच को कैसे पढ़ते हैं: पद्धति, भाव, समय और सीमाएँ, सीखने वालों के लिए सरल भाषा में।", section: "cricket", description: "How astrologers read a cricket match: the method, the houses, timing and the limits, explained for learners." },
  { slug: "kp-research", requires_match: true, name: "KP Research Kundli", name_hi: "KP शोध कुंडली", description_hi: "मैच डेटा के साथ KP शोध कुंडलियाँ।", section: "cricket", description: "KP research kundlis with the match data." },
  { slug: "cricket-podcast", requires_match: false, name: "Astro Cricket Videos", name_hi: "एस्ट्रो क्रिकेट वीडियो", description_hi: "क्रिकेट और ज्योतिष पर वीडियो पॉडकास्ट।", section: "cricket", description: "Video podcasts on cricket and astrology." },
  { slug: "player-horoscopes", requires_match: false, name: "Player Horoscopes", name_hi: "खिलाड़ियों की कुंडली", description_hi: "क्रिकेट खिलाड़ियों की कुंडली पर शोध।", section: "cricket", description: "Horoscope research on cricket players." },
  { slug: "prediction-records", requires_match: true, name: "Prediction Records", name_hi: "भविष्यवाणी रिकॉर्ड", description_hi: "ऑडियो और मैच डेटा के साथ मैच की भविष्यवाणियाँ।", section: "cricket", description: "Match predictions with audio and the match data." },
  { slug: "testimonial-messages-bbl", requires_match: false, name: "Message Proof (BBL)", name_hi: "संदेश प्रमाण (BBL)", description_hi: "BBL रीडिंग पर आए संदेशों के स्क्रीनशॉट।", section: "cricket", description: "Screenshots of messages about BBL readings." },
  { slug: "testimonial-messages-ipl", requires_match: false, name: "Message Proof (IPL)", name_hi: "संदेश प्रमाण (IPL)", description_hi: "IPL रीडिंग पर आए संदेशों के स्क्रीनशॉट।", section: "cricket", description: "Screenshots of messages about IPL readings." },
  { slug: "football-astro", requires_match: false, name: "Football Astro", name_hi: "फ़ुटबॉल ज्योतिष", description_hi: "फ़ुटबॉल मैचों पर ज्योतिषीय शोध।", section: "general", description: "Astrology research on football matches." },
  { slug: "share-market", requires_match: false, name: "Share Market", name_hi: "शेयर बाज़ार", description_hi: "शेयर बाज़ार पर ज्योतिषीय शोध।", section: "general", description: "Astrology research on the share market." },
  { slug: "bitcoin-forex", requires_match: false, name: "Bitcoin & Forex Market", name_hi: "बिटकॉइन और फ़ॉरेक्स बाज़ार", description_hi: "बिटकॉइन और फ़ॉरेक्स बाज़ार पर ज्योतिषीय शोध।", section: "general", description: "Astrology research on bitcoin and forex markets." },
  { slug: "lottery-number", requires_match: false, name: "Lottery Number", name_hi: "लॉटरी नंबर", description_hi: "लॉटरी नंबरों पर ज्योतिषीय शोध।", section: "general", description: "Astrology research on lottery numbers." },
  { slug: "rules-posts", requires_match: false, name: "Rules", name_hi: "नियम", description_hi: "नियमों पर ऑडियो और वीडियो।", section: "general", description: "Audio and video about the rules." },
  { slug: "krishna-consciousness", requires_match: false, name: "Krishna Consciousness", name_hi: "कृष्ण चेतना", description_hi: "कृष्ण चेतना पर ऑडियो और वीडियो।", section: "general", description: "Audio and video on Krishna Consciousness." },
  { slug: "book-hindi", requires_match: false, name: "Book (Hindi)", name_hi: "पुस्तक (हिंदी)", description_hi: "A Spiritual Punter, Bookie & Astrologer, हिंदी में।", section: "general", description: "A Spiritual Punter, Bookie & Astrologer, in Hindi." },
  { slug: "book-english", requires_match: false, name: "Book (English)", name_hi: "पुस्तक (अंग्रेज़ी)", description_hi: "A Spiritual Punter, Bookie & Astrologer, अंग्रेज़ी में।", section: "general", description: "A Spiritual Punter, Bookie & Astrologer, in English." },
] as const;

export const competitions = [
  { slug: "bbl", name: "Big Bash League", short_name: "BBL", description: "Australia's men's T20 domestic league." },
  { slug: "ipl", name: "Indian Premier League", short_name: "IPL", description: "India's men's T20 league." },
  { slug: "t20i", name: "International T20", short_name: "T20I", description: "Men's T20 internationals." },
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
  social_links: { youtube: "", instagram: "", facebook: "", x: "", whatsapp: "", spotify: "", telegram: "", amazon: "", linktree: "" },
  legal_business_name: "",
  legal_jurisdiction: "",
  hi: {},
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
  /** Omit for an article-only sample. */
  audio?: DemoAudio;
  article?: string;
  cover: { hue: number; glyph: "sun" | "moon" | "wheel" | "star" | "planet" | "bat" };
  premium?: boolean;
  /** Days relative to seeding time. */
  publishedDaysAgo: number;
  playCount: number;
  match?: { teamA: string; teamB: string; inDays: number; hourLocal: number; venue: string; status: "scheduled" | "completed" };
}

/** Hindi placeholder showing the article layout. It deliberately makes no astrological claims. */
const SAMPLE_HINDI_ARTICLE = `## नमूना लेख

यह एक **नमूना लेख** है। इससे पता चलता है कि ज्योतिषी के लेख वेबसाइट पर कैसे दिखेंगे।

ज्योतिषी शनि, शुक्र, गुरु जैसे ग्रहों पर अपने लेख यहाँ प्रकाशित कर सकते हैं। लेख के साथ ऑडियो भी जोड़ा जा सकता है, या केवल लेख भी प्रकाशित किया जा सकता है।

### लेख में क्या-क्या हो सकता है

- अनुच्छेद (खाली पंक्ति से नया अनुच्छेद)
- छोटे शीर्षक
- सूची के बिंदु

यह पाठ केवल प्रदर्शन के लिए है। इसमें कोई ज्योतिषीय भविष्यवाणी नहीं है।`;

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
    slug: "sample-article-graha",
    title: "Sample: Hindi Article (Planets)",
    excerpt: "Placeholder showing how a written Hindi article on a graha such as Shani or Shukra appears, without audio.",
    description: "",
    article: SAMPLE_HINDI_ARTICLE,
    category: "planets-grahas",
    cover: { hue: 260, glyph: "planet" },
    publishedDaysAgo: 0.05,
    playCount: 0,
  },
  {
    slug: "sample-daily-astrology-reading",
    title: "Sample: Daily Astrology Reading",
    excerpt: "Placeholder episode showing how a short daily reading is presented.",
    description: "Daily readings usually run a few minutes and cover the day's lunar placement and major aspects." + DEMO_NOTE,
    article: SAMPLE_HINDI_ARTICLE,
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
