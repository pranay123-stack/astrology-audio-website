"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { ChevronDown, ExternalLink, GraduationCap, Languages, Menu, X } from "lucide-react";
import { localePath, splitLocale } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/client";
import { AccountMenuItems } from "./AccountButton";
import { learnPath, type MenuNode } from "./nav";

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
      // Remember the choice, so the site does not switch back to Hindi on the next visit (see proxy.ts).
      onClick={() => {
        document.cookie = `lang=${other}; path=/; max-age=31536000; samesite=lax`;
      }}
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

/** Whether `node` (or one of the older pages it covers) is the current page or one of its ancestors. */
function isCurrent(pathname: string, node: MenuNode): boolean {
  if (!pathname || node.external) return false;
  return [node.href.split(/[?#]/)[0], ...(node.also ?? [])].some((h) => isActive(pathname, h));
}

function MenuLink({ node, className, onNavigate }: { node: MenuNode; className: string; onNavigate?: () => void }) {
  const { t, href } = useI18n();
  if (node.external) {
    return (
      <a href={node.href} target="_blank" rel="noopener noreferrer" className={className} onClick={onNavigate}>
        {t.menu[node.key]} <ExternalLink className="ml-1 inline h-3.5 w-3.5 opacity-70" aria-hidden />
      </a>
    );
  }
  return (
    <Link href={href(node.href)} className={className} onClick={onNavigate}>
      {t.menu[node.key]}
    </Link>
  );
}

/** A dropdown's contents: plain links, and groups (e.g. "12 Planets & 12 Bhav") with their own sub-links. */
function MenuPanel({ items, onNavigate, compact = false }: { items: MenuNode[]; onNavigate?: () => void; compact?: boolean }) {
  const sub = compact ? "block rounded-lg px-3 py-2 text-sm text-ink/80 hover:bg-white/5 hover:text-ink" : "block rounded-lg px-3 py-1.5 text-sm text-ink/80 hover:bg-white/5 hover:text-ink";
  return (
    <ul className="space-y-1">
      {items.map((c) => (
        <li key={c.key + c.href}>
          <MenuLink
            node={c}
            onNavigate={onNavigate}
            className={`block rounded-lg px-3 py-2 font-semibold hover:bg-white/5 ${c.children ? "text-gold-soft" : "text-ink"} ${compact ? "text-base" : "text-sm"}`}
          />
          {c.children && (
            <ul className="ml-3 border-l border-line pl-2">
              {c.children.map((g) => (
                <li key={g.key + g.href}>
                  <MenuLink node={g} onNavigate={onNavigate} className={sub} />
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}

export function DesktopNav({ static: isStatic = false, menu }: { static?: boolean; menu: MenuNode[] }) {
  // `static` renders without the pathname (used as the Suspense fallback).
  return isStatic ? <DesktopNavInner pathname="" menu={menu} /> : <DesktopNavWithPath menu={menu} />;
}

function DesktopNavWithPath({ menu }: { menu: MenuNode[] }) {
  return <DesktopNavInner pathname={usePathname()} menu={menu} />;
}

/** Top-level items open their dropdown on hover, on keyboard focus, or with the arrow button (touch screens). */
function DesktopNavInner({ pathname, menu }: { pathname: string; menu: MenuNode[] }) {
  const { t } = useI18n();
  const [open, setOpen] = useState<string | null>(null);
  // When the pointer opened a menu: the click that follows right after must not close it again.
  const openedAt = useRef(0);
  const openBy = (key: string, at: number) => {
    if (open !== key) openedAt.current = at;
    setOpen(key);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- close after navigating
    setOpen(null);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    const onClick = (e: MouseEvent) => !(e.target as Element).closest?.("[data-menu-item]") && setOpen(null);
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, [open]);

  return (
    <nav aria-label={t.nav.main} className="hidden xl:block">
      <ul className="flex items-center gap-0.5">
        {menu.map((l) => {
          const active = isCurrent(pathname, l);
          const isOpen = open === l.key;
          const top = `rounded-full px-2.5 py-2 text-sm font-medium whitespace-nowrap transition 2xl:px-3 ${active ? "bg-white/10 text-gold-soft" : "text-ink/80 hover:bg-white/5 hover:text-ink"}`;
          if (!l.children) {
            return (
              <li key={l.key}>
                <MenuLink node={l} className={top} />
              </li>
            );
          }
          return (
            <li
              key={l.key}
              className="relative"
              data-menu-item
              onMouseEnter={(e) => openBy(l.key, e.timeStamp)}
              onMouseLeave={() => setOpen((o) => (o === l.key ? null : o))}
              onFocus={(e) => openBy(l.key, e.timeStamp)}
              onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setOpen((o) => (o === l.key ? null : o))}
            >
              <span className={`inline-flex items-center ${top} pr-1`}>
                <MenuLink node={l} className="" />
                <button
                  type="button"
                  className="rounded-full p-0.5 hover:bg-white/10"
                  aria-expanded={isOpen}
                  aria-label={t.nav.showMenu(t.menu[l.key])}
                  onClick={(e) => (isOpen && e.timeStamp - openedAt.current > 400 ? setOpen(null) : openBy(l.key, e.timeStamp))}
                  data-testid={`menu-toggle-${l.key}`}
                >
                  <ChevronDown className={`h-4 w-4 transition ${isOpen ? "rotate-180" : ""}`} aria-hidden />
                </button>
              </span>
              {isOpen && (
                // The padding bridges the gap to the item, so the pointer can move into the panel.
                <div className="absolute left-0 top-full z-50 pt-2" data-testid={`menu-panel-${l.key}`}>
                  <div className="w-72 rounded-2xl border border-line bg-night/98 p-3 shadow-2xl backdrop-blur-lg">
                    <MenuPanel items={[{ key: "overview", href: l.href }, ...l.children]} onNavigate={() => setOpen(null)} />
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function MobileNav({ menu }: { menu: MenuNode[] }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
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
    <div className="xl:hidden">
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
          className="absolute inset-x-0 top-full max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-line bg-night shadow-2xl"
        >
          <ul className="container-page flex flex-col gap-1 py-4">
            <li className="pb-2">
              <Link href={href(learnPath(t.learn.subject))} className="btn-gold w-full justify-center" data-testid="mobile-learn">
                <GraduationCap className="h-4 w-4" aria-hidden /> {t.nav.learn}
              </Link>
            </li>
            {menu.map((l) => {
              const active = isCurrent(pathname, l);
              const isExpanded = expanded === l.key;
              const row = `block flex-1 rounded-xl px-4 py-3 text-base font-medium ${active ? "bg-white/10 text-gold-soft" : "text-ink/90 hover:bg-white/5"}`;
              return (
                <li key={l.key}>
                  <div className="flex items-center gap-1">
                    <MenuLink node={l} className={row} onNavigate={() => setOpen(false)} />
                    {l.children && (
                      <button
                        type="button"
                        className="rounded-xl p-3 text-ink/80 hover:bg-white/5"
                        aria-expanded={isExpanded}
                        aria-label={t.nav.showMenu(t.menu[l.key])}
                        onClick={() => setExpanded(isExpanded ? null : l.key)}
                        data-testid={`mobile-toggle-${l.key}`}
                      >
                        <ChevronDown className={`h-5 w-5 transition ${isExpanded ? "rotate-180" : ""}`} aria-hidden />
                      </button>
                    )}
                  </div>
                  {l.children && isExpanded && (
                    <div className="mb-2 ml-4 border-l border-line pl-2">
                      <MenuPanel items={l.children} onNavigate={() => setOpen(false)} compact />
                    </div>
                  )}
                </li>
              );
            })}
            <AccountMenuItems />
          </ul>
        </nav>
      )}
    </div>
  );
}
