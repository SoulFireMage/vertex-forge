// Mediator Bridge (spec §4.5): a tree diagram with two vertices joined by one
// internal line that runs from the left vertex to the right vertex. Every
// candidate boson is checked by building both vertices with all legs incoming.

import { getParticle } from './particles';
import { checkVertex } from './vertex';
import type { VertexResult } from './types';

export interface BridgeSide {
  in: string[];
  out: string[];
}

export const MEDIATOR_CANDIDATES = ['photon', 'gluon', 'w_plus', 'w_minus', 'z0', 'higgs'] as const;

export interface BridgeCheck {
  mediator: string;
  valid: boolean;
  left: VertexResult;
  right: VertexResult;
}

const anti = (id: string) => getParticle(id).antiparticle;

/** Legs of a vertex as the engine sees them: incoming as-is, outgoing crossed to incoming antiparticles. */
export function incomingLegs(side: BridgeSide, internalIncoming: string): string[] {
  return [...side.in, ...side.out.map(anti), internalIncoming];
}

export function checkBridge(left: BridgeSide, right: BridgeSide, mediator: string): BridgeCheck {
  // The line leaves the left vertex (so it is an incoming antiparticle there) and enters the right one.
  const l = checkVertex(incomingLegs(left, anti(mediator)).map((particle) => ({ particle })));
  const r = checkVertex(incomingLegs(right, mediator).map((particle) => ({ particle })));
  return { mediator, valid: l.status === 'legal' && r.status === 'legal', left: l, right: r };
}

export function validMediators(left: BridgeSide, right: BridgeSide): string[] {
  return MEDIATOR_CANDIDATES.filter((m) => checkBridge(left, right, m).valid);
}
