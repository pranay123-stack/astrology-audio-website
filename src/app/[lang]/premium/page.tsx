import type { Metadata } from "next";
import Link from "next/link";
import { Lock, Mail } from "lucide-react";
import { EpisodeCard } from "@/components/episodes/EpisodeCard";
import { Starfield } from "@/components/layout/Starfield";
import { EmptyState, SectionHeading } from "@/components/ui/SectionHeading";
import { premiumConfig } from "@/lib/config";
import { premiumContactHref } from "@/lib/episodes";
import { getDict } from "@/lib/i18n";
import { getEpisodes } from "@/lib/queries";
import { alternatesFor } from "@/lib/seo";
import { getLang } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLang();
  const t = getDict(l).premium;
  return { title: t.title, description: t.metaDesc, alternates: alternatesFor(l, "/premium") };
}

export default async function PremiumPage() {
  const lang = await getLang();
  const t = getDict(lang).premium;
  const premium = await getEpisodes({ access: "premium", sort: "latest", limit: 12 });
  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-line">
        <Starfield />
        <div className="container-page relative py-14 sm:py-20">
          <div className="flex items-center gap-3 text-gold-soft">
            <Lock className="h-6 w-6" aria-hidden />
            <p className="eyebrow">{t.eyebrow}</p>
          </div>
          <h1 className="mt-3 text-5xl font-semibold sm:text-6xl">{t.title}</h1>
          <p className="mt-4 max-w-2xl text-lg text-ink/80">{t.intro}</p>
        </div>
      </section>

      <section className="container-page py-12">
        {!premiumConfig.enabled && (
          <div className="card mb-12 grid gap-6 p-8 md:grid-cols-[1fr_auto] md:items-center" data-testid="premium-status">
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold">{t.packageTitle}</h2>
              <p className="text-ink/80">{t.packageBody}</p>
            </div>
            <Link href={premiumContactHref(undefined, lang)} className="btn-gold" data-testid="premium-contact">
              <Mail className="h-4 w-4" aria-hidden /> {t.contact}
            </Link>
          </div>
        )}
        <SectionHeading eyebrow={t.library} title={t.listTitle} description={t.listDesc} />
        {premium.items.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {premium.items.map((e) => (
              <EpisodeCard key={e.id} episode={e} lang={lang} />
            ))}
          </div>
        ) : (
          <EmptyState title={t.none}>{t.noneBody}</EmptyState>
        )}
      </section>
    </>
  );
}
