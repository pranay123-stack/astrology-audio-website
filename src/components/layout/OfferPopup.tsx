"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { popupIsLive, type PopupContent } from "@/content/popup";
import { localePath } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/client";

/** localStorage: the version of the offer this visitor closed. */
const CLOSED_KEY = "offer-popup-closed";

/** The offer set in Admin › Home, shown once per visitor after a short pause. */
export function OfferPopup({ popup, imageSrc }: { popup: PopupContent; imageSrc: string | null }) {
  const { lang } = useI18n();
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!popupIsLive(popup, Date.now())) return;
    let closed: string | null = null;
    try {
      closed = window.localStorage.getItem(CLOSED_KEY);
    } catch {
      /* storage blocked: show it, it can still be closed */
    }
    if (closed === popup.version) return;
    const t = window.setTimeout(() => setOpen(true), 1500);
    return () => window.clearTimeout(t);
  }, [popup]);

  useEffect(() => {
    const d = dialog.current;
    if (open && d && !d.open) d.showModal();
  }, [open]);

  const close = () => {
    try {
      window.localStorage.setItem(CLOSED_KEY, popup.version);
    } catch {
      /* storage blocked */
    }
    dialog.current?.close();
    setOpen(false);
  };

  if (!open) return null;
  const hi = lang === "hi";
  const title = (hi && popup.title_hi) || popup.title_en;
  const text = (hi && popup.text_hi) || popup.text_en;
  const button = (hi && popup.button_hi) || popup.button_en;
  const external = /^https?:\/\//.test(popup.link);
  const href = external ? popup.link : localePath(lang, popup.link);
  return (
    <dialog
      ref={dialog}
      onClose={close}
      onClick={(e) => e.target === e.currentTarget && close()}
      aria-labelledby="offer-title"
      className="m-auto w-[calc(100vw-2rem)] max-w-md overflow-hidden rounded-3xl border border-gold/40 bg-night p-0 text-ink shadow-2xl backdrop:bg-black/70"
      data-testid="offer-popup"
    >
      <div className="relative">
        {imageSrc && <Image src={imageSrc} alt="" width={900} height={600} sizes="(max-width: 480px) 100vw, 448px" className="max-h-72 w-full object-cover" />}
        <button type="button" onClick={close} className="absolute top-3 right-3 rounded-full bg-night/85 p-2 text-ink hover:bg-night" aria-label={hi ? "बंद करें" : "Close"} data-testid="offer-close">
          <X className="h-5 w-5" aria-hidden />
        </button>
        <div className="space-y-3 p-6">
          <h2 id="offer-title" className="font-display text-3xl font-semibold text-gold-soft" lang={hi && popup.title_hi ? "hi" : "en"}>
            {title}
          </h2>
          {text && (
            <p className="whitespace-pre-line text-ink/85" lang={hi && popup.text_hi ? "hi" : "en"}>
              {text}
            </p>
          )}
          {button && popup.link && (
            <div className="pt-2">
              {external ? (
                <a href={href} target="_blank" rel="noopener noreferrer" onClick={close} className="btn-gold w-full justify-center" data-testid="offer-button">
                  {button}
                </a>
              ) : (
                <Link href={href} onClick={close} className="btn-gold w-full justify-center" data-testid="offer-button">
                  {button}
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}
