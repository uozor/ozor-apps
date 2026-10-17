import { test, expect, TOOLS, open } from './helpers.mjs';
for (const slug of TOOLS) test(`${slug}: Recommended tools section`, async ({ page, errors }) => {
  await open(page, slug);
  const sec = page.locator('section.recs');
  await expect(sec).toHaveCount(1); await expect(sec.getByRole('heading', { name: 'Recommended tools' })).toBeVisible();
  await expect(sec).toContainText('Some links may earn us a commission');
  const links = sec.locator('a'); const n = await links.count(); expect(n).toBeGreaterThanOrEqual(2); expect(n).toBeLessThanOrEqual(3);
  for (let i = 0; i < n; i++) { const a = links.nth(i); await expect(a).toHaveAttribute('rel', 'sponsored noopener'); await expect(a).toHaveAttribute('target', '_blank'); expect(await a.getAttribute('href')).toMatch(/^https:\/\//); }
  // below the tool, not inside pricing/tip/free-forever boxes
  expect(await sec.evaluate(s => !!s.closest('#pricing') || !!s.closest('#tool'))).toBe(false);
  expect(await page.evaluate(() => { const t = document.getElementById('tool'), r = document.querySelector('section.recs'); return !!(t.compareDocumentPosition(r) & Node.DOCUMENT_POSITION_FOLLOWING); })).toBe(true);
});
test('privacy and terms include affiliate disclosure', async ({ page, errors }) => {
  for (const p of ['privacy/', 'terms/']) { await page.goto('/' + p); await expect(page.getByRole('heading', { name: 'Affiliate links' })).toBeVisible(); await expect(page.locator('main')).toContainText('may earn a commission'); }
});
