/**
 * Supabase mode: creates (or promotes) an administrator account.
 *
 *   npm run admin:create -- --email you@example.com [--password '...']
 *
 * Public sign-up is disabled in supabase/config.toml; admins are created here
 * with the service-role key, which never leaves the server.
 */
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { loadEnv } from "./lib/env";

loadEnv();

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  const email = arg("email")?.toLowerCase();
  if (!email) throw new Error("Pass --email");
  const generated = !arg("password");
  const password = arg("password") ?? randomBytes(12).toString("base64url");

  const sb = createClient(url, key, { auth: { persistSession: false } });
  let userId: string | undefined;
  const created = await sb.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.data.user) {
    userId = created.data.user.id;
  } else {
    // Already registered: look the user up and promote them without changing the password.
    for (let page = 1; !userId && page < 50; page++) {
      const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw error;
      userId = data.users.find((u) => u.email?.toLowerCase() === email)?.id;
      if (data.users.length < 200) break;
    }
    if (!userId) throw new Error(`Could not create or find ${email}: ${created.error?.message}`);
    console.log(`${email} already exists; promoting to admin (password unchanged).`);
  }
  const { error } = await sb.from("admins").upsert({ user_id: userId });
  if (error) throw error;
  console.log(`Admin ready: ${email}`);
  if (created.data.user && generated) console.log(`Password: ${password}  (store it now)`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
