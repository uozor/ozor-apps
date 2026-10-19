import { browser } from 'wxt/browser';
import { websiteUrl } from '../lib/catalog';
import { invoicePrefill } from '../lib/extract';

export interface PageData {
  url?: string;
  title?: string;
  text?: string;
  markdown?: string;
  tables?: string[][][];
  contacts?: { emails: string[]; phones: string[]; links: string[] };
  images?: { alt: string; dataUrl: string }[];
  pdfs?: { name: string; base64: string }[];
  signals?: import('../lib/extract').PageSignals;
  screenshot?: string;
  crop?: { x: number; y: number; w: number; h: number; dpr: number };
  cancelled?: boolean;
  error?: string;
}

/** Firefox shows its own prompt the first time Pro Plus would send page text. */
export async function ensurePlusConsent(): Promise<string | null> {
  if ((import.meta.env.BROWSER || 'chrome') !== 'firefox') return null;
  const current = await browser.permissions.getAll() as { data_collection?: string[] };
  if (!('data_collection' in current)) return 'Update Firefox to use Pro Plus. Nothing was sent.';
  if (current.data_collection?.includes('websiteContent')) return null;
  const granted = await browser.permissions.request({ data_collection: ['websiteContent'] } as never);
  return granted ? null : 'Pro Plus stays off until Firefox is allowed to send the text you chose. Nothing was sent.';
}

export async function runPageAction(action: string, extra?: { language?: string; documents?: { name: string; text: string }[]; hint?: string }): Promise<PageData> {
  const response = await browser.runtime.sendMessage({ type: 'page-action', action, ...extra }) as { ok?: boolean; data?: PageData; error?: string };
  if (!response?.ok) {
    const error = new Error(response?.error || 'Could not use this page.');
    (error as Error & { data?: PageData }).data = response?.data;
    throw error;
  }
  return response.data || {};
}

export async function aiCapabilities(): Promise<{ id: string; status: string }[]> {
  const response = await browser.runtime.sendMessage({ type: 'ai-caps' }) as { ok?: boolean; caps?: { id: string; status: string }[] };
  return response?.caps || [];
}

export async function openLargerView(): Promise<void> {
  await browser.runtime.sendMessage({ type: 'open-side' });
}

export function openTool(id: string, query?: Record<string, string>): void {
  const url = new URL(browser.runtime.getURL(`site/${id}/index.html` as '/panel.html'));
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value) url.searchParams.set(key, value);
    }
  }
  void browser.tabs.create({ url: url.href });
}

export function openWebsite(id?: string): void {
  const url = id ? websiteUrl(id) : 'https://greaterworldmedia.tech/';
  void browser.tabs.create({ url });
}

export function openInvoiceFromText(text: string): void {
  const seed = invoicePrefill(text);
  const query: Record<string, string> = { notes: seed.notes };
  if (seed.to) query.to = seed.to;
  query.gwbitems = JSON.stringify(seed.items);
  openTool('invoice', query);
}

export async function readPending(): Promise<{ action: string; data: PageData } | null> {
  try {
    const data = await browser.storage.session.get('pendingAction');
    const pending = data.pendingAction as { action: string; data: PageData } | undefined;
    if (pending) {
      await browser.storage.session.remove('pendingAction');
      return pending;
    }
  } catch { /* session storage is missing in a few browsers */ }
  const local = await browser.storage.local.get('session:pendingAction');
  const pending = local['session:pendingAction'] as { action: string; data: PageData } | undefined;
  if (pending) await browser.storage.local.remove('session:pendingAction');
  return pending || null;
}
