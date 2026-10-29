import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Paths that are not language-specific pages. */
const NON_PAGE = /^\/(admin|api|_next|_vercel)(\/|$)|^\/(robots\.txt|sitemap\.xml|icon\.svg|favicon\.ico|opengraph-image)(\?|$)|\.[a-z0-9]{2,5}$/i;

/** Remembers the visitor's language choice (set by the language switch, or by the first Hindi redirect). */
export const LANG_COOKIE = "lang";

/** First (most preferred) language in Accept-Language is Hindi, e.g. "hi-IN,hi;q=0.9,en;q=0.8". */
export function prefersHindi(acceptLanguage: string | null): boolean {
  return (acceptLanguage ?? "").split(",")[0].trim().toLowerCase().startsWith("hi");
}

/**
 * Hindi first: a full page load of an English address goes to its Hindi version when the visitor
 * chose Hindi before, or (first visit) when their browser's preferred language is Hindi. Search
 * engines send neither, so they keep seeing the English pages; client-side navigations are left alone.
 */
function hindiRedirect(request: NextRequest, pathname: string): NextResponse | null {
  if (request.method !== "GET" || request.headers.get("sec-fetch-dest") === "iframe" || request.headers.has("rsc")) return null;
  const isDocument =
    request.headers.get("sec-fetch-dest") === "document" || (request.headers.get("accept") ?? "").includes("text/html");
  if (!isDocument) return null;
  const choice = request.cookies.get(LANG_COOKIE)?.value;
  if (choice === "en" || (choice !== "hi" && !prefersHindi(request.headers.get("accept-language")))) return null;
  const url = request.nextUrl.clone();
  url.pathname = `/hi${pathname === "/" ? "" : pathname}`;
  const response = NextResponse.redirect(url, 307);
  // Depends on the visitor: must never be cached and served to someone else (or to a search engine).
  response.headers.set("cache-control", "private, no-store");
  response.headers.set("vary", "Accept-Language, Cookie");
  if (!choice) response.cookies.set(LANG_COOKIE, "hi", { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  return response;
}

/**
 * Public pages live under app/[lang]. English keeps the plain URLs, so `/contact` is served
 * from `/en/contact` internally; Hindi URLs (`/hi/...`) are served as they are. Visiting an
 * explicit `/en/...` URL redirects to the plain one so each page has a single English address.
 */
function routeLocale(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  if (NON_PAGE.test(pathname)) return null;
  if (pathname === "/hi" || pathname.startsWith("/hi/")) return NextResponse.next();
  if (pathname === "/en" || pathname.startsWith("/en/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(url, 308);
  }
  const toHindi = hindiRedirect(request, pathname);
  if (toHindi) return toHindi;
  const url = request.nextUrl.clone();
  url.pathname = `/en${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

/**
 * Supabase mode only: refreshes the admin's auth session cookies on admin requests
 * so Server Components (which cannot write cookies) always see a valid session.
 * Authorisation itself happens in requireAdmin() and in the database's RLS policies.
 */
async function refreshSession(request: NextRequest): Promise<NextResponse> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (process.env.NEXT_PUBLIC_DATA_BACKEND === "local" || !url || !key) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        for (const { name, value } of toSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of toSet) response.cookies.set(name, value, options);
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}

const SESSION_PATHS = /^\/(admin(\/|$)|api\/admin\/|api\/media\/audio\/)/;

/**
 * www.kpastrocric.com and kpastrocric.com are separate sites to the browser (their own sign-ins
 * and saved chart keys), so www sends everyone to the plain address.
 */
function wwwRedirect(request: NextRequest): NextResponse | null {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  if (!host.toLowerCase().startsWith("www.")) return null;
  const { pathname, search } = request.nextUrl;
  return NextResponse.redirect(`https://${host.slice(4)}${pathname}${search}`, 308);
}

export async function proxy(request: NextRequest) {
  const toBare = wwwRedirect(request);
  if (toBare) return toBare;
  if (SESSION_PATHS.test(request.nextUrl.pathname)) return refreshSession(request);
  return routeLocale(request) ?? NextResponse.next();
}

export const config = {
  // Everything except Next.js internals and static files; the function decides what to do.
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:png|jpg|jpeg|webp|avif|svg|ico|mp3|m4a|wav|ogg|txt|xml|json|webmanifest)$).*)"],
};
