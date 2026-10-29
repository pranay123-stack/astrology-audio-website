/**
 * Type-ahead birth-place suggestions from GeoNames (data/places.tsv.gz, built by
 * scripts/build-places.ts): forgiving of spelling, so "kal", "kolkatta" and "calcutta" all find
 * Kolkata. Pure functions; the route loads the data once and calls `searchPlaces`.
 */

export interface PlaceRow {
  name: string;
  /** "Kolkata, West Bengal, India" */
  label: string;
  lat: number;
  lon: number;
  zone: string;
  population: number;
  country: string;
  /** norm() of the name and its other spellings (Calcutta, Bombay …). */
  keys: string[];
  /** sound() of each key. */
  sounds: string[];
}

/** Lower case, no accents, letters and digits only, single spaces. */
export function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * A rough "sounds like" key for Indian and English spellings: consonants only (a leading vowel
 * kept as "a"), aspirates folded (bh → b, kh → k …), c/k/q, z/j, w/v and ph/f merged, doubled
 * letters collapsed. Kolkata, Kalkatta and Calcutta all give "klkt"; Muzaffarpur and Mujaffarpur
 * give "mjfrpr".
 */
export function sound(s: string): string {
  let t = norm(s).replace(/ /g, "");
  if (!t) return "";
  t = t
    .replace(/ph/g, "f")
    .replace(/ch/g, "\u0001")
    .replace(/c(?=[eiy])/g, "s")
    .replace(/[cq]/g, "k")
    .replace(/\u0001/g, "c")
    .replace(/x/g, "ks")
    .replace(/([bdgkpst])h/g, "$1")
    .replace(/z/g, "j")
    .replace(/w/g, "v");
  const lead = /^[aeiouy]/.test(t) ? "a" : "";
  t = t.replace(/[aeiouyh]/g, "");
  return (lead + t).replace(/(.)\1+/g, "$1");
}

/** Edit distance (insert, delete, substitute, swap neighbours), stopping early above `max`. */
export function distance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev2: number[] = [];
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1);
      cur.push(v);
      best = Math.min(best, v);
    }
    if (best > max) return max + 1;
    prev2 = prev;
    prev = cur;
  }
  return prev[b.length];
}

/** Penalty by how the query matched: exact name, start of a spelling, sounds-like, near miss. */
function matchPenalty(row: PlaceRow, q: string, qs: string): number | null {
  if (row.keys[0] === q) return 0;
  if (row.keys[0].startsWith(q)) return 0.4;
  for (let i = 1; i < row.keys.length; i++) if (row.keys[i].startsWith(q)) return 0.8;
  // Word starts: "delhi" finds "New Delhi".
  if (row.keys.some((k) => k.includes(` ${q}`))) return 1.2;
  if (qs.length >= 2 && row.sounds.some((s) => s.startsWith(qs))) return 1.4;
  // Near misses need a few letters to be meaningful ("kolkta", "muzafarpur").
  if (q.replace(/ /g, "").length >= 4 && qs.length >= 3) {
    const max = qs.length >= 6 ? 2 : 1;
    for (const s of row.sounds) {
      if (s[0] !== qs[0]) continue;
      const len = Math.min(s.length, qs.length);
      if (distance(qs, s.slice(0, len), max) <= max || distance(qs, s.slice(0, len + 1), max) <= max) return 2.2;
    }
  }
  return null;
}

/**
 * Best places for what the visitor has typed so far: matches are ranked by how well they match
 * and by size (log of population), with a lift for India, where most visitors are born.
 */
export function searchPlaces(rows: PlaceRow[], query: string, limit = 8): PlaceRow[] {
  const q = norm(query);
  if (!q) return [];
  const qs = sound(q);
  const scored: { row: PlaceRow; score: number }[] = [];
  for (const row of rows) {
    const p = matchPenalty(row, q, qs);
    if (p === null) continue;
    scored.push({ row, score: Math.log10(row.population + 10) + (row.country === "IN" ? 0.7 : 0) - p * 1.5 });
  }
  scored.sort((a, b) => b.score - a.score);
  const seen = new Set<string>();
  const out: PlaceRow[] = [];
  for (const { row } of scored) {
    if (seen.has(row.label)) continue;
    seen.add(row.label);
    out.push(row);
    if (out.length === limit) break;
  }
  return out;
}

/** Parses one line of data/places.tsv: name, other spellings, region, country, lat, lon, zone, population, country code. */
export function parsePlaceLine(line: string): PlaceRow | null {
  const [name, alts, region, countryName, lat, lon, zone, population, country] = line.split("\t");
  if (!name || !zone) return null;
  const keys = [norm(name), ...(alts ? alts.split(",").map(norm) : [])].filter((k, i, all) => k && all.indexOf(k) === i);
  // A name with no Latin letters cannot be typed into the form.
  if (!keys.length || keys[0] !== norm(name)) return null;
  return {
    name,
    label: [name, region, countryName].filter((x, i, all) => x && all.indexOf(x) === i).join(", "),
    lat: Number(lat),
    lon: Number(lon),
    zone,
    population: Number(population) || 0,
    country,
    keys,
    sounds: [...new Set(keys.map(sound))],
  };
}
