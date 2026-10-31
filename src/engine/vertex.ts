// Tree-level Standard Model vertex grammar (spec §5.4).
// Every leg is incoming: crossing turns an outgoing particle into an incoming
// antiparticle, so the charges on a legal vertex always sum to zero.

import ckm from '../data/ckm.json';
import { getParticle, isBoson, isFermion, isHadron } from './particles';
import type { Particle, VertexLeg, VertexReason, VertexResult } from './types';

type BosonKey = 'g' | 'γ' | 'Z' | 'W+' | 'W-' | 'h';

const BOSON_KEY: Record<string, BosonKey> = {
  gluon: 'g', photon: 'γ', z0: 'Z', w_plus: 'W+', w_minus: 'W-', higgs: 'h',
};

/** Purely bosonic tree-level vertices, as sorted multisets. */
const BOSONIC: { legs: BosonKey[]; rule: string }[] = [
  { legs: ['g', 'g', 'g'], rule: 'ggg' },
  { legs: ['g', 'g', 'g', 'g'], rule: 'gggg' },
  { legs: ['W+', 'W-', 'γ'], rule: 'W⁺W⁻γ' },
  { legs: ['W+', 'W-', 'Z'], rule: 'W⁺W⁻Z' },
  { legs: ['W+', 'W+', 'W-', 'W-'], rule: 'W⁺W⁻W⁺W⁻' },
  { legs: ['W+', 'W-', 'Z', 'Z'], rule: 'W⁺W⁻ZZ' },
  { legs: ['W+', 'W-', 'γ', 'γ'], rule: 'W⁺W⁻γγ' },
  { legs: ['W+', 'W-', 'Z', 'γ'], rule: 'W⁺W⁻Zγ' },
  { legs: ['h', 'W+', 'W-'], rule: 'hW⁺W⁻' },
  { legs: ['h', 'Z', 'Z'], rule: 'hZZ' },
  { legs: ['h', 'h', 'W+', 'W-'], rule: 'hhW⁺W⁻' },
  { legs: ['h', 'h', 'Z', 'Z'], rule: 'hhZZ' },
  { legs: ['h', 'h', 'h'], rule: 'hhh' },
  { legs: ['h', 'h', 'h', 'h'], rule: 'hhhh' },
];

const sortKey = (ks: BosonKey[]) => [...ks].sort().join(',');
const BOSONIC_MAP = new Map(BOSONIC.map((b) => [sortKey(b.legs), b.rule]));

export const TREE_LEVEL_RULES: { vertex: string; condition: string }[] = [
  { vertex: 'f f̄ γ', condition: 'f electrically charged; same flavour' },
  { vertex: 'q q̄ g', condition: 'quarks only; same flavour' },
  { vertex: 'ggg, gggg', condition: 'always' },
  { vertex: 'f f̄ Z', condition: 'any fermion, neutrinos included; same flavour (no tree-level flavour-changing neutral currents)' },
  { vertex: 'u_i d̄_j W⁻ and ū_i d_j W⁺', condition: 'up-type quark with down-type antiquark (or the conjugate), any generations, weighted by the CKM element; left-chiral fields only' },
  { vertex: 'ℓ⁻ ν̄_ℓ W⁺ and ℓ⁺ ν_ℓ W⁻', condition: 'charged lepton with its own-flavour antineutrino (flavour basis); left-chiral fields only' },
  { vertex: 'W⁺W⁻γ, W⁺W⁻Z', condition: 'always' },
  { vertex: 'W⁺W⁻W⁺W⁻, W⁺W⁻ZZ, W⁺W⁻γγ, W⁺W⁻Zγ', condition: 'always' },
  { vertex: 'h f f̄', condition: 'massive fermions (not neutrinos in the minimal SM); same flavour; strength ∝ mass' },
  { vertex: 'hW⁺W⁻, hZZ, hhW⁺W⁻, hhZZ, hhh, hhhh', condition: 'always' },
];

const GEN_NAMES = ['', 'first', 'second', 'third'];

