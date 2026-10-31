// Shared shapes for the ledger engine. Pure data, no UI imports.

export type Kind = 'quark' | 'lepton' | 'gauge_boson' | 'scalar_boson' | 'meson' | 'baryon';
export type WeakType = 'up' | 'down' | 'charged_lepton' | 'neutrino';
export type Colour = '1' | '3' | '3bar' | '8';
export type LifetimeBasis = 'mean_life' | 'from_width' | 'stable' | 'not_applicable';
export type FlavourKey = 'S' | 'C' | 'B' | 'T';

/** One row of src/data/particles.json (particles only; antiparticles are generated). */
export interface ParticleRecord {
  id: string;
  name: string;
  kind: Kind;
  pdg_id: string;
  pdg_name: string;
  mc_id: number;
  /** Electric charge in units of e/3 (u = +2, e⁻ = −3). */
  charge3: number;
  /** Baryon number in thirds (quark = +1, proton = +3). */
  baryon3: number;
  L_e: number;
  L_mu: number;
  L_tau: number;
  S: number;
  C: number;
  /** Bottomness (beauty). Not baryon number: that is `baryon3`. */
  B: number;
  T: number;
  colour: '1' | '3' | '8';
  /** Twice the spin. */
  spin2: number;
  generation?: 1 | 2 | 3;
  weak_type?: WeakType;
  /** Hadrons only. null for flavourless superpositions such as π⁰ and η. */
  quark_content?: string[] | null;
  content_note?: string;
  mass_MeV: number | null;
  mass_err_MeV?: number;
  lifetime_s: number | null;
  lifetime_basis: LifetimeBasis;
  width_MeV?: number;
  /** Antiparticle id, or "self" for self-conjugate particles. */
  antiparticle: string;
  anti_name?: string;
  note?: string;
  source: string;
}

export interface Particle extends Omit<ParticleRecord, 'colour' | 'antiparticle'> {
  colour: Colour;
  /** Id of the antiparticle (equal to `id` when self-conjugate). */
  antiparticle: string;
  /** True for generated antiparticles. */
  isAnti: boolean;
  /** Id of the stored particle this one is (or is the antiparticle of). */
  base: string;
  selfConjugate: boolean;
}

// ── Reactions ─────────────────────────────────────────────

export interface Reaction {
  initial: string[];
  final: string[];
  /** Centre-of-mass energy for scattering, in MeV. Without it the threshold check is skipped. */
  sqrt_s_MeV?: number;
  /** Parton-level process (free quarks and gluons allowed as external legs). */
  parton?: boolean;
}

export type AccountId =
  | 'charge' | 'baryon' | 'lepton' | 'L_e' | 'L_mu' | 'L_tau'
  | 'spin_parity' | 'colour' | 'threshold' | 'kinematics';

export type AccountStatus = 'balances' | 'violated' | 'not_checked';

export interface AccountResult {
  id: AccountId;
  label: string;
  status: AccountStatus;
  /** Totals for additive accounts, in the unit given. */
  before?: number;
  after?: number;
  unit?: 'thirds' | 'integer' | 'MeV' | 'count';
  detail: string;
}

export interface FlavourLedger {
  key: FlavourKey;
  before: number;
  after: number;
}

export interface AuditResult {
  reaction: Reaction;
  kind: 'decay' | 'scattering';
  accounts: AccountResult[];
  violated: AccountId[];
  allowed: boolean;
  firstViolation: AccountId | null;
  /** S, C, B, T totals. Not conservation laws of the full SM, so they never forbid; they feed force identification. */
  flavour: FlavourLedger[];
  flavourChanges: FlavourKey[];
  notes: string[];
}

export type Force = 'forbidden' | 'strong' | 'electromagnetic' | 'weak' | 'unclassified';

export interface ForceResult {
  force: Force;
  /** Which rule fired (see FORCE_RULES in force.ts and the Guide). */
  rule: number;
  reason: string;
  notes: string[];
}

// ── Vertices ──────────────────────────────────────────────

export type Chirality = 'L' | 'R';

export interface VertexLeg {
  particle: string;
  /**
   * Chirality of the *field* on a fermion leg. The W couples only to left-chiral
   * fields. For an antifermion leg, 'L' still names the left-chiral field, whose
   * antiparticles are right-handed in helicity in the massless limit.
   */
  chirality?: Chirality;
}

export type VertexStatus = 'legal' | 'not_tree_level' | 'malformed';

export type VertexReason =
  | 'charge_sum'
  | 'photon_needs_charge'
  | 'gluon_needs_colour'
  | 'neutral_flavour_change'
  | 'chirality'
  | 'lepton_family'
  | 'higgs_needs_mass'
  | 'fermion_mismatch'
  | 'no_such_coupling';

export interface VertexResult {
  status: VertexStatus;
  /** Name of the matching rule when legal, e.g. "f f̄ γ". */
  rule?: string;
  reason?: VertexReason;
  detail: string;
  notes: string[];
}
