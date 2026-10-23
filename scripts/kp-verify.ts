/**
 * Compares the KP engine with charts from the astrologer's KP software (app.kpastro.ai).
 *
 * The reference charts contain real people's birth details, so they are NOT in this repository.
 * Point KP_REFERENCE_FILE at the private JSON file and run:
 *
 *   KP_REFERENCE_FILE=../kp-reference-private/kp-reference-charts.json \
 *     NODE_OPTIONS=--conditions=react-server npx tsx scripts/kp-verify.ts
 *
 * Exits non-zero on any mismatch.
 */
import { readFileSync } from "node:fs";
import { computeKpChart } from "../src/lib/kp/engine";
import { formatDms, SIGNS, vimshottari } from "../src/lib/kp/lords";
import { computeSignificators, KP9 } from "../src/lib/kp/significators";

interface RefItem { key: string | number; sign: string; deg: number; min: number; sec: number; star: string; sub: string }
interface RefChart {
  name: string;
  ayanamsa_shown: [number, number, number];
  date: [number, number, number];
  time_ist: [number, number, number];
  lat: number;
  lon: number;
  items: RefItem[];
  maha_dasha: { lord: string; start: string; end: string };
  /** Extra values read from the reference screens (ABCD table, badges, strength table). */
  checks?: {
    abcd?: Record<string, number[][]>;
    unoccupied?: string[];
    unoccupied_includes?: string[];
    retrograde?: string[];
    retrograde_includes?: string[];
    padas?: Record<string, number>;
    strength_sub?: Record<string, number[][]>;
  };
}

// The reference file uses English 3-letter sign names; the engine uses 2-letter codes.
const SIGN3 = ["Ari", "Tau", "Gem", "Can", "Leo", "Vir", "Lib", "Sco", "Sag", "Cap", "Aqu", "Pis"];
const IST_MS = 5.5 * 3_600_000;

const file = process.env.KP_REFERENCE_FILE;
if (!file) {
  console.error("Set KP_REFERENCE_FILE to the private reference JSON.");
  process.exit(2);
}
const charts: RefChart[] = JSON.parse(readFileSync(file, "utf8"));

let total = 0;
let degOk = 0;
let lordOk = 0;
let worst = 0;
let dashaOk = 0;
let extraTotal = 0;
let extraOk = 0;
const problems: string[] = [];

// Dasha dates are compared as UTC calendar dates, as the reference software counts them.
const istDate = (ms: number) => new Date(ms).toISOString().slice(0, 10);

