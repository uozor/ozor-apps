// AdSense: ca-pub-9780755121157050 once per page in <head>; ads.txt has both lines; two manual units only:
// sidebar (slot 7011356746) in the side column on wide screens, bottom banner (slot 3786427608) above the footer on narrow screens.
// Static, no overlap, collapse when unfilled.
import { test, expect, open, TOOLS } from './helpers.mjs';
const CL = 'ca-pub-9780755121157050', RAIL = '7011356746', R2 = '7653821746', R3 = '5027658409', MOB = '3786427608';
const SNIP = `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CL}" crossorigin="anonymous"></script>`;
const PAGES = ['', 'about/', 'privacy/', 'terms/', 'contact/', ...TOOLS.map(t => t + '/')];
test('every page: exact snippet once in head; other client gone; exactly the two manual units with the right slots; no overlay formats', async ({ request }) => {
  for (const p of PAGES) { const h = await (await request.get('/' + p)).text();
    expect(h.split(SNIP).length - 1, p).toBe(1); expect(h.indexOf(SNIP), p).toBeLessThan(h.indexOf('</head>')); expect(h, p).not.toContain('6757646035709684');
    expect(h, p).not.toContain('ad-inline'); expect(h, p).not.toMatch(/data-ad-format="(autorelaxed|fluid)"|data-anchor|enable_page_level_ads|overlays/);
    const ins = h.match(/<ins class="adsbygoogle"[^>]*>/g) || [], tool = TOOLS.includes(p.replace('/', '')), slots = tool ? [RAIL, R2, R3, MOB] : [RAIL, MOB];
    expect(ins.map(i => i.match(/data-ad-slot="(\d+)"/)[1]), p).toEqual(slots);
    for (const i of ins) { expect(i).toContain(`data-ad-client="${CL}"`); expect(i).toMatch(/data-ad-format="(auto|rectangle)"/); expect(i).toContain('data-full-width-responsive="true"'); }
    if (tool) { expect(ins[1]).toContain('data-ad-format="rectangle"'); expect(ins[2]).toContain('data-ad-format="rectangle"'); }
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
  const rail = page.locator('aside[data-gwb-ad="rail"]'), ban = page.locator('aside.mban');
  for (const w of [1280, 1440, 1920]) {
    await page.setViewportSize({ width: w, height: 900 }); await open(page, p);
    await expect(rail).toBeVisible(); await expect(ban).toBeHidden(); await expect(rail.locator(`ins.adsbygoogle[data-ad-slot="${RAIL}"]`)).toHaveCount(1);
    expect(await rail.locator('ins').getAttribute('data-gwb-pushed')).toBe('1'); expect(await ban.locator('ins').getAttribute('data-gwb-pushed')).toBeNull();
    const r = await R(page, 'aside[data-gwb-ad="rail"]'), main = await R(page, tool ? '#tool' : (p ? 'main section' : '#tools')), slot = await R(page, '[data-gwb-ad="rail"] .ad-slot');
    expect(r.l).toBeGreaterThan(main.r); expect(slot.h).toBeGreaterThanOrEqual(600); expect(slot.w).toBeLessThanOrEqual(r.w + 1);
    if (tool) { const g = await R(page, '#guide'); expect(r.t).toBeGreaterThanOrEqual(g.b); expect(hit(r, g)).toBe(false); }
    for (const s of ['#gwb-fab', '#gwb-top']) if (await page.locator(s).isVisible()) { const f = await page.locator(s).evaluate(e => { const b = e.getBoundingClientRect(); return { l: b.left, r: b.right }; }); expect(f.l).toBeGreaterThanOrEqual(r.r - 1); }
    await status(page, 'aside[data-gwb-ad="rail"] ins', 'unfilled'); await expect(rail).toBeHidden(); await status(page, 'aside[data-gwb-ad="rail"] ins', 'filled'); await expect(rail).toBeVisible();
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

// Extra side units on tool pages (desktop): fit check places 1-3 units in the side column without lengthening the page.
const vis = page => page.evaluate(() => { const b = e => { const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top + scrollY, b: r.bottom + scrollY, w: r.width, h: r.height }; };
  const main = document.querySelector('.tmain'), side = main.querySelector('.side'), col = [...main.children].filter(e => e !== side);
  return { rails: [...document.querySelectorAll('.rails .rail')].map(e => ({ id: e.dataset.gwbAd, shown: e.offsetHeight > 0, pushed: e.querySelector('ins').dataset.gwbPushed === '1', ...b(e), slot: b(e.querySelector('.ad-slot')) })),
    guide: b(document.getElementById('guide')), tool: b(document.getElementById('tool')), side: b(side), colBottom: Math.max(...col.map(e => b(e).b)), colArea: col.reduce((a, e) => a + b(e).w * b(e).h, 0),
    n: +side.dataset.ads, fab: b(document.getElementById('gwb-fab')), up: document.getElementById('gwb-top') && b(document.getElementById('gwb-top')), sw: document.documentElement.scrollWidth, H: document.documentElement.scrollHeight }; });
const ov = (a, b) => Math.min(a.r, b.r) - Math.max(a.l, b.l) > 1 && Math.min(a.b, b.b) - Math.max(a.t, b.t) > 1;
const EXPECT = { 1280: { 'budget-calculator': 3, invoice: 3, 'tax-calculator': 3, 'image-compress': 1, 'pdf-tools': 1, 'sales-tax': 2 }, 1440: { 'budget-calculator': 3, invoice: 3, 'barcode-label': 3, 'image-compress': 1, 'pdf-tools': 1 }, 1920: { 'budget-calculator': 3, 'barcode-label': 3, 'image-compress': 1, 'pdf-tools': 1 } };
for (const w of [1280, 1440, 1920]) test(`side units at ${w}: 1-3 per tool page in the side column, in order, no overlaps, no page growth, only shown units pushed, ad area < content`, async ({ page, errors }) => {
  test.skip(page.viewportSize().width < 1280, 'sets its own widths'); test.setTimeout(120000);
  for (const slug of TOOLS) {
    await page.setViewportSize({ width: w, height: w === 1920 ? 1080 : w === 1440 ? 900 : 800 }); await open(page, slug); await page.waitForTimeout(100);
    const v = await vis(page), shown = v.rails.filter(r => r.shown), m = `${slug} @${w}`;
    expect(shown.length, m).toBe(v.n); expect(v.n, m).toBeGreaterThanOrEqual(1); expect(v.n, m).toBeLessThanOrEqual(3);
    if (EXPECT[w][slug]) expect(v.n, m).toBe(EXPECT[w][slug]);
    expect(shown.map(r => r.id), m).toEqual(['rail', 'rail2', 'rail3'].slice(0, v.n));   // fill in order, never skip
    for (const r of v.rails) expect(r.pushed, `${m} ${r.id} pushed only if shown`).toBe(r.shown);
    for (const [i, r] of shown.entries()) {
      expect(r.l, m).toBeGreaterThan(v.tool.r); expect(r.t, m).toBeGreaterThanOrEqual(v.guide.b); expect(ov(r, v.guide), m).toBe(false); expect(ov(r, v.tool), m).toBe(false);
      expect(r.slot.h, m).toBeGreaterThanOrEqual(i ? 280 : 600); expect(r.r, m).toBeLessThanOrEqual(v.fab.l); if (v.up && v.up.w > 0) expect(r.r, m).toBeLessThanOrEqual(v.up.l);
      if (i) expect(r.t - shown[i - 1].b, `${m} gap`).toBeGreaterThanOrEqual(20);
      expect(await page.locator(`[data-gwb-ad="${r.id}"]`).evaluate(e => getComputedStyle(e).position), m).toBe('static');
    }
    if (v.n > 1) expect(v.side.b, `${m} side column stays inside the main column`).toBeLessThanOrEqual(v.colBottom + 30);
    if (v.n > 1) { const H1 = await page.evaluate(() => { document.querySelectorAll('.rails .rx').forEach(e => e.style.display = 'none'); const h = document.documentElement.scrollHeight; document.querySelectorAll('.rails .rx').forEach(e => e.style.display = ''); return h; });
      expect(v.H, `${m} extra units never lengthen the page`).toBe(H1); }
    const adArea = shown.reduce((a, r) => a + r.w * r.h, 0); expect(adArea, `${m} ad density`).toBeLessThan(v.colArea * 0.5);
    expect(v.sw, m).toBeLessThanOrEqual(w);
    for (const y of [0, 0.33, 0.66, 1]) { await page.evaluate(f => scrollTo(0, f * document.body.scrollHeight), y); const f = await page.locator('#gwb-fab').evaluate(e => { const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top + scrollY, b: r.bottom + scrollY }; });
      for (const r of shown) expect(ov(r, f), `${m} fab`).toBe(false); }
  }
});
test('extra side units: hidden + not pushed on mobile/tablet widths; each collapses when unfilled without moving the others up the page', async ({ page, errors }) => {
  test.skip(page.viewportSize().width < 1280, 'sets its own widths');
  for (const w of [390, 768, 1100]) { await page.setViewportSize({ width: w, height: 900 }); await open(page, 'budget-calculator');
    for (const id of ['rail', 'rail2', 'rail3']) { const a = page.locator(`[data-gwb-ad="${id}"]`); await expect(a).toBeHidden(); expect(await a.locator('ins').getAttribute('data-gwb-pushed')).toBeNull(); }
    await expect(page.locator('aside.mban')).toBeVisible(); }
  await page.setViewportSize({ width: 1440, height: 900 }); await open(page, 'budget-calculator');
  const H = await page.evaluate(() => document.documentElement.scrollHeight), t3 = (await vis(page)).rails[2].t, tool = (await vis(page)).tool;
  await status(page, '[data-gwb-ad="rail2"] ins', 'unfilled'); await expect(page.locator('[data-gwb-ad="rail2"]')).toBeHidden();
  let v = await vis(page); expect(v.rails[2].shown).toBe(true); expect(v.rails[0].shown).toBe(true); expect(v.H).toBe(H); expect(v.tool).toEqual(tool);
  await status(page, '[data-gwb-ad="rail3"] ins', 'unfilled'); await status(page, '[data-gwb-ad="rail"] ins', 'unfilled');
  v = await vis(page); expect(v.rails.every(r => !r.shown)).toBe(true); expect(v.H).toBe(H); expect(v.tool).toEqual(tool);
  await expect(page.locator('#guide')).toBeVisible();
});
test('hub and info pages keep a single sidebar unit (unchanged)', async ({ page, errors }) => {
  test.skip(page.viewportSize().width < 1280);
  for (const p of ['', 'about/', 'privacy/']) { await open(page, p); await expect(page.locator('aside.rail')).toHaveCount(1); await expect(page.locator('.rails')).toHaveCount(0); await expect(page.locator('aside.rail')).toBeVisible(); }
});
