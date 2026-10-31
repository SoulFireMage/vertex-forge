// Vertex Auditor (spec §4.3): is this a tree-level SM vertex? If not, why?
// Optional curated step 3: does it happen through loops?

import { useMemo, useRef, useState } from 'preact/hooks';
import { checkVertex, legs as parseLegs, type VertexReason } from '../../engine';
import { CURATED_FACTS, type CuratedFact } from '../../data/curated';
import { shuffle } from '../../lib/scheduler';
import type { VertexAuditDrill } from '../../lib/types';
import { VertexDiagram, type VertexLegView } from '../Diagram';
import { Question, type Choice } from '../Question';
import type { DrillResult } from '../DrillPlayer';

export const REASON_LABEL: Record<VertexReason, string> = {
  charge_sum: 'The charges don’t balance (with every leg read as incoming, they don’t sum to zero)',
  photon_needs_charge: 'A photon attached to a neutral particle',
  gluon_needs_colour: 'A gluon attached to a colourless particle',
  neutral_flavour_change: 'Flavour changes at a neutral boson',
  chirality: 'Wrong chirality: no such field couples here',
  lepton_family: 'A charged lepton paired with another family’s neutrino',
  higgs_needs_mass: 'A Higgs attached to a massless particle',
  fermion_mismatch: 'The fermion legs don’t pair into a particle and an antiparticle of matching type',
  no_such_coupling: 'No Standard Model coupling joins these legs at tree level',
};

const LOOP_LABEL: Record<CuratedFact['verdict'], string> = {
  occurs_via_loops: 'Yes: it happens through loops',
  forbidden_all_orders: 'No: it vanishes at every order (a symmetry forbids it)',
  forbidden_by_symmetry: 'No: a symmetry or theorem forbids it',
  suppressed_unobservable: 'Only unobservably rarely',
};

function reasonChoices(correct: VertexReason): Choice[] {
  const others = shuffle((Object.keys(REASON_LABEL) as VertexReason[]).filter((r) => r !== correct)).slice(0, 3);
  return [correct, ...others].map((r) => ({ id: r, label: REASON_LABEL[r], correct: r === correct }));
}

export function VertexAudit({ drill, onFinish, blitz }: { drill: VertexAuditDrill; onFinish: (r: DrillResult) => void; blitz?: boolean }) {
  const start = useRef(performance.now());
  const legList = useMemo(() => parseLegs(...drill.legs), [drill]);
  const result = useMemo(() => checkVertex(legList), [legList]);
  const views: VertexLegView[] = useMemo(() => {
    const layout = drill.layout ?? legList.map(() => (Math.random() < 0.5 ? 'in' : 'out'));
    return legList.map((l, i) => ({ particle: l.particle, chirality: l.chirality, side: layout[i] }));
  }, [drill, legList]);
  const fact = drill.loop_fact ? CURATED_FACTS.find((f) => f.id === drill.loop_fact) : undefined;
  const legal = result.status === 'legal';
  const [s1, setS1] = useState<boolean | null>(null);
  const [s2, setS2] = useState<boolean | null>(null);
  const [s3, setS3] = useState<boolean | null>(null);
  const reasons = useMemo(() => (result.reason ? reasonChoices(result.reason) : []), [result]);

  const steps = 1 + (!legal && !blitz ? 1 : 0) + (fact && !blitz ? 1 : 0);
  const finish = (answers: (boolean | null)[]) => {
    const got = answers.filter((x) => x === true).length;
    onFinish({ score: got / steps, ttd_ms: performance.now() - start.current });
  };

  const answer1 = (ok: boolean) => {
    setS1(ok);
    if (steps === 1) finish([ok]);
    else if (legal && !fact) finish([ok]);
  };

  return (
    <div>
      <div class="diagram-wrap"><VertexDiagram legs={views} /></div>
      <p class="muted small-note">Time runs left to right: legs on the left come in, legs on the right go out. Arrows show fermion flow (an arrow against the direction of time is an antiparticle).</p>
      <Question label="Step 1" question="Is this a tree-level Standard Model vertex?" fixedOrder
        choices={[
          { id: 'yes', label: 'Yes', correct: legal, feedback: legal ? `Legal: ${result.rule}. ${result.detail}` : undefined },
          { id: 'no', label: 'No', correct: !legal, feedback: !legal ? result.detail : undefined },
        ]}
        onAnswer={answer1} />
      {s1 !== null && !legal && !blitz && (
        <Question label="Step 2" question="Why not?" choices={reasons}
          onAnswer={(ok) => { setS2(ok); if (!fact) finish([s1, ok]); }} />
      )}
      {s1 !== null && fact && !blitz && (legal || s2 !== null) && (
        <Question label={`Step ${legal ? 2 : 3}`} question="Does it happen at all beyond tree level?"
          choices={(Object.keys(LOOP_LABEL) as CuratedFact['verdict'][]).map((v) => ({
            id: v, label: LOOP_LABEL[v], correct: v === fact.verdict, feedback: v === fact.verdict ? `${fact.statement} (${fact.source})` : undefined,
          }))}
          onAnswer={(ok) => { setS3(ok); finish([s1, s2, ok]); }} />
      )}
      {s1 !== null && result.notes.length > 0 && (s3 !== null || !fact) && result.notes.map((n) => <p class="muted small-note">{n}</p>)}
    </div>
  );
}
