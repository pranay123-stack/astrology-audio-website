/**
 * "Krishna Consciousness" (menu item 10), in the astrologer's own words (Hinglish), shown the
 * same on the English and Hindi sites. Only spelling and punctuation were tidied.
 */

interface Share {
  share: string;
  label: string;
  text: string;
}

export interface KrishnaContent {
  questions: { thought: string; answer: string }[];
  middle: string[];
  story: string[];
  luck: Share;
  karma: Share;
  how: { question: string; answer: string[] };
  closing: string;
}

export const KRISHNA: KrishnaContent = {
  /** Two questions that show neither "only fate" nor "only effort" is the whole truth. */
  questions: [
    {
      thought: "Agar hum ye sochte hain ki jo bhagya mein likha hai, wahi hoga, hum kuch nahi kar sakte…",
      answer: "Agar aisa hota, to KRISHNA ko Arjun ko Geeta ka gyan kyun dena tha? Means, karma karna hi padega. Result is not in our control.",
    },
    {
      thought: "Agar hum aisa sochte hain ki insaan kuch bhi kar sakta hai, karma se bhagya badla ja sakta hai…",
      answer: "Tab phir Krishna aur Arjun milke Abhimanyu aur other children ko nahi bacha lete?",
    },
  ],
  middle: [
    "Kuch bhagya aisa hai, jo badla nahi ja sakta.",
    "Lekin bahut bada bhagya aisa bhi hai, jo change nahi kiya ja sakta, but uske flow ko kam ya zyada kiya ja sakta hai.",
  ],
  /** The eyeglasses example. */
  story: [
    "Eye kharab ho gayi, dikhna kam ho gaya.",
    "But ek din doctor ne chashma lagwa diya. Badla kuch bhi nahi, bhagya waisa hi hai, bas ab clear dikhne laga.",
  ],
  luck: {
    share: "12%",
    label: "Luck / Bhagya",
    text: "Ye jo dikhna band ho gaya, ya eye ka power kam ho gaya: ye 12% luck ya bhagya hai. 12% luck fix hai, nobody can change it. Wo karmon ka phal hai, wo bhogna hi padega.",
  },
  karma: {
    share: "88%",
    label: "Karma",
    text: "Ab chashma pehen ke jo dikhna clear ho gaya, wo 88% karma hai. Jo rest 88% hai, usko change kar sakte hain.",
  },
  how: {
    question: "Kaise?",
    answer: [
      "Chashme ko doctor ne dilwaya. Doctor means GURU, means a 3rd person.",
      "So search for a GURU or a 3rd person, jo aapko life ka chashma dilwa de.",
    ],
  },
  closing: "Yahi Krishna Consciousness hai.",
};
