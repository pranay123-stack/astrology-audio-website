/**
 * Devanagari (Hindi) → plain Latin letters, for readable URLs: "सूर्य ग्रह" → "surya grah".
 * A simple phonetic scheme, not a scholarly one: long and short vowels share a letter, and the
 * inherent "a" is dropped at the end of a word ("ग्रह" → "grah", "धर्म" → "dharm") unless the
 * word ends in a cluster closing in r, y or v ("शुक्र" → "shukra", "सूर्य" → "surya"), as Hindi is spoken.
 */

const CONSONANTS: Record<string, string> = {
  क: "k", ख: "kh", ग: "g", घ: "gh", ङ: "n",
  च: "ch", छ: "chh", ज: "j", झ: "jh", ञ: "n",
  ट: "t", ठ: "th", ड: "d", ढ: "dh", ण: "n",
  त: "t", थ: "th", द: "d", ध: "dh", न: "n",
  प: "p", फ: "ph", ब: "b", भ: "bh", म: "m",
  य: "y", र: "r", ल: "l", व: "v", ळ: "l",
  श: "sh", ष: "sh", स: "s", ह: "h",
  // Precomposed nukta letters.
  क़: "q", ख़: "kh", ग़: "g", ज़: "z", ड़: "r", ढ़: "rh", फ़: "f", य़: "y",
};

/** Consonant + nukta (़) written as two characters. */
const NUKTA: Record<string, string> = { क: "q", ख: "kh", ग: "g", ज: "z", ड: "r", ढ: "rh", फ: "f", य: "y" };

const VOWELS: Record<string, string> = {
  अ: "a", आ: "a", इ: "i", ई: "i", उ: "u", ऊ: "u", ऋ: "ri", ए: "e", ऐ: "ai", ओ: "o", औ: "au", ऍ: "e", ऑ: "o",
};

const MATRAS: Record<string, string> = {
  "ा": "a", "ि": "i", "ी": "i", "ु": "u", "ू": "u", "ृ": "ri", "े": "e", "ै": "ai", "ो": "o", "ौ": "au", "ॅ": "e", "ॉ": "o",
};

const VIRAMA = "्";
const NUKTA_SIGN = "़";
const SIGNS: Record<string, string> = { "ं": "n", "ँ": "n", "ः": "h" };
const DIGITS = "०१२३४५६७८९";

export function transliterateDevanagari(input: string): string {
  // Work word by word so the final-schwa rule can look at each word's end.
  return input.replace(/[ऀ-ॿ]+/g, (word) => transliterateWord(word));
}

function transliterateWord(word: string): string {
  const chars = [...word.normalize("NFC")];
  let out = "";
  // Index in `out` of a pending inherent "a" that may still be dropped, and whether the consonant
  // carrying it closed a cluster (then the "a" is kept at the end of the word).
  let pendingA = -1;
  let clusterEnd = false;
  let prevVirama = false;
  let syllables = 0;

  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    let cons = CONSONANTS[c];
    if (cons !== undefined) {
      if (chars[i + 1] === NUKTA_SIGN) {
        cons = NUKTA[c] ?? cons;
        i++;
      }
      const next = chars[i + 1];
      if (next === VIRAMA) {
        out += cons;
        i++;
        prevVirama = true;
        pendingA = -1;
        continue;
      }
      if (next !== undefined && MATRAS[next] !== undefined) {
        out += cons + MATRAS[next];
        i++;
        pendingA = -1;
      } else {
        out += cons;
        pendingA = out.length;
        out += "a";
        clusterEnd = prevVirama && (c === "र" || c === "य" || c === "व");
      }
      prevVirama = false;
      syllables++;
      continue;
    }
    prevVirama = false;
    if (VOWELS[c] !== undefined) {
      out += VOWELS[c];
      pendingA = -1;
      syllables++;
    } else if (SIGNS[c] !== undefined) {
      out += SIGNS[c];
      pendingA = -1;
    } else if (DIGITS.includes(c)) {
      out += String(DIGITS.indexOf(c));
      pendingA = -1;
    } else if (MATRAS[c] !== undefined) {
      out += MATRAS[c]; // stray vowel sign
    }
    // Anything else in the block (danda, avagraha, …) is dropped.
  }
  // "ग्रह" → "grah", "भाव" → "bhav"; but "शुक्र" → "shukra", and one-syllable "न" → "na".
  if (pendingA === out.length - 1 && syllables > 1 && !clusterEnd) out = out.slice(0, -1);
  return out;
}
