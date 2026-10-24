import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';
import { CONFIG } from '../../src/config';
import { assertNoApiKey, callAiProxy } from '../../src/lib/ai/backend';
import { BUILTIN_UNAVAILABLE, detectBuiltin, runBuiltin, type BuiltinEnv } from '../../src/lib/ai/builtin';
import { MICROSOFT_ADDONS, SAFARI_PRODUCTS, providerIdFor, tierFromExtPay } from '../../src/lib/billing';
import { tools } from '../../src/lib/catalog';
import { htmlToMarkdown, invoicePrefill, signalsFromDocument } from '../../src/lib/extract';
import { DEFAULT_FAVORITES, isFavorite, resolveFavorites, toggleFavorite } from '../../src/lib/favorites';
import { csvCell } from '../../src/lib/files';
import { canCharge, charge, normalizeUsage, periodKey } from '../../src/lib/meter';
import { FEATURE_TIER, entitlementsFromExtPayUser, tierAllows, tierFromEntitlements, type FeatureId } from '../../src/lib/paywall';
import { searchTools } from '../../src/lib/search';
import { pickWebTab } from '../../src/lib/tabs';
import { detectTips, tipTeaser, visibleTips } from '../../src/lib/tips';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.resolve(here, '../fixtures');

function doc(name: string) {
  const html = readFileSync(path.join(fixtures, name), 'utf8');
  return parseHTML(html).document;
}

function signals(name: string, url = `http://127.0.0.1/${name}`) {
  return signalsFromDocument(doc(name), url, doc(name).title);
}

const NOW = new Date('2026-10-19T12:00:00Z');

describe('favorites', () => {
  it('starts from the five default tools', () => {
    expect(resolveFavorites(undefined)).toEqual([...DEFAULT_FAVORITES]);
    expect(DEFAULT_FAVORITES).toEqual(['invoice', 'pdf-tools', 'image-compress', 'qr-bio', 'sales-tax']);
  });

  it('keeps an explicit empty list and drops unknown ids', () => {
    expect(resolveFavorites([])).toEqual([]);
    expect(resolveFavorites(['invoice', 'nope', 'invoice'])).toEqual(['invoice']);
  });

  it('stars and unstars a known tool', () => {
    const next = toggleFavorite(['invoice'], 'password');
    expect(next).toEqual(['invoice', 'password']);
    expect(isFavorite(next, 'password')).toBe(true);
    expect(toggleFavorite(next, 'password')).toEqual(['invoice']);
    expect(toggleFavorite(['invoice'], 'not-a-tool')).toEqual(['invoice']);
  });
});

describe('search and catalog', () => {
  it('matches the website catalog', () => {
    expect(tools.length).toBeGreaterThanOrEqual(26);
    expect(tools.map((tool) => tool.id)).toContain('sales-tax');
    expect(new Set(tools.map((tool) => tool.id)).size).toBe(tools.length);
  });

  it('finds tools by words and category', () => {
    expect(searchTools('ringtone').map((tool) => tool.id)).toContain('audio');
    expect(searchTools('sales tax').map((tool) => tool.id)).toContain('sales-tax');
    expect(searchTools('', 'Security').every((tool) => tool.category === 'Security')).toBe(true);
    expect(searchTools('', 'Security').map((tool) => tool.id)).toContain('password');
    expect(searchTools('zzzz-not-a-tool')).toEqual([]);
  });
});

describe('tier gates', () => {
  const features = Object.keys(FEATURE_TIER) as FeatureId[];

  it('covers free tools, Pro page and on-device AI, and Pro Plus cloud AI', () => {
    const tiers = new Set(Object.values(FEATURE_TIER));
    expect(tiers).toEqual(new Set(['free', 'pro', 'plus']));
    expect(FEATURE_TIER.tools).toBe('free');
    expect(FEATURE_TIER['ai-summarize']).toBe('pro');
    expect(FEATURE_TIER['ai-chat']).toBe('plus');
    expect(CONFIG.prices.proLifetimeUsd).toBe(4.99);
    expect(CONFIG.prices.plusMonthlyUsd).toBe(6.99);
  });

  it('lets each tier use only its own features and the ones below it', () => {
    for (const feature of features) {
      const need = FEATURE_TIER[feature];
      expect(tierAllows('free', feature)).toBe(need === 'free');
      expect(tierAllows('pro', feature)).toBe(need === 'free' || need === 'pro');
      expect(tierAllows('plus', feature)).toBe(true);
    }
  });

  it('maps ExtensionPay users onto the two products', () => {
    expect(tierFromEntitlements(entitlementsFromExtPayUser(null))).toBe('free');
    expect(tierFromExtPay({ paid: false })).toBe('free');
    expect(tierFromExtPay({ paid: true, plan: { nickname: 'pro', interval: null } })).toBe('pro');
    expect(tierFromExtPay({ paid: true, plan: { nickname: 'pro', interval: 'once' } })).toBe('pro');
    expect(tierFromExtPay({ paid: true })).toBe('pro');
    expect(tierFromExtPay({
      paid: true,
      subscriptionStatus: 'active',
      plan: { nickname: 'plus', interval: 'month' },
    })).toBe('plus');
    expect(tierFromExtPay({
      paid: true,
      subscriptionStatus: 'trialing',
      plan: { nickname: 'plus', interval: 'month' },
    })).toBe('plus');
    expect(tierFromExtPay({
      paid: true,
      subscriptionStatus: 'canceled',
      plan: { nickname: 'plus', interval: 'month' },
    })).toBe('free');
  });
});

