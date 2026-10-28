"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, MapPin, Pencil, RotateCcw, Save, Search, Sparkles } from "lucide-react";
import { createKpChart } from "@/app/[lang]/kp-chart/actions";
import type { BirthInput, KpChartResult } from "@/lib/kp/build";
import { useI18n } from "@/lib/i18n/client";
import { localePath } from "@/lib/i18n";
import { formatOffset } from "@/lib/kp/time";
import { KpAccountPanel, KpSaveAndNotes, KpSharePanel, PENDING_CHART_KEY, useKpAccount, type SavedChart } from "./KpAccount";
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

/**
 * Birth-details form and the resulting interactive KP chart. A saved chart lives at
 * /kp-chart/<id> (`initialId` when opened by that link): its owner can edit it in place and
 * share the link; anyone else sees it only while sharing is on.
 */
export function KpChartApp({ initialId }: { initialId?: string }) {
  const { lang, t } = useI18n();
  const k = t.kp;
  const a = k.account;
  const [chart, setChart] = useState<KpChartResult | null>(null);
  const [showForm, setShowForm] = useState(!initialId);
  const account = useKpAccount();
  const [savedId, setSavedId] = useState<string | null>(null);
  const [owner, setOwner] = useState(true);
  const [shared, setShared] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [lastInput, setLastInput] = useState<BirthInput | null>(null);
  const [linkState, setLinkState] = useState<"idle" | "loading" | "missing">(initialId ? "loading" : "idle");
  const [status, setStatus] = useState<string | null>(null);
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

  /** Puts the chart's own link in the address bar (or the plain page for an unsaved chart). */
  const setUrl = (id: string | null) => {
    try {
      window.history.replaceState(window.history.state, "", localePath(lang, id ? `/kp-chart/${id}` : "/kp-chart"));
    } catch {
      /* the address bar simply keeps the old link */
    }
  };

  /** Fills the form with a chart's birth details (to edit them), or clears it. */
  const fillForm = (b: BirthInput | null) => {
    setName(b?.name ?? "");
    setDate(b?.date ?? "");
    setTime(b?.time ?? "");
    setQuery(b ? b.place.split(",")[0] : "");
    setPlace(b ? { label: b.place, lat: b.lat, lon: b.lon, zone: b.zone } : null);
    setLat(b ? b.lat.toFixed(4) : "");
    setLon(b ? b.lon.toFixed(4) : "");
    setZone(b?.zone ?? "Asia/Kolkata");
    setOffset(b?.offsetMinutes === undefined ? "" : formatOffset(b.offsetMinutes));
    setPlaces(null);
    setError(null);
  };

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
    if (editingId) {
      const id = editingId;
      show(input, { id, owner: true, shared }, async () => {
        const ok = await account.update(id, name, input);
        setStatus(ok ? a.updated : a.error);
      });
    } else show(input, null);
  };

  const show = (
    input: BirthInput,
    saved: { id: string; owner: boolean; shared: boolean } | null,
    after?: () => Promise<void>,
  ) =>
    startTransition(async () => {
      const res = await createKpChart(input);
      if (res.ok) {
        setLastInput(input);
        setSavedId(saved?.id ?? null);
        setOwner(saved?.owner ?? true);
        setShared(saved?.shared ?? false);
        setEditingId(null);
        setStatus(null);
        setChart(res.chart);
        setShowForm(false);
        setUrl(saved?.id ?? null);
        window.scrollTo({ top: 0, behavior: "smooth" });
        await after?.();
      } else setError(res.error);
    });

  // Opened by its link: load the chart once the visitor's session is known (again after signing in).
  const userId = account.user?.id;
  useEffect(() => {
    if (!initialId) return;
    if (!account.enabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- no accounts here, so no saved charts
      setLinkState("missing");
      return;
    }
    if (!account.ready) return;
    let cancelled = false;
    void account.get(initialId).then((c) => {
      if (cancelled) return;
      if (!c) return setLinkState("missing");
      setLinkState("idle");
      show(c.birth, { id: c.id, owner: c.is_owner, shared: c.is_shared });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload only when the link or the signed-in user changes
  }, [initialId, account.enabled, account.ready, userId]);

  // Back from "Sign in to save": show the chart the visitor was looking at again.
  useEffect(() => {
    if (initialId) return;
    let pending: BirthInput | null = null;
    try {
      const raw = sessionStorage.getItem(PENDING_CHART_KEY);
      sessionStorage.removeItem(PENDING_CHART_KEY);
      pending = raw ? (JSON.parse(raw) as BirthInput) : null;
    } catch {
      pending = null;
    }
    if (pending) show(pending, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on arrival
  }, []);

  const openSaved = (c: SavedChart) => {
    setError(null);
    show(c.birth, { id: c.id, owner: true, shared: c.is_shared });
  };

  const newChart = () => {
    fillForm(null);
    setEditingId(null);
    setSavedId(null);
    setChart(null);
    setShowForm(true);
    setUrl(null);
  };

  const edit = () => {
    if (!lastInput) return;
    fillForm(lastInput);
    setEditingId(savedId && owner ? savedId : null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (linkState !== "idle" && !chart) {
    return (
      <div className="card mx-auto max-w-xl space-y-4 p-6 text-center" data-testid="kp-link-state">
        {linkState === "loading" ? (
          <p className="flex items-center justify-center gap-2 text-sm text-muted">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> {a.opening}
          </p>
        ) : (
          <>
            <p className="font-semibold">{a.notFound}</p>
            {account.enabled && !account.user && <p className="text-sm text-muted">{a.notFoundSignIn}</p>}
            <div className="flex flex-wrap justify-center gap-3">
              {account.enabled && !account.user && (
                <button type="button" className="btn-gold" onClick={() => void account.signIn()}>{a.signIn}</button>
              )}
              <button type="button" className="btn-ghost" onClick={() => { setLinkState("idle"); newChart(); }}>
                <RotateCcw className="h-4 w-4" aria-hidden /> {k.newChart}
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  if (chart && !showForm) {
    const mine = !!savedId && owner;
    const actions = (
      <div className="flex flex-wrap items-start gap-3 pt-2">
        {(mine || !savedId) && (
          <button type="button" className="btn-ghost" onClick={edit} data-testid="kp-edit">
            <Pencil className="h-4 w-4" aria-hidden /> {a.edit}
          </button>
        )}
        <button type="button" className="btn-ghost" onClick={newChart} data-testid="kp-new-chart">
          <RotateCcw className="h-4 w-4" aria-hidden /> {k.newChart}
        </button>
        {savedId && !owner && <span className="self-center text-xs text-muted">{a.sharedChart}</span>}
        {savedId && !owner && account.user && lastInput && (
          <button
            type="button"
            className="btn-gold"
            onClick={async () => {
              const id = await account.save(lastInput.name ?? "", lastInput);
              if (!id) return setStatus(a.error);
              setSavedId(id);
              setOwner(true);
              setShared(false);
              setUrl(id);
            }}
          >
            <Save className="h-4 w-4" aria-hidden /> {a.saveCopy}
          </button>
        )}
        {status && <p className="self-center text-sm text-emerald-300" role="status">{status}</p>}
        {mine && <KpSharePanel account={account} id={savedId} name={lastInput?.name ?? ""} shared={shared} onShared={setShared} />}
      </div>
    );
    return (
      <div className="space-y-6">
        {lastInput && !savedId && (
          <KpSaveAndNotes
            key="new"
            account={account}
            savedId={null}
            onSaved={(id) => {
              setSavedId(id);
              setOwner(true);
              setUrl(id);
            }}
            name={lastInput.name ?? ""}
            birth={lastInput}
          />
        )}
        <KpChartView chart={chart} header={actions} />
        {lastInput && mine && (
          <KpSaveAndNotes key={savedId} account={account} savedId={savedId} onSaved={setSavedId} name={lastInput.name ?? ""} birth={lastInput} />
        )}
      </div>
    );
  }

  // New chart first; saved charts beside it on wide screens, below it on phones.
  return (
    <div className={account.enabled ? "mx-auto grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start" : "mx-auto max-w-2xl"}>
    <form onSubmit={submit} className="card space-y-5 p-6 sm:p-8" data-testid="kp-form" noValidate>
      {editingId && (
        <p className="rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-gold-soft" data-testid="kp-editing">{a.editing}</p>
      )}
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
      <div className="flex flex-wrap gap-3">
        <button type="submit" className="btn-gold w-full sm:w-auto" disabled={pending} data-testid="kp-submit">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Sparkles className="h-4 w-4" aria-hidden />}
          {pending ? k.making : editingId ? a.update : k.make}
        </button>
        {chart && (
          <button type="button" className="btn-ghost w-full sm:w-auto" onClick={() => { setEditingId(null); setShowForm(false); }}>
            {a.cancel}
          </button>
        )}
      </div>
    </form>
    {account.enabled && (
      <aside id="saved-charts" className="scroll-mt-24 lg:sticky lg:top-24">
        <KpAccountPanel account={account} onOpen={openSaved} />
      </aside>
    )}
    </div>
  );
}
