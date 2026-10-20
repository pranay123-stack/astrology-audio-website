"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { contactInputSchema, type ContactInput } from "@/lib/validation";
import { submitContact } from "./actions";

/** Subject prefixes the premium links use (see premiumContactHref), in both languages. */
const PREMIUM_PREFIX = /^(Premium package|प्रीमियम पैकेज):?\s*/;

export function ContactForm() {
  const params = useSearchParams();
  const { lang, t, href } = useI18n();
  const f = t.form;
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactInputSchema),
    defaultValues: { name: "", email: "", subject: params.get("subject")?.slice(0, 160) ?? "", message: "", website: "" },
  });

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    startTransition(async () => {
      const result = await submitContact(values, lang);
      if (result.ok) {
        setSent(true);
        reset();
        return;
      }
      setServerError(result.error);
      for (const [field, message] of Object.entries(result.fields ?? {})) {
        setError(field as keyof ContactInput, { type: "server", message });
      }
    });
  });

  if (sent) {
    return (
      <div className="card flex flex-col items-center gap-3 p-10 text-center" role="status" data-testid="contact-success">
        <CheckCircle2 className="h-10 w-10 text-emerald-300" aria-hidden />
        <h2 className="text-3xl font-semibold">{f.sentTitle}</h2>
        <p className="text-muted">{f.sentBody}</p>
        <button type="button" className="btn-ghost mt-2" onClick={() => setSent(false)}>
          {f.another}
        </button>
      </div>
    );
  }

  // Client-side checks use the schema's English messages; show the page-language text instead.
  const translated: Partial<Record<keyof ContactInput, string>> = { name: f.errors.name, email: f.errors.email, message: f.errors.message };
  const fieldError = (name: keyof ContactInput) =>
    errors[name]?.message ? (
      <p id={`${name}-error`} className="mt-1 text-sm text-red-300">
        {errors[name]?.type === "server" ? errors[name]?.message : (translated[name] ?? errors[name]?.message)}
      </p>
    ) : null;

  const initialSubject = params.get("subject") ?? "";
  const premiumAbout = PREMIUM_PREFIX.test(initialSubject) ? initialSubject.replace(PREMIUM_PREFIX, "") : null;

  return (
    <form onSubmit={onSubmit} className="card space-y-5 p-6 sm:p-8" noValidate data-testid="contact-form">
      {premiumAbout !== null && (
        <p className="rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-ink/90" data-testid="premium-note">
          {f.premiumBefore}
          <strong>{f.premiumStrong}</strong>
          {premiumAbout ? f.premiumFor(premiumAbout) : null}
          {f.premiumAfter}
        </p>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="label">{f.name}</label>
          <input id="name" autoComplete="name" className="input" aria-invalid={!!errors.name} aria-describedby="name-error" {...register("name")} />
          {fieldError("name")}
        </div>
        <div>
          <label htmlFor="email" className="label">{f.email}</label>
          <input id="email" type="email" autoComplete="email" className="input" aria-invalid={!!errors.email} aria-describedby="email-error" {...register("email")} />
          {fieldError("email")}
        </div>
      </div>
      <div>
        <label htmlFor="subject" className="label">{f.subject} <span className="text-muted">{f.optional}</span></label>
        <input id="subject" className="input" {...register("subject")} />
        {fieldError("subject")}
      </div>
      <div>
        <label htmlFor="message" className="label">{f.message}</label>
        <textarea id="message" rows={6} className="input" aria-invalid={!!errors.message} aria-describedby="message-error" {...register("message")} />
        {fieldError("message")}
      </div>
      {/* Honeypot: hidden from people, often filled in by bots. */}
      <div className="hidden" aria-hidden>
        <label htmlFor="website">Website</label>
        <input id="website" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>
      {serverError && (
        <p role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {serverError}
        </p>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">
          {f.privacyBefore}
          <a href={href("/privacy")} className="underline underline-offset-2">{f.privacyLink}</a>.
        </p>
        <button type="submit" className="btn-gold" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
          {pending ? f.sending : f.send}
        </button>
      </div>
    </form>
  );
}
