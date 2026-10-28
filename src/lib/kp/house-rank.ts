/**
 * Planets signifying one house, ranked as the reference KP software (app.kpastro.ai) lists them
 * when a house is picked in its "Planet Signification and Strength Table".
 *
 * Read off its screens (2nd and 4th house of a reference chart), a planet's level is the
 * strongest way it reaches the house:
 *   L1  its star lord occupies the house
 *   L2  it occupies the house
 *   L3  its star lord owns the house, or the house is occupied/owned by its sub lord, a planet
 *       conjunct it or a planet opposite it (in that order of strength)
 *   L4  it owns the house
 * Ties are broken by that order, then by the usual planet order.
 */
import type { KpAspects } from "./aspects";
import { KP9, type Kp9, type KpSignificators, type Signification } from "./significators";

export interface HouseSignificator {
  planet: Kp9;
  level: 1 | 2 | 3 | 4;
}

const has = (s: Signification, h: number) => s.occupies.includes(h) || s.owns.includes(h);

export function rankHouseSignificators(house: number, sig: KpSignificators, aspects: KpAspects): HouseSignificator[] {
  const ranked: (HouseSignificator & { order: number; index: number })[] = [];
  KP9.forEach((planet, index) => {
    const s = sig.strength[planet];
    const linked = (others: Kp9[]) => others.some((o) => has(sig.self[o], house));
    // Strongest first: [level, order within the level].
    const ways: [boolean, 1 | 2 | 3 | 4, number][] = [
      [s.star.occupies.includes(house), 1, 0],
      [s.self.occupies.includes(house), 2, 0],
      [s.star.owns.includes(house), 3, 0],
      [has(s.sub, house), 3, 1],
      [linked(aspects[planet].conjunction), 3, 2],
      [linked(aspects[planet].opposition), 3, 3],
      [s.self.owns.includes(house), 4, 0],
    ];
    const best = ways.find(([hit]) => hit);
    if (best) ranked.push({ planet, level: best[1], order: best[2], index });
  });
  ranked.sort((a, b) => a.level - b.level || a.order - b.order || a.index - b.index);
  return ranked.map(({ planet, level }) => ({ planet, level }));
}
