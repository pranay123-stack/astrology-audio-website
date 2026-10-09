import Link from "next/link";
import { Info } from "lucide-react";

export function CricketDisclaimer({ className = "" }: { className?: string }) {
  return (
    <aside className={`flex gap-3 rounded-2xl border border-gold/25 bg-gold/5 p-4 text-sm text-ink/85 ${className}`} role="note">
      <Info className="mt-0.5 h-5 w-5 shrink-0 text-gold-soft" aria-hidden />
      <p>
        These readings are <strong>astrological interpretations</strong>, not verified cricket statistics or form analysis. They do
        not guarantee match outcomes, winnings or betting profits, and should not be used as betting advice.{" "}
        <Link href="/disclaimer" className="text-gold-soft underline underline-offset-2">
          Full disclaimer
        </Link>
        .
      </p>
    </aside>
  );
}
