// Mediator Bridge (spec §4.5): pick every boson that can carry the internal line.

import { useMemo, useRef, useState } from 'preact/hooks';
import { MEDIATOR_CANDIDATES, checkBridge, getParticle } from '../../engine';
import type { MediatorBridgeDrill } from '../../lib/types';
import { BridgeDiagram } from '../Diagram';
import { NameText } from '../Name';
import type { DrillResult } from '../DrillPlayer';

export function MediatorBridge({ drill, onFinish }: { drill: MediatorBridgeDrill; onFinish: (r: DrillResult) => void }) {
  const start = useRef(performance.now());
  const checks = useMemo(() => MEDIATOR_CANDIDATES.map((m) => checkBridge(drill.left, drill.right, m)), [drill]);
  const optional = new Set(drill.optional ?? []);
  const required = checks.filter((c) => c.valid && !optional.has(c.mediator)).map((c) => c.mediator);
  const [picked, setPicked] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [shown, setShown] = useState<string | null>(null);

  const toggle = (m: string) => setPicked(picked.includes(m) ? picked.filter((x) => x !== m) : [...picked, m]);
  const check = () => {
    const p = picked.filter((m) => !optional.has(m));
    const inter = p.filter((m) => required.includes(m)).length;
    const union = new Set([...p, ...required]).size;
    setDone(true);
    setShown(required[0] ?? null);
    onFinish({ score: union ? inter / union : 1, ttd_ms: performance.now() - start.current });
  };

  return (
    <div>
      <div class="diagram-wrap"><BridgeDiagram left={drill.left} right={drill.right} mediator={done ? shown : null} /></div>
      <p class="muted small-note">The internal line runs from the left vertex to the right vertex. Choose every boson that makes both vertices legal.</p>
      <div class="chips" role="group" aria-label="Candidate mediators">
        {MEDIATOR_CANDIDATES.map((m) => {
          const c = checks.find((x) => x.mediator === m)!;
          const cls = !done ? '' : c.valid ? (optional.has(m) ? 'optional' : 'correct') : picked.includes(m) ? 'wrong' : 'dim';
          return (
            <button class={`chip ${cls}`} aria-pressed={picked.includes(m)} disabled={done} onClick={() => toggle(m)}>
              <NameText text={getParticle(m).name} />
            </button>
          );
        })}
      </div>
      {!done && <button class="btn-primary" disabled={!picked.length} onClick={check}>Check the bridge</button>}
      {done && (
        <div class="bridge-results">
          {checks.map((c) => (
            <div class={`bridge-row ${c.valid ? 'ok' : 'no'}`}>
              <button class="btn-quiet" disabled={!c.valid} onClick={() => setShown(c.mediator)} title={c.valid ? 'Show in the diagram' : undefined}>
                <NameText text={getParticle(c.mediator).name} />
              </button>
              <span>
                {c.valid ? (optional.has(c.mediator) ? '✓ works (optional here)' : '✓ works') : '✗'}
                {' '}<span class="muted">Left vertex: {c.left.detail} Right vertex: {c.right.detail}</span>
              </span>
            </div>
          ))}
          {drill.optional_note && <p class="muted small-note">{drill.optional_note}</p>}
        </div>
      )}
    </div>
  );
}
