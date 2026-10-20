import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Paths that are not language-specific pages. */
const NON_PAGE = /^\/(admin|api|_next|_vercel)(\/|$)|^\/(robots\.txt|sitemap\.xml|icon\.svg|favicon\.ico|opengraph-image)(\?|$)|\.[a-z0-9]{2,5}$/i;

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

export async function proxy(request: NextRequest) {
  if (SESSION_PATHS.test(request.nextUrl.pathname)) return refreshSession(request);
  return routeLocale(request) ?? NextResponse.next();
}

export const config = {
  // Everything except Next.js internals and static files; the function decides what to do.
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:png|jpg|jpeg|webp|avif|svg|ico|mp3|m4a|wav|ogg|txt|xml|json|webmanifest)$).*)"],
};
