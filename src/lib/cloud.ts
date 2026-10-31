// Skapi: optional accounts and telemetry sync. Nothing here is required for the
// app to work; every call degrades to local-only. v1 has no shared drill bank.

import type { Skapi } from 'skapi-js';
import { SKAPI_PROJECT_ID, TABLES } from '../config';
import type { UserTelemetry } from './types';

export interface Profile {
  user_id: string;
  email?: string;
  name?: string;
  access_group: number;
}

// Loaded lazily so the SDK stays out of the main bundle until it's needed.
let instance: Promise<Skapi> | null = null;
export function skapi(): Promise<Skapi> {
  if (!instance) instance = import('skapi-js').then(({ Skapi }) => new Skapi(SKAPI_PROJECT_ID));
  return instance;
}

const toProfile = (p: any): Profile | null =>
  p ? { user_id: p.user_id, email: p.email, name: p.name, access_group: Number(p.access_group ?? 0) } : null;

export const errorMessage = (e: unknown) =>
  (e && typeof e === 'object' && 'message' in e ? String((e as any).message) : String(e)) || 'Unknown error';

export async function currentProfile(): Promise<Profile | null> {
  try {
    return toProfile(await (await skapi()).getProfile());
  } catch {
    return null;
  }
}

export async function login(email: string, password: string): Promise<Profile> {
  return toProfile(await (await skapi()).login({ email, password }))!;
}

export async function signup(email: string, password: string, name?: string): Promise<Profile | null> {
  const res = await (await skapi()).signup({ email, password, ...(name ? { name } : {}) }, { login: true });
  return typeof res === 'object' ? toProfile(res) : currentProfile();
}

export async function logout(): Promise<void> {
  await (await skapi()).logout();
}

export async function forgotPassword(email: string): Promise<void> {
  await (await skapi()).forgotPassword({ email });
}

export async function resetPassword(email: string, code: string, new_password: string): Promise<void> {
  await (await skapi()).resetPassword({ email, code, new_password });
}

const telemetryUid = (userId: string) => `vx_telemetry_${userId}`;

async function fetchByUniqueId(unique_id: string): Promise<any | null> {
  try {
    const res = await (await skapi()).getRecords({ unique_id });
    return res?.list?.[0] ?? null;
  } catch (e: any) {
    if (e?.code === 'NOT_EXISTS' || /not.*exist|not found/i.test(errorMessage(e))) return null;
    throw e;
  }
}

export async function pullTelemetry(userId: string): Promise<UserTelemetry | null> {
  const rec = await fetchByUniqueId(telemetryUid(userId));
  return (rec?.data as UserTelemetry) ?? null;
}

let telemetryRecordId: string | null = null;

export async function pushTelemetry(t: UserTelemetry): Promise<void> {
  const unique_id = telemetryUid(t.user_id);
  if (!telemetryRecordId) telemetryRecordId = (await fetchByUniqueId(unique_id))?.record_id ?? null;
  const rec = telemetryRecordId
    ? await (await skapi()).postRecord(t, { record_id: telemetryRecordId })
    : await (await skapi()).postRecord(t, { unique_id, table: { name: TABLES.telemetry, access_group: 'private' } });
  telemetryRecordId = rec.record_id;
}

export function resetTelemetryRecordCache() {
  telemetryRecordId = null;
}
