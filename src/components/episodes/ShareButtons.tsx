"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";

/** "Share on WhatsApp" (opens WhatsApp with the title and link) and "Copy link" for a post. */
export function ShareButtons({ title, url }: { title: string; url: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const wa = `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`;
  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="share-buttons">
      <a
        href={wa}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-full bg-[#25d366] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
        data-testid="share-whatsapp"
      >
        <svg viewBox="0 0 32 32" className="h-4 w-4" fill="currentColor" aria-hidden>
          <path d="M16.04 3C9 3 3.3 8.7 3.3 15.73c0 2.25.59 4.45 1.7 6.38L3.2 29l7.07-1.85a12.7 12.7 0 0 0 5.77 1.38h.01c7.03 0 12.74-5.7 12.74-12.73 0-3.4-1.33-6.6-3.73-9A12.66 12.66 0 0 0 16.04 3Z" />
        </svg>
        {t.episode.shareWhatsApp}
      </a>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            /* clipboard blocked: nothing to do */
          }
        }}
        className="btn-ghost px-4 py-2 text-sm"
        data-testid="copy-link"
      >
        {copied ? <Check className="h-4 w-4" aria-hidden /> : <Link2 className="h-4 w-4" aria-hidden />}
        {copied ? t.episode.copied : t.episode.copyLink}
      </button>
    </div>
  );
}
