import { test, expect, open } from './helpers.mjs';
test('tool count uses rounded "20+" wording everywhere', async ({ page, request, errors }) => {
  await open(page, ''); await expect(page.locator('.hero .eyebrow').first()).toHaveText(/^\d0\+ free tools/);
  const desc = await page.locator('meta[name=description]').getAttribute('content'); expect(desc).toMatch(/^\d0\+ free online tools/);
  for (const f of ['llms.txt', 'llms-full.txt']) { const t = await (await request.get('/' + f)).text(); expect(t).toMatch(/\d0\+ free, browser-based tools/); }
  await open(page, 'tax-calculator'); await expect(page.locator('.backlink a')).toHaveText(/Browse all \d0\+ tools/);
  await page.goto('/about/'); await expect(page.locator('main')).toContainText(/currently \d0\+ tools/);
});
