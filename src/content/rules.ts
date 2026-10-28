/**
 * The astrologer's rules (menu: Rules › Spiritual, Cricket, Shani), in his own words (Hinglish),
 * shown the same on the English and Hindi sites. Only spelling was corrected.
 */

export interface Rule {
  /** The rule itself (shown as the card's heading). */
  title: string;
  /** Explanation, one paragraph per line. */
  body?: string[];
  /** Planet that rules it, and the chakra (spiritual rules). */
  planet?: string;
  chakra?: string;
  /** A list inside the rule (the match grades). */
  list?: { label: string; text: string }[];
  note?: string;
}

export const SPIRITUAL_RULES: Rule[] = [
  {
    title: "Fear sabko lagta hai",
    body: [
      "But aapko fear aaye to usko watch karo, only watch. After a few minutes of observation, fear will be gone.",
      "Fear, jealousy and greed are ruled by Saturn.",
    ],
    planet: "Saturn",
    chakra: "Mooladhar Chakra",
  },
  {
    title: "EGO barbaad kar deti hai",
    body: [
      "EGO develop ho jati hai jab anger continue aata hai.",
      "So observe your ego. Go to your GURU (any guru, or a friend or well-wisher) and ask his advice. When you discuss, the EGO will be checked.",
      "EGO, anger and rigidness are ruled by Jupiter.",
    ],
    planet: "Jupiter",
    chakra: "Swadhisthan Chakra",
  },
  {
    title: "Never get excited for anything",
    body: [
      "If anything goes against you and your thoughts, whisper: “IT DOES NOT MATTER”, “IT'S ACCEPTED”.",
      "If everything is accepted, that is ruled by Mars.",
    ],
    planet: "Mars",
    chakra: "Manipur Chakra",
  },
  {
    title: "Love everyone, but first love yourself",
    body: [
      "If anyone can't love himself, he can't love someone.",
      "Gift yourself first and then others. A smile is also a gift which you can give others for free; they will be attracted to you and things will manifest.",
      "Always be happy.",
      "Venus is the ruler of love, happiness and a big heart.",
    ],
    planet: "Venus",
    chakra: "Anahat Chakra",
  },
  {
    title: "Apni baat se kisi ko dukh na de",
    body: [
      "Clear-cut talk with clear thoughts. Expressive nature.",
      "Always a caring nature for others, and control of the tongue, is ruled by Mercury.",
    ],
    planet: "Mercury",
    chakra: "Vishuddhi Chakra",
  },
  {
    title: "Third eye open",
    body: [
      "Manifest for others. The Cosmos will give anything he can imagine.",
      "Anything he thought, he will get.",
      "This is ruled by the Moon.",
    ],
    planet: "Moon",
    chakra: "Agya Chakra",
  },
  {
    title: "Direct link with the Cosmos",
    body: [
      "No materialistic things matter.",
      "He can help others, can get KRIPA and can even change the lives of others.",
      "KRIPA is ruled by the Sun.",
    ],
    planet: "Sun",
    chakra: "Sahasrara Chakra",
  },
];

export const CRICKET_RULES: Rule[] = [
  {
    title: "No kundli works in a rain-affected match",
    body: ["Cosmos ka kuch alag plan hai us match mein. So no work in a rain match."],
  },
  {
    title: "Understand the grade of the match",
    list: [
      { label: "A Grade", text: "World Cup or Championship" },
      { label: "B Grade", text: "International matches" },
      { label: "C Grade", text: "Highly watched and covered by big media, like IPL, Big Bash, NatWest etc." },
      { label: "D Grade", text: "LPL or CPL (not very much covered)" },
      { label: "E Grade", text: "All state leagues or tournaments" },
    ],
    note: "You will not get very satisfying results in ‘D’ and ‘E’ leagues. So avoid these, understand, and work accordingly.",
  },
  {
    title: "Don't work more than one match in a day",
    body: [
      "It's advisable not to work more than one match in a day (if A, B or C grade matches are found).",
      "It's advisable not to work more than 5 days at most in a week.",
    ],
  },
  {
    title: "The Cosmos gives back what you give",
    body: ["Cosmos will give back to you whatever you give. So GUPT DAAN will always work for you."],
  },
  {
    title: "Fixing is part of this business",
    body: ["You have to work accordingly."],
  },
  {
    title: "Understand the market",
    body: [
      "Because you can't fight with the market. You have to live and work with the market.",
      "Make the market your FRIEND. Never complain about it.",
    ],
  },
  {
    title: "You can be wrong any time",
    body: ["Every person has to face failure in life.", "Never get excited with success, and never get excited with failure."],
  },
  {
    title: "The Cosmos will test you, at least thrice",
    body: ["At least 3 continuous failures. If that failure DOES NOT MATTER to you, then you can go long."],
  },
  {
    title: "One person's KARMA can change the result",
    body: [
      "Sometimes individual KARMA can change the fate of an entire family or society.",
      "The same in cricket: an individual performance can change the match result, and it can go either way. So always be ready for this situation.",
    ],
  },
];

export const SHANI_RULES: Rule[] = [
  { title: "Kabhi kisi bhi cheez ko FREE mein lene ka thought mat lao", body: ["Cosmos price maangti hai."] },
  { title: "Sirf ek baar plan banao, aur kaam pe lag jao", body: ["Every time planning mat karo."] },
  { title: "Don't disclose and discuss your plan with friends & family", body: ["Keep it secret."] },
  { title: "Never count your money", body: ["Only once, that's it. Don't repeat."] },
  { title: "Don't write your hisab" },
  { title: "God ko business partner mat banao" },
  { title: "No calculation (profit & loss)" },
  { title: "Gupt daan to strangers only" },
  { title: "Daily mantra", body: ["“Sab ho raha hai, I am doing nothing.”"] },
];
