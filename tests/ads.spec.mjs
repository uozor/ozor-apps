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
