import "server-only";
import { z } from "zod";
import { computeKpChart, type KpCusp, type KpPlanet } from "./engine";
import { vimshottari, type DashaPeriod } from "./lords";
import { computeSignificators, type KpSignificators } from "./significators";
import { localToUtc } from "./time";

const isZone = (z: string) => {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: z });
    return true;
  } catch {
    return false;
  }
};

/** Birth details as entered by a visitor (validated on the server). */
export const birthInputSchema = z.object({
  name: z.string().trim().max(80).default(""),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter the date of birth"),
  time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Enter the time of birth"),
  place: z.string().trim().min(1, "Choose the place of birth").max(200),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  zone: z.string().refine(isZone, "Unknown timezone"),
  /** Manual UTC offset in minutes, overriding the timezone database (e.g. for old local times). */
  offsetMinutes: z.number().min(-14 * 60).max(14 * 60).optional(),
});
export type BirthInput = z.input<typeof birthInputSchema>;
export type BirthData = z.output<typeof birthInputSchema>;

export interface KpChartResult {
  input: BirthData;
  utcMs: number;
  offsetMinutes: number;
  ayanamsa: number;
  ayanamsaShown: number;
  planets: KpPlanet[];
  cusps: KpCusp[];
  significators: KpSignificators;
  dasha: DashaPeriod[];
}

export function buildKpChart(data: BirthData): KpChartResult {
  const [year, month, day] = data.date.split("-").map(Number);
  const [hour, minute, second = 0] = data.time.split(":").map(Number);
  if (year < 1800 || year > 2399) throw new Error("Year must be between 1800 and 2399");
  const { utcMs, offsetMinutes } = localToUtc({ year, month, day, hour, minute, second }, data.zone, data.offsetMinutes);
  const chart = computeKpChart(utcMs, data.lat, data.lon);
  const moon = chart.planets.find((p) => p.key === "Mo")!;
  return {
    input: data,
    utcMs,
    offsetMinutes,
    ayanamsa: chart.ayanamsa,
    ayanamsaShown: chart.ayanamsaShown,
    planets: chart.planets,
    cusps: chart.cusps,
    significators: computeSignificators(chart.planets, chart.cusps),
    dasha: vimshottari(utcMs, moon.lon, 3),
  };
}
