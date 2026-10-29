import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { distance, norm, parsePlaceLine, searchPlaces, sound } from "@/lib/kp/place-search";

// The real bundled list (GeoNames), as the route loads it.
const rows = gunzipSync(readFileSync("data/places.tsv.gz"))
  .toString("utf8")
  .split("\n")
  .map(parsePlaceLine)
  .filter((r) => r !== null);
const top = (q: string, n = 3) => searchPlaces(rows, q, n).map((r) => r.label);

describe("birth-place suggestions", () => {
  it("normalises accents, case and punctuation", () => {
    expect(norm("  Kolhāpur, MH ")).toBe("kolhapur mh");
    expect(distance("klkt", "klkta", 1)).toBe(1);
    expect(distance("abcd", "badc", 2)).toBe(2);
  });

  it("gives Indian spellings of one place the same sound", () => {
    expect(new Set(["Kolkata", "Kalkatta", "kalkata", "Calcutta"].map(sound))).toEqual(new Set(["klkt"]));
    expect(sound("Mujaffarpur")).toBe(sound("Muzaffarpur"));
    expect(sound("Bhopal")).toBe(sound("Bopal"));
  });

  it("finds Kolkata from a couple of letters and from misspellings", () => {
    for (const q of ["ko", "kol", "kalkatta", "kalkata", "kolkta", "calcutta"]) expect(top(q)).toContain("Kolkata, West Bengal, India");
    expect(top("kal", 8)).toContain("Kolkata, West Bengal, India");
  });

  it("finds old and alternative names, word starts and Indian towns first", () => {
    expect(top("bombay", 1)).toEqual(["Mumbai, Maharashtra, India"]);
    expect(top("bangalore", 1)).toEqual(["Bengaluru, Karnataka, India"]);
    expect(top("banaras", 1)).toEqual(["Varanasi, Uttar Pradesh, India"]);
    expect(top("muzzafarpur", 1)).toEqual(["Muzaffarpur, Bihar, India"]);
    expect(top("new de", 1)).toEqual(["New Delhi, Delhi, India"]);
    expect(top("hyd", 1)).toEqual(["Hyderabad, Telangana, India"]);
    expect(top("lond", 1)).toEqual(["London, England, United Kingdom"]);
  });

  it("returns each place with coordinates and its timezone", () => {
    const [k] = searchPlaces(rows, "kolkata", 1);
    expect([k.zone, Math.round(k.lat), Math.round(k.lon)]).toEqual(["Asia/Kolkata", 23, 88]);
    expect(searchPlaces(rows, "  ")).toEqual([]);
  });
});
