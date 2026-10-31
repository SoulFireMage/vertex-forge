// Quark-content analysis for the Hadron Builder (spec §4.2).

import { PARTICLE_LIST, getParticle } from './particles';
import type { FlavourKey } from './types';

export interface ContentAnalysis {
  quarks: number;
  antiquarks: number;
  /**
   * Whether a colour singlet can be formed. A singlet needs (quarks − antiquarks)
   * divisible by 3; with at most three tiles that means q q̄, qqq or q̄q̄q̄ exactly.
   */
  colourNeutral: boolean;
  charge3: number;
  baryon3: number;
  flavour: Record<FlavourKey, number>;
  /** Hadrons in the table with exactly this content (order ignored). Superposition states never match. */
  matches: string[];
}

const key = (content: string[]) => [...content].sort().join(',');

const BY_CONTENT: Map<string, string[]> = (() => {
  const m = new Map<string, string[]>();
  for (const p of PARTICLE_LIST) {
    if (!p.quark_content) continue;
    const k = key(p.quark_content);
    m.set(k, [...(m.get(k) ?? []), p.id]);
  }
  return m;
})();

export function analyseContent(tiles: string[]): ContentAnalysis {
  if (tiles.length < 1 || tiles.length > 3) throw new Error('content analysis takes 1–3 quark tiles');
  const ps = tiles.map(getParticle);
  if (ps.some((p) => p.kind !== 'quark')) throw new Error('tiles must be quarks or antiquarks');
  const quarks = ps.filter((p) => !p.isAnti).length;
  const antiquarks = ps.length - quarks;
  const flavour = { S: 0, C: 0, B: 0, T: 0 };
  for (const p of ps) for (const k of ['S', 'C', 'B', 'T'] as const) flavour[k] += p[k];
  const colourNeutral = (quarks - antiquarks) % 3 === 0;
  return {
    quarks,
    antiquarks,
    colourNeutral,
    charge3: ps.reduce((a, p) => a + p.charge3, 0),
    baryon3: ps.reduce((a, p) => a + p.baryon3, 0),
    flavour,
    matches: colourNeutral ? BY_CONTENT.get(key(tiles)) ?? [] : [],
  };
}

/** True if `tiles` is exactly the quark content of `hadron` (order ignored). */
export function isContentOf(hadron: string, tiles: string[]): boolean {
  const c = getParticle(hadron).quark_content;
  return !!c && key(c) === key(tiles);
}
