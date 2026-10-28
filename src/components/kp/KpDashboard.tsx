"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Eye, ExternalLink, History, LayoutGrid, List, Loader2, MapPin, Pencil, Pin, PinOff, Plus, Search, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { intlLocale, localePath } from "@/lib/i18n";
import { KpChartApp } from "./KpChartApp";
import { PENDING_CHART_KEY, useKpAccount, type KpAccount, type SavedChart } from "./KpAccount";

type Filter = "createdToday" | "viewedToday" | "recentCreated" | "recentViewed" | "pinned";
const DAY = 86_400_000;
const LAYOUT_KEY = "kp-dashboard-layout";

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};
const ms = (iso: string | null) => (iso ? new Date(iso).getTime() : 0);

/** The charts the dashboard counts for each card, newest first. */
function filterCharts(charts: SavedChart[], f: Filter): SavedChart[] {
  const today = startOfToday();
  const week = Date.now() - 7 * DAY;
  const byCreated = (a: SavedChart, b: SavedChart) => ms(b.created_at) - ms(a.created_at);
  const byViewed = (a: SavedChart, b: SavedChart) => ms(b.last_viewed_at) - ms(a.last_viewed_at);
  switch (f) {
    case "createdToday":
      return charts.filter((c) => ms(c.created_at) >= today).sort(byCreated);
    case "viewedToday":
      return charts.filter((c) => ms(c.last_viewed_at) >= today).sort(byViewed);
    case "recentCreated":
      return charts.filter((c) => ms(c.created_at) >= week).sort(byCreated);
    case "recentViewed":
      return charts.filter((c) => ms(c.last_viewed_at) >= week).sort(byViewed);
    case "pinned":
      return charts.filter((c) => c.pinned).sort(byCreated);
  }
}

function useLayout(): ["grid" | "list", (v: "grid" | "list") => void] {
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is only readable after mount
      if (window.localStorage.getItem(LAYOUT_KEY) === "list") setLayout("list");
    } catch {
      /* default layout */
    }
  }, []);
  const set = (v: "grid" | "list") => {
    setLayout(v);
    try {
      window.localStorage.setItem(LAYOUT_KEY, v);
    } catch {
      /* the choice just isn't remembered */
    }
  };
  return [layout, set];
}

/**
 * /kp-chart: signed-in visitors get their charts dashboard (counts, pinned and recent charts);
 * everyone else gets the new-chart form. /kp-chart/all lists and searches every saved chart.
 */
export function KpDashboard({ view }: { view: "home" | "all" }) {
  const account = useKpAccount();
  const { t } = useI18n();
  // Back from "Sign in to save": the form page reopens the chart the visitor was saving.
  const [pending, setPending] = useState(false);
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sessionStorage is only readable after mount
      if (window.sessionStorage.getItem(PENDING_CHART_KEY)) setPending(true);
    } catch {
      /* storage blocked: nothing to reopen */
    }
  }, []);
  if (pending || !account.enabled || (account.ready && !account.user)) return <KpChartApp />;
  if (!account.ready || !account.loaded) {
    return (
      <p className="flex items-center justify-center gap-2 py-16 text-sm text-muted" data-testid="kp-dashboard-loading">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> {t.kp.dash.loading}
      </p>
    );
  }
  return view === "home" ? <Home account={account} /> : <Browse account={account} />;
}

function Toolbar({ layout, setLayout, browse }: { layout: "grid" | "list"; setLayout: (v: "grid" | "list") => void; browse: boolean }) {
  const { t, lang } = useI18n();
  const d = t.kp.dash;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex rounded-full border border-line p-0.5">
        {(["grid", "list"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setLayout(v)}
            aria-pressed={layout === v}
            aria-label={v === "grid" ? d.grid : d.list}
            className={`rounded-full px-3 py-1.5 ${layout === v ? "bg-gold text-night" : "text-ink/80"}`}
          >
            {v === "grid" ? <LayoutGrid className="h-4 w-4" aria-hidden /> : <List className="h-4 w-4" aria-hidden />}
          </button>
        ))}
      </div>
      <Link href={localePath(lang, "/kp-chart/new")} className="btn-gold" data-testid="kp-create">
        <Plus className="h-4 w-4" aria-hidden /> {d.create}
      </Link>
      {browse && (
        <Link href={localePath(lang, "/kp-chart/all")} className="btn-ghost" data-testid="kp-browse">
          <Search className="h-4 w-4" aria-hidden /> {d.browse}
        </Link>
      )}
    </div>
  );
}

