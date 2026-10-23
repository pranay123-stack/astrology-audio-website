/**
 * KP house significations, as the reference KP software (app.kpastro.ai) shows them.
 * Pure functions over a computed chart, so they run anywhere.
 *
 * - Occupancy: a planet occupies the Placidus house whose cusp is the last one before it.
 * - Ownership: a planet owns every house whose cusp falls in a sign it rules. Rahu and Ketu
 *   own nothing; an intercepted sign (no cusp in it) gives no ownership.
 * - ABCD (planet view): A = houses occupied by the planet's star lord, B = houses the planet
 *   occupies, C = houses owned by its star lord, D = houses it owns.
 * - "U" (unoccupied stars): no other of the 9 planets sits in this planet's nakshatras.
 *   Uranus, Neptune, Pluto and Fortuna are not counted.
 */
import { DASHA_ORDER, norm360, SIGN_LORDS, type KpPoint } from "./lords";

/** The nine KP planets used for significations, in table order. */
export const KP9 = ["Su", "Mo", "Ma", "Me", "Ju", "Ve", "Sa", "Ra", "Ke"] as const;
export type Kp9 = (typeof KP9)[number];

interface PlanetLike extends KpPoint {
  key: string;
}
interface CuspLike extends KpPoint {
  house: number;
}

/** House (1–12) containing a longitude, from the 12 cusp longitudes. */
export function houseOf(lon: number, cuspLons: number[]): number {
  for (let i = 0; i < 12; i++) {
    const start = cuspLons[i];
    const end = cuspLons[(i + 1) % 12];
    const span = norm360(end - start);
    if (norm360(lon - start) < span) return i + 1;
  }
  return 12;
}

export interface Signification {
  /** Houses this planet occupies (always one) and owns. */
  occupies: number[];
  owns: number[];
}

export interface KpSignificators {
  /** Per planet: own occupancy/ownership. */
  self: Record<Kp9, Signification>;
  /** Per planet: the ABCD levels. */
  abcd: Record<Kp9, { A: number[]; B: number[]; C: number[]; D: number[] }>;
  /** Per house: planets signifying it at each level (KP "houses" view). */
  houses: Record<number, { A: Kp9[]; B: Kp9[]; C: Kp9[]; D: Kp9[] }>;
  /** Planets with no other planet in their stars. */
  unoccupied: Kp9[];
  /** Per planet, the strength table: star lord, sub lord and self, each with occupied/owned houses. */
  strength: Record<Kp9, { starLord: Kp9; subLord: Kp9; star: Signification; sub: Signification; self: Signification }>;
}

const empty = (): Signification => ({ occupies: [], owns: [] });

export function computeSignificators(planets: PlanetLike[], cusps: CuspLike[]): KpSignificators {
  const cuspLons = [...cusps].sort((a, b) => a.house - b.house).map((c) => c.lon);
  const byKey = new Map(planets.map((p) => [p.key, p]));

  const self = {} as Record<Kp9, Signification>;
  for (const k of KP9) {
    const p = byKey.get(k)!;
    const owns =
      k === "Ra" || k === "Ke"
        ? []
        : cusps
            .filter((c) => SIGN_LORDS[c.signIndex] === k)
            .map((c) => c.house)
            .sort((a, b) => a - b);
    self[k] = { occupies: [houseOf(p.lon, cuspLons)], owns };
  }

  const lordOf = (k: Kp9) => byKey.get(k)!.starLord as Kp9;
  const subOf = (k: Kp9) => byKey.get(k)!.subLord as Kp9;
  const sig = (k: Kp9): Signification => self[k] ?? empty();

  const abcd = {} as KpSignificators["abcd"];
  const strength = {} as KpSignificators["strength"];
  for (const k of KP9) {
    const star = lordOf(k);
    const sub = subOf(k);
    abcd[k] = { A: sig(star).occupies, B: sig(k).occupies, C: sig(star).owns, D: sig(k).owns };
    strength[k] = { starLord: star, subLord: sub, star: sig(star), sub: sig(sub), self: sig(k) };
  }

  const houses: KpSignificators["houses"] = {};
  for (let h = 1; h <= 12; h++) {
    houses[h] = { A: [], B: [], C: [], D: [] };
    for (const k of KP9) {
      for (const level of ["A", "B", "C", "D"] as const) if (abcd[k][level].includes(h)) houses[h][level].push(k);
    }
  }

  const unoccupied = KP9.filter((k) => !KP9.some((other) => other !== k && lordOf(other) === k));
  return { self, abcd, houses, unoccupied, strength };
}

/** True when `k` is one of the nine Vimshottari lords (all KP9 planets are). */
export function isDashaLord(k: string): boolean {
  return (DASHA_ORDER as readonly string[]).includes(k);
}
