import { chromium, expect, test, type BrowserContext, type Page } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = path.resolve(process.cwd());
const buildDir = path.join(root, '.output', 'chrome-mv3');
const axeFile = path.join(root, 'node_modules', 'axe-core', 'axe.min.js');
const axeSource = fs.readFileSync(axeFile, 'utf8');
const shots = path.join(root, 'store', 'screenshots');
const artifacts = '/opt/cursor/artifacts/screenshots';
const alpha = path.resolve(root, '../tests/fixtures/alpha.png');

let context: BrowserContext;
let extId = '';
let popup: Page;
let web: Page;

function frameImage(pageFile: string, name: string, caption: string, popupFile = '') {
  fs.mkdirSync(shots, { recursive: true });
  fs.mkdirSync(artifacts, { recursive: true });
  const out = path.join(shots, name);
  const args = [path.join(root, 'scripts', 'frame-store.py'), '--page', pageFile, '--caption', caption, '--out', out];
  if (popupFile) args.push('--popup', popupFile);
  const result = spawnSync('python3', args, { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || 'Could not frame the store screenshot.');
  fs.copyFileSync(out, path.join(artifacts, name));
}

async function expectNoHorizontalScroll(page: Page) {
  await page.evaluate(() => window.scrollTo(0, 0));
  const plans = await page.locator('#plans-link').boundingBox();
  const width = page.viewportSize()?.width ?? 0;
  expect(plans, 'Plans link is on screen').toBeTruthy();
  expect(plans!.x).toBeGreaterThanOrEqual(0);
  expect(plans!.x + plans!.width).toBeLessThanOrEqual(width + 1);
  const fit = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(fit.scrollWidth, `horizontal overflow ${fit.scrollWidth} > ${fit.clientWidth}`).toBeLessThanOrEqual(fit.clientWidth);
}

async function expectViewsFit(page: Page) {
  const previous = page.viewportSize();
  await page.setViewportSize({ width: 400, height: 700 });
  try {
    for (const id of ['#view-favorites', '#view-all', '#view-page']) {
      await page.click(id);
      await expectNoHorizontalScroll(page);
    }
  } finally {
    if (previous) await page.setViewportSize(previous);
  }
}

async function framePopup(panel: Page, name: string, caption: string, scrollTo = '', height = 680) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gwb-frame-'));
  const pageFile = path.join(tmp, 'page.png');
  const popFile = path.join(tmp, 'popup.png');
  const stage = await panel.context().newPage();
  await stage.setViewportSize({ width: 1280, height: 800 });
  await stage.setContent(fs.readFileSync(path.join(root, 'store', 'backdrop.html'), 'utf8'), { waitUntil: 'load' });
  await stage.screenshot({ path: pageFile });
  await stage.close();
  const panelPrevious = panel.viewportSize();
  await panel.setViewportSize({ width: 400, height });
  try {
    if (scrollTo) await panel.locator(scrollTo).evaluate((el) => el.scrollIntoView({ block: 'start' }));
    else await panel.evaluate(() => window.scrollTo(0, 0));
    await panel.screenshot({ path: popFile });
  } finally {
    await panel.setViewportSize(panelPrevious || { width: 1280, height: 800 });
  }
  frameImage(pageFile, name, caption, popFile);
}

async function framePage(page: Page, name: string, caption: string) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gwb-frame-'));
  const pageFile = path.join(tmp, 'page.png');
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.screenshot({ path: pageFile });
  frameImage(pageFile, name, caption);
}

