import { test, expect, open, expectInvalid, noBadText } from './helpers.mjs';
import { standardSuite } from './newtool.mjs';
import { createRequire } from 'module'; const require = createRequire(import.meta.url); require('../tax-calculator/tax.js'); const T = globalThis.GWBTax;
const S = 'paycheck-calculator', res = p => p.locator('#pres');
test.describe('paycheck math', () => {
  test('$25/h x 40 x 52 = $52,000; Texas single biweekly take-home', async ({ page, errors }) => {
    await open(page, S);
    await expect(res(page)).toContainText('$52,000.00 a year gross');
    // federal 4,060; SS 3,224; Medicare 754; take-home 43,962 -> /26
    await expect(page.locator('#pck')).toContainText('Gross pay$2,000.00'); await expect(page.locator('#pck')).toContainText('Federal income tax-$156.15');
    await expect(page.locator('#pck')).toContainText('Social Security-$124.00'); await expect(page.locator('#pck')).toContainText('Medicare-$29.00');
    await expect(page.locator('#pck')).toContainText('Take-home pay$1,690.85');
    await expect(page.locator('#pper')).toContainText('Yearly$52,000.00$43,962.00'); await expect(page.locator('#pper')).toContainText('Hourly$25.00$21.14');
    await noBadText(page);
  });
  test('salary to hourly, frequency, state', async ({ page, errors }) => {
    await open(page, S); await page.selectOption('#mode', 'year');
    await expect(page.locator('#amt')).toHaveValue('52000'); await expect(page.locator('#otw')).toBeHidden();
    await page.fill('#amt', '104000'); await page.selectOption('#pst', 'CA');
    await expect(res(page)).toContainText('$50.00 an hour');
    const exp = T.calc({ gross: 104000, state: 'CA' }).takeHome / 26;
    await expect(page.locator('#pck')).toContainText('Take-home pay$' + exp.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    await page.selectOption('#freq', '12'); await expect(page.locator('#pck')).toContainText('Gross pay$8,666.67');
    await page.selectOption('#freq', '24'); await expect(page.locator('#pck')).toContainText('Gross pay$4,333.33');
  });
  test('overtime 1.5x and 401(k)', async ({ page, errors }) => {
    await open(page, S); await page.fill('#ot', '5'); // 25*1.5*5*52 = 9,750
    await expect(res(page)).toContainText('$61,750.00 a year gross');
    await page.fill('#pk', '2600'); await expect(page.locator('#pck')).toContainText('Pre-tax 401(k)-$100.00');
    const exp = T.calc({ gross: 61750, state: 'TX', k401: 2600 }).takeHome / 26;
    await expect(page.locator('#pck')).toContainText('Take-home pay$' + exp.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  });
  test('edge cases: invalid, zero, 401k > pay', async ({ page, errors }) => {
    await open(page, S); await page.fill('#amt', '-1'); await expectInvalid(page, '#amt'); await expect(res(page)).toContainText('Fix the highlighted');
    await page.fill('#amt', ''); await expectInvalid(page, '#amt');
    await page.fill('#amt', '0'); await expect(page.locator('#pck')).toContainText('Take-home pay$0.00');
    await page.fill('#amt', '25'); await page.fill('#hpw', '0'); await expectInvalid(page, '#hpw'); await page.fill('#hpw', '40');
    await page.fill('#wpy', '60'); await expectInvalid(page, '#wpy'); await page.fill('#wpy', '52');
    await page.fill('#pk', '99999'); await expectInvalid(page, '#pk');
    await page.fill('#pk', ''); await page.fill('#amt', '1'); await page.fill('#pk', '20000'); await expectInvalid(page, '#pk'); await noBadText(page);
  });
});
standardSuite(S, { stem: 'paycheck-2026', fmts: ['pdf', 'xlsx', 'csv'], want: ['Paycheck Estimate', 'Take-home pay', 'Tax year 2026, estimates only, not tax advice'],
  xlsxCheck: rows => { const y = rows.find(r => r[0] === 'Yearly'); expect(y[1]).toBe(52000); expect(y[2]).toBeCloseTo(43962, 2); } });
