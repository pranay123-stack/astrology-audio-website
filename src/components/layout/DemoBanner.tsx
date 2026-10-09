import { FlaskConical } from "lucide-react";
import { getDemoContentCount } from "@/lib/queries";

/** Site-wide notice shown while any demonstration episode is published. */
export async function DemoBanner() {
  const count = await getDemoContentCount();
  if (count === 0) return null;
  return (
    <div className="border-b border-sky-300/20 bg-sky-500/10 text-sky-100" role="note" data-testid="demo-banner">
      <p className="container-page flex items-center justify-center gap-2 py-2 text-center text-xs sm:text-sm">
        <FlaskConical className="h-4 w-4 shrink-0" aria-hidden />
        This site is showing sample content. Fixtures, team names and audio marked “Sample” are placeholders, not real predictions.
      </p>
    </div>
  );
}
