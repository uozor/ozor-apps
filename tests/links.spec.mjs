// Link audit in the suite: internal links/anchors/tiles/listed URLs (linkcheck.mjs), helper + back-to-top + ?thanks=1, and send-to-phone QR contents.
import { test, expect, open, fx, TOOLS, BASE } from './helpers.mjs';
import { execFileSync } from 'child_process'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)), JSQR = path.join(here, 'node_modules/jsqr/dist/jsQR.js');
const decode = (page, sel) => page.evaluate(async s => { const img = document.querySelector(s); await img.decode(); const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; const x = c.getContext('2d'); x.drawImage(img, 0, 0); const d = x.getImageData(0, 0, c.width, c.height); const r = jsQR(d.data, c.width, c.height); return r && r.data; }, sel);
test('internal link audit: every page, link, #anchor, hub tile, mailto and listed URL resolves', async ({}, ti) => {
  test.skip(ti.project.name !== 'desktop', 'network audit runs once'); test.setTimeout(240000);
  let out = ''; try { out = execFileSync('node', [path.join(here, 'linkcheck.mjs'), BASE], { encoding: 'utf8', timeout: 230000 }); } catch (e) { out = (e.stdout || '') + (e.stderr || ''); }
  expect(out, out).toContain('NO PROBLEMS'); const s = JSON.parse(out.split('\n')[0]); expect(s.pages).toBe(31); expect(s.hubTiles).toBe(TOOLS.length); expect(s.internalLinks).toBeGreaterThan(300);
});
test('helper links open the right tool; every helper link resolves', async ({ page, request, errors }) => {
  await open(page, 'tax-calculator'); await page.click('#gwb-fab'); await expect(page.locator('#gwb-panel')).toBeVisible();
  await page.locator('#gwb-panel .chip', { hasText: 'merge PDFs' }).click(); const a = page.locator('#hlog a', { hasText: 'Open' }).last(); await expect(a).toHaveAttribute('href', /pdf-tools\/(\?|$)/); expect(await a.getAttribute('href')).not.toContain('index.html');
  const hrefs = await page.locator('#gwb-panel a[href]').evaluateAll(x => x.map(e => e.href)); expect(hrefs.length).toBeGreaterThan(0);
  for (const h of new Set(hrefs)) if (h.startsWith(BASE)) expect((await request.get(h)).status(), h).toBe(200);
  await a.click(); await expect(page).toHaveURL(/\/pdf-tools\/(\?|$)/); expect(page.url()).not.toContain('index.html'); await expect(page.locator('h1')).toContainText('PDF');
});
test('hub category filter accepts #cat- and ?cat= without crawlable query links', async ({ page, errors }) => {
  await open(page, '', '#cat-business');
  await expect(page.locator('.chip[data-cat=business]')).toHaveAttribute('aria-pressed', 'true');
  expect(await page.locator('#all .tile[hidden]').count()).toBeGreaterThan(0);
  await expect(page.locator('#all .tile[data-cat=business]').first()).toBeVisible();
  await open(page, '', '?cat=docs#tools');
  await expect(page.locator('.chip[data-cat=docs]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#all .tile[data-cat=docs]').first()).toBeVisible();
  expect(await page.locator('a[href*="?cat="]').count()).toBe(0);
  await open(page, '', '?cat=image#cat-security');
  await expect(page.locator('.chip[data-cat=security]')).toHaveAttribute('aria-pressed', 'true');
});
test('back-to-top returns to the top', async ({ page, errors }) => {
  await open(page, 'sales-tax'); await page.evaluate(() => scrollTo(0, document.body.scrollHeight)); const up = page.locator('#gwb-top'); await expect(up).toBeVisible();
  await up.click(); await expect.poll(() => page.evaluate(() => Math.round(scrollY))).toBeLessThan(5);
});
test('?thanks=1 shows the thank-you message; Dismiss hides it and cleans the URL', async ({ page, errors }) => {
  await open(page, '', '?thanks=1'); const t = page.locator('#thanks'); await expect(t).toBeVisible(); await expect(t).toContainText('Thank you for supporting GWB');
  await page.click('#thanks-x'); await expect(t).toBeHidden(); expect(page.url()).not.toContain('thanks=1');
  await open(page, ''); await expect(t).toBeHidden();
});
test('tip / supporter links point at the right Stripe checkouts on every tool page', async ({ page, errors }) => {
  for (const s of ['tax-calculator', 'audio', 'sales-tax']) { await open(page, s);
    await expect(page.locator('#support')).toHaveAttribute('href', 'https://buy.stripe.com/7sY6oGgJR5Vh3MabNQ3F600');
    await expect(page.locator('#pricing a', { hasText: 'Become a supporter' })).toHaveAttribute('href', 'https://buy.stripe.com/4gM8wOeBJ5VhfuS9FI3F601'); }
});
for (const slug of ['audio', 'barcode-label', 'image-compress']) test(`file send-to-phone QR encodes this tool's URL (${slug})`, async ({ page, errors }) => {
  await page.addInitScript(() => { Object.defineProperty(navigator, 'share', { value: undefined, configurable: true }); Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true }); });
  await open(page, slug); await page.addScriptTag({ path: JSQR });
  if (slug === 'audio') { await page.setInputFiles('#file', fx('tone.wav')); await expect(page.locator('#exp')).toBeEnabled(); await Promise.all([page.waitForEvent('download'), page.click('#exp')]); }
  else if (slug === 'image-compress') { await page.setInputFiles('#f', fx('photo.jpg')); await expect(page.locator('#dl')).toBeVisible({ timeout: 20000 }); }
  else await Promise.all([page.waitForEvent('download'), page.click('#bcsvg')]);
  await page.locator('[data-gwbf-share]').click(); await expect(page.locator('#gwbf-qrimg')).toBeVisible();
  expect(await decode(page, '#gwbf-qrimg')).toBe(new URL(`/${slug}/`, page.url()).href.replace(/index\.html$/, ''));
});
for (const slug of ['tax-calculator', 'sales-tax']) test(`data send-to-phone note QR includes the canonical tool URL (${slug})`, async ({ page, errors }) => {
  await page.addInitScript(() => { Object.defineProperty(navigator, 'share', { value: undefined, configurable: true }); });
  await open(page, slug); await page.addScriptTag({ path: JSQR }); if (slug === 'tax-calculator') await page.click('text=Calculate taxes');
  await page.locator('[data-gwbx-share]').click(); await expect(page.locator('#gwbx-qrimg')).toBeVisible();
  const t = await decode(page, '#gwbx-qrimg'); expect(t).toContain(`Open this tool: https://greaterworldmedia.tech/${slug}/`);
});
