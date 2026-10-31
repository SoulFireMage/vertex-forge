// Lifetime bands (spec §6 caveat). The band is read off the clock; it is a
// rule of thumb for light hadrons and leptons, and the exceptions are listed.

import { getParticle } from './particles';

export type LifetimeBand = 'strong' | 'electromagnetic' | 'weak';

/** Band edges in seconds. Typical: strong ~10⁻²³ s, EM ~10⁻²⁰–10⁻¹⁶ s, weak ≳10⁻¹³ s. */
export const BAND_EDGES = { strongBelow: 1e-21, weakFrom: 1e-14 };

export const BANDS: { band: LifetimeBand; typical: string; range: string }[] = [
  { band: 'strong', typical: '~10⁻²³ s', range: 'shorter than 10⁻²¹ s' },
  { band: 'electromagnetic', typical: '~10⁻²⁰–10⁻¹⁶ s', range: '10⁻²¹ s to 10⁻¹⁴ s' },
  { band: 'weak', typical: '≳10⁻¹³ s', range: '10⁻¹⁴ s and longer' },
];

export const LIFETIME_CAVEAT =
  'Strong ~10⁻²³ s, electromagnetic ~10⁻²⁰–10⁻¹⁶ s, weak ≳10⁻¹³ s holds for light hadrons and leptons. ' +
  'Exceptions: the top quark, W and Z decay weakly in ~10⁻²⁵ s, because they release enormous energy and the weak rate grows steeply with it; ' +
  'the neutron lives about 15 minutes because its decay barely clears the energy threshold; ' +
  'and J/ψ and Υ(1S) decay strongly but slowly (~10⁻²⁰ s) because their strong decays are suppressed (the OZI rule), which puts them in the electromagnetic band.';

/**
 * Exceptions to the rule of thumb, checked against the data in the tests.
 * 'wrong_band': the clock puts the particle in another force's band.
 * 'extreme': the right band, but far outside the typical range.
 */
export const BAND_EXCEPTIONS: { id: string; force: LifetimeBand; kind: 'wrong_band' | 'extreme'; why: string }[] = [
  { id: 't', force: 'weak', kind: 'wrong_band', why: 'Weak decay t → W b with an enormous energy release.' },
  { id: 'w_plus', force: 'weak', kind: 'wrong_band', why: 'Weak decay with a large energy release.' },
  { id: 'z0', force: 'weak', kind: 'wrong_band', why: 'Weak decay with a large energy release.' },
  { id: 'jpsi', force: 'strong', kind: 'wrong_band', why: 'Strong decays are OZI-suppressed: the c c̄ pair must annihilate.' },
  { id: 'upsilon1s', force: 'strong', kind: 'wrong_band', why: 'Strong decays are OZI-suppressed: the b b̄ pair must annihilate.' },
  { id: 'neutron', force: 'weak', kind: 'extreme', why: 'Weak decay with only about 0.78 MeV released, so very little phase space: about 15 minutes instead of ≲10⁻⁸ s.' },
];

export function bandOf(lifetime_s: number): LifetimeBand {
  if (lifetime_s < BAND_EDGES.strongBelow) return 'strong';
  if (lifetime_s < BAND_EDGES.weakFrom) return 'electromagnetic';
  return 'weak';
}

export function lifetimeBand(id: string): LifetimeBand | null {
  const t = getParticle(id).lifetime_s;
  return t == null ? null : bandOf(t);
}
