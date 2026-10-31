import { useState } from 'preact/hooks';
import { WINGS } from '../data/taxonomy';
import { allDrills, profile, telemetry } from '../state/store';

const WELCOME_KEY = 'vx.welcome_dismissed';
const readDismissed = () => {
  try {
    return localStorage.getItem(WELCOME_KEY) === '1';
  } catch {
    return false;
  }
};

function Welcome({ onDismiss }: { onDismiss: () => void }) {
  return (
    <section class="panel welcome" aria-label="Start here">
      <div class="drill-head">
        <div class="eyebrow">New here? Start with these three steps</div>
        <button class="btn-quiet" onClick={onDismiss} aria-label="Dismiss welcome">Dismiss ✕</button>
      </div>
      <ol class="steps">
        <li>
          <strong>Audit one decay</strong>
          <span class="muted">Two minutes: check every account for neutron decay, with the particle table open beside you.</span>
          <a class="btn btn-primary" href="#/drill/vx_la_001">First drill</a>
        </li>
        <li>
          <strong>Run a Daily Calibration</strong>
          <span class="muted">Eight mixed drills that map your strengths across all four wings.</span>
          <a class="btn" href="#/calibrate">Calibrate</a>
        </li>
        <li>
          <strong>Read the Guide</strong>
          <span class="muted">The conventions, the force rules and how the lifetime rule of thumb breaks.</span>
          <a class="btn" href="#/guide">Open the Guide</a>
        </li>
      </ol>
    </section>
  );
}

export function Home() {
  const t = telemetry.value;
  const attempts = t.attempt_log.length;
  const [dismissed, setDismissed] = useState(readDismissed);
  const dismiss = () => {
    try {
      localStorage.setItem(WELCOME_KEY, '1');
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };
  return (
    <div>
      {!dismissed && attempts < 10 && <Welcome onDismiss={dismiss} />}
      <section class="panel hero">
        <div class="eyebrow">A trainer for Standard Model bookkeeping</div>
        <h1>Balance every account.</h1>
        <p style={{ maxWidth: '62ch' }}>
          At the level drilled here, the Standard Model behaves like strict double-entry bookkeeping. A process happens only if every
          conserved quantity balances, the energy is there, and every vertex in its diagram is legal. These drills build the reflex of looking
          at a reaction and knowing whether nature allows it, which force carries it, and why.
        </p>
        <div class="btn-row">
          <a class="btn btn-primary" href="#/calibrate">Daily Calibration Run</a>
          <a class="btn" href="#/train">Browse {allDrills.value.length} drills</a>
          <a class="btn" href="#/blitz">Blitz</a>
          <a class="btn btn-quiet" href="#/guide">How it works →</a>
        </div>
        <div class="stats" style={{ marginTop: '22px' }}>
          <div class="stat"><div class="n">{t.global_elo}</div><div class="l">Overall rating</div></div>
          <div class="stat"><div class="n">{attempts}</div><div class="l">Attempts logged</div></div>
        </div>
      </section>

      <section class="panel">
        <h2>The four wings</h2>
        <div class="grid grid-2">
          {WINGS.map((w) => (
            <div>
              <div class="eyebrow">Wing {w.numeral}</div>
              <h3 style={{ margin: '2px 0' }}>{w.title}</h3>
              <p class="muted" style={{ margin: 0 }}>{w.focus}</p>
            </div>
          ))}
        </div>
        <p style={{ marginTop: '16px' }}><a href="#/codex">Open the Codex</a> for every skill node, with its sources.</p>
      </section>

      <p class="muted" style={{ fontSize: '0.9rem' }}>
        Every verdict is computed by a ledger engine from PDG 2026 data, and every drill is tested against it. No drill has been
        expert-reviewed yet; each says so. Progress is saved in this browser.{' '}
        {profile.value ? 'Signed in, so it also syncs to your account.' : <><a href="#/account">Sign in</a> to sync across devices.</>}
      </p>
    </div>
  );
}
