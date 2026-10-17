// shared checks for new tools: exports, send-to-phone fallbacks, recommended links
import { test, expect, open } from './helpers.mjs';
import fs from 'fs'; import { createRequire } from 'module'; const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
export const today = (() => { const d = new Date(), p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; })();
export async function grab(page, sel) { const b = page.locator(sel); await b.scrollIntoViewIfNeeded(); const [dl] = await Promise.all([page.waitForEvent('download'), b.click()]); return { name: dl.suggestedFilename(), buf: fs.readFileSync(await dl.path()) }; }
export const pdfText = b => b.toString('latin1').replace(/\\([()\\])/g, '$1');
export function xlsxRows(buf) { const wb = XLSX.read(buf, { type: 'buffer' }); return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 }); }
export function standardSuite(slug, { stem, fmts, want, setup = async () => {}, xlsxCheck, noteWant = [] }) {
  test.describe(`${slug} exports + share`, () => {
    for (const fmt of fmts) test(`export ${fmt}`, async ({ page, errors }) => {
      await open(page, slug); await setup(page);
      const ff = page.locator('#pricing .price', { hasText: 'Free forever' }); await expect(ff.locator(`[data-gwbx="${fmt}"]`)).toBeVisible();
      const { name, buf } = await grab(page, `#pricing [data-gwbx="${fmt}"]`);
      expect(name).toBe(`gwb-${stem}-${today}.${fmt}`); expect(buf.length).toBeGreaterThan(300);
      let text;
      if (fmt === 'pdf') { expect(buf.subarray(0, 5).toString()).toBe('%PDF-'); text = pdfText(buf); }
      else if (fmt === 'xlsx') { const rows = xlsxRows(buf); expect(String(rows[1][0])).toContain('GWB'); expect(rows[2][0]).toBe('Generated'); text = rows.map(r => r.join(',')).join('\n'); if (xlsxCheck) xlsxCheck(rows); }
      else { text = buf.toString('utf8'); expect(text.charCodeAt(0)).toBe(0xfeff); }
      for (const w of want) expect(text, `${fmt} has "${w}"`).toContain(w);
      await expect(page.locator('#gwbx-st')).toContainText('Saved');
    });
    test('send to phone: share sheet', async ({ page, errors }) => {
      await page.addInitScript(() => { navigator.canShare = () => true; navigator.share = async d => { window.__shared = { text: d.text, files: (d.files || []).map(f => f.name) }; }; });
      await open(page, slug); await setup(page); await page.click('[data-gwbx-share]');
      await expect(page.locator('#gwbx-st')).toContainText('Shared');
      const s = await page.evaluate(() => window.__shared); for (const w of [want[0], ...noteWant]) expect(s.text).toContain(w);
      expect(s.files[0]).toBe(`gwb-${stem}-${today}-note.txt`);
    });
    test('send to phone: QR, copy, .txt fallbacks', async ({ page, errors }) => {
      await page.addInitScript(() => { delete Navigator.prototype.share; delete Navigator.prototype.canShare; });
      await open(page, slug); await setup(page); await page.click('[data-gwbx-share]');
      await expect(page.locator('#gwbx-ph')).toBeVisible();
      await expect(page.locator('#gwbx-qrimg, #gwbx-qrt:has-text("too long")').first()).toBeVisible();
      await page.evaluate(() => { navigator.clipboard.writeText = async t => { window.__clip = t; }; });
      await page.click('[data-gwbx-note="copy"]'); await expect(page.locator('#gwbx-st')).toContainText('Note copied');
      expect(await page.evaluate(() => window.__clip)).toContain(want[0]);
      const { name, buf } = await grab(page, '[data-gwbx-note="txt"]'); expect(name).toBe(`gwb-${stem}-${today}-note.txt`); expect(buf.toString()).toContain('GWB');
    });
    test('recommended tools: sponsored links', async ({ page, errors }) => {
      await open(page, slug); const a = page.locator('section.recs a'); expect(await a.count()).toBeGreaterThanOrEqual(2);
      for (let i = 0; i < await a.count(); i++) { await expect(a.nth(i)).toHaveAttribute('rel', 'sponsored noopener'); await expect(a.nth(i)).toHaveAttribute('target', '_blank'); }
    });
    test('page chrome: helper, back-to-top, tags, SEO', async ({ page, errors }) => {
      await open(page, slug);
      await expect(page.locator('#gwb-fab')).toBeVisible();
      const h = await page.content();
      for (const s of ['impact-site-verification', 'goatcounter', 'adsbygoogle.js', 'application/ld+json', 'FAQPage', 'rel="canonical"', 'og:image']) expect(h, s).toContain(s);
      await expect(page.locator('#h-faq')).toBeVisible();
    });
  });
}
