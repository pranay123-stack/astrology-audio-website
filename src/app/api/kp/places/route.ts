import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import tzLookup from "@photostructure/tz-lookup";
import { headers } from "next/headers";
import { siteConfig } from "@/lib/config";
import { parsePlaceLine, searchPlaces, type PlaceRow } from "@/lib/kp/place-search";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Birth-place search for the KP chart, two ways:
 *
 * * `?suggest=1`: suggestions as the visitor types, from the GeoNames list bundled with the site
 *   (data/places.tsv.gz), forgiving of spelling. Nothing leaves the server.
 * * otherwise: OpenStreetMap Nominatim, for villages the list does not have. Proxied from the
 *   server as its usage policy asks: identified User-Agent, at most ~1 request/second overall,
 *   results cached, and never search-as-you-type (only when the visitor presses Search).
 *
 * Each result carries its IANA timezone.
 */

interface Place {
  label: string;
  lat: number;
  lon: number;
  zone: string;
}

const cache = new Map<string, { at: number; places: Place[] }>();
const CACHE_MS = 24 * 60 * 60 * 1000;
let lastUpstream = 0;

let rows: PlaceRow[] | null = null;
/** The bundled list, read once (about 70,000 places, ~0.5 s). */
function placeRows(): PlaceRow[] {
  rows ??= gunzipSync(readFileSync(join(process.cwd(), "data/places.tsv.gz")))
    .toString("utf8")
    .split("\n")
    .map(parsePlaceLine)
    .filter((r) => r !== null);
  return rows;
}

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim().slice(0, 120) ?? "";
  const lang = new URL(request.url).searchParams.get("lang") === "hi" ? "hi,en" : "en";
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";

  if (new URL(request.url).searchParams.get("suggest") === "1") {
    if (!q) return Response.json({ places: [] });
    if (!rateLimit(`suggest:${ip}`, 600, 10 * 60 * 1000).ok) return Response.json({ places: [] }, { status: 429 });
    try {
      const places: Place[] = searchPlaces(placeRows(), q, 8).map((r) => ({ label: r.label, lat: r.lat, lon: r.lon, zone: r.zone }));
      return Response.json({ places }, { headers: { "cache-control": "public, max-age=86400" } });
    } catch (err) {
      console.error("place suggestions failed", err);
      return Response.json({ places: [] }, { status: 500 });
    }
  }

  if (q.length < 2) return Response.json({ places: [] });

  const key = `${lang}:${q.toLowerCase()}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return Response.json({ places: hit.places });

  if (!rateLimit(`places:${ip}`, 20, 10 * 60 * 1000).ok) {
    return Response.json({ error: "Too many searches. Please wait a few minutes." }, { status: 429 });
  }
  // Global 1 request/second towards Nominatim.
  const wait = lastUpstream + 1100 - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastUpstream = Date.now();

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "6");
  url.searchParams.set("addressdetails", "0");
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": `${siteConfig.name} KP chart (${siteConfig.url})`, "Accept-Language": lang },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Nominatim ${res.status}`);
    const rows = (await res.json()) as { display_name: string; lat: string; lon: string }[];
    const places: Place[] = rows.map((r) => {
      const lat = Number(r.lat);
      const lon = Number(r.lon);
      return { label: r.display_name, lat, lon, zone: tzLookup(lat, lon) };
    });
    cache.set(key, { at: Date.now(), places });
    if (cache.size > 2000) cache.delete(cache.keys().next().value!);
    return Response.json({ places });
  } catch (err) {
    console.error("place search failed", err);
    return Response.json({ error: "Place search is unavailable right now. Enter latitude and longitude manually." }, { status: 502 });
  }
}