for (const c of charts) {
  const [y, mo, d] = c.date;
  const [h, mi, s] = c.time_ist;
  const utcMs = Date.UTC(y, mo - 1, d, h, mi, s) - IST_MS;
  const chart = computeKpChart(utcMs, c.lat, c.lon);
  const byKey = new Map<string, { lon: number; starLord: string; subLord: string }>();
  for (const p of chart.planets) byKey.set(p.key, p);
  for (const cu of chart.cusps) byKey.set(String(cu.house), cu);

  for (const it of c.items) {
    total++;
    const ours = byKey.get(String(it.key))!;
    const ref = SIGN3.indexOf(it.sign) * 30 + it.deg + it.min / 60 + it.sec / 3600;
    const diff = ((((ours.lon - ref + 180) % 360) + 360) % 360 - 180) * 3600;
    const dOk = Math.abs(diff) <= 1.5;
    const lOk = ours.starLord === it.star && ours.subLord === it.sub;
    degOk += dOk ? 1 : 0;
    lordOk += lOk ? 1 : 0;
    if (dOk) worst = Math.max(worst, Math.abs(diff));
    if (!dOk || !lOk) {
      const label = typeof it.key === "number" ? `cusp ${it.key}` : it.key;
      problems.push(
        `${c.name} ${label}: ref ${it.sign} ${it.deg}°${it.min}'${it.sec}" ${it.star}·${it.sub} | ours ${SIGNS[Math.floor(ours.lon / 30)]} ${formatDms(ours.lon % 30)} ${ours.starLord}·${ours.subLord} (${diff.toFixed(1)}")`,
      );
    }
  }

  const moon = chart.planets.find((p) => p.key === "Mo")!;
  extraTotal++;
  const shown = formatDms(chart.ayanamsaShown);
  const refShown = `${c.ayanamsa_shown[0]}°${String(c.ayanamsa_shown[1]).padStart(2, "0")}'${String(c.ayanamsa_shown[2]).padStart(2, "0")}"`;
  if (shown === refShown) extraOk++;
  else problems.push(`${c.name} displayed ayanamsa: ref ${refShown} ours ${shown}`);

  const x = c.checks;
  if (x) {
    const sig = computeSignificators(chart.planets, chart.cusps);
    const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
    const check = (label: string, ok: boolean, detail: string) => {
      extraTotal++;
      extraOk += ok ? 1 : 0;
      if (!ok) problems.push(`${c.name} ${label}: ${detail}`);
    };
    for (const [k, [A, B, C, D]] of Object.entries(x.abcd ?? {})) {
      const ours = sig.abcd[k as (typeof KP9)[number]];
      check(`ABCD ${k}`, same([ours.A, ours.B, ours.C, ours.D], [A, B, C, D]), `ref ${JSON.stringify([A, B, C, D])} ours ${JSON.stringify([ours.A, ours.B, ours.C, ours.D])}`);
    }
    for (const [k, [dep, own]] of Object.entries(x.strength_sub ?? {})) {
      const ours = sig.strength[k as (typeof KP9)[number]].sub;
      check(`sub lord houses ${k}`, same([ours.occupies, ours.owns], [dep, own]), `ref ${JSON.stringify([dep, own])} ours ${JSON.stringify([ours.occupies, ours.owns])}`);
    }
    if (x.unoccupied) check("U badges", same([...sig.unoccupied].sort(), [...x.unoccupied].sort()), `ref ${x.unoccupied} ours ${sig.unoccupied}`);
    for (const k of x.unoccupied_includes ?? []) check(`U badge ${k}`, sig.unoccupied.includes(k as (typeof KP9)[number]), `ours ${sig.unoccupied}`);
    const retro = chart.planets.filter((p) => p.retrograde).map((p) => p.key);
    if (x.retrograde) check("R badges", same([...retro].sort(), [...x.retrograde].sort()), `ref ${x.retrograde} ours ${retro}`);
    for (const k of x.retrograde_includes ?? []) check(`R badge ${k}`, retro.includes(k as never), `ours ${retro}`);
    for (const [k, pada] of Object.entries(x.padas ?? {})) {
      const ours = chart.planets.find((p) => p.key === k)!.pada;
      check(`pada ${k}`, ours === pada, `ref ${pada} ours ${ours}`);
    }
  }

  // One Vimshottari cycle covers 120 years from birth, which includes every reference period.
  const periods = vimshottari(utcMs, moon.lon, 1);
  const ref = c.maha_dasha;
  const hit = periods.find((p) => p.lord === ref.lord && istDate(p.start).slice(0, 4) === ref.start.slice(0, 4));
  const ok = !!hit && istDate(hit.start) === ref.start && istDate(hit.end) === ref.end;
  dashaOk += ok ? 1 : 0;
  if (!ok) problems.push(`${c.name} dasha ${ref.lord}: ref ${ref.start} → ${ref.end} | ours ${hit ? `${istDate(hit.start)} → ${istDate(hit.end)}` : "not found"}`);
}

console.log(`Charts: ${charts.length}`);
console.log(`Degrees within 1.5": ${degOk}/${total} (largest difference among matches: ${worst.toFixed(2)}")`);
console.log(`Star·sub lords identical: ${lordOk}/${total}`);
console.log(`Maha dasha start and end dates: ${dashaOk * 2}/${charts.length * 2}`);
console.log(`Displayed ayanamsa, tables and badges (ABCD, sub lord houses, U, R, pada): ${extraOk}/${extraTotal}`);
if (problems.length) {
  console.log("\nMismatches:\n  " + problems.join("\n  "));
  process.exit(1);
}
console.log("\nAll values match the reference KP software.");
