import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { menuIcon } from "@/components/layout/navGroups";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getDict, localePath } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

/** The sections a newcomer is most likely after, in the order they would explore them. */
const TILES = [
  { key: "latestMatches", href: "/latest-matches" },
  { key: "predictionRecords", href: "/prediction-records" },
  { key: "research", href: "/horoscope-research" },
  { key: "fixing", href: "/horoscope-research/fixing" },
  { key: "kpChart", href: "/kp-chart" },
  { key: "astroCricket", href: "/astro-cricket" },
  { key: "book", href: "/book" },
  { key: "rules", href: "/rules" },
] as const;

/** "Start here": every main section as a big tile with what it holds, so a first visit has an obvious next step. */
export function StartHere({ lang }: { lang: Locale }) {
  const t = getDict(lang);
  return (
    <section className="container-page py-14" aria-labelledby="start-heading" data-testid="start-here">
      <SectionHeading id="start-heading" eyebrow={t.home.startEyebrow} title={t.home.startTitle} description={t.home.startDesc} />
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {TILES.map(({ key, href }) => (
          <li key={key}>
            <Link
              href={localePath(lang, href)}
              className="card group relative flex h-full flex-col gap-3 overflow-hidden p-4 transition hover:-translate-y-0.5 hover:border-gold/60 hover:shadow-[var(--shadow-glow)] sm:p-5"
              data-testid={`start-${key}`}
            >
              {/* A cricket ball's seam, faint in the corner. */}
              <svg viewBox="0 0 100 100" className="pointer-events-none absolute -top-8 -right-8 h-28 w-28 text-gold/15 transition group-hover:text-gold/30" aria-hidden>
                <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="3" />
                <path d="M30 8 Q50 50 30 92 M70 8 Q50 50 70 92" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="4 4" />
              </svg>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-gold/40 bg-gold/15 text-gold-soft transition group-hover:bg-gold group-hover:text-night sm:h-12 sm:w-12">
                {menuIcon(key, "h-6 w-6")}
              </span>
              <span className="text-lg leading-tight font-semibold sm:text-xl">{t.menu[key]}</span>
              <span className="text-xs leading-snug text-muted sm:text-sm">{t.nav.desc[key]}</span>
              <ArrowRight className="mt-auto h-4 w-4 text-gold-soft transition group-hover:translate-x-1" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
