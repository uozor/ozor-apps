// AdSense: ca-pub-9780755121157050 once per page in <head>; ads.txt has both lines; two manual units only:
// sidebar (slot 7011356746) in the side column on wide screens, bottom banner (slot 3786427608) above the footer on narrow screens.
// Static, no overlap, collapse when unfilled.
import { test, expect, open, TOOLS } from './helpers.mjs';
const CL = 'ca-pub-9780755121157050', RAIL = '7011356746', MOB = '3786427608';
const SNIP = `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CL}" crossorigin="anonymous"></script>`;
const PAGES = ['', 'about/', 'privacy/', 'terms/', 'contact/', ...TOOLS.map(t => t + '/')];
test('every page: exact snippet once in head; other client gone; exactly the two manual units with the right slots; no overlay formats', async ({ request }) => {
  for (const p of PAGES) { const h = await (await request.get('/' + p)).text();
    expect(h.split(SNIP).length - 1, p).toBe(1); expect(h.indexOf(SNIP), p).toBeLessThan(h.indexOf('</head>')); expect(h, p).not.toContain('6757646035709684');
    expect(h, p).not.toContain('ad-inline'); expect(h, p).not.toMatch(/data-ad-format="(autorelaxed|fluid)"|data-anchor|enable_page_level_ads|overlays/);
    const ins = h.match(/<ins class="adsbygoogle"[^>]*>/g) || []; expect(ins, p).toHaveLength(2);
    expect(ins[0], p).toContain(`data-ad-slot="${RAIL}"`); expect(ins[1], p).toContain(`data-ad-slot="${MOB}"`);
    for (const i of ins) { expect(i).toContain(`data-ad-client="${CL}"`); expect(i).toContain('data-ad-format="auto"'); expect(i).toContain('data-full-width-responsive="true"'); }
    expect(h.match(/aside class="rail noprint"[^>]*>/)[0]).not.toContain('ad-off'); expect(h.match(/aside class="mban noprint"[^>]*>/)[0]).not.toContain('ad-off'); }
});
test('ads.txt keeps both lines', async ({ request }) => {
  const t = (await (await request.get('/ads.txt')).text()).trim().split('\n');
  expect(t).toEqual(['google.com, pub-9780755121157050, DIRECT, f08c47fec0942fa0', 'google.com, pub-6757646035709684, DIRECT, f08c47fec0942fa0']);
});
const R = (page, s) => page.locator(s).first().evaluate(e => { const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top + scrollY, b: r.bottom + scrollY, w: r.width, h: r.height }; });
const hit = (a, b) => Math.min(a.r, b.r) - Math.max(a.l, b.l) > 0 && Math.min(a.b, b.b) - Math.max(a.t, b.t) > 0;
const status = (page, sel, st) => page.evaluate(([s, v]) => document.querySelector(s).setAttribute('data-ad-status', v), [sel, st]);
for (const p of ['audio', 'tax-calculator', '', 'privacy']) test(`ad units on ${p || 'hub'}: sidebar on wide screens, bottom banner on narrow screens, static, no overlap, collapse when unfilled`, async ({ page, errors }) => {
  test.skip(page.viewportSize().width < 1280, 'sets its own widths'); const tool = !!p && p !== 'privacy';
  const rail = page.locator('aside.rail'), ban = page.locator('aside.mban');
  for (const w of [1280, 1440, 1920]) {
    await page.setViewportSize({ width: w, height: 900 }); await open(page, p);
    await expect(rail).toBeVisible(); await expect(ban).toBeHidden(); await expect(rail.locator(`ins.adsbygoogle[data-ad-slot="${RAIL}"]`)).toHaveCount(1);
    expect(await rail.locator('ins').getAttribute('data-gwb-pushed')).toBe('1'); expect(await ban.locator('ins').getAttribute('data-gwb-pushed')).toBeNull();
    const r = await R(page, 'aside.rail'), main = await R(page, tool ? '#tool' : (p ? 'main section' : '#tools')), slot = await R(page, '.ad-slot');
    expect(r.l).toBeGreaterThan(main.r); expect(slot.h).toBeGreaterThanOrEqual(600); expect(slot.w).toBeLessThanOrEqual(r.w + 1);
    if (tool) { const g = await R(page, '#guide'); expect(r.t).toBeGreaterThanOrEqual(g.b); expect(hit(r, g)).toBe(false); }
    for (const s of ['#gwb-fab', '#gwb-top']) if (await page.locator(s).isVisible()) { const f = await page.locator(s).evaluate(e => { const b = e.getBoundingClientRect(); return { l: b.left, r: b.right }; }); expect(f.l).toBeGreaterThanOrEqual(r.r - 1); }
    await status(page, 'aside.rail ins', 'unfilled'); await expect(rail).toBeHidden(); await status(page, 'aside.rail ins', 'filled'); await expect(rail).toBeVisible();
  }
  for (const w of [390, 768, ...(tool ? [1050] : [])]) {
    await page.setViewportSize({ width: w, height: 844 }); await open(page, p);
    await expect(rail).toBeHidden(); await expect(ban).toBeVisible(); await expect(ban.locator(`ins.adsbygoogle[data-ad-slot="${MOB}"]`)).toHaveCount(1);
    expect(await ban.locator('ins').getAttribute('data-gwb-pushed')).toBe('1'); expect(await rail.locator('ins').getAttribute('data-gwb-pushed')).toBeNull();
    expect(await ban.evaluate(e => getComputedStyle(e).position)).toBe('static');
    const b = await R(page, 'aside.mban'), slot = await R(page, '.mban-slot'), main = await R(page, 'main'), foot = await R(page, 'footer');
    expect(b.t).toBeGreaterThanOrEqual(main.b - 1); expect(b.b).toBeLessThanOrEqual(foot.t + 1); expect(slot.h).toBeGreaterThanOrEqual(100);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(w);
    for (const s of ['#gwb-fab', '#gwb-top']) { await page.evaluate(() => scrollTo(0, document.body.scrollHeight)); if (await page.locator(s).isVisible()) { const f = await page.locator(s).evaluate(e => e.getBoundingClientRect().left); expect(f, `${w} ${s}`).toBeGreaterThanOrEqual(slot.r); } }
    await status(page, 'aside.mban ins', 'unfilled'); await expect(ban).toBeHidden();
  }
  if (!tool) { await page.setViewportSize({ width: 1050, height: 900 }); await open(page, p); await expect(rail).toBeVisible(); await expect(ban).toBeHidden(); }
});
