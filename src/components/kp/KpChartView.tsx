"use client";

import { Fragment, useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowUp, CalendarDays, ChevronDown, ChevronRight, Globe, MapPin, Plus, Settings, User } from "lucide-react";
import type { KpChartResult } from "@/lib/kp/build";
import { ASPECTS } from "@/lib/kp/aspects";
import { rankHouseSignificators } from "@/lib/kp/house-rank";
import type { KpCusp, KpPlanet } from "@/lib/kp/engine";
import { formatDms, SIGN_LORDS, type DashaPeriod } from "@/lib/kp/lords";
import { KP9, type Kp9, type Signification } from "@/lib/kp/significators";
import { formatOffset } from "@/lib/kp/time";
import { useI18n } from "@/lib/i18n/client";
import { intlLocale } from "@/lib/i18n";
import { PLANET_NAMES, ROMAN, SIGN_GLYPHS, SIGN_NAMES, SOUTH_INDIAN_CELL } from "./names";

type Item = { kind: "planet"; p: KpPlanet } | { kind: "cusp"; c: KpCusp };
type Selected = { kind: "planet"; key: string } | { kind: "cusp"; house: number };

const list = (h: number[]) => (h.length ? h.join(", ") : "–");
/** d°mm'ss" with two-digit degrees, as KP software prints positions inside the chart. */
const dms2 = (deg: number) => formatDms(deg).replace(/^(\d)°/, "0$1°");
const union = (sigs: Signification[]) => ({
  occupies: [...new Set(sigs.flatMap((s) => s.occupies))].sort((a, b) => a - b),
  owns: [...new Set(sigs.flatMap((s) => s.owns))].sort((a, b) => a - b),
});

/** "26.1197°N, 85.3910°E" */
export const formatCoords = (lat: number, lon: number) =>
  `${Math.abs(lat).toFixed(4)}°${lat >= 0 ? "N" : "S"}, ${Math.abs(lon).toFixed(4)}°${lon >= 0 ? "E" : "W"}`;

