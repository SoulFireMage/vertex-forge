// Force identification (spec §5.3, with two documented extensions).
// Rule order matters; the Guide prints FORCE_RULES verbatim.

import { auditReaction } from './audit';
import { getParticle, isChargedLepton, isHadron, isNeutrino } from './particles';
import type { AuditResult, ForceResult, Particle, Reaction } from './types';

export const FORCE_RULES: { rule: number; text: string; extension?: string }[] = [
  { rule: 1, text: 'Forbidden by any conservation or kinematic check → forbidden.' },
  {
    rule: 2,
    text: 'Any neutrino in or out, any change in S, C, B or T, or any external W or Z → weak.',
    extension: 'External W/Z added to the spec’s rule 2: their decays and production are weak processes even when no neutrino or flavour change appears (e.g. W⁺ → u d̄ at parton level, Z → e⁺e⁻).',
  },
  { rule: 3, text: 'Otherwise, any photon in or out → electromagnetic.' },
  { rule: 4, text: 'Otherwise, all external particles are hadrons (or quarks and gluons at parton level) and flavour numbers are conserved → strong.' },
  {
    rule: 5,
    text: 'Otherwise, charged leptons appear (with or without hadrons), no neutrinos, flavour conserved → electromagnetic (dominant); a Z-mediated contribution also exists.',
    extension: 'The spec’s rule 5 covered charged leptons only. e⁻p → e⁻p and e⁺e⁻ → π⁺π⁻ fell through every rule, so hadrons are allowed alongside the charged leptons.',
  },
  { rule: 6, text: 'Anything else (for example a process with an external Higgs boson) → unclassified. The engine does not guess.' },
];

export const DOMINANT_FORCE_CAVEAT =
  'This is the dominant force: if a strong path is available it dominates, then electromagnetic, then weak.';

export const LEDGER_LIMITS_NOTE =
  'The ledger checks additive quantum numbers, a necessary angular-momentum condition and kinematics. It does not check parity, C-parity, G-parity or isospin, so a few processes it calls allowed are forbidden by those symmetries (η → π⁺π⁻, for example). Drills avoid them.';

const has = (ps: Particle[], f: (p: Particle) => boolean) => ps.some(f);

export function identifyForce(r: Reaction, audit: AuditResult = auditReaction(r)): ForceResult {
  const all = [...r.initial, ...r.final].map(getParticle);
  const notes: string[] = [DOMINANT_FORCE_CAVEAT];
  if (!audit.allowed) {
    return { force: 'forbidden', rule: 1, reason: `Fails ${audit.violated.join(', ')}.`, notes: [] };
  }
  if (has(all, (p) => p.id === 'higgs')) {
    notes.push('A Higgs boson is external: its decays go through Higgs couplings (or loops), so the force label is only partly meaningful.');
  }
  const reasons2: string[] = [];
  if (has(all, isNeutrino)) reasons2.push('a neutrino is present');
  if (audit.flavourChanges.length) {
    reasons2.push(audit.flavour.filter((f) => f.before !== f.after).map((f) => `${f.key}: ${f.before} → ${f.after}`).join(', '));
  }
  if (has(all, (p) => p.id === 'w_plus' || p.id === 'w_minus' || p.id === 'z0')) reasons2.push('a W or Z is external');
  if (reasons2.length) {
    return { force: 'weak', rule: 2, reason: `Weak: ${reasons2.join('; ')}.`, notes };
  }
  if (has(all, (p) => p.id === 'photon')) {
    return { force: 'electromagnetic', rule: 3, reason: 'A photon is emitted or absorbed, and no flavour changes.', notes };
  }
  const strongOk = (p: Particle) => isHadron(p) || (r.parton === true && (p.kind === 'quark' || p.id === 'gluon'));
  if (all.every(strongOk)) {
    return { force: 'strong', rule: 4, reason: 'Only hadrons (or quarks and gluons), and every flavour number is conserved.', notes: [...notes, LEDGER_LIMITS_NOTE] };
  }
  if (has(all, isChargedLepton) && all.every((p) => isChargedLepton(p) || strongOk(p))) {
    return {
      force: 'electromagnetic', rule: 5,
      reason: 'Charged leptons with no neutrinos and no flavour change: photon exchange dominates.',
      notes: [...notes, 'A Z-mediated contribution also exists; it matters near √s ≈ m_Z.'],
    };
  }
  return { force: 'unclassified', rule: 6, reason: 'Outside the rules the engine applies.', notes };
}
