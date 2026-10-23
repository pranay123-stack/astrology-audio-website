import Link from "next/link";
import { GraduationCap, Mail } from "lucide-react";
import { getDict, localePath } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

/** Invitation to learn cricket astrology from the astrologer; opens the contact form with the subject filled in. */
export function LearnCricketCta({ lang, className = "" }: { lang: Locale; className?: string }) {
  const t = getDict(lang).learn;
  const href = localePath(lang, `/contact?subject=${encodeURIComponent(t.subject)}`);
  return (
    <aside className={`card grid gap-5 p-6 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-8 ${className}`} data-testid="learn-cricket-cta">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/40 bg-gold/10 text-gold-soft">
        <GraduationCap className="h-7 w-7" aria-hidden />
      </span>
      <div className="space-y-1">
        <p className="eyebrow">{t.eyebrow}</p>
        <h2 className="text-2xl font-semibold sm:text-3xl">{t.title}</h2>
        <p className="text-sm text-ink/80">{t.body}</p>
      </div>
      <Link href={href} className="btn-gold">
        <Mail className="h-4 w-4" aria-hidden /> {t.cta}
      </Link>
    </aside>
  );
}
