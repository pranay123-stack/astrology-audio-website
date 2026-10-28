import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHost = supabaseUrl ? new URL(supabaseUrl) : null;

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Native Swiss Ephemeris addon for the KP chart: loaded by Node at runtime, never bundled.
  serverExternalPackages: ["sweph"],
  // sweph loads its prebuilt binary dynamically, which file tracing cannot see.
  outputFileTracingIncludes: {
    // Keys are globs, so the brackets of the [lang] segment are escaped.
    "/\\[lang\\]/kp-chart": ["./node_modules/sweph/prebuilds/linux-x64/**"],
  },
  partialPrefetching: true,
  images: {
    formats: ["image/avif", "image/webp"],
    // Local mode serves uploaded images through this route; the home page picture lives in public/.
    localPatterns: [{ pathname: "/api/media/image/**" }, { pathname: "/hero-cricket-astrology.webp" }],
    // Supabase mode serves them from the public `images` bucket. Hosted projects are
    // always https://<ref>.supabase.co, allowed statically so images keep working even
    // if the host only provides NEXT_PUBLIC_* variables at build time (this file is
    // evaluated again when the server starts).
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/images/**" },
      // Thumbnails of linked YouTube videos (used when a post has no cover of its own).
      { protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/**" },
      ...(supabaseHost
        ? [
            {
              protocol: supabaseHost.protocol.replace(":", "") as "http" | "https",
              hostname: supabaseHost.hostname,
              port: supabaseHost.port,
              pathname: "/storage/v1/object/public/images/**",
            },
          ]
        : []),
    ],
    // Next.js refuses to optimise images from private IPs unless allowed (local Supabase runs on 127.0.0.1).
    dangerouslyAllowLocalIP: !!supabaseHost && ["127.0.0.1", "localhost"].includes(supabaseHost.hostname),
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Test deployments: also cover images, audio and other non-HTML responses.
          ...(process.env.NEXT_PUBLIC_NOINDEX === "true" ? [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] : []),
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
