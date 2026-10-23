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

export const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

/** South Indian chart: signs keep fixed boxes. Grid [row, column] for Aries..Pisces. */
export const SOUTH_INDIAN_CELL: [number, number][] = [
  [0, 1], [0, 2], [0, 3], [1, 3], [2, 3], [3, 3], [3, 2], [3, 1], [3, 0], [2, 0], [1, 0], [0, 0],
];
