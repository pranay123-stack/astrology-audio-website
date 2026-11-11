"use server";

import { headers } from "next/headers";
import { nakshatraWindow, type NakshatraWindow } from "@/lib/kp/engine";
import { rateLimit } from "@/lib/rate-limit";

export type WindowResponse = { ok: true; window: NakshatraWindow } | { ok: false; error: string };

/** Years the Moon search is offered for (the ephemeris goes far wider; this keeps input sane). */
const MIN_MS = Date.UTC(1800, 0, 1);
const MAX_MS = Date.UTC(2200, 0, 1);

/** The Moon's nakshatra at a moment and when it entered and leaves it. Nothing is stored. */
export async function getNakshatraWindow(atUtcMs: number): Promise<WindowResponse> {
  if (typeof atUtcMs !== "number" || !Number.isFinite(atUtcMs) || atUtcMs < MIN_MS || atUtcMs > MAX_MS) {
    return { ok: false, error: "Please choose a date between 1800 and 2200." };
  }
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  if (!rateLimit(`nakdasha:${ip}`, 120, 10 * 60 * 1000).ok) return { ok: false, error: "Too many requests in a short time. Please wait a few minutes." };
  try {
    return { ok: true, window: nakshatraWindow(atUtcMs) };
  } catch (err) {
    console.error("nakshatra window failed", err);
    return { ok: false, error: "The Moon's position could not be calculated." };
  }
}
