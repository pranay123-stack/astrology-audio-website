import { POST_FORMATS, type PostFormat } from "./types";

export const PAGE_SIZE = 9;

type Raw = Record<string, string | string[] | undefined>;

function one(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export interface ListParams {
  q: string;
  access: "" | "free" | "premium";
  page: number;
  category: string;
  competition: string;
  when: "upcoming" | "past" | "all";
  from: string;
  to: string;
  sort: "latest" | "popular";
  format: "" | PostFormat;
}

/** Normalises untrusted query-string values; anything unexpected falls back to a default. */
export function parseListParams(sp: Raw): ListParams {
  const access = one(sp.access);
  const when = one(sp.when);
  const sort = one(sp.sort);
  const page = Number.parseInt(one(sp.page), 10);
  const from = one(sp.from);
  const to = one(sp.to);
  return {
    q: one(sp.q).slice(0, 100),
    access: access === "free" || access === "premium" ? access : "",
    page: Number.isFinite(page) && page > 0 ? Math.min(page, 50) : 1,
    category: /^[a-z0-9-]{1,80}$/.test(one(sp.category)) ? one(sp.category) : "",
    competition: /^[a-z0-9-]{1,40}$/.test(one(sp.competition)) ? one(sp.competition) : "",
    when: when === "past" || when === "all" ? when : "upcoming",
    from: DATE_RE.test(from) ? from : "",
    to: DATE_RE.test(to) ? to : "",
    sort: sort === "popular" ? "popular" : "latest",
    format: (POST_FORMATS as readonly string[]).includes(one(sp.format)) ? (one(sp.format) as PostFormat) : "",
  };
}

/** Builds a query string from params, dropping defaults so URLs stay short. */
const DEFAULTS: Partial<ListParams> = { page: 1, when: "upcoming", sort: "latest" };

export function toQueryString(p: Partial<ListParams>, defaults: Partial<ListParams> = {}): string {
  const out = new URLSearchParams();
  const skip = { ...DEFAULTS, ...defaults };
  for (const [k, v] of Object.entries(p)) {
    if (v === "" || v === undefined || v === null) continue;
    if (skip[k as keyof ListParams] === v) continue;
    out.set(k, String(v));
  }
  const s = out.toString();
  return s ? `?${s}` : "";
}