function result(status: VertexResult['status'], detail: string, extra: Partial<VertexResult> = {}): VertexResult {
  return { status, detail, notes: [], ...extra };
}
function no(reason: VertexReason, detail: string, notes: string[] = []): VertexResult {
  return result('not_tree_level', detail, { reason, notes });
}

/** |V_ij| from the PDG global fit (src/data/ckm.json). */
export function ckmMagnitude(up: string, down: string): number {
  const i = ckm.rows.indexOf(up);
  const j = ckm.cols.indexOf(down);
  if (i < 0 || j < 0) throw new Error(`no CKM element for ${up}${down}`);
  return ckm.magnitude[i][j];
}

function ckmNote(up: Particle, down: Particle): string[] {
  const v = ckmMagnitude(up.base, down.base);
  const el = `|V_${up.base}${down.base}| = ${v}`;
  const gu = up.generation!;
  const gd = down.generation!;
  if (gu === gd) return [`Same-generation, CKM-favoured: ${el}.`];
  if (gu + gd === 3) return [`Cabibbo-suppressed: ${el}, so the rate carries a factor of about ${(v * v).toFixed(3)}.`];
  return [`Strongly CKM-suppressed: ${el}.`];
}

function twoFermionOneBoson(f1: Particle, f2: Particle, bLeg: VertexLeg, fLegs: VertexLeg[]): VertexResult {
  const boson = getParticle(bLeg.particle);
  const key = BOSON_KEY[boson.id];
  if (f1.isAnti === f2.isAnti) {
    return no('fermion_mismatch', 'A fermion line runs through a vertex: one leg must be a particle and the other an antiparticle (fermion number is conserved at every vertex).');
  }
  const [part, anti] = f1.isAnti ? [f2, f1] : [f1, f2];
  const sameFlavour = part.base === anti.base;
  const bothQuarks = part.kind === 'quark' && anti.kind === 'quark';
  const bothLeptons = part.kind === 'lepton' && anti.kind === 'lepton';
  const neutral = key === 'γ' || key === 'g' || key === 'Z' || key === 'h';

  if (neutral && !sameFlavour) {
    if (!bothQuarks && !bothLeptons) return no('fermion_mismatch', 'A quark and a lepton cannot meet at a Standard Model vertex.');
    return no('neutral_flavour_change', `${boson.name} is neutral, and neutral bosons never change flavour at tree level (${part.name} and ${anti.name} differ in flavour).`, [
      'Flavour-changing neutral currents arise only through loops (the GIM mechanism suppresses them).',
    ]);
  }
  switch (key) {
    case 'γ':
      if (part.charge3 === 0) return no('photon_needs_charge', `The photon couples to electric charge, and ${part.name} is neutral.`);
      return result('legal', `Photon coupling to the charge of ${part.name}.`, { rule: 'f f̄ γ' });
    case 'g':
      if (!bothQuarks) return no('gluon_needs_colour', `The gluon couples to colour, and ${part.name} is colourless.`);
      return result('legal', `Gluon coupling to the colour of ${part.name}.`, { rule: 'q q̄ g' });
    case 'Z': {
      if (part.weak_type === 'neutrino' && fLegs.some((l) => l.chirality === 'R')) {
        return no('chirality', 'The minimal Standard Model has no right-chiral neutrino field, so there is nothing for the Z to couple to.');
      }
      return result('legal', `Neutral-current coupling to ${part.name}.`, { rule: 'f f̄ Z' });
    }
    case 'h':
      if (part.weak_type === 'neutrino') {
        return no('higgs_needs_mass', 'Neutrinos are massless in the minimal Standard Model, which has no h–ν–ν vertex.', [
          'With neutrino masses this depends on how they arise; it is outside the minimal SM and never a drill answer.',
        ]);
      }
      return result('legal', `Higgs coupling to ${part.name}, proportional to its mass.`, { rule: 'h f f̄' });
    case 'W+':
    case 'W-': {
      if (fLegs.some((l) => l.chirality === 'R')) {
        return no('chirality', 'The W couples only to left-chiral fields; a right-chiral leg cannot attach.');
      }
      if (bothQuarks) {
        const up = part.weak_type === 'up' ? part : anti;
        const down = part.weak_type === 'down' ? part : anti;
        if (up.weak_type !== 'up' || down.weak_type !== 'down') return no('fermion_mismatch', 'The W joins an up-type quark to a down-type quark.');
        return result('legal', `Charged-current transition between ${up.base} and ${down.base}.`, { rule: key === 'W-' ? 'u_i d̄_j W⁻' : 'ū_i d_j W⁺', notes: ckmNote(up, down) });
      }
      if (bothLeptons) {
        const lep = part.weak_type === 'charged_lepton' ? part : anti;
        const nu = part.weak_type === 'neutrino' ? part : anti;
        if (lep.weak_type !== 'charged_lepton' || nu.weak_type !== 'neutrino') return no('fermion_mismatch', 'The W joins a charged lepton to a neutrino.');
        if (lep.generation !== nu.generation) {
          return no('lepton_family', `In the flavour basis the W joins each charged lepton to its own neutrino; ${lep.name} is ${GEN_NAMES[lep.generation!]}-generation and ${nu.name} is ${GEN_NAMES[nu.generation!]}-generation.`, [
            'In the mass basis, lepton mixing (PMNS) appears at this vertex instead.',
          ]);
        }
        return result('legal', `Charged-current coupling of ${lep.name} to its own neutrino.`, { rule: key === 'W+' ? 'ℓ⁻ ν̄_ℓ W⁺' : 'ℓ⁺ ν_ℓ W⁻' });
      }
      return no('fermion_mismatch', 'A quark and a lepton cannot meet at a Standard Model vertex.');
    }
  }
  throw new Error(`unhandled boson ${boson.id}`);
}

