import { Suspense } from "react";
import { getDict } from "@/lib/i18n";
import { getEpisodes, getProfile } from "@/lib/queries";
import type { Locale } from "@/lib/types";
import { Logo } from "./Logo";
import { AccountButton } from "./AccountButton";
import { siteMenu } from "./nav";
import { DesktopNav, LanguageSwitch, MobileNav } from "./NavLinks";

export async function SiteHeader({ lang }: { lang: Locale }) {
  const t = getDict(lang);
  const [premium, profile] = await Promise.all([getEpisodes({ access: "premium", limit: 1 }), getProfile()]);
  const menu = siteMenu({ showPremium: premium.total > 0, youtube: profile.social_links?.youtube || undefined });
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-night/80 backdrop-blur-md">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:rounded-lg focus:bg-gold focus:px-3 focus:py-2 focus:text-night">
        {t.nav.skip}
      </a>
      {/* The full menu fills the row, so "Learn Cricket Astrology" lives in the hero and the phone menu. */}
      <div className="container-page relative flex h-16 items-center justify-between gap-3">
        <Logo lang={lang} />
        <Suspense fallback={<DesktopNav static menu={menu} />}>
          <DesktopNav menu={menu} />
        </Suspense>
        <div className="flex items-center gap-2">
          <LanguageSwitch />
          <div className="hidden xl:block">
            <AccountButton />
          </div>
          <Suspense fallback={<div className="h-9 w-9 xl:hidden" />}>
            <MobileNav menu={menu} />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
