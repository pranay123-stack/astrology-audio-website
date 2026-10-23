/**
 * Birth time handling: a wall-clock time at a place → an exact UTC instant, using the IANA
 * timezone database (historic offsets included, e.g. India's +6:30 war time in 1942–45 and
 * Australian daylight saving).
 */

/** Offset of `zone` from UTC at instant `utcMs`, in minutes (e.g. +330 for India). */
export function zoneOffsetMinutes(zone: string, utcMs: number): number {
  const label =
    new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: "longOffset" })
      .formatToParts(new Date(utcMs))
      .find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  const m = /GMT([+-])(\d{2}):(\d{2})(?::(\d{2}))?/.exec(label);
  if (!m) return 0;
  const minutes = Number(m[2]) * 60 + Number(m[3]) + Number(m[4] ?? 0) / 60;
  return m[1] === "-" ? -minutes : minutes;
}

export interface LocalDateTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

/**
 * UTC instant of a local wall-clock time. With `offsetMinutes` the offset is taken as given
 * (manual override); otherwise it comes from `zone`'s rules for that date.
 */
export function localToUtc(t: LocalDateTime, zone: string, offsetMinutes?: number): { utcMs: number; offsetMinutes: number } {
  const naive = Date.UTC(t.year, t.month - 1, t.day, t.hour, t.minute, t.second);
  if (offsetMinutes !== undefined) return { utcMs: naive - offsetMinutes * 60_000, offsetMinutes };
  // Two passes settle the offset across a daylight-saving change.
  let off = zoneOffsetMinutes(zone, naive);
  off = zoneOffsetMinutes(zone, naive - off * 60_000);
  return { utcMs: naive - off * 60_000, offsetMinutes: off };
}

/** "+05:30" style label for an offset in minutes. */
export function formatOffset(minutes: number): string {
  const sign = minutes < 0 ? "-" : "+";
  const abs = Math.abs(Math.round(minutes));
  return `${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
}
