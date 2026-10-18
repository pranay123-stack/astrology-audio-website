/** Deterministic star field (same output on server and client, so no hydration mismatch). */
function stars(count: number, seed: number) {
  let s = seed;
  const rand = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  return Array.from({ length: count }, () => ({
    x: rand() * 100,
    y: rand() * 100,
    r: rand() * 1.2 + 0.2,
    delay: rand() * 4,
    bright: rand() > 0.85,
  }));
}

const FIELD = stars(140, 42);

export function Starfield({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_20%_0%,rgb(220_38_38/0.4),transparent_60%),radial-gradient(ellipse_60%_50%_at_90%_20%,rgb(252_196_25/0.22),transparent_60%),radial-gradient(ellipse_70%_50%_at_50%_100%,rgb(252_196_25/0.12),transparent_70%)]" />
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        {FIELD.map((st, i) => (
          <circle
            key={i}
            cx={`${st.x}%`}
            cy={`${st.y}%`}
            r={st.r}
            fill={st.bright ? "#f3d27a" : "#ffffff"}
            className={st.bright ? "animate-twinkle" : undefined}
            style={st.bright ? { animationDelay: `${st.delay}s` } : { opacity: 0.55 }}
          />
        ))}
      </svg>
    </div>
  );
}
