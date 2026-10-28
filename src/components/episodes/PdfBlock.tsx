import { Download, ExternalLink, FileText } from "lucide-react";
import { getDict } from "@/lib/i18n";
import { parseDriveLink } from "@/lib/media/drive-link";
import { documentUrl } from "@/lib/media/urls";
import type { EpisodeListing, Locale } from "@/lib/types";

/** A post's PDF (an upload, or a Google Drive file): read on the page, open or download free. */
export function PdfBlock({ episode, lang }: { episode: EpisodeListing; lang: Locale }) {
  const t = getDict(lang).episode;
  const uploaded = documentUrl(episode.pdf_storage_path);
  const drive = uploaded ? null : parseDriveLink(episode.pdf_link);
  const view = uploaded ?? drive?.viewUrl;
  if (!view) return null;
  const embed = uploaded ? `${uploaded}#view=FitH` : drive!.embedUrl;
  const download = uploaded ?? `https://drive.google.com/uc?export=download&id=${drive!.fileId}`;
  return (
    <section aria-labelledby="pdf-heading" className="card space-y-3 p-5" data-testid="pdf-block">
      <h2 id="pdf-heading" className="flex items-center gap-2 font-display text-2xl text-gold-soft">
        <FileText className="h-5 w-5" aria-hidden /> {t.pdfTitle}
      </h2>
      {/* Phones often cannot show a PDF inside the page; the buttons below always work. */}
      <div className="hidden overflow-hidden rounded-xl border border-line bg-white sm:block">
        <iframe src={embed} title={`${t.pdfTitle}: ${episode.title}`} className="h-[75vh] w-full" loading="lazy" data-testid="pdf-embed" />
      </div>
      <div className="flex flex-wrap gap-3">
        <a href={view} target="_blank" rel="noopener noreferrer" className="btn-gold" data-testid="pdf-open">
          <ExternalLink className="h-4 w-4" aria-hidden /> {t.openPdf}
        </a>
        <a href={download} download={uploaded ? `${episode.slug}.pdf` : undefined} className="btn-ghost" data-testid="pdf-download">
          <Download className="h-4 w-4" aria-hidden /> {t.downloadPdf}
        </a>
      </div>
    </section>
  );
}
