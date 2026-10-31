// Ledger Audit (spec §4.1): mark each account, then give a verdict. All truth from the engine.

import { useMemo, useRef, useState } from 'preact/hooks';
import {
  ACCOUNT_LABELS, ACCOUNT_ORDER, auditReaction, formatThirds, identifyForce, parseReaction,
  type AccountId, type AccountResult, type AuditResult,
} from '../../engine';
import type { LedgerAuditDrill } from '../../lib/types';
import { ReactionText } from '../Name';
import type { DrillResult } from '../DrillPlayer';

type Mark = 'balances' | 'violated' | 'not_checked';

/** The accounts the user marks (spec §4.1). The rest appear in the verdict and the final table. */
export const ASKED: AccountId[] = ['charge', 'baryon', 'lepton', 'L_e', 'L_mu', 'L_tau', 'spin_parity', 'threshold'];

const FORCE_LABEL = { strong: 'strong', electromagnetic: 'electromagnetic', weak: 'weak', forbidden: 'forbidden', unclassified: 'unclassified' } as const;

function fmtValue(a: AccountResult, v: number | undefined): string {
  if (v == null) return '';
  if (a.unit === 'thirds') return formatThirds(v);
  if (a.unit === 'MeV') return v.toFixed(v >= 100 ? 1 : 3);
  return v < 0 ? `−${-v}` : String(v);
}

export function LedgerTable({ audit }: { audit: AuditResult }) {
  return (
    <div class="table-wrap">
      <table class="ledger-table" aria-label="Ledger">
        <thead><tr><th>Account</th><th>Before</th><th>After</th><th>Verdict</th></tr></thead>
        <tbody>
          {audit.accounts.map((a) => (
            <tr class={a.status}>
              <th scope="row">{a.label}</th>
              <td class="num">{fmtValue(a, a.before)}</td>
              <td class="num">{fmtValue(a, a.after)}</td>
              <td>
                <span class={`status ${a.status}`}>{a.status === 'balances' ? '✓ balances' : a.status === 'violated' ? '✗ violated' : '– not checked'}</span>
                <div class="muted detail">{a.detail}</div>
              </td>
            </tr>
          ))}
          <tr class="flavour">
            <th scope="row">Flavour S, C, B̃, T <span class="muted">(never forbids; feeds the force rules)</span></th>
            <td class="num">{audit.flavour.map((f) => f.before).join(', ')}</td>
            <td class="num">{audit.flavour.map((f) => f.after).join(', ')}</td>
            <td>{audit.flavourChanges.length ? `changes: ${audit.flavourChanges.join(', ')}` : 'all conserved'}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function LedgerAudit({ drill, onFinish }: { drill: LedgerAuditDrill; onFinish: (r: DrillResult) => void }) {
  const reaction = useMemo(() => parseReaction(drill.reaction, { sqrt_s_MeV: drill.sqrt_s_MeV, parton: drill.parton }), [drill]);
  const audit = useMemo(() => auditReaction(reaction), [reaction]);
  const force = useMemo(() => identifyForce(reaction, audit), [reaction, audit]);
  const start = useRef(performance.now());
  const [marks, setMarks] = useState<Partial<Record<AccountId, Mark>>>({});
  const [verdict, setVerdict] = useState<string>('');
  const [submitted, setSubmitted] = useState(false);
  const scattering = reaction.initial.length > 1;

  const truth = (id: AccountId): Mark => audit.accounts.find((a) => a.id === id)!.status;
  const allMarked = ASKED.every((id) => marks[id]);
  const verdictOk = verdict === 'allowed' ? audit.allowed : !audit.allowed && audit.violated.includes(verdict as AccountId);

  const submit = () => {
    setSubmitted(true);
    const right = ASKED.filter((id) => marks[id] === truth(id)).length;
    onFinish({ score: 0.6 * (right / ASKED.length) + 0.4 * (verdictOk ? 1 : 0), ttd_ms: performance.now() - start.current });
  };

  return (
    <div>
      <div class="reaction-box">
        <ReactionText initial={reaction.initial} final={reaction.final} />
        {reaction.sqrt_s_MeV != null && <div class="muted mono">√s = {reaction.sqrt_s_MeV} MeV</div>}
        {reaction.parton && <div class="muted mono">parton level</div>}
      </div>
      <div class="accounts" role="group" aria-label="Mark each account">
        {ASKED.map((id) => {
          const opts: Mark[] = id === 'threshold' && scattering ? ['balances', 'violated', 'not_checked'] : ['balances', 'violated'];
          const t = truth(id);
          return (
            <div class={`account-row ${submitted ? (marks[id] === t ? 'right' : 'wrong') : ''}`}>
              <span class="account-name">{ACCOUNT_LABELS[id]}</span>
              <div class="seg" role="group" aria-label={ACCOUNT_LABELS[id]}>
                {opts.map((m) => (
                  <button aria-pressed={marks[id] === m} disabled={submitted} onClick={() => setMarks({ ...marks, [id]: m })}
                    class={submitted && m === t ? 'truth' : ''}>
                    {m === 'balances' ? 'Balances' : m === 'violated' ? 'Violated' : 'No √s given'}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div class="field" style={{ marginTop: '14px' }}>
        <label for={`verdict-${drill.id}`}>Verdict</label>
        <select id={`verdict-${drill.id}`} value={verdict} disabled={submitted} onChange={(e) => setVerdict((e.target as HTMLSelectElement).value)}>
          <option value="">Choose…</option>
          <option value="allowed">Allowed</option>
          {ACCOUNT_ORDER.map((id) => <option value={id}>Forbidden: {ACCOUNT_LABELS[id]}</option>)}
        </select>
      </div>
      {!submitted && <button class="btn-primary" disabled={!allMarked || !verdict} onClick={submit}>Check the ledger</button>}
      {submitted && (
        <>
          <div class={`notice ${verdictOk ? 'good' : 'bad'}`}>
            {audit.allowed
              ? <>Allowed. Dominant force: <strong>{FORCE_LABEL[force.force]}</strong>. {force.reason}</>
              : <>Forbidden. Violated: {audit.violated.map((v) => ACCOUNT_LABELS[v]).join('; ')}. Any of these counts as a correct verdict.</>}
          </div>
          <LedgerTable audit={audit} />
          {audit.notes.concat(force.notes).map((n) => <p class="muted small-note">{n}</p>)}
        </>
      )}
    </div>
  );
}
