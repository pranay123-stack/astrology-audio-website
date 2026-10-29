/**
 * Builds data/places.tsv.gz, the birth-place suggestions of the KP chart form, from GeoNames
 * (https://www.geonames.org, CC BY 4.0). Download into an empty folder first:
 *
 *   cities1000.zip, cities500.zip (unzip both), admin1CodesASCII.txt, countryInfo.txt
 *   from https://download.geonames.org/export/dump/
 *
 * then: npx tsx scripts/build-places.ts <that folder>
 *
 * Every place in the world with 5,000+ people, and in India every place with 500+ (villages
 * smaller than that are found by the form's OpenStreetMap search instead). Big places
 * (15,000+) also keep their other Latin spellings (Calcutta, Bombay, Banaras …).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { norm } from "../src/lib/kp/place-search";

const dir = process.argv[2];
if (!dir) throw new Error("usage: tsx scripts/build-places.ts <geonames folder>");
const read = (f: string) => readFileSync(join(dir, f), "utf8").split("\n").filter((l) => l && !l.startsWith("#"));

const countries = new Map(read("countryInfo.txt").map((l) => l.split("\t")).map((c) => [c[0], c[4]]));
const regions = new Map(read("admin1CodesASCII.txt").map((l) => l.split("\t")).map((r) => [r[0], r[1]]));

const rows = new Map<string, string>();
const add = (file: string, keep: (country: string, population: number) => boolean) => {
  for (const line of read(file)) {
    const f = line.split("\t");
    const [id, name, , alternates, lat, lon] = f;
    const country = f[8];
    const population = Number(f[14]) || 0;
    const zone = f[17];
    if (rows.has(id) || !zone || !keep(country, population)) continue;
    const own = norm(name);
    // Latin-script spellings only, distinct from the name, and a handful at most.
    const alts =
      population >= 15000
        ? [...new Set(alternates.split(",").filter((a) => /^\p{Lu}[\p{Script=Latin}\s'’.-]+$/u.test(a) && a.length > 2 && norm(a) !== own))].slice(0, 12)
        : [];
    const region = regions.get(`${country}.${f[10]}`) ?? "";
    rows.set(id, [name, alts.join(","), region, countries.get(country) ?? country, Number(lat).toFixed(4), Number(lon).toFixed(4), zone, population, country].join("\t"));
  }
};
add("cities1000.txt", (country, population) => country === "IN" || population >= 5000);
add("cities500.txt", (country) => country === "IN");

const out = gzipSync([...rows.values()].join("\n") + "\n", { level: 9 });
writeFileSync("data/places.tsv.gz", out);
console.log(`${rows.size} places, ${(out.length / 1e6).toFixed(1)} MB`);
