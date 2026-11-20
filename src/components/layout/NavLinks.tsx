"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Compass, ExternalLink, GraduationCap, House, Languages, Menu, Radio, X } from "lucide-react";
import { useAudioPlayer } from "@/components/audio/AudioPlayerProvider";
import { localePath, splitLocale } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/client";
import { AccountMenuItems } from "./AccountButton";
import { learnPath, type MenuNode } from "./nav";
import { groupMenu, menuIcon, quickLinks, type NavEntry } from "./navGroups";

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

/** A page in a dropdown or the phone menu: icon, name and one line on what it holds. */
function ItemLink({ node, onNavigate, active }: { node: MenuNode; onNavigate?: () => void; active?: boolean }) {
  const { t, href } = useI18n();
  const desc = (t.nav.desc as Partial<Record<string, string>>)[node.key];
  return (
    <Link href={href(node.href)} onClick={onNavigate} className="group flex items-start gap-3 rounded-xl p-2 hover:bg-white/5" data-testid={`menu-item-${node.key}`}>
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition ${
          active ? "border-gold bg-gold/25 text-gold-soft" : "border-gold/30 bg-gold/10 text-gold-soft group-hover:border-gold/60 group-hover:bg-gold/20"
        }`}
      >
        {menuIcon(node.key, "h-5 w-5")}
      </span>
      <span className="min-w-0">
        <span className={`block font-semibold leading-tight ${active ? "text-gold-soft" : "text-ink group-hover:text-gold-soft"}`}>{t.menu[node.key]}</span>
        {desc && <span className="mt-0.5 block text-xs leading-snug text-muted">{desc}</span>}
      </span>
    </Link>
  );
}

/** Small links to a page's parts (e.g. BBL, IPL, T20, ODI), under the page in a dropdown. */
function QuickLinks({ node, onNavigate }: { node: MenuNode; onNavigate?: () => void }) {
  const links = quickLinks(node);
  if (!links.length) return null;
  return (
    <ul className="mt-1 ml-[3.25rem] flex flex-wrap gap-1.5">
      {links.map((c) => (
        <li key={c.key + c.href}>
          <MenuLink
            node={c}
            onNavigate={onNavigate}
            className="inline-flex items-center rounded-full border border-line bg-white/5 px-2.5 py-1 text-xs font-medium text-ink/85 hover:border-gold/50 hover:text-gold-soft"
          />
        </li>
      ))}
    </ul>
  );
}

/** A dropdown: its pages in two columns, each with its quick links. */
function GroupPanel({ items, pathname, onNavigate }: { items: MenuNode[]; pathname: string; onNavigate?: () => void }) {
  return (
    <ul className={`grid gap-x-2 gap-y-1 ${items.length > 2 ? "sm:grid-cols-2" : ""}`}>
      {items.map((node) => (
        <li key={node.key + node.href} className="pb-2">
          <ItemLink node={node} onNavigate={onNavigate} active={isCurrent(pathname, node)} />
          <QuickLinks node={node} onNavigate={onNavigate} />
        </li>
      ))}
    </ul>
  );
}

const groupActive = (pathname: string, entry: Extract<NavEntry, { kind: "group" }>) => entry.items.some((n) => isCurrent(pathname, n));

export function DesktopNav({ static: isStatic = false, menu }: { static?: boolean; menu: MenuNode[] }) {
  // `static` renders without the pathname (used as the Suspense fallback).
  return isStatic ? <DesktopNavInner pathname="" menu={menu} /> : <DesktopNavWithPath menu={menu} />;
}

function DesktopNavWithPath({ menu }: { menu: MenuNode[] }) {
  return <DesktopNavInner pathname={usePathname()} menu={menu} />;
}

/**
 * Home, Matches, Learn, Research, Free Tools, Contact: one line on any laptop. A group opens on hover,
 * on keyboard focus, or with a tap (touch screens).
 */
function DesktopNavInner({ pathname, menu }: { pathname: string; menu: MenuNode[] }) {
  const { t } = useI18n();
  const [open, setOpen] = useState<string | null>(null);
  // How the open group was opened. A click opens a group; only a second click on a group a click
  // opened closes it, so a click on a group the pointer (or a page loading under it) already opened
  // never shuts it.
  const openedByClick = useRef(false);
  const openBy = (key: string, click: boolean) => {
    if (open !== key || click) openedByClick.current = click;
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

  const top = (active: boolean) =>
    `inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-[15px] font-semibold whitespace-nowrap transition ${
      active ? "bg-gold/15 text-gold-soft ring-1 ring-gold/40" : "text-ink/85 hover:bg-white/5 hover:text-ink"
    }`;

  return (
    <nav aria-label={t.nav.main} className="hidden min-w-0 flex-1 nav:block">
      <ul className="flex items-center justify-center gap-1">
        {groupMenu(menu).map((entry) => {
          if (entry.kind === "link") {
            return (
              <li key={entry.node.key}>
                <MenuLink node={entry.node} className={top(isCurrent(pathname, entry.node))} />
              </li>
            );
          }
          const isOpen = open === entry.key;
          return (
            <li
              key={entry.key}
              className="relative"
              data-menu-item
              onMouseEnter={() => openBy(entry.key, false)}
              onMouseLeave={() => setOpen((o) => (o === entry.key ? null : o))}
              onFocus={() => open !== entry.key && openBy(entry.key, false)}
              onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setOpen((o) => (o === entry.key ? null : o))}
            >
              <button
                type="button"
                className={top(groupActive(pathname, entry))}
                aria-expanded={isOpen}
                onClick={() => (isOpen && openedByClick.current ? setOpen(null) : openBy(entry.key, true))}
                data-testid={`menu-toggle-${entry.key}`}
              >
                {t.nav.groups[entry.key]}
                <ChevronDown className={`h-4 w-4 transition ${isOpen ? "rotate-180" : ""}`} aria-hidden />
              </button>
              {isOpen && (
                // The padding bridges the gap to the item, so the pointer can move into the panel.
                <div className="absolute left-1/2 top-full z-50 -translate-x-1/2 pt-2" data-testid={`menu-panel-${entry.key}`}>
                  <div className={`${entry.items.length > 2 ? "w-[min(46rem,94vw)]" : "w-[min(24rem,94vw)]"} rounded-2xl border border-gold/30 bg-night/98 p-3 shadow-2xl backdrop-blur-lg`}>
                    <GroupPanel items={entry.items} pathname={pathname} onNavigate={() => setOpen(null)} />
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

/** The phone menu (☰), grouped like the header, and the bottom bar with the places people go most. */
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

  const row = (node: MenuNode) => {
    const isExpanded = expanded === node.key + node.href;
    const hasQuick = quickLinks(node).length > 0;
    return (
      <li key={node.key + node.href}>
        <div className="flex items-center gap-1">
          <div className="min-w-0 flex-1">
            <ItemLink node={node} onNavigate={() => setOpen(false)} active={isCurrent(pathname, node)} />
          </div>
          {hasQuick && (
            <button
              type="button"
              className="rounded-xl p-3 text-ink/80 hover:bg-white/5"
              aria-expanded={isExpanded}
              aria-label={t.nav.showMenu(t.menu[node.key])}
              onClick={() => setExpanded(isExpanded ? null : node.key + node.href)}
              data-testid={`mobile-toggle-${node.key}`}
            >
              <ChevronDown className={`h-5 w-5 transition ${isExpanded ? "rotate-180" : ""}`} aria-hidden />
            </button>
          )}
        </div>
        {isExpanded && (
          <div className="pb-2">
            <QuickLinks node={node} onNavigate={() => setOpen(false)} />
          </div>
        )}
      </li>
    );
  };

  return (
    <div className="nav:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-full border border-line p-2 text-ink hover:bg-white/5 sm:px-4"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
      >
        {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
        <span className="hidden text-sm font-semibold sm:inline" aria-hidden>{t.nav.menuLabel}</span>
      </button>
      {open && (
        <nav
          id="mobile-menu"
          aria-label={t.nav.main}
          className="absolute inset-x-0 top-full max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain border-b border-line bg-night pb-20 shadow-2xl"
        >
          <div className="container-page space-y-5 py-4">
            <Link href={href(learnPath(t.learn.subject))} className="btn-gold w-full justify-center" data-testid="mobile-learn">
              <GraduationCap className="h-4 w-4" aria-hidden /> {t.nav.learn}
            </Link>
            {groupMenu(menu).map((entry) =>
              entry.kind === "link" ? null : (
                <section key={entry.key} aria-labelledby={`mobile-group-${entry.key}`} data-testid={`mobile-group-${entry.key}`}>
                  <h2 id={`mobile-group-${entry.key}`} className="eyebrow mb-1 border-b border-line pb-2 font-sans">
                    {t.nav.groups[entry.key]}
                  </h2>
                  <ul className="grid gap-x-3 sm:grid-cols-2">{entry.items.map(row)}</ul>
                </section>
              ),
            )}
            <ul className="grid gap-x-3 border-t border-line pt-3 sm:grid-cols-2">
              {groupMenu(menu).flatMap((e) => (e.kind === "link" ? [row(e.node)] : []))}
            </ul>
            <ul className="flex flex-col gap-1">
              <AccountMenuItems />
            </ul>
          </div>
        </nav>
      )}
      <BottomBar pathname={pathname} menuOpen={open} onMenu={() => setOpen((o) => !o)} />
    </div>
  );
}

const noSubscribe = () => () => {};

/**
 * Phones and tablets: Home, Matches, KP Chart, Learn and the menu, always one tap away. Hidden while the
 * audio player bar is up. Drawn into <body>: inside the header, whose backdrop blur makes it the frame
 * for fixed elements, it would stick to the header instead of the bottom of the screen.
 */
function BottomBar({ pathname, menuOpen, onMenu }: { pathname: string; menuOpen: boolean; onMenu: () => void }) {
  const { t, href } = useI18n();
  const { track } = useAudioPlayer();
  // True only in the browser, after hydration: the server has no <body> to draw into.
  const mounted = useSyncExternalStore(noSubscribe, () => true, () => false);
  if (track || !mounted) return null;
  const items = [
    { node: { key: "home", href: "/" } as MenuNode, label: t.menu.home, icon: House },
    { node: { key: "latestMatches", href: "/latest-matches" } as MenuNode, label: t.nav.bottomMatches, icon: Radio },
    { node: { key: "kpChart", href: "/kp-chart" } as MenuNode, label: t.nav.bottomChart, icon: Compass },
    { node: { key: "contact", href: learnPath(t.learn.subject) } as MenuNode, label: t.nav.bottomLearn, icon: GraduationCap },
  ];
  const cell = "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-semibold";
  return createPortal(
    <nav aria-label={t.nav.quickNav} className="fixed inset-x-0 bottom-0 z-40 border-t border-gold/30 bg-night/95 nav:hidden pb-[env(safe-area-inset-bottom)] backdrop-blur-md" data-testid="bottom-bar">
      <ul className="flex">
        {items.map(({ node, label, icon: Icon }) => {
          const active = !menuOpen && node.key !== "contact" && isCurrent(pathname, node);
          return (
            <li key={node.key} className="flex flex-1">
              <Link href={href(node.href)} className={`${cell} ${active ? "text-gold-soft" : "text-ink/75"}`} aria-current={active ? "page" : undefined}>
                <Icon className="h-5 w-5" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
        <li className="flex flex-1">
          <button type="button" onClick={onMenu} className={`${cell} ${menuOpen ? "text-gold-soft" : "text-ink/75"}`} aria-expanded={menuOpen} aria-controls="mobile-menu" data-testid="bottom-menu">
            {menuOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
            {t.nav.menuLabel}
          </button>
        </li>
      </ul>
    </nav>,
    document.body,
  );
}
