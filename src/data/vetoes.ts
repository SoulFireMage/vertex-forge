// Curated symmetry vetoes: processes that pass every ledger account but are
// forbidden by a discrete symmetry (C, P, CP) or by angular momentum (Landau–Yang).
// The engine cannot compute these; each row is copied from a PDG 2026 listing,
// where the mode appears under "C, P, CP or LF violating modes" with the
// symmetry named, or from a PDG review. Charge conjugates match automatically.

export type Symmetry = 'C' | 'P' | 'CP' | 'Landau–Yang';

export interface SymmetryVeto {
  id: string;
  /** Text notation, parsed by the engine. */
  process: string;
  violates: Symmetry[];
  /** PDG upper limit as printed. */
  limit: string;
  why: string;
  source: string;
  verify: boolean;
}

const ETA_P = 'η has J^P = 0⁻. Two spinless pions with total J = 0 have L = 0, so their parity is (−1)² × (−1)⁰ = +1. Parity would flip, and so would CP.';

export const SYMMETRY_VETOES: SymmetryVeto[] = [
  { id: 'eta_pipi_charged', process: 'eta -> pi+ pi-', violates: ['P', 'CP'], limit: '< 4.4 × 10⁻⁶ (90% CL)', why: ETA_P, source: 'PDG 2026 η listing, Γ25', verify: false },
  { id: 'eta_pipi_neutral', process: 'eta -> pi0 pi0', violates: ['P', 'CP'], limit: '< 3.5 × 10⁻⁴ (90% CL)', why: ETA_P, source: 'PDG 2026 η listing, Γ26', verify: false },
  { id: 'eta_4pi0', process: 'eta -> pi0 pi0 pi0 pi0', violates: ['P', 'CP'], limit: '< 6.9 × 10⁻⁷ (90% CL)', why: 'PDG lists η → 4π⁰ as parity- and CP-violating.', source: 'PDG 2026 η listing, Γ30; Tests of Conservation Laws review', verify: false },
  { id: 'eta_3gamma', process: 'eta -> gamma gamma gamma', violates: ['C'], limit: '< 1.6 × 10⁻⁵ (90% CL)', why: 'η has C = +1; three photons have C = (−1)³ = −1.', source: 'PDG 2026 η listing, Γ29', verify: false },
  { id: 'eta_pi0gamma', process: 'eta -> pi0 gamma', violates: ['C'], limit: '< 9 × 10⁻⁵ (90% CL)', why: 'η and π⁰ both have C = +1 and the photon has C = −1. PDG also notes this mode is forbidden by angular momentum conservation (0 → 0 + one real photon).', source: 'PDG 2026 η listing, Γ24 and its footnote [a]', verify: false },
  { id: 'etap_pipi_charged', process: "eta' -> pi+ pi-", violates: ['P', 'CP'], limit: '< 1.8 × 10⁻⁵ (90% CL)', why: 'η′ has J^P = 0⁻, and the parity argument is the same as for η → ππ.', source: 'PDG 2026 η′(958) listing, Γ34', verify: false },
  { id: 'etap_pipi_neutral', process: "eta' -> pi0 pi0", violates: ['P', 'CP'], limit: '< 4 × 10⁻⁴ (90% CL)', why: 'η′ has J^P = 0⁻, and the parity argument is the same as for η → ππ.', source: 'PDG 2026 η′(958) listing, Γ35', verify: false },
  { id: 'etap_pi0rho0', process: "eta' -> pi0 rho0", violates: ['C'], limit: '< 4% (90% CL)', why: 'η′ and π⁰ have C = +1, ρ⁰ has C = −1.', source: 'PDG 2026 η′(958) listing, Γ37', verify: false },
  { id: 'etap_3gamma', process: "eta' -> gamma gamma gamma", violates: ['C'], limit: '< 1.0 × 10⁻⁴ (90% CL)', why: 'η′ has C = +1; three photons have C = −1.', source: 'PDG 2026 η′(958) listing, Γ39', verify: false },
  { id: 'pi0_3gamma', process: 'pi0 -> gamma gamma gamma', violates: ['C'], limit: '< 3.1 × 10⁻⁸ (90% CL)', why: 'π⁰ has C = +1; three photons have C = −1.', source: 'PDG 2026 π⁰ listing, Γ12; Tests of Conservation Laws review', verify: false },
  { id: 'jpsi_2gamma', process: 'J/psi -> gamma gamma', violates: ['C'], limit: '< 2.7 × 10⁻⁷', why: 'J/ψ has C = −1; two photons have C = +1. (Landau–Yang also forbids a spin-1 particle going to two photons.)', source: 'PDG 2026, Tests of Conservation Laws review (introduction)', verify: false },
  { id: 'z_2gamma', process: 'Z -> gamma gamma', violates: ['Landau–Yang'], limit: '< 1.46 × 10⁻⁵ (95% CL)', why: 'The Landau–Yang theorem: a spin-1 particle cannot decay into two identical massless vector bosons.', source: 'PDG 2026, Status of Higgs Boson Physics §11.3.9; PDG 2026 Z listing', verify: false },
];
