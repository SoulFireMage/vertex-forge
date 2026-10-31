// Golden cases from spec §6. Each row records what the spec expects; where the
// engine reports *more* than the spec wrote (e.g. Lₑ alongside L), the row says
// so in `note`. Nothing here was bent to fit: see REVIEW-PHASE1 notes in the PR.

import { describe, expect, it } from 'vitest';
import {
  auditReaction, checkVertex, identifyForce, legs, parseReaction,
  type AccountId, type Force, type VertexReason, type VertexStatus,
} from '../src/engine';

interface Golden {
  text: string;
  allowed: boolean;
  violated?: AccountId[];
  force: Force;
  flavourChanges?: string[];
  thresholdChecked?: boolean;
  note?: string;
}

const REACTIONS: Golden[] = [
  { text: 'n -> p e- nubar_e', allowed: true, force: 'weak' },
  { text: 'p -> n e+ nu_e', allowed: false, violated: ['threshold'], force: 'forbidden' },
  {
    text: 'n -> p e-', allowed: false, violated: ['lepton', 'L_e', 'spin_parity'], force: 'forbidden',
    note: 'Spec: "lepton number; also fails the angular-momentum parity check". The electron-number sub-account fails too.',
  },
  { text: 'pi0 -> gamma gamma', allowed: true, force: 'electromagnetic' },
  { text: 'pi+ -> mu+ nu_mu', allowed: true, force: 'weak' },
  { text: 'mu- -> e- nubar_e nu_mu', allowed: true, force: 'weak' },
  { text: 'mu- -> e- gamma', allowed: false, violated: ['L_e', 'L_mu'], force: 'forbidden' },
  { text: 'Lambda -> p pi-', allowed: true, force: 'weak', flavourChanges: ['S'] },
  { text: 'Delta++ -> p pi+', allowed: true, force: 'strong' },
  { text: 'Sigma0 -> Lambda gamma', allowed: true, force: 'electromagnetic' },
  { text: 'K+ -> pi+ pi0', allowed: true, force: 'weak', flavourChanges: ['S'] },
  { text: 'Omega- -> Lambda K-', allowed: true, force: 'weak', flavourChanges: ['S'] },
  { text: 'tau- -> mu- nubar_mu nu_tau', allowed: true, force: 'weak' },
  {
    text: 'p -> e+ pi0', allowed: false, violated: ['baryon', 'lepton', 'L_e'], force: 'forbidden',
    note: 'Spec: "B and L". Lₑ fails as well.',
  },
  { text: 'e+ e- -> gamma', allowed: false, violated: ['kinematics'], force: 'forbidden' },
  { text: 'e+ e- -> mu+ mu-', allowed: true, force: 'electromagnetic', thresholdChecked: false },
  { text: 'nu_mu n -> mu- p', allowed: true, force: 'weak', thresholdChecked: false },
  { text: 'nubar_e p -> e+ n', allowed: true, force: 'weak', thresholdChecked: false },
  { text: 'pi- p -> K0 Lambda', allowed: true, force: 'strong', thresholdChecked: false },
  {
    text: 'pi- p -> K- p', allowed: true, force: 'weak', flavourChanges: ['S'], thresholdChecked: false,
    note: 'Spec: "not strong … can only proceed weakly". The engine says allowed, weak (a ΔS = 1 W exchange), as the spec intends.',
  },
];

