// Tool page layout: guide in a right-hand column next to the tool on desktop (sticky, scrolls within itself); stacked below the tool on mobile.
import { test, expect, open, TOOLS } from './helpers.mjs';
const box = (page, sel) => page.locator(sel).evaluate(e => { const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width, h: r.height }; });
const hit = (a, b) => Math.min(a.r, b.r) - Math.max(a.l, b.l) > 1 && Math.min(a.b, b.b) - Math.max(a.t, b.t) > 1;
for (const slug of TOOLS) test(`${slug}: guide column, merged How it works, JSON-LD`, async ({ page, errors }) => {
  await open(page, slug); const W = page.viewportSize().width, g = page.locator('#guide');
  await expect(page.locator('#h-how')).toHaveCount(0); await expect(page.locator('main .eyebrow', { hasText: /^How it works$/ })).toHaveCount(0);
  await expect(g.locator('.eyebrow')).toHaveText('Guide'); await expect(g.locator('.lead')).not.toBeEmpty(); await expect(g).toContainText('Private by design');
  const steps = await g.locator('ol li').allInnerTexts(); expect(steps.length).toBeGreaterThanOrEqual(2); await expect(g.locator('#h-faq')).toBeVisible();
  const ld = await page.evaluate(() => [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => JSON.parse(s.textContent)));
  const nodes = ld.flatMap(x => x['@graph'] || [x]); const how = nodes.find(n => n['@type'] === 'HowTo'), faq = nodes.find(n => n['@type'] === 'FAQPage');
  expect(how.step.length).toBe(steps.length); expect(faq.mainEntity.length).toBeGreaterThan(0);
  const t = await box(page, '#tool'), gb = await box(page, '#guide');
  if (W >= 1280) {
    expect(gb.l).toBeGreaterThanOrEqual(t.r + 20); expect(Math.abs(gb.t - t.t)).toBeLessThan(2); expect(gb.r).toBeLessThanOrEqual(W);
    const mh = await g.evaluate(e => [parseFloat(getComputedStyle(e).maxHeight), getComputedStyle(e).overflowY, getComputedStyle(e).position, innerHeight]); expect(mh[0]).toBeLessThanOrEqual(mh[3]); expect(mh[1]).toBe('auto'); expect(mh[2]).toBe('sticky');
    const fab = await box(page, '#gwb-fab'), rail = await box(page, '.rail');
    expect(hit(gb, rail)).toBe(false); expect(rail.t).toBeGreaterThanOrEqual(gb.b);
    for (const s of ['#tool', '#pricing', '.recs', '.ad-inline']) { const n = await page.locator(s).count(); if (n) expect(hit(gb, await box(page, s + ' >> nth=0'))).toBe(false); }
    for (const y of [0, 700, 1600]) { await page.evaluate(v => scrollTo(0, v), y); await page.waitForTimeout(50); const a = await box(page, '#guide'), f = await page.locator('#gwb-fab').evaluate(e => { const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom }; }); expect(hit(a, f)).toBe(false); }
    if (t.h > 1400) { await page.evaluate(() => scrollTo(0, document.getElementById('tool').getBoundingClientRect().top + scrollY + 600)); await expect.poll(async () => Math.round((await box(page, '#guide')).t)).toBe(20); }
  } else {
    expect(gb.t).toBeGreaterThanOrEqual(t.b); expect(Math.abs(gb.l - t.l)).toBeLessThan(2); expect(Math.abs(gb.w - t.w)).toBeLessThan(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(W);
    expect(await g.evaluate(e => getComputedStyle(e).position)).toBe('static');
  }
});
test('long guide scrolls within itself and is keyboard focusable (desktop)', async ({ page, errors }) => {
  await open(page, 'tax-calculator'); test.skip(page.viewportSize().width < 1280);
  await page.setViewportSize({ width: 1280, height: 500 }); const g = page.locator('#guide');
  const [sh, ch] = await g.evaluate(e => [e.scrollHeight, e.clientHeight]); expect(sh).toBeGreaterThan(ch); expect(ch).toBeLessThanOrEqual(460);
  await g.focus(); await expect(g).toBeFocused(); await page.keyboard.press('End'); await expect.poll(() => g.evaluate(e => e.scrollTop)).toBeGreaterThan(0);
});
test('How it works text is kept in the guide (sales-tax, audio)', async ({ page, errors }) => {
  await open(page, 'sales-tax'); await expect(page.locator('#guide .lead')).toContainText('Choose a state and the rate to use');
  await open(page, 'audio'); await expect(page.locator('#guide .lead')).not.toBeEmpty(); await expect(page.locator('#guide')).toContainText('Your files and text never leave your device');
});
test('wide guide column at 1101 / 1280 / 1440 / 1920; stacked at 1100; never under the helper button', async ({ page, errors }) => {
  test.skip(page.viewportSize().width < 1280);
  for (const slug of ['tax-calculator', 'image-compress']) for (const [w, gmin, tmin] of [[1101, 360, 600], [1280, 380, 740], [1440, 420, 860], [1920, 420, 980]]) {
    await page.setViewportSize({ width: w, height: 900 }); await open(page, slug);
    const r = await page.evaluate(() => { const b = s => document.querySelector(s).getBoundingClientRect(); return { t: b('#tool'), g: b('#guide'), f: b('#gwb-fab'), up: b('#gwb-top'), sw: document.documentElement.scrollWidth }; });
    expect(r.g.width, `${slug} ${w} guide`).toBeGreaterThanOrEqual(gmin); expect(r.t.width, `${slug} ${w} tool`).toBeGreaterThanOrEqual(tmin);
    expect(r.g.left).toBeGreaterThan(r.t.right); expect(r.g.right).toBeLessThanOrEqual(r.f.left); expect(r.sw).toBeLessThanOrEqual(w);
  }
  await page.setViewportSize({ width: 1100, height: 900 }); await open(page, 'tax-calculator');
  const s = await page.evaluate(() => { const b = s => document.querySelector(s).getBoundingClientRect(); return [b('#tool').bottom, b('#guide').top, document.documentElement.scrollWidth]; });
  expect(s[1]).toBeGreaterThanOrEqual(s[0]); expect(s[2]).toBeLessThanOrEqual(1100);
});
