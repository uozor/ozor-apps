import { test, expect, open, expectInvalid, noBadText } from './helpers.mjs';
import { standardSuite } from './newtool.mjs';
const S = 'freelance-rate', R = p => p.locator('#frates'), B = p => p.locator('#fbreak');
test.describe('freelance rate math', () => {
  test('defaults: $60k take-home, 25% tax, $10k costs, 10% buffer, 1,344 h -> $73.66/h', async ({ page, errors }) => {
    await open(page, S);
    await expect(R(page)).toContainText('Hourly rate$73.66'); await expect(R(page)).toContainText('Day rate (8 h)$589.29'); await expect(R(page)).toContainText('Project (20 h)$1,473.21');
    await expect(R(page)).toContainText('Monthly revenue needed$8,250.00');
    await expect(B(page)).toContainText('Estimated taxes (25%)$20,000.00'); await expect(B(page)).toContainText('Profit buffer (10%)$9,000.00'); await expect(B(page)).toContainText('Revenue needed per year$99,000.00'); await expect(B(page)).toContainText('Billable hours per year1,344');
    await noBadText(page);
  });
  test('changing inputs', async ({ page, errors }) => {
    await open(page, S); await page.fill('#ftx', '0'); await page.fill('#fbuf', '0'); await page.fill('#fex', '0'); await page.fill('#fbill', '100'); await page.fill('#fwk', '50');
    await expect(R(page)).toContainText('Hourly rate$30.00'); // 60000 / 2000
    await page.fill('#fph', '0'); await expect(R(page)).not.toContainText('Project');
  });
  test('edge cases', async ({ page, errors }) => {
    await open(page, S); await page.fill('#ftx', '95'); await expectInvalid(page, '#ftx'); await expect(page.locator('#fres')).toContainText('Fix the highlighted');
    await page.fill('#ftx', '25'); await page.fill('#fbill', '0'); await expectInvalid(page, '#fbill'); await page.fill('#fbill', '70');
    await page.fill('#fwk', '53'); await expectInvalid(page, '#fwk'); await page.fill('#fwk', '48'); await page.fill('#fti', ''); await expectInvalid(page, '#fti');
    await page.fill('#fti', '0'); await page.fill('#fex', '0'); await expect(R(page)).toContainText('Hourly rate$0.00'); await noBadText(page);
  });
});
standardSuite(S, { stem: 'freelance-rate', fmts: ['pdf', 'xlsx', 'csv'], want: ['Freelance Rate Plan', 'Hourly rate', 'Revenue needed per year'],
  xlsxCheck: rows => { expect(rows.find(r => r[0] === 'Hourly rate')[1]).toBeCloseTo(73.66, 2); expect(rows.find(r => r[0] === 'Billable hours per year')[1]).toBe(1344); } });
