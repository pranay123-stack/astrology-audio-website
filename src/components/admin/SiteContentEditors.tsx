"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { saveSiteContent } from "@/app/admin/actions";
import type { KrishnaContent } from "@/content/krishna";
import { POPUP_DELAYS, POPUP_REPEATS, popupIsLive, type PopupContent } from "@/content/popup";
import type { QuoteContent } from "@/content/quote";
import type { Rule } from "@/content/rules";
import { fromZonedInputValue, toZonedInputValue } from "@/lib/dates";
import { imageUrl } from "@/lib/media/urls";
import type { SiteContent, SiteContentKey } from "@/lib/site-content";
import { FileField } from "./FileField";

const toLines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);

function useSave<K extends SiteContentKey>(key: K) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const save = (value: SiteContent[K]) =>
    start(async () => {
      setMessage(null);
      const result = await saveSiteContent(key, value);
      setMessage(result.ok ? { ok: true, text: "Saved. The website is updated." } : { ok: false, text: result.error });
      if (result.ok) router.refresh();
    });
  return { pending, message, save };
}

function SaveBar({ pending, message, onSave, testId }: { pending: boolean; message: { ok: boolean; text: string } | null; onSave: () => void; testId: string }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" className="btn-gold px-6" disabled={pending} onClick={onSave} data-testid={testId}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
        {pending ? "Saving…" : "Save"}
      </button>
      {message && <p role={message.ok ? "status" : "alert"} className={`text-sm ${message.ok ? "text-emerald-200" : "text-red-300"}`} data-testid="content-message">{message.text}</p>}
    </div>
  );
}

