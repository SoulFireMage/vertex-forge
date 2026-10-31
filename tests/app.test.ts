import { describe, expect, it } from 'vitest';
import { SEED_DRILLS } from '../src/data/drills';
import { NODES, WINGS } from '../src/data/taxonomy';
import { validateDrill } from '../src/lib/validate';
import { glickoUpdate, winProbability } from '../src/lib/rating';
import { nextStability, retrievability } from '../src/lib/memory';
import { applyOutcome, emptyTelemetry, mergeTelemetry } from '../src/lib/telemetry';
import { calibrationQueue } from '../src/lib/scheduler';

describe('seed drill bank', () => {
  it('every drill passes structural validation and matches the engine exactly (spec §8.2)', () => {
    const problems = SEED_DRILLS.flatMap((d) => validateDrill(d).map((e) => `${d.id}: ${e}`));
    expect(problems).toEqual([]);
  });
  it('ids are unique', () => {
    const ids = SEED_DRILLS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('covers all five drill types and all four wings', () => {
    expect(new Set(SEED_DRILLS.map((d) => d.drill_type))).toEqual(new Set(['ledger_audit', 'hadron_builder', 'vertex_audit', 'decay_diagnosis', 'mediator_bridge']));
    const wings = new Set(SEED_DRILLS.flatMap((d) => d.taxonomy_nodes.map((n) => NODES.find((x) => x.id === n)!.wing)));
    expect(wings.size).toBe(4);
  });
  it('no seed drill claims expert review yet', () => {
    expect(SEED_DRILLS.filter((d) => d.reviewed)).toEqual([]);
  });
});

describe('taxonomy', () => {
  it('has four wings and 24 unique nodes, each with a source', () => {
    expect(WINGS).toHaveLength(4);
    expect(NODES).toHaveLength(24);
    expect(new Set(NODES.map((n) => n.id)).size).toBe(24);
    for (const n of NODES) expect(n.source.length, n.id).toBeGreaterThan(3);
  });
  it('every Griffiths citation is marked verify', () => {
    for (const n of NODES) if (/Griffiths/.test(n.source) && !/PDG/.test(n.source)) expect(n.verify, n.id).toBe(true);
    for (const d of SEED_DRILLS) if (/Griffiths/.test(d.source)) expect(d.verify, d.id).toBe(true);
  });
});

describe('Glicko-2', () => {
  it('a win against a weaker opponent raises rating and shrinks RD', () => {
    const r = glickoUpdate({ elo: 1500, rd: 200, vol: 0.06 }, 1400, 1, { opponentRd: 30 });
    expect(r.elo).toBeGreaterThan(1500);
    expect(r.elo).toBeLessThan(1600);
    expect(r.rd).toBeLessThan(200);
  });
  it('a loss lowers rating; weight damps the change', () => {
    const full = glickoUpdate({ elo: 1200, rd: 350, vol: 0.06 }, 1200, 0);
    const half = glickoUpdate({ elo: 1200, rd: 350, vol: 0.06 }, 1200, 0, { weight: 0.5 });
    expect(full.elo).toBeLessThan(1200);
    expect(1200 - half.elo).toBeCloseTo((1200 - full.elo) / 2, 5);
  });
  it('win probability is 0.5 against an equal opponent', () => {
    expect(winProbability(1300, 1300)).toBeCloseTo(0.5, 6);
  });
});

describe('FSRS-lite', () => {
  it('R(S,S) = 0.9', () => {
    expect(retrievability(10, 10)).toBeCloseTo(0.9, 6);
  });
  it('success grows stability, failure shrinks it', () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 86_400_000).toISOString();
    expect(nextStability(5, tenDaysAgo, 1)).toBeGreaterThan(5);
    expect(nextStability(5, tenDaysAgo, 0)).toBeLessThan(5);
  });
});

describe('telemetry', () => {
  it('applies an outcome to every valid node, secondary nodes weighted less', () => {
    const { telemetry, deltas } = applyOutcome(emptyTelemetry(), {
      kind: 'drill', item_id: 'x', nodes: ['qed_vertex', 'crossing', 'not_a_node'], difficulty: 1200, score: 1,
    });
    expect(deltas.map((d) => d.node)).toEqual(['qed_vertex', 'crossing']);
    expect(telemetry.node_mastery.crossing.elo).toBeLessThan(telemetry.node_mastery.qed_vertex.elo);
  });
  it('merge keeps the most recently practised node and unions history', () => {
    const a = applyOutcome(emptyTelemetry(), { kind: 'drill', item_id: 'a', nodes: ['crossing'], difficulty: 1200, score: 1 }, new Date('2026-01-01')).telemetry;
    const b = applyOutcome(emptyTelemetry(), { kind: 'drill', item_id: 'b', nodes: ['crossing'], difficulty: 1200, score: 0 }, new Date('2026-02-01')).telemetry;
    const m = mergeTelemetry(a, b, 'u1');
    expect(m.node_mastery.crossing.elo).toBe(b.node_mastery.crossing.elo);
    expect(m.attempt_log.map((x) => x.item_id)).toEqual(['a', 'b']);
  });
});

describe('scheduler', () => {
  it('builds a calibration queue of distinct drills', () => {
    const q = calibrationQueue(SEED_DRILLS, emptyTelemetry(), 8);
    expect(q).toHaveLength(8);
    expect(new Set(q.map((d) => d.id)).size).toBe(8);
  });
});
