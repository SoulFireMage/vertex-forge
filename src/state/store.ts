// App state: signals persisted to localStorage, with optional Skapi sync.

import { effect, signal } from '@preact/signals';
import * as cloud from '../lib/cloud';
import { applyOutcome, emptyTelemetry, mergeTelemetry, normaliseTelemetry, type NodeDelta, type Outcome } from '../lib/telemetry';
import type { DrillItem, Settings, UserTelemetry } from '../lib/types';
import { SEED_DRILLS } from '../data/drills';

const KEYS = {
  telemetry: 'vx.telemetry.v1',
  settings: 'vx.settings.v1',
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
  } catch {
    /* storage full or blocked: keep running in memory */
  }
}

// ── Settings ────────────────────────────────────────────

const defaultSettings: Settings = { theme: 'auto', register: 'dual' };

export const settings = signal<Settings>({ ...defaultSettings, ...load<Partial<Settings>>(KEYS.settings, {}) });
effect(() => save(KEYS.settings, settings.value));
export const updateSettings = (patch: Partial<Settings>) => (settings.value = { ...settings.value, ...patch });

effect(() => {
  const t = settings.value.theme;
  const root = document.documentElement;
  if (t === 'auto') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', t);
});

// ── Telemetry ───────────────────────────────────────────

export const telemetry = signal<UserTelemetry>(normaliseTelemetry(load(KEYS.telemetry, null)));
effect(() => save(KEYS.telemetry, telemetry.value));

export const profile = signal<cloud.Profile | null>(null);
export const syncState = signal<{ status: 'off' | 'syncing' | 'synced' | 'error'; message?: string; at?: string }>({ status: 'off' });

let syncTimer: ReturnType<typeof setTimeout> | undefined;
function scheduleSync() {
  if (!profile.value) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => void pushNow(), 4000);
}

async function pushNow() {
  if (!profile.value) return;
  syncState.value = { status: 'syncing' };
  try {
    await cloud.pushTelemetry({ ...telemetry.value, user_id: profile.value.user_id });
    syncState.value = { status: 'synced', at: new Date().toISOString() };
  } catch (e) {
    syncState.value = { status: 'error', message: cloud.errorMessage(e) };
  }
}

/** Pull the cloud copy, merge with local, push the result back. */
export async function syncNow() {
  const p = profile.value;
  if (!p) return;
  syncState.value = { status: 'syncing' };
  try {
    const remoteRaw = await cloud.pullTelemetry(p.user_id);
    const local = telemetry.value;
    telemetry.value = remoteRaw ? mergeTelemetry(local, normaliseTelemetry(remoteRaw, p.user_id), p.user_id) : { ...local, user_id: p.user_id };
    await cloud.pushTelemetry(telemetry.value);
    syncState.value = { status: 'synced', at: new Date().toISOString() };
  } catch (e) {
    syncState.value = { status: 'error', message: cloud.errorMessage(e) };
  }
}

export function recordOutcome(o: Outcome): NodeDelta[] {
  const { telemetry: next, deltas } = applyOutcome(telemetry.value, o);
  telemetry.value = next;
  scheduleSync();
  return deltas;
}

export function resetProgress() {
  telemetry.value = { ...emptyTelemetry(profile.value?.user_id), updated_at: new Date().toISOString() };
  scheduleSync();
}

// ── Accounts ────────────────────────────────────────────

// Skapi is contacted only after someone has signed in on this browser, so a
// logged-out visitor makes no network calls at all (spec §11).
const SIGNED_IN_KEY = 'vx.has_account';
const markSignedIn = (on: boolean) => {
  try {
    if (on) localStorage.setItem(SIGNED_IN_KEY, '1');
    else localStorage.removeItem(SIGNED_IN_KEY);
  } catch {
    /* ignore */
  }
};
const hasSignedIn = () => {
  try {
    return localStorage.getItem(SIGNED_IN_KEY) === '1';
  } catch {
    return false;
  }
};

export async function initAccount() {
  if (!hasSignedIn()) return;
  profile.value = await cloud.currentProfile();
  if (profile.value) await syncNow();
  else markSignedIn(false);
}

export async function loginAndSync(email: string, password: string) {
  profile.value = await cloud.login(email, password);
  markSignedIn(true);
  await syncNow();
}

export async function signupAndSync(email: string, password: string, name?: string) {
  profile.value = await cloud.signup(email, password, name);
  if (profile.value) {
    markSignedIn(true);
    await syncNow();
  }
}

export async function logoutAndKeepLocal() {
  await pushNow();
  await cloud.logout();
  markSignedIn(false);
  cloud.resetTelemetryRecordCache();
  profile.value = null;
  syncState.value = { status: 'off' };
  telemetry.value = { ...telemetry.value, user_id: 'local_anon' };
}

// ── Drills ──────────────────────────────────────────────

export const allDrills = { value: SEED_DRILLS as DrillItem[] };
export const drillById = (id: string) => SEED_DRILLS.find((d) => d.id === id);

// ── Export / import ─────────────────────────────────────

export function exportJson(): string {
  return JSON.stringify({ app: 'vertex-forge', version: 1, exported_at: new Date().toISOString(), telemetry: telemetry.value, settings: settings.value }, null, 2);
}

/** Import merges rather than overwrites, so nothing local is lost. */
export function importJson(text: string) {
  const data = JSON.parse(text);
  const incoming = normaliseTelemetry(data?.telemetry ?? data, telemetry.value.user_id);
  telemetry.value = mergeTelemetry(telemetry.value, incoming, telemetry.value.user_id);
  scheduleSync();
}
