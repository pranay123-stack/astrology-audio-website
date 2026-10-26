import { BookOpen, ExternalLink } from "lucide-react";
import { getDict } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

/** The astrologer's book with a link to buy it (the Amazon link from Admin → Profile). Hidden without that link. */
export function BookCard({ amazonUrl, lang, className = "" }: { amazonUrl: string | undefined; lang: Locale; className?: string }) {
  if (!amazonUrl) return null;
  const t = getDict(lang).home;
  return (
    <aside className={`flex flex-col gap-4 rounded-2xl border border-gold/30 bg-gold/5 p-5 sm:flex-row sm:items-center ${className}`} data-testid="book-card">
      {/* A drawn book cover: no cover image is available. */}
      <div className="flex h-28 w-20 shrink-0 flex-col justify-between rounded-r-lg rounded-l-sm border-l-4 border-gold bg-gradient-to-br from-plum-2 to-night p-2 shadow-lg">
        <BookOpen className="h-4 w-4 text-gold-soft" aria-hidden />
        <p className="font-display text-[10px] leading-tight text-gold-soft">{t.bookTitle}</p>
      </div>
      <div className="flex-1 space-y-1">
        <p className="eyebrow">{t.bookEyebrow}</p>
        <p lang="en" className="font-display text-2xl leading-tight">“{t.bookTitle}”</p>
        <p className="text-sm text-ink/80">{t.bookBody}</p>
      </div>
      <a href={amazonUrl} target="_blank" rel="noopener noreferrer" className="btn-gold shrink-0" data-testid="book-buy">
        <ExternalLink className="h-4 w-4" aria-hidden /> {t.bookCta}
      </a>
    </aside>
  );
}
