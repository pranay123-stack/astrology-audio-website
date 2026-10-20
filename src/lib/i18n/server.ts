import { lang } from "next/root-params";
import type { Locale } from "../types";
import { isLocale } from "./locales";

/**
 * The page language, read from the root [lang] segment. Server Components call this instead
 * of awaiting `params`: root params are part of the static shell, so pages stay instant.
 * The [lang] layout rejects unknown values, so the fallback is never shown to visitors.
 */
export async function getLang(): Promise<Locale> {
  const value = await lang();
  return isLocale(value) ? value : "en";
}
