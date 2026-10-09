"use client";

import { useEffect, useState } from "react";

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

/** Live countdown to the first ball. Renders nothing until mounted, so server and client HTML match. */
export function Countdown({ to }: { to: string }) {
  const target = Date.parse(to);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- start the clock after hydration
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (now === null) return <div className="h-[58px]" aria-hidden />;
  if (target <= now) {
    return <p className="text-sm font-semibold text-gold-soft">Match under way or completed</p>;
  }
  const { d, h, m, s } = parts(target - now);
  const cells = [
    { v: d, l: "Days" },
    { v: h, l: "Hrs" },
    { v: m, l: "Min" },
    { v: s, l: "Sec" },
  ];
  return (
    <div role="timer" aria-label={`Starts in ${d} days ${h} hours ${m} minutes`} className="flex gap-2" data-testid="countdown">
      {cells.map((c) => (
        <div key={c.l} className="flex w-14 flex-col items-center rounded-xl border border-line bg-night/60 py-1.5">
          <span className="font-display text-2xl leading-none font-semibold text-gold-soft tabular-nums">{String(c.v).padStart(2, "0")}</span>
          <span className="mt-1 text-[10px] tracking-wider text-muted uppercase">{c.l}</span>
        </div>
      ))}
    </div>
  );
}
