import { test, expect, open, expectInvalid, noBadText } from './helpers.mjs';
import { standardSuite } from './newtool.mjs';
const S = 'loan-calculator', sum = p => p.locator('#lsum');
async function set(page, o) { await page.selectOption('#ltype', 'custom'); for (const [k, v] of Object.entries(o)) await page.fill('#' + k, String(v)); }
test.describe('loan math', () => {
  test('$25,000 at 7.5% for 5 years = $500.95/mo', async ({ page, errors }) => {
    await open(page, S); await set(page, { lamt: 25000, lrate: 7.5, lyears: 5 });
    await expect(sum(page)).toContainText('Monthly payment$500.95'); await expect(sum(page)).toContainText('Total interest$5,056.92'); await expect(sum(page)).toContainText('Number of payments60');
    await expect(page.locator('#lyear tr')).toHaveCount(6); await expect(page.locator('#lyear')).toContainText('5'); await noBadText(page);
  });
  test('$300,000 mortgage at 6% for 30 years: $1,798.65, interest $347,514.57; schedule ends at $0', async ({ page, errors }) => {
    await open(page, S); await set(page, { lamt: 300000, lrate: 6, lyears: 30 });
    await expect(sum(page)).toContainText('Monthly payment$1,798.65'); await expect(sum(page)).toContainText('Total interest$347,514.57');
    await page.locator('details.lmore summary').click(); await expect(page.locator('#lmon tr')).toHaveCount(361);
    await expect(page.locator('#lmon tr').last()).toContainText('$0.00'); await expect(page.locator('#lmon tr').nth(1)).toContainText('$1,500.00'); // first month interest
  });
  test('extra payment shortens loan and shows interest saved', async ({ page, errors }) => {
    await open(page, S); await set(page, { lamt: 300000, lrate: 6, lyears: 30, lextra: 200 });
    await expect(sum(page)).toContainText('Number of payments279'); await expect(sum(page)).toContainText('Interest saved by extra payments$91,173.43'); await expect(sum(page)).toContainText('Months saved81');
  });
  test('0% interest and down payment', async ({ page, errors }) => {
    await open(page, S); await set(page, { lamt: 12000, lrate: 0, lyears: 1 }); await expect(sum(page)).toContainText('Monthly payment$1,000.00'); await expect(sum(page)).toContainText('Total interest$0.00');
    await page.selectOption('#ltype', 'mortgage'); await expect(page.locator('#ldw')).toBeVisible(); await expect(page.locator('#lamtl')).toHaveText('Home price ($)');
    await page.fill('#lamt', '400000'); await page.fill('#ldown', '80000'); await page.fill('#lrate', '6.5'); await page.fill('#lyears', '30'); await page.fill('#lextra', '');
    await expect(sum(page)).toContainText('Amount borrowed$320,000.00'); await expect(sum(page)).toContainText('Monthly payment$2,022.62');
  });
  test('edge cases', async ({ page, errors }) => {
    await open(page, S); await page.fill('#lamt', '0'); await expectInvalid(page, '#lamt'); await expect(page.locator('#lres')).toContainText('Fix the highlighted');
    await page.fill('#lamt', '1000'); await page.fill('#lrate', '-1'); await expectInvalid(page, '#lrate'); await page.fill('#lrate', '101'); await expectInvalid(page, '#lrate');
    await page.fill('#lrate', '5'); await page.fill('#lyears', '0'); await expectInvalid(page, '#lyears');
    await page.fill('#lyears', '2'); await page.selectOption('#ltype', 'equipment'); await page.fill('#lamt', '1000'); await page.fill('#ldown', '1000'); await expectInvalid(page, '#ldown');
    await page.fill('#ldown', '100'); await page.fill('#lextra', '-5'); await expectInvalid(page, '#lextra'); await page.fill('#lextra', '100000'); await expect(sum(page)).toContainText('Number of payments1'); await noBadText(page);
  });
});
standardSuite(S, { stem: 'loan', fmts: ['pdf', 'xlsx', 'csv'], want: ['Loan Amortization Schedule', 'Monthly payment', 'Yearly summary'],
  setup: async p => { await set(p, { lamt: 25000, lrate: 7.5, lyears: 5 }); await expect(p.locator('#lsum')).toContainText('$500.95'); },
  xlsxCheck: rows => { const r = rows.find(r => r[0] === 'Monthly payment'); expect(r[1]).toBeCloseTo(500.95, 2); expect(rows.some(r => r[0] === 60 && r[5] === 0)).toBe(true); } });
