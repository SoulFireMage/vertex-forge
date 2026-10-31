import type { DrillItem } from '../../lib/types';
import ledger from './ledger_audit.json';
import hadron from './hadron_builder.json';
import vertex from './vertex_audit.json';
import decay from './decay_diagnosis.json';
import bridge from './mediator_bridge.json';

export const SEED_DRILLS: DrillItem[] = [...ledger, ...hadron, ...vertex, ...decay, ...bridge] as DrillItem[];
