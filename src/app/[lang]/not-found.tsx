"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/client";

// A client component so it can read the page language (not-found pages receive no params).
export default function NotFound() {
  const { t, href } = useI18n();
  return (
    <section className="container-page flex flex-col items-center gap-4 py-28 text-center">
      <p className="eyebrow">404</p>
      <h1 className="text-5xl font-semibold">{t.errors.notFoundTitle}</h1>
      <p className="max-w-md text-muted">{t.errors.notFoundBody}</p>
      <div className="flex gap-3">
        <Link href={href("/")} className="btn-gold">{t.errors.goHome}</Link>
        <Link href={href("/astrology-audios")} className="btn-ghost">{t.errors.browse}</Link>
      </div>
    </section>
  );
}
