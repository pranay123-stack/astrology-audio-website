"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Images, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { imageUrl } from "@/lib/media/urls";

/** A post's photos as a grid; tapping one opens it full size, with arrows (and ← → keys) to move between them. */
export function PhotoGallery({ paths, title, titleLang }: { paths: string[]; title: string; titleLang: string }) {
  const { t } = useI18n();
  const e = t.episode;
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState<number | null>(null);
  const urls = paths.map((p) => imageUrl(p)!);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open !== null && !d.open) d.showModal();
    if (open === null && d.open) d.close();
  }, [open]);

  const step = (by: number) => setOpen((i) => (i === null ? i : (i + by + urls.length) % urls.length));

  return (
    <section aria-labelledby="photos-heading" className="space-y-5" data-testid="photo-gallery">
      <h2 id="photos-heading" className="flex items-center gap-2 font-display text-3xl text-gold-soft">
        <Images className="h-6 w-6" aria-hidden /> {e.photos}
      </h2>
      <ul className={`grid gap-3 ${urls.length === 1 ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3"}`}>
        {urls.map((src, i) => (
          <li key={paths[i]}>
            <button
              type="button"
              onClick={() => setOpen(i)}
              className={`relative block w-full overflow-hidden rounded-2xl border border-line ${urls.length === 1 ? "" : "aspect-square"}`}
              aria-label={e.openPhoto(i + 1)}
            >
              {urls.length === 1 ? (
                <Image src={src} alt={e.photoAlt(i + 1, title)} width={1200} height={900} sizes="(min-width: 1024px) 700px, 100vw" className="h-auto w-full" />
              ) : (
                <Image src={src} alt={e.photoAlt(i + 1, title)} fill sizes="(min-width: 640px) 240px, 50vw" className="object-cover transition hover:scale-105" />
              )}
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        onClose={() => setOpen(null)}
        onKeyDown={(ev) => {
          if (ev.key === "ArrowRight") step(1);
          if (ev.key === "ArrowLeft") step(-1);
        }}
        onClick={(ev) => ev.target === ev.currentTarget && setOpen(null)}
        className="m-auto max-h-none max-w-none bg-transparent p-0 backdrop:bg-black/85"
        data-testid="photo-lightbox"
      >
        {open !== null && (
          <div className="relative flex h-[100dvh] w-screen items-center justify-center p-4 sm:p-10">
            <Image
              src={urls[open]}
              alt={e.photoAlt(open + 1, title)}
              width={1600}
              height={1600}
              sizes="100vw"
              className="h-auto max-h-full w-auto max-w-full rounded-xl object-contain"
            />
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-night/80 px-3 py-1 text-xs text-ink/90" lang={titleLang}>
              {open + 1} / {urls.length}
            </p>
            <button type="button" onClick={() => setOpen(null)} className="absolute top-4 right-4 rounded-full bg-night/80 p-2 text-ink hover:bg-night" aria-label={e.closePhoto}>
              <X className="h-5 w-5" aria-hidden />
            </button>
            {urls.length > 1 && (
              <>
                <button type="button" onClick={() => step(-1)} className="absolute left-3 rounded-full bg-night/80 p-2 text-ink hover:bg-night" aria-label={e.prevPhoto}>
                  <ChevronLeft className="h-6 w-6" aria-hidden />
                </button>
                <button type="button" onClick={() => step(1)} className="absolute right-3 rounded-full bg-night/80 p-2 text-ink hover:bg-night" aria-label={e.nextPhoto}>
                  <ChevronRight className="h-6 w-6" aria-hidden />
                </button>
              </>
            )}
          </div>
        )}
      </dialog>
    </section>
  );
}
