import { ClipboardList, ExternalLink } from "lucide-react";
import { getDict } from "@/lib/i18n";
import { parseGoogleForm } from "@/lib/google-form";
import type { Locale } from "@/lib/types";

/** The astrologer's Google Form questionnaire, embedded when its full link is set (Admin → Profile). */
export function Questionnaire({ link, lang }: { link: string | undefined; lang: Locale }) {
  const form = link ? parseGoogleForm(link) : null;
  if (!form) return null;
  const t = getDict(lang).contact;
  return (
    <section id="questionnaire" aria-labelledby="questionnaire-heading" className="container-page scroll-mt-24 pb-16" data-testid="questionnaire">
      <div className="card mx-auto max-w-3xl space-y-5 p-5 sm:p-8">
        <div className="space-y-2">
          <h2 id="questionnaire-heading" className="flex items-center gap-2 text-3xl font-semibold">
            <ClipboardList className="h-7 w-7 text-gold-soft" aria-hidden /> {t.formTitle}
          </h2>
          <p className="text-ink/80">{t.formIntro}</p>
        </div>
        {form.embedUrl && (
          <div className="overflow-hidden rounded-2xl bg-white">
            <iframe src={form.embedUrl} title={t.formTitle} className="h-[2600px] w-full" loading="lazy" data-testid="questionnaire-embed">
              {t.formLoading}
            </iframe>
          </div>
        )}
        <a href={form.openUrl} target="_blank" rel="noopener noreferrer" className={form.embedUrl ? "inline-flex items-center gap-1.5 text-sm text-gold-soft hover:underline" : "btn-gold"}>
          <ExternalLink className="h-4 w-4" aria-hidden /> {t.formOpen}
        </a>
      </div>
    </section>
  );
}
