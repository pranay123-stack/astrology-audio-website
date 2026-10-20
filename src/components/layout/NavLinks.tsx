"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Languages, Menu, X } from "lucide-react";
import { localePath, splitLocale } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/client";
import { NAV_LINKS } from "./nav";

/** `pathname` is the public URL (possibly /hi/...); `href` is language-free. */
function isActive(pathname: string, href: string) {
  const { path } = splitLocale(pathname);
  return href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`);
}

/**
 * Link to the same page in the other language, keeping filters and search. It needs URL data,
 * so it renders in up to three steps (each a Suspense fallback of the next): the other
 * language's home page, then the same path (where the path is known ahead of time), then the
 * same path with the query string.
 */
export function LanguageSwitch({ className = "" }: { className?: string }) {
  return (
    <Suspense fallback={<LanguageSwitchInner pathname="" query="" className={className} />}>
      <Suspense fallback={<LanguageSwitchPathOnly className={className} />}>
        <LanguageSwitchLive className={className} />
      </Suspense>
    </Suspense>
  );
}

function LanguageSwitchPathOnly({ className }: { className: string }) {
  return <LanguageSwitchInner pathname={usePathname()} query="" className={className} />;
}

function LanguageSwitchLive({ className }: { className: string }) {
  const query = useSearchParams().toString();
  return <LanguageSwitchInner pathname={usePathname()} query={query} className={className} />;
}

function LanguageSwitchInner({ pathname, query, className }: { pathname: string; query: string; className: string }) {
  const { lang, t } = useI18n();
  const other = lang === "hi" ? "en" : "hi";
  const path = pathname ? splitLocale(pathname).path : "/";
  const href = localePath(other, path) + (query ? `?${query}` : "");
  return (
    // No prefetch: the client router cannot map a plain English URL (/about) to /en/about, which
    // the proxy rewrites on the server, and would retry the failed prefetch indefinitely.
    <Link
      href={href}
      prefetch={false}
      hrefLang={other}
      lang={other}
      className={`inline-flex items-center gap-1.5 rounded-full border border-gold/50 bg-gold/10 px-3 py-1.5 text-sm font-semibold text-gold-soft transition hover:bg-gold/20 ${className}`}
      aria-label={t.switchLabel}
      title={t.switchLabel}
      data-testid="language-switch"
    >
      <Languages className="h-4 w-4" aria-hidden />
      {t.switchTo}
    </Link>
  );
}

export function DesktopNav({ static: isStatic = false }: { static?: boolean }) {
  // `static` renders without the pathname (used as the Suspense fallback).
  return isStatic ? <DesktopNavInner pathname="" /> : <DesktopNavWithPath />;
}

function DesktopNavWithPath() {
  return <DesktopNavInner pathname={usePathname()} />;
}

function DesktopNavInner({ pathname }: { pathname: string }) {
  const { t, href } = useI18n();
  return (
    <nav aria-label={t.nav.main} className="hidden lg:block">
      <ul className="flex items-center gap-1">
        {NAV_LINKS.map((l) => {
          const active = pathname !== "" && isActive(pathname, l.href);
          return (
            <li key={l.href}>
              <Link
                href={href(l.href)}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                  active ? "bg-white/10 text-gold-soft" : "text-ink/80 hover:bg-white/5 hover:text-ink"
                }`}
              >
                {t.nav[l.key]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { t, href } = useI18n();

  // Close the menu after navigating.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset on route change
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="rounded-full border border-line p-2 text-ink hover:bg-white/5"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
      >
        {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
      </button>
      {open && (
        <nav
          id="mobile-menu"
          aria-label={t.nav.main}
          className="absolute inset-x-0 top-full border-b border-line bg-night/98 shadow-2xl backdrop-blur-lg"
        >
          <ul className="container-page flex flex-col gap-1 py-4">
            {NAV_LINKS.map((l) => {
              const active = isActive(pathname, l.href);
              return (
                <li key={l.href}>
                  <Link
                    href={href(l.href)}
                    aria-current={active ? "page" : undefined}
                    className={`block rounded-xl px-4 py-3 text-base font-medium ${
                      active ? "bg-white/10 text-gold-soft" : "text-ink/90 hover:bg-white/5"
                    }`}
                  >
                    {t.nav[l.key]}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </div>
  );
}
