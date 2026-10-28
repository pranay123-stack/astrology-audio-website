"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LogIn, LogOut, Sparkles, UserRound } from "lucide-react";
import { useVisitor, type Visitor } from "@/lib/auth/visitor";
import { useI18n } from "@/lib/i18n/client";

/** First letter of the visitor's name (or email) for the round account button. */
function initial(user: NonNullable<Visitor["user"]>): string {
  const name = (user.user_metadata?.full_name as string | undefined) || user.email || "?";
  return [...name.trim()][0]?.toUpperCase() ?? "?";
}

/**
 * Header account button (desktop): "Sign in" when signed out; when signed in, a round button with
 * the visitor's initial that opens a menu with their email, "My saved charts" and "Sign out".
 * Renders nothing when visitor accounts are not configured.
 */
export function AccountButton() {
  const visitor = useVisitor();
  const { t, href } = useI18n();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => box.current && !box.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!visitor.enabled || !visitor.ready) return null;
  const a = t.kp.account;

  if (!visitor.user) {
    return (
      <button type="button" onClick={() => void visitor.signIn()} className="btn-ghost px-3 py-1.5 text-sm" data-testid="nav-signin">
        <UserRound className="h-4 w-4" aria-hidden /> {t.nav.signIn}
      </button>
    );
  }

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t.nav.account}
        title={visitor.user.email ?? t.nav.account}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/60 bg-gold/15 font-semibold text-gold-soft hover:bg-gold/25"
        data-testid="nav-account"
      >
        {initial(visitor.user)}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-line bg-night/98 shadow-2xl backdrop-blur-lg">
          <p className="truncate border-b border-line px-4 py-3 text-xs text-muted">{a.signedInAs(visitor.user.email ?? "")}</p>
          <Link role="menuitem" href={href("/kp-chart")} onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-white/5">
            <Sparkles className="h-4 w-4 text-gold-soft" aria-hidden /> {a.myCharts}
          </Link>
          <button
            role="menuitem"
            type="button"
            onClick={() => {
              setOpen(false);
              void visitor.signOut();
            }}
            className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm hover:bg-white/5"
            data-testid="nav-signout"
          >
            <LogOut className="h-4 w-4 text-gold-soft" aria-hidden /> {a.signOut}
          </button>
        </div>
      )}
    </div>
  );
}

/** The same actions as menu rows, for the mobile menu. */
export function AccountMenuItems() {
  const visitor = useVisitor();
  const { t, href } = useI18n();
  if (!visitor.enabled || !visitor.ready) return null;
  const a = t.kp.account;
  const row = "flex w-full items-center gap-2 rounded-xl px-4 py-3 text-left text-base font-medium text-ink/90 hover:bg-white/5";
  const divider = <li className="mt-2 border-t border-line pt-2" aria-hidden />;
  if (!visitor.user) {
    return (
      <>
        {divider}
        <li>
          <button type="button" className={row} onClick={() => void visitor.signIn()} data-testid="mobile-signin">
            <LogIn className="h-5 w-5 text-gold-soft" aria-hidden /> {a.signIn}
          </button>
        </li>
      </>
    );
  }
  return (
    <>
      {divider}
      <li className="px-4 pt-2 text-xs text-muted">{a.signedInAs(visitor.user.email ?? "")}</li>
      <li>
        <Link href={href("/kp-chart")} className={row}>
          <Sparkles className="h-5 w-5 text-gold-soft" aria-hidden /> {a.myCharts}
        </Link>
      </li>
      <li>
        <button type="button" className={row} onClick={() => void visitor.signOut()}>
          <LogOut className="h-5 w-5 text-gold-soft" aria-hidden /> {a.signOut}
        </button>
      </li>
    </>
  );
}
