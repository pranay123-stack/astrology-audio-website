/** The astrologer's guiding quote at the top of the home page, in his own words. */
export interface QuoteContent {
  text: string;
  author: string;
  role_en: string;
  role_hi: string;
}

export const QUOTE: QuoteContent = {
  text: "Kundali kabhi galat nahi bolti, either human ki ho ya match ki.",
  author: "Amit Sharma",
  role_en: "Author of the book “A Spiritual Punter, Bookie & Astrologer”. Discovered Astro Cricket through the KP system",
  role_hi: "पुस्तक “A Spiritual Punter, Bookie & Astrologer” के लेखक। KP पद्धति से Astro Cricket की खोज की",
};