async function runAxe(page: Page, inline: boolean) {
  if (inline) await page.addScriptTag({ content: axeSource });
  else await page.addScriptTag({ url: `chrome-extension://${extId}/axe.min.js` });
  const violations: string[] = await page.evaluate(async (sandbox) => {
    const axe = (window as unknown as { axe: { run: (node: Document, options: unknown) => Promise<{ violations: { id: string; help: string; nodes: { target: unknown; any?: { data?: { expectedContrastRatio?: string } }[] }[] }[] }> } }).axe;
    const result = await axe.run(document, { resultTypes: ['violations'] });
    const parse = (value: string) => {
      const match = value.match(/rgba?\(([^)]+)\)/);
      if (!match) return null;
      return match[1].split(',').map((part) => Number(part.trim()));
    };
    const channel = (part: number) => {
      const scaled = part / 255;
      return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
    };
    const lum = (rgb: number[]) => 0.2126 * channel(rgb[0] || 0) + 0.7152 * channel(rgb[1] || 0) + 0.0722 * channel(rgb[2] || 0);
    const ratioOf = (fg: number[], bg: number[]) => {
      const hi = Math.max(lum(fg), lum(bg));
      const lo = Math.min(lum(fg), lum(bg));
      return (hi + 0.05) / (lo + 0.05);
    };
    const background = (el: Element) => {
      let node: Element | null = el;
      while (node) {
        const parts = parse(getComputedStyle(node).backgroundColor);
        if (parts && (parts.length < 4 || (parts[3] ?? 1) > 0.95)) return parts;
        node = node.parentElement;
      }
      return [255, 255, 255];
    };
    const lines: string[] = [];
    for (const item of result.violations) {
      if (sandbox && item.id === 'color-contrast') {
        for (const node of item.nodes) {
          const target = Array.isArray(node.target) ? String(node.target[0]) : '';
          const el = target ? document.querySelector(target) : null;
          const fg = el ? parse(getComputedStyle(el).color) : null;
          const bg = el ? background(el) : null;
          const expected = Number(String(node.any?.[0]?.data?.expectedContrastRatio || '4.5').replace(':1', ''));
          const ratio = fg && bg ? ratioOf(fg, bg) : 0;
          if (!el || ratio + 0.05 < expected) lines.push(`color-contrast ${target} computed ${ratio.toFixed(2)} need ${expected}`);
        }
        continue;
      }
      lines.push(`${item.id} (${item.nodes.length}) ${item.nodes.slice(0, 2).map((node) => JSON.stringify(node.target)).join(' ')} — ${item.help}`);
    }
    return lines;
  }, inline);
  expect(violations, violations.join('\n')).toEqual([]);
}

