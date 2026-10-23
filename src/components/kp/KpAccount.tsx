"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { FolderOpen, Loader2, LogIn, LogOut, Save, Trash2 } from "lucide-react";
import type { BirthInput } from "@/lib/kp/build";
import { kpBrowserClient } from "@/lib/kp/browser-client";
import { useI18n } from "@/lib/i18n/client";

export interface SavedChart {
  id: string;
  name: string;
  birth: BirthInput;
  notes: string;
  created_at: string;
}

/** Visitor's session and saved charts (Supabase, RLS: own rows only). */
export function useKpAccount() {
  const sb = kpBrowserClient();
  const [user, setUser] = useState<User | null>(null);
  const [charts, setCharts] = useState<SavedChart[]>([]);

  const refresh = useCallback(async () => {
    if (!sb) return;
    const { data } = await sb.from("kp_charts").select("id, name, birth, notes, created_at").order("created_at", { ascending: false }).limit(500);
    setCharts((data as SavedChart[]) ?? []);
  }, [sb]);

  useEffect(() => {
    if (!sb) return;
    // After the Google redirect the URL carries ?code=…; the client exchanges it, then we tidy the URL.
    const url = new URL(window.location.href);
    if (url.searchParams.has("code")) {
      url.searchParams.delete("code");
      window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    }
    sb.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, [sb]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load the signed-in user's charts
    if (user) void refresh();
    else setCharts([]);
  }, [user, refresh]);

  const signIn = () =>
    sb?.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin + window.location.pathname } });
  const signOut = () => sb?.auth.signOut();

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
    return (
      <div className="card mx-auto flex max-w-2xl flex-col items-start gap-3 p-5 sm:flex-row sm:items-center" data-testid="kp-signin">
        <p className="flex-1 text-sm text-ink/85">{a.signInHint}</p>
        <button type="button" className="btn-gold" onClick={() => void account.signIn()}>
          <LogIn className="h-4 w-4" aria-hidden /> {a.signIn}
        </button>
      </div>
    );
  }

  return (
    <div className="card mx-auto max-w-2xl space-y-4 p-5" data-testid="kp-account">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">{a.signedInAs(account.user.email ?? "")}</p>
        <button type="button" className="btn-ghost px-3 py-1.5 text-xs" onClick={() => void account.signOut()}>
          <LogOut className="h-4 w-4" aria-hidden /> {a.signOut}
        </button>
      </div>
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
  if (!account.enabled || !account.user) return null;

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
