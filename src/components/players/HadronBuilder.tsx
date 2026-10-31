// Hadron Builder (spec §4.2): assemble a hadron from tiles, or name the hadron
// a set of tiles makes. The engine checks colour neutrality, charge and flavour.

import { useMemo, useRef, useState } from 'preact/hooks';
import { analyseContent, formatThirds, getParticle, isContentOf, type ContentAnalysis } from '../../engine';
import { shuffle } from '../../lib/scheduler';
import type { HadronBuildDrill, HadronDrill, HadronNameDrill } from '../../lib/types';
import { NameText, PName } from '../Name';
import { Question } from '../Question';
import type { DrillResult } from '../DrillPlayer';

const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0');
const signedThirds = (n: number) => (n > 0 ? `+${formatThirds(n)}` : formatThirds(n));

function Analysis({ a }: { a: ContentAnalysis }) {
  return (
    <dl class="ref">
      <dt>Colour</dt><dd>{a.colourNeutral ? 'can form a colour singlet' : `cannot be colour-neutral (${a.quarks} quark${a.quarks === 1 ? '' : 's'}, ${a.antiquarks} antiquark${a.antiquarks === 1 ? '' : 's'})`}</dd>
      <dt>Charge</dt><dd>{signedThirds(a.charge3)}</dd>
      <dt>Baryon number</dt><dd>{signedThirds(a.baryon3)}</dd>
      <dt>S, C, B̃, T</dt><dd>{[a.flavour.S, a.flavour.C, a.flavour.B, a.flavour.T].map(signed).join(', ')}</dd>
      <dt>Matches in the table</dt><dd>{a.matches.length ? a.matches.map((m, k) => <>{k > 0 && ', '}<PName id={m} /> <span class="muted">(spin {getParticle(m).spin2 % 2 ? `${getParticle(m).spin2}/2` : getParticle(m).spin2 / 2})</span></>) : 'none'}</dd>
    </dl>
  );
}

function Tile({ id, onClick, disabled }: { id: string; onClick?: () => void; disabled?: boolean }) {
  const p = getParticle(id);
  return (
    <button class={`tile ${p.isAnti ? 'anti' : ''}`} onClick={onClick} disabled={disabled} aria-label={`${p.name}, charge ${formatThirds(p.charge3)}`}>
      <NameText text={p.name} />
      <span class="tile-q">{signedThirds(p.charge3)}</span>
    </button>
  );
}

function Build({ drill, onFinish }: { drill: HadronBuildDrill; onFinish: (r: DrillResult) => void }) {
  const start = useRef(performance.now());
  const pool = useMemo(() => shuffle(drill.tiles.map((t, i) => ({ t, k: i }))), [drill]);
  const [tray, setTray] = useState<{ t: string; k: number }[]>([]);
  const [done, setDone] = useState(false);
  const target = getParticle(drill.hadron);
  const ok = isContentOf(drill.hadron, tray.map((x) => x.t));
  const check = () => {
    setDone(true);
    onFinish({ score: ok ? 1 : 0, ttd_ms: performance.now() - start.current });
  };
  return (
    <div>
      <div class="reaction-box">Build: <PName id={drill.hadron} /> <span class="muted">({target.kind}, charge {signedThirds(target.charge3)})</span></div>
      <div class="eyebrow" style={{ marginTop: '12px' }}>Your hadron</div>
      <div class="tray" aria-label="Your hadron">
        {tray.length === 0 && <span class="muted">Tap tiles to add them here; tap again to remove.</span>}
        {tray.map((x) => <Tile id={x.t} disabled={done} onClick={() => setTray(tray.filter((y) => y.k !== x.k))} />)}
      </div>
      <div class="eyebrow" style={{ marginTop: '10px' }}>Tiles</div>
      <div class="pool">
        {pool.filter((x) => !tray.some((y) => y.k === x.k)).map((x) => (
          <Tile id={x.t} disabled={done || tray.length >= 3} onClick={() => setTray([...tray, x])} />
        ))}
      </div>
      {!done && <button class="btn-primary" disabled={tray.length < 2} onClick={check}>Check</button>}
      {done && (
        <>
          <div class={`notice ${ok ? 'good' : 'bad'}`}>
            {ok ? 'Correct.' : <>Not quite. <PName id={drill.hadron} /> is {target.quark_content!.map((q, k) => <>{k > 0 && ' '}<PName id={q} /></>)}.</>}
          </div>
          <div class="eyebrow">What you built</div>
          <Analysis a={analyseContent(tray.map((x) => x.t))} />
        </>
      )}
    </div>
  );
}

const NOT_HADRON = '__not_hadron__';

function NameIt({ drill, onFinish }: { drill: HadronNameDrill; onFinish: (r: DrillResult) => void }) {
  const start = useRef(performance.now());
  const a = useMemo(() => analyseContent(drill.tiles), [drill]);
  const [done, setDone] = useState(false);
  const choices = useMemo(() => [
    ...drill.options.map((id) => ({ id, label: <PName id={id} />, correct: a.matches.includes(id) })),
    { id: NOT_HADRON, label: 'Not colour-neutral: not a hadron', correct: !a.colourNeutral },
  ], [drill, a]);
  return (
    <div>
      <div class="reaction-box"><div class="pool">{drill.tiles.map((t) => <Tile id={t} disabled />)}</div></div>
      <Question question="Which hadron is this?" choices={choices}
        onAnswer={(ok) => { setDone(true); onFinish({ score: ok ? 1 : 0, ttd_ms: performance.now() - start.current }); }} />
      {done && (
        <>
          {a.matches.length > 1 && <div class="notice">Several states share this quark content; they differ in spin. Any of them counts.</div>}
          <Analysis a={a} />
        </>
      )}
    </div>
  );
}

export function HadronBuilder({ drill, onFinish }: { drill: HadronDrill; onFinish: (r: DrillResult) => void }) {
  return drill.direction === 'build' ? <Build drill={drill} onFinish={onFinish} /> : <NameIt drill={drill} onFinish={onFinish} />;
}
