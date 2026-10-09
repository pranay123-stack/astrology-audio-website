import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`${name} is not set (required in Supabase mode, see .env.example)`);
  return value;
}

// NEXT_PUBLIC_* values are read with literal property access so they are inlined at
// build time, exactly as in browser code. Server and browser therefore always agree,
// and the host only has to provide them during the build.
const url = () => required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
const anonKey = () => required("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
// Server-only secret: read at runtime, never inlined into any bundle.
const serviceKey = () => required("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY);

const noSession = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };

/** Anonymous client with no cookies: safe inside `use cache` scopes; sees only public rows. */
export function createAnonClient(): SupabaseClient {
  return createClient(url(), anonKey(), noSession);
}

/**
 * Service-role client. Bypasses RLS — only for server code that has already
 * authorised the request (signing media URLs, storing contact messages).
 */
export function createServiceClient(): SupabaseClient {
  return createClient(url(), serviceKey(), noSession);
}

/** Client bound to the visitor's auth cookies; RLS applies as that user. */
export async function createSessionClient(): Promise<SupabaseClient> {
  const store = await cookies();
  return createServerClient(url(), anonKey(), {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (toSet) => {
        try {
          for (const { name, value, options } of toSet) store.set(name, value, options);
        } catch {
          // Called from a Server Component, where cookies are read-only. The proxy refreshes sessions.
        }
      },
    },
  });
}
