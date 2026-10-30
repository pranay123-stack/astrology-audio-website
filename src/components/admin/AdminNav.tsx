"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen, ClipboardList, Compass, ExternalLink, FileStack, FlaskConical, Home, Inbox, LayoutDashboard, LogOut, Phone, Plus, Quote, Scale, Sparkles, Sun, Telescope, Trophy, UserRound,
  type LucideIcon,
} from "lucide-react";
import { logoutAction } from "@/app/admin/actions";
import { ADMIN_SECTIONS, type AdminSection } from "@/lib/admin-site";

const SECTION_ICONS: Partial<Record<AdminSection["key"], LucideIcon>> = {
  home: Home,
  astrology: Sparkles,
  astroCricket: Trophy,
  book: BookOpen,
  research: Telescope,
  kpChart: Compass,
  contact: Phone,
  rules: Scale,
  predictionRecords: ClipboardList,
  testimonials: Quote,
  futureResearch: FlaskConical,
  krishna: Sun,
};

const TOP = [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true }];
const MANAGE = [
  { href: "/admin/episodes", label: "All posts", icon: FileStack, exact: false },
  { href: "/admin/episodes/new", label: "New post", icon: Plus, exact: true },
  { href: "/admin/leagues", label: "Leagues & teams", icon: Trophy, exact: false },
  { href: "/admin/profile", label: "Profile", icon: UserRound, exact: false },
  { href: "/admin/messages", label: "Messages", icon: Inbox, exact: false },
];

export function AdminNav() {
  const pathname = usePathname();
  const active = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname === href || (pathname.startsWith(`${href}/`) && !pathname.startsWith("/admin/episodes/new"));
  const item = ({ href, label, icon: Icon, exact }: (typeof TOP)[number]) => (
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
  );
  const heading = (text: string) => <p className="eyebrow mt-3 hidden px-3 lg:block">{text}</p>;
  return (
    <nav aria-label="Admin" className="flex gap-1 overflow-x-auto lg:flex-col" data-testid="admin-nav">
      {TOP.map(item)}
      {heading("Website menu")}
      {ADMIN_SECTIONS.map((s) => item({ href: `/admin/site/${s.key}`, label: s.title, icon: SECTION_ICONS[s.key] ?? Sparkles, exact: false }))}
      {heading("Manage")}
      {MANAGE.map(item)}
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
