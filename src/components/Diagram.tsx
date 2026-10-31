// Feynman-style SVG: fermion lines with arrows, wavy γ/W/Z, curly g, dashed h.
// Time runs left to right: legs on the left are incoming, legs on the right outgoing.
// The fermion arrow follows fermion number, so crossing a leg never changes its arrow.

import { getParticle, isFermion } from '../engine';

type Style = 'fermion' | 'wavy' | 'curly' | 'dashed';

export interface Line {
  x1: number; y1: number; x2: number; y2: number;
  style: Style;
  /** Fermions: arrow points from (x1,y1) towards (x2,y2) if true, the other way if false. */
  arrowForward?: boolean;
  label?: string;
  /** Where to put the label: at the (x2,y2) end, or at the middle (internal lines). */
  labelAt?: 'end' | 'mid';
  sub?: string;
}

export function styleOf(id: string): Style {
  const p = getParticle(id);
  if (isFermion(p)) return 'fermion';
  if (p.id === 'gluon') return 'curly';
  if (p.id === 'higgs') return 'dashed';
  return 'wavy';
}

function wavyPath(l: Line, amp = 5, wavelength = 12): string {
  const dx = l.x2 - l.x1;
  const dy = l.y2 - l.y1;
  const len = Math.hypot(dx, dy);
  const ux = dx / len, uy = dy / len, px = -uy, py = ux;
  const steps = Math.max(24, Math.round(len / 2));
  let d = `M${l.x1.toFixed(1)},${l.y1.toFixed(1)}`;
  for (let i = 1; i <= steps; i++) {
    const t = (i / steps) * len;
    const off = amp * Math.sin((2 * Math.PI * t) / wavelength) * Math.min(1, t / 6, (len - t) / 6);
    d += ` L${(l.x1 + ux * t + px * off).toFixed(1)},${(l.y1 + uy * t + py * off).toFixed(1)}`;
  }
  return d;
}

