import { Suspense } from "react";
import { Logo } from "./Logo";
import { DesktopNav, MobileNav } from "./NavLinks";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-night/80 backdrop-blur-md">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:rounded-lg focus:bg-gold focus:px-3 focus:py-2 focus:text-night">
        Skip to content
      </a>
      <div className="container-page relative flex h-16 items-center justify-between gap-4">
        <Logo />
        <Suspense fallback={<DesktopNav static />}>
          <DesktopNav />
        </Suspense>
        <Suspense fallback={<div className="h-9 w-9 lg:hidden" />}>
          <MobileNav />
        </Suspense>
      </div>
    </header>
  );
}
