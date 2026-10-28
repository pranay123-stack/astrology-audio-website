/**
 * Planetary aspects between the nine KP planets, laid out as the reference KP software
 * (app.kpastro.ai) shows them: one row per planet, one column per aspect angle.
 *
 * Orbs were read off a reference chart (24 Jul 1994): a row lists every planet whose distance
 * from the row planet is within the orb of the LISTED planet. The Sun's orb is wider than the
 * others', which is why that chart shows Jupiter–Sun and Saturn–Sun in the Jupiter and Saturn
 * rows but not the reverse in the Sun row. The values are the round numbers consistent with
 * every cell of that chart; more reference charts would narrow them down.
 */
import { norm360, type KpPoint } from "./lords";
import { KP9, type Kp9 } from "./significators";

export const ASPECTS = [
  { key: "conjunction", angle: 0, symbol: "☌" },
  { key: "semiSextile", angle: 30, symbol: "⚺" },
  { key: "semiSquare", angle: 45, symbol: "∠" },
  { key: "sextile", angle: 60, symbol: "⚹" },
  { key: "square", angle: 90, symbol: "□" },
  { key: "trine", angle: 120, symbol: "△" },
  { key: "sesquisquare", angle: 135, symbol: "⚼" },
  { key: "quincunx", angle: 150, symbol: "⚻" },
  { key: "opposition", angle: 180, symbol: "☍" },
] as const;
export type AspectKey = (typeof ASPECTS)[number]["key"];

/** Orb (degrees) of the planet casting the aspect. */
export const ASPECT_ORB: Record<Kp9, number> = { Su: 6, Mo: 4, Ma: 4, Me: 4, Ju: 4, Ve: 4, Sa: 4, Ra: 4, Ke: 4 };

/** Per planet, per aspect: the planets it has that aspect with, in KP9 order. */
export type KpAspects = Record<Kp9, Record<AspectKey, Kp9[]>>;

/** Angular distance 0–180 between two longitudes. */
export function separation(a: number, b: number): number {
  const d = norm360(a - b);
  return d > 180 ? 360 - d : d;
}

export function computeAspects(planets: (KpPoint & { key: string })[]): KpAspects {
  const lon = new Map(planets.map((p) => [p.key, p.lon]));
  const out = {} as KpAspects;
  for (const row of KP9) {
    out[row] = Object.fromEntries(ASPECTS.map((a) => [a.key, [] as Kp9[]])) as Record<AspectKey, Kp9[]>;
    for (const other of KP9) {
      if (other === row) continue;
      const d = separation(lon.get(row)!, lon.get(other)!);
      const hit = ASPECTS.find((a) => Math.abs(d - a.angle) <= ASPECT_ORB[other]);
      if (hit) out[row][hit.key].push(other);
    }
  }
  return out;
}
