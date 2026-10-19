import { browser } from 'wxt/browser';
import { CONFIG } from '../config';
import { currentBillingEnv, providerIdFor, tierFromExtPay } from '../lib/billing';
import { BUILTIN_UNAVAILABLE, detectBuiltin, runBuiltin, type BuiltinEnv, type BuiltinTask } from '../lib/ai/builtin';
import { callAiProxy, type PlusTask } from '../lib/ai/backend';
import { CONTEXT_MENU, lockMessage, tierAllows, type FeatureId, type Tier } from '../lib/paywall';
import { KEYS, readInstallId, readTier, readUsage, writeSession, writeUsage } from '../lib/storage';
import { pickWebTab, type TabLike } from '../lib/tabs';

interface PageData {
  url?: string;
  title?: string;
  text?: string;
  markdown?: string;
  tables?: string[][][];
  contacts?: { emails: string[]; phones: string[]; links: string[] };
  images?: { alt: string; dataUrl: string }[];
  pdfs?: { name: string; base64: string }[];
  signals?: unknown;
  screenshot?: string;
  crop?: { x: number; y: number; w: number; h: number; dpr: number };
  cancelled?: boolean;
  error?: string;
}

const FEATURE_FOR_ACTION: Record<string, FeatureId> = {
  markdown: 'page-markdown',
  text: 'page-text',
  pdf: 'page-pdf',
  notes: 'page-notes',
  qr: 'page-qr',
  tables: 'table-csv',
  contacts: 'contacts',
  screenshot: 'screenshot',
  area: 'screenshot',
  images: 'send-images',
  pdfs: 'send-pdfs',
  invoice: 'prefill-invoice',
  signals: 'tips',
  summarize: 'ai-summarize',
  rewrite: 'ai-rewrite',
  translate: 'ai-translate',
  'invoice-line': 'ai-invoice-line',
  title: 'ai-title',
  explain: 'ai-explain',
  chat: 'ai-chat',
  'extract-structured': 'ai-extract-structured',
  'draft-email': 'ai-draft-email',
  'draft-quote': 'ai-draft-quote',
  'multi-summary': 'ai-multi-summary',
  'form-fill': 'ai-form-fill',
};

const READ_ACTIONS = new Set(['signals', 'text', 'markdown', 'pdf', 'notes', 'invoice', 'tables', 'contacts', 'images', 'pdfs', 'area', 'ai']);

function browserName(): string {
  const name = import.meta.env.BROWSER || 'chrome';
  return name;
}

function envForBilling() {
  return currentBillingEnv(browserName());
}

async function currentTier(): Promise<Tier> {
  return readTier(envForBilling());
}

