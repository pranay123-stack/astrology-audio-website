import { getDataBackend } from "./config";

export interface EnvReport {
  errors: string[];
  warnings: string[];
}

/** Reads a variable at runtime. Bracket access with a variable name is not inlined at build time. */
function runtime(name: string): string | undefined {
  return process.env[name];
}

/**
 * Validates production configuration. NEXT_PUBLIC_* values are inlined when the app
 * is built, so a build made without them silently falls back to local mode. This
 * compares what was built in with what the server sees at runtime.
 */
export function checkProductionEnv(): EnvReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const built = getDataBackend();
  const runtimeBackend = runtime("NEXT_PUBLIC_DATA_BACKEND");

  if (runtimeBackend && runtimeBackend !== built) {
    errors.push(
      `The app was built in "${built}" mode but NEXT_PUBLIC_DATA_BACKEND is "${runtimeBackend}" at runtime. ` +
        "NEXT_PUBLIC_* variables must be set before `npm run build`; rebuild/redeploy after setting them.",
    );
  }

  if (built === "local") {
    if (runtime("ALLOW_LOCAL_BACKEND_IN_PRODUCTION") !== "true") {
      errors.push(
        "Production server is running in local mode (data in files on this server). Hosting redeploys can delete those files. " +
          "Set the Supabase variables before building, or set ALLOW_LOCAL_BACKEND_IN_PRODUCTION=true for a local trial only.",
      );
    }
    if (!runtime("SESSION_SECRET") || (runtime("SESSION_SECRET") ?? "").length < 32) errors.push("SESSION_SECRET is missing or too short.");
    if (!runtime("ADMIN_EMAIL") || !runtime("ADMIN_PASSWORD_HASH")) warnings.push("Local admin login is not configured.");
  } else {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) errors.push("NEXT_PUBLIC_SUPABASE_URL was not set at build time.");
    const runtimeUrl = runtime("NEXT_PUBLIC_SUPABASE_URL");
    if (runtimeUrl && runtimeUrl !== process.env.NEXT_PUBLIC_SUPABASE_URL) {
      errors.push("NEXT_PUBLIC_SUPABASE_URL at runtime differs from the value the app was built with. Rebuild after changing it.");
    }
    const service = runtime("SUPABASE_SERVICE_ROLE_KEY");
    if (!service) errors.push("SUPABASE_SERVICE_ROLE_KEY is not set (needed for audio delivery, uploads and the contact form).");
    if (service && service === process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      errors.push("SUPABASE_SERVICE_ROLE_KEY is the same as the anon key. Use the service-role (secret) key.");
    }
  }

  if (process.env.NEXT_PUBLIC_NOINDEX === "true") {
    warnings.push("NEXT_PUBLIC_NOINDEX is on: the site is hidden from search engines. Remove it for the public launch.");
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  if (!siteUrl || /localhost|127\.0\.0\.1/.test(siteUrl)) {
    warnings.push("NEXT_PUBLIC_SITE_URL points at localhost; canonical URLs, the sitemap and Open Graph links will be wrong. Rebuild with the real domain.");
  } else if (!siteUrl.startsWith("https://")) {
    warnings.push("NEXT_PUBLIC_SITE_URL should use https:// in production.");
  }
  return { errors, warnings };
}

/** Logs configuration problems and exits on errors, so the host shows a failed start. Node.js runtime only. */
export function enforceProductionEnv(): void {
  const { errors, warnings } = checkProductionEnv();
  for (const w of warnings) console.warn(`[config] ${w}`);
  if (!errors.length) return;
  for (const e of errors) console.error(`[config] ${e}`);
  console.error(`[config] Refusing to start: ${errors.length} configuration error(s).`);
  process.exit(1);
}
