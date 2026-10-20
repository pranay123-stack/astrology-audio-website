import Link from "next/link";
import { getDict } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export function LoadMore({ shown, total, href, lang }: { shown: number; total: number; href: string; lang: Locale }) {
  const t = getDict(lang).common;
  return (
    <div className="mt-10 flex flex-col items-center gap-3">
      <p className="text-sm text-muted" aria-live="polite">
        {t.showing(shown, total)}
      </p>
      {shown < total && (
        <Link href={href} scroll={false} className="btn-ghost px-6" data-testid="load-more">
          {t.loadMore}
        </Link>
      )}
    </div>
  );
}
