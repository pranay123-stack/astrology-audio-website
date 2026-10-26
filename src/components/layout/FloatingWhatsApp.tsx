"use client";

import { useAudioPlayer } from "@/components/audio/AudioPlayerProvider";
import { useI18n } from "@/lib/i18n/client";

/** Round WhatsApp button fixed to the corner of every page; moves up while the audio player bar is open. */
export function FloatingWhatsApp({ href }: { href: string }) {
  const { t } = useI18n();
  const { track } = useAudioPlayer();
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t.whatsappFloat}
      title={t.whatsappFloat}
      className={`fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-[0_8px_30px_-6px_rgb(0_0_0/0.6)] transition hover:scale-105 sm:right-6 ${
        track ? "bottom-36 sm:bottom-28" : "bottom-5 sm:bottom-6"
      }`}
      data-testid="whatsapp-float"
    >
      <svg viewBox="0 0 32 32" className="h-7 w-7" fill="currentColor" aria-hidden>
        <path d="M16.04 3C9 3 3.3 8.7 3.3 15.73c0 2.25.59 4.45 1.7 6.38L3.2 29l7.07-1.85a12.7 12.7 0 0 0 5.77 1.38h.01c7.03 0 12.74-5.7 12.74-12.73 0-3.4-1.33-6.6-3.73-9A12.66 12.66 0 0 0 16.04 3Zm0 23.36h-.01c-1.9 0-3.77-.51-5.4-1.48l-.39-.23-4.2 1.1 1.12-4.1-.25-.42a10.57 10.57 0 0 1-1.62-5.6c0-5.84 4.75-10.6 10.6-10.6 2.83 0 5.49 1.1 7.49 3.11a10.5 10.5 0 0 1 3.1 7.49c0 5.85-4.76 10.6-10.6 10.6Zm5.81-7.94c-.32-.16-1.88-.93-2.17-1.03-.29-.11-.5-.16-.71.16-.21.32-.82 1.03-1 1.24-.19.21-.37.24-.69.08-.32-.16-1.34-.5-2.55-1.58a9.57 9.57 0 0 1-1.77-2.2c-.18-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.18.21-.32.32-.53.1-.21.05-.4-.03-.56-.08-.16-.71-1.71-.98-2.34-.26-.62-.52-.53-.71-.54h-.61c-.21 0-.56.08-.85.4-.29.32-1.11 1.09-1.11 2.65s1.14 3.08 1.3 3.29c.16.21 2.24 3.42 5.43 4.8.76.33 1.35.52 1.81.67.76.24 1.45.2 2 .12.61-.09 1.88-.77 2.14-1.51.27-.74.27-1.38.19-1.51-.08-.13-.29-.21-.61-.37Z" />
      </svg>
    </a>
  );
}
