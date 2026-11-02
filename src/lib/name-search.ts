import { transliterateDevanagari } from "./transliterate";

/**
 * Finding a name as it is typed: one letter, part of a name, or a misspelling ("kholi", "rohith").
 * Hindi is spelled in Latin letters first, so "विराट" finds Virat.
 */
const words = (text: string) =>
  transliterateDevanagari(text)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);

/** Letters that are often swapped when a name is spelled by ear. */
const bySound = (word: string) =>
  word
    .replace(/oo|ou/g, "u")
    .replace(/ee|ie|ey/g, "i")
    .replace(/th/g, "t")
    .replace(/ph/g, "f")
    .replace(/sh/g, "s")
    .replace(/bh/g, "b")
    .replace(/w/g, "v")
    .replace(/y/g, "i")
    .replace(/(.)\1+/g, "$1");

/** Edits needed to turn `a` into `b`; swapping two neighbouring letters counts as one. */
function editDistance(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const change = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + change);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}

const exact = (query: string, word: string) => word.startsWith(query) || (query.length > 1 && word.includes(query));

/** Close enough, for the whole word or the part of it typed so far. */
function close(query: string, word: string): boolean {
  if (query.length < 3) return false;
  const allowed = query.length < 5 ? 1 : 2;
  const q = bySound(query);
  const w = bySound(word);
  return editDistance(q, w) <= allowed || editDistance(q, w.slice(0, q.length)) <= allowed - 1;
}

/**
 * The items whose name matches. Exact matches win; misspellings are tried only when there are none,
 * so "roh" shows Rohit alone rather than also Kohli.
 */
export function searchByName<T>(items: T[], name: (item: T) => string, query: string): T[] {
  const terms = words(query);
  if (!terms.length) return items;
  const named = items.map((item) => ({ item, parts: words(name(item)) }));
  const found = (test: (term: string, word: string) => boolean) =>
    named.filter(({ parts }) => terms.every((term) => parts.some((word) => test(term, word)))).map((n) => n.item);
  const direct = found(exact);
  return direct.length ? direct : found(close);
}
