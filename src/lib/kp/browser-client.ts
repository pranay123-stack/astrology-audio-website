"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Saved charts need Supabase and the Google sign-in to be configured (NEXT_PUBLIC_KP_ACCOUNTS=true). */
export const kpAccountsEnabled =
  process.env.NEXT_PUBLIC_KP_ACCOUNTS === "true" &&
  process.env.NEXT_PUBLIC_DATA_BACKEND !== "local" &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

/** Browser Supabase client for the visitor's own session (RLS limits it to their own charts). */
export function kpBrowserClient(): SupabaseClient | null {
  if (!kpAccountsEnabled) return null;
  client ??= createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  return client;
}