/** Birth date and local time as the chart header shows them ("Sun, 24 Jul 1994", "07:39:48 pm IST"). */
export function birthMoment(chart: KpChartResult, locale: string) {
  const local = new Date(chart.utcMs + chart.offsetMinutes * 60_000);
  const date = new Intl.DateTimeFormat(locale, { timeZone: "UTC", weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(local);
  const time = new Intl.DateTimeFormat(locale, { timeZone: "UTC", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }).format(local);
  let zone = `UTC${formatOffset(chart.offsetMinutes)}`;
  if (chart.input.offsetMinutes === undefined) {
    try {
      zone =
        new Intl.DateTimeFormat("en-IN", { timeZone: chart.input.zone, timeZoneName: "short" })
          .formatToParts(new Date(chart.utcMs))
          .find((x) => x.type === "timeZoneName")?.value ?? zone;
    } catch {
      /* unknown zone name: keep the UTC offset */
    }
  }
  return { date, time: `${time} ${zone}` };
}

function KpBadges({ chart, full }: { chart: KpChartResult; full?: boolean }) {
  const { t } = useI18n();
  return (
    <span className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-wide sm:text-xs">
      <span className="inline-flex items-center gap-1 rounded bg-rose-400/15 px-2 py-0.5 text-rose-200">
        <User className="h-3 w-3" aria-hidden /> {full ? t.kp.dash.birthChart : t.kp.dash.birth}
      </span>
      <span className="inline-flex items-center gap-1 rounded bg-emerald-400/15 px-2 py-0.5 text-emerald-200">
        <Settings className="h-3 w-3" aria-hidden /> KP New{full && <span className="font-normal normal-case"> | {formatDms(chart.ayanamsaShown)}</span>}
      </span>
    </span>
  );
}

function Badges({ planet, unoccupied }: { planet: KpPlanet; unoccupied: boolean }) {
  const { t } = useI18n();
  return (
    <>
      {planet.retrograde && (
        <sub className="ml-px text-[0.7em] font-bold text-red-300" title={t.kp.retro}>R</sub>
      )}
      {unoccupied && (
        <sup className="ml-0.5 text-[0.7em] font-bold text-sky-300" title={t.kp.unoccupied}>U</sup>
      )}
    </>
  );
}

/** Interactive KP chart: South Indian grid (details open in its centre), tables, aspects and dasha. */
export function KpChartView({ chart, header, createdAt }: { chart: KpChartResult; header?: ReactNode; createdAt?: string }) {
  const { lang, t } = useI18n();
  const k = t.kp;
  const sig = chart.significators;
  const signs = SIGN_NAMES[lang];
  const [abcdView, setAbcdView] = useState<"planets" | "houses">("planets");
  const [tableView, setTableView] = useState<"planets" | "houses">("planets");
  const [house, setHouse] = useState(0);

  const retro = useMemo(() => new Set(chart.planets.filter((p) => p.retrograde).map((p) => p.key as string)), [chart]);
  const isU = (key: string) => sig.unoccupied.includes(key as Kp9);
  /** A lord's abbreviation, red when that planet is retrograde (as in KP software). */
  const lord = (of: string) => <span className={retro.has(of) ? "text-red-300" : undefined}>{of}</span>;
  const fmtDate = (ms: number, withTime = false) =>
    new Intl.DateTimeFormat(intlLocale(lang), {
      timeZone: "UTC",
      day: "numeric",
      month: "short",
      year: "numeric",
      ...(withTime ? { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false } : {}),
    }).format(new Date(ms + (withTime ? chart.offsetMinutes * 60_000 : 0)));
  const asc = chart.cusps[0];
  const moment = birthMoment(chart, intlLocale(lang));
  // With a house picked, the strength table lists only that house's significators, strongest first.
  const rows = house ? rankHouseSignificators(house, sig, chart.aspects) : KP9.map((planet) => ({ planet, level: 0 }));

  return (
    <div className="space-y-6" data-testid="kp-chart">
      <section className="card space-y-4 p-6" data-testid="kp-header">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold">{chart.input.name || k.chart}</h2>
            <KpBadges chart={chart} full />
          </div>
          {header}
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink/90">
          <span className="inline-flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-gold-soft" aria-hidden /> {moment.date}
            <span className="ml-3 tabular-nums">{moment.time}</span>
          </span>
          <span className="inline-flex flex-wrap items-center gap-1.5">
            <ArrowUp className="h-4 w-4 text-gold-soft" aria-hidden /> {k.trueAsc}:{" "}
            <strong>{signs[asc.signIndex]} {formatDms(asc.degInSign)}</strong>
            <span className="text-muted">|</span> SgL {lord(asc.signLord)} · StL {lord(asc.starLord)} · SbL {lord(asc.subLord)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink/90">
          <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-gold-soft" aria-hidden /> {chart.input.place}</span>
          <span className="inline-flex items-center gap-2"><Globe className="h-4 w-4 text-gold-soft" aria-hidden /> {formatCoords(chart.input.lat, chart.input.lon)}</span>
          <span className="text-xs text-muted">{chart.input.zone}</span>
        </div>
        {createdAt && (
          <p className="inline-flex items-center gap-1 text-xs text-muted">
            <Plus className="h-3 w-3" aria-hidden /> {k.dash.created}{" "}
            {new Intl.DateTimeFormat(intlLocale(lang), { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(createdAt))}
          </p>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <ChartGrid chart={chart} lord={lord} isU={isU} moment={moment} />

        {/* ABCD */}
        <section className="card overflow-x-auto p-5" aria-labelledby="kp-abcd">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 id="kp-abcd" className="text-2xl font-semibold">{k.abcd}</h2>
            <ViewToggle value={abcdView} onChange={setAbcdView} />
          </div>
          <table className="w-full table-fixed text-sm" data-testid="kp-abcd-table">
            <thead className="text-left text-xs text-muted">
              <tr><th className="w-[24%] py-2">{abcdView === "planets" ? k.planet : k.house}</th><th>A</th><th>B</th><th>C</th><th>D</th></tr>
            </thead>
            <tbody>
              {abcdView === "planets"
                ? KP9.map((key) => (
                    <tr key={key} className="border-t border-line">
                      <td className="py-2 font-semibold text-gold-soft">{key}{isU(key) && <sup className="ml-0.5 text-[10px] text-sky-300">U</sup>}{retro.has(key) && <sub className="text-[10px] text-red-300">R</sub>}</td>
                      {(["A", "B", "C", "D"] as const).map((l) => <td key={l}>{list(sig.abcd[key][l])}</td>)}
                    </tr>
                  ))
                : Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                    <tr key={h} className="border-t border-line">
                      <td className="py-2 font-bold">{ROMAN[h - 1]}</td>
                      {(["A", "B", "C", "D"] as const).map((l) => <td key={l}>{sig.houses[h][l].join(", ") || "–"}</td>)}
                    </tr>
                  ))}
            </tbody>
          </table>
        </section>

        <div className="lg:col-span-2 xl:col-span-1">
          <DashaList dasha={chart.dasha} fmtDate={fmtDate} />
        </div>
      </div>

      {/* Houses & planets */}
      <section className="card overflow-x-auto p-5" aria-labelledby="kp-planets">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="kp-planets" className="text-2xl font-semibold">{k.housesPlanets}</h2>
          <ViewToggle value={tableView} onChange={setTableView} />
        </div>
        {tableView === "planets" ? (
          <table className="w-full min-w-[720px] text-sm" data-testid="kp-planets-table">
            <thead className="text-left text-xs text-muted">
              <tr>
                <th className="py-2">{k.planet}</th><th>{k.sign}</th><th>{k.position}</th><th>{k.star}</th>
                <th>{k.signLord}</th><th>{k.starLord}</th><th>{k.subLord}</th><th>{k.occupies}</th><th>{k.owns}</th>
              </tr>
            </thead>
            <tbody>
              {chart.planets.map((p) => {
                const s = KP9.includes(p.key as Kp9) ? sig.self[p.key as Kp9] : null;
                return (
                  <tr key={p.key} className="border-t border-line">
                    <td className="py-2 font-semibold text-gold-soft">{p.key}<Badges planet={p} unoccupied={isU(p.key)} /></td>
                    <td>{signs[p.signIndex]}</td>
                    <td className="tabular-nums">{formatDms(p.degInSign)}</td>
                    <td>{p.nakshatra} – {p.pada}</td>
                    <td>{lord(p.signLord)}</td><td>{lord(p.starLord)}</td><td>{lord(p.subLord)}</td>
                    <td>{s ? list(s.occupies) : ""}</td><td>{s ? list(s.owns) : ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <table className="w-full min-w-[640px] text-sm" data-testid="kp-cusps-table">
            <thead className="text-left text-xs text-muted">
              <tr><th className="py-2">{k.house}</th><th>{k.sign}</th><th>{k.position}</th><th>{k.star}</th><th>{k.signLord}</th><th>{k.starLord}</th><th>{k.subLord}</th></tr>
            </thead>
            <tbody>
              {chart.cusps.map((c) => (
                <tr key={c.house} className="border-t border-line">
                  <td className="py-2 font-bold">{ROMAN[c.house - 1]}</td>
                  <td>{signs[c.signIndex]}</td>
                  <td className="tabular-nums">{formatDms(c.degInSign)}</td>
                  <td>{c.nakshatra} – {c.pada}</td>
                  <td>{lord(c.signLord)}</td><td>{lord(c.starLord)}</td><td>{lord(c.subLord)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Aspects */}
      <section className="card overflow-x-auto p-5" aria-labelledby="kp-aspects">
        <h2 id="kp-aspects" className="mb-4 text-2xl font-semibold">{k.aspects}</h2>
        <table className="w-full min-w-[760px] text-sm" data-testid="kp-aspects-table">
          <thead className="text-center text-xs text-muted">
            <tr>
              <th className="py-2 text-left">{k.planet}</th>
              {ASPECTS.map((a) => (
                <th key={a.key} className="px-1 font-normal">
                  <span className="block text-base text-gold-soft" aria-hidden>{a.symbol}</span>
                  {k.aspectNames[a.key]}
                  <span className="block">({a.angle}°)</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-center">
            {KP9.map((key) => (
              <tr key={key} className="border-t border-line">
                <td className="py-2 text-left font-semibold text-gold-soft">{key}</td>
                {ASPECTS.map((a) => <td key={a.key}>{chart.aspects[key][a.key].join(", ")}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Signification and strength */}
      <section className="card overflow-x-auto p-5" aria-labelledby="kp-strength">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 id="kp-strength" className="text-2xl font-semibold">{k.strength}</h2>
          <label className="flex items-center gap-2 text-xs text-muted">
            {k.selectHouse}
            <select className="input w-auto py-1.5 text-sm" value={house} onChange={(e) => setHouse(Number(e.target.value))} data-testid="kp-house-select">
              <option value={0}>{k.allHouses}</option>
              {ROMAN.map((r, i) => <option key={r} value={i + 1}>{k.house} {i + 1} ({r})</option>)}
            </select>
          </label>
        </div>
        <table className="w-full min-w-[760px] text-sm" data-testid="kp-strength-table">
          <thead className="text-center text-xs text-muted">
            <tr>
              {house > 0 && <th rowSpan={2} className="py-2">{k.rank}</th>}
              <th rowSpan={2} className="py-2 text-left">{k.planet}</th>
              {house > 0 && <th rowSpan={2}>{k.level}</th>}
              <th colSpan={2}>{k.starLord}</th><th colSpan={2}>{k.subLord}</th><th colSpan={2}>{k.conjLords}</th>
              <th colSpan={2}>{k.oppLords}</th><th colSpan={2}>{k.self}</th>
            </tr>
            <tr>{Array.from({ length: 5 }, (_, i) => <Fragment key={i}><th>{k.occupied}</th><th>{k.owned}</th></Fragment>)}</tr>
          </thead>
          <tbody className="text-center">
            {rows.map(({ planet: key, level }, i) => {
              const s = sig.strength[key];
              const conj = chart.aspects[key].conjunction;
              const opp = chart.aspects[key].opposition;
              const groups: [Signification | null, string | undefined][] = [
                [s.star, s.starLord],
                [s.sub, s.subLord],
                [conj.length ? union(conj.map((p) => sig.self[p])) : null, conj.join(", ")],
                [opp.length ? union(opp.map((p) => sig.self[p])) : null, opp.join(", ")],
                [s.self, undefined],
              ];
              return (
                <tr key={key} className="border-t border-line">
                  {house > 0 && <td className="py-2 font-semibold">{i + 1}</td>}
                  <td className="py-2 text-left font-semibold text-gold-soft">{key}</td>
                  {house > 0 && <td className="font-semibold">L{level}</td>}
                  {groups.map(([g, by], j) => (
                    <Fragment key={j}>
                      <td title={by}>{g ? list(g.occupies) : "–"}</td>
                      <td title={by}>{g ? list(g.owns) : "–"}</td>
                    </Fragment>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function ViewToggle({ value, onChange }: { value: "planets" | "houses"; onChange: (v: "planets" | "houses") => void }) {
  const { t } = useI18n();
  return (
    <div className="flex shrink-0 rounded-full border border-line p-0.5 text-xs">
      {(["houses", "planets"] as const).map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          aria-pressed={value === v}
          className={`rounded-full px-3 py-1 ${value === v ? "bg-gold text-night" : "text-ink/80"}`}
        >
          {v === "planets" ? t.kp.planetsView : t.kp.housesView}
        </button>
      ))}
    </div>
  );
}

/** South Indian chart. Each planet and cusp is a button; its details replace the centre box. */
function ChartGrid({
  chart,
  lord,
  isU,
  moment,
}: {
  chart: KpChartResult;
  lord: (of: string) => ReactNode;
  isU: (key: string) => boolean;
  moment: { date: string; time: string };
}) {
  const { lang, t } = useI18n();
  const k = t.kp;
  const signs = SIGN_NAMES[lang];
  const [selected, setSelected] = useState<Selected | null>(null);

  const bySign = useMemo(() => {
    const out: Item[][] = Array.from({ length: 12 }, () => []);
    for (const p of chart.planets) out[p.signIndex].push({ kind: "planet", p });
    for (const c of chart.cusps) out[c.signIndex].push({ kind: "cusp", c });
    for (const items of out) items.sort((a, b) => (a.kind === "planet" ? a.p.lon : a.c.lon) - (b.kind === "planet" ? b.p.lon : b.c.lon));
    return out;
  }, [chart]);

  const isSel = (it: Item) =>
    !!selected && (it.kind === "planet" ? selected.kind === "planet" && selected.key === it.p.key : selected.kind === "cusp" && selected.house === it.c.house);
  const point =
    selected?.kind === "planet"
      ? chart.planets.find((p) => p.key === selected.key)
      : selected?.kind === "cusp"
        ? chart.cusps.find((c) => c.house === selected.house)
        : undefined;
  const label = (it: Item) => (it.kind === "planet" ? PLANET_NAMES[lang][it.p.key] : `${k.house} ${it.c.house}`);

  return (
    <section aria-labelledby="kp-chart-heading" className="lg:row-span-1">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 id="kp-chart-heading" className="text-2xl font-semibold">{k.chart}</h2>
        <span className="text-xs text-muted">{k.tapHint}</span>
      </div>
      <div
        className="grid auto-rows-[minmax(5.75rem,auto)] grid-cols-4 overflow-hidden rounded-2xl border border-gold/40 bg-night/60 sm:aspect-square sm:grid-rows-4"
        data-testid="kp-grid"
      >
        {SOUTH_INDIAN_CELL.map(([row, col], signIndex) => {
          const items = bySign[signIndex];
          return (
            <div
              key={signIndex}
              style={{ gridRow: row + 1, gridColumn: col + 1 }}
              className="flex min-w-0 flex-col overflow-hidden border border-gold/25 p-1 sm:p-1.5"
              data-testid={`kp-box-${signIndex}`}
              data-cusps={items.flatMap((it) => (it.kind === "cusp" ? [it.c.house] : [])).join(" ")}
            >
              <div className="flex items-baseline justify-between gap-1 text-[8px] uppercase tracking-wide text-muted sm:text-[11px] xl:text-xs">
                <span className="truncate">
                  <span aria-hidden>{SIGN_GLYPHS[signIndex]} </span>
                  {signs[signIndex]}
                </span>
                <span className="normal-case">{lord(SIGN_LORDS[signIndex])}</span>
              </div>
              <ul className="flex flex-1 flex-col justify-evenly gap-px">
                {items.map((it) => {
                  const key = it.kind === "planet" ? it.p.key : `c${it.c.house}`;
                  const pt = it.kind === "planet" ? it.p : it.c;
                  return (
                    <li key={key}>
                      <button
                        type="button"
                        onClick={() => setSelected(isSel(it) ? null : it.kind === "planet" ? { kind: "planet", key: it.p.key } : { kind: "cusp", house: it.c.house })}
                        aria-pressed={isSel(it)}
                        aria-label={`${label(it)} ${formatDms(pt.degInSign)}`}
                        className={`flex w-full items-baseline gap-1 rounded px-0.5 text-left text-[10px] leading-tight transition sm:text-sm xl:gap-2 xl:px-1 xl:py-0.5 xl:text-base ${
                          isSel(it) ? "bg-gold/25 ring-1 ring-gold" : "hover:bg-white/10"
                        }`}
                        data-testid={`kp-item-${key}`}
                      >
                        {it.kind === "planet" ? (
                          <span className={`w-[2.1em] shrink-0 font-semibold ${it.p.retrograde ? "text-red-300" : "text-gold-soft"}`}>
                            {it.p.key}
                            <Badges planet={it.p} unoccupied={isU(it.p.key)} />
                          </span>
                        ) : (
                          <span className="w-[2.1em] shrink-0 font-bold text-ink">{ROMAN[it.c.house - 1]}</span>
                        )}
                        <span className={`tabular-nums ${it.kind === "planet" ? (it.p.retrograde ? "text-red-300" : "text-gold-soft") : "text-ink/90"}`}>
                          {dms2(pt.degInSign)}
                        </span>
                        <span className="ml-auto hidden shrink-0 text-[9px] text-muted md:inline xl:text-[11px]">
                          {lord(pt.starLord)}·{lord(pt.subLord)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}

        <div className="col-span-2 col-start-2 row-span-2 row-start-2 flex min-w-0 flex-col border border-gold/25 p-2 sm:p-4 xl:p-6" aria-live="polite" data-testid="kp-details">
          {point && selected ? (
            <div className="flex h-full flex-col text-[11px] sm:text-sm xl:text-base">
              <div className="flex items-start justify-between gap-2">
                <p className="font-display text-sm font-semibold text-gold-soft sm:text-xl xl:text-2xl">
                  {selected.kind === "planet" ? selected.key : ROMAN[selected.house - 1]} – {signs[point.signIndex]} {dms2(point.degInSign)}
                </p>
                <button type="button" onClick={() => setSelected(null)} className="btn-ghost shrink-0 px-2 py-1 text-[10px] sm:text-xs" data-testid="kp-details-back">
                  <ArrowLeft className="h-3 w-3" aria-hidden /> {k.back}
                </button>
              </div>
              <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 sm:mt-3 sm:gap-y-1.5 xl:mt-5 xl:gap-y-2.5">
                <dt className="text-muted">{k.sign}</dt><dd className="text-right font-semibold">{signs[point.signIndex]}</dd>
                <dt className="text-muted">{k.star}</dt><dd className="text-right font-semibold">{point.nakshatra} – {point.pada}</dd>
                <dt className="text-muted">{k.signLord}</dt><dd className="text-right font-semibold">{lord(point.signLord)}</dd>
                <dt className="text-muted">{k.starLord}</dt><dd className="text-right font-semibold">{lord(point.starLord)}</dd>
                <dt className="text-muted">{k.subLord}</dt><dd className="text-right font-semibold">{lord(point.subLord)}</dd>
                <dt className="text-muted">{k.subSubLord}</dt><dd className="text-right font-semibold">{lord(point.subSubLord)}</dd>
              </dl>
            </div>
          ) : (
            <div className="flex h-full flex-col gap-2 text-[10px] sm:gap-3 sm:text-sm xl:text-base" data-testid="kp-centre-default">
              <p className="text-center font-display text-base font-semibold sm:text-xl xl:text-2xl">{chart.input.name || k.chart}</p>
              <div className="flex items-center justify-between gap-2">
                <KpBadges chart={chart} />
              </div>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                <CalendarDays className="hidden h-4 w-4 text-gold-soft sm:inline" aria-hidden />
                <span>{moment.date}</span>
                <span className="tabular-nums">{moment.time}</span>
              </p>
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 hidden h-4 w-4 shrink-0 text-gold-soft sm:inline" aria-hidden />
                <span className="line-clamp-2">{chart.input.place}</span>
              </p>
              <p className="flex items-center gap-2">
                <Globe className="hidden h-4 w-4 text-gold-soft sm:inline" aria-hidden />
                <span>{formatCoords(chart.input.lat, chart.input.lon)}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function DashaList({ dasha, fmtDate }: { dasha: DashaPeriod[]; fmtDate: (ms: number) => string }) {
  const { t } = useI18n();
  const [now] = useState(() => Date.now());
  const isNow = (p: DashaPeriod) => p.start <= now && now < p.end;
  const [open, setOpen] = useState<Set<string>>(() => {
    const s = new Set<string>();
    const maha = dasha.find(isNow);
    if (maha) s.add(maha.lord);
    return s;
  });
  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const row = (p: DashaPeriod, id: string, depth: number) => {
    const expandable = !!p.children?.length;
    const expanded = open.has(id);
    return (
      <Fragment key={id}>
        <li>
          <button
            type="button"
            onClick={() => expandable && toggle(id)}
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${isNow(p) ? "bg-gold/15 text-gold-soft" : "hover:bg-white/5"}`}
            style={{ paddingLeft: `${0.75 + depth * 1.25}rem` }}
            aria-expanded={expandable ? expanded : undefined}
          >
            {expandable ? (expanded ? <ChevronDown className="h-4 w-4 shrink-0" aria-hidden /> : <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />) : <span className="w-4 shrink-0" />}
            <span className="flex min-w-0 flex-col">
              <span className="font-semibold">{id}</span>
              <span className="text-xs tabular-nums text-ink/85">
                {fmtDate(p.start)} — {fmtDate(p.end)}
              </span>
            </span>
            {isNow(p) && <span className="ml-auto text-xs">{t.kp.current}</span>}
          </button>
        </li>
        {expandable && expanded && p.children!.map((c) => row(c, `${id}-${c.lord}`, depth + 1))}
      </Fragment>
    );
  };

  return (
    <section className="card p-5" aria-labelledby="kp-dasha" data-testid="kp-dasha">
      <h2 id="kp-dasha" className="mb-4 text-2xl font-semibold">{t.kp.dasha}</h2>
      <ul className="max-h-[42rem] space-y-0.5 overflow-y-auto pr-1">{dasha.map((m) => row(m, m.lord, 0))}</ul>
    </section>
  );
}