describe('golden reactions (spec §6)', () => {
  for (const g of REACTIONS) {
    it(g.text, () => {
      const r = parseReaction(g.text);
      const a = auditReaction(r);
      expect(a.allowed, 'allowed').toBe(g.allowed);
      expect(a.violated, 'violated accounts').toEqual(g.violated ?? []);
      expect(identifyForce(r, a).force, 'force').toBe(g.force);
      if (g.flavourChanges) expect(a.flavourChanges).toEqual(g.flavourChanges);
      if (g.thresholdChecked === false) expect(a.accounts.find((x) => x.id === 'threshold')!.status).toBe('not_checked');
    });
  }

  it('n → p e⁻ headlines lepton number first', () => {
    expect(auditReaction(parseReaction('n -> p e-')).firstViolation).toBe('lepton');
  });

  it('p → e⁺ π⁰ conserves B − L', () => {
    const a = auditReaction(parseReaction('p -> e+ pi0'));
    const acc = (id: AccountId) => a.accounts.find((x) => x.id === id)!;
    const bMinusL = (side: 'before' | 'after') => acc('baryon')[side]! / 3 - acc('lepton')[side]!;
    expect(bMinusL('before')).toBe(bMinusL('after'));
  });

  it('e⁺e⁻ → μ⁺μ⁻ gets the Z note (rule 5)', () => {
    const f = identifyForce(parseReaction('e+ e- -> mu+ mu-'));
    expect(f.rule).toBe(5);
    expect(f.notes.join(' ')).toMatch(/Z/);
  });

  it('Λ → p π⁻ clears threshold by the PDG masses', () => {
    const t = auditReaction(parseReaction('Lambda -> p pi-')).accounts.find((x) => x.id === 'threshold')!;
    expect(t.status).toBe('balances');
    expect(t.before! - t.after!).toBeCloseTo(37.84, 1);
  });
});

interface GoldenVertex {
  legs: string[];
  status: VertexStatus;
  reason?: VertexReason;
}

const V = (status: VertexStatus, reason: VertexReason | undefined, ...l: string[]): GoldenVertex => ({ legs: l, status, reason });

const VERTICES: GoldenVertex[] = [
  // legal
  V('legal', undefined, 'e_minus', 'e_plus', 'photon'),
  V('legal', undefined, 'u', 'ubar', 'gluon'),
  V('legal', undefined, 'gluon', 'gluon', 'gluon'),
  V('legal', undefined, 'nu_e', 'nubar_e', 'z0'),
  V('legal', undefined, 'u', 'dbar', 'w_minus'),
  V('legal', undefined, 'u', 'sbar', 'w_minus'),
  V('legal', undefined, 'e_minus', 'nubar_e', 'w_plus'),
  V('legal', undefined, 'w_plus', 'w_minus', 'photon'),
  V('legal', undefined, 'w_plus', 'w_minus', 'z0'),
  V('legal', undefined, 'higgs', 'higgs', 'higgs'),
  V('legal', undefined, 'higgs', 'e_minus', 'e_plus'),
  // not tree-level
  V('not_tree_level', 'gluon_needs_colour', 'e_minus', 'e_plus', 'gluon'),
  V('not_tree_level', 'neutral_flavour_change', 'u', 'cbar', 'z0'),
  V('not_tree_level', 'no_such_coupling', 'photon', 'photon', 'photon'),
  V('not_tree_level', 'no_such_coupling', 'z0', 'photon', 'photon'),
  V('not_tree_level', 'no_such_coupling', 'z0', 'z0', 'z0'),
  V('not_tree_level', 'no_such_coupling', 'higgs', 'photon', 'photon'),
  V('not_tree_level', 'no_such_coupling', 'higgs', 'gluon', 'gluon'),
  V('not_tree_level', 'photon_needs_charge', 'nu_e', 'nubar_e', 'photon'),
  V('not_tree_level', 'chirality', 'u:R', 'dbar', 'w_minus'),
  V('not_tree_level', 'lepton_family', 'e_minus', 'nubar_mu', 'w_plus'),
  // malformed
  V('malformed', 'charge_sum', 'u', 'dbar', 'w_plus'),
  V('malformed', 'charge_sum', 'e_minus', 'nubar_e', 'w_minus'),
];

describe('golden vertices (spec §6, all legs incoming)', () => {
  for (const g of VERTICES) {
    it(`${g.legs.join(' ')} → ${g.status}`, () => {
      const r = checkVertex(legs(...g.legs));
      expect(r.status).toBe(g.status);
      if (g.reason) expect(r.reason).toBe(g.reason);
    });
  }

  it('u s̄ W⁻ is flagged Cabibbo-suppressed with the PDG |V_us|', () => {
    const r = checkVertex(legs('u', 'sbar', 'w_minus'));
    expect(r.notes.join(' ')).toMatch(/Cabibbo-suppressed: \|V_us\| = 0\.22517/);
  });

  it('leg order and crossing-equivalent orderings give the same verdict', () => {
    const base = ['e_minus', 'nubar_e', 'w_plus'];
    const perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
    for (const p of perms) expect(checkVertex(legs(...p.map((i) => base[i]))).status).toBe('legal');
  });
});
