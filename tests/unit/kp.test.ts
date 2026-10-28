import { describe, expect, it } from "vitest";
import { computeKpChart, kpNewMeanAyanamsa } from "@/lib/kp/engine";
import { DASHA_YEAR_DAYS, describe as kp, formatDms, NAK_SPAN, vimshottari } from "@/lib/kp/lords";
import { ASPECT_ORB, computeAspects, separation } from "@/lib/kp/aspects";
import { rankHouseSignificators } from "@/lib/kp/house-rank";
import { computeSignificators, houseOf, KP9 } from "@/lib/kp/significators";
import { formatOffset, localToUtc } from "@/lib/kp/time";

// Accuracy against the astrologer's KP software is checked separately by scripts/kp-verify.ts,
// with private reference charts. These tests cover the rules with public, made-up inputs.

describe("KP lords", () => {
  it("reads sign, nakshatra, pada and star/sub lords", () => {
    const a = kp(0); // 0° Aries: Ashwini, ruled by Ketu, first sub is Ketu's own
    expect([a.sign, a.nakshatra, a.pada, a.starLord, a.subLord, a.subSubLord]).toEqual(["Ar", "Ashwini", 1, "Ke", "Ke", "Ke"]);
    const b = kp(359.999); // last point of Revati (Mercury), last sub is Saturn
    expect([b.sign, b.nakshatra, b.pada, b.starLord, b.subLord]).toEqual(["Pi", "Revati", 4, "Me", "Sa"]);
    expect(kp(-30).sign).toBe("Pi");
  });

  it("splits each nakshatra into 9 subs in Vimshottari proportion", () => {
    // Ashwini (Ketu): Ketu 7/120 of 13°20' = 0°46'40", then Venus 20/120 = 2°13'20".
    expect(kp(46 / 60 + 39 / 3600).subLord).toBe("Ke");
    expect(kp(46 / 60 + 41 / 3600).subLord).toBe("Ve");
    expect(kp(3 - 1 / 3600).subLord).toBe("Ve");
    expect(kp(3 + 1 / 3600).subLord).toBe("Su");
    expect(kp(NAK_SPAN + 0.001).starLord).toBe("Ve");
  });

  it("formats degrees as d°mm'ss\"", () => {
    expect(formatDms(23 + 41 / 60 + 25 / 3600)).toBe(`23°41'25"`);
    expect(formatDms(59.9999999)).toBe(`60°00'00"`);
  });
});

describe("Vimshottari dasha", () => {
  it("starts from the Moon's nakshatra and covers 120 years in 9 periods", () => {
    const birth = Date.UTC(2000, 0, 1);
    const periods = vimshottari(birth, 0, 2); // Moon at 0° Aries: start of Ketu dasha
    expect(periods.map((p) => p.lord)).toEqual(["Ke", "Ve", "Su", "Mo", "Ma", "Ra", "Ju", "Sa", "Me"]);
    expect(periods[0].start).toBe(birth);
    const total = (periods[8].end - periods[0].start) / 86_400_000;
    expect(total).toBeCloseTo(120 * DASHA_YEAR_DAYS, 6);
    // Antar dashas start with the maha lord and fill it exactly.
    const ke = periods[0].children!;
    expect(ke[0].lord).toBe("Ke");
    expect(ke[8].end).toBeCloseTo(periods[0].end, 0);
  });

  it("counts the elapsed part of the birth dasha", () => {
    const birth = Date.UTC(2000, 0, 1);
    const half = vimshottari(birth, NAK_SPAN / 2, 1)[0]; // half-way through Ashwini
    expect((birth - half.start) / 86_400_000).toBeCloseTo(3.5 * DASHA_YEAR_DAYS, 6);
  });
});

describe("birth time", () => {
  it("uses historic and daylight-saving offsets", () => {
    expect(localToUtc({ year: 1959, month: 4, day: 13, hour: 5, minute: 30, second: 0 }, "Asia/Kolkata").offsetMinutes).toBe(330);
    expect(localToUtc({ year: 1943, month: 6, day: 1, hour: 12, minute: 0, second: 0 }, "Asia/Kolkata").offsetMinutes).toBe(390);
    expect(localToUtc({ year: 2026, month: 1, day: 10, hour: 19, minute: 15, second: 0 }, "Australia/Sydney").offsetMinutes).toBe(660);
    expect(localToUtc({ year: 2026, month: 7, day: 10, hour: 19, minute: 15, second: 0 }, "Australia/Sydney").offsetMinutes).toBe(600);
  });

  it("accepts a manual offset", () => {
    const r = localToUtc({ year: 1950, month: 1, day: 1, hour: 6, minute: 0, second: 0 }, "Asia/Kolkata", 353);
    expect(r.utcMs).toBe(Date.UTC(1950, 0, 1, 6, 0, 0) - 353 * 60_000);
    expect(formatOffset(353)).toBe("+05:53");
    expect(formatOffset(-210)).toBe("-03:30");
  });
});

