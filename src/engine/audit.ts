// The conservation audit (spec §5.2): exact integer sums for every additive
// account, a necessary-only angular-momentum check, colour, the decay threshold
// and four-momentum vetoes. Pure functions; every verdict in the app comes from here.

import { formatThirds } from './notation';
import { getParticle, isFermion, leptonNumber } from './particles';
import type { AccountId, AccountResult, AuditResult, FlavourKey, Particle, Reaction } from './types';

/** Order matters: the first violated account in this list is the headline reason. */
export const ACCOUNT_ORDER: AccountId[] = [
  'charge', 'baryon', 'lepton', 'L_e', 'L_mu', 'L_tau', 'spin_parity', 'colour', 'threshold', 'kinematics',
];

export const ACCOUNT_LABELS: Record<AccountId, string> = {
  charge: 'Electric charge Q',
  baryon: 'Baryon number B',
  lepton: 'Lepton number L',
  L_e: 'Electron number Lₑ',
  L_mu: 'Muon number L_μ',
  L_tau: 'Tau number L_τ',
  spin_parity: 'Angular momentum (half-integer count)',
  colour: 'Colour (free particles must be colour singlets)',
  threshold: 'Energy threshold',
  kinematics: 'Four-momentum',
};

const FLAVOURS: FlavourKey[] = ['S', 'C', 'B', 'T'];

/** Mass tolerance for float comparisons, in MeV. */
const EPS = 1e-9;

function sum(ps: Particle[], f: (p: Particle) => number): number {
  return ps.reduce((a, p) => a + f(p), 0);
}

function additive(
  id: AccountId, ins: Particle[], outs: Particle[], f: (p: Particle) => number, unit: 'thirds' | 'integer',
): AccountResult {
  const before = sum(ins, f);
  const after = sum(outs, f);
  const fmt = unit === 'thirds' ? formatThirds : (n: number) => (n < 0 ? `−${-n}` : `${n}`);
  return {
    id, label: ACCOUNT_LABELS[id], status: before === after ? 'balances' : 'violated', before, after, unit,
    detail: `${fmt(before)} → ${fmt(after)}`,
  };
}

function massOf(p: Particle): number | null {
  return p.mass_MeV;
}

function isParton(p: Particle): boolean {
  return p.kind === 'quark' || p.id === 'gluon';
}

function fmtMeV(x: number): string {
  return x >= 100 ? x.toFixed(1) : x >= 1 ? x.toFixed(3) : x.toPrecision(4);
}

function thresholdAccount(r: Reaction, ins: Particle[], outs: Particle[]): AccountResult {
  const base = { id: 'threshold' as const, label: ACCOUNT_LABELS.threshold, unit: 'MeV' as const };
  if ([...ins, ...outs].some(isParton)) {
    return { ...base, status: 'not_checked', detail: 'Not checked: quark masses are scheme-dependent and free quarks are never on shell, so parton-level thresholds are not meaningful here.' };
  }
  const mIn = ins.map(massOf);
  const mOut = outs.map(massOf);
  if ([...mIn, ...mOut].some((m) => m == null)) {
    return { ...base, status: 'not_checked', detail: 'Not checked: a mass is missing from the table.' };
  }
  const sIn = (mIn as number[]).reduce((a, b) => a + b, 0);
  const sOut = (mOut as number[]).reduce((a, b) => a + b, 0);
  if (ins.length === 1) {
    const ok = sIn > sOut + EPS;
    return {
      ...base, status: ok ? 'balances' : 'violated', before: sIn, after: sOut,
      detail: `m(${ins[0].name}) = ${fmtMeV(sIn)} MeV ${ok ? '>' : '≤'} Σ m(products) = ${fmtMeV(sOut)} MeV (Q = ${fmtMeV(sIn - sOut)} MeV)`,
    };
  }
  const need = Math.max(sIn, sOut);
  if (r.sqrt_s_MeV == null) {
    return { ...base, status: 'not_checked', before: sIn, after: sOut, detail: `Not checked: no √s given. The process needs √s ≥ ${fmtMeV(need)} MeV.` };
  }
  if (r.sqrt_s_MeV + EPS < sIn) throw new Error(`√s = ${r.sqrt_s_MeV} MeV is below the initial rest mass ${sIn} MeV`);
  const ok = r.sqrt_s_MeV + EPS >= sOut;
  return {
    ...base, status: ok ? 'balances' : 'violated', before: r.sqrt_s_MeV, after: sOut,
    detail: `√s = ${fmtMeV(r.sqrt_s_MeV)} MeV ${ok ? '≥' : '<'} Σ m(final) = ${fmtMeV(sOut)} MeV`,
  };
}