describe('billing provider', () => {
  it('stays in test mode until a real ExtensionPay id is live', () => {
    expect(providerIdFor({ mode: 'dev', extensionPayId: 'real-id', browser: 'chrome', edgeBilling: 'extensionpay' })).toBe('dev');
    expect(providerIdFor({ mode: 'live', extensionPayId: 'REPLACE_WITH_EXTENSIONPAY_ID', browser: 'chrome', edgeBilling: 'extensionpay' })).toBe('dev');
    expect(providerIdFor({ mode: 'live', extensionPayId: 'extpay-123', browser: 'chrome', edgeBilling: 'extensionpay' })).toBe('extensionpay');
    expect(providerIdFor({ mode: 'live', extensionPayId: 'extpay-123', browser: 'firefox', edgeBilling: 'extensionpay' })).toBe('extensionpay');
    expect(providerIdFor({ mode: 'live', extensionPayId: 'extpay-123', browser: 'safari', edgeBilling: 'extensionpay' })).toBe('safari-iap');
    expect(providerIdFor({ mode: 'live', extensionPayId: 'extpay-123', browser: 'edge', edgeBilling: 'microsoft-store' })).toBe('microsoft-store');
    expect(providerIdFor({ mode: 'live', extensionPayId: 'extpay-123', browser: 'edge', edgeBilling: 'extensionpay' })).toBe('extensionpay');
    expect(SAFARI_PRODUCTS.pro).toContain('gwbtools.pro');
    expect(MICROSOFT_ADDONS.plus).toContain('plus');
  });
});

describe('tips', () => {
  it('suggests a tool for a table, a long document, and an invoice', () => {
    const table = detectTips(signals('table.html'));
    const long = detectTips(signals('long.html'));
    const invoice = detectTips(signals('invoice.html'));
    const pdf = detectTips(signals('pdf.html'));
    expect(table.map((tip) => tip.id)).toEqual(['table']);
    expect(table[0]?.title).toBe('Export this table');
    expect(long.map((tip) => tip.id)).toEqual(['long']);
    expect(long[0]?.feature).toBe('ai-summarize');
    expect(invoice.map((tip) => tip.id)).toEqual(['invoice']);
    expect(invoice[0]?.toolId).toBe('invoice');
    expect(pdf.map((tip) => tip.id)).toEqual(['pdf']);
    expect(signals('long.html').wordCount).toBeGreaterThanOrEqual(700);
  });

  it('can be dismissed, turned off, and teased on the free tier', () => {
    const tips = detectTips(signals('table.html'));
    expect(visibleTips(tips, { dismissed: ['table'] })).toEqual([]);
    expect(visibleTips(tips, { disabled: true })).toEqual([]);
    expect(tipTeaser(tips)).toBe('Pro tip for this page: Export this table.');
    expect(tipTeaser([])).toBeNull();
  });
});

describe('on-device AI', () => {
  it('skips an unavailable API and uses a ready Prompt API', async () => {
    const env: BuiltinEnv = {
      Summarizer: {
        availability: async () => 'no',
        create: async () => ({ summarize: async () => 'should not run' }),
      },
      LanguageModel: {
        availability: async () => 'readily',
        create: async () => ({ prompt: async () => '  short bullets  ' }),
      },
    };
    const caps = await detectBuiltin(env);
    expect(caps.map((cap) => cap.id)).toEqual(['prompt']);
    expect(caps[0]?.status).toBe('readily');
    const result = await runBuiltin(env, 'summarize', 'Northwind ships widgets.');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.engine).toBe('prompt');
      expect(result.text).toBe('short bullets');
    }
  });

  it('says so when this browser has no built-in model', async () => {
    const result = await runBuiltin({}, 'explain', 'A short contract.');
    expect(result).toEqual({ ok: false, reason: BUILTIN_UNAVAILABLE });
    expect(await detectBuiltin({})).toEqual([]);
  });
});

