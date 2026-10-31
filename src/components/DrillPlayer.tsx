import { useState } from 'preact/hooks';
import type { DrillItem, DrillType } from '../lib/types';
import { Dual, Term, TwoRoutes } from './Term';
import { ParticleDrawer } from './ParticleDrawer';
import { LedgerAudit } from './players/LedgerAudit';
import { HadronBuilder } from './players/HadronBuilder';
import { VertexAudit } from './players/VertexAudit';
import { DecayDiagnosis } from './players/DecayDiagnosis';
import { MediatorBridge } from './players/MediatorBridge';

export interface DrillResult {
  score: number;
  ttd_ms?: number;
}

export const TYPE_LABEL: Record<DrillType, string> = {
  ledger_audit: 'Ledger Audit',
  hadron_builder: 'Hadron Builder',
  vertex_audit: 'Vertex Auditor',
  decay_diagnosis: 'Decay Diagnosis',
  mediator_bridge: 'Mediator Bridge',
};

const HOW_TO: Record<DrillType, string> = {
  ledger_audit: 'Mark every account as balancing or violated, then give a verdict. Charges and baryon numbers are kept in thirds. Open the particle table whenever you need a number: the skill is applying the ledger, not remembering it.',
  hadron_builder: 'Either build the named hadron from the tiles (tap to add, tap again to remove), or name the hadron the tiles make. Some tiles are decoys: wrong flavours, or an antiquark where a quark belongs.',
  vertex_audit: 'Decide whether the drawn vertex is a tree-level Standard Model vertex. Time runs left to right; a leg drawn going out is the antiparticle of the same leg coming in. If it is not legal, say why.',
  decay_diagnosis: 'Three steps: is the decay allowed, which force drives it, and which lifetime band the parent falls in. The lifetime rule of thumb has exceptions, and the drill shows them.',
  mediator_bridge: 'Choose every boson that can run along the internal line. It must make both vertices legal and carry the charge from the left vertex to the right one. More than one can work.',
};

const SEEN_KEY = 'vx.seen_drill_types';
function firstTimeFor(type: string): boolean {
  try {
    const seen: string[] = JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]');
    if (seen.includes(type)) return false;
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen, type]));
    return true;
  } catch {
    return false;
  }
}

function HowTo({ type }: { type: DrillType }) {
  const [open] = useState(() => firstTimeFor(type));
  return (
    <details class="howto" open={open}>
      <summary>How this drill works</summary>
      <p>{HOW_TO[type]} <a href="#/guide">Full guide</a></p>
    </details>
  );
}

export function DrillHeader({ drill }: { drill: DrillItem }) {
  return (
    <div class="drill-head">
      <div>
        <div class="eyebrow">
          {TYPE_LABEL[drill.drill_type]} · difficulty {drill.difficulty_elo}
          {!drill.reviewed && <span class="badge" title="A physicist has not yet checked this drill">not yet expert-reviewed</span>}
        </div>
        <h2 style={{ margin: '4px 0 0' }}><Dual formal={drill.register_tags.formal} intuitive={drill.register_tags.intuitive} /></h2>
      </div>
      <div class="tags">{drill.taxonomy_nodes.map((n) => <span class="tag"><Term node={n} /></span>)}</div>
    </div>
  );
}

interface Props {
  drill: DrillItem;
  onComplete: (r: DrillResult) => void;
  /** Blitz: first step only, no explanation. */
  blitz?: boolean;
}

export function DrillPlayer(props: Props) {
  // Remount per drill so internal state resets cleanly.
  return <Inner key={props.drill.id} {...props} />;
}

function Inner({ drill, onComplete, blitz }: Props) {
  const [done, setDone] = useState(false);
  const finish = (r: DrillResult) => {
    setDone(true);
    onComplete(r);
  };
  return (
    <div>
      <DrillHeader drill={drill} />
      <div class="drill-tools">
        {!blitz && <HowTo type={drill.drill_type} />}
        <ParticleDrawer />
      </div>
      <p class="prompt">{drill.prompt_instruction}</p>
      {drill.drill_type === 'ledger_audit' && <LedgerAudit drill={drill} onFinish={finish} />}
      {drill.drill_type === 'hadron_builder' && <HadronBuilder drill={drill} onFinish={finish} />}
      {drill.drill_type === 'vertex_audit' && <VertexAudit drill={drill} onFinish={finish} blitz={blitz} />}
      {drill.drill_type === 'decay_diagnosis' && <DecayDiagnosis drill={drill} onFinish={finish} blitz={blitz} />}
      {drill.drill_type === 'mediator_bridge' && <MediatorBridge drill={drill} onFinish={finish} />}
      {done && !blitz && (
        <div class="result">
          <hr class="hr" />
          <div class="eyebrow">Anatomy</div>
          <TwoRoutes formal={drill.explanation_formal} intuitive={drill.explanation_intuitive} steps={drill.explanation_steps} />
          <p class="source-line">Source: {drill.source}{drill.verify ? ' · citation still to be verified' : ''}</p>
        </div>
      )}
    </div>
  );
}