function Home({ account }: { account: KpAccount }) {
  const { t } = useI18n();
  const d = t.kp.dash;
  const [layout, setLayout] = useLayout();
  const cards: { key: Filter; label: string; hint: string; icon: typeof Eye; tone: string }[] = [
    { key: "createdToday", label: d.createdToday, hint: d.createdTodayHint, icon: CalendarDays, tone: "bg-emerald-500/20 text-emerald-200" },
    { key: "viewedToday", label: d.viewedToday, hint: d.viewedTodayHint, icon: Eye, tone: "bg-orange-500/20 text-orange-200" },
    { key: "recentCreated", label: d.recentCreated, hint: d.recentCreatedHint, icon: Sparkles, tone: "bg-sky-500/20 text-sky-200" },
    { key: "recentViewed", label: d.recentViewed, hint: d.recentViewedHint, icon: History, tone: "bg-white/10 text-ink/80" },
    { key: "pinned", label: d.pinned, hint: d.pinnedHint, icon: Pin, tone: "bg-fuchsia-500/20 text-fuchsia-200" },
  ];
  const counts = Object.fromEntries(cards.map((c) => [c.key, filterCharts(account.charts, c.key)])) as Record<Filter, SavedChart[]>;
  // Open on "Created today" like the reference software, or the first card that has charts.
  const [filter, setFilter] = useState<Filter>(() => (["createdToday", "pinned", "recentViewed", "recentCreated"] as Filter[]).find((f) => counts[f].length) ?? "createdToday");
  const active = cards.find((c) => c.key === filter)!;
  const shown = counts[filter];

  return (
    <div className="space-y-10" data-testid="kp-dashboard">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setFilter(c.key)}
            aria-pressed={filter === c.key}
            className={`card flex flex-col gap-3 p-5 text-left transition ${filter === c.key ? "ring-2 ring-gold" : "hover:border-gold/50"}`}
            data-testid={`kp-stat-${c.key}`}
          >
            <span className="flex items-start justify-between gap-3">
              <span className={`grid h-12 w-12 place-items-center rounded-xl ${c.tone}`}>
                <c.icon className="h-6 w-6" aria-hidden />
              </span>
              <span className="text-right">
                <span className="block text-sm text-muted">{c.label}</span>
                <span className="block text-3xl font-semibold tabular-nums">{counts[c.key].length}</span>
              </span>
            </span>
            <span className="border-t border-line pt-2 text-xs text-muted">{c.hint}</span>
          </button>
        ))}
      </div>

      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-3xl font-semibold">
            {active.label} <span className="text-muted">({shown.length})</span>
          </h2>
          <Toolbar layout={layout} setLayout={setLayout} browse />
        </div>
        {account.charts.length === 0 ? (
          <p className="card p-6 text-center text-sm text-muted">{d.none}</p>
        ) : shown.length === 0 ? (
          <p className="card p-6 text-center text-sm text-muted">{d.empty}</p>
        ) : (
          <ChartList charts={shown} layout={layout} account={account} />
        )}
      </section>
    </div>
  );
}

function Browse({ account }: { account: KpAccount }) {
  const { t, lang } = useI18n();
  const d = t.kp.dash;
  const [layout, setLayout] = useLayout();
  const [q, setQ] = useState("");
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const all = [...account.charts].sort((a, b) => ms(b.created_at) - ms(a.created_at));
    return needle ? all.filter((c) => `${c.name} ${c.birth.place}`.toLowerCase().includes(needle)) : all;
  }, [account.charts, q]);

  return (
    <div className="space-y-6" data-testid="kp-browse-all">
      <Link href={localePath(lang, "/kp-chart")} className="text-sm text-gold-soft hover:underline">← {d.back}</Link>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-3xl font-semibold">
          {d.all} <span className="text-muted">({shown.length})</span>
        </h2>
        <Toolbar layout={layout} setLayout={setLayout} browse={false} />
      </div>
      <label className="relative block max-w-md">
        <span className="sr-only">{d.search}</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
        <input className="input pl-9" placeholder={d.search} value={q} onChange={(e) => setQ(e.target.value)} data-testid="kp-browse-search" />
      </label>
      {account.charts.length === 0 ? (
        <p className="card p-6 text-center text-sm text-muted">{d.none}</p>
      ) : shown.length === 0 ? (
        <p className="card p-6 text-center text-sm text-muted">{d.noResults}</p>
      ) : (
        <ChartList charts={shown} layout={layout} account={account} />
      )}
    </div>
  );
}

