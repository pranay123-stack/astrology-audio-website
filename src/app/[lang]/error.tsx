"use client";

import { useI18n } from "@/lib/i18n/client";

export default function SiteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useI18n();
  return (
    <section className="container-page flex flex-col items-center gap-4 py-28 text-center" role="alert">
      <p className="eyebrow">{t.errors.eyebrow}</p>
      <h1 className="text-4xl font-semibold">{t.errors.title}</h1>
      <p className="max-w-md text-muted">{t.errors.body}</p>
      <button type="button" onClick={reset} className="btn-gold">{t.errors.retry}</button>
    </section>
  );
}
