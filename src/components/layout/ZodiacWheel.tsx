import { useId } from "react";

const SIGNS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];

/** Decorative zodiac wheel for the hero. Pure SVG, no external assets. */
export function ZodiacWheel({ className = "", center = "sun" }: { className?: string; center?: "sun" | "ball" }) {
  const c = 200;
  // Unique gradient ids: the wheel can appear several times on a page, and a gradient
  // defined inside a hidden copy would not paint in the visible one.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const id = (name: string) => `${name}-${uid}`;
  return (
    <svg viewBox="0 0 400 400" className={className} aria-hidden>
      <defs>
        <linearGradient id={id("zw-gold")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fbe7a1" />
          <stop offset="1" stopColor="#b8891a" />
        </linearGradient>
        <radialGradient id={id("zw-ball")} cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#e2554a" />
          <stop offset=".6" stopColor="#a3201c" />
          <stop offset="1" stopColor="#5a0d0d" />
        </radialGradient>
        <radialGradient id={id("zw-core")} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#f3d27a" stopOpacity=".55" />
          <stop offset=".45" stopColor="#7c3aed" stopOpacity=".25" />
          <stop offset="1" stopColor="#060818" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={c} cy={c} r="190" fill={`url(#${id("zw-core")})`} />
      <g className="animate-slow-spin" style={{ transformOrigin: "200px 200px" }}>
        <circle cx={c} cy={c} r="182" fill="none" stroke={`url(#${id("zw-gold")})`} strokeWidth="1.5" />
        <circle cx={c} cy={c} r="140" fill="none" stroke={`url(#${id("zw-gold")})`} strokeWidth="1" strokeOpacity=".7" />
        {SIGNS.map((sign, i) => {
          const a = (i * Math.PI) / 6 - Math.PI / 2;
          const mid = a + Math.PI / 12;
          return (
            <g key={sign}>
              <line
                x1={c + Math.cos(a) * 140}
                y1={c + Math.sin(a) * 140}
                x2={c + Math.cos(a) * 182}
                y2={c + Math.sin(a) * 182}
                stroke={`url(#${id("zw-gold")})`}
                strokeOpacity=".7"
              />
              <text
                x={c + Math.cos(mid) * 161}
                y={c + Math.sin(mid) * 161}
                fill="#f3d27a"
                fontSize="20"
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily="'Segoe UI Symbol','Apple Symbols','DejaVu Sans','Noto Sans Symbols',sans-serif"
              >
                {sign + "︎"}
              </text>
            </g>
          );
        })}
        {Array.from({ length: 72 }, (_, i) => {
          const a = (i * Math.PI) / 36;
          return (
            <line
              key={i}
              x1={c + Math.cos(a) * 182}
              y1={c + Math.sin(a) * 182}
              x2={c + Math.cos(a) * (i % 6 === 0 ? 192 : 187)}
              y2={c + Math.sin(a) * (i % 6 === 0 ? 192 : 187)}
              stroke="#f3d27a"
              strokeOpacity=".5"
            />
          );
        })}
      </g>
      <circle cx={c} cy={c} r="96" fill="none" stroke="#f3d27a" strokeOpacity=".35" strokeDasharray="3 6" />
      <polygon
        points={[0, 1, 2].map((k) => `${c + Math.cos((k * 2 * Math.PI) / 3 - Math.PI / 2) * 96},${c + Math.sin((k * 2 * Math.PI) / 3 - Math.PI / 2) * 96}`).join(" ")}
        fill="none"
        stroke="#f3d27a"
        strokeOpacity=".3"
      />
      <polygon
        points={[0, 1, 2].map((k) => `${c + Math.cos((k * 2 * Math.PI) / 3 + Math.PI / 2) * 96},${c + Math.sin((k * 2 * Math.PI) / 3 + Math.PI / 2) * 96}`).join(" ")}
        fill="none"
        stroke="#f3d27a"
        strokeOpacity=".3"
      />
      {center === "ball" ? (
        // A cricket ball as the "sun" of the chart: leather with a gold stitched seam.
        <g>
          <circle cx={c} cy={c} r="36" fill={`url(#${id("zw-ball")})`} />
          <path d={`M${c - 9} ${c - 35} C${c - 22} ${c - 12} ${c - 22} ${c + 12} ${c - 9} ${c + 35}`} fill="none" stroke="#f3d27a" strokeWidth="1.6" />
          <path d={`M${c + 9} ${c - 35} C${c + 22} ${c - 12} ${c + 22} ${c + 12} ${c + 9} ${c + 35}`} fill="none" stroke="#f3d27a" strokeWidth="1.6" />
          {Array.from({ length: 9 }, (_, i) => {
            const t = (i + 1) / 10;
            const y = c - 30 + t * 60;
            const dx = Math.sin(t * Math.PI) * 11;
            return (
              <g key={i} stroke="#fbe7a1" strokeWidth="1.2" strokeLinecap="round">
                <line x1={c - 9 - dx - 3} y1={y} x2={c - 9 - dx + 3} y2={y - 2} />
                <line x1={c + 9 + dx - 3} y1={y - 2} x2={c + 9 + dx + 3} y2={y} />
              </g>
            );
          })}
          <circle cx={c - 12} cy={c - 14} r="9" fill="#fff" opacity=".12" />
        </g>
      ) : (
        <circle cx={c} cy={c} r="34" fill={`url(#${id("zw-gold")})`} />
      )}
      <circle cx={c} cy={c} r="44" fill="none" stroke="#f3d27a" strokeOpacity=".5" />
      <circle cx={c + 120} cy={c - 64} r="7" fill="#c4b5fd" />
      <circle cx={c - 108} cy={c + 80} r="5" fill="#93c5fd" />
      <circle cx={c - 70} cy={c - 112} r="4" fill="#fbe7a1" />
    </svg>
  );
}
