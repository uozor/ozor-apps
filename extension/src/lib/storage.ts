import { browser } from 'wxt/browser';
import { resolveFavorites } from './favorites';
import { providerIdFor, tierFromDev, type BillingEnv } from './billing';
import { tierFromEntitlements, type Entitlements, type Tier } from './paywall';
import { normalizeUsage, type Usage } from './meter';

export const KEYS = {
  favorites: 'favorites',
  devTier: 'devTier',
  entitlements: 'entitlements',
  tipsDisabled: 'tipsDisabled',
  tipsDismissed: 'tipsDismissed',
  plusUsage: 'plusUsage',
  installId: 'installId',
  pending: 'pendingAction',
} as const;

async function readKey<T>(key: string, area: 'sync' | 'local'): Promise<T | undefined> {
  const store = browser.storage[area];
  const data = await store.get(key);
  return data[key] as T | undefined;
}

export async function readFavorites(): Promise<string[]> {
  try {
    const sync = await readKey<unknown>(KEYS.favorites, 'sync');
    if (Array.isArray(sync)) return resolveFavorites(sync);
  } catch {
    /* sync is unavailable in some private windows; local storage is the fallback */
  }
  try {
    const local = await readKey<unknown>(KEYS.favorites, 'local');
    return resolveFavorites(local);
  } catch {
    return resolveFavorites(undefined);
  }
}

export async function writeFavorites(ids: string[]): Promise<void> {
  const list = resolveFavorites(ids);
  try {
    await browser.storage.sync.set({ [KEYS.favorites]: list });
  } catch {
    /* keep the local copy even when sync rejects the write */
  }
  await browser.storage.local.set({ [KEYS.favorites]: list });
}

export async function readLocal<T>(key: string, fallback: T): Promise<T> {
  try {
    const value = await readKey<T>(key, 'local');
    return value === undefined ? fallback : value;
  } catch {
    return fallback;
  }
}

export async function writeLocal(values: Record<string, unknown>): Promise<void> {
  await browser.storage.local.set(values);
}

export async function readTier(env: BillingEnv): Promise<Tier> {
  if (providerIdFor(env) === 'dev') {
    const tier = await readLocal<unknown>(KEYS.devTier, 'free');
    return tierFromDev(tier);
  }
  const entitlements = await readLocal<Entitlements>(KEYS.entitlements, { proLifetime: false, plusActive: false });
  return tierFromEntitlements(entitlements);
}

export async function writeDevTier(tier: Tier): Promise<void> {
  await writeLocal({ [KEYS.devTier]: tier });
}

export async function readUsage(now = new Date()): Promise<Usage> {
  const stored = await readLocal<unknown>(KEYS.plusUsage, null);
  return normalizeUsage(stored, now);
}

export async function writeUsage(usage: Usage): Promise<void> {
  await writeLocal({ [KEYS.plusUsage]: usage });
}

export async function readInstallId(): Promise<string> {
  const existing = await readLocal<string>(KEYS.installId, '');
  if (existing) return existing;
  const created = crypto.randomUUID();
  await writeLocal({ [KEYS.installId]: created });
  return created;
}

export async function readSession<T>(key: string): Promise<T | null> {
  try {
    const data = await browser.storage.session.get(key);
    return (data[key] as T) ?? null;
  } catch {
    return readLocal<T | null>(`session:${key}`, null);
  }
}

export async function writeSession(key: string, value: unknown): Promise<void> {
  try {
    await browser.storage.session.set({ [key]: value });
  } catch {
    await writeLocal({ [`session:${key}`]: value });
  }
}
