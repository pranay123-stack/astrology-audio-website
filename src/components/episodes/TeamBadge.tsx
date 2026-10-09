import Image from "next/image";
import { imageUrl } from "@/lib/media/urls";
import type { TeamSummary } from "@/lib/types";

/** Team logo, or a monogram in the team colour when no licensed logo has been uploaded. */
export function TeamBadge({ team, size = 48 }: { team: TeamSummary; size?: number }) {
  const src = imageUrl(team.logo_path);
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 font-bold text-white shadow-inner"
      style={{
        width: size,
        height: size,
        borderColor: `${team.primary_color}`,
        background: src ? "#0b1020" : `radial-gradient(circle at 30% 30%, ${team.primary_color}, #0b1020 120%)`,
        fontSize: size * 0.28,
      }}
    >
      {src ? (
        <Image src={src} alt={`${team.name} logo`} fill sizes={`${size}px`} className="object-contain p-1" />
      ) : (
        <span aria-hidden>{team.short_name}</span>
      )}
    </span>
  );
}
