import { Quote } from "lucide-react";
import { getDict } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

/** The two guiding quotes at the top of the home page, kept in the astrologer's own (English) words. */
const QUOTES = [
  { text: "Everything is fixed by God, nothing is an accident.", author: "K. S. Krishnamurti", role: { en: "Inventor of the KP Astrology system", hi: "KP ज्योतिष पद्धति के जनक" } },
  {
    text: "12% of the incidents of life are fixed and can't be changed, but the rest can be changed through KARMA. But only a few can.",
    author: "Amit Sharma",
    role: {
      en: "Author of the book “A Spiritual Punter, Bookie & Astrologer”. Discovered Astro Cricket through the KP system",
      hi: "पुस्तक “A Spiritual Punter, Bookie & Astrologer” के लेखक। KP पद्धति से Astro Cricket की खोज की",
    },
  },
] as const;

export function QuotesBand({ lang }: { lang: Locale }) {
  return (
    <section aria-label={getDict(lang).home.quotes} className="border-b border-line bg-night/60" data-testid="quotes-band">
      <div className="container-page grid gap-4 py-5 md:grid-cols-2 md:gap-8">
        {QUOTES.map((q) => (
          <figure key={q.author} className="flex gap-3">
            <Quote className="mt-1 h-5 w-5 shrink-0 text-gold" aria-hidden />
            <div className="space-y-1.5">
              <blockquote lang="en" className="font-display text-lg leading-snug text-ink italic sm:text-xl">“{q.text}”</blockquote>
              <figcaption className="text-xs text-muted">
                <span className="font-semibold text-gold-soft">{q.author}</span> · {q.role[lang]}
              </figcaption>
            </div>
          </figure>
        ))}
      </div>
    </section>
  );
}
