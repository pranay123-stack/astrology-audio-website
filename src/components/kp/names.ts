import type { Locale } from "@/lib/types";

export const SIGN_NAMES: Record<Locale, string[]> = {
  en: ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"],
  hi: ["मेष", "वृषभ", "मिथुन", "कर्क", "सिंह", "कन्या", "तुला", "वृश्चिक", "धनु", "मकर", "कुंभ", "मीन"],
};

export const PLANET_NAMES: Record<Locale, Record<string, string>> = {
  en: {
    Su: "Sun", Mo: "Moon", Ma: "Mars", Me: "Mercury", Ju: "Jupiter", Ve: "Venus", Sa: "Saturn", Ra: "Rahu", Ke: "Ketu",
    Ur: "Uranus", Ne: "Neptune", Pl: "Pluto", Fo: "Fortuna",
  },
  hi: {
    Su: "सूर्य", Mo: "चंद्र", Ma: "मंगल", Me: "बुध", Ju: "गुरु", Ve: "शुक्र", Sa: "शनि", Ra: "राहु", Ke: "केतु",
    Ur: "यूरेनस", Ne: "नेपच्यून", Pl: "प्लूटो", Fo: "फॉर्चूना",
  },
};

/** The 27 nakshatras, Ashwini..Revati. */
export const NAKSHATRA_NAMES: Record<Locale, string[]> = {
  en: [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Ashlesha",
    "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
    "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati",
  ],
  hi: [
    "अश्विनी", "भरणी", "कृत्तिका", "रोहिणी", "मृगशिरा", "आर्द्रा", "पुनर्वसु", "पुष्य", "आश्लेषा",
    "मघा", "पूर्वा फाल्गुनी", "उत्तरा फाल्गुनी", "हस्त", "चित्रा", "स्वाति", "विशाखा", "अनुराधा", "ज्येष्ठा",
    "मूल", "पूर्वाषाढ़ा", "उत्तराषाढ़ा", "श्रवण", "धनिष्ठा", "शतभिषा", "पूर्वा भाद्रपद", "उत्तरा भाद्रपद", "रेवती",
  ],
};

/** Zodiac glyphs (Aries..Pisces), forced to text rather than emoji style. */
export const SIGN_GLYPHS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"].map((g) => `${g}\uFE0E`);

export const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

/** South Indian chart: signs keep fixed boxes. Grid [row, column] for Aries..Pisces. */
export const SOUTH_INDIAN_CELL: [number, number][] = [
  [0, 1], [0, 2], [0, 3], [1, 3], [2, 3], [3, 3], [3, 2], [3, 1], [3, 0], [2, 0], [1, 0], [0, 0],
];
