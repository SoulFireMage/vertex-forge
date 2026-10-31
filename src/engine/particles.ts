// The particle table: stored particles from PDG, plus antiparticles generated
// here so their quantum numbers can never drift from the particle's.

import data from '../data/particles.json';
import type { Colour, Particle, ParticleRecord } from './types';

export const PDG_EDITION: string = data.edition;
export const PDG_CITATION: string = data.citation;
export const HBAR_MEV_S: number = data.hbar_MeV_s;

const RECORDS = data.particles as ParticleRecord[];

function antiContent(content: string[] | null | undefined): string[] | null | undefined {
  if (!content) return content;
  return content.map((q) => (q.endsWith('bar') ? q.slice(0, -3) : `${q}bar`));
}

function antiColour(c: ParticleRecord['colour']): Colour {
  return c === '3' ? '3bar' : c;
}

/** Negate without producing −0. */
const neg = (x: number) => (x === 0 ? 0 : -x);

function makeAnti(r: ParticleRecord): Particle {
  if (!r.anti_name) throw new Error(`${r.id}: antiparticle needs anti_name`);
  return {
    ...r,
    id: r.antiparticle,
    name: r.anti_name,
    anti_name: r.name,
    charge3: neg(r.charge3),
    baryon3: neg(r.baryon3),
    L_e: neg(r.L_e),
    L_mu: neg(r.L_mu),
    L_tau: neg(r.L_tau),
    S: neg(r.S),
    C: neg(r.C),
    B: neg(r.B),
    T: neg(r.T),
    colour: antiColour(r.colour),
    quark_content: antiContent(r.quark_content),
    antiparticle: r.id,
    isAnti: true,
    base: r.id,
    selfConjugate: false,
  };
}

function build(): Record<string, Particle> {
  const out: Record<string, Particle> = {};
  const add = (p: Particle) => {
    if (out[p.id]) throw new Error(`duplicate particle id ${p.id}`);
    out[p.id] = p;
  };
  for (const r of RECORDS) {
    const self = r.antiparticle === 'self';
    add({ ...r, colour: r.colour, antiparticle: self ? r.id : r.antiparticle, isAnti: false, base: r.id, selfConjugate: self });
    if (!self) add(makeAnti(r));
  }
  return out;
}

export const PARTICLES: Record<string, Particle> = build();
export const PARTICLE_LIST: Particle[] = Object.values(PARTICLES);

export function getParticle(id: string): Particle {
  const p = PARTICLES[id];
  if (!p) throw new Error(`unknown particle "${id}"`);
  return p;
}

export function isFermion(p: Particle): boolean {
  return p.spin2 % 2 === 1;
}
export function isHadron(p: Particle): boolean {
  return p.kind === 'meson' || p.kind === 'baryon';
}
export function isNeutrino(p: Particle): boolean {
  return p.weak_type === 'neutrino';
}
export function isChargedLepton(p: Particle): boolean {
  return p.weak_type === 'charged_lepton';
}
export function isBoson(p: Particle): boolean {
  return p.kind === 'gauge_boson' || p.kind === 'scalar_boson';
}
export function leptonNumber(p: Particle): number {
  return p.L_e + p.L_mu + p.L_tau;
}
