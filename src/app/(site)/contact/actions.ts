"use server";

import { headers } from "next/headers";
import { getServerRepository } from "@/lib/data";
import { rateLimit } from "@/lib/rate-limit";
import { contactInputSchema, fieldErrors, type ContactInput } from "@/lib/validation";

export type ContactResult = { ok: true } | { ok: false; error: string; fields?: Record<string, string> };

export async function submitContact(input: ContactInput): Promise<ContactResult> {
  const parsed = contactInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check the highlighted fields.", fields: fieldErrors(parsed.error) };
  }
  // Honeypot filled in: pretend success so bots learn nothing.
  if (parsed.data.website) return { ok: true };

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  if (!rateLimit(`contact:${ip}`, 5, 60 * 60 * 1000).ok) {
    return { ok: false, error: "You have sent several messages recently. Please try again later." };
  }

  const { name, email, subject, message } = parsed.data;
  try {
    await getServerRepository().createContactMessage({ name, email, subject, message });
  } catch (err) {
    console.error("contact message failed", err);
    return { ok: false, error: "Your message could not be sent right now. Please try again later." };
  }
  return { ok: true };
}
