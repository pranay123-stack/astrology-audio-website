import Link from "next/link";
import { ExternalLink, Lock, Mail } from "lucide-react";
import { premiumContactHref } from "@/lib/episodes";
import { getDict } from "@/lib/i18n";
import { imageUrl, videoUrl } from "@/lib/media/urls";
import { parseVideoLink } from "@/lib/media/video-link";
import type { EpisodeListing, Locale } from "@/lib/types";

/**
 * A post's video: the uploaded file (through the access-checked route) and/or an embedded
 * YouTube or Instagram player. Reels are framed tall (9:16), videos wide (16:9).
 */
export function VideoBlock({ episode, locked, lang }: { episode: EpisodeListing; locked: boolean; lang: Locale }) {
  const t = getDict(lang).episode;
  const reel = episode.video_format === "reel";
  const embed = episode.video_link ? parseVideoLink(episode.video_link) : null;
  const frame = reel ? "mx-auto aspect-[9/16] w-full max-w-sm" : "aspect-video w-full";
  const label = reel ? t.reel : t.video;

  return (
    <section aria-label={label} className="space-y-4" data-testid="video-section">
      {episode.video_storage_path &&
        (locked ? (
          <div className="card flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center" data-testid="locked-video">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold/50 text-gold-soft">
              <Lock className="h-5 w-5" aria-hidden />
            </div>
            <p className="flex-1 text-sm text-muted">{t.lockedVideo}</p>
            <Link href={premiumContactHref(episode.title, lang)} className="btn-gold">
              <Mail className="h-4 w-4" aria-hidden /> {t.contactPackage}
            </Link>
          </div>
        ) : (
          <div className={`${frame} overflow-hidden rounded-2xl border border-line bg-black`}>
            <video
              controls
              playsInline
              preload="metadata"
              poster={imageUrl(episode.cover_image_path) ?? undefined}
              src={videoUrl(episode.id)}
              className="h-full w-full"
              data-testid="post-video"
            >
              {t.videoError}
            </video>
          </div>
        ))}

      {embed && !locked && (
        <div className="space-y-2">
          <div className={`${embed.vertical || reel ? "mx-auto aspect-[9/16] w-full max-w-sm" : "aspect-video w-full"} overflow-hidden rounded-2xl border border-line bg-black`}>
            <iframe
              src={embed.embedUrl}
              title={`${label}: ${episode.title}`}
              className="h-full w-full"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              data-testid="video-embed"
            />
          </div>
          <a
            href={embed.watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-1.5 text-sm text-gold-soft hover:underline ${embed.vertical || reel ? "justify-center" : ""}`}
          >
            <ExternalLink className="h-4 w-4" aria-hidden /> {t.watchOn(embed.provider === "youtube" ? "YouTube" : "Instagram")}
          </a>
        </div>
      )}
    </section>
  );
}
