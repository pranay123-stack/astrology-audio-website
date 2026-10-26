import Link from "next/link";
import { Compass, Sparkles } from "lucide-react";
import { getDict, localePath } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import { ZodiacWheel } from "./ZodiacWheel";

/** Invitation to the free KP birth chart tool. */
export function KpPromo({ lang }: { lang: Locale }) {
  const t = getDict(lang).home;
  return (
    <section className="container-page py-16" aria-labelledby="kp-promo-heading" data-testid="kp-promo">
      <div className="card relative grid items-center gap-6 overflow-hidden p-6 sm:p-10 md:grid-cols-[1fr_auto]">
        <ZodiacWheel className="pointer-events-none absolute -right-16 -bottom-24 h-72 w-72 opacity-20 md:h-96 md:w-96" />
        <div className="relative space-y-3">
          <p className="eyebrow flex items-center gap-2">
            <Compass className="h-4 w-4" aria-hidden /> {t.kpEyebrow}
          </p>
          <h2 id="kp-promo-heading" className="text-3xl font-semibold sm:text-4xl">{t.kpTitle}</h2>
          <p className="max-w-2xl text-ink/80">{t.kpBody}</p>
        </div>
        <Link href={localePath(lang, "/kp-chart")} className="btn-gold relative px-6 py-3 text-base">
          <Sparkles className="h-5 w-5" aria-hidden /> {t.kpCta}
        </Link>
      </div>
    </section>
  );
}
