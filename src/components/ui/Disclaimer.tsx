import Link from "next/link";
import { Info } from "lucide-react";
import { getDict, localePath } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export function CricketDisclaimer({ lang, className = "" }: { lang: Locale; className?: string }) {
  const t = getDict(lang).disclaimerNote;
  return (
    <aside className={`flex gap-3 rounded-2xl border border-gold/25 bg-gold/5 p-4 text-sm text-ink/85 ${className}`} role="note">
      <Info className="mt-0.5 h-5 w-5 shrink-0 text-gold-soft" aria-hidden />
      <p>
        {t.before}
        <strong>{t.strong}</strong>
        {t.after}{" "}
        <Link href={localePath(lang, "/disclaimer")} className="text-gold-soft underline underline-offset-2">
          {t.link}
        </Link>
        .
      </p>
    </aside>
  );
}
