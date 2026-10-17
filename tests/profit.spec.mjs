import { test, expect, open, expectInvalid, noBadText } from './helpers.mjs';
import { standardSuite } from './newtool.mjs';
const S = 'profit-margin';
test.describe('profit margin math', () => {
  test('defaults: $40 cost / $65 price; 40% margin price; break-even', async ({ page, errors }) => {
    await open(page, S);
    await expect(page.locator('#mo')).toHaveText('Profit: $25.00\nMargin: 38.46%\nMarkup: 62.50%');
    await expect(page.locator('#po')).toContainText('Selling price: $66.67'); await expect(page.locator('#po')).toContainText('Equivalent markup: 66.67%');
    await expect(page.locator('#bo')).toContainText('Break-even: 334 units'); await expect(page.locator('#bo')).toContainText('Break-even revenue: $8,350.00'); await expect(page.locator('#bo')).toContainText('Contribution per unit: $15.00 (60.00%)');
    await expect(page.locator('#ladder')).toContainText('50%$80.00$40.00100.00%'); await noBadText(page);
  });
  test('markup target, profit goal, loss warning', async ({ page, errors }) => {
    await open(page, S); await page.selectOption('#pk', 'markup'); await expect(page.locator('#po')).toContainText('Selling price: $56.00'); await expect(page.locator('#po')).toContainText('Equivalent margin: 28.57%');
    await page.fill('#bg', '3000'); await expect(page.locator('#bo')).toContainText('Units for $3,000.00 profit: 534 ($13,350.00 revenue)');
    await page.fill('#mp', '30'); await expect(page.locator('#mo')).toContainText('You lose money');
  });
  test('edge cases', async ({ page, errors }) => {
    await open(page, S); await page.fill('#mp', '0'); await expect(page.locator('#mo')).toContainText('Margin: n/a (price is 0)');
    await page.fill('#mc', '0'); await page.fill('#mp', '10'); await expect(page.locator('#mo')).toContainText('Markup: n/a (cost is 0)');
    await page.fill('#mc', '-1'); await expectInvalid(page, '#mc'); await expect(page.locator('#mo')).toHaveText('Fix the highlighted fields.');
    await page.fill('#pt', '100'); await expectInvalid(page, '#pt'); await page.fill('#pt', '40');
    await page.fill('#bp', '10'); await expect(page.locator('#bo')).toContainText('never break even'); await page.fill('#bf', ''); await expectInvalid(page, '#bf'); await noBadText(page);
  });
});
standardSuite(S, { stem: 'profit-margin', fmts: ['pdf', 'xlsx', 'csv'], want: ['Profit Margin & Break-Even Report', 'Margin', 'Break-even units', 'Price ladder'],
  xlsxCheck: rows => { const r = rows.find(r => r[0] === 'Margin'); expect(r[1]).toBeCloseTo(0.3846, 4); expect(rows.find(r => r[0] === 'Break-even units')[1]).toBe(334); } });
