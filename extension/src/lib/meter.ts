export interface Usage {
  period: string;
  count: number;
}

export function periodKey(now: Date): string {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function normalizeUsage(stored: unknown, now: Date): Usage {
  const period = periodKey(now);
  if (stored && typeof stored === 'object' && (stored as Usage).period === period && Number.isFinite((stored as Usage).count)) {
    return { period, count: Math.max(0, Math.floor((stored as Usage).count)) };
  }
  return { period, count: 0 };
}

export function canCharge(usage: Usage | null | undefined, limit: number, now: Date): { allowed: boolean; used: number; remaining: number; limit: number } {
  const current = normalizeUsage(usage, now);
  const used = current.count;
  return { allowed: used < limit, used, remaining: Math.max(0, limit - used), limit };
}

export function charge(usage: Usage | null | undefined, now: Date): Usage {
  const current = normalizeUsage(usage, now);
  return { period: current.period, count: current.count + 1 };
}