describe("KP chart engine", () => {
  const chart = computeKpChart(Date.UTC(2000, 0, 1, 12), 28.6139, 77.209);

  it("uses KP New: 23°46'00\" at J2000, rising 50.2842\" a year", () => {
    expect(kpNewMeanAyanamsa(2451545.0)).toBeCloseTo(23 + 46 / 60, 10);
    expect((kpNewMeanAyanamsa(2451545.0 + 365.25) - kpNewMeanAyanamsa(2451545.0)) * 3600).toBeCloseTo(50.2842, 6);
    expect(Math.abs(chart.ayanamsa - (23 + 46 / 60)) * 3600).toBeLessThan(20); // plus nutation (under 20")
  });

  it("returns 12 cusps and the planets with Ketu opposite Rahu and Fortuna = Asc + Moon − Sun", () => {
    expect(chart.cusps).toHaveLength(12);
    const get = (k: string) => chart.planets.find((p) => p.key === k)!;
    expect(chart.planets.map((p) => p.key)).toEqual(["Su", "Mo", "Ma", "Me", "Ju", "Ve", "Sa", "Ra", "Ke", "Ur", "Ne", "Pl", "Fo"]);
    expect((get("Ke").lon - get("Ra").lon + 360) % 360).toBeCloseTo(180, 9);
    expect(get("Fo").lon).toBeCloseTo((chart.cusps[0].lon + get("Mo").lon - get("Su").lon + 720) % 360, 9);
    expect(get("Ra").retrograde).toBe(false);
    expect(get("Ke").retrograde).toBe(false);
  });

  it("derives occupancy, ownership and ABCD consistently", () => {
    const sig = computeSignificators(chart.planets, chart.cusps);
    for (const k of KP9) {
      expect(sig.self[k].occupies).toHaveLength(1);
      const star = chart.planets.find((p) => p.key === k)!.starLord as (typeof KP9)[number];
      expect(sig.abcd[k].A).toEqual(sig.self[star].occupies);
      expect(sig.abcd[k].D).toEqual(sig.self[k].owns);
    }
    expect(sig.self.Ra.owns).toEqual([]);
    // Every house's occupants appear in its B column.
    const cuspLons = chart.cusps.map((c) => c.lon);
    for (const k of KP9) {
      const h = houseOf(chart.planets.find((p) => p.key === k)!.lon, cuspLons);
      expect(sig.houses[h].B).toContain(k);
    }
  });
});

describe("planetary aspects", () => {
  // Made-up positions: only the angles between planets matter.
  const at = (lons: Record<string, number>) => KP9.map((key) => ({ key, ...kp(lons[key]) }));
  const base = { Su: 0, Mo: 200, Ma: 92, Me: 333, Ju: 165, Ve: 47.5, Sa: 254.5, Ra: 300, Ke: 120 };

  it("finds each aspect within the casting planet's orb", () => {
    const a = computeAspects(at(base));
    expect(a.Ma.square).toEqual(["Su"]); // 92°: within the Sun's orb
    expect(a.Su.square).toEqual(["Ma"]); // and within Mars' 4°
    expect(a.Ve.semiSquare).toEqual(["Su", "Ma"]); // 47.5° and 44.5°
    expect(a.Ra.opposition).toEqual(["Ke"]);
    expect(a.Ke.opposition).toEqual(["Ra"]);
  });

  it("gives the Sun a wider orb than the others, so an aspect can show in one row only", () => {
    // Saturn 140.5° from the Sun: 5.5° off an exact sesquisquare.
    const a = computeAspects(at({ ...base, Sa: 140.5 }));
    expect(a.Sa.sesquisquare).toEqual(["Su"]); // the Sun's 6° orb
    expect(a.Su.sesquisquare).toEqual([]); // Saturn's 4° orb
    expect(ASPECT_ORB.Su).toBeGreaterThan(ASPECT_ORB.Sa);
  });

  it("measures separation the short way round", () => {
    expect(separation(350, 10)).toBe(20);
    expect(separation(10, 190)).toBe(180);
  });
});

describe("house significators ranking", () => {
  // Public made-up moment and place (New Delhi, 1 Jan 2000 17:30 IST).
  const chart = computeKpChart(Date.UTC(2000, 0, 1, 12, 0, 0), 28.6139, 77.209);
  const sig = computeSignificators(chart.planets, chart.cusps);
  const aspects = computeAspects(chart.planets);

  it("lists each house's significators strongest level first, using the KP levels", () => {
    for (let h = 1; h <= 12; h++) {
      const ranked = rankHouseSignificators(h, sig, aspects);
      expect(ranked.map((r) => r.level)).toEqual([...ranked.map((r) => r.level)].sort((a, b) => a - b));
      for (const { planet, level } of ranked) {
        const s = sig.strength[planet];
        if (level === 1) expect(s.star.occupies).toContain(h);
        if (level === 2) expect(s.self.occupies).toContain(h);
        if (level === 4) expect(s.self.owns).toContain(h);
      }
      // Occupants and owners are always listed (at their own level or a stronger one).
      for (const k of KP9) if (sig.self[k].occupies.includes(h) || sig.self[k].owns.includes(h)) expect(ranked.map((r) => r.planet)).toContain(k);
      expect(new Set(ranked.map((r) => r.planet)).size).toBe(ranked.length);
    }
  });

  it("gives a planet the strongest level it reaches", () => {
    // A planet that occupies a house it also owns is listed once, at L2 or stronger.
    for (const k of KP9) {
      const [occ] = sig.self[k].occupies;
      const entry = rankHouseSignificators(occ, sig, aspects).find((r) => r.planet === k)!;
      expect(entry.level).toBeLessThanOrEqual(2);
    }
  });
});
