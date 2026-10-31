// Decay Diagnosis (spec §4.4): allowed? → which force? → which lifetime band?

import { useMemo, useRef, useState } from 'preact/hooks';
import {
  ACCOUNT_LABELS, BANDS, LIFETIME_CAVEAT, auditReaction, bandOf, getParticle, identifyForce, parseReaction,
} from '../../engine';
import type { DecayDiagnosisDrill } from '../../lib/types';
import { PName, ReactionText } from '../Name';
import { Question } from '../Question';
import { LedgerTable } from './LedgerAudit';
import type { DrillResult } from '../DrillPlayer';

const FORCES = [
  ['strong', 'Strong'],
  ['electromagnetic', 'Electromagnetic'],
  ['weak', 'Weak'],
] as const;

function fmtLifetime(t: number): string {
  const [m, e] = t.toExponential(2).split('e');
  return `${m} × 10^${Number(e)} s`;
}

export function DecayDiagnosis({ drill, onFinish, blitz }: { drill: DecayDiagnosisDrill; onFinish: (r: DrillResult) => void; blitz?: boolean }) {
  const start = useRef(performance.now());
  const reaction = useMemo(() => parseReaction(drill.reaction), [drill]);
  const audit = useMemo(() => auditReaction(reaction), [reaction]);
  const force = useMemo(() => identifyForce(reaction, audit), [reaction, audit]);
  const parent = getParticle(reaction.initial[0]);
  const band = parent.lifetime_s != null ? bandOf(parent.lifetime_s) : null;
  const [a1, setA1] = useState<boolean | null>(null);
  const [a2, setA2] = useState<boolean | null>(null);
  const [a3, setA3] = useState<boolean | null>(null);
  const totalSteps = blitz || !audit.allowed ? 1 : band ? 3 : 2;
  const finish = (answers: (boolean | null)[]) =>
    onFinish({ score: answers.filter((x) => x === true).length / totalSteps, ttd_ms: performance.now() - start.current });

  return (
    <div>
      <div class="reaction-box"><ReactionText initial={reaction.initial} final={reaction.final} /></div>
      <Question label="Step 1" question="Does nature allow this decay?" fixedOrder
        choices={[
          { id: 'yes', label: 'Allowed', correct: audit.allowed, feedback: audit.allowed ? 'Every account balances.' : undefined },
          { id: 'no', label: 'Forbidden', correct: !audit.allowed, feedback: !audit.allowed ? `Violated: ${audit.violated.map((v) => ACCOUNT_LABELS[v]).join('; ')}.` : undefined },
        ]}
        onAnswer={(ok) => { setA1(ok); if (totalSteps === 1) finish([ok]); }} />
      {a1 !== null && totalSteps > 1 && (
        <Question label="Step 2" question="Which force is responsible?" fixedOrder
          choices={FORCES.map(([id, label]) => ({ id, label, correct: force.force === id, feedback: force.force === id ? force.reason : undefined }))}
          onAnswer={(ok) => { setA2(ok); if (totalSteps === 2) finish([a1, ok]); }} />
      )}
      {a2 !== null && band && totalSteps === 3 && (
        <>
          <div class="notice"><strong>Lifetime bands.</strong> {LIFETIME_CAVEAT}</div>
          <Question label="Step 3" question={<>The <PName id={parent.id} /> lifetime is {fmtLifetime(parent.lifetime_s!)}. Which band is that?</>} fixedOrder
            choices={BANDS.map((b) => ({ id: b.band, label: `${b.band[0].toUpperCase()}${b.band.slice(1)} (${b.typical}; band: ${b.range})`, correct: b.band === band }))}
            onAnswer={(ok) => { setA3(ok); finish([a1, a2, ok]); }} />
        </>
      )}
      {(a3 !== null || (a1 !== null && totalSteps === 1) || (a2 !== null && totalSteps === 2)) && !blitz && (
        <details class="steps-route"><summary>The full ledger</summary><LedgerTable audit={audit} /></details>
      )}
    </div>
  );
}