export function checkVertex(legs: VertexLeg[]): VertexResult {
  if (legs.length < 3 || legs.length > 4) throw new Error('a vertex has 3 or 4 legs');
  const ps = legs.map((l) => getParticle(l.particle));
  if (ps.some(isHadron)) throw new Error('hadrons are composites, not vertex legs');
  const q = ps.reduce((a, p) => a + p.charge3, 0);
  if (q !== 0) {
    return result('malformed', `With every leg incoming the charges must sum to zero; here they sum to ${q > 0 ? '+' : '−'}${Math.abs(q) % 3 === 0 ? Math.abs(q) / 3 : `${Math.abs(q)}/3`}.`, { reason: 'charge_sum' });
  }
  const fermionIdx = ps.map((p, i) => (isFermion(p) ? i : -1)).filter((i) => i >= 0);
  const bosonIdx = ps.map((p, i) => (isBoson(p) ? i : -1)).filter((i) => i >= 0);

  if (fermionIdx.length === 0) {
    const keys = bosonIdx.map((i) => BOSON_KEY[ps[i].id]);
    const rule = BOSONIC_MAP.get(sortKey(keys));
    if (rule) return result('legal', `Gauge/Higgs self-coupling ${rule}.`, { rule });
    return no('no_such_coupling', 'No tree-level Standard Model vertex has this set of bosons.');
  }
  if (fermionIdx.length === 2 && bosonIdx.length === 1) {
    const [a, b] = fermionIdx;
    return twoFermionOneBoson(ps[a], ps[b], legs[bosonIdx[0]], [legs[a], legs[b]]);
  }
  if (fermionIdx.length === 4) {
    return no('no_such_coupling', 'There is no four-fermion vertex in the Standard Model. Fermi’s contact interaction is the low-energy limit of W exchange, an effective theory.');
  }
  return no('no_such_coupling', 'Every Standard Model vertex with fermions has exactly two fermion legs and one boson.');
}

/** Convenience: build legs from ids, with an optional chirality on any leg ("u:R"). */
export function legs(...spec: string[]): VertexLeg[] {
  return spec.map((s) => {
    const [particle, ch] = s.split(':');
    return ch ? { particle, chirality: ch as 'L' | 'R' } : { particle };
  });
}
