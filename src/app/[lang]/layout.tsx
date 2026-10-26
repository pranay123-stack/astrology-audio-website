import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { lang as rootLang } from "next/root-params";
import { AudioPlayerProvider } from "@/components/audio/AudioPlayerProvider";
import { MiniPlayer } from "@/components/audio/MiniPlayer";
import { DemoBanner } from "@/components/layout/DemoBanner";
import { FloatingWhatsApp } from "@/components/layout/FloatingWhatsApp";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { siteConfig } from "@/lib/config";
import { getDict, isLocale, LOCALES } from "@/lib/i18n";
import { I18nProvider } from "@/lib/i18n/client";
import { getLang } from "@/lib/i18n/server";
import { getProfile } from "@/lib/queries";
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

/**
 * On English pages: go to the Hindi version when the visitor chose Hindi (cookie `lang=hi`, set by
 * the language switch) or, before any choice, when the browser's first language is Hindi. Search
 * engines report English and are never redirected. Mirrors hindiRedirect() in proxy.ts.
 */
const HINDI_FIRST = `(function(){try{var m=document.cookie.match(/(?:^|; )lang=(hi|en)(?:;|$)/),c=m&&m[1];if(c==="en")return;var l=((navigator.languages&&navigator.languages[0])||navigator.language||"").toLowerCase();if(c!=="hi"&&l.indexOf("hi")!==0)return;if(!c)document.cookie="lang=hi; path=/; max-age=31536000; samesite=lax";var p=location.pathname;location.replace("/hi"+(p==="/"?"":p)+location.search+location.hash)}catch(e){}})();`;

/** Root layout of the public site, one per language (English at /..., Hindi at /hi/...). */
export default async function SiteRootLayout({ children }: LayoutProps<"/[lang]">) {
  const value = await rootLang();
  if (!isLocale(value)) notFound();
  const lang = value;
  const whatsapp = (await getProfile()).social_links?.whatsapp;
  return (
    <html lang={lang} className={`${fontVariables}${lang === "hi" ? " locale-hi" : ""}`}>
      {lang === "en" && (
        <head>
          {/* Hindi first, in the browser: the CDN may serve this page from its cache without asking the server (proxy.ts). */}
          <script dangerouslySetInnerHTML={{ __html: HINDI_FIRST }} />
        </head>
      )}
      <body className="min-h-screen">
        <I18nProvider lang={lang}>
          <AudioPlayerProvider>
            <SiteHeader lang={lang} />
            <DemoBanner lang={lang} />
            <main id="main">{children}</main>
            <SiteFooter lang={lang} />
            <MiniPlayer />
            {whatsapp && <FloatingWhatsApp href={whatsapp} />}
          </AudioPlayerProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