function ChartList({ charts, layout, account }: { charts: SavedChart[]; layout: "grid" | "list"; account: KpAccount }) {
  return (
    <ul className={layout === "grid" ? "grid gap-5 lg:grid-cols-2" : "space-y-3"} data-testid="kp-chart-list">
      {charts.map((c) => (
        <li key={c.id}>
          <ChartCard chart={c} account={account} compact={layout === "list"} />
        </li>
      ))}
    </ul>
  );
}

function ChartCard({ chart: c, account, compact }: { chart: SavedChart; account: KpAccount; compact: boolean }) {
  const { t, lang } = useI18n();
  const d = t.kp.dash;
  const locale = intlLocale(lang);
  const [y, m, day] = c.birth.date.split("-").map(Number);
  const birthDate = new Intl.DateTimeFormat(locale, { timeZone: "UTC", weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(new Date(Date.UTC(y, m - 1, day)));
  const short = (iso: string) => new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
  const edited = ms(c.updated_at) - ms(c.created_at) > 60_000;
  const href = localePath(lang, `/kp-chart/${c.id}`);

  return (
    <article className={`card flex h-full flex-col gap-3 ${compact ? "p-4" : "p-5"}`} data-testid="kp-chart-card">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-xl font-semibold">
          <Link href={href} className="hover:text-gold-soft">{c.name || c.birth.place.split(",")[0]}</Link>
        </h3>
        {c.pinned && <Pin className="h-4 w-4 shrink-0 text-fuchsia-200" aria-label={d.pinned} />}
      </div>
      {!compact && (
        <span className="flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-wide">
          <span className="rounded bg-rose-400/15 px-2 py-0.5 text-rose-200">{d.birthChart}</span>
          <span className="rounded bg-emerald-400/15 px-2 py-0.5 text-emerald-200">KP New</span>
        </span>
      )}
      <p className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
        <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-gold-soft" aria-hidden /> {birthDate}</span>
        <span className="tabular-nums">{c.birth.time}</span>
        {compact && <span className="inline-flex items-center gap-2 text-ink/80"><MapPin className="h-4 w-4 text-gold-soft" aria-hidden /> {c.birth.place}</span>}
      </p>
      {!compact && (
        <p className="inline-flex items-center gap-2 text-sm text-ink/85"><MapPin className="h-4 w-4 text-gold-soft" aria-hidden /> {c.birth.place}</p>
      )}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <Eye className="h-3.5 w-3.5" aria-hidden />
          {c.last_viewed_at ? `${d.views(c.view_count)} · ${d.lastViewed} ${relative(c.last_viewed_at, locale)}` : d.notViewed}
        </span>
        <span className="inline-flex items-center gap-3">
          <span className="inline-flex items-center gap-1"><Plus className="h-3 w-3" aria-hidden /> {short(c.created_at)}</span>
          {edited && <span className="inline-flex items-center gap-1"><Pencil className="h-3 w-3" aria-hidden /> {short(c.updated_at)}</span>}
        </span>
        <span className="flex gap-2">
          <Link href={href} className="btn-gold px-3 py-1.5" aria-label={d.open} title={d.open} data-testid="kp-card-open">
            <ExternalLink className="h-4 w-4" aria-hidden />
          </Link>
          <button
            type="button"
            className="btn-ghost px-3 py-1.5"
            onClick={() => void account.setPinned(c.id, !c.pinned)}
            aria-pressed={c.pinned}
            aria-label={c.pinned ? d.unpin : d.pin}
            title={c.pinned ? d.unpin : d.pin}
            data-testid="kp-card-pin"
          >
            {c.pinned ? <PinOff className="h-4 w-4" aria-hidden /> : <Pin className="h-4 w-4" aria-hidden />}
          </button>
        </span>
      </div>
    </article>
  );
}

/** "4 hours ago" in the visitor's language. */
function relative(iso: string, locale: string): string {
  const diff = (ms(iso) - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [["second", 60], ["minute", 60], ["hour", 24], ["day", 30], ["month", 12], ["year", Infinity]];
  let value = diff;
  for (const [unit, size] of steps) {
    if (Math.abs(value) < size) return rtf.format(Math.round(value), unit);
    value /= size;
  }
  return rtf.format(Math.round(value), "year");
}
