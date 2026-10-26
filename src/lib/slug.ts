import { transliterateDevanagari } from "./transliterate";

/** URL slug from a title. Hindi (Devanagari) is spelled in Latin letters first: "सूर्य ग्रह" → "surya-grah". */
export function slugify(input: string): string {
  const slug = transliterateDevanagari(input)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (slug.length <= 80) return slug;
  // Cut long titles at a word boundary rather than mid-word.
  const cut = slug.slice(0, 81);
  const at = cut.lastIndexOf("-");
  return (at >= 40 ? cut.slice(0, at) : slug.slice(0, 80)).replace(/-+$/g, "");
}

/** Returns `base`, or `base-2`, `base-3`, ... — the first one not in `taken`. */
export function uniqueSlug(base: string, taken: Set<string>): string {
  const root = base || "episode";
  if (!taken.has(root)) return root;
  for (let i = 2; ; i++) {
    const candidate = `${root}-${i}`;
    if (!taken.has(candidate)) return candidate;
  }
}
