"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Link2, Loader2, LogIn, Save } from "lucide-react";
import type { BirthInput } from "@/lib/kp/build";
import { useVisitor } from "@/lib/auth/visitor";
import { useI18n } from "@/lib/i18n/client";
import { localePath } from "@/lib/i18n";

/** sessionStorage key: birth details of a chart to reopen after the Google sign-in round trip. */
export const PENDING_CHART_KEY = "kp-pending-chart";

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

/** A chart opened by its link: the owner's own, or one someone shared. */
export interface LinkedChart extends Omit<SavedChart, "view_count" | "last_viewed_at"> {
  is_owner: boolean;
}

/** Visitor's session (see useVisitor) and saved charts (Supabase, RLS: own rows only). */
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
    const { data, error } = await sb.from("kp_charts").insert({ name, birth }).select("id").single();
    if (error) return null;
    await refresh();
    return data.id as string;
  };
  const saveNotes = async (id: string, notes: string) => {
    if (!sb) return false;
    const { error } = await sb.from("kp_charts").update({ notes }).eq("id", id);
    if (!error) setCharts((cs) => cs.map((c) => (c.id === id ? { ...c, notes } : c)));
    return !error;
  };
  /** Changes the birth details of a saved chart in place (same id and link, notes kept). */
  const update = async (id: string, name: string, birth: BirthInput) => {
    if (!sb) return false;
    const { error } = await sb.from("kp_charts").update({ name, birth }).eq("id", id);
    if (!error) setCharts((cs) => cs.map((c) => (c.id === id ? { ...c, name, birth, updated_at: new Date().toISOString() } : c)));
    return !error;
  };
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
  const setShared = async (id: string, isShared: boolean) => {
    if (!sb) return false;
    const { error } = await sb.from("kp_charts").update({ is_shared: isShared }).eq("id", id);
    if (!error) setCharts((cs) => cs.map((c) => (c.id === id ? { ...c, is_shared: isShared } : c)));
    return !error;
  };
  /** Opens a chart by id: the visitor's own (signed in) or a shared one. Null when neither. */
  const get = useCallback(
    async (id: string): Promise<LinkedChart | null> => {
      if (!sb) return null;
      const { data, error } = await sb.rpc("kp_chart_get", { p_id: id });
      if (error || !Array.isArray(data) || !data.length) return null;
      return data[0] as LinkedChart;
    },
    [sb],
  );
  const remove = async (id: string) => {
    if (!sb) return;
    await sb.from("kp_charts").delete().eq("id", id);
    await refresh();
  };

  return { enabled: !!sb, ready, user, charts, loaded, refresh, signIn, signOut, save, update, setShared, setPinned, markViewed, get, saveNotes, remove };
}

export type KpAccount = ReturnType<typeof useKpAccount>;

/** Invitation to sign in, beside the new-chart form (saved charts live on the dashboard). */
export function KpSignInCard({ account }: { account: KpAccount }) {
  const { t } = useI18n();
  const a = t.kp.account;
  if (!account.enabled || account.user) return null;
  return (
    <div className="card space-y-3 p-5" data-testid="kp-signin">
      <h2 className="text-xl font-semibold">{a.myCharts}</h2>
      <p className="text-sm text-ink/80">{a.signInHint}</p>
      <button type="button" className="btn-ghost w-full" onClick={() => void account.signIn()}>
        <LogIn className="h-4 w-4" aria-hidden /> {a.signIn}
      </button>
    </div>
  );
}

/** Save button and notes editor for the chart on screen. */
export function KpSaveAndNotes({
  account,
  savedId,
  onSaved,
  name,
  birth,
}: {
  account: KpAccount;
  savedId: string | null;
  onSaved: (id: string) => void;
  name: string;
  birth: BirthInput;
}) {
  const { t } = useI18n();
  const a = t.kp.account;
  const saved = account.charts.find((c) => c.id === savedId);
  const [notes, setNotes] = useState(saved?.notes ?? "");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  if (!account.enabled) return null;

  if (!account.user) {
    // Signing in reloads the page, so remember the birth details to show this chart again afterwards.
    return (
      <div className="card flex items-center justify-between gap-3 p-4">
        <p className="text-sm text-muted">{a.signInHint}</p>
        <button
          type="button"
          className="btn-gold shrink-0"
          data-testid="kp-save-signin"
          onClick={() => {
            try {
              sessionStorage.setItem(PENDING_CHART_KEY, JSON.stringify(birth));
            } catch {
              /* storage blocked: the chart is simply not reopened after sign-in */
            }
            void account.signIn();
          }}
        >
          <LogIn className="h-4 w-4" aria-hidden /> {a.signInToSave}
        </button>
      </div>
    );
  }

  if (!savedId) {
    return (
      <div className="card flex items-center justify-between gap-3 p-4">
        {status && <p className="text-sm text-red-300">{status}</p>}
        <button
          type="button"
          className="btn-gold ml-auto"
          disabled={busy}
          data-testid="kp-save"
          onClick={async () => {
            setBusy(true);
            const id = await account.save(name, birth);
            setBusy(false);
            if (id) onSaved(id);
            else setStatus(a.error);
          }}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />} {a.save}
        </button>
      </div>
    );
  }

  return (
    <section className="card space-y-3 p-5" aria-labelledby="kp-notes">
      <div className="flex items-center justify-between gap-3">
        <h2 id="kp-notes" className="text-2xl font-semibold">{a.notes}</h2>
        <span className="text-xs text-emerald-300">{a.saved}</span>
      </div>
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

/** Owner's sharing switch for a saved chart, with the link to copy or send on WhatsApp. */
export function KpSharePanel({ account, id, name, shared, onShared }: { account: KpAccount; id: string; name: string; shared: boolean; onShared: (v: boolean) => void }) {
  const { t, lang } = useI18n();
  const a = t.kp.account;
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  const url = typeof window === "undefined" ? "" : `${window.location.origin}${localePath(lang, `/kp-chart/${id}`)}`;

  const toggle = async (v: boolean) => {
    setBusy(true);
    const ok = await account.setShared(id, v);
    setBusy(false);
    setError(!ok);
    if (ok) onShared(v);
  };

  return (
    <div className="w-full space-y-3 rounded-xl border border-line p-4" data-testid="kp-share-panel">
      <p className="text-sm font-semibold">{a.shareTitle}</p>
      <p className="text-sm text-ink/80">{shared ? a.shareOn : a.shareOff}</p>
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
        {shared && (
          <a className="btn-ghost shrink-0" href={`https://wa.me/?text=${encodeURIComponent(`${name || t.kp.chart}\n${url}`)}`} target="_blank" rel="noopener noreferrer">
            {a.whatsapp}
          </a>
        )}
      </div>
      <button type="button" className={shared ? "btn-ghost" : "btn-gold"} disabled={busy} onClick={() => void toggle(!shared)} data-testid="kp-share-toggle">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Link2 className="h-4 w-4" aria-hidden />} {shared ? a.turnOff : a.turnOn}
      </button>
      {error && <p className="text-sm text-red-300" role="alert">{a.error}</p>}
    </div>
  );
}
