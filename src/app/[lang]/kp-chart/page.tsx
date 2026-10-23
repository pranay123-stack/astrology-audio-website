import type { Metadata } from "next";
import { Compass } from "lucide-react";
import { KpChartApp } from "@/components/kp/KpChartApp";
import { Starfield } from "@/components/layout/Starfield";
import { getDict, localePath } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { alternatesFor } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLang();
  const t = getDict(l).kp;
  return {
    title: t.metaTitle,
    description: t.metaDesc,
    alternates: alternatesFor(l, "/kp-chart"),
    openGraph: { title: t.metaTitle, url: localePath(l, "/kp-chart") },
  };
}

export default async function KpChartPage() {
  const lang = await getLang();
  const t = getDict(lang).kp;
  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-line">
        <Starfield />
        <div className="container-page relative py-14 sm:py-20">
          <div className="flex items-center gap-3 text-gold-soft">
            <Compass className="h-6 w-6" aria-hidden />
            <p className="eyebrow">{t.eyebrow}</p>
          </div>
          <h1 className="mt-3 text-5xl font-semibold sm:text-6xl">{t.title}</h1>
          <p className="mt-4 max-w-2xl text-lg text-ink/80">{t.intro}</p>
        </div>
      </section>
      <section className="container-page py-10">
        <KpChartApp />
        <p className="mx-auto mt-10 max-w-2xl text-center text-xs text-muted">{t.credit}</p>
      </section>
    </>
  );
}
