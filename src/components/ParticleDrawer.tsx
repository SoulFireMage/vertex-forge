// The Particle Table drawer (spec §7): one tap away in every drill. The drills
// test applying the table, not recalling it.

import { useEffect, useRef, useState } from 'preact/hooks';
import { PARTICLE_LIST, PDG_EDITION, formatThirds, type Particle } from '../engine';
import { NameText } from './Name';

const KIND_ORDER = ['quark', 'lepton', 'gauge_boson', 'scalar_boson', 'meson', 'baryon'];
const KIND_LABEL: Record<string, string> = {
  quark: 'Quarks', lepton: 'Leptons', gauge_boson: 'Gauge bosons', scalar_boson: 'Higgs', meson: 'Mesons', baryon: 'Baryons',
};

const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0');
const signedThirds = (n: number) => (n > 0 ? `+${formatThirds(n)}` : formatThirds(n));

function fmtMass(m: number | null): string {
  if (m == null) return '–';
  if (m === 0) return '0';
  if (m >= 10000) return `${(m / 1000).toFixed(m >= 100000 ? 1 : 2)} GeV`;
  if (m >= 1) return `${m.toFixed(m >= 1000 ? 1 : 3)}`;
  return m.toPrecision(4);
}

function fmtLife(p: Particle): string {
  if (p.lifetime_basis === 'stable') return 'stable';
  if (p.lifetime_s == null) return '–';
  const [mant, exp] = p.lifetime_s.toExponential(2).split('e');
  const e = Number(exp);
  if (e >= -1 && e <= 3) return `${p.lifetime_s.toPrecision(3)} s`;
  const sup = String(e).replace('-', '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(d)]);
  return `${mant}×10${sup} s${p.lifetime_basis === 'from_width' ? '*' : ''}`;
}

function content(p: Particle): string {
  if (p.quark_content) return p.quark_content.map((q) => (q.endsWith('bar') ? `${q[0]}̄` : q)).join('');
  if (p.content_note) return p.content_note.split(' (')[0];
  return '';
}

const colourLabel = (c: string) => (c === '3bar' ? '3̄' : c);

export function ParticleDrawer() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [antis, setAntis] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const needle = q.trim().toLowerCase();
  const rows = PARTICLE_LIST.filter((p) => antis || !p.isAnti).filter(
    (p) => !needle || [p.name, p.id, p.pdg_name, content(p)].join(' ').toLowerCase().includes(needle),
  );

  return (
    <>
      <button class="btn-quiet drawer-toggle" onClick={() => setOpen(true)} aria-haspopup="dialog">⌗ Particle table</button>
      {open && (
        <div class="drawer-backdrop" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div class="drawer" role="dialog" aria-modal="true" aria-label="Particle table">
            <div class="drawer-head">
              <strong>Particle table</strong>
              <button class="btn-quiet" onClick={() => setOpen(false)} aria-label="Close particle table">Close ✕</button>
            </div>
            <div class="btn-row" style={{ marginTop: 0 }}>
              <input ref={input} type="text" placeholder="Search: Λ, kaon, uds…" value={q} onInput={(e) => setQ((e.target as HTMLInputElement).value)} aria-label="Search particles" />
              <label class="check"><input type="checkbox" checked={antis} onChange={() => setAntis(!antis)} /> antiparticles</label>
            </div>
            <div class="table-wrap">
              <table class="ptable">
                <thead>
                  <tr>
                    <th>Name</th><th title="Electric charge (units of e)">Q</th><th title="Baryon number">B</th>
                    <th title="Electron, muon, tau lepton numbers">L<sub>e</sub> L<sub>μ</sub> L<sub>τ</sub></th><th title="Strangeness, charm, bottomness, topness">S C B̃ T</th>
                    <th title="Spin">J</th><th title="Colour representation">Col</th><th>Mass (MeV)</th><th>Lifetime</th><th>Content</th>
                  </tr>
                </thead>
                <tbody>
                  {KIND_ORDER.flatMap((kind) => {
                    const ps = rows.filter((p) => p.kind === kind);
                    if (!ps.length) return [];
                    return [
                      <tr class="group"><td colSpan={10}>{KIND_LABEL[kind]}</td></tr>,
                      ...ps.map((p) => (
                        <tr title={p.note ?? p.source}>
                          <td class="pn"><NameText text={p.name} /></td>
                          <td>{signedThirds(p.charge3)}</td>
                          <td>{signedThirds(p.baryon3)}</td>
                          <td>{[p.L_e, p.L_mu, p.L_tau].map(signed).join(' ')}</td>
                          <td>{[p.S, p.C, p.B, p.T].map(signed).join(' ')}</td>
                          <td>{p.spin2 % 2 ? `${p.spin2}/2` : p.spin2 / 2}</td>
                          <td>{colourLabel(p.colour)}</td>
                          <td>{fmtMass(p.mass_MeV)}</td>
                          <td>{fmtLife(p)}</td>
                          <td>{content(p)}</td>
                        </tr>
                      )),
                    ];
                  })}
                </tbody>
              </table>
            </div>
            <p class="muted" style={{ fontSize: '0.78rem', marginTop: '8px' }}>
              {PDG_EDITION}. B̃ is bottomness (to keep it apart from baryon number B). * lifetime = ħ/Γ from the width. Quark masses are
              scheme-dependent (MS-bar) and never used for thresholds. Neutrinos are massless in the minimal Standard Model. Hover a row for its notes.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
