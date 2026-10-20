import { siteConfig } from "./config";
import { getDict, intlLocale } from "./i18n";
import type { Locale } from "./types";

/** Offset (ms) of `timeZone` from UTC at the given instant. */
function tzOffsetMs(instant: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(instant));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - Math.floor(instant / 1000) * 1000;
}

/** Converts a wall-clock time in `timeZone` to a UTC instant (ms). */
export function zonedTimeToUtc(
  y: number,
  mo: number,
  d: number,
  h = 0,
  mi = 0,
  timeZone = siteConfig.timeZone,
): number {
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const first = guess - tzOffsetMs(guess, timeZone);
  // Re-evaluate once in case the guess straddled a DST change.
  return guess - tzOffsetMs(first, timeZone);
}

/** Start/end instants of a YYYY-MM-DD calendar day in the site timezone. */
export function dayBounds(date: string, timeZone = siteConfig.timeZone): { start: number; end: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const start = zonedTimeToUtc(y, mo, d, 0, 0, timeZone);
  const next = new Date(Date.UTC(y, mo - 1, d + 1));
  const end = zonedTimeToUtc(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate(), 0, 0, timeZone) - 1;
  return { start, end };
}

export function formatDate(iso: string | null | undefined, lang: Locale = "en", timeZone = siteConfig.timeZone): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat(intlLocale(lang), { timeZone, day: "numeric", month: "short", year: "numeric" }).format(
    new Date(iso),
  );
}

export function formatDateTime(iso: string | null | undefined, lang: Locale = "en", timeZone = siteConfig.timeZone): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat(intlLocale(lang), {
    timeZone,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(iso));
}

export function formatDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "0:00";
  const s = Math.floor(totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

/** "42 min", "1 hr 5 min", "45 sec" (or the Hindi equivalents) — for card metadata. */
export function formatDurationLabel(totalSeconds: number, lang: Locale = "en"): string {
  const t = getDict(lang).length;
  const s = Math.max(0, Math.round(totalSeconds));
  if (s < 60) return t.sec(s);
  const h = Math.floor(s / 3600);
  const m = Math.round((s % 3600) / 60);
  return h > 0 ? t.hrMin(h, m) : t.min(m);
}

/** ISO instant -> value for <input type="datetime-local"> in the site timezone. */
export function toZonedInputValue(iso: string | null | undefined, timeZone = siteConfig.timeZone): string {
  if (!iso) return "";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const local = new Date(t + tzOffsetMs(t, timeZone));
  return local.toISOString().slice(0, 16);
}

/** <input type="datetime-local"> value interpreted in the site timezone -> ISO instant. */
export function fromZonedInputValue(value: string, timeZone = siteConfig.timeZone): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!m) return "";
  return new Date(
    zonedTimeToUtc(Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4]), Number(m[5]), timeZone),
  ).toISOString();
}
