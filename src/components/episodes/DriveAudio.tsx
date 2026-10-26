import { ExternalLink, Headphones } from "lucide-react";
import { getDict } from "@/lib/i18n";
import { parseDriveLink } from "@/lib/media/drive-link";
import type { EpisodeListing, Locale } from "@/lib/types";

/** Audio kept in Google Drive (e.g. an audiobook), played with Drive's embedded player. */
export function DriveAudio({ episode, lang }: { episode: EpisodeListing; lang: Locale }) {
  const drive = parseDriveLink(episode.audio_link);
  if (!drive) return null;
  const t = getDict(lang).episode;
  return (
    <section aria-labelledby="drive-audio-heading" className="card space-y-3 p-5" data-testid="drive-audio">
      <h2 id="drive-audio-heading" className="flex items-center gap-2 font-display text-2xl text-gold-soft">
        <Headphones className="h-5 w-5" aria-hidden /> {t.listenTitle}
      </h2>
      <div className="overflow-hidden rounded-xl border border-line bg-black">
        <iframe
          src={drive.embedUrl}
          title={`${t.listenTitle}: ${episode.title}`}
          className="h-48 w-full"
          loading="lazy"
          allow="autoplay"
          data-testid="drive-embed"
        />
      </div>
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        <span>{t.driveNote}</span>
        <a href={drive.viewUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-gold-soft hover:underline">
          <ExternalLink className="h-3.5 w-3.5" aria-hidden /> {t.openDrive}
        </a>
      </p>
    </section>
  );
}