describe('Pro Plus proxy', () => {
  it('sends only the chosen text and never an API key', async () => {
    let called = 0;
    let body = '';
    let headers: Record<string, string> = {};
    const fetchImpl: typeof fetch = async (_url, init) => {
      called += 1;
      body = String(init?.body || '');
      headers = Object.fromEntries(new Headers(init?.headers).entries());
      return new Response(JSON.stringify({ text: 'server says hi', remaining: 199 }), { status: 200 });
    };
    const result = await callAiProxy({
      url: 'https://proxy.example.test/v1/ai',
      task: 'chat',
      content: 'Hello page',
      documents: [{ name: 'Extra', text: 'Past notes' }],
      usage: { period: '2026-10', count: 3 },
      limit: 200,
      now: NOW,
      installId: 'install-abc',
      allowMock: false,
      fetchImpl,
    });
    expect(called).toBe(1);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.text).toBe('server says hi');
    if (result.ok) expect(result.usage.count).toBe(4);
    const parsed = JSON.parse(body) as { content: string; documents: { text: string }[]; client: string };
    expect(parsed.content).toBe('Hello page');
    expect(parsed.documents[0]?.text).toBe('Past notes');
    expect(parsed.client).toBe('gwb-tools');
    expect(body).not.toMatch(/history|apiKey|sk-/i);
    expect(headers['x-gwb-install']).toBe('install-abc');
    expect(headers.authorization).toBeUndefined();
    expect(() => assertNoApiKey({ 'x-api-key': 'sk-secret' }, '{}')).toThrow(/API key/);
  });

  it('blocks the month limit and mocks a placeholder without calling the network', async () => {
    let called = 0;
    const fetchImpl: typeof fetch = async () => {
      called += 1;
      throw new Error('network should stay idle');
    };
    const blocked = await callAiProxy({
      url: 'https://proxy.example.test/v1/ai',
      task: 'chat',
      content: 'Hello',
      usage: { period: periodKey(NOW), count: 200 },
      limit: 200,
      now: NOW,
      installId: 'install-abc',
      allowMock: false,
      fetchImpl,
    });
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.error).toMatch(/200/);
    expect(canCharge({ period: '2026-09', count: 200 }, 200, NOW).allowed).toBe(true);
    expect(charge({ period: '2026-09', count: 200 }, NOW)).toEqual({ period: '2026-10', count: 1 });

    const mocked = await callAiProxy({
      url: 'https://REPLACE-WITH-YOUR-PROXY.example/v1/ai',
      task: 'chat',
      content: 'Dock notes',
      usage: null,
      limit: 200,
      now: NOW,
      installId: 'install-abc',
      allowMock: true,
      fetchImpl,
    });
    expect(called).toBe(0);
    expect(mocked.ok).toBe(true);
    if (mocked.ok) {
      expect(mocked.mock).toBe(true);
      expect(mocked.text).toMatch(/Mock chat/);
      expect(mocked.usage.count).toBe(1);
    }
  });
});

describe('page text', () => {
  it('turns the sample article into Markdown and a safe CSV cell', () => {
    const article = doc('sample.html').querySelector('#article')!;
    const markdown = htmlToMarkdown(article);
    expect(markdown).toContain('# Dock notes');
    expect(markdown).toContain('**widgets**');
    expect(markdown).toContain('- One crate on the dock.');
    expect(markdown).toContain('[the dock office](https://a.test/dock)');
    expect(csvCell('=1+1')).toBe(`"'=1+1"`);
  });

  it('reads a bill-to line and a price into an invoice', () => {
    const seed = invoicePrefill(doc('invoice.html').querySelector('main')!.textContent || '');
    expect(seed.to).toMatch(/Northwind LLC/);
    expect(seed.items.some((item) => item.d.includes('Widget install') && item.p === 40)).toBe(true);
    expect(seed.items.some((item) => /amount due/i.test(item.d))).toBe(false);
  });
});

describe('tabs and meter', () => {
  it('prefers the active web tab and ignores extension pages', () => {
    const chosen = pickWebTab([
      { url: 'chrome-extension://abc/popup.html', active: true },
      { url: 'http://127.0.0.1/older.html', active: false },
      { url: 'https://example.com/newer.html', active: false },
    ]);
    expect(chosen?.url).toBe('https://example.com/newer.html');
    const active = pickWebTab([
      { url: 'https://example.com/a.html', active: false },
      { url: 'https://example.com/b.html', active: true },
    ]);
    expect(active?.url).toBe('https://example.com/b.html');
  });

  it('resets the counter when the UTC month changes', () => {
    expect(normalizeUsage({ period: '2020-01', count: 9 }, NOW)).toEqual({ period: '2026-10', count: 0 });
    expect(periodKey(NOW)).toBe('2026-10');
  });
});
