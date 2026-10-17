// File "Send to phone": Web Share with files (mocked), desktop QR + Download fallback, too-large and error paths, on every file tool.
import { test, expect, open, fx } from './helpers.mjs';
const MIME = { mp3: 'audio/mpeg', wav: 'audio/wav', png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp', pdf: 'application/pdf', svg: 'image/svg+xml', zip: 'application/zip', ico: 'image/x-icon', txt: 'text/plain', html: 'text/html' };
const dlClick = sel => async page => { const [d] = await Promise.all([page.waitForEvent('download'), page.locator(sel).first().click()]); return [d.suggestedFilename()]; };
const viaLinks = async (page, n = 1) => { const l = page.locator('#tool a[download]:visible'); await expect(l).toHaveCount(n, { timeout: 20000 }); return l.evaluateAll(a => a.map(x => x.download)); };
const T = {
  audio: async p => { await p.setInputFiles('#file', fx('tone.wav')); await expect(p.locator('#exp')).toBeEnabled(); return dlClick('#exp')(p); },
  'video-to-mp3': async p => { await p.setInputFiles('#f', fx('clip.mp4')); await expect(p.locator('#go')).toBeEnabled(); await p.click('#go'); return viaLinks(p); },
  'image-compress': async p => { await p.setInputFiles('#f', fx('photo.jpg')); return viaLinks(p); },
  'image-convert': async p => { await p.setInputFiles('#f', [fx('photo.jpg'), fx('alpha.png'), fx('pic.webp')]); await p.selectOption('#to', 'image/png'); await p.click('#go'); await expect(p.locator('#st')).toHaveText('Converted 3 of 3 image(s).'); return viaLinks(p, 3); },
  'pdf-tools': async p => { await p.setInputFiles('#mf', [fx('a.pdf'), fx('b.pdf')]); await p.click('#bm'); return viaLinks(p); },
  'qr-bio': async p => { await expect(p.locator('#qr img')).toHaveCount(1); return dlClick('button:has-text("Download PNG")')(p); },
  policy: dlClick('button:has-text("Download .txt")'),
  'logo-maker': dlClick('#lgzip'),
  'barcode-label': dlClick('#bcsvg'),
};
const mock = (page, mode) => page.addInitScript(m => { window.__shared = []; window.__canAsked = 0;
  if (m === 'none') { try { delete Navigator.prototype.share; delete Navigator.prototype.canShare } catch (_) {} Object.defineProperty(navigator, 'share', { value: undefined, configurable: true }); Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true }); return; }
  Object.defineProperty(navigator, 'canShare', { configurable: true, value: d => { window.__canAsked++; return m !== 'nofiles' && !!(d && d.files && d.files.length && d.files.every(f => f instanceof File)); } });
  Object.defineProperty(navigator, 'share', { configurable: true, value: async d => { if (m === 'abort') throw new DOMException('x', 'AbortError'); if (m === 'deny') throw new DOMException('x', 'NotAllowedError'); window.__shared.push(d.files.map(f => ({ name: f.name, type: f.type, size: f.size }))); } });
}, mode);
const box = p => p.locator('#pricing .gwbf'), send = p => box(p).getByRole('button', { name: 'Send file to phone' });
for (const [slug, make] of Object.entries(T)) test.describe(`${slug} file send-to-phone`, () => {
  test('shares the actual output file (name + type) via Web Share', async ({ page, errors }) => {
    await mock(page, 'ok'); await open(page, slug);
    await expect(box(page)).toBeVisible(); await expect(page.locator('#gwbf-n')).toContainText('No file yet');
    await send(page).click(); await expect(page.locator('#gwbf-st')).toContainText('no file yet'); expect(await page.evaluate(() => window.__shared.length)).toBe(0);
    const names = await make(page); await expect(page.locator('#gwbf-n')).toContainText('Ready to send');
    if (names.length === 1) await expect(page.locator('#gwbf-n')).toContainText(names[0]);
    await send(page).click(); await expect(page.locator('#gwbf-st')).toContainText('Sent');
    const sh = await page.evaluate(() => window.__shared); expect(sh).toHaveLength(1);
    expect(sh[0].map(f => f.name)).toEqual(names);
    for (const f of sh[0]) { expect(f.type).toBe(MIME[f.name.split('.').pop()]); expect(f.size).toBeGreaterThan(0); }
  });
  test('desktop / unsupported: QR to open the tool + Download fallback', async ({ page, errors }) => {
    await mock(page, 'none'); await open(page, slug); const names = await make(page);
    await send(page).click(); const ph = page.locator('#gwbf-ph'); await expect(ph).toBeVisible(); await expect(send(page)).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#gwbf-why')).toContainText('can\u2019t send files straight to your phone'); await expect(page.locator('#gwbf-qrimg')).toBeVisible();
    await expect(page.locator('#gwbf-qrt')).toContainText(`/${slug}/`);
    const got = []; page.on('download', d => got.push(d.suggestedFilename()));
    await ph.getByRole('button', { name: 'Download file' }).click(); await expect.poll(() => got.length).toBe(names.length); expect(got.sort()).toEqual([...names].sort());
    await expect(page.locator('#gwbf-st')).toContainText('Saved');
    expect(await page.evaluate(() => GWB.F.last().items.map(i => i.name))).toEqual(names);
    await send(page).click(); await expect(ph).toBeHidden();
  });
  test('too large to share: clear message, Download offered, nothing shared', async ({ page, errors }) => {
    await mock(page, 'ok'); await open(page, slug); await make(page); await page.evaluate(() => { GWB.F.LIMIT = 10 });
    await send(page).click(); await expect(page.locator('#gwbf-why')).toContainText('too large to send from the browser'); await expect(page.locator('#gwbf-why')).toContainText('limit is');
    await expect(page.locator('#gwbf-ph').getByRole('button', { name: 'Download file' })).toBeVisible(); expect(await page.evaluate(() => window.__shared.length)).toBe(0);
  });
});
test.describe('file share error paths', () => {
  test('canShare says no for files -> fallback panel', async ({ page, errors }) => { await mock(page, 'nofiles'); await open(page, 'barcode-label'); await T['barcode-label'](page); await send(page).click(); await expect(page.locator('#gwbf-qrimg')).toBeVisible(); expect(await page.evaluate(() => window.__canAsked)).toBeGreaterThan(0); });
  test('user cancels the share sheet -> calm message, no panel', async ({ page, errors }) => { await mock(page, 'abort'); await open(page, 'policy'); await T.policy(page); await send(page).click(); await expect(page.locator('#gwbf-st')).toContainText('Sharing cancelled'); await expect(page.locator('#gwbf-ph')).toBeHidden(); });
  test('device refuses the file -> fallback with Download', async ({ page, errors }) => { await mock(page, 'deny'); await open(page, 'qr-bio'); await T['qr-bio'](page); await send(page).click(); await expect(page.locator('#gwbf-why')).toContainText('didn\u2019t accept the file'); });
  test('newest output wins (logo PNG after ZIP); data-note Send to phone still present', async ({ page, errors }) => {
    await mock(page, 'ok'); await open(page, 'logo-maker'); await T['logo-maker'](page); const [n2] = await dlClick('#lgpng')(page);
    await expect(page.locator('#gwbf-n')).toContainText(n2); await send(page).click(); expect((await page.evaluate(() => window.__shared))[0][0]).toMatchObject({ name: n2, type: 'image/png' });
    await expect(page.locator('[data-gwbx-share]')).toBeVisible(); await expect(page.locator('[data-gwbx="pdf"]')).toBeVisible();
  });
  test('data tools do not get the file box', async ({ page, errors }) => { await open(page, 'tax-calculator'); await expect(page.locator('.gwbf')).toHaveCount(0); await expect(page.locator('[data-gwbx-share]')).toBeVisible(); });
});
