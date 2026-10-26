"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, MapPin, RotateCcw, Search, Sparkles } from "lucide-react";
import { createKpChart } from "@/app/[lang]/kp-chart/actions";
import type { BirthInput, KpChartResult } from "@/lib/kp/build";
import { useI18n } from "@/lib/i18n/client";
import { formatOffset } from "@/lib/kp/time";
import { KpAccountPanel, KpSaveAndNotes, PENDING_CHART_KEY, useKpAccount, type SavedChart } from "./KpAccount";
import { KpChartView } from "./KpChartView";

interface Place {
  label: string;
  lat: number;
  lon: number;
  zone: string;
}

/** Parses "+05:53" / "-3:30" / "5.5" into minutes; empty → undefined. */
function parseOffset(v: string): number | undefined | null {
  const s = v.trim();
  if (!s) return undefined;
  const m = /^([+-])?(\d{1,2})(?::(\d{2}))?$/.exec(s);
  if (m) {
    const mins = Number(m[2]) * 60 + Number(m[3] ?? 0);
    return m[1] === "-" ? -mins : mins;
  }
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n * 60) : null;
}

/** Birth-details form and the resulting interactive KP chart. */
export function KpChartApp({ initial }: { initial?: KpChartResult | null }) {
  const { lang, t } = useI18n();
  const k = t.kp;
  const [chart, setChart] = useState<KpChartResult | null>(initial ?? null);
  const account = useKpAccount();
  const [savedId, setSavedId] = useState<string | null>(null);
  const [lastInput, setLastInput] = useState<BirthInput | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState<Place[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [place, setPlace] = useState<Place | null>(null);
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [zone, setZone] = useState("Asia/Kolkata");
  const [offset, setOffset] = useState("");

  const choose = (p: Place) => {
    setPlace(p);
    setLat(p.lat.toFixed(4));
    setLon(p.lon.toFixed(4));
    setZone(p.zone);
    setPlaces(null);
    setQuery(p.label.split(",")[0]);
  };

  const searchPlaces = async () => {
    if (query.trim().length < 2) return;
    setSearching(true);
    setError(null);
    try {
      const res = await fetch(`/api/kp/places?q=${encodeURIComponent(query.trim())}&lang=${lang}`);
      const body = (await res.json()) as { places?: Place[]; error?: string };
      if (!res.ok) setError(body.error ?? k.errors.failed);
      setPlaces(body.places ?? []);
    } catch {
      setError(k.errors.failed);
    } finally {
      setSearching(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const la = Number(lat);
    const lo = Number(lon);
    if (!lat || !lon || !Number.isFinite(la) || !Number.isFinite(lo)) return setError(k.errors.place);
    const off = parseOffset(offset);
    if (off === null) return setError(k.offsetHint);
    const input: BirthInput = {
      name,
      date,
      time,
      place: place?.label ?? `${la.toFixed(4)}, ${lo.toFixed(4)}`,
      lat: la,
      lon: lo,
      zone,
      offsetMinutes: off,
    };
    show(input, null);
  };

  const show = (input: BirthInput, id: string | null) =>
    startTransition(async () => {
      const res = await createKpChart(input);
      if (res.ok) {
        setLastInput(input);
        setSavedId(id);
        setChart(res.chart);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else setError(res.error);
    });

  // Back from "Sign in to save": show the chart the visitor was looking at again.
  useEffect(() => {
    let pending: BirthInput | null = null;
    try {
      const raw = sessionStorage.getItem(PENDING_CHART_KEY);
      sessionStorage.removeItem(PENDING_CHART_KEY);
      pending = raw ? (JSON.parse(raw) as BirthInput) : null;
    } catch {
      pending = null;
    }
    if (pending) show(pending, null);
  }, []);

  const openSaved = (c: SavedChart) => {
    setError(null);
    show(c.birth, c.id);
  };

  if (chart) {
    return (
      <div className="space-y-6">
        <button type="button" className="btn-ghost" onClick={() => setChart(null)} data-testid="kp-new-chart">
          <RotateCcw className="h-4 w-4" aria-hidden /> {k.newChart}
        </button>
        {lastInput && (
          <KpSaveAndNotes
            key={savedId ?? "new"}
            account={account}
            savedId={savedId}
            onSaved={setSavedId}
            name={lastInput.name ?? ""}
            birth={lastInput}
          />
        )}
        <KpChartView chart={chart} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
    <KpAccountPanel account={account} onOpen={openSaved} />
    <form onSubmit={submit} className="card mx-auto max-w-2xl space-y-5 p-6 sm:p-8" data-testid="kp-form" noValidate>
      <div>
        <label htmlFor="kp-name" className="label">{k.name}</label>
        <input id="kp-name" className="input" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="kp-date" className="label">{k.date}</label>
          <input id="kp-date" type="date" required className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label htmlFor="kp-time" className="label">{k.time}</label>
          <input id="kp-time" type="time" step={1} required className="input" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
      </div>
      <p className="-mt-3 text-xs text-muted">{k.timeHint}</p>

      <div>
        <label htmlFor="kp-place" className="label">{k.place}</label>
        <div className="flex gap-2">
          <input
            id="kp-place"
            className="input"
            placeholder={k.placePlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void searchPlaces();
              }
            }}
          />
          <button type="button" className="btn-ghost shrink-0" onClick={() => void searchPlaces()} disabled={searching} data-testid="kp-search">
            {searching ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Search className="h-4 w-4" aria-hidden />}
            {searching ? k.searching : k.search}
          </button>
        </div>
        {places && (
          <ul className="mt-2 divide-y divide-line overflow-hidden rounded-xl border border-line" data-testid="kp-places">
            {places.length === 0 && <li className="px-4 py-3 text-sm text-muted">{k.noPlaces}</li>}
            {places.map((p) => (
              <li key={`${p.lat},${p.lon}`}>
                <button type="button" className="flex w-full items-start gap-2 px-4 py-3 text-left text-sm hover:bg-white/5" onClick={() => choose(p)}>
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-soft" aria-hidden />
                  <span>{p.label}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {place && (
          <p className="mt-2 text-xs text-muted" data-testid="kp-chosen">
            {k.chosen}: <span className="text-ink/90">{place.label}</span>
          </p>
        )}
      </div>

      <details className="rounded-xl border border-line px-4 py-3" open={!place && (!!lat || !!lon)}>
        <summary className="cursor-pointer text-sm font-semibold text-ink/90">{k.advanced}</summary>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="kp-lat" className="label">{k.lat}</label>
            <input id="kp-lat" inputMode="decimal" className="input" value={lat} onChange={(e) => { setLat(e.target.value); setPlace(null); }} />
          </div>
          <div>
            <label htmlFor="kp-lon" className="label">{k.lon}</label>
            <input id="kp-lon" inputMode="decimal" className="input" value={lon} onChange={(e) => { setLon(e.target.value); setPlace(null); }} />
          </div>
          <div>
            <label htmlFor="kp-zone" className="label">{k.zone}</label>
            <input id="kp-zone" className="input" value={zone} onChange={(e) => setZone(e.target.value.trim())} />
          </div>
          <div>
            <label htmlFor="kp-offset" className="label">{k.offset}</label>
            <input id="kp-offset" className="input" placeholder={formatOffset(330)} value={offset} onChange={(e) => setOffset(e.target.value)} />
          </div>
        </div>
        <p className="mt-2 text-xs text-muted">{k.offsetHint}</p>
      </details>

      {error && (
        <p role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}
      <button type="submit" className="btn-gold w-full sm:w-auto" disabled={pending} data-testid="kp-submit">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Sparkles className="h-4 w-4" aria-hidden />}
        {pending ? k.making : k.make}
      </button>
    </form>
    </div>
  );
}
