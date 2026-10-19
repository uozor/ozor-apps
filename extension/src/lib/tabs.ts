export interface TabLike {
  id?: number;
  url?: string;
  title?: string;
  active?: boolean;
  windowId?: number;
}

/** Prefer the active web tab. Tabs without a URL are invisible to us, which is what activeTab does. */
export function pickWebTab<T extends TabLike>(tabs: T[]): T | null {
  const web = tabs.filter((tab) => typeof tab.url === 'string' && /^https?:\/\//i.test(tab.url));
  return web.find((tab) => tab.active) ?? web[web.length - 1] ?? null;
}
