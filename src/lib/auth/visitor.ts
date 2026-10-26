"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { kpBrowserClient } from "@/lib/kp/browser-client";

/**
 * The visitor's own Google sign-in (Supabase Auth in the browser), shared by the header's account
 * button and the KP chart page. Separate from the admin login. `enabled` is false when accounts are
 * not configured (NEXT_PUBLIC_KP_ACCOUNTS), and then nothing account-related is shown.
 */
export function useVisitor() {
  const sb = kpBrowserClient();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!sb) return;
    // After the Google redirect the URL carries ?code=…; the client exchanges it, then we tidy the URL.
    const url = new URL(window.location.href);
    if (url.searchParams.has("code")) {
      url.searchParams.delete("code");
      window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
    }
    sb.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setReady(true);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, [sb]);

  /** Google sign-in that comes back to the page the visitor is on. */
  const signIn = () =>
    sb?.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + window.location.pathname + window.location.search },
    });
  const signOut = () => sb?.auth.signOut();

  return { enabled: !!sb, ready, user, signIn, signOut, client: sb };
}

export type Visitor = ReturnType<typeof useVisitor>;