function kinematicsAccount(r: Reaction, ins: Particle[], outs: Particle[]): AccountResult {
  const base = { id: 'kinematics' as const, label: ACCOUNT_LABELS.kinematics };
  const massless = (p: Particle) => p.mass_MeV === 0;
  if (ins.length === 1 && massless(ins[0])) {
    return { ...base, status: 'violated', detail: `A massless particle (${ins[0].name}) cannot decay: its four-momentum squared is zero, but any set of products other than collinear massless ones has positive invariant mass.` };
  }
  if (ins.length === 1 && outs.length === 1) {
    return { ...base, status: 'violated', detail: 'A particle cannot decay into one other particle: in the parent’s rest frame the product would have zero momentum, so its energy would be its own mass, not the parent’s.' };
  }
  if (ins.length >= 2 && outs.length === 1 && massless(outs[0])) {
    return { ...base, status: 'violated', detail: `A single massless particle (${outs[0].name}) cannot be the only product: in the centre-of-mass frame the initial state has zero total momentum and non-zero energy, which no single massless particle can carry.` };
  }
  if (ins.length >= 2 && outs.length === 1) {
    const m = outs[0].mass_MeV;
    const w = outs[0].width_MeV ?? 0;
    if (m != null && r.sqrt_s_MeV != null && Math.abs(r.sqrt_s_MeV - m) > Math.max(w, EPS)) {
      return { ...base, status: 'violated', detail: `Forming a single ${outs[0].name} needs √s ≈ ${fmtMeV(m)} MeV (within its width), not ${fmtMeV(r.sqrt_s_MeV)} MeV.` };
    }
    return { ...base, status: 'balances', detail: `Allowed only as resonance formation, at √s ≈ m(${outs[0].name}).` };
  }
  return { ...base, status: 'balances', detail: 'No four-momentum veto applies.' };
}

function colourAccount(r: Reaction, ins: Particle[], outs: Particle[]): AccountResult {
  const base = { id: 'colour' as const, label: ACCOUNT_LABELS.colour };
  const coloured = [...ins, ...outs].filter((p) => p.colour !== '1');
  if (r.parton) {
    return { ...base, status: 'not_checked', detail: 'Parton-level process: colour flows through the diagram and is not an additive count, so it is not audited here.' };
  }
  if (coloured.length) {
    return { ...base, status: 'violated', detail: `Free coloured particles cannot appear as external states: ${coloured.map((p) => p.name).join(', ')}.` };
  }
  return { ...base, status: 'balances', detail: 'Every external particle is a colour singlet.' };
}

function spinParityAccount(ins: Particle[], outs: Particle[]): AccountResult {
  const a = ins.filter(isFermion).length;
  const b = outs.filter(isFermion).length;
  return {
    id: 'spin_parity', label: ACCOUNT_LABELS.spin_parity, unit: 'count', before: a, after: b,
    status: a % 2 === b % 2 ? 'balances' : 'violated',
    detail: `${a} half-integer-spin particle${a === 1 ? '' : 's'} → ${b}. ${a % 2 === b % 2 ? 'Same parity' : 'Different parity'}. (Necessary, not sufficient.)`,
  };
}

export function auditReaction(r: Reaction): AuditResult {
  const ins = r.initial.map(getParticle);
  const outs = r.final.map(getParticle);
  const accounts: AccountResult[] = [
    additive('charge', ins, outs, (p) => p.charge3, 'thirds'),
    additive('baryon', ins, outs, (p) => p.baryon3, 'thirds'),
    additive('lepton', ins, outs, leptonNumber, 'integer'),
    additive('L_e', ins, outs, (p) => p.L_e, 'integer'),
    additive('L_mu', ins, outs, (p) => p.L_mu, 'integer'),
    additive('L_tau', ins, outs, (p) => p.L_tau, 'integer'),
    spinParityAccount(ins, outs),
    colourAccount(r, ins, outs),
    thresholdAccount(r, ins, outs),
    kinematicsAccount(r, ins, outs),
  ];
  const violated = ACCOUNT_ORDER.filter((id) => accounts.find((a) => a.id === id)!.status === 'violated');
  const flavour = FLAVOURS.map((key) => ({ key, before: sum(ins, (p) => p[key]), after: sum(outs, (p) => p[key]) }));
  const notes: string[] = [];
  if (ins.some((p) => p.quark_content === null) || outs.some((p) => p.quark_content === null)) {
    notes.push('A flavourless superposition (such as π⁰ or η) appears; its flavour numbers are all zero.');
  }
  return {
    reaction: r,
    kind: ins.length === 1 ? 'decay' : 'scattering',
    accounts,
    violated,
    allowed: violated.length === 0,
    firstViolation: violated[0] ?? null,
    flavour,
    flavourChanges: flavour.filter((f) => f.before !== f.after).map((f) => f.key),
    notes,
  };
}