test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
  if (!fs.existsSync(path.join(buildDir, 'manifest.json'))) {
    throw new Error('Missing .output/chrome-mv3. Build the extension before the browser test.');
  }
  const extDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gwb-ext-'));
  fs.cpSync(buildDir, extDir, { recursive: true });
  const manifestPath = path.join(extDir, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as { host_permissions?: string[] };
  manifest.host_permissions = [...new Set([...(manifest.host_permissions || []), 'http://127.0.0.1/*'])];
  fs.writeFileSync(manifestPath, JSON.stringify(manifest));
  fs.copyFileSync(axeFile, path.join(extDir, 'axe.min.js'));

  context = await chromium.launchPersistentContext(fs.mkdtempSync(path.join(os.tmpdir(), 'gwb-profile-')), {
    headless: false,
    executablePath: chromium.executablePath(),
    viewport: { width: 1280, height: 800 },
    acceptDownloads: true,
    args: [
      `--disable-extensions-except=${extDir}`,
      `--load-extension=${extDir}`,
      '--no-first-run',
      '--no-sandbox',
      '--disable-dev-shm-usage',
    ],
  });

  const deadline = Date.now() + 25000;
  while (Date.now() < deadline) {
    const worker = context.serviceWorkers()[0];
    if (worker) {
      extId = new URL(worker.url()).host;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  if (!extId) throw new Error('The extension service worker did not start.');

  web = context.pages()[0] ?? await context.newPage();
  await web.goto('http://127.0.0.1:8799/table.html');
  popup = await context.newPage();
  await popup.goto(`chrome-extension://${extId}/popup.html`);
  await popup.waitForSelector('#tier-badge');
}, 60000);

test.afterAll(async () => {
  await context?.close();
});

test('popup, tools, three tiers, and page tips', async () => {
  await test.step('axe on the popup', async () => {
    await runAxe(popup, false);
    await popup.emulateMedia({ colorScheme: 'dark' });
    await runAxe(popup, false);
    await popup.click('#view-all');
    await runAxe(popup, false);
    await popup.click('#view-page');
    await expect(popup.locator('#tips-heading')).toBeVisible();
    await runAxe(popup, false);
    await popup.click('#view-favorites');
    await popup.emulateMedia({ colorScheme: 'light' });
  });

  await test.step('favorites persist', async () => {
    await expect(popup.locator('#fav-list [data-tool="invoice"]')).toBeVisible();
    await expect(popup.locator('#tier-badge')).toHaveText('Free');
    await popup.click('#view-all');
    await popup.locator('[data-star="password"]').click();
    await expect(popup.locator('#status')).toContainText('Starred');
    await popup.click('#view-favorites');
    await expect(popup.locator('#fav-list [data-tool="password"]')).toBeVisible();
    await popup.reload();
    await expect(popup.locator('#fav-list [data-tool="password"]')).toBeVisible();

    const panel = await context.newPage();
    await panel.setViewportSize({ width: 400, height: 700 });
    await panel.goto(`chrome-extension://${extId}/panel.html`);
    await expect(panel.locator('#fav-list [data-tool="invoice"]')).toBeVisible();
    await expectViewsFit(popup);
    await popup.click('#view-favorites');
    await expectViewsFit(panel);
    await panel.close();

    await framePopup(popup, '01-favorites.png', 'Favorites stay in this browser.');
    await popup.click('#view-all');
    await popup.locator('#tool-search').fill('invoice');
    await expect(popup.locator('#all-list [data-tool="invoice"]')).toBeVisible();
    await framePopup(popup, '02-all-tools.png', 'Search every tool, then filter by category.', '#all-heading');
  });

  await test.step('search finds the ringtone tool', async () => {
    await popup.click('#view-all');
    await popup.locator('#tool-search').fill('ringtone');
    await expect(popup.locator('#all-list [data-tool="audio"]')).toBeVisible();
    await expect(popup.locator('#all-list')).toContainText('Audio Converter');
    await expect(popup.locator('#result-count')).toContainText('tool');
  });

  await test.step('invoice export, QR, and image compress', async () => {
    await popup.click('#view-favorites');
    const invoicePromise = context.waitForEvent('page');
    await popup.locator('#fav-list [data-open="invoice"]').click();
    const invoice = await invoicePromise;
    await invoice.setViewportSize({ width: 1280, height: 800 });
    await expect(invoice.locator('#doc')).toContainText('Website', { timeout: 20000 });
    await runAxe(invoice, true);
    await framePage(invoice, '04-invoice.png', 'Invoice, estimate, and receipt, ready to send.');
    const csvPromise = invoice.waitForEvent('download');
    await invoice.locator('[data-gwbx="csv"]').click();
    const csv = await csvPromise;
    expect(csv.suggestedFilename()).toContain('gwb-invoice');
    expect(fs.readFileSync((await csv.path())!, 'utf8')).toContain('Website');

    const qrPromise = context.waitForEvent('page');
    await popup.locator('#fav-list [data-open="qr-bio"]').click();
    const qr = await qrPromise;
    await qr.setViewportSize({ width: 1280, height: 800 });
    await qr.locator('#qrtext').fill('https://greaterworldmedia.tech/');
    await qr.getByRole('button', { name: 'Generate QR' }).click();
    await expect(qr.locator('#qr img')).toBeVisible();
    const pngPromise = qr.waitForEvent('download');
    await qr.getByRole('button', { name: 'Download PNG' }).click();
    expect((await pngPromise).suggestedFilename()).toMatch(/\.png$/i);
    await runAxe(qr, true);
    await framePage(qr, '05-qr.png', 'A QR code for a link, logo, or Wi-Fi.');

    const imagePromise = context.waitForEvent('page');
    await popup.locator('#fav-list [data-open="image-compress"]').click();
    const image = await imagePromise;
    await image.setInputFiles('#f', alpha);
    await expect(image.locator('#st')).toContainText('KB', { timeout: 20000 });
    await expect(image.locator('#dl')).toBeVisible();
    await image.locator('#go').click();
    await expect(image.locator('#st')).toContainText('KB');
    await runAxe(image, true);
  });

  await test.step('free tier locks paid actions and teases tips', async () => {
    await web.goto('http://127.0.0.1:8799/sample.html');
    await web.locator('#article').selectText();
    await popup.click('#view-page');
    await expect(popup.locator('#tip-teaser')).toContainText('Export this table', { timeout: 20000 });
    await expect(popup.locator('#act-pdf')).toHaveAttribute('data-locked', 'true');
    await expect(popup.locator('#ai-summarize')).toHaveAttribute('data-locked', 'true');
    await expect(popup.locator('#plus-chat')).toHaveAttribute('data-locked', 'true');
    await popup.locator('#act-pdf').click();
    await expect(popup.locator('#status')).toContainText('Pro feature');

    const expectTip = async (file: string, text: string) => {
      await web.goto(`http://127.0.0.1:8799/${file}`);
      await popup.locator('#scan-page').click();
      await expect(popup.locator('#tip-teaser')).toContainText(text, { timeout: 20000 });
    };
    await expectTip('table.html', 'Export this table');
    await expectTip('long.html', 'Long document');
    await expectTip('invoice.html', 'Looks like an invoice');
    await expectTip('pdf.html', 'PDF on this page');
    await framePopup(popup, '06-plans.png', 'Free, Pro, and Pro Plus.', '#upgrade', 560);
  });

  await test.step('Pro reads only the chosen text on this device', async () => {
    await web.goto('http://127.0.0.1:8799/sample.html');
    await web.locator('#article').selectText();
    await popup.locator('#tier-pro').click();
    await expect(popup.locator('#tier-badge')).toHaveText('Pro');
    await expect(popup.locator('#status')).toContainText('No charge');
    await expect(popup.locator('#act-pdf')).toHaveAttribute('data-locked', 'false');
    await expect(popup.locator('#ai-summarize')).toHaveAttribute('data-locked', 'false');
    await expect(popup.locator('#plus-chat')).toHaveAttribute('data-locked', 'true');
    await popup.locator('#scan-page').click();
    await expect(popup.locator('#tips')).toContainText('Export this table');
    await expect(popup.locator('#status')).toContainText('Page tips are below.');
    await framePopup(popup, '03-this-page.png', 'A relevant tip for the page you are on.', '#tips-heading');
    await popup.locator('#ai-summarize').click();
    await expect(popup.locator('#status')).toContainText('On-device AI is not available');
    await framePopup(popup, '07-ai-summarize.png', 'Summarize a selection on this device.', '#ai-heading');

    await popup.locator('#act-md').click();
    await expect(popup.locator('#md-out')).toHaveValue(/widgets/, { timeout: 20000 });
    await expect(popup.locator('#md-out')).toHaveValue(/Dock notes/);
    await expect(popup.locator('#md-out')).not.toHaveValue(/unselected-marker/);

    await web.locator('#article').selectText();
    const pdfPromise = popup.waitForEvent('download');
    await popup.locator('#act-pdf').click();
    const pdf = fs.readFileSync((await (await pdfPromise).path())!);
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    const pdfText = pdf.toString('latin1').toLowerCase();
    expect(pdfText).toContain('widgets');
    expect(pdfText).not.toContain('unselected-marker');

    const csvPromise = popup.waitForEvent('download');
    await popup.locator('#act-table').click();
    expect(fs.readFileSync((await (await csvPromise).path())!, 'utf8')).toContain('Widget');

    await popup.locator('#act-qr').click();
    await expect(popup.locator('#page-url')).toHaveText('http://127.0.0.1:8799/sample.html');
    await expect(popup.locator('#page-qr')).toBeVisible();

    const panel = await context.newPage();
    await panel.setViewportSize({ width: 1280, height: 800 });
    await panel.goto(`chrome-extension://${extId}/panel.html`);
    await panel.click('#view-page');
    await panel.locator('#scan-page').click();
    await expect(panel.locator('#tips')).toContainText('Export this table', { timeout: 20000 });
    await panel.close();
  });

  await test.step('Pro Plus calls the mock proxy', async () => {
    await popup.bringToFront();
    await popup.locator('#tier-plus').click();
    await expect(popup.locator('#tier-badge')).toHaveText('Pro Plus');
    await expect(popup.locator('#plus-chat')).toHaveAttribute('data-locked', 'false');
    await popup.locator('#plus-chat').click();
    await expect(popup.locator('#md-out')).toHaveValue(/Mock chat/, { timeout: 20000 });
    await expect(popup.locator('#plus-usage')).toContainText('1 of 200');
  });
});
