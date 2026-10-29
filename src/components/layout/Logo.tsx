import Link from "next/link";
import { useId } from "react";
import { siteConfig } from "@/lib/config";
import { getDict, localePath } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  const gid = `logo-gold-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fbe7a1" />
          <stop offset="1" stopColor="#c9971c" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="18" fill="none" stroke={`url(#${gid})`} strokeWidth="1.5" />
      <circle cx="20" cy="20" r="12.5" fill="none" stroke={`url(#${gid})`} strokeOpacity=".5" strokeWidth="1" strokeDasharray="2 3" />
      <path d="M25 11.5a9 9 0 1 0 0 17 7.2 7.2 0 1 1 0-17z" fill={`url(#${gid})`} />
      <circle cx="28.5" cy="12" r="1.4" fill="#fbe7a1" />
    </svg>
  );
}

export function Logo({ lang }: { lang: Locale }) {
  return (
    <Link href={localePath(lang, "/")} className="group flex shrink-0 items-center gap-2.5" aria-label={getDict(lang).nav.homeAria(siteConfig.name)}>
      <LogoMark />
      {/* On laptop widths the full menu needs the room, so only the mark shows there. */}
      <span className="font-display text-xl leading-none font-semibold tracking-wide whitespace-nowrap text-ink group-hover:text-gold-soft sm:text-2xl xl:hidden 2xl:inline">
        {siteConfig.name}
      </span>
    </Link>
  );
}
