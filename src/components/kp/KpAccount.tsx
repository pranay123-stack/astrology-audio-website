"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Copy, LayoutGrid, Loader2, LogIn, Save } from "lucide-react";
import type { BirthInput } from "@/lib/kp/build";
import { useVisitor } from "@/lib/auth/visitor";
import { useI18n } from "@/lib/i18n/client";
import { localePath } from "@/lib/i18n";

/** localStorage key: this browser's edit keys, by chart id (charts made while signed out). */
const KEYS_KEY = "kp-chart-keys";

function readKeys(): Record<string, string> {
  try {
    return JSON.parse(window.localStorage.getItem(KEYS_KEY) ?? "{}") as Record<string, string>;
  } catch {
    return {};
  }
}
function keyFor(id: string): string | null {
  return readKeys()[id] ?? null;
}
function rememberKey(id: string, key: string) {
  try {
    window.localStorage.setItem(KEYS_KEY, JSON.stringify({ ...readKeys(), [id]: key }));
  } catch {
    /* storage blocked: the chart is saved, but this browser cannot edit it later */
  }
}

export interface SavedChart {
  id: string;
  name: string;
  birth: BirthInput;
  notes: string;
  is_shared: boolean;
  pinned: boolean;
  view_count: number;
  last_viewed_at: string | null;
  created_at: string;
  updated_at: string;
}

/** A chart opened by its link. `is_owner`: this visitor may edit it (and sees its notes). */
export interface LinkedChart extends Omit<SavedChart, "view_count" | "last_viewed_at"> {
  is_owner: boolean;
}

/** One row of the public list of every chart (no notes). */
export type PublicChart = Pick<SavedChart, "id" | "name" | "birth" | "created_at" | "updated_at">;

/**
 * Charts are public: anyone saves a chart without signing in and anyone opens any chart. Changes
 * go through the kp_chart_* functions, which allow them for the signed-in account that made the
 * chart, the browser that made it (its key, kept in localStorage) or an administrator. Signed-in
 * visitors also get their own charts (RLS: own rows only) for the dashboard, with pins and views.
 */
export function useKpAccount() {
  const { client: sb, ready, user, signIn, signOut } = useVisitor();
  const [charts, setCharts] = useState<SavedChart[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    if (!sb) return;
    const { data } = await sb.from("kp_charts").select("id, name, birth, notes, is_shared, pinned, view_count, last_viewed_at, created_at, updated_at").order("created_at", { ascending: false }).limit(500);
    setCharts((data as SavedChart[]) ?? []);
    setLoaded(true);
  }, [sb]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load the signed-in user's charts
    if (user) void refresh();
    else setCharts([]);
  }, [user, refresh]);

  const save = async (name: string, birth: BirthInput): Promise<string | null> => {
    if (!sb) return null;
    const key = `${crypto.randomUUID()}${crypto.randomUUID()}`.replaceAll("-", "");
    const { data, error } = await sb.rpc("kp_chart_create", { p_name: name, p_birth: birth, p_key: key });
    if (error || typeof data !== "string") return null;
    rememberKey(data, key);
    if (user) await refresh();
    return data;
  };
  const saveNotes = async (id: string, notes: string) => {
    if (!sb) return false;
    const { data, error } = await sb.rpc("kp_chart_set_notes", { p_id: id, p_key: keyFor(id), p_notes: notes });
    const ok = !error && data === true;
    if (ok) setCharts((cs) => cs.map((c) => (c.id === id ? { ...c, notes } : c)));
    return ok;
  };
  /** Changes the birth details of a saved chart in place (same id and link, notes kept). */
  const update = async (id: string, name: string, birth: BirthInput) => {
    if (!sb) return false;
    const { data, error } = await sb.rpc("kp_chart_edit", { p_id: id, p_key: keyFor(id), p_name: name, p_birth: birth });
    const ok = !error && data === true;
    if (ok) setCharts((cs) => cs.map((c) => (c.id === id ? { ...c, name, birth, updated_at: new Date().toISOString() } : c)));
    return ok;
  };
  /** Pins are for signed-in visitors' own charts (the dashboard). */
  const setPinned = async (id: string, pinned: boolean) => {
    if (!sb) return false;
    const { error } = await sb.from("kp_charts").update({ pinned }).eq("id", id);
    if (!error) setCharts((cs) => cs.map((c) => (c.id === id ? { ...c, pinned } : c)));
    return !error;
  };
  /** Counts a view of the owner's own chart (the dashboard's "viewed" figures). */
  const markViewed = useCallback(
    async (id: string) => {
      if (!sb) return;
      await sb.rpc("kp_chart_viewed", { p_id: id });
      const now = new Date().toISOString();
      setCharts((cs) => cs.map((c) => (c.id === id ? { ...c, view_count: c.view_count + 1, last_viewed_at: now } : c)));
    },
    [sb],
  );
  /** Opens any chart by id. Null when it does not exist. */
  const get = useCallback(
    async (id: string): Promise<LinkedChart | null> => {
      if (!sb) return null;
      const { data, error } = await sb.rpc("kp_chart_get", { p_id: id, p_key: keyFor(id) });
      if (error || !Array.isArray(data) || !data.length) return null;
      return data[0] as LinkedChart;
    },
    [sb],
  );
  /** Every chart, newest first, matching `q` (name or place). */
  const list = useCallback(
    async (q: string): Promise<PublicChart[] | null> => {
      if (!sb) return null;
      const { data, error } = await sb.rpc("kp_chart_list", { p_q: q.trim(), p_limit: 500 });
      return error ? null : ((data as PublicChart[]) ?? []);
    },
    [sb],
  );
  const remove = async (id: string) => {
    if (!sb) return false;
    const { data, error } = await sb.rpc("kp_chart_delete", { p_id: id, p_key: keyFor(id) });
    if (user) await refresh();
    return !error && data === true;
  };

  return { enabled: !!sb, ready, user, charts, loaded, refresh, signIn, signOut, save, update, setPinned, markViewed, get, list, saveNotes, remove };
}

