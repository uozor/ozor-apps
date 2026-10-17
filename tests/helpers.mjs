import { test as base, expect } from '@playwright/test';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
export const fx = n => path.join(here, 'fixtures', n);
export const AXE = fs.readFileSync(path.join(here, 'node_modules/axe-core/axe.min.js'), 'utf8');
export const TOOLS = JSON.parse(fs.readFileSync(path.join(here, '..', 'tools.json'), 'utf8')).tools.map(t => t.id);
/* a sparse 600 MB file for "very large file" checks (never actually read into memory if size checks work) */
export function bigFile(name) { const p = path.join(here, 'fixtures', name); if (!fs.existsSync(p)) { const fd = fs.openSync(p, 'w'); fs.ftruncateSync(fd, 600 * 1048576); fs.closeSync(fd); } return p; }
export const test = base.extend({
  errors: async ({ page }, use) => {
    const errs = [];
    page.on('pageerror', e => errs.push('uncaught: ' + e.message));
    page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR_/.test(m.text())) errs.push('console: ' + m.text()); });
    page.on('dialog', d => { errs.push('dialog: ' + d.message()); d.dismiss(); });
    // third-party (AdSense etc.) stubbed so tests are hermetic
    await page.route(u => !/^http:\/\/(localhost|127\.0\.0\.1):8787/.test(u.href), r => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
    await page.addInitScript(() => { window.print = () => { window.__printed = (window.__printed || 0) + 1 }; });
    await use(errs);
    expect(errs, 'console errors / uncaught exceptions').toEqual([]);
  },
});
export { expect };
export async function open(page, slug, q = '') { await page.goto(slug ? `/${slug}/${q}` : `/${q}`); await page.waitForLoadState('load'); }
export async function denyClipboard(page) { await page.evaluate(() => { const n = navigator.clipboard; if (n) { n.writeText = () => Promise.reject(new DOMException('denied', 'NotAllowedError')); n.write = () => Promise.reject(new DOMException('denied', 'NotAllowedError')); } document.execCommand = () => false; }); }
/* field shows an accessible inline error */
export async function expectInvalid(page, sel) {
  const el = page.locator(sel);
  await expect(el).toHaveAttribute('aria-invalid', 'true');
  const ids = (await el.getAttribute('aria-describedby')).split(' ');
  const msgs = await Promise.all(ids.map(i => page.locator('#' + i).textContent().catch(() => '')));
  expect(msgs.join(' ').trim().length).toBeGreaterThan(5);
  const live = await page.locator('#' + ids[ids.length - 1]).getAttribute('aria-live');
  expect(live).toBe('polite');
}
export async function expectValid(page, sel) { await expect(page.locator(sel)).not.toHaveAttribute('aria-invalid', 'true'); }
export async function noBadText(page) { const t = await page.locator('#tool').innerText(); expect(t).not.toMatch(/\bNaN\b|undefined|Infinity|\[object/); }
