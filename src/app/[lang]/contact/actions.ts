"use server";

import { headers } from "next/headers";
import { getServerRepository } from "@/lib/data";
import { getDict, isLocale } from "@/lib/i18n";
import { rateLimit } from "@/lib/rate-limit";
import { contactInputSchema, fieldErrors, type ContactInput } from "@/lib/validation";

export type ContactResult = { ok: true } | { ok: false; error: string; fields?: Record<string, string> };

export async function submitContact(input: ContactInput, language?: string): Promise<ContactResult> {
  const t = getDict(isLocale(language) ? language : "en").form.errors;
  const parsed = contactInputSchema.safeParse(input);
  if (!parsed.success) {
    const fields = fieldErrors(parsed.error);
    for (const key of ["name", "email", "message"] as const) if (fields[key]) fields[key] = t[key];
    return { ok: false, error: t.check, fields };
  }
  // Honeypot filled in: pretend success so bots learn nothing.
  if (parsed.data.website) return { ok: true };

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  if (!rateLimit(`contact:${ip}`, 5, 60 * 60 * 1000).ok) {
    return { ok: false, error: t.rate };
  }

  const { name, email, subject, message } = parsed.data;
  try {
    await getServerRepository().createContactMessage({ name, email, subject, message });
  } catch (err) {
    console.error("contact message failed", err);
    return { ok: false, error: t.failed };
  }
  return { ok: true };
}
