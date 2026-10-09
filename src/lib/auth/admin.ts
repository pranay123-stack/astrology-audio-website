import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getDataBackend } from "../config";
import { createSessionClient } from "../data/supabase-clients";
import { rateLimit } from "../rate-limit";
import { signToken, verifyPassword, verifyToken } from "./tokens";

export interface AdminUser {
  id: string;
  email: string;
}

const COOKIE = "admin_session";
const SESSION_TTL_SECONDS = 12 * 60 * 60;

function localAdminEmail(): string | null {
  return process.env.ADMIN_EMAIL?.trim().toLowerCase() || null;
}

/** The signed-in administrator, or null. Never throws for anonymous visitors. */
export async function getAdmin(): Promise<AdminUser | null> {
  // Session checks compare against the current time, so they always run at request time.
  await connection();
  if (getDataBackend() === "local") {
    const token = (await cookies()).get(COOKIE)?.value;
    if (!token || !process.env.SESSION_SECRET) return null;
    const payload = verifyToken<{ sub: string; purpose: string }>(token);
    const email = localAdminEmail();
    // Changing ADMIN_EMAIL invalidates existing sessions.
    if (!payload || payload.purpose !== "admin" || !email || payload.sub !== email) return null;
    return { id: "local-admin", email };
  }

  const supabase = await createSessionClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) return null;
  return { id: data.user.id, email: data.user.email ?? "" };
}

/** For admin pages and server actions: redirects to the login page when not signed in. */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

async function clientKey(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

export type LoginResult = { ok: true } | { ok: false; error: string };

export async function loginAdmin(email: string, password: string): Promise<LoginResult> {
  const normalized = email.trim().toLowerCase();
  const limit = rateLimit(`admin-login:${await clientKey()}`, 10, 15 * 60 * 1000);
  if (!limit.ok) {
    return { ok: false, error: `Too many attempts. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minutes.` };
  }
  const invalid: LoginResult = { ok: false, error: "Incorrect email or password." };

  if (getDataBackend() === "local") {
    const expected = localAdminEmail();
    const hash = process.env.ADMIN_PASSWORD_HASH;
    if (!expected || !hash || !process.env.SESSION_SECRET) {
      return { ok: false, error: "Admin login is not configured. Run `npm run setup:local` (see README)." };
    }
    // Always run the hash comparison so response time does not reveal whether the email matched.
    const passwordOk = await verifyPassword(password, hash);
    if (!passwordOk || normalized !== expected) return invalid;
    const token = signToken({ sub: expected, purpose: "admin" }, SESSION_TTL_SECONDS);
    (await cookies()).set(COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" && !process.env.ALLOW_INSECURE_COOKIES,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_TTL_SECONDS,
    });
    return { ok: true };
  }

  const supabase = await createSessionClient();
  const { error } = await supabase.auth.signInWithPassword({ email: normalized, password });
  if (error) return invalid;
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) {
    await supabase.auth.signOut();
    return { ok: false, error: "This account does not have administrator access." };
  }
  return { ok: true };
}

export async function logoutAdmin(): Promise<void> {
  if (getDataBackend() === "local") {
    (await cookies()).delete(COOKIE);
    return;
  }
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
}

/**
 * Same-origin check for admin route handlers. Server Actions already verify the
 * Origin header; route handlers must do it themselves.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
