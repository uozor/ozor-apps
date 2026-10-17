import { test, expect, open } from './helpers.mjs';
import fs from 'fs'; import { createRequire } from 'module'; const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
const today = (() => { const d = new Date(), p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; })();
// slug -> [file stem, formats, expected strings (in every format), setup]
const CASES = {
  'tax-calculator': ['tax-estimate-2026', ['pdf', 'xlsx', 'csv'], ['US Income Tax Estimate', 'Take-home pay', 'Tax year 2026, estimates only, not tax advice'], async p => { await p.fill('#sal', '100000'); await expect(p.locator('#res')).toContainText('$79,180.00'); }],
  'biz-calc': ['business-calculations', ['pdf', 'xlsx', 'csv'], ['Business Calculations', 'Monthly payment', 'Break-even']],
  'meeting-cost': ['meeting-cost', ['pdf', 'xlsx', 'csv'], ['Meeting Cost Estimate', 'Planned meeting cost']],
  'invoice': ['invoice', ['pdf', 'xlsx', 'csv'], ['Website design', 'Subtotal', 'Total']],
  'word-counter': ['word-count', ['pdf', 'xlsx', 'csv'], ['Word & Character Count Report', 'Words', 'Top keywords']],
  'color-palette': ['color-palette', ['pdf', 'xlsx', 'csv'], ['Color Palette', 'Hex', '--color-1']],
  'business-name': ['business-names', ['pdf', 'xlsx', 'csv'], ['Business Name Ideas', 'Name idea']],
  'resume': ['resume-bullets', ['pdf', 'xlsx'], ['Improved Resume Bullets', 'customer emails']],
  'policy': ['privacy-policy', ['pdf', 'xlsx'], ['Privacy Policy', 'Acme Shop', 'not legal advice']],
  'email-signature': ['email-signature', ['pdf', 'xlsx'], ['Email Signature', 'Your Name', 'Founder']],
};
const NAME = { pdf: 'PDF', xlsx: 'Excel', csv: 'CSV' };
async function grab(page, fmt) {
  const btn = page.locator(`#pricing [data-gwbx="${fmt}"]`);
  await btn.scrollIntoViewIfNeeded();
  const [dl] = await Promise.all([page.waitForEvent('download'), btn.click()]);
  const f = await dl.path(); return { name: dl.suggestedFilename(), buf: fs.readFileSync(f) };
}
const pdfText = b => b.toString('latin1').replace(/\\([()\\])/g, '$1');
for (const [slug, [stem, fmts, want, setup]] of Object.entries(CASES)) {
  test.describe(`${slug} export`, () => {
    for (const fmt of fmts) test(fmt, async ({ page, errors }) => {
      await open(page, slug); if (setup) await setup(page);
      await expect(page.locator('#pricing .gwbx')).toBeVisible();
      const { name, buf } = await grab(page, fmt);
      expect(name).toBe(`gwb-${stem}-${today}.${fmt}`);
      expect(buf.length).toBeGreaterThan(300);
      let text;
      if (fmt === 'pdf') { expect(buf.subarray(0, 5).toString()).toBe('%PDF-'); text = pdfText(buf); expect(text).toContain('GWB'); }
      else if (fmt === 'xlsx') {
        const wb = XLSX.read(buf, { type: 'buffer' }); const ws = wb.Sheets[wb.SheetNames[0]];
        expect(ws.A2.v).toContain('GWB'); expect(ws.A3.v).toBe('Generated');
        text = XLSX.utils.sheet_to_csv(ws);
        if (slug === 'tax-calculator') { // numeric cells with currency format
          const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }); const th = rows.find(r => r[0] === 'Per year');
          expect(th[1]).toBeCloseTo(79180, 2); const gp = rows.find(r => r[0] === 'Gross pay'); expect(gp[1]).toBe(100000);
        }
      } else { text = buf.toString('utf8'); expect(text.charCodeAt(0)).toBe(0xfeff); }
      for (const w of want) expect(text, `${fmt} contains "${w}"`).toContain(w);
      await expect(page.locator('#gwbx-st')).toContainText('Saved');
    });
  });
}
test('export controls: accessible, 44px targets, no overlap, lazy libs', async ({ page, errors }) => {
  const libs = []; page.on('request', r => { if (/xlsx|jspdf/.test(r.url())) libs.push(r.url()); });
  await open(page, 'tax-calculator');
  expect(libs).toEqual([]);
  const bs = page.locator('#pricing [data-gwbx]'); await expect(bs).toHaveCount(3);
  for (let i = 0; i < 3; i++) { const b = bs.nth(i); await expect(b).toHaveAttribute('aria-label', /Download results as/); const bb = await b.boundingBox(); expect(bb.height).toBeGreaterThanOrEqual(44); expect(bb.width).toBeGreaterThanOrEqual(44); }
  const boxes = [...await Promise.all([0, 1, 2].map(i => bs.nth(i).boundingBox())), await page.locator('#support').boundingBox()];
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) { const a = boxes[i], b = boxes[j]; const ov = a.x < b.x + b.width - 1 && b.x < a.x + a.width - 1 && a.y < b.y + b.height - 1 && b.y < a.y + a.height - 1; expect(ov, `overlap ${i}/${j}`).toBe(false); }
  await grab(page, 'xlsx'); expect(libs.some(u => /xlsx/.test(u))).toBe(true);
});
test('password tool offers no export (passwords never written to files)', async ({ page, errors }) => {
  await open(page, 'password'); await expect(page.locator('[data-gwbx]')).toHaveCount(0);
});
test('export with invalid input shows a friendly message, no download', async ({ page, errors }) => {
  await open(page, 'tax-calculator'); await page.fill('#sal', '-5');
  await page.locator('#pricing [data-gwbx="pdf"]').click();
  await expect(page.locator('#gwbx-st')).toContainText('Fix the highlighted fields');
});
