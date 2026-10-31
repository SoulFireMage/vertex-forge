// Curated beyond-tree-level facts (spec §5.4, Vertex Auditor step 3).
// These are never inferred by the engine. Each has a source; anything not
// checked against that source carries verify: true.

export interface CuratedFact {
  id: string;
  /** Vertex legs (all incoming) or a process in text notation. */
  vertex?: string[];
  process?: string;
  verdict: 'occurs_via_loops' | 'forbidden_all_orders' | 'forbidden_by_symmetry' | 'suppressed_unobservable';
  statement: string;
  source: string;
  verify: boolean;
}

export const CURATED_FACTS: CuratedFact[] = [
  {
    id: 'h_gg_loop',
    vertex: ['higgs', 'gluon', 'gluon'],
    verdict: 'occurs_via_loops',
    statement: 'The Higgs boson has no colour, so it has no tree-level coupling to gluons. The h–g–g coupling arises at one loop, through a virtual top-quark pair, with minor contributions from lighter quarks.',
    source: 'PDG 2026, Status of Higgs Boson Physics, §11.2.1',
    verify: false,
  },
  {
    id: 'h_gammagamma_loop',
    vertex: ['higgs', 'photon', 'photon'],
    verdict: 'occurs_via_loops',
    statement: 'The Higgs boson is electrically neutral, so it has no tree-level coupling to photons. h → γγ goes through loops: the virtual W⁺W⁻ loop dominates and interferes destructively with the smaller top-quark loop.',
    source: 'PDG 2026, Status of Higgs Boson Physics, §11.2.1',
    verify: false,
  },
  {
    id: 'furry_three_photon',
    vertex: ['photon', 'photon', 'photon'],
    verdict: 'forbidden_all_orders',
    statement: 'In QED, amplitudes with an odd number of photons attached to a closed fermion loop cancel (Furry’s theorem, a consequence of charge-conjugation invariance), so there is no three-photon vertex at any order of QED.',
    source: 'W. H. Furry, Phys. Rev. 51, 125 (1937); not found in the PDG reviews consulted',
    verify: true,
  },
  {
    id: 'landau_yang_z',
    process: 'Z -> gamma gamma',
    verdict: 'forbidden_by_symmetry',
    statement: 'The Landau–Yang theorem forbids a spin-1 particle from decaying into two identical massless vector bosons, so an on-shell Z cannot decay to γγ. PDG 2026 lists only an upper limit: B(Z → γγ) < 1.46 × 10⁻⁵ (95% CL).',
    source: 'PDG 2026, Status of Higgs Boson Physics, §11.3.9 (theorem); PDG 2026 Z listing (limit)',
    verify: false,
  },
  {
    id: 'pi0_3gamma_c',
    process: 'pi0 -> gamma gamma gamma',
    verdict: 'forbidden_by_symmetry',
    statement: 'π⁰ has C = +1 and each photon has C = −1, so three photons have C = −1. The decay would violate charge-conjugation symmetry, which electromagnetism conserves. PDG 2026: B(π⁰ → 3γ) < 3.1 × 10⁻⁸ (90% CL).',
    source: 'PDG 2026, Tests of Conservation Laws (introduction); PDG 2026 π⁰ listing',
    verify: false,
  },
  {
    id: 'mu_egamma_numass',
    process: 'mu- -> e- gamma',
    verdict: 'suppressed_unobservable',
    statement: 'Forbidden in the minimal Standard Model by lepton family numbers. If neutrino masses and mixing were the only source of lepton-flavour violation, the branching ratio would be below 10⁻⁵⁴. The experimental limit is B(μ → eγ) < 1.5 × 10⁻¹³ (90% CL); it has never been seen.',
    source: 'PDG 2026, Tests of Conservation Laws, §5, Eq. (27); PDG 2026 μ listing',
    verify: false,
  },
  {
    id: 'proton_decay',
    process: 'p -> e+ pi0',
    verdict: 'suppressed_unobservable',
    statement: 'Violates baryon and lepton number (B − L is conserved: 1 → 1). Never observed: τ(p → e⁺π⁰) > 2.4 × 10³⁴ years. In the SM, B − L is an accidental symmetry; B + L is violated only by a highly suppressed non-perturbative (anomaly) effect.',
    source: 'PDG 2026, Tests of Conservation Laws, §6',
    verify: false,
  },
];
