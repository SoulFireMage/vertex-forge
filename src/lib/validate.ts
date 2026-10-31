// Drill validation (spec §8): structure, plus an exact cross-check of every
// stated answer against the engine. Used by the test suite on the seed bank.

import { NODE_MAP } from '../data/taxonomy';
import { CURATED_FACTS } from '../data/curated';
import {
  analyseContent, auditReaction, bandOf, checkVertex, getParticle, identifyForce, isContentOf, legs, parseReaction, validMediators,
} from '../engine';
import type { DrillItem } from './types';

const same = (a: readonly string[], b: readonly string[]) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());

export function validateDrill(d: DrillItem): string[] {
  const errs: string[] = [];
  if (!d || typeof d !== 'object') return ['not an object'];
  if (!/^[a-z0-9_]+$/.test(d.id ?? '')) errs.push('id must be lowercase letters, digits and underscores');
  if (!Array.isArray(d.taxonomy_nodes) || !d.taxonomy_nodes.length) errs.push('taxonomy_nodes must be a non-empty array');
  for (const id of d.taxonomy_nodes ?? []) if (!NODE_MAP[id]) errs.push(`unknown taxonomy node "${id}"`);
  if (!(d.difficulty_elo >= 800 && d.difficulty_elo <= 2000)) errs.push('difficulty_elo must be 800–2000');
  if (!d.register_tags?.formal || !d.register_tags?.intuitive) errs.push('register_tags needs formal and intuitive');
  if (!d.prompt_instruction?.trim()) errs.push('missing prompt_instruction');
  if (!d.explanation_formal?.trim() || !d.explanation_intuitive?.trim()) errs.push('needs both explanations');
  if (!Array.isArray(d.explanation_steps) || d.explanation_steps.length < 2) errs.push('needs at least two explanation_steps');
  if (!d.source?.trim()) errs.push('missing source');
  if (typeof d.reviewed !== 'boolean') errs.push('reviewed must be a boolean');

  try {
    switch (d.drill_type) {
      case 'ledger_audit': {
        const r = parseReaction(d.reaction, { sqrt_s_MeV: d.sqrt_s_MeV, parton: d.parton });
        const a = auditReaction(r);
        if (a.allowed !== d.expected.allowed) errs.push(`engine says allowed=${a.allowed}`);
        if (!same(a.violated, d.expected.violated)) errs.push(`engine violated [${a.violated}] ≠ stated [${d.expected.violated}]`);
        break;
      }
      case 'decay_diagnosis': {
        const r = parseReaction(d.reaction);
        if (r.initial.length !== 1) errs.push('a decay has one initial particle');
        const a = auditReaction(r);
        const f = identifyForce(r, a);
        if (a.allowed !== d.expected.allowed) errs.push(`engine says allowed=${a.allowed}`);
        if (f.force !== d.expected.force) errs.push(`engine force ${f.force} ≠ stated ${d.expected.force}`);
        const t = getParticle(r.initial[0]).lifetime_s;
        const band = t == null ? null : bandOf(t);
        if (band !== d.expected.band) errs.push(`engine band ${band} ≠ stated ${d.expected.band}`);
        break;
      }
      case 'vertex_audit': {
        if (d.legs.length < 3 || d.legs.length > 4) errs.push('a vertex has 3 or 4 legs');
        if (d.layout && d.layout.length !== d.legs.length) errs.push('layout must give one side per leg');
        const v = checkVertex(legs(...d.legs));
        if (v.status !== d.expected.status) errs.push(`engine status ${v.status} ≠ stated ${d.expected.status}`);
        if ((v.reason ?? undefined) !== d.expected.reason) errs.push(`engine reason ${v.reason} ≠ stated ${d.expected.reason}`);
        if (d.loop_fact && !CURATED_FACTS.some((f) => f.id === d.loop_fact)) errs.push(`unknown loop_fact ${d.loop_fact}`);
        break;
      }
      case 'hadron_builder': {
        if (d.direction === 'build') {
          const c = getParticle(d.hadron).quark_content;
          if (!c) errs.push('build target must have a definite quark content (no superposition states)');
          else {
            const pool = [...d.tiles];
            for (const q of c) {
              const i = pool.indexOf(q);
              if (i < 0) errs.push(`tiles lack ${q}`);
              else pool.splice(i, 1);
            }
            if (!pool.length) errs.push('build drills need at least one decoy tile');
            if (!isContentOf(d.hadron, c)) errs.push('internal: content mismatch');
          }
        } else {
          const a = analyseContent(d.tiles);
          if (a.colourNeutral !== d.expected.colour_neutral) errs.push(`engine colour_neutral ${a.colourNeutral}`);
          if (!same(a.matches, d.expected.matches)) errs.push(`engine matches [${a.matches}] ≠ stated [${d.expected.matches}]`);
          for (const m of a.matches) if (!d.options.includes(m)) errs.push(`option list must include the answer ${m}`);
          for (const o of d.options) if (getParticle(o).quark_content === null) errs.push(`superposition state ${o} may not be an option (spec §4.2)`);
        }
        break;
      }
      case 'mediator_bridge': {
        const valid = validMediators(d.left, d.right);
        if (!same(valid, d.expected.valid)) errs.push(`engine valid [${valid}] ≠ stated [${d.expected.valid}]`);
        for (const o of d.optional ?? []) if (!valid.includes(o)) errs.push(`optional mediator ${o} is not engine-valid`);
        if (valid.filter((m) => !(d.optional ?? []).includes(m)).length === 0) errs.push('at least one mediator must be required');
        break;
      }
      default:
        errs.push(`unknown drill_type "${(d as DrillItem).drill_type}"`);
    }
  } catch (e) {
    errs.push(`engine error: ${(e as Error).message}`);
  }
  return errs;
}
