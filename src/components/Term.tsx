import { NODE_MAP } from '../data/taxonomy';
import { settings } from '../state/store';

/** A name in the user's chosen register: formal, intuitive, or both side by side. */
export function Dual({ formal, intuitive }: { formal: string; intuitive: string }) {
  const reg = settings.value.register;
  if (reg === 'formal') return <span class="term">{formal}</span>;
  if (reg === 'intuitive') return <span class="term">{intuitive}</span>;
  if (formal === intuitive) return <span class="term">{formal}</span>;
  return (
    <span class="term">
      {formal} <span class="alt">· {intuitive}</span>
    </span>
  );
}

export function Term({ node }: { node: string }) {
  const n = NODE_MAP[node];
  if (!n) return <span>{node}</span>;
  return <Dual formal={n.formal} intuitive={n.intuitive} />;
}

export function termText(node: string): string {
  const n = NODE_MAP[node];
  if (!n) return node;
  const reg = settings.value.register;
  return reg === 'formal' ? n.formal : reg === 'intuitive' ? n.intuitive : `${n.formal} · ${n.intuitive}`;
}

export const REGISTER_LABEL = { formal: 'Formal', dual: 'Both', intuitive: 'Intuitive' } as const;

export function RegisterToggle() {
  const reg = settings.value.register;
  const set = (register: typeof reg) => (settings.value = { ...settings.value, register });
  return (
    <div class="seg" role="group" aria-label="Terminology register">
      {(['formal', 'dual', 'intuitive'] as const).map((r) => (
        <button aria-pressed={reg === r} onClick={() => set(r)} title={r === 'dual' ? 'Show both registers' : r === 'formal' ? 'Show formal names' : 'Show intuitive (ledger) names'}>
          {REGISTER_LABEL[r]}
        </button>
      ))}
    </div>
  );
}

/** Explanation text in the chosen register. */
export function Explanation({ formal, intuitive }: { formal: string; intuitive: string }) {
  const reg = settings.value.register;
  return (
    <div>
      {reg !== 'intuitive' && <p>{reg === 'dual' && <span class="eyebrow">Formal · </span>}{formal}</p>}
      {reg !== 'formal' && <p>{reg === 'dual' && <span class="eyebrow">Intuitive · </span>}{intuitive}</p>}
    </div>
  );
}

/** Two routes through an explanation: the shape (register toggle) and the steps (expander). */
export function TwoRoutes({ formal, intuitive, steps }: { formal: string; intuitive: string; steps: string[] }) {
  return (
    <div>
      <Explanation formal={formal} intuitive={intuitive} />
      {steps.length > 0 && (
        <details class="steps-route">
          <summary>Show the steps</summary>
          <ol>{steps.map((s) => <li>{s}</li>)}</ol>
        </details>
      )}
    </div>
  );
}
