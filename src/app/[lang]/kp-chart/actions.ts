"use server";

import { headers } from "next/headers";
import { birthInputSchema, buildKpChart, type BirthInput, type KpChartResult } from "@/lib/kp/build";
import { rateLimit } from "@/lib/rate-limit";
import { fieldErrors } from "@/lib/validation";

export type ChartResponse = { ok: true; chart: KpChartResult } | { ok: false; error: string; fields?: Record<string, string> };

/** Computes a KP chart for the visitor's birth details. Nothing is stored. */
export async function createKpChart(input: BirthInput): Promise<ChartResponse> {
  const parsed = birthInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the birth details.", fields: fieldErrors(parsed.error) };
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  if (!rateLimit(`kp:${ip}`, 60, 10 * 60 * 1000).ok) return { ok: false, error: "Too many charts in a short time. Please wait a few minutes." };
  try {
    return { ok: true, chart: buildKpChart(parsed.data) };
  } catch (err) {
    console.error("kp chart failed", err);
    return { ok: false, error: err instanceof Error && /Year must/.test(err.message) ? err.message : "The chart could not be calculated." };
  }
}
