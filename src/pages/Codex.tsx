import { groupsOfWing, WINGS } from '../data/taxonomy';
import { allDrills } from '../state/store';

export function Codex() {
  const count = (id: string) => allDrills.value.filter((d) => d.taxonomy_nodes.includes(id)).length;
  return (
    <div>
      <div class="eyebrow">The Codex</div>
      <h1>The unified skill tree</h1>
      <p class="muted" style={{ maxWidth: '65ch' }}>
        Every node carries a formal name and an intuitive “ledger” name. Each cites its source; citations still to be checked
        against the book are marked.
      </p>
      {WINGS.map((w) => (
        <section class="panel">
          <div class="eyebrow">Wing {w.numeral} · {w.focus}</div>
          <h2>{w.title}</h2>
          {groupsOfWing(w.id).map((g) => (
            <div style={{ marginBottom: '14px' }}>
              <h3 class="accent">{g.group}</h3>
              {g.nodes.map((n) => (
                <div style={{ padding: '8px 0', borderBottom: '1px solid var(--rule)' }}>
                  <div><strong>{n.formal}</strong> <span class="muted">· <em>{n.intuitive}</em></span> <span class="tag">{count(n.id)} drills</span></div>
                  <div style={{ fontSize: '0.95rem' }}>{n.summary}</div>
                  {n.note && <div class="muted" style={{ fontSize: '0.85rem' }}>Note: {n.note}</div>}
                  <div class="source-line">Source: {n.source}{n.verify ? ' · to be verified' : ''}</div>
                </div>
              ))}
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
