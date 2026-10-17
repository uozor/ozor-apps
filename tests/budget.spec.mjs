import { test, expect, open, expectInvalid, noBadText } from './helpers.mjs';
const sum = p => p.locator('#bsum');
test.describe('budget-calculator', () => {
  test('defaults: totals, remaining, % and 50/30/20', async ({ page, errors }) => {
    await open(page, 'budget-calculator');
    await expect(sum(page)).toContainText('Total income$4,000.00'); await expect(sum(page)).toContainText('Total expenses$3,490.00'); await expect(sum(page)).toContainText('Remaining$510.00');
    await expect(page.locator('#bcat')).toContainText('Rent / mortgageNeed$1,400.0035.0%');
    await expect(page.locator('#brule')).toContainText('Needs (50%)$2,780.0069.5%$2,000.00');
    await expect(page.locator('#brule')).toContainText('Wants (30%)$310.007.8%$1,200.00');
    await expect(page.locator('#brule')).toContainText('Savings & debt extra (20%)$400.0010.0%$800.00');
    await expect(page.locator('.bars li')).toHaveCount(9); await noBadText(page);
  });
  test('add/remove rows and shortfall', async ({ page, errors }) => {
    await open(page, 'budget-calculator');
    await page.click('#addinc'); const r = page.locator('#inc tbody tr').last(); await r.locator('input').first().fill('Side gig'); await r.locator('input[type=number]').fill('500');
    await expect(sum(page)).toContainText('Total income$4,500.00');
    await page.click('#addexp'); const e = page.locator('#exp tbody tr').last(); await e.locator('input').first().fill('Car'); await e.locator('input[type=number]').fill('2000');
    await expect(sum(page)).toContainText('Shortfall$990.00');
    await page.getByRole('button', { name: 'Remove Car' }).click(); await expect(sum(page)).toContainText('Remaining$1,010.00');
    await expect(page.locator('#exp tbody tr')).toHaveCount(9);
  });
  test('period toggle converts amounts', async ({ page, errors }) => {
    await open(page, 'budget-calculator'); await page.selectOption('#bper', 'year');
    await expect(sum(page)).toContainText('Total income$48,000.00'); await expect(sum(page)).toContainText('Remaining$6,120.00');
    await page.selectOption('#bper', 'week'); await expect(sum(page)).toContainText('Total income$923.08');
    await page.selectOption('#bper', 'month'); await expect(sum(page)).toContainText('Total income$4,000.0');
  });
  test('invalid input and zero income', async ({ page, errors }) => {
    await open(page, 'budget-calculator'); const a = page.locator('#inc tbody tr input[type=number]').first();
    await a.fill('-10'); await expectInvalid(page, '#' + await a.getAttribute('id')); await expect(page.locator('#bres')).toContainText('Fix the highlighted');
    await page.locator('[data-gwbx=pdf]').click(); await expect(page.locator('#gwbx-st')).toContainText('Fix the highlighted fields');
    await a.fill('0'); await expect(page.locator('#bres')).toContainText('Add at least one income amount'); await noBadText(page);
  });
  test('remember on this device (localStorage) and reset', async ({ page, errors }) => {
    await open(page, 'budget-calculator'); await page.check('#bsave');
    await page.locator('#inc tbody tr input[type=number]').first().fill('5000'); await page.reload();
    await expect(page.locator('#bsave')).toBeChecked(); await expect(sum(page)).toContainText('Total income$5,000.00');
    await page.uncheck('#bsave'); await page.reload(); await expect(sum(page)).toContainText('Total income$4,000.00');
    await page.locator('#exp tbody tr input[type=number]').first().fill('1'); await page.click('#breset'); await expect(sum(page)).toContainText('Total expenses$3,490.00');
  });
});
