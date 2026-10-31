// App data shapes. Drills follow spec §4: shared fields plus type-specific ones.
// Every answer that can be computed is computed by the engine; the `expected`
// blocks exist only so `npm test` can check each hand-written drill against it.

import type { AccountId, Force, VertexReason, VertexStatus } from '../engine/types';
import type { LifetimeBand } from '../engine/lifetime';

export type WingId = 'ledger' | 'composites' | 'vertices' | 'diagnosis';
export type Register = 'dual' | 'formal' | 'intuitive';

export interface TaxonomyNode {
  id: string;
  wing: WingId;
  group: string;
  formal: string;
  intuitive: string;
  summary: string;
  note?: string;
  source: string;
  verify?: boolean;
}

export interface Wing {
  id: WingId;
  numeral: string;
  title: string;
  focus: string;
}

export type DrillType = 'ledger_audit' | 'hadron_builder' | 'vertex_audit' | 'decay_diagnosis' | 'mediator_bridge';

interface DrillBase {
  id: string;
  drill_type: DrillType;
  taxonomy_nodes: string[];
  difficulty_elo: number;
  register_tags: { formal: string; intuitive: string };
  prompt_instruction: string;
  /** Shape-level account (formal register). */
  explanation_formal: string;
  /** Shape-level account (intuitive register). */
  explanation_intuitive: string;
  /** The stepwise route, shown under "Show the steps". */
  explanation_steps: string[];
  source: string;
  verify?: boolean;
  /** Set to true only by a human physicist. */
  reviewed: boolean;
}

export interface LedgerAuditDrill extends DrillBase {
  drill_type: 'ledger_audit';
  reaction: string;
  sqrt_s_MeV?: number;
  parton?: boolean;
  expected: { allowed: boolean; violated: AccountId[] };
}

export interface HadronBuildDrill extends DrillBase {
  drill_type: 'hadron_builder';
  direction: 'build';
  /** The hadron to assemble. */
  hadron: string;
  /** Quark tiles offered (the answer plus decoys). */
  tiles: string[];
}

export interface HadronNameDrill extends DrillBase {
  drill_type: 'hadron_builder';
  direction: 'name';
  /** The quark content shown. */
  tiles: string[];
  /** Hadron ids offered as answers (plus the built-in "not a hadron" option). */
  options: string[];
  expected: { colour_neutral: boolean; matches: string[] };
}

export interface VertexAuditDrill extends DrillBase {
  drill_type: 'vertex_audit';
  /** All legs incoming, as the engine sees them. Leg strings may carry chirality: "u:R". */
  legs: string[];
  /** How to draw each leg: incoming (left) or outgoing (right, shown as its antiparticle). Random if omitted. */
  layout?: ('in' | 'out')[];
  /** Optional curated step 3, by fact id in src/data/curated.ts. */
  loop_fact?: string;
  expected: { status: VertexStatus; reason?: VertexReason };
}

export interface DecayDiagnosisDrill extends DrillBase {
  drill_type: 'decay_diagnosis';
  reaction: string;
  expected: { allowed: boolean; force: Force; band: LifetimeBand | null };
}

export interface MediatorBridgeDrill extends DrillBase {
  drill_type: 'mediator_bridge';
  /** External legs at the left vertex and the right vertex, in text notation "in: … | out: …". */
  left: { in: string[]; out: string[] };
  right: { in: string[]; out: string[] };
  /** Engine-valid mediators the drill neither requires nor penalises (e.g. a negligible Higgs exchange). */
  optional?: string[];
  optional_note?: string;
  expected: { valid: string[] };
}

export type HadronDrill = HadronBuildDrill | HadronNameDrill;
export type DrillItem = LedgerAuditDrill | HadronDrill | VertexAuditDrill | DecayDiagnosisDrill | MediatorBridgeDrill;

export interface NodeMastery {
  elo: number;
  rd: number;
  vol: number;
  attempts: number;
  last_practiced: string | null;
  stability_days: number;
}

export interface AttemptRecord {
  id: string;
  date: string;
  kind: 'drill' | 'blitz' | 'random';
  item_id: string;
  nodes: string[];
  score: number;
  ttd_ms?: number;
}

export interface UserTelemetry {
  user_id: string;
  preferred_register: Register;
  global_elo: number;
  node_mastery: Record<string, NodeMastery>;
  attempt_log: AttemptRecord[];
  updated_at: string;
}

export interface Settings {
  theme: 'auto' | 'light' | 'dark';
  register: Register;
}
