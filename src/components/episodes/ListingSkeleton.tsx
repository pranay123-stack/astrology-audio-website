import { getDict } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export function ListingSkeleton({ count = 6, lang = "en" }: { count?: number; lang?: Locale }) {
  return (
    <div className="space-y-6" aria-busy="true" aria-label={getDict(lang).common.loading}>
      <div className="h-24 animate-pulse rounded-2xl bg-white/5" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="h-80 animate-pulse rounded-2xl bg-white/5" />
        ))}
      </div>
    </div>
  );
}
