import { test, expect, open, expectInvalid, noBadText } from './helpers.mjs';
import { standardSuite, grab, xlsxRows } from './newtool.mjs';
const S = 'sales-tax';
const sum = p => p.locator('#stsum tbody');
async function oneItem(page, price, q = '1') { const rows = page.locator('#stitems tbody tr'); while (await rows.count() > 1) await rows.last().getByRole('button', { name: 'Remove item' }).click(); const i = rows.first().locator('input'); await i.nth(1).fill(q); await i.nth(2).fill(price); await i.nth(3).check(); }
test.describe('sales tax', () => {
  test('defaults: Texas 8.2%, mixed taxable and exempt items', async ({ page, errors }) => {
    await open(page, S); await expect(page.locator('#stst')).toHaveValue('TX'); await expect(page.locator('#strate')).toHaveValue('8.2');
    await expect(page.locator('#stratei')).toHaveText('Texas: 6.25% state + 1.95% average local.');
    await expect(sum(page)).toHaveText(/Taxable amount \(before tax\)\$33\.99\s*Not taxable\$25\.00\s*Subtotal before tax\$58\.99\s*Sales tax \(8\.2%\)\$2\.79\s*Total\$61\.78/);
    await expect(page.locator('#stnote')).toHaveText('Tax = $33.99 × 8.2% = $2.79.'); await expect(page.locator('#ststates')).toContainText('Louisiana10.13%$3.44$62.43'); await expect(page.locator('#ststates tr')).toHaveCount(52); await noBadText(page);
  });
  test('rate modes and states (cited 2026 rates)', async ({ page, errors }) => {
    await open(page, S); await oneItem(page, '100');
    await page.selectOption('#stst', 'CA'); await expect(page.locator('#strate')).toHaveValue('9.03'); await expect(sum(page)).toContainText('Sales tax (9.03%)$9.03');
    await page.selectOption('#stmode', 'state'); await expect(page.locator('#strate')).toHaveValue('7.25'); await expect(sum(page)).toContainText('Total$107.25');
    await page.selectOption('#stst', 'MO'); await expect(sum(page)).toContainText('Sales tax (4.225%)$4.23');
    await page.selectOption('#stst', 'OR'); await expect(page.locator('#stratei')).toContainText('no statewide sales tax'); await expect(sum(page)).toContainText('Total$100.00');
    await page.selectOption('#stmode', 'custom'); await expect(page.locator('#strate')).toBeFocused(); await expect(page.locator('#strate')).not.toHaveAttribute('readonly', '');
    await page.fill('#strate', '8.25'); await expect(sum(page)).toContainText('Sales tax (8.25%)$8.25'); await expect(sum(page)).toContainText('Total$108.25');
    const r = await page.evaluate(() => ST_RATES.length); expect(r).toBe(51); await expect(page.locator('#tool a[href*="taxfoundation.org"]')).toHaveAttribute('rel', 'noopener');
  });
  test('reverse: take tax out of a total', async ({ page, errors }) => {
    await open(page, S); await oneItem(page, '108.20'); await page.selectOption('#stdir', 'remove');
    await expect(sum(page)).toHaveText(/Taxable amount \(before tax\)\$100\.00\s*Subtotal before tax\$100\.00\s*Sales tax \(8\.2%\)\$8\.20\s*Total\$108\.20/);
    await expect(page.locator('#stnote')).toContainText('$108.20 taxable total ÷ 1.082 = $100.00 before tax');
    await page.selectOption('#stmode', 'custom'); await page.fill('#strate', '8.875'); await oneItem(page, '10');
    await expect(sum(page)).toContainText('Taxable amount (before tax)$9.18'); await expect(sum(page)).toContainText('Sales tax (8.875%)$0.82'); await expect(sum(page)).toContainText('Total$10.00');
  });
  test('multi-item add/remove, quantities and line tax rounding', async ({ page, errors }) => {
    await open(page, S); const u = await page.evaluate(() => stCalc([{ d: 'a', q: 1, p: .05, tax: true }, { d: 'b', q: 1, p: .05, tax: true }, { d: 'c', q: 1, p: .05, tax: true }], 10, 'add'));
    expect(u.tax).toBe(0.02); expect(u.lines.map(l => l.t).reduce((a, b) => a + b, 0)).toBeCloseTo(0.02, 10); expect(u.total).toBe(0.17);
    const v = await page.evaluate(() => stCalc([{ d: 'a', q: 3, p: 19.99, tax: true }, { d: 'b', q: 1.5, p: 4, tax: false }], 6.25, 'remove'));
    expect(v.taxable).toBe(56.44); expect(v.tax).toBe(3.53); expect(v.exempt).toBe(6); expect(v.total).toBe(65.97);
    await page.click('#stadd'); await expect(page.locator('#stitems tbody tr')).toHaveCount(4); await expect(page.locator('#stitems tbody tr').last().locator('input').first()).toBeFocused();
    const last = page.locator('#stitems tbody tr').last().locator('input'); await last.nth(1).fill('2'); await last.nth(2).fill('10'); await expect(sum(page)).toContainText('Taxable amount (before tax)$53.99'); await expect(sum(page)).toContainText('Sales tax (8.2%)$4.43');
    await page.locator('#stitems tbody tr').nth(2).locator('input').nth(3).check(); await expect(sum(page)).not.toContainText('Not taxable'); await expect(sum(page)).toContainText('$78.99');
  });
  test('edge cases', async ({ page, errors }) => {
    await open(page, S); await page.selectOption('#stmode', 'custom'); await page.fill('#strate', '31'); await expectInvalid(page, '#strate'); await expect(sum(page)).toHaveText('Fix the highlighted fields.');
    await page.fill('#strate', ''); await expectInvalid(page, '#strate'); await page.fill('#strate', '5');
    const q = page.locator('#stitems tbody tr').first().locator('input'); await q.nth(2).fill('-3'); await expectInvalid(page, '#' + await q.nth(2).getAttribute('id')); await q.nth(2).fill('3');
    await q.nth(1).fill(''); await expectInvalid(page, '#' + await q.nth(1).getAttribute('id')); await q.nth(1).fill('0'); await expect(sum(page)).toContainText('Total');
    for (let i = 0; i < 3; i++) await page.locator('#stitems tbody tr').first().getByRole('button', { name: 'Remove item' }).click();
    await expect(sum(page)).toHaveText('Add at least one item.'); await expect(page.locator('#stadd')).toBeFocused(); await noBadText(page);
  });
  test('export keeps items, summary and every state', async ({ page, errors }) => {
    await open(page, S); const { buf } = await grab(page, '[data-gwbx="xlsx"]'); const rows = xlsxRows(buf);
    expect(rows.find(r => r[0] === 'Gift card')[4]).toBe('No'); expect(rows.some(r => r[0] === 'Wyoming')).toBe(true); expect(rows.some(r => String(r[0]).startsWith('Rates: Tax Foundation'))).toBe(true);
  });
});
standardSuite(S, { stem: 'sales-tax', fmts: ['pdf', 'xlsx', 'csv'], want: ['Sales Tax Calculation', 'Coffee mug', 'Sales tax (8.2%)', 'Tax Foundation'], noteWant: ['Total: $61.78'] });
