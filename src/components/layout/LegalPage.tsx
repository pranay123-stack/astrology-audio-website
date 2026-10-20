import { Languages } from "lucide-react";
import { getDict, intlLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import { Starfield } from "./Starfield";

/**
 * Legal page shell. `bodyLang` is the language the body is written in; when it differs from the
 * page language (Privacy and Terms are English-only), a short note says so.
 */
export function LegalPage({
  title,
  updated,
  lang,
  bodyLang = lang,
  children,
}: {
  title: string;
  /** YYYY-MM-DD */
  updated: string;
  lang: Locale;
  bodyLang?: Locale;
  children: React.ReactNode;
}) {
  const t = getDict(lang).legal;
  const date = new Intl.DateTimeFormat(intlLocale(lang), { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${updated}T00:00:00Z`),
  );
  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-line">
        <Starfield />
        <div className="container-page relative py-14">
          <p className="eyebrow">{t.eyebrow}</p>
          <h1 className="mt-3 text-5xl font-semibold">{title}</h1>
          <p className="mt-3 text-sm text-muted">{t.updated(date)}</p>
        </div>
      </section>
      <div className="container-page py-12">
        {bodyLang !== lang && t.englishOnly && (
          <p className="mb-8 flex max-w-3xl items-center gap-2 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm" data-testid="legal-language-note">
            <Languages className="h-4 w-4 shrink-0 text-gold-soft" aria-hidden /> {t.englishOnly}
          </p>
        )}
        <div className="prose-cosmic max-w-3xl" lang={bodyLang}>
          {children}
        </div>
      </div>
    </>
  );
}

/** Shows the stored value, or a highlighted placeholder that the owner fills in from Admin → Profile. */
export function Fill({ value, placeholder, lang = "en" }: { value: string; placeholder: string; lang?: Locale }) {
  return value ? (
    <>{value}</>
  ) : (
    <mark className="rounded bg-gold/20 px-1 text-gold-soft" title={getDict(lang).legal.fillTitle}>
      [{placeholder}]
    </mark>
  );
}
