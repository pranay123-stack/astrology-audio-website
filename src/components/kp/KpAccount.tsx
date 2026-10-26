"use client";

import { useCallback, useEffect, useState } from "react";
import { FolderOpen, Loader2, LogIn, Save, Trash2 } from "lucide-react";
import type { BirthInput } from "@/lib/kp/build";
import { useVisitor } from "@/lib/auth/visitor";
import { useI18n } from "@/lib/i18n/client";

/** sessionStorage key: birth details of a chart to reopen after the Google sign-in round trip. */
export const PENDING_CHART_KEY = "kp-pending-chart";

export interface SavedChart {
  id: string;
  name: string;
  birth: BirthInput;
  notes: string;
  created_at: string;
}

/** Visitor's session (see useVisitor) and saved charts (Supabase, RLS: own rows only). */
export function useKpAccount() {
  const { client: sb, user, signIn, signOut } = useVisitor();
  const [charts, setCharts] = useState<SavedChart[]>([]);

  const refresh = useCallback(async () => {
    if (!sb) return;
    const { data } = await sb.from("kp_charts").select("id, name, birth, notes, created_at").order("created_at", { ascending: false }).limit(500);
    setCharts((data as SavedChart[]) ?? []);
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
  const remove = async (id: string) => {
    if (!sb) return;
    await sb.from("kp_charts").delete().eq("id", id);
    await refresh();
  };

  return { enabled: !!sb, user, charts, signIn, signOut, save, saveNotes, remove };
}

export type KpAccount = ReturnType<typeof useKpAccount>;

/** Sign-in bar and the list of saved charts. */
export function KpAccountPanel({ account, onOpen }: { account: KpAccount; onOpen: (c: SavedChart) => void }) {
  const { t, lang } = useI18n();
  const a = t.kp.account;
  if (!account.enabled) return null;

  if (!account.user) {
    // Signing in and out lives in the header's account button; here just a short invitation.
    return (
      <p className="mx-auto flex max-w-2xl flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink/80" data-testid="kp-signin">
        {a.signInHint}
        <button type="button" className="font-semibold text-gold-soft underline-offset-4 hover:underline" onClick={() => void account.signIn()}>
          {a.signIn}
        </button>
      </p>
    );
  }

  return (
    <div className="card mx-auto max-w-2xl space-y-4 p-5" data-testid="kp-account">
      <div>
        <h2 className="mb-2 text-xl font-semibold">{a.myCharts}</h2>
        {account.charts.length === 0 ? (
          <p className="text-sm text-muted">{a.none}</p>
        ) : (
          <ul className="divide-y divide-line">
            {account.charts.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-2 text-sm">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{c.name || c.birth.place}</span>
                  <span className="text-xs text-muted">
                    {new Intl.DateTimeFormat(lang === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${c.birth.date}T00:00:00Z`))} · {c.birth.time} · {c.birth.place.split(",")[0]}
                  </span>
                </span>
                <button type="button" className="btn-ghost px-3 py-1.5 text-xs" onClick={() => onOpen(c)}>
                  <FolderOpen className="h-4 w-4" aria-hidden /> {a.open}
                </button>
                <button
                  type="button"
                  className="rounded-full p-2 text-muted hover:text-red-300"
                  aria-label={a.delete}
                  onClick={() => {
                    if (window.confirm(a.confirmDelete)) void account.remove(c.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
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
