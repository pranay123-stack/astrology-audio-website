import { Suspense } from "react";
import { getDict } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import { Logo } from "./Logo";
import { DesktopNav, LanguageSwitch, MobileNav } from "./NavLinks";

export function SiteHeader({ lang }: { lang: Locale }) {
  const t = getDict(lang);
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-night/80 backdrop-blur-md">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:rounded-lg focus:bg-gold focus:px-3 focus:py-2 focus:text-night">
        {t.nav.skip}
      </a>
      <div className="container-page relative flex h-16 items-center justify-between gap-3">
        <Logo lang={lang} />
        <Suspense fallback={<DesktopNav static />}>
          <DesktopNav />
        </Suspense>
        <div className="flex items-center gap-2">
          <LanguageSwitch />
          <Suspense fallback={<div className="h-9 w-9 lg:hidden" />}>
            <MobileNav />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
