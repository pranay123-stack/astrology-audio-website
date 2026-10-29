import { Quote } from "lucide-react";
import { getDict } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

/** The astrologer's guiding quote at the top of the home page, in his own words. */
const QUOTE = {
  text: "Kundali kabhi galat nahi bolti, either human ki ho ya match ki.",
  author: "Amit Sharma",
  role: {
    en: "Author of the book “A Spiritual Punter, Bookie & Astrologer”. Discovered Astro Cricket through the KP system",
    hi: "पुस्तक “A Spiritual Punter, Bookie & Astrologer” के लेखक। KP पद्धति से Astro Cricket की खोज की",
  },
} as const;

export function QuotesBand({ lang }: { lang: Locale }) {
  return (
    <section aria-label={getDict(lang).home.quotes} className="border-b border-line bg-night/60" data-testid="quotes-band">
      <figure className="container-page flex flex-col items-center gap-1.5 py-4 text-center sm:py-6">
        <Quote className="h-5 w-5 text-gold sm:h-6 sm:w-6" aria-hidden />
        <blockquote lang="en" className="font-display text-xl leading-snug text-ink italic sm:text-3xl">“{QUOTE.text}”</blockquote>
        <figcaption className="text-[11px] leading-snug text-muted sm:text-xs">
          <span className="font-semibold text-gold-soft">{QUOTE.author}</span> · {QUOTE.role[lang]}
        </figcaption>
      </figure>
    </section>
  );
}
