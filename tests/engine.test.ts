import { describe, expect, it } from 'vitest';
import ckm from '../src/data/ckm.json';
import { CURATED_FACTS } from '../src/data/curated';
import {
  BAND_EXCEPTIONS, PARTICLES, PARTICLE_LIST, PDG_EDITION, auditReaction, bandOf, checkVertex, formatReaction,
  formatThirds, getParticle, identifyForce, isFermion, legs, lifetimeBand, parseReaction,
} from '../src/engine';

const QUARK: Record<string, [number, number, number, number, number]> = {
  u: [2, 0, 0, 0, 0], d: [-1, 0, 0, 0, 0], s: [-1, -1, 0, 0, 0], c: [2, 0, 1, 0, 0], b: [-1, 0, 0, -1, 0], t: [2, 0, 0, 0, 1],
};

describe('particle table', () => {
  it('comes from the current PDG edition', () => {
    expect(PDG_EDITION).toBe('PDG 2026');
  });

  it('has every quark, lepton, gauge boson, h and about 30 hadrons', () => {
    for (const id of ['u', 'd', 's', 'c', 'b', 't', 'e_minus', 'mu_minus', 'tau_minus', 'nu_e', 'nu_mu', 'nu_tau', 'photon', 'gluon', 'w_plus', 'z0', 'higgs']) {
      expect(PARTICLES[id], id).toBeDefined();
    }
    const hadrons = PARTICLE_LIST.filter((p) => !p.isAnti && (p.kind === 'meson' || p.kind === 'baryon'));
    expect(hadrons.length).toBeGreaterThanOrEqual(30);
  });

  it('antiparticles are an involution with every additive number flipped', () => {
    for (const p of PARTICLE_LIST) {
      const a = getParticle(p.antiparticle);
      expect(getParticle(a.antiparticle).id, p.id).toBe(p.id);
      for (const k of ['charge3', 'baryon3', 'L_e', 'L_mu', 'L_tau', 'S', 'C', 'B', 'T'] as const) {
        expect(a[k] + p[k], `${p.id}.${k}`).toBe(0);
      }
      expect(a.mass_MeV).toBe(p.mass_MeV);
      expect(a.spin2).toBe(p.spin2);
      if (p.selfConjugate) expect(p.charge3, p.id).toBe(0);
    }
  });

  it('hadron quantum numbers equal the sum over quark content (PDG §15.2 signs)', () => {
    for (const p of PARTICLE_LIST.filter((x) => x.quark_content)) {
      const tot = [0, 0, 0, 0, 0];
      let b3 = 0;
      for (const q of p.quark_content!) {
        const anti = q.endsWith('bar');
        const v = QUARK[anti ? q.slice(0, -3) : q];
        v.forEach((x, i) => (tot[i] += anti ? -x : x));
        b3 += anti ? -1 : 1;
      }
      expect([p.charge3, p.S, p.C, p.B, p.T], p.id).toEqual(tot);
      expect(p.baryon3, p.id).toBe(b3);
      expect(p.quark_content!.length, p.id).toBe(p.kind === 'baryon' ? 3 : 2);
      expect(p.colour, p.id).toBe('1');
    }
  });

  it('superposition mesons carry no flavour and say so', () => {
    for (const id of ['pi0', 'eta', 'eta_prime', 'rho0']) {
      const p = getParticle(id);
      expect(p.quark_content).toBeNull();
      expect(p.content_note).toBeTruthy();
      expect([p.S, p.C, p.B, p.T, p.baryon3, p.charge3]).toEqual([0, 0, 0, 0, 0, 0]);
    }
  });

  it('fermions have half-integer spin, bosons integer; every record cites PDG', () => {
    for (const p of PARTICLE_LIST) {
      const fermion = p.kind === 'quark' || p.kind === 'lepton' || p.kind === 'baryon';
      expect(isFermion(p), p.id).toBe(fermion);
      expect(p.source).toMatch(/^PDG 2026 \(/);
    }
  });

  it('fundamental fermions carry generation and weak_type', () => {
    for (const p of PARTICLE_LIST.filter((x) => x.kind === 'quark' || x.kind === 'lepton')) {
      expect(p.generation, p.id).toBeDefined();
      expect(p.weak_type, p.id).toBeDefined();
    }
  });

  it('orientation values in spec §6 match PDG 2026 where they agree', () => {
    const m = (id: string) => getParticle(id).mass_MeV!;
    const t = (id: string) => getParticle(id).lifetime_s!;
    expect(m('proton')).toBeCloseTo(938.272, 3);
    expect(m('neutron')).toBeCloseTo(939.565, 3);
    expect(m('pi_plus')).toBeCloseTo(139.570, 3);
    expect(m('pi0')).toBeCloseTo(134.977, 3);
    expect(m('k_plus')).toBeCloseTo(493.677, 3);
    expect(m('lambda0')).toBeCloseTo(1115.683, 3);
    expect(m('sigma0')).toBeCloseTo(1192.64, 2);
    expect(m('omega_minus')).toBeCloseTo(1672.45, 2);
    expect(m('delta_pp')).toBe(1232);
    expect(t('pi_plus') / 2.60e-8).toBeCloseTo(1, 2);
    expect(t('mu_minus') / 2.20e-6).toBeCloseTo(1, 2);
    expect(t('sigma0')).toBe(7.4e-20);
    expect(t('k_plus') / 1.24e-8).toBeCloseTo(1, 2);
    expect(t('tau_minus') / 2.90e-13).toBeCloseTo(1, 2);
    expect(t('delta_pp') / 5.6e-24).toBeCloseTo(1, 1);
    expect(t('t') / 5e-25).toBeCloseTo(1, 0);
  });

  it('records the known differences between the spec orientation values and PDG 2026', () => {
    // Spec §6 says τ(Λ) = 2.63e-10 s, τ(n) ≈ 879 s, τ(π⁰) = 8.5e-17 s. PDG 2026 differs:
    expect(getParticle('lambda0').lifetime_s).toBe(2.617e-10);
    expect(getParticle('neutron').lifetime_s).toBe(878.3);
    expect(getParticle('pi0').lifetime_s).toBe(8.426e-17);
  });
});

describe('notation', () => {
  it('parses ASCII and Unicode, and round-trips through the display names', () => {
    const a = parseReaction('Lambda -> p pi-');
    const b = parseReaction('Λ⁰ → p + π⁻');
    expect(a).toEqual(b);
    expect(formatReaction(a)).toBe('Λ⁰ → p π⁻');
    expect(parseReaction(formatReaction(parseReaction('nubar_e p -> e+ n')))).toEqual(parseReaction('nubar_e p -> e+ n'));
  });
  it('rejects unknown tokens, missing arrows and empty sides', () => {
    expect(() => parseReaction(' -> p')).toThrow(/both sides/);
    expect(() => parseReaction('p -> q')).toThrow(/unknown particle/);
    expect(() => parseReaction('p n')).toThrow(/arrow/);
  });
  it('formats thirds as fractions', () => {
    expect([3, -3, 2, -1, 4, 0].map(formatThirds)).toEqual(['1', '−1', '⅔', '−⅓', '4/3', '0']);
  });
});

describe('audit details', () => {
  it('scattering threshold uses √s when given', () => {
    const below = auditReaction(parseReaction('e+ e- -> mu+ mu-', { sqrt_s_MeV: 200 }));
    expect(below.violated).toEqual(['threshold']);
    const above = auditReaction(parseReaction('e+ e- -> mu+ mu-', { sqrt_s_MeV: 250 }));
    expect(above.allowed).toBe(true);
    expect(() => auditReaction(parseReaction('p p -> p p', { sqrt_s_MeV: 1000 }))).toThrow(/below the initial rest mass/);
  });
  it('a massless particle cannot decay, and 1 → 1 decays are vetoed', () => {
    expect(auditReaction(parseReaction('gamma -> e+ e-')).violated).toEqual(['threshold', 'kinematics']);
    expect(auditReaction(parseReaction('Sigma0 -> Lambda')).violated).toEqual(['kinematics']);
  });
  it('resonance formation is allowed only near the resonance mass', () => {
    expect(auditReaction(parseReaction('e+ e- -> Z', { sqrt_s_MeV: 91188 })).allowed).toBe(true);
    expect(auditReaction(parseReaction('e+ e- -> Z', { sqrt_s_MeV: 80000 })).violated).toEqual(['threshold', 'kinematics']);
    expect(auditReaction(parseReaction('e+ e- -> Z', { sqrt_s_MeV: 95000 })).violated).toEqual(['kinematics']);
  });
  it('free quarks are vetoed unless the reaction is marked parton-level', () => {
    expect(auditReaction(parseReaction('u ubar -> e+ e-')).violated).toEqual(['colour']);
    const p = auditReaction(parseReaction('u ubar -> e+ e-', { parton: true }));
    expect(p.allowed).toBe(true);
    expect(identifyForce(p.reaction, p).force).toBe('electromagnetic');
  });
});

describe('force rules beyond the golden set', () => {
  const f = (s: string, parton = false) => identifyForce(parseReaction(s, { parton }));
  it('extension to rule 5: charged leptons with hadrons', () => {
    expect(f('e- p -> e- p').force).toBe('electromagnetic');
    expect(f('e+ e- -> pi+ pi-').force).toBe('electromagnetic');
  });
  it('extension to rule 2: external W or Z', () => {
    expect(f('Z -> e+ e-').force).toBe('weak');
    expect(f('W+ -> u dbar', true).force).toBe('weak');
  });
  it('external Higgs without photons, W or Z is unclassified, not guessed', () => {
    expect(f('h -> b bbar', true).force).toBe('unclassified');
  });
  it('strong at parton level', () => {
    expect(f('u ubar -> g g', true).force).toBe('strong');
  });
  it('documents the ledger’s blind spot: η → π⁺π⁻ passes every account (it is P- and CP-forbidden)', () => {
    const r = f('eta -> pi+ pi-');
    expect(r.force).toBe('strong');
    expect(r.notes.join(' ')).toMatch(/does not check parity/);
  });
});

describe('vertex grammar, exhaustively', () => {
  const fundamentals = PARTICLE_LIST.filter((p) => p.kind !== 'meson' && p.kind !== 'baryon').map((p) => p.id);

  it('every legal 3- and 4-leg vertex has zero total charge', () => {
    let legal = 0;
    const n = fundamentals.length;
    for (let i = 0; i < n; i++) for (let j = i; j < n; j++) for (let k = j; k < n; k++) {
      const ids = [fundamentals[i], fundamentals[j], fundamentals[k]];
      const r = checkVertex(legs(...ids));
      if (r.status === 'legal') {
        legal++;
        expect(ids.reduce((a, id) => a + getParticle(id).charge3, 0), ids.join(' ')).toBe(0);
      }
    }
    // 12 f f̄ Z (6 quarks + 6 leptons) + 9 f f̄ γ (6 quarks + 3 charged leptons) + 6 q q̄ g + 9 h f f̄ +
    // 9 u_i d̄_j W⁻ + 9 conjugates + 3 ℓ⁻ν̄W⁺ + 3 conjugates + ggg + W⁺W⁻γ + W⁺W⁻Z + hW⁺W⁻ + hZZ + hhh
    expect(legal).toBe(12 + 9 + 6 + 9 + 18 + 6 + 6);
    const bosons = ['photon', 'gluon', 'w_plus', 'w_minus', 'z0', 'higgs'];
    let legal4 = 0;
    for (let i = 0; i < 6; i++) for (let j = i; j < 6; j++) for (let k = j; k < 6; k++) for (let l = k; l < 6; l++) {
      const ids = [bosons[i], bosons[j], bosons[k], bosons[l]];
      if (checkVertex(legs(...ids)).status === 'legal') {
        legal4++;
        expect(ids.reduce((a, id) => a + getParticle(id).charge3, 0)).toBe(0);
      }
    }
    // gggg, W⁺W⁻W⁺W⁻, W⁺W⁻ZZ, W⁺W⁻γγ, W⁺W⁻Zγ, hhW⁺W⁻, hhZZ, hhhh
    expect(legal4).toBe(8);
  });

  it('no vertex with two fermions and two bosons, and no four-fermion contact vertex', () => {
    expect(checkVertex(legs('e_minus', 'e_plus', 'photon', 'photon')).status).toBe('not_tree_level');
    expect(checkVertex(legs('mu_minus', 'nubar_mu', 'e_plus', 'nu_e')).reason).toBe('no_such_coupling');
  });

  it('h ν ν̄ is rejected; W to a right-chiral antiquark field is rejected', () => {
    expect(checkVertex(legs('higgs', 'nu_mu', 'nubar_mu')).reason).toBe('higgs_needs_mass');
    expect(checkVertex(legs('u', 'dbar:R', 'w_minus')).reason).toBe('chirality');
    expect(checkVertex(legs('u:L', 'dbar:L', 'w_minus')).status).toBe('legal');
  });

  it('ℓℓg and flavour-changing h are rejected', () => {
    expect(checkVertex(legs('mu_minus', 'mu_plus', 'gluon')).reason).toBe('gluon_needs_colour');
    expect(checkVertex(legs('higgs', 'mu_minus', 'e_plus')).reason).toBe('neutral_flavour_change');
  });

  it('no right-chiral neutrino for the Z to couple to', () => {
    expect(checkVertex(legs('nu_tau:R', 'nubar_tau', 'z0')).reason).toBe('chirality');
    expect(checkVertex(legs('e_minus:R', 'e_plus', 'z0')).status).toBe('legal');
  });

  it('rejects malformed vertex input', () => {
    expect(() => checkVertex(legs('photon', 'photon'))).toThrow(/3 or 4 legs/);
  });

  it('hadrons are not vertex legs', () => {
    expect(() => checkVertex(legs('proton', 'antiproton', 'photon'))).toThrow();
  });
});

describe('curated loop facts', () => {
  it('every curated vertex is one the tree-level grammar rejects', () => {
    for (const f of CURATED_FACTS.filter((x) => x.vertex)) {
      expect(checkVertex(legs(...f.vertex!)).status, f.id).toBe('not_tree_level');
    }
  });
  it('every curated process with a forbidden verdict passes the ledger (so the reason is genuinely beyond it) unless it is a ledger violation', () => {
    const z = auditReaction(parseReaction('Z -> gamma gamma'));
    expect(z.allowed).toBe(true); // Landau–Yang is not a ledger account
    expect(auditReaction(parseReaction('pi0 -> gamma gamma gamma')).allowed).toBe(true); // C-parity is not a ledger account
    expect(auditReaction(parseReaction('mu- -> e- gamma')).allowed).toBe(false);
  });
  it('every fact has a source', () => {
    for (const f of CURATED_FACTS) expect(f.source.length, f.id).toBeGreaterThan(10);
  });
});

describe('lifetime bands', () => {
  it('orientation particles land in the bands of the force that decays them', () => {
    expect(lifetimeBand('delta_pp')).toBe('strong');
    expect(lifetimeBand('rho0')).toBe('strong');
    expect(lifetimeBand('sigma0')).toBe('electromagnetic');
    expect(lifetimeBand('pi0')).toBe('electromagnetic');
    expect(lifetimeBand('pi_plus')).toBe('weak');
    expect(lifetimeBand('lambda0')).toBe('weak');
    expect(lifetimeBand('tau_minus')).toBe('weak');
    expect(lifetimeBand('d0')).toBe('weak');
    expect(lifetimeBand('lambda_c')).toBe('weak');
  });
  it('each listed exception really is out of its force’s band in the PDG data', () => {
    for (const e of BAND_EXCEPTIONS) {
      const t = getParticle(e.id).lifetime_s!;
      if (e.kind === 'wrong_band') expect(bandOf(t), e.id).not.toBe(e.force);
      else expect(t, e.id).toBeGreaterThan(1); // the neutron: minutes, not nanoseconds
    }
  });
  it('stable and confined particles have no band', () => {
    expect(lifetimeBand('proton')).toBeNull();
    expect(lifetimeBand('u')).toBeNull();
  });
  it('the neutron’s decay releases about 0.78 MeV', () => {
    const q = getParticle('neutron').mass_MeV! - getParticle('proton').mass_MeV! - getParticle('e_minus').mass_MeV!;
    expect(q).toBeCloseTo(0.782, 3);
  });
});

describe('CKM data', () => {
  it('rows are unitary to within the fit precision', () => {
    for (const row of ckm.magnitude) {
      expect(row.reduce((a, v) => a + v * v, 0)).toBeCloseTo(1, 3);
    }
  });
});
