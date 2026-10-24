import { test as pwTest } from '@playwright/test';
import { test, expect, open, expectInvalid, noBadText } from './helpers.mjs';
import { createRequire } from 'module'; const require = createRequire(import.meta.url);
require('../tax-calculator/tax.js'); const T = globalThis.GWBTax;
const near = (a, b) => expect(Math.abs(a - b)).toBeLessThan(0.01);
pwTest.describe('tax engine (unit, known examples)', () => {
  pwTest('single $100k Texas', () => { const r = T.calc({ gross: 100000, state: 'TX' }); near(r.federal, 13170); near(r.ss, 6200); near(r.medicare, 1450); near(r.state, 0); near(r.takeHome, 79180); near(r.effective, 0.2082); expect(r.fedMarginal).toBe(0.22); });
  pwTest('single $100k California (brackets + $153 credit)', () => near(T.calc({ gross: 100000, state: 'CA' }).state, 5070.42));
  pwTest('MFJ $200k Texas', () => near(T.calc({ gross: 200000, status: 'mfj', state: 'TX' }).federal, 26340));
  pwTest('IRS table check: single taxable $50,400 = $5,800; $640,600 = $192,979.25', () => { const b = T.FED.single.b; near(T.brackets(50400, b).tax, 5800); near(T.brackets(640600, b).tax, 192979.25); });
  pwTest('Social Security capped at 2026 wage base', () => near(T.calc({ gross: 300000, state: 'TX' }).ss, 184500 * 0.062));
  pwTest('Additional Medicare 0.9% above $200k single', () => near(T.calc({ gross: 300000, state: 'TX' }).medicare, 300000 * 0.0145 + 100000 * 0.009));
  pwTest('401(k) reduces income tax, not FICA; capped at $24,500', () => { const r = T.calc({ gross: 100000, state: 'TX', k401: 30000 }); expect(r.k401).toBe(24500); near(r.fedTaxable, 100000 - 24500 - 16100); near(r.ss, 6200); });
  pwTest('flat-rate states: Colorado 4.4% after $16,100 deduction', () => near(T.calc({ gross: 50000, state: 'CO' }).state, (50000 - 16100) * 0.044));
  pwTest('Washington wages untaxed; all 51 jurisdictions present', () => { expect(T.calc({ gross: 90000, state: 'WA' }).state).toBe(0); expect(Object.keys(T.STATES)).toHaveLength(51); });
  pwTest('zero income gives zero taxes', () => { const r = T.calc({ gross: 0, state: 'NY' }); expect(r.total).toBe(0); expect(r.effective).toBe(0); });
  pwTest('rejects invalid input', () => { expect(() => T.calc({ gross: NaN })).toThrow(); expect(() => T.calc({ gross: 1, state: 'ZZ' })).toThrow(); });
});
test.describe('tax-calculator UI', () => {
  test('happy path and periods', async ({ page, errors }) => {
    await open(page, 'tax-calculator'); await page.fill('#sal', '100000'); await expect(page.locator('#res')).toContainText('Take-home pay: $79,180.00');
    await expect(page.locator('#res')).toContainText('Tax year 2026'.slice(0, 0)); await expect(page.locator('#tool')).toContainText('Tax year 2026, estimates only, not tax advice');
    await page.selectOption('#st', 'CA'); await expect(page.locator('#res')).toContainText('California income tax');
    await page.selectOption('#per', 'hour'); await expect(page.locator('#hrs')).toBeVisible(); await page.fill('#sal', '50'); await expect(page.locator('#res')).toContainText('Gross pay$104,000.00');
    await page.selectOption('#per', 'month'); await page.fill('#sal', '5000'); await expect(page.locator('#res')).toContainText('$60,000.00');
  });
  test('invalid inputs', async ({ page, errors }) => {
    await open(page, 'tax-calculator'); await page.fill('#sal', '-5'); await expectInvalid(page, '#sal'); await page.fill('#sal', ''); await expectInvalid(page, '#sal');
    await page.fill('#sal', '50000'); await page.fill('#k', '99999'); await expectInvalid(page, '#k'); await page.fill('#k', '-1'); await expectInvalid(page, '#k');
    await page.fill('#k', '1000'); await page.selectOption('#per', 'hour'); await page.fill('#hrs', '0'); await expectInvalid(page, '#hrs'); await noBadText(page);
    await page.fill('#sal', '1e12'); await expectInvalid(page, '#sal');
  });
  test('tax tables missing -> friendly message', async ({ page, errors }) => { await page.route('**/tax.js', r => r.abort()); await open(page, 'tax-calculator'); await expect(page.locator('#res')).toContainText(/didn.t load/); await expect(page.locator('#libfail')).toBeVisible(); });
});
test.describe('hub popularity + recently used', () => {
  test('Most popular stays on the curated list and does not poll GoatCounter', async ({ page, errors }) => {
    const hits = [];
    page.on('request', r => { if (/goatcounter\.com\/counter\//.test(r.url())) hits.push(r.url()); });
    await open(page, ''); await page.waitForTimeout(400);
    expect(hits).toEqual([]);
    await expect(page.locator('#featlist')).toHaveAttribute('data-source', 'static');
    await expect(page.locator('#featlist h3')).toHaveText(['PDF Merge, Split & JPG to PDF', 'Image Compressor & Resizer', 'Invoice & Receipt Generator', 'Audio Converter & Ringtone Trimmer']);
    expect(await page.content()).not.toContain('/counter/');
  });
  test('curated list stays put even if counter endpoints would 404', async ({ page, errors }) => {
    await page.route(/goatcounter\.com\/counter\//, r => r.fulfill({ status: 404, contentType: 'application/json', body: '{}' }));
    await open(page, ''); await page.waitForTimeout(400);
    await expect(page.locator('#featlist')).toHaveAttribute('data-source', 'static'); await expect(page.locator('#featlist li')).toHaveCount(4);
  });
  test('Recently used appears after visiting tools', async ({ page, errors }) => {
    await open(page, ''); await expect(page.locator('#recent')).toBeHidden();
    await open(page, 'invoice'); await page.waitForTimeout(300); await open(page, 'password'); await page.waitForTimeout(300); await open(page, '');
    await expect(page.locator('#recent')).toBeVisible(); await expect(page.locator('#recentlist h3')).toHaveText(['Password Generator', 'Invoice & Receipt Generator']);
  });
});
