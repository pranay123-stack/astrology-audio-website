/**
 * KP (Krishnamurti Paddhati) pure maths: signs, nakshatras, star / sub / sub-sub lords and
 * Vimshottari dasha. No ephemeris here, so it runs anywhere (server, browser, tests).
 */

export const SIGNS = ["Ar", "Ta", "Ge", "Cn", "Le", "Vi", "Li", "Sc", "Sg", "Cp", "Aq", "Pi"] as const;
export type SignCode = (typeof SIGNS)[number];

/** Sign rulers (Aries..Pisces). */
export const SIGN_LORDS = ["Ma", "Ve", "Me", "Mo", "Su", "Me", "Ve", "Ma", "Ju", "Sa", "Sa", "Ju"] as const;

/** Vimshottari order, starting from the lord of Ashwini (0° Aries). */
export const DASHA_ORDER = ["Ke", "Ve", "Su", "Mo", "Ma", "Ra", "Ju", "Sa", "Me"] as const;
export type DashaLord = (typeof DASHA_ORDER)[number];
export const DASHA_YEARS: Record<DashaLord, number> = { Ke: 7, Ve: 20, Su: 6, Mo: 10, Ma: 7, Ra: 18, Ju: 16, Sa: 19, Me: 17 };

export const NAKSHATRAS = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Ashlesha",
  "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
  "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati",
] as const;

export const NAK_SPAN = 360 / 27;

export function norm360(x: number): number {
  return ((x % 360) + 360) % 360;
}

/**
 * Lord of the part of `span` (starting with `startLord`) that `pos` falls in, where the span is
 * divided in Vimshottari proportions. Returns the lord and the sub-division's start and length.
 */
function divide(pos: number, span: number, startLord: DashaLord): { lord: DashaLord; start: number; length: number } {
  const i = DASHA_ORDER.indexOf(startLord);
  let acc = 0;
  for (let k = 0; k < 9; k++) {
    const lord = DASHA_ORDER[(i + k) % 9];
    const length = (span * DASHA_YEARS[lord]) / 120;
    if (pos < acc + length - 1e-12) return { lord, start: acc, length };
    acc += length;
  }
  const lord = DASHA_ORDER[(i + 8) % 9];
  return { lord, start: span - (span * DASHA_YEARS[lord]) / 120, length: (span * DASHA_YEARS[lord]) / 120 };
}

export interface KpPoint {
  /** Sidereal longitude, 0–360. */
  lon: number;
  sign: SignCode;
  signIndex: number;
  /** Degrees within the sign. */
  degInSign: number;
  signLord: string;
  nakshatra: string;
  nakshatraIndex: number;
  pada: number;
  starLord: DashaLord;
  subLord: DashaLord;
  subSubLord: DashaLord;
}

/** Sign, nakshatra, pada and the KP star / sub / sub-sub lords of a sidereal longitude. */
export function describe(lonRaw: number): KpPoint {
  const lon = norm360(lonRaw);
  const signIndex = Math.min(11, Math.floor(lon / 30));
  const n = Math.min(26, Math.floor(lon / NAK_SPAN));
  const starLord = DASHA_ORDER[n % 9];
  const inNak = lon - n * NAK_SPAN;
  const sub = divide(inNak, NAK_SPAN, starLord);
  const subSub = divide(inNak - sub.start, sub.length, sub.lord);
  return {
    lon,
    sign: SIGNS[signIndex],
    signIndex,
    degInSign: lon - signIndex * 30,
    signLord: SIGN_LORDS[signIndex],
    nakshatra: NAKSHATRAS[n],
    nakshatraIndex: n,
    pada: Math.min(4, Math.floor(inNak / (NAK_SPAN / 4)) + 1),
    starLord,
    subLord: sub.lord,
    subSubLord: subSub.lord,
  };
}

/** 23°41'25" style formatting of degrees within a sign (or any angle). */
export function dms(x: number): { d: number; m: number; s: number } {
  const total = Math.round(Math.abs(x) * 3600);
  return { d: Math.floor(total / 3600), m: Math.floor((total % 3600) / 60), s: total % 60 };
}

export function formatDms(x: number): string {
  const { d, m, s } = dms(x);
  return `${d}°${String(m).padStart(2, "0")}'${String(s).padStart(2, "0")}"`;
}

/** Length of a dasha "year" in days. Matches the reference KP software's dasha dates. */
export const DASHA_YEAR_DAYS = 365.2422;
const DAY_MS = 86_400_000;

export interface DashaPeriod {
  lord: DashaLord;
  start: number;
  end: number;
  children?: DashaPeriod[];
}

/** Splits a period into its Vimshottari sub-periods, starting with the period's own lord. */
function subPeriods(lord: DashaLord, start: number, end: number): DashaPeriod[] {
  const total = end - start;
  const i = DASHA_ORDER.indexOf(lord);
  const out: DashaPeriod[] = [];
  let t = start;
  for (let k = 0; k < 9; k++) {
    const l = DASHA_ORDER[(i + k) % 9];
    const len = (total * DASHA_YEARS[l]) / 120;
    out.push({ lord: l, start: t, end: t + len });
    t += len;
  }
  return out;
}

/**
 * Vimshottari maha dashas from birth (UTC ms) and the Moon's sidereal longitude, with antar and
 * pratyantar dashas. Covers `cycles` × 120 years from the start of the birth maha dasha.
 */
export function vimshottari(birthUtcMs: number, moonLon: number, levels: 1 | 2 | 3 = 3): DashaPeriod[] {
  const lon = norm360(moonLon);
  const n = Math.min(26, Math.floor(lon / NAK_SPAN));
  const lord = DASHA_ORDER[n % 9];
  const elapsedFraction = (lon - n * NAK_SPAN) / NAK_SPAN;
  let start = birthUtcMs - elapsedFraction * DASHA_YEARS[lord] * DASHA_YEAR_DAYS * DAY_MS;
  const i = DASHA_ORDER.indexOf(lord);
  const out: DashaPeriod[] = [];
  for (let k = 0; k < 9; k++) {
    const l = DASHA_ORDER[(i + k) % 9];
    const end = start + DASHA_YEARS[l] * DASHA_YEAR_DAYS * DAY_MS;
    const maha: DashaPeriod = { lord: l, start, end };
    if (levels >= 2) {
      maha.children = subPeriods(l, start, end);
      if (levels >= 3) for (const antar of maha.children) antar.children = subPeriods(antar.lord, antar.start, antar.end);
    }
    out.push(maha);
    start = end;
  }
  return out;
}
