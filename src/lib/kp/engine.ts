import "server-only";
import sweph from "sweph";
import { describe, norm360, type KpPoint } from "./lords";

/**
 * KP chart engine on the Swiss Ephemeris (AGPL-3.0; see LICENSE). Settings reproduce the
 * astrologer's KP software (app.kpastro.ai, "KP New"), verified on 7 reference charts
 * (1959–2026): 127/127 degrees within 0.6" and identical star/sub lords.
 *
 * - Ayanamsa "KP New": mean value 23°46'00" at J2000 + 50.2842"/year, applied to apparent
 *   (nutated) positions, i.e. effective ayanamsa = mean + nutation in longitude.
 * - Houses: Placidus. Nodes: mean. Fortuna: Ascendant + Moon − Sun.
 * - Ephemeris: Swiss Ephemeris' built-in Moshier mode. The reference software computes in this
 *   mode: with it, maha dasha dates match 14/14 and degrees within 0.6"; with the JPL-based data
 *   files a boundary near midnight moved by a day. It also needs no data files on the server.
 */

const C = sweph.constants;
const EPHE = C.SEFLG_MOSEPH;
const FLAGS = EPHE | C.SEFLG_SPEED;
const J2000 = 2451545.0;
const KP_NEW_A0 = 23 + 46 / 60; // degrees at J2000
const KP_NEW_RATE = 50.2842 / 3600; // degrees per Julian year

export const PLANETS = [
  { key: "Su", body: C.SE_SUN },
  { key: "Mo", body: C.SE_MOON },
  { key: "Ma", body: C.SE_MARS },
  { key: "Me", body: C.SE_MERCURY },
  { key: "Ju", body: C.SE_JUPITER },
  { key: "Ve", body: C.SE_VENUS },
  { key: "Sa", body: C.SE_SATURN },
  { key: "Ra", body: C.SE_MEAN_NODE },
  { key: "Ur", body: C.SE_URANUS },
  { key: "Ne", body: C.SE_NEPTUNE },
  { key: "Pl", body: C.SE_PLUTO },
] as const;

export type PlanetKey = (typeof PLANETS)[number]["key"] | "Ke" | "Fo";

export interface KpPlanet extends KpPoint {
  key: PlanetKey;
  /** Degrees per day; negative means moving backwards. */
  speed: number;
  /** Retrograde planet. Rahu and Ketu always move backwards, so (as in KP software) they are never marked. */
  retrograde: boolean;
}

export interface KpCusp extends KpPoint {
  house: number;
}

export interface KpChart {
  /** Julian day (UT) of the moment. */
  jdUt: number;
  utcMs: number;
  lat: number;
  lon: number;
  /** Effective KP New ayanamsa used (mean + nutation), degrees. */
  ayanamsa: number;
  /**
   * The ayanamsa as the reference KP software displays it (whole seconds). It labels the chart
   * only; positions use `ayanamsa`. Matches the displayed value on all 7 reference charts.
   */
  ayanamsaShown: number;
  planets: KpPlanet[];
  cusps: KpCusp[];
}

export function julianDayUt(utcMs: number): number {
  return utcMs / 86_400_000 + 2440587.5;
}

export function kpNewMeanAyanamsa(jdUt: number): number {
  return KP_NEW_A0 + (KP_NEW_RATE * (jdUt - J2000)) / 365.25;
}

function calc(jd: number, body: number) {
  const r = sweph.calc_ut(jd, body, FLAGS);
  if (r.error && !r.data) throw new Error(`Swiss Ephemeris error: ${r.error}`);
  return r.data;
}

/** Full KP chart for a moment (UTC milliseconds) and place (degrees, east and north positive). */
export function computeKpChart(utcMs: number, lat: number, lon: number): KpChart {
  const jd = julianDayUt(utcMs);
  const nutation = sweph.calc_ut(jd, C.SE_ECL_NUT, EPHE).data[2];
  const ayanamsa = kpNewMeanAyanamsa(jd) + nutation;
  const sid = (tropical: number) => norm360(tropical - ayanamsa);

  const planets: KpPlanet[] = PLANETS.map(({ key, body }) => {
    const [tropical, , , speed] = calc(jd, body);
    return { key, ...describe(sid(tropical)), speed, retrograde: key !== "Ra" && speed < 0 };
  });
  const rahu = planets.find((p) => p.key === "Ra")!;
  planets.splice(8, 0, { key: "Ke", ...describe(rahu.lon + 180), speed: rahu.speed, retrograde: false });

  const h = sweph.houses(jd, lat, lon, "P");
  const cusps: KpCusp[] = h.data.houses.map((c: number, i: number) => ({ house: i + 1, ...describe(sid(c)) }));

  const sun = planets.find((p) => p.key === "Su")!.lon;
  const moon = planets.find((p) => p.key === "Mo")!.lon;
  planets.push({ key: "Fo", ...describe(cusps[0].lon + moon - sun), speed: 0, retrograde: false });

  const ayanamsaShown = Math.floor(kpNewMeanAyanamsa(jd) * 3600 - 0.6) / 3600;
  return { jdUt: jd, utcMs, lat, lon, ayanamsa, ayanamsaShown, planets, cusps };
}
