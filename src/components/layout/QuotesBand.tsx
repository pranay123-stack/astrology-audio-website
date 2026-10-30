import { Quote } from "lucide-react";
import { getDict } from "@/lib/i18n";
import { getSiteContent } from "@/lib/queries";
import type { Locale } from "@/lib/types";

/** The astrologer's guiding quote at the top of the home page, in his own words (Admin › Home). */
export async function QuotesBand({ lang }: { lang: Locale }) {
  const quote = await getSiteContent("quotes");
  const role = lang === "hi" ? quote.role_hi : quote.role_en;
  return (
    <section aria-label={getDict(lang).home.quotes} className="border-b border-line bg-night/60" data-testid="quotes-band">
      <figure className="container-page flex flex-col items-center gap-1.5 py-4 text-center sm:py-6">
        <Quote className="h-5 w-5 text-gold sm:h-6 sm:w-6" aria-hidden />
        <blockquote lang="en" className="font-display text-xl leading-snug text-ink italic sm:text-3xl">“{quote.text}”</blockquote>
        <figcaption className="text-[11px] leading-snug text-muted sm:text-xs">
          <span className="font-semibold text-gold-soft">{quote.author}</span>{role && ` · ${role}`}
        </figcaption>
      </figure>
    </section>
  );
}
