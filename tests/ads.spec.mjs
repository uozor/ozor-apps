// AdSense: new publisher ID once per page in <head>, ads.txt has both lines, ads only in side columns, collapse when not configured/unfilled.
import { test, expect, open, TOOLS } from './helpers.mjs';
const SNIP = '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6757646035709684" crossorigin="anonymous"></script>';
const PAGES = ['', 'about/', 'privacy/', 'terms/', 'contact/', ...TOOLS.map(t => t + '/')];
test('every page: exact new AdSense snippet once, in head; old ID gone; no in-content/overlay ad markup', async ({ request }) => {
  for (const p of PAGES) { const h = await (await request.get('/' + p)).text();
    expect(h.split(SNIP).length - 1, p).toBe(1); expect(h.indexOf(SNIP), p).toBeLessThan(h.indexOf('</head>')); expect(h, p).not.toContain('9780755121157050');
    expect(h, p).not.toContain('ad-inline'); expect(h, p).not.toMatch(/data-ad-format="(autorelaxed|fluid)"|data-anchor|google_ad_client|enable_page_level_ads/);
    const ins = h.match(/<ins class="adsbygoogle"[^>]*>/g) || []; for (const i of ins) expect(i).toContain('data-ad-client="ca-pub-6757646035709684"'); }
});
test('ads.txt keeps the old line and adds the new one', async ({ request }) => {
  const t = (await (await request.get('/ads.txt')).text()).trim().split('\n');
  expect(t).toEqual(['google.com, pub-9780755121157050, DIRECT, f08c47fec0942fa0', 'google.com, pub-6757646035709684, DIRECT, f08c47fec0942fa0']);
});
for (const p of ['audio', 'tax-calculator', '']) test(`side-only ad container (${p || 'hub'}): collapsed until a slot is set, unfilled collapses, filled stays beside content`, async ({ page, errors }) => {
  await open(page, p); const W = page.viewportSize().width, rail = page.locator('aside.rail');
  await expect(rail).toHaveCount(1); await expect(rail).toBeHidden(); await expect(page.locator('main ins.adsbygoogle, .ad-inline')).toHaveCount(0);
  const sim = async status => page.evaluate(st => { const r = document.querySelector('aside.rail'); r.classList.remove('ad-off'); const s = r.querySelector('.ad-slot'); s.innerHTML = '<ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-6757646035709684" data-ad-slot="1" data-ad-format="vertical"></ins>'; if (st) s.firstChild.setAttribute('data-ad-status', st); }, status);
  await sim('unfilled'); await expect(rail).toBeHidden();
  await sim('filled');
  if (W < 1100) { await expect(rail).toBeHidden(); return; }
  await expect(rail).toBeVisible(); const b = s => page.locator(s).first().evaluate(e => { const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom }; });
  const r = await b('aside.rail'), main = await b(p ? '#tool' : '#tools'); expect(r.l).toBeGreaterThan(main.r); expect(['sticky', 'static']).toContain(await rail.evaluate(e => getComputedStyle(e).position));
  if (p) { const g = await b('#guide'); expect(r.t).toBeGreaterThanOrEqual(g.b); }
  const f = await b('#gwb-fab'); expect(Math.min(r.r, f.r) - Math.max(r.l, f.l) > 0 && Math.min(r.b, f.b) - Math.max(r.t, f.t) > 0).toBe(false);
});
const simBanner = (page, status) => page.evaluate(st => { const a = document.querySelector('aside.mban'); a.classList.remove('ad-off'); const s = a.querySelector('.mban-slot'); s.innerHTML = '<ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-6757646035709684" data-ad-slot="1" data-ad-format="horizontal"></ins>'; if (st) s.firstChild.setAttribute('data-ad-status', st); }, status);
const rect = (page, s) => page.locator(s).first().evaluate(e => { const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top + scrollY, b: r.bottom + scrollY, h: r.height }; });
const fixedRect = (page, s) => page.locator(s).first().evaluate(e => { const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top + scrollY, b: r.bottom + scrollY }; });
const hit2 = (a, b) => Math.min(a.r, b.r) - Math.max(a.l, b.l) > 0 && Math.min(a.b, b.b) - Math.max(a.t, b.t) > 0;
for (const p of ['audio', 'tax-calculator', '', 'privacy']) test(`bottom mobile banner (${p || 'hub'}): static at the very bottom on 390/768, never under the helper buttons, collapsed when unconfigured/unfilled, hidden on desktop`, async ({ page, errors }) => {
  test.skip(page.viewportSize().width < 1280, 'sets its own widths');
  const ban = page.locator('aside.mban');
  for (const w of [390, 768]) {
    await page.setViewportSize({ width: w, height: 844 }); await open(page, p);
    await expect(ban).toHaveCount(1); await expect(ban).toBeHidden(); await expect(ban).toHaveClass(/ad-off/);
    await simBanner(page, 'unfilled'); await expect(ban).toBeHidden();
    await simBanner(page, ''); await expect(ban).toBeVisible();
    expect(await ban.evaluate(e => getComputedStyle(e).position)).toBe('static');
    const b = await rect(page, 'aside.mban'), main = await rect(page, 'main'), foot = await rect(page, 'footer'), slot = await rect(page, '.mban-slot');
    expect(b.t).toBeGreaterThanOrEqual(main.b - 1); expect(b.b).toBeLessThanOrEqual(foot.t + 1); expect(slot.h).toBeGreaterThanOrEqual(100);
    expect(await page.evaluate(() => { const a = document.querySelector('aside.mban'); let n = a.previousElementSibling; return n && n.matches('.layout'); })).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(w);
    await page.evaluate(() => scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(400);
    for (const s of ['#gwb-fab', '#gwb-top']) { const v = await page.locator(s).isVisible(); if (v) expect(hit2(await rect(page, 'aside.mban'), await fixedRect(page, s)), `${w} ${s}`).toBe(false); }
  }
  for (const w of [1050, 1280]) { await page.setViewportSize({ width: w, height: 900 }); await open(page, p); await simBanner(page, ''); if (w === 1050 && p && p !== 'privacy') await expect(ban).toBeVisible(); else await expect(ban).toBeHidden(); }
});