function Field({ label, value, onChange, rows = 0, hint }: { label: string; value: string; onChange: (v: string) => void; rows?: number; hint?: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {rows ? (
        <textarea rows={rows} className="input" value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className="input" value={value} onChange={(e) => onChange(e.target.value)} />
      )}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

// ---------------------------------------------------------------------------
// Offer popup
// ---------------------------------------------------------------------------

export function PopupEditor({ initial, timeZone }: { initial: PopupContent; timeZone: string }) {
  const [p, setP] = useState({ ...initial, starts_at: toZonedInputValue(initial.starts_at, timeZone), ends_at: toZonedInputValue(initial.ends_at, timeZone) });
  const { pending, message, save } = useSave("popup");
  const set = (patch: Partial<PopupContent>) => setP({ ...p, ...patch });
  const value = (): PopupContent => ({
    ...p,
    starts_at: p.starts_at ? fromZonedInputValue(p.starts_at, timeZone) : "",
    ends_at: p.ends_at ? fromZonedInputValue(p.ends_at, timeZone) : "",
    version: new Date().toISOString(),
  });
  const [now] = useState(() => Date.now());
  const live = popupIsLive({ ...value(), version: "" }, now);
  const status = !p.enabled ? "Off" : live ? "On: visitors see it now" : p.starts_at && now < Date.parse(fromZonedInputValue(p.starts_at, timeZone)) ? "Starts later" : "Ended or missing a title";
  return (
    <section className="card space-y-4 p-6" data-testid="popup-editor">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold">Offer popup</h2>
        <span className={`chip ${live ? "border border-emerald-400/50 text-emerald-200" : "border border-line text-muted"}`} data-testid="popup-status">{status}</span>
      </div>
      <p className="text-sm text-muted">A box shown to visitors on any page, e.g. a Diwali or BBL offer, after they have spent a while on the website.</p>
      <label className="flex items-center gap-3">
        <input type="checkbox" className="h-5 w-5 accent-[#d4af37]" checked={p.enabled} onChange={(e) => set({ enabled: e.target.checked })} data-testid="popup-enabled" />
        <span className="font-semibold">Show the popup</span>
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title, English site" value={p.title_en} onChange={(title_en) => set({ title_en })} />
        <Field label="Title, Hindi site (optional)" value={p.title_hi} onChange={(title_hi) => set({ title_hi })} />
        <Field label="Text, English site" rows={3} value={p.text_en} onChange={(text_en) => set({ text_en })} />
        <Field label="Text, Hindi site (optional)" rows={3} value={p.text_hi} onChange={(text_hi) => set({ text_hi })} />
        <Field label="Button, English site" value={p.button_en} onChange={(button_en) => set({ button_en })} hint="e.g. “Book now”. Leave empty for no button." />
        <Field label="Button, Hindi site (optional)" value={p.button_hi} onChange={(button_hi) => set({ button_hi })} />
      </div>
      <Field label="Button link" value={p.link} onChange={(link) => set({ link })} hint="A page of this site such as /contact, or a full link such as a WhatsApp link." />
      <FileField
        id="popup-image"
        kind="cover"
        label="Picture (optional)"
        hint="JPG, PNG or WebP, up to 5 MB."
        value={p.image_path}
        previewUrl={initial.image_path ? imageUrl(initial.image_path) : null}
        onChange={(image_path) => set({ image_path })}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="label">Show after</span>
          <select className="input" value={p.delay_seconds} onChange={(e) => set({ delay_seconds: Number(e.target.value) })} data-testid="popup-delay">
            {POPUP_DELAYS.map((s) => (
              <option key={s} value={s}>{s < 60 ? `${s} seconds` : `${s / 60} minute${s > 60 ? "s" : ""}`} on the website</option>
            ))}
          </select>
          <span className="mt-1 block text-xs text-muted">Counted while the visitor moves between pages.</span>
        </label>
        <label className="block">
          <span className="label">After it is closed, show it again</span>
          <select className="input" value={p.repeat_hours} onChange={(e) => set({ repeat_hours: Number(e.target.value) })} data-testid="popup-repeat">
            {POPUP_REPEATS.map((h) => (
              <option key={h} value={h}>{h === 0 ? "Never (only once)" : h === 1 ? "After 1 hour" : h < 48 ? `After ${h} hours` : `After ${h / 24} days`}</option>
            ))}
          </select>
          <span className="mt-1 block text-xs text-muted">Saving a new offer shows it again to everyone.</span>
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="label">Show from (optional)</span>
          <input type="datetime-local" className="input" value={p.starts_at} onChange={(e) => set({ starts_at: e.target.value })} />
        </label>
        <label className="block">
          <span className="label">Show until (optional)</span>
          <input type="datetime-local" className="input" value={p.ends_at} onChange={(e) => set({ ends_at: e.target.value })} />
          <span className="mt-1 block text-xs text-muted">After this time it hides by itself.</span>
        </label>
      </div>
      <SaveBar pending={pending} message={message} onSave={() => save(value())} testId="save-popup" />
    </section>
  );
}

// ---------------------------------------------------------------------------
// Home quote
// ---------------------------------------------------------------------------

export function QuoteEditor({ initial }: { initial: QuoteContent }) {
  const [q, setQ] = useState(initial);
  const { pending, message, save } = useSave("quotes");
  const set = (patch: Partial<QuoteContent>) => setQ({ ...q, ...patch });
  return (
    <section className="card space-y-4 p-6" data-testid="quote-editor">
      <h2 className="text-2xl font-semibold">Quote at the top of the home page</h2>
      <Field label="Quote" rows={2} value={q.text} onChange={(text) => set({ text })} />
      <Field label="By" value={q.author} onChange={(author) => set({ author })} />
      <Field label="About the author, English site" rows={2} value={q.role_en} onChange={(role_en) => set({ role_en })} />
      <Field label="About the author, Hindi site" rows={2} value={q.role_hi} onChange={(role_hi) => set({ role_hi })} />
      <SaveBar pending={pending} message={message} onSave={() => save(q)} testId="save-quote" />
    </section>
  );
}

// ---------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------

interface RuleDraft {
  title: string;
  body: string;
  planet: string;
  chakra: string;
  list: string;
  note: string;
}

const toDraft = (r: Rule): RuleDraft => ({
  title: r.title,
  body: (r.body ?? []).join("\n"),
  planet: r.planet ?? "",
  chakra: r.chakra ?? "",
  list: (r.list ?? []).map((i) => `${i.label}: ${i.text}`).join("\n"),
  note: r.note ?? "",
});

const fromDraft = (d: RuleDraft): Rule => {
  const list = toLines(d.list).map((l) => {
    const at = l.indexOf(":");
    return at > 0 ? { label: l.slice(0, at).trim(), text: l.slice(at + 1).trim() } : { label: l, text: l };
  });
  return {
    title: d.title.trim(),
    ...(toLines(d.body).length ? { body: toLines(d.body) } : {}),
    ...(d.planet.trim() ? { planet: d.planet.trim() } : {}),
    ...(d.chakra.trim() ? { chakra: d.chakra.trim() } : {}),
    ...(list.length ? { list } : {}),
    ...(d.note.trim() ? { note: d.note.trim() } : {}),
  };
};

const RULE_GROUPS = [
  { id: "spiritual", title: "Spiritual Rules" },
  { id: "cricket", title: "Cricket Rules" },
  { id: "shani", title: "Shani Rules" },
] as const;

export function RulesEditor({ initial }: { initial: SiteContent["rules"] }) {
  const [rules, setRules] = useState({
    spiritual: initial.spiritual.map(toDraft),
    cricket: initial.cricket.map(toDraft),
    shani: initial.shani.map(toDraft),
  });
  const { pending, message, save } = useSave("rules");
  const update = (group: keyof typeof rules, next: RuleDraft[]) => setRules({ ...rules, [group]: next });
  const onSave = () =>
    save({ spiritual: rules.spiritual.map(fromDraft), cricket: rules.cricket.map(fromDraft), shani: rules.shani.map(fromDraft) });
  return (
    <section className="space-y-6" data-testid="rules-editor">
      {RULE_GROUPS.map(({ id, title }) => (
        <details key={id} className="card p-5" data-testid={`rules-group-${id}`}>
          <summary className="cursor-pointer font-display text-2xl font-semibold">{title} <span className="text-base font-normal text-muted">({rules[id].length})</span></summary>
          <ol className="mt-4 space-y-4">
            {rules[id].map((r, i) => {
              const set = (patch: Partial<RuleDraft>) => update(id, rules[id].map((x, j) => (j === i ? { ...x, ...patch } : x)));
              const move = (to: number) => {
                const next = [...rules[id]];
                next.splice(to, 0, ...next.splice(i, 1));
                update(id, next);
              };
              return (
                <li key={i} className="space-y-3 rounded-2xl border border-line p-4" data-testid="rule-draft">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-gold-soft">Rule {i + 1}</span>
                    <span className="flex gap-1">
                      <button type="button" className="btn-ghost px-2 py-1" aria-label={`Move rule ${i + 1} up`} disabled={i === 0} onClick={() => move(i - 1)}><ArrowUp className="h-4 w-4" aria-hidden /></button>
                      <button type="button" className="btn-ghost px-2 py-1" aria-label={`Move rule ${i + 1} down`} disabled={i === rules[id].length - 1} onClick={() => move(i + 1)}><ArrowDown className="h-4 w-4" aria-hidden /></button>
                      <button type="button" className="btn-danger px-2 py-1" aria-label={`Remove rule ${i + 1}`} onClick={() => window.confirm(`Remove rule ${i + 1}?`) && update(id, rules[id].filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" aria-hidden /></button>
                    </span>
                  </div>
                  <Field label="Rule" value={r.title} onChange={(title) => set({ title })} />
                  <Field label="Explanation" rows={4} value={r.body} onChange={(body) => set({ body })} hint="Each line becomes a paragraph." />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Planet" value={r.planet} onChange={(planet) => set({ planet })} />
                    <Field label="Chakra" value={r.chakra} onChange={(chakra) => set({ chakra })} />
                  </div>
                  <Field label="List" rows={r.list ? 4 : 2} value={r.list} onChange={(list) => set({ list })} hint="One per line, like “A Grade: text”." />
                  <Field label="Note" value={r.note} onChange={(note) => set({ note })} />
                </li>
              );
            })}
          </ol>
          <button type="button" className="btn-ghost mt-4" data-testid={`add-rule-${id}`} onClick={() => update(id, [...rules[id], { title: "", body: "", planet: "", chakra: "", list: "", note: "" }])}>
            <Plus className="h-4 w-4" aria-hidden /> Add a rule
          </button>
        </details>
      ))}
      <SaveBar pending={pending} message={message} onSave={onSave} testId="save-rules" />
    </section>
  );
}

// ---------------------------------------------------------------------------
// Krishna Consciousness
// ---------------------------------------------------------------------------

export function KrishnaEditor({ initial }: { initial: KrishnaContent }) {
  const [k, setK] = useState({
    ...initial,
    middle: initial.middle.join("\n"),
    story: initial.story.join("\n"),
    how: { question: initial.how.question, answer: initial.how.answer.join("\n") },
  });
  const { pending, message, save } = useSave("krishna");
  const onSave = () => save({ ...k, middle: toLines(k.middle), story: toLines(k.story), how: { question: k.how.question, answer: toLines(k.how.answer) } });
  const setQuestion = (i: number, patch: Partial<KrishnaContent["questions"][number]>) =>
    setK({ ...k, questions: k.questions.map((q, j) => (j === i ? { ...q, ...patch } : q)) });
  return (
    <section className="card space-y-5 p-6" data-testid="krishna-editor">
      <h2 className="text-2xl font-semibold">The essay</h2>
      {k.questions.map((q, i) => (
        <div key={i} className="space-y-3 rounded-2xl border border-line p-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gold-soft">Question {i + 1}</span>
            <button type="button" className="btn-danger px-2 py-1" aria-label={`Remove question ${i + 1}`} onClick={() => window.confirm(`Remove question ${i + 1}?`) && setK({ ...k, questions: k.questions.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" aria-hidden /></button>
          </div>
          <Field label="Thought" rows={2} value={q.thought} onChange={(thought) => setQuestion(i, { thought })} />
          <Field label="Answer" rows={3} value={q.answer} onChange={(answer) => setQuestion(i, { answer })} />
        </div>
      ))}
      <button type="button" className="btn-ghost" onClick={() => setK({ ...k, questions: [...k.questions, { thought: "", answer: "" }] })}>
        <Plus className="h-4 w-4" aria-hidden /> Add a question
      </button>
      <Field label="Middle text" rows={3} value={k.middle} onChange={(middle) => setK({ ...k, middle })} hint="Each line becomes a paragraph." />
      <Field label="The glasses story" rows={3} value={k.story} onChange={(story) => setK({ ...k, story })} hint="Each line becomes a paragraph." />
      {(["luck", "karma"] as const).map((part) => (
        <div key={part} className="grid gap-3 rounded-2xl border border-line p-4 sm:grid-cols-[6rem_1fr]">
          <Field label="Share" value={k[part].share} onChange={(share) => setK({ ...k, [part]: { ...k[part], share } })} />
          <Field label="Heading" value={k[part].label} onChange={(label) => setK({ ...k, [part]: { ...k[part], label } })} />
          <div className="sm:col-span-2">
            <Field label="Text" rows={3} value={k[part].text} onChange={(text) => setK({ ...k, [part]: { ...k[part], text } })} />
          </div>
        </div>
      ))}
      <Field label="“How” heading" value={k.how.question} onChange={(question) => setK({ ...k, how: { ...k.how, question } })} />
      <Field label="“How” text" rows={3} value={k.how.answer} onChange={(answer) => setK({ ...k, how: { ...k.how, answer } })} hint="Each line becomes a paragraph." />
      <Field label="Closing line" value={k.closing} onChange={(closing) => setK({ ...k, closing })} />
      <SaveBar pending={pending} message={message} onSave={onSave} testId="save-krishna" />
    </section>
  );
}
