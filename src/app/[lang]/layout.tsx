import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { lang as rootLang } from "next/root-params";
import { AudioPlayerProvider } from "@/components/audio/AudioPlayerProvider";
import { MiniPlayer } from "@/components/audio/MiniPlayer";
import { DemoBanner } from "@/components/layout/DemoBanner";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { siteConfig } from "@/lib/config";
import { getDict, isLocale, LOCALES } from "@/lib/i18n";
import { I18nProvider } from "@/lib/i18n/client";
import { getLang } from "@/lib/i18n/server";
import { fontVariables } from "../fonts";
import { baseMetadata } from "../root-metadata";
import "../globals.css";

export { viewport } from "../root-metadata";

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  const t = getDict(lang);
  return {
    ...baseMetadata,
    title: { default: t.meta.siteTitle(siteConfig.name), template: `%s | ${siteConfig.name}` },
    description: t.meta.siteDesc,
    openGraph: { ...baseMetadata.openGraph, locale: lang === "hi" ? "hi_IN" : "en_IN" },
  };
}

/** Root layout of the public site, one per language (English at /..., Hindi at /hi/...). */
export default async function SiteRootLayout({ children }: LayoutProps<"/[lang]">) {
  const value = await rootLang();
  if (!isLocale(value)) notFound();
  const lang = value;
  return (
    <html lang={lang} className={`${fontVariables}${lang === "hi" ? " locale-hi" : ""}`}>
      <body className="min-h-screen">
        <I18nProvider lang={lang}>
          <AudioPlayerProvider>
            <SiteHeader lang={lang} />
            <DemoBanner lang={lang} />
            <main id="main">{children}</main>
            <SiteFooter lang={lang} />
            <MiniPlayer />
          </AudioPlayerProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
