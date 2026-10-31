import { BANDS, BAND_EXCEPTIONS, DOMINANT_FORCE_CAVEAT, FORCE_RULES, LIFETIME_CAVEAT, PDG_CITATION, PDG_EDITION, TREE_LEVEL_RULES, getParticle } from '../engine';
import { ACCOUNT_LABELS, ACCOUNT_ORDER } from '../engine/audit';
import { SYMMETRY_VETOES } from '../data/vetoes';
import { NameText } from '../components/Name';

const toc = [
  ['start', 'Start here'],
  ['drills', 'The five drill types'],
  ['conventions', 'Conventions'],
  ['ledger', 'The ledger'],
  ['forces', 'Which force?'],
  ['lifetimes', 'Lifetimes'],
  ['vertices', 'Vertex grammar'],
  ['words', 'Words we avoid'],
  ['bathtub', 'The bathtub link'],
  ['sources', 'Sources & review'],
  ['ratings', 'Ratings & your data'],
] as const;

const jump = (id: string) => (e: Event) => {
  e.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

export function Guide() {
  return (
    <div>
      <div class="eyebrow">Guide</div>
      <h1>How to use the Vertex Forge</h1>
      <p class="muted" style={{ maxWidth: '65ch' }}>A field manual. Read it front to back, or jump to what you need.</p>
      <nav class="panel" aria-label="Guide contents">
        <div class="tags">{toc.map(([id, label]) => <a class="tag" href="#/guide" onClick={jump(id)}>{label}</a>)}</div>
      </nav>

      <section class="panel" id="start">
        <h2>Start here</h2>
        <p>
          Every drill asks a version of one question: does nature allow this, and if so, how? The answer comes from bookkeeping: a list of
          quantities that must be the same before and after, an energy budget, and a short grammar of which particles can meet at a point.
        </p>
        <p>
          You never need to memorise the particle table. Every drill has a <strong>⌗ Particle table</strong> button; open it whenever you need a
          number. The skill being trained is applying the ledger, not recalling it.
        </p>
      </section>

      <section class="panel" id="drills">
        <h2>The five drill types</h2>
        <dl class="ref">
          <dt>Ledger Audit</dt><dd>Mark each account (charge, baryon number, lepton numbers, the half-integer-spin count, the energy threshold) as balancing or violated, then give a verdict. If several accounts fail, naming any of them counts.</dd>
          <dt>Hadron Builder</dt><dd>Build a named hadron from quark tiles, or name what a set of tiles makes. Some quark combinations make more than one hadron (uud is both p and Δ⁺); any of them counts.</dd>
          <dt>Vertex Auditor</dt><dd>Is the drawn vertex a tree-level Standard Model vertex? If not, why not? Some drills add a third step about loops.</dd>
          <dt>Decay Diagnosis</dt><dd>Allowed? Which force? Which lifetime band?</dd>
          <dt>Mediator Bridge</dt><dd>Choose every boson that can run along the internal line of a two-vertex diagram.</dd>
        </dl>
        <p>Every explanation has two routes: the shape of the answer (switch Formal, Both or Intuitive at the top) and the steps (open <em>Show the steps</em>).</p>
      </section>

      <section class="panel" id="conventions">
        <h2>Conventions</h2>
        <ul>
          <li>Masses in MeV/c² (written MeV), lifetimes in seconds. Numbers are from {PDG_EDITION}.</li>
          <li>Electric charge is in units of e and <strong>stored in thirds</strong>, so u = +2, d = −1, e⁻ = −3. Baryon number too: a quark is +1 third. The app adds whole numbers and only shows fractions.</li>
          <li>Flavour signs follow the PDG: S = −1 for the s quark (so K⁺ = us̄ has S = +1), C = +1 for c, B = −1 for b, T = +1 for t. The table writes bottomness as B̃ to keep it apart from baryon number.</li>
          <li>Neutrinos are written in the <strong>flavour basis</strong> (νₑ, ν_μ, ν_τ), so the W joins each charged lepton to its own neutrino. In the mass basis, lepton mixing (the PMNS matrix) appears at that vertex instead.</li>
          <li>The minimal Standard Model has massless neutrinos and no h–ν–ν vertex. Neutrino mass appears only in flagged notes, never as a drill answer.</li>
          <li>Vertices are read with <strong>every leg incoming</strong>: an outgoing particle counts as an incoming antiparticle. The charges on a legal vertex then sum to zero.</li>
          <li>A fermion leg marked L or R names the chirality of the field. The W couples only to left-chiral fields; for an antifermion that means right-handed helicity in the massless limit.</li>
        </ul>
      </section>

      <section class="panel" id="ledger">
        <h2>The ledger</h2>
        <p>The engine checks these accounts in this order. The first one that fails is the headline reason.</p>
        <ol>{ACCOUNT_ORDER.map((id) => <li>{ACCOUNT_LABELS[id]}</li>)}</ol>
        <p>
          The half-integer-spin count is a <em>necessary</em> condition only: the number of half-integer-spin particles must be odd on both sides
          or even on both. Strangeness, charm, bottomness and topness are tallied too, but they never forbid anything; the weak interaction
          changes them. They decide which force is at work.
        </p>
        <p>
          The last account is a curated table, not a computation. A few decays pass every computed account but break a discrete symmetry
          (charge conjugation C, parity P, or CP) or the Landau–Yang theorem. They are copied from the PDG listings, which mark them:
        </p>
        <div class="table-wrap">
          <table class="node-table">
            <thead><tr><th>Decay</th><th>Violates</th><th>PDG limit</th></tr></thead>
            <tbody>{SYMMETRY_VETOES.map((v) => <tr><td>{v.process.replace(/->/, '→')}</td><td>{v.violates.join(', ')}</td><td class="num">{v.limit}</td></tr>)}</tbody>
          </table>
        </div>
      </section>

      <section class="panel" id="forces">
        <h2>Which force?</h2>
        <p>The rules are applied in order; the first that fits decides.</p>
        <ol>{FORCE_RULES.map((r) => <li>{r.text}{r.extension && <div class="muted small-note">Added to the spec: {r.extension}</div>}</li>)}</ol>
        <p class="notice">{DOMINANT_FORCE_CAVEAT}</p>
      </section>

      <section class="panel" id="lifetimes">
        <h2>Lifetimes</h2>
        <dl class="ref">{BANDS.map((b) => <><dt>{b.band}</dt><dd>typically {b.typical}; the app’s band is {b.range}</dd></>)}</dl>
        <p class="notice">{LIFETIME_CAVEAT}</p>
        <ul>{BAND_EXCEPTIONS.map((e) => <li><NameText text={getParticle(e.id).name} />: {e.why}</li>)}</ul>
      </section>

      <section class="panel" id="vertices">
        <h2>Vertex grammar</h2>
        <p>A vertex is a tree-level Standard Model vertex if and only if it matches one of these, in any leg order:</p>
        <div class="table-wrap">
          <table class="node-table">
            <thead><tr><th>Vertex</th><th>Condition</th></tr></thead>
            <tbody>{TREE_LEVEL_RULES.map((r) => <tr><td style={{ whiteSpace: 'nowrap' }}><NameText text={r.vertex} /></td><td>{r.condition}</td></tr>)}</tbody>
          </table>
        </div>
        <p>Never at tree level: γγγ, Zγγ, ZZγ, ZZZ, hγγ, hgg, hZγ, a gluon on a lepton, any neutral boson changing flavour, or a W on a right-chiral field. Some of these happen through loops; some never happen at all.</p>
      </section>

      <section class="panel" id="words">
        <h2>Words we avoid</h2>
        <ul>
          <li>“God particle.”</li>
          <li>“Spin is a spinning ball.” Spin is intrinsic angular momentum; nothing is rotating.</li>
          <li>Virtual particles “borrowing energy or time.”</li>
          <li>“The Higgs gives everything its mass.” Most of the proton’s mass does not come from the Higgs.</li>
          <li>“Right-handed particles don’t feel the weak force.” Right-chiral fields don’t couple to the W, but charged ones do couple to the Z. (Chirality and helicity agree only for massless particles.)</li>
        </ul>
      </section>

      <section class="panel" id="bathtub">
        <h2>The bathtub link</h2>
        <p>
          A conserved charge obeys a continuity equation, ∂ρ/∂t + ∇·j = 0: the amount in any region changes only by the net flow across its
          boundary. That is the Systems Forge’s bathtub law in differential form, and the link is structural, not just a resemblance. Charge,
          baryon number and lepton number are all kept this way. A reaction is a closed boundary drawn round the vertex: whatever went in must come out.
        </p>
      </section>

      <section class="panel" id="sources">
        <h2>Sources & review</h2>
        <p>
          Numbers come from the Particle Data Group, {PDG_CITATION}, through a script that reads PDG’s own database. Concepts are meant to
          follow D. Griffiths, <em>Introduction to Elementary Particles</em>, 2nd revised edition (Wiley-VCH, 2008), but the app has no copy yet,
          so every Griffiths citation is marked “to be verified”.
        </p>
        <p>
          Every drill is tested against the engine: its stated verdict, force and violated accounts must match exactly. Drills carry a
          “not yet expert-reviewed” badge until a physicist checks them.
        </p>
      </section>

      <section class="panel" id="ratings">
        <h2>Ratings & your data</h2>
        <p>
          Ratings use Glicko-2 on the familiar Elo scale (start 1200). Each drill counts as an opponent at its difficulty. Blitz counts a little
          less. Readiness bars use an FSRS-style forgetting curve: a guide to what to revisit, not a memory model.
        </p>
        <p>
          Progress lives in this browser. Signing in (optional) syncs it to a private record only you can read. The app makes no other network
          calls and no AI calls at all.
        </p>
      </section>
    </div>
  );
}
