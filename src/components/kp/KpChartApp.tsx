"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, LayoutGrid, Loader2, MapPin, Pencil, Pin, PinOff, RotateCcw, Save, Search, Share2, Sparkles, Trash2 } from "lucide-react";
import { createKpChart } from "@/app/[lang]/kp-chart/actions";
import type { BirthInput, KpChartResult } from "@/lib/kp/build";
import { useI18n } from "@/lib/i18n/client";
import { localePath } from "@/lib/i18n";
import { formatOffset } from "@/lib/kp/time";
import { KpNotes, KpSharePanel, KpSignInCard, useKpAccount } from "./KpAccount";
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
 * Birth-details form and the resulting interactive KP chart. Every chart made here is saved at
 * once (no sign-in needed) and lives at /kp-chart/<id> (`initialId` when opened by that link).
 * Charts are public: anyone opens and shares any chart; only its owner edits it and sees its notes.
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
  const [notes, setNotes] = useState("");
  const [pinned, setPinned] = useState(false);
  const [createdAt, setCreatedAt] = useState<string | undefined>(undefined);
  const [menuOpen, setMenuOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const router = useRouter();
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
  /** Where the list came from: the bundled suggestions while typing, or OpenStreetMap (Search). */
  const [placesFrom, setPlacesFrom] = useState<"suggest" | "search">("suggest");
  const [active, setActive] = useState(-1);
  const typed = useRef(0);
  const [searching, setSearching] = useState(false);
  const [place, setPlace] = useState<Place | null>(null);
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [zone, setZone] = useState("Asia/Kolkata");
  const [offset, setOffset] = useState("");

  /** Puts the chart's own link in the address bar (or the plain page for an unsaved chart). */
  const setUrl = (id: string | null) => {
    try {
      const blank = account.user ? "/kp-chart/new" : "/kp-chart";
      window.history.replaceState(window.history.state, "", localePath(lang, id ? `/kp-chart/${id}` : blank));
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

  /** Suggestions as the visitor types (from the second keystroke's pause), spelling forgiven. */
  const typePlace = (v: string) => {
    setQuery(v);
    // A different place is being typed, so the chosen one no longer applies.
    setPlace(null);
    setLat("");
    setLon("");
    setActive(-1);
    const n = ++typed.current;
    if (!v.trim()) return setPlaces(null);
    setTimeout(async () => {
      if (n !== typed.current) return;
      try {
        const res = await fetch(`/api/kp/places?suggest=1&q=${encodeURIComponent(v.trim())}&lang=${lang}`);
        const body = (await res.json()) as { places?: Place[] };
        if (n !== typed.current) return;
        setPlacesFrom("suggest");
        setPlaces(body.places ?? []);
      } catch {
        /* no suggestions: Search still works */
      }
    }, 150);
  };

  const searchPlaces = async () => {
    if (query.trim().length < 2) return;
    typed.current++;
    setActive(-1);
    setSearching(true);
    setError(null);
    try {
      const res = await fetch(`/api/kp/places?q=${encodeURIComponent(query.trim())}&lang=${lang}`);
      const body = (await res.json()) as { places?: Place[]; error?: string };
      if (!res.ok) setError(body.error ?? k.errors.failed);
      setPlacesFrom("search");
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
      show(input, { id, owner: true, notes, pinned, createdAt }, async () => {
        const ok = await account.update(id, name, input);
        setStatus(ok ? a.updated : a.error);
      });
    } else show(input, null);
  };

  const show = (
    input: BirthInput,
    saved: { id: string; owner: boolean; notes?: string; pinned?: boolean; createdAt?: string } | null,
    after?: () => Promise<void>,
  ) =>
    startTransition(async () => {
      const res = await createKpChart(input);
      if (res.ok) {
        // A new chart is saved straight away, so it has its own link to share.
        let failed = false;
        if (!saved && account.enabled) {
          const id = await account.save(input.name ?? "", input);
          if (id) saved = { id, owner: true, createdAt: new Date().toISOString() };
          else failed = true;
        }
        setLastInput(input);
        setSavedId(saved?.id ?? null);
        setOwner(saved?.owner ?? true);
        setNotes(saved?.notes ?? "");
        setPinned(saved?.pinned ?? false);
        setCreatedAt(saved?.createdAt);
        setMenuOpen(false);
        setShareOpen(false);
        setEditingId(null);
        setStatus(failed ? a.notSaved : null);
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
      if (c.is_owner) void account.markViewed(c.id);
      show(c.birth, { id: c.id, owner: c.is_owner, notes: c.notes, pinned: c.pinned, createdAt: c.created_at });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload only when the link or the signed-in user changes
  }, [initialId, account.enabled, account.ready, userId]);

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
            <div className="flex flex-wrap justify-center gap-3">
              <Link href={localePath(lang, "/kp-chart/all")} className="btn-ghost">
                <LayoutGrid className="h-4 w-4" aria-hidden /> {k.dash.browse}
              </Link>
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
    const onDashboard = mine && account.charts.some((c) => c.id === savedId);
    const item = "flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-white/5";
    const actions = (
      <div className="flex flex-wrap items-center gap-2">
        <Link href={localePath(lang, account.user ? "/kp-chart" : "/kp-chart/all")} className="btn-ghost" data-testid="kp-back-to-charts">
          <ArrowLeft className="h-4 w-4" aria-hidden /> {account.user ? k.dash.back : k.dash.browse}
        </Link>
        {savedId && !owner && lastInput && (
          <button
            type="button"
            className="btn-gold"
            onClick={async () => {
              const id = await account.save(lastInput.name ?? "", lastInput);
              if (!id) return setStatus(a.error);
              setSavedId(id);
              setOwner(true);
              setNotes("");
              setCreatedAt(new Date().toISOString());
              setUrl(id);
            }}
          >
            <Save className="h-4 w-4" aria-hidden /> {a.saveCopy}
          </button>
        )}
        <div className="relative">
          <button type="button" className="btn-gold" onClick={() => setMenuOpen((o) => !o)} aria-expanded={menuOpen} aria-haspopup="menu" data-testid="kp-actions">
            {k.dash.actions} <ChevronDown className="h-4 w-4" aria-hidden />
          </button>
          {menuOpen && (
            <div role="menu" className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-line bg-night shadow-xl">
              {(mine || !savedId) && (
                <button role="menuitem" type="button" className={item} onClick={() => { setMenuOpen(false); edit(); }} data-testid="kp-edit">
                  <Pencil className="h-4 w-4" aria-hidden /> {a.edit}
                </button>
              )}
              {onDashboard && (
                <button
                  role="menuitem"
                  type="button"
                  className={item}
                  data-testid="kp-pin"
                  onClick={async () => {
                    setMenuOpen(false);
                    if (await account.setPinned(savedId, !pinned)) setPinned(!pinned);
                  }}
                >
                  {pinned ? <PinOff className="h-4 w-4" aria-hidden /> : <Pin className="h-4 w-4" aria-hidden />} {pinned ? k.dash.unpin : k.dash.pin}
                </button>
              )}
              {savedId && (
                <button role="menuitem" type="button" className={item} onClick={() => { setMenuOpen(false); setShareOpen(true); }} data-testid="kp-share">
                  <Share2 className="h-4 w-4" aria-hidden /> {a.share}
                </button>
              )}
              <button role="menuitem" type="button" className={item} onClick={() => { setMenuOpen(false); newChart(); }} data-testid="kp-new-chart">
                <RotateCcw className="h-4 w-4" aria-hidden /> {k.newChart}
              </button>
              {mine && (
                <button
                  role="menuitem"
                  type="button"
                  className={`${item} text-red-300`}
                  data-testid="kp-delete"
                  onClick={async () => {
                    setMenuOpen(false);
                    if (!window.confirm(a.confirmDelete)) return;
                    if (!(await account.remove(savedId))) return setStatus(a.error);
                    router.push(localePath(lang, "/kp-chart"));
                  }}
                >
                  <Trash2 className="h-4 w-4" aria-hidden /> {a.delete}
                </button>
              )}
            </div>
          )}
        </div>
        {status && <p className="text-sm text-emerald-300" role="status">{status}</p>}
      </div>
    );
    return (
      <div className="space-y-6">
        {savedId && shareOpen && <KpSharePanel id={savedId} name={lastInput?.name ?? ""} />}
        <KpChartView chart={chart} header={actions} createdAt={createdAt} />
        {mine && <KpNotes key={savedId} account={account} savedId={savedId} initial={notes} />}
      </div>
    );
  }

  // The form; signed-out visitors also see the invitation to sign in (beside it, or below on phones).
  const invite = account.enabled && account.ready && !account.user;
  return (
    <div className={invite ? "mx-auto grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start" : "mx-auto max-w-2xl space-y-4"}>
    {account.user && (
      <Link href={localePath(lang, "/kp-chart")} className="btn-ghost" data-testid="kp-back-to-charts">
        <ArrowLeft className="h-4 w-4" aria-hidden /> {k.dash.back}
      </Link>
    )}
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
            autoComplete="off"
            role="combobox"
            aria-expanded={!!places?.length}
            aria-controls="kp-places"
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 ? `kp-place-${active}` : undefined}
            onChange={(e) => typePlace(e.target.value)}
            onKeyDown={(e) => {
              const n = places?.length ?? 0;
              if (e.key === "ArrowDown" && n) {
                e.preventDefault();
                setActive((i) => (i + 1) % n);
              } else if (e.key === "ArrowUp" && n) {
                e.preventDefault();
                setActive((i) => (i <= 0 ? n - 1 : i - 1));
              } else if (e.key === "Escape") {
                setPlaces(null);
              } else if (e.key === "Enter") {
                e.preventDefault();
                // Enter takes the highlighted suggestion (or the first); with none, searches.
                if (places && n) choose(places[Math.max(active, 0)]);
                else void searchPlaces();
              }
            }}
          />
          <button type="button" className="btn-ghost shrink-0" onClick={() => void searchPlaces()} disabled={searching} data-testid="kp-search">
            {searching ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Search className="h-4 w-4" aria-hidden />}
            {searching ? k.searching : k.search}
          </button>
        </div>
        {places && (
          <ul id="kp-places" role="listbox" className="mt-2 divide-y divide-line overflow-hidden rounded-xl border border-line" data-testid="kp-places">
            {places.length === 0 && <li className="px-4 py-3 text-sm text-muted">{placesFrom === "suggest" ? k.noSuggestions : k.noPlaces}</li>}
            {places.map((p, i) => (
              <li key={`${p.lat},${p.lon}`} id={`kp-place-${i}`} role="option" aria-selected={i === active}>
                <button
                  type="button"
                  tabIndex={-1}
                  className={`flex w-full items-start gap-2 px-4 py-3 text-left text-sm hover:bg-white/5 ${i === active ? "bg-white/10" : ""}`}
                  onClick={() => choose(p)}
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-soft" aria-hidden />
                  <span>{p.label}</span>
                </button>
              </li>
            ))}
            {placesFrom === "suggest" && (
              <li>
                <button type="button" className="w-full px-4 py-2.5 text-left text-xs text-gold-soft hover:bg-white/5" onClick={() => void searchPlaces()} data-testid="kp-search-more">
                  {k.searchMore}
                </button>
              </li>
            )}
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
            <input id="kp-lat" inputMode="decimal" className="input" value={lat} onChange={(e) => setLat(e.target.value)} />
          </div>
          <div>
            <label htmlFor="kp-lon" className="label">{k.lon}</label>
            <input id="kp-lon" inputMode="decimal" className="input" value={lon} onChange={(e) => setLon(e.target.value)} />
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
    {invite && (
      <aside className="lg:sticky lg:top-24">
        <KpSignInCard account={account} />
      </aside>
    )}
    </div>
  );
}