export type KpAccount = ReturnType<typeof useKpAccount>;

/** Beside the new-chart form for signed-out visitors: sign in for a dashboard, or browse every chart. */
export function KpSignInCard({ account }: { account: KpAccount }) {
  const { t, lang } = useI18n();
  const a = t.kp.account;
  if (!account.enabled || account.user) return null;
  return (
    <div className="card space-y-3 p-5" data-testid="kp-signin">
      <h2 className="text-xl font-semibold">{a.myCharts}</h2>
      <p className="text-sm text-ink/80">{a.signInHint}</p>
      <button type="button" className="btn-ghost w-full" onClick={() => void account.signIn()}>
        <LogIn className="h-4 w-4" aria-hidden /> {a.signIn}
      </button>
      <Link href={localePath(lang, "/kp-chart/all")} className="btn-ghost w-full" data-testid="kp-browse">
        <LayoutGrid className="h-4 w-4" aria-hidden /> {t.kp.dash.browse}
      </Link>
    </div>
  );
}

/** Notes editor for a chart the visitor may edit (only they see the notes). */
export function KpNotes({ account, savedId, initial }: { account: KpAccount; savedId: string; initial: string }) {
  const { t } = useI18n();
  const a = t.kp.account;
  const [notes, setNotes] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  return (
    <section className="card space-y-3 p-5" aria-labelledby="kp-notes">
      <div className="flex items-center justify-between gap-3">
        <h2 id="kp-notes" className="text-2xl font-semibold">{a.notes}</h2>
        <span className="text-xs text-emerald-300" data-testid="kp-saved">{a.saved}</span>
      </div>
      <p className="text-xs text-muted">{a.notesPrivate}</p>
      <textarea className="input min-h-40" value={notes} maxLength={20000} placeholder={a.notesPlaceholder} onChange={(e) => setNotes(e.target.value)} />
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="btn-ghost"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            const ok = await account.saveNotes(savedId, notes);
            setBusy(false);
            setStatus(ok ? a.notesSaved : a.error);
          }}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />} {a.saveNotes}
        </button>
        {status && <p className="text-sm text-muted" role="status">{status}</p>}
      </div>
    </section>
  );
}

/** A chart's link, to copy or send on WhatsApp (every chart is public). */
export function KpSharePanel({ id, name }: { id: string; name: string }) {
  const { t, lang } = useI18n();
  const a = t.kp.account;
  const [copied, setCopied] = useState(false);
  const url = typeof window === "undefined" ? "" : `${window.location.origin}${localePath(lang, `/kp-chart/${id}`)}`;

  return (
    <div className="w-full space-y-3 rounded-xl border border-line p-4" data-testid="kp-share-panel">
      <p className="text-sm font-semibold">{a.shareTitle}</p>
      <p className="text-sm text-ink/80">{a.shareOn}</p>
      <div className="flex flex-wrap items-center gap-2">
        <input readOnly className="input min-w-0 flex-1 text-xs" value={url} aria-label={a.shareTitle} onFocus={(e) => e.target.select()} data-testid="kp-share-url" />
        <button
          type="button"
          className="btn-ghost shrink-0"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {
              /* clipboard blocked: the link can still be selected in the box */
            }
          }}
        >
          {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />} {copied ? a.copied : a.copy}
        </button>
        <a className="btn-ghost shrink-0" href={`https://wa.me/?text=${encodeURIComponent(`${name || t.kp.chart}\n${url}`)}`} target="_blank" rel="noopener noreferrer">
          {a.whatsapp}
        </a>
      </div>
    </div>
  );
}
