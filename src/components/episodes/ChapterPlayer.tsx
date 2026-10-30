"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { getDict } from "@/lib/i18n";
import { parseDriveLink } from "@/lib/media/drive-link";
import type { AudioChapter, Locale } from "@/lib/types";

/**
 * An audiobook kept in Google Drive: Drive's player for the chosen chapter and the list of chapters.
 * Drive's player can't report when a chapter ends, so the listener moves on with Next.
 */
export function ChapterPlayer({ chapters, title, lang }: { chapters: AudioChapter[]; title: string; lang: Locale }) {
  const t = getDict(lang).episode;
  const playable = chapters.flatMap((c) => {
    const drive = parseDriveLink(c.link);
    return drive ? [{ ...c, drive }] : [];
  });
  const [at, setAt] = useState(0);
  const current = playable[at];
  if (!current) return null;
  const n = playable.length;
  return (
    <div className="space-y-3" data-testid="chapter-player">
      <p className="text-sm text-muted" aria-live="polite">
        {t.chapterOf(at + 1, n)}: <span className="text-ink">{current.title}</span>
      </p>
      <div className="overflow-hidden rounded-xl border border-line bg-black">
        <iframe
          key={current.drive.fileId}
          src={current.drive.embedUrl}
          title={`${t.listenTitle}: ${title}, ${current.title}`}
          className="h-48 w-full"
          loading="lazy"
          allow="autoplay"
          data-testid="drive-embed"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn-ghost text-sm" disabled={at === 0} onClick={() => setAt(at - 1)}>
          <ChevronLeft className="h-4 w-4" aria-hidden /> {t.prevChapter}
        </button>
        <button type="button" className="btn-ghost text-sm" disabled={at === n - 1} onClick={() => setAt(at + 1)}>
          {t.nextChapter} <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
        <a href={current.drive.viewUrl} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex items-center gap-1 text-xs text-gold-soft hover:underline">
          <ExternalLink className="h-3.5 w-3.5" aria-hidden /> {t.openDrive}
        </a>
      </div>
      <ol className="max-h-80 divide-y divide-line overflow-y-auto rounded-xl border border-line" aria-label={t.chapters(n)}>
        {playable.map((c, i) => (
          <li key={c.drive.fileId}>
            <button
              type="button"
              onClick={() => setAt(i)}
              aria-current={i === at ? "true" : undefined}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-white/5 ${i === at ? "bg-white/5 text-gold-soft" : "text-ink/85"}`}
            >
              <span className="w-6 shrink-0 text-right text-muted">{i + 1}.</span>
              <span>{c.title}</span>
            </button>
          </li>
        ))}
      </ol>
      <p className="text-xs text-muted">{t.driveNote}</p>
    </div>
  );
}
