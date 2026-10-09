"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, Inbox, LayoutDashboard, ListMusic, LogOut, Plus, Trophy, UserRound } from "lucide-react";
import { logoutAction } from "@/app/admin/actions";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/episodes", label: "Episodes", icon: ListMusic, exact: false },
  { href: "/admin/episodes/new", label: "New episode", icon: Plus, exact: true },
  { href: "/admin/leagues", label: "Leagues & teams", icon: Trophy, exact: false },
  { href: "/admin/profile", label: "Profile", icon: UserRound, exact: false },
  { href: "/admin/messages", label: "Messages", icon: Inbox, exact: false },
];

export function AdminNav() {
  const pathname = usePathname();
  const active = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname === href || (pathname.startsWith(`${href}/`) && !pathname.startsWith("/admin/episodes/new"));
  return (
    <nav aria-label="Admin" className="flex gap-1 overflow-x-auto lg:flex-col">
      {LINKS.map(({ href, label, icon: Icon, exact }) => (
        <Link
          key={href}
          href={href}
          aria-current={active(href, exact) ? "page" : undefined}
          className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium ${
            active(href, exact) ? "bg-white/10 text-gold-soft" : "text-ink/80 hover:bg-white/5"
          }`}
        >
          <Icon className="h-4 w-4" aria-hidden /> {label}
        </Link>
      ))}
      <Link href="/" target="_blank" className="flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink/80 hover:bg-white/5">
        <ExternalLink className="h-4 w-4" aria-hidden /> View site
      </Link>
      <form action={logoutAction}>
        <button type="submit" className="flex w-full shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink/80 hover:bg-white/5">
          <LogOut className="h-4 w-4" aria-hidden /> Sign out
        </button>
      </form>
    </nav>
  );
}
