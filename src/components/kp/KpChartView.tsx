"use client";

import { Fragment, useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { KpChartResult } from "@/lib/kp/build";
import type { KpCusp, KpPlanet } from "@/lib/kp/engine";
import { formatDms, SIGN_LORDS, type DashaPeriod } from "@/lib/kp/lords";
import { KP9, type Kp9 } from "@/lib/kp/significators";
import { formatOffset } from "@/lib/kp/time";
import { useI18n } from "@/lib/i18n/client";
import { intlLocale } from "@/lib/i18n";
import { PLANET_NAMES, ROMAN, SIGN_NAMES, SOUTH_INDIAN_CELL } from "./names";

type Item = { kind: "planet"; p: KpPlanet } | { kind: "cusp"; c: KpCusp };

const list = (h: number[]) => (h.length ? h.join(", ") : "–");

function Badges({ planet, unoccupied }: { planet: KpPlanet; unoccupied: boolean }) {
  const { t } = useI18n();
  return (
    <>
      {planet.retrograde && (
        <sup className="ml-0.5 text-[10px] font-bold text-red-300" title={t.kp.retro}>R</sup>
      )}
      {unoccupied && (
        <sup className="ml-0.5 text-[10px] font-bold text-sky-300" title={t.kp.unoccupied}>U</sup>
      )}
    </>
  );
}

/** Interactive KP chart: South Indian grid with clickable boxes, tables and dasha. */
export function KpChartView({ chart }: { chart: KpChartResult }) {
  const { lang, t } = useI18n();
  const k = t.kp;
  const sig = chart.significators;
  const signs = SIGN_NAMES[lang];
  const pname = PLANET_NAMES[lang];
  const [selected, setSelected] = useState<number | null>(null);
  const [abcdView, setAbcdView] = useState<"planets" | "houses">("planets");

  const bySign = useMemo(() => {
    const out: Item[][] = Array.from({ length: 12 }, () => []);
    for (const p of chart.planets) out[p.signIndex].push({ kind: "planet", p });
    for (const c of chart.cusps) out[c.signIndex].push({ kind: "cusp", c });
    for (const items of out) items.sort((a, b) => (a.kind === "planet" ? a.p.lon : a.c.lon) - (b.kind === "planet" ? b.p.lon : b.c.lon));
    return out;
  }, [chart]);

  const isU = (key: string) => sig.unoccupied.includes(key as Kp9);
  const fmtDate = (ms: number, withTime = false) =>
    new Intl.DateTimeFormat(intlLocale(lang), {
      timeZone: "UTC",
      day: "numeric",
      month: "short",
      year: "numeric",
      ...(withTime ? { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false } : {}),
    }).format(new Date(ms + (withTime ? chart.offsetMinutes * 60_000 : 0)));

  const asc = chart.cusps[0];
  const sel = selected === null ? null : bySign[selected];

  return (
    <div className="space-y-8" data-testid="kp-chart">
      {/* Header */}
      <section className="card space-y-2 p-6">
        <h2 className="text-3xl font-semibold">{chart.input.name || k.chart}</h2>
        <p className="text-sm text-ink/85">
          {k.born}: {fmtDate(chart.utcMs, true)} (UTC{formatOffset(chart.offsetMinutes)}) · {chart.input.place}
        </p>
        <p className="text-xs text-muted">
          {chart.input.lat.toFixed(4)}°, {chart.input.lon.toFixed(4)}° · {chart.input.zone} · {k.ayanamsa} {formatDms(chart.ayanamsaShown)}
        </p>
        <p className="text-sm">
          Asc: <strong>{signs[asc.signIndex]} {formatDms(asc.degInSign)}</strong> · {k.signLord} {asc.signLord} · {k.starLord} {asc.starLord} · {k.subLord} {asc.subLord}
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {/* South Indian chart */}
        <section aria-labelledby="kp-chart-heading">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 id="kp-chart-heading" className="text-2xl font-semibold">{k.chart}</h2>
            <span className="text-xs text-muted">{k.tapHint}</span>
          </div>
          <div className="grid aspect-square grid-cols-4 grid-rows-4 overflow-hidden rounded-2xl border border-gold/40 bg-night/60" data-testid="kp-grid">
            {SOUTH_INDIAN_CELL.map(([row, col], signIndex) => {
              const items = bySign[signIndex];
              const active = selected === signIndex;
              return (
                <button
                  key={signIndex}
                  type="button"
                  onClick={() => setSelected(active ? null : signIndex)}
                  aria-pressed={active}
                  aria-label={signs[signIndex]}
                  style={{ gridRow: row + 1, gridColumn: col + 1 }}
                  className={`relative flex min-w-0 flex-col overflow-hidden border border-gold/25 p-1 text-left transition sm:p-1.5 ${
                    active ? "bg-gold/20 ring-2 ring-gold ring-inset" : "hover:bg-white/5"
                  }`}
                  data-testid={`kp-box-${signIndex}`}
                  data-cusps={items.flatMap((it) => (it.kind === "cusp" ? [it.c.house] : [])).join(" ")}
                >
                  <span className="flex items-center justify-between text-[9px] text-muted sm:text-[11px]">
                    <span className="truncate">{signs[signIndex]}</span>
                  </span>
                  <span className="mt-0.5 flex flex-col gap-px">
                    {items.map((it) =>
                      it.kind === "planet" ? (
                        <span key={it.p.key} className="flex items-baseline gap-1 text-[10px] leading-tight sm:text-xs">
                          <span className="font-semibold text-gold-soft">
                            {it.p.key}
                            <Badges planet={it.p} unoccupied={isU(it.p.key)} />
                          </span>
                          <span className="tabular-nums text-ink/90">{formatDms(it.p.degInSign).replace(/"$/, "")}</span>
                          <span className="ml-auto hidden text-[9px] text-muted md:inline">{it.p.starLord}·{it.p.subLord}</span>
                        </span>
                      ) : (
                        <span key={`c${it.c.house}`} className="flex items-baseline gap-1 text-[10px] leading-tight sm:text-xs">
                          <span className="font-bold text-ink">{ROMAN[it.c.house - 1]}</span>
                          <span className="tabular-nums text-ink/80">{formatDms(it.c.degInSign).replace(/"$/, "")}</span>
                          <span className="ml-auto hidden text-[9px] text-muted md:inline">{it.c.starLord}·{it.c.subLord}</span>
                        </span>
                      ),
                    )}
                  </span>
                </button>
              );
            })}
            <div className="col-span-2 col-start-2 row-span-2 row-start-2 flex flex-col items-center justify-center gap-1 border border-gold/25 p-2 text-center">
              <p className="font-display text-base font-semibold sm:text-xl">{chart.input.name || k.chart}</p>
              <p className="text-[10px] text-muted sm:text-xs">{fmtDate(chart.utcMs, true)}</p>
              <p className="text-[10px] text-gold sm:text-xs">KP New</p>
            </div>
          </div>
        </section>

        {/* Box details */}
        <section className="card p-5" aria-live="polite" data-testid="kp-details">
          {sel === null ? (
            <p className="text-sm text-muted">{k.tapHint}.</p>
          ) : (
            <div className="space-y-4">
              <h3 className="text-2xl font-semibold">
                {signs[selected!]} <span className="text-base font-normal text-muted">· {k.signLord} {pname[SIGN_LORDS[selected!]]}</span>
              </h3>
              {sel.length === 0 && <p className="text-sm text-muted">{k.empty}</p>}
              {sel.map((it) =>
                it.kind === "planet" ? (
                  <div key={it.p.key} className="rounded-xl border border-line p-3 text-sm">
                    <p className="font-semibold text-gold-soft">
                      {pname[it.p.key]} ({it.p.key}) {it.p.retrograde && <span className="text-red-300">· {k.retro}</span>}
                    </p>
                    <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
                      <dt className="text-muted">{k.position}</dt><dd>{formatDms(it.p.degInSign)}</dd>
                      <dt className="text-muted">{k.star}</dt><dd>{it.p.nakshatra} – {it.p.pada}</dd>
                      <dt className="text-muted">{k.starLord}</dt><dd>{it.p.starLord}</dd>
                      <dt className="text-muted">{k.subLord}</dt><dd>{it.p.subLord}</dd>
                      <dt className="text-muted">{k.subSubLord}</dt><dd>{it.p.subSubLord}</dd>
                      {KP9.includes(it.p.key as Kp9) && (
                        <>
                          <dt className="text-muted">{k.occupies}</dt><dd>{list(sig.self[it.p.key as Kp9].occupies)}</dd>
                          <dt className="text-muted">{k.owns}</dt><dd>{list(sig.self[it.p.key as Kp9].owns)}</dd>
                          <dt className="text-muted">A · B · C · D</dt>
                          <dd>
                            {(["A", "B", "C", "D"] as const).map((l) => list(sig.abcd[it.p.key as Kp9][l])).join(" · ")}
                          </dd>
                        </>
                      )}
                    </dl>
                  </div>
                ) : (
                  <div key={`c${it.c.house}`} className="rounded-xl border border-line p-3 text-sm">
                    <p className="font-semibold">{k.house} {ROMAN[it.c.house - 1]} ({it.c.house})</p>
                    <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
                      <dt className="text-muted">{k.position}</dt><dd>{formatDms(it.c.degInSign)}</dd>
                      <dt className="text-muted">{k.star}</dt><dd>{it.c.nakshatra} – {it.c.pada}</dd>
                      <dt className="text-muted">{k.signLord}</dt><dd>{it.c.signLord}</dd>
                      <dt className="text-muted">{k.starLord}</dt><dd>{it.c.starLord}</dd>
                      <dt className="text-muted">{k.subLord}</dt><dd>{it.c.subLord}</dd>
                      <dt className="text-muted">{k.subSubLord}</dt><dd>{it.c.subSubLord}</dd>
                    </dl>
                    <p className="mt-2 text-xs text-muted">{k.signifiedBy}</p>
                    <p className="text-xs">
                      {(["A", "B", "C", "D"] as const).map((l) => `${l}: ${sig.houses[it.c.house][l].join(", ") || "–"}`).join(" · ")}
                    </p>
                  </div>
                ),
              )}
            </div>
          )}
        </section>
      </div>

      {/* Planets */}
      <section className="card overflow-x-auto p-5" aria-labelledby="kp-planets">
        <h2 id="kp-planets" className="mb-4 text-2xl font-semibold">{k.planets}</h2>
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
                  <td>{p.signLord}</td><td>{p.starLord}</td><td>{p.subLord}</td>
                  <td>{s ? list(s.occupies) : ""}</td><td>{s ? list(s.owns) : ""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Cusps */}
      <section className="card overflow-x-auto p-5" aria-labelledby="kp-cusps">
        <h2 id="kp-cusps" className="mb-4 text-2xl font-semibold">{k.cusps}</h2>
        <table className="w-full min-w-[640px] text-sm">
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
                <td>{c.signLord}</td><td>{c.starLord}</td><td>{c.subLord}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ABCD */}
        <section className="card overflow-x-auto p-5" aria-labelledby="kp-abcd">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 id="kp-abcd" className="text-2xl font-semibold">{k.abcd}</h2>
            <div className="flex rounded-full border border-line p-0.5 text-xs">
              {(["planets", "houses"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setAbcdView(v)}
                  aria-pressed={abcdView === v}
                  className={`rounded-full px-3 py-1 ${abcdView === v ? "bg-gold text-night" : "text-ink/80"}`}
                >
                  {v === "planets" ? k.planetsView : k.housesView}
                </button>
              ))}
            </div>
          </div>
          <table className="w-full text-sm" data-testid="kp-abcd-table">
            <thead className="text-left text-xs text-muted">
              <tr><th className="py-2">{abcdView === "planets" ? k.planet : k.house}</th><th>A</th><th>B</th><th>C</th><th>D</th></tr>
            </thead>
            <tbody>
              {abcdView === "planets"
                ? KP9.map((key) => (
                    <tr key={key} className="border-t border-line">
                      <td className="py-2 font-semibold text-gold-soft">{key}{isU(key) && <sup className="ml-0.5 text-[10px] text-sky-300">U</sup>}</td>
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

        {/* Signification and strength */}
        <section className="card overflow-x-auto p-5" aria-labelledby="kp-strength">
          <h2 id="kp-strength" className="mb-4 text-2xl font-semibold">{k.strength}</h2>
          <table className="w-full min-w-[460px] text-sm">
            <thead className="text-center text-xs text-muted">
              <tr>
                <th rowSpan={2} className="py-2 text-left">{k.planet}</th>
                <th colSpan={2}>{k.starLord}</th><th colSpan={2}>{k.subLord}</th><th colSpan={2}>{k.self}</th>
              </tr>
              <tr><th>{k.occupied}</th><th>{k.owned}</th><th>{k.occupied}</th><th>{k.owned}</th><th>{k.occupied}</th><th>{k.owned}</th></tr>
            </thead>
            <tbody className="text-center">
              {KP9.map((key) => {
                const s = sig.strength[key];
                return (
                  <tr key={key} className="border-t border-line">
                    <td className="py-2 text-left font-semibold text-gold-soft">{key}</td>
                    <td title={s.starLord}>{list(s.star.occupies)}</td><td>{list(s.star.owns)}</td>
                    <td title={s.subLord}>{list(s.sub.occupies)}</td><td>{list(s.sub.owns)}</td>
                    <td>{list(s.self.occupies)}</td><td>{list(s.self.owns)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      </div>

      <DashaList dasha={chart.dasha} fmtDate={fmtDate} />
    </div>
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
            {expandable ? (expanded ? <ChevronDown className="h-4 w-4" aria-hidden /> : <ChevronRight className="h-4 w-4" aria-hidden />) : <span className="w-4" />}
            <span className="w-16 font-semibold">{id.split("-").join("-")}</span>
            <span className="tabular-nums text-ink/85">
              {fmtDate(p.start)} — {fmtDate(p.end)}
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
      <ul className="space-y-0.5">{dasha.map((m) => row(m, m.lord, 0))}</ul>
    </section>
  );
}