function curlyPath(l: Line, loops?: number, r = 6): string {
  const dx = l.x2 - l.x1;
  const dy = l.y2 - l.y1;
  const len = Math.hypot(dx, dy);
  const ux = dx / len, uy = dy / len, px = -uy, py = ux;
  const n = loops ?? Math.max(3, Math.round(len / 12));
  const steps = n * 24;
  const b = r * 1.1; // > len/(2πn) for typical lengths, so the cycloid loops
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const th = (i / steps) * 2 * Math.PI * n;
    const along = (len * i) / steps - b * Math.sin(th);
    const across = r * (1 - Math.cos(th));
    const x = l.x1 + ux * along + px * across;
    const y = l.y1 + uy * along + py * across;
    d += `${i ? ' L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
  }
  return d;
}

function Arrow({ l }: { l: Line }) {
  const mx = (l.x1 + l.x2) / 2;
  const my = (l.y1 + l.y2) / 2;
  let ang = (Math.atan2(l.y2 - l.y1, l.x2 - l.x1) * 180) / Math.PI;
  if (!l.arrowForward) ang += 180;
  return <path class="arrowhead" d="M-6,-5 L6,0 L-6,5 Z" transform={`translate(${mx.toFixed(1)},${my.toFixed(1)}) rotate(${ang.toFixed(1)})`} />;
}

function Label({ l }: { l: Line }) {
  if (!l.label) return null;
  let x: number, y: number;
  if (l.labelAt === 'mid') {
    const dx = l.x2 - l.x1, dy = l.y2 - l.y1, len = Math.hypot(dx, dy);
    x = (l.x1 + l.x2) / 2 - (dy / len) * 22;
    y = (l.y1 + l.y2) / 2 + (dx / len) * 22;
  } else {
    const dx = l.x2 - l.x1, dy = l.y2 - l.y1, len = Math.hypot(dx, dy);
    x = l.x2 + (dx / len) * 18;
    y = l.y2 + (dy / len) * 18;
  }
  const [base, rest] = splitName(l.label);
  return (
    <text x={x} y={y} class="dlabel" text-anchor="middle" dominant-baseline="middle">
      {base}{rest.sub && <tspan class="dsub" dy="4">{rest.sub}</tspan>}{rest.tail && <tspan dy={rest.sub ? '-4' : '0'}>{rest.tail}</tspan>}
      {l.sub && <tspan class="dchir" dx="2" dy="-7">{l.sub}</tspan>}
    </text>
  );
}

function splitName(name: string): [string, { sub: string; tail: string }] {
  const i = name.indexOf('_');
  if (i < 0) return [name, { sub: '', tail: '' }];
  let j = i + 1;
  while (j < name.length && !/[⁺⁻⁰]/.test(name[j])) j++;
  return [name.slice(0, i), { sub: name.slice(i + 1, j), tail: name.slice(j) }];
}

export function Diagram({ lines, vertices, width = 320, height = 220, label }: { lines: Line[]; vertices: [number, number][]; width?: number; height?: number; label: string }) {
  return (
    <svg class="diagram" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
      {lines.map((l) => (
        <g class={`dline ${l.style}`}>
          {l.style === 'fermion' && <><line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} /><Arrow l={l} /></>}
          {l.style === 'dashed' && <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke-dasharray="7 5" />}
          {l.style === 'wavy' && <path d={wavyPath(l)} />}
          {l.style === 'curly' && <path d={curlyPath(l)} />}
          <Label l={l} />
        </g>
      ))}
      {vertices.map(([x, y]) => <circle class="dvertex" cx={x} cy={y} r={4} />)}
    </svg>
  );
}

// ── Single vertex ───────────────────────────────────────

const SPREAD: Record<number, number[]> = { 1: [0], 2: [-38, 38], 3: [-52, 0, 52], 4: [-62, -21, 21, 62] };

export interface VertexLegView {
  /** The leg as the engine sees it (incoming). */
  particle: string;
  chirality?: 'L' | 'R';
  side: 'in' | 'out';
}

/** Draw a vertex. An 'out' leg is labelled with the antiparticle of its incoming form (crossing). */
export function VertexDiagram({ legs }: { legs: VertexLegView[] }) {
  const cx = 160, cy = 112, R = 78;
  const lefts = legs.filter((l) => l.side === 'in');
  const rights = legs.filter((l) => l.side === 'out');
  const lines: Line[] = [];
  const place = (group: VertexLegView[], left: boolean) => {
    const angs = SPREAD[group.length] ?? [];
    group.forEach((leg, k) => {
      const a = ((left ? 180 - angs[k] : angs[k]) * Math.PI) / 180;
      const x = cx + R * Math.cos(a);
      const y = cy - R * Math.sin(a);
      const p = getParticle(leg.particle);
      const shown = left ? p : getParticle(p.antiparticle);
      // Line drawn from the vertex outwards to the leg end. For an incoming particle (not anti), fermion flow is into the vertex.
      lines.push({
        x1: cx, y1: cy, x2: x, y2: y, style: styleOf(p.id), arrowForward: p.isAnti, label: shown.name, labelAt: 'end', sub: leg.chirality,
      });
    });
  };
  place(lefts, true);
  place(rights, false);
  const desc = `Vertex with ${lefts.length} incoming leg(s): ${lefts.map((l) => getParticle(l.particle).name).join(', ') || 'none'}; ${rights.length} outgoing: ${rights.map((l) => getParticle(getParticle(l.particle).antiparticle).name).join(', ') || 'none'}.`;
  return <Diagram lines={lines} vertices={[[cx, cy]]} label={desc} />;
}

// ── Two-vertex bridge ───────────────────────────────────

export function BridgeDiagram({ left, right, mediator }: { left: { in: string[]; out: string[] }; right: { in: string[]; out: string[] }; mediator: string | null }) {
  const W = 360, H = 230, ax = 125, bx = 235, y = 115, R = 80;
  const lines: Line[] = [];
  const ext = (vx: number, ids: string[], incoming: boolean, angles: number[]) => {
    ids.forEach((id, k) => {
      const a = (angles[k] * Math.PI) / 180;
      const x = vx + R * Math.cos(a);
      const yy = y - R * Math.sin(a);
      const p = getParticle(id);
      // Incoming particle: flow into the vertex (arrow end→vertex, i.e. backwards along vertex→end). Outgoing particle: flow out.
      const intoVertex = incoming ? !p.isAnti : p.isAnti;
      lines.push({ x1: vx, y1: y, x2: x, y2: yy, style: styleOf(id), arrowForward: !intoVertex, label: p.name, labelAt: 'end' });
    });
  };
  // Left vertex: incoming legs on the far left; any outgoing legs go up/down. Right vertex mirrors it.
  const leftAngles = (nIn: number, nOut: number) => ({
    in: (SPREAD[nIn] ?? []).map((d) => 180 - d * 0.9),
    out: nOut === 1 ? [nIn ? 100 : 60] : (SPREAD[nOut] ?? []).map((d) => 90 + d),
  });
  const rightAngles = (nIn: number, nOut: number) => ({
    out: (SPREAD[nOut] ?? []).map((d) => d * 0.9),
    in: nIn === 1 ? [nOut ? 80 : 120] : (SPREAD[nIn] ?? []).map((d) => 90 - d),
  });
  const la = leftAngles(left.in.length, left.out.length);
  const ra = rightAngles(right.in.length, right.out.length);
  ext(ax, left.in, true, la.in);
  ext(ax, left.out, false, la.out);
  ext(bx, right.in, true, ra.in);
  ext(bx, right.out, false, ra.out);
  lines.push({
    x1: ax, y1: y, x2: bx, y2: y,
    style: mediator ? styleOf(mediator) : 'dashed',
    label: mediator ? getParticle(mediator).name : '?',
    labelAt: 'mid',
  });
  return <Diagram lines={lines} vertices={[[ax, y], [bx, y]]} width={W} height={H} label={`Two-vertex diagram; internal line ${mediator ? getParticle(mediator).name : 'unknown'}, running left to right.`} />;
}
