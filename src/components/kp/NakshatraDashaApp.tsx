"use client";

import { Fragment, useEffect, useMemo, useState, useTransition } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Clock, MoonStar } from "lucide-react";
import { getNakshatraWindow } from "@/app/[lang]/nakshatra-dasha/actions";
import { NAKSHATRA_NAMES, PLANET_NAMES } from "@/components/kp/names";
import type { NakshatraWindow } from "@/lib/kp/engine";
import { DASHA_YEARS, nakshatraDashaTree, type DashaLord, type DashaPeriod } from "@/lib/kp/lords";
import { localToUtc } from "@/lib/kp/time";
import { useI18n } from "@/lib/i18n/client";

/** Times are entered and shown in Indian time, as the astrologer works in IST. */
const ZONE = "Asia/Kolkata";
/** Dasha → antar → pratyantar → sookshma. */
const LEVELS = 4;

/** "2026-11-10" and "12:51:00" for a moment, in IST. */
function istParts(utcMs: number): { date: string; time: string } {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { timeZone: ZONE, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" })
      .formatToParts(new Date(utcMs))
      .map((x) => [x.type, x.value]),
  );
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}:${p.second}` };
}

function istToUtc(date: string, time: string): number | null {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const t = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(time);
  if (!d || !t) return null;
  return localToUtc(
    { year: +d[1], month: +d[2], day: +d[3], hour: +t[1], minute: +t[2], second: +(t[3] ?? 0) },
    ZONE,
  ).utcMs;
}

/** Ids of the nine first-level groups of a window, which together show the 81 periods. */
const allGroups = (lord: DashaLord) => new Set(nakshatraDashaTree(lord, 0, 1, 1).map((p) => p.lord as string));

export function NakshatraDashaApp() {
  const { lang, t } = useI18n();
  const n = t.nakDasha;
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  /** The moment asked about; its periods are highlighted. */
  const [at, setAt] = useState<number | null>(null);
  const [win, setWin] = useState<NakshatraWindow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState<Set<string>>(new Set());

  const show = (moment: number) =>
    startTransition(async () => {
      setError(null);
      const res = await getNakshatraWindow(moment);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const parts = istParts(moment);
      setDate(parts.date);
      setTime(parts.time);
      setAt(moment);
      setWin(res.window);
      // The astrologer starts from the 81 periods: all nine groups open, deeper levels on a tap.
      setOpen(allGroups(res.window.lord));
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("t", `${parts.date}T${parts.time}`);
        window.history.replaceState(null, "", url);
      } catch {}
    });

  // A shared link (?t=2026-11-10T12:51:00, IST) opens that moment; otherwise the current one.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("t");
    const [d, tm] = q?.split("T") ?? [];
    show((d && tm && istToUtc(d, tm)) || Date.now());
  }, []);

  const tree = useMemo(() => (win ? nakshatraDashaTree(win.lord, win.start, win.end, LEVELS) : []), [win]);
  /** Slot numbers 1–81 of the second-level periods, as on the astrologer's sheet. */
  const slotOf = (path: string[]) => {
    if (path.length !== 2) return null;
    const g = tree.findIndex((p) => p.lord === path[0]);
    const c = tree[g]?.children?.findIndex((p) => p.lord === path[1]) ?? -1;
    return g < 0 || c < 0 ? null : g * 9 + c + 1;
  };

  const planet = (k: string) => PLANET_NAMES[lang][k] ?? k;
  const fmt = useMemo(
    () =>
      new Intl.DateTimeFormat(lang === "hi" ? "hi-IN" : "en-IN", {
        timeZone: ZONE, day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
      }),
    [lang],
  );
  const when = (ms: number) => fmt.format(new Date(ms));
  const duration = (ms: number) => {
    const s = Math.round(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return n.duration(h, m, sec);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const ms = istToUtc(date, time || "00:00:00");
    if (ms === null) setError(n.badInput);
    else show(ms);
  };

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const row = (p: DashaPeriod, id: string, path: string[], depth: number) => {
    const expandable = !!p.children?.length;
    const expanded = open.has(id);
    const running = at !== null && p.start <= at && at < p.end;
    return (
      <Fragment key={id}>
        <li>
          <button
            type="button"
            onClick={() => expandable && toggle(id)}
            className={`grid w-full grid-cols-[1rem_1fr] items-start gap-2 rounded-lg px-3 py-2 text-left text-sm sm:grid-cols-[1rem_minmax(9rem,1fr)_2fr_auto] sm:items-center ${running ? "bg-gold/15 text-gold-soft" : "hover:bg-white/5"}`}
            style={{ paddingLeft: `${0.75 + depth * 1.25}rem` }}
            aria-expanded={expandable ? expanded : undefined}
            data-testid="nak-row"
            data-path={path.join("-")}
          >
            {expandable ? (expanded ? <ChevronDown className="mt-0.5 h-4 w-4 sm:mt-0" aria-hidden /> : <ChevronRight className="mt-0.5 h-4 w-4 sm:mt-0" aria-hidden />) : <span />}
            <span className="font-semibold">
              {slotOf(path) !== null && <span className="mr-2 inline-block w-6 text-right text-xs font-normal tabular-nums text-muted">{slotOf(path)}.</span>}
              {path.map(planet).join(" - ")}
              {depth === 0 && <span className="ml-2 text-xs font-normal text-muted">({n.years(DASHA_YEARS[p.lord])})</span>}
            </span>
            <span className="col-start-2 text-xs tabular-nums text-ink/85 sm:col-start-auto sm:text-sm">
              {when(p.start)} — {when(p.end)}
            </span>
            <span className="col-start-2 flex items-center gap-2 text-xs tabular-nums text-muted sm:col-start-auto sm:justify-end">
              {duration(p.end - p.start)}
              {running && <span className="chip bg-gold/20 text-gold-soft">{n.running}</span>}
            </span>
          </button>
        </li>
        {expandable && expanded && p.children!.map((c) => row(c, `${id}-${c.lord}`, [...path, c.lord], depth + 1))}
      </Fragment>
    );
  };

  return (
    <div className="space-y-8">
      <form onSubmit={submit} className="card grid gap-4 p-5 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end" data-testid="nak-form">
        <div>
          <label htmlFor="nak-date" className="label">{n.date}</label>
          <input id="nak-date" type="date" required className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label htmlFor="nak-time" className="label">{n.time}</label>
          <input id="nak-time" type="time" step={1} className="input" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <button type="submit" className="btn-gold" disabled={pending}>{n.show}</button>
        <button type="button" className="btn-ghost" disabled={pending} onClick={() => show(Date.now())}>
          <Clock className="h-4 w-4" aria-hidden /> {n.now}
        </button>
        <p className="text-xs text-muted sm:col-span-4">{n.timeHint}</p>
      </form>

      {error && <p role="alert" className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm">{error}</p>}

      {win && (
        <section className="card space-y-4 p-5" aria-labelledby="nak-window" data-testid="nak-window">
          <div className="flex flex-wrap items-center gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold-soft">
              <MoonStar className="h-6 w-6" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-muted">{n.moonIn}</p>
              <h2 id="nak-window" className="text-3xl font-semibold" data-testid="nak-name">
                {NAKSHATRA_NAMES[lang][win.index]} <span className="text-gold-soft">· {planet(win.lord)}</span>
              </h2>
            </div>
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted">{n.entered}</dt>
              <dd className="font-semibold tabular-nums" data-testid="nak-start">{when(win.start)}</dd>
            </div>
            <div>
              <dt className="text-muted">{n.leaves}</dt>
              <dd className="font-semibold tabular-nums" data-testid="nak-end">{when(win.end)}</dd>
            </div>
            <div>
              <dt className="text-muted">{n.length}</dt>
              <dd className="font-semibold tabular-nums">{duration(win.end - win.start)}</dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn-ghost" disabled={pending} onClick={() => show(win.start - 1)} data-testid="nak-prev">
              <ChevronLeft className="h-4 w-4" aria-hidden /> {n.prev}
            </button>
            <button type="button" className="btn-ghost" disabled={pending} onClick={() => show(win.end)} data-testid="nak-next">
              {n.next} <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </section>
      )}

      {win && (
        <section className="card p-5" aria-labelledby="nak-dasha" data-testid="nak-dasha">
          <h2 id="nak-dasha" className="text-2xl font-semibold">{n.breakdown}</h2>
          <p className="mt-1 text-sm text-muted">{n.breakdownHint}</p>
          <div className="mb-4 mt-3 flex flex-wrap gap-2">
            <button type="button" className="btn-ghost px-4 py-1.5 text-xs" onClick={() => setOpen(allGroups(win.lord))} data-testid="nak-open81">{n.open81}</button>
            <button type="button" className="btn-ghost px-4 py-1.5 text-xs" onClick={() => setOpen(new Set())} data-testid="nak-close">{n.closeAll}</button>
          </div>
          <ul className="space-y-0.5">{tree.map((p) => row(p, p.lord, [p.lord], 0))}</ul>
        </section>
      )}

      <section className="card space-y-2 p-5 text-sm text-ink/85">
        <h2 className="text-xl font-semibold text-ink">{n.howTitle}</h2>
        {n.how.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </section>
    </div>
  );
}
