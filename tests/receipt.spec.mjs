import { test, expect, open, expectInvalid, noBadText } from './helpers.mjs';
import { standardSuite, grab, today, xlsxRows } from './newtool.mjs';
const S = 'receipt-quote-maker', tot = p => p.locator('#qtot');
test.describe('receipt & quote math', () => {
  test('receipt defaults: 2x$150 + $80 = $380; paid in full', async ({ page, errors }) => {
    await open(page, S); await expect(page.locator('#qdoc h2')).toHaveText('Receipt R-001');
    await expect(tot(page)).toContainText('Subtotal$380.00'); await expect(tot(page)).toContainText('Total$380.00'); await expect(tot(page)).toContainText('Balance due$0.00');
    await expect(page.locator('#qvw')).toBeHidden(); await expect(page.locator('#qdoc')).toContainText('Paid by: Card'); await noBadText(page);
  });
  test('quote: 10% discount before 8.875% tax, 50% deposit', async ({ page, errors }) => {
    await open(page, S); await page.selectOption('#qtype', 'QUOTE'); await expect(page.locator('#qnum')).toHaveValue('Q-001'); await expect(page.locator('#qvw')).toBeVisible();
    await page.fill('#qdisc', '10'); await page.fill('#qtax', '8.875'); await page.fill('#qdep', '50');
    await expect(tot(page)).toContainText('Discount (10%)-$38.00'); await expect(tot(page)).toContainText('Tax (8.875%)$30.35'); await expect(tot(page)).toContainText('Total$372.35');
    await expect(tot(page)).toContainText('Deposit due (50%)$186.18'); await expect(tot(page)).toContainText('Balance on completion$186.17'); await expect(page.locator('#qdoc')).toContainText('Valid until');
  });
  test('estimate note, add/remove items, print', async ({ page, errors }) => {
    await open(page, S); await page.selectOption('#qtype', 'ESTIMATE'); await expect(page.locator('#qdoc')).toContainText('final price may change');
    await page.click('#qadd'); const r = page.locator('#qitems tbody tr').last(); await r.locator('input').nth(0).fill('Travel'); await r.locator('input').nth(2).fill('20');
    await expect(tot(page)).toContainText('Subtotal$400.00'); await r.getByRole('button', { name: 'Remove item' }).click(); await expect(tot(page)).toContainText('Subtotal$380.00');
    await page.click('#qprint'); expect(await page.evaluate(() => window.__printed)).toBe(1);
  });
  test('edge cases', async ({ page, errors }) => {
    await open(page, S); const q = page.locator('#qitems tbody tr').first().locator('input').nth(1);
    await q.fill('-1'); await expectInvalid(page, '#' + await q.getAttribute('id')); await page.click('#qprint'); expect(await page.evaluate(() => window.__printed || 0)).toBe(0);
    await q.fill('2'); await page.fill('#qtax', '101'); await expectInvalid(page, '#qtax'); await page.fill('#qtax', '0');
    for (let i = 0; i < 2; i++) await page.locator('#qitems tbody tr').first().getByRole('button', { name: 'Remove item' }).click();
    await expect(page.locator('#qdoc')).toContainText('Add at least one line item'); await page.fill('#qto', '<b>x</b>'); await noBadText(page);
  });
  test('quote export filename and deposit row', async ({ page, errors }) => {
    await open(page, S); await page.selectOption('#qtype', 'QUOTE'); await page.fill('#qdep', '50');
    const { name, buf } = await grab(page, '#pricing [data-gwbx="xlsx"]'); expect(name).toBe(`gwb-quote-${today}.xlsx`);
    const rows = xlsxRows(buf); expect(rows[0][0]).toBe('Quote Q-001'); expect(rows.find(r => r[0] === 'Deposit due (50%)')[1]).toBe(190);
  });
});
standardSuite(S, { stem: 'receipt', fmts: ['pdf', 'xlsx', 'csv'], want: ['Receipt R-001', 'Consultation (hours)', 'Total'],
  xlsxCheck: rows => { expect(rows.find(r => r[0] === 'Total')[1]).toBe(380); } });