async function findTab(preferredId?: number): Promise<TabLike | null> {
  if (preferredId) {
    try {
      const tab = await browser.tabs.get(preferredId);
      if (tab?.url && /^https?:\/\//i.test(tab.url)) return tab;
    } catch { /* the tab may have closed */ }
  }
  const tabs = await browser.tabs.query({});
  return pickWebTab(tabs);
}

async function readPage(tabId: number, action: string): Promise<PageData> {
  await browser.scripting.executeScript({ target: { tabId }, files: ['injected/read-page.js'] as unknown as ['/background.js'] });
  const response = await browser.tabs.sendMessage(tabId, { type: 'gwb-read', action }) as { ok?: boolean; data?: PageData; error?: string } | undefined;
  if (!response?.ok) throw new Error(response?.error || 'GWB Tools could not read that page.');
  return response.data || {};
}

async function capture(tab: TabLike): Promise<string> {
  let windowId = tab.windowId;
  if (typeof windowId !== 'number') windowId = (await browser.windows.getCurrent()).id;
  if (typeof windowId !== 'number') throw new Error('Could not take a screenshot of this tab.');
  const shot = await browser.tabs.captureVisibleTab(windowId, { format: 'png' });
  if (!shot) throw new Error('Could not take a screenshot of this tab.');
  return shot;
}

async function runAction(action: string, preferredId?: number, extra?: { language?: string; documents?: { name: string; text: string }[]; hint?: string }): Promise<PageData> {
  const feature = FEATURE_FOR_ACTION[action];
  const tier = await currentTier();
  if (feature && !tierAllows(tier, feature)) {
    return { error: lockMessage(feature) };
  }
  if (action === 'qr') {
    const tab = await findTab(preferredId);
    if (!tab?.url) return { error: 'Open a normal web page, then open GWB Tools from the toolbar on that page.' };
    return { url: tab.url, title: tab.title || '' };
  }
  if (action === 'screenshot') {
    const tab = await findTab(preferredId);
    if (!tab?.id) return { error: 'Open a normal web page, then open GWB Tools from the toolbar on that page.' };
    return { url: tab.url, title: tab.title, screenshot: await capture(tab) };
  }
  const builtinTasks = new Set(['summarize', 'rewrite', 'translate', 'invoice-line', 'title', 'explain']);
  const plusTasks = new Set(['chat', 'extract-structured', 'draft-email', 'draft-quote', 'multi-summary', 'form-fill']);
  if (builtinTasks.has(action) || plusTasks.has(action) || READ_ACTIONS.has(action)) {
    const tab = await findTab(preferredId);
    if (!tab?.id) return { error: 'Open a normal web page, then open GWB Tools from the toolbar on that page.' };
    let page: PageData = { url: tab.url, title: tab.title || '' };
    if (action !== 'qr') {
      const readAction = builtinTasks.has(action) || plusTasks.has(action) ? 'ai' : action === 'area' ? 'area' : action;
      try {
        page = { ...page, ...(await readPage(tab.id, readAction)) };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (tab.url && /\.pdf($|\?)/i.test(tab.url) && action === 'signals') {
          return { url: tab.url, title: tab.title, signals: { url: tab.url, title: tab.title || '', wordCount: 0, tableCount: 0, imageCount: 0, pdfLinkCount: 0, isPdf: true, looksLikeInvoice: false, selectionLength: 0 } };
        }
        return { error: message.includes('Could not establish connection') ? 'GWB Tools can only read the page you opened it from. Click the toolbar icon while that page is open.' : message };
      }
    }
    if (page.cancelled) return { error: 'Screenshot cancelled.' };
    if (action === 'area' && page.crop) {
      page.screenshot = await capture(tab);
    }
    if (builtinTasks.has(action)) {
      const env = globalThis as unknown as BuiltinEnv;
      const result = await runBuiltin(env, action as BuiltinTask, page.text || '', { language: extra?.language });
      if (!result.ok) return { ...page, error: result.reason || BUILTIN_UNAVAILABLE };
      return { ...page, text: result.text, markdown: result.text };
    }
    if (plusTasks.has(action)) {
      if (browserName() === 'firefox') {
        const current = await browser.permissions.getAll() as { data_collection?: string[] };
        const allowed = 'data_collection' in current && current.data_collection?.includes('websiteContent');
        if (!allowed) return { ...page, error: 'Firefox has not allowed Pro Plus to send the text you chose. Nothing was sent.' };
      }
      const usage = await readUsage();
      const installId = await readInstallId();
      const result = await callAiProxy({
        url: CONFIG.backendUrl,
        task: action as PlusTask,
        content: page.text || '',
        documents: extra?.documents,
        hint: extra?.hint,
        usage,
        limit: CONFIG.plusMonthlyRequestLimit,
        now: new Date(),
        installId,
        allowMock: providerIdFor(envForBilling()) === 'dev',
      });
      if (!result.ok) return { ...page, error: result.error };
      await writeUsage(result.usage);
      return { ...page, text: result.text, markdown: result.text };
    }
    return page;
  }
  return { error: 'Unknown action.' };
}

async function setupMenus() {
  await browser.contextMenus.removeAll();
  browser.contextMenus.create({ id: 'gwb-root', title: 'GWB Tools', contexts: ['page', 'selection', 'link', 'image'] });
  for (const item of CONTEXT_MENU) {
    const broad = item.action === 'qr' || item.action === 'screenshot' || item.action === 'images' || item.action === 'pdfs';
    browser.contextMenus.create({
      id: `gwb-${item.id}`,
      parentId: 'gwb-root',
      title: item.title,
      contexts: broad ? ['page', 'selection', 'link', 'image'] : ['selection', 'page'],
    } as never);
  }
}

async function onMenu(info: { menuItemId: string | number }, tab?: TabLike) {
  const item = CONTEXT_MENU.find((entry) => `gwb-${entry.id}` === info.menuItemId);
  if (!item) return;
  const data = await runAction(item.action, tab?.id);
  await writeSession(KEYS.pending, { action: item.action, data, at: Date.now() });
  await browser.tabs.create({ url: `${browser.runtime.getURL('/panel.html')}#result` });
}

async function refreshExtPay() {
  if (providerIdFor(envForBilling()) !== 'extensionpay') return;
  const { default: ExtPay } = await import('extpay');
  const extpay = ExtPay(CONFIG.extensionPayId);
  extpay.startBackground();
  const user = await extpay.getUser();
  const tier = tierFromExtPay({
    paid: user.paid,
    subscriptionStatus: user.subscriptionStatus ?? null,
    plan: user.plan
      ? { nickname: user.plan.nickname ? String(user.plan.nickname) : null, interval: user.plan.interval }
      : null,
  });
  const { entitlementsFromTier } = await import('../lib/paywall');
  await browser.storage.local.set({ [KEYS.entitlements]: entitlementsFromTier(tier) });
}

export default defineBackground(() => {
  void setupMenus();
  browser.runtime.onInstalled.addListener(() => { void setupMenus(); void refreshExtPay().catch(() => undefined); });
  browser.contextMenus.onClicked.addListener((info, tab) => { void onMenu(info, tab); });
  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    const msg = message as { type?: string; action?: string; tabId?: number; language?: string; documents?: { name: string; text: string }[]; hint?: string };
    if (msg?.type === 'page-action' && msg.action) {
      void runAction(msg.action, msg.tabId, msg)
        .then((data) => sendResponse(data.error ? { ok: false, error: data.error, data } : { ok: true, data }))
        .catch((error: unknown) => sendResponse({ ok: false, error: error instanceof Error ? error.message : String(error) }));
      return true;
    }
    if (msg?.type === 'ai-caps') {
      void detectBuiltin(globalThis as unknown as BuiltinEnv)
        .then((caps) => sendResponse({ ok: true, caps }))
        .catch((error: unknown) => sendResponse({ ok: false, error: error instanceof Error ? error.message : String(error) }));
      return true;
    }
    if (msg?.type === 'open-side') {
      void (async () => {
        if (browser.sidePanel?.open) {
          const win = await browser.windows.getCurrent();
          await browser.sidePanel.open({ windowId: win.id! });
          sendResponse({ ok: true, where: 'sidepanel' });
          return;
        }
        const sidebar = (browser as unknown as { sidebarAction?: { open?: () => Promise<void> } }).sidebarAction;
        if (sidebar?.open) {
          await sidebar.open();
          sendResponse({ ok: true, where: 'sidebar' });
          return;
        }
        await browser.tabs.create({ url: browser.runtime.getURL('/panel.html') });
        sendResponse({ ok: true, where: 'tab' });
      })().catch((error: unknown) => sendResponse({ ok: false, error: error instanceof Error ? error.message : String(error) }));
      return true;
    }
    return undefined;
  });
});
