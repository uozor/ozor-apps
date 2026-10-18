// Search Console verification meta: exactly once per page, inside <head>, next to the other verification meta.
import { test, expect, TOOLS } from './helpers.mjs';
const GSV = '<meta name="google-site-verification" content="a_trf1N_NTYLqAoX0uL9V8Ecp7slrBl4NI1GDStobpg" />';
test('google-site-verification meta once in head on every page', async ({ request }, ti) => {
  test.skip(ti.project.name !== 'desktop', 'runs once');
  for (const p of ['', 'about/', 'privacy/', 'terms/', 'contact/', ...TOOLS.map(t => t + '/')]) { const h = await (await request.get('/' + p)).text();
    expect(h.split(GSV).length - 1, p).toBe(1); expect(h.indexOf(GSV), p).toBeLessThan(h.indexOf('</head>')); expect(h, p).toContain("e72e20b1-cddd-4866-96ce-bc2e26b35368'>" + GSV); }
});
const FAZ = '<a href="https://fazier.com" target="_blank" rel="noopener"><img src="https://fazier.com/api/v1//public/badges/launch_badges.svg?badge_type=launched&theme=light" width="120" height="51" alt="Featured on Fazier" loading="lazy" /></a>';
test('Fazier badge: once per page inside the footer, followed link (no nofollow/sponsored)', async ({ request }, ti) => {
  test.skip(ti.project.name !== 'desktop', 'runs once');
  for (const p of ['', 'about/', 'privacy/', 'terms/', 'contact/', ...TOOLS.map(t => t + '/')]) { const h = await (await request.get('/' + p)).text(), f = h.slice(h.lastIndexOf('<footer>'), h.lastIndexOf('</footer>'));
    expect(h.split(FAZ).length - 1, p).toBe(1); expect(f, p).toContain(FAZ); expect(h, p).not.toMatch(/fazier\.com"[^>]*(nofollow|sponsored|ugc)/); }
});
import { open } from './helpers.mjs';
for (const p of ['', 'invoice', 'privacy']) test(`Fazier badge on ${p || 'hub'}: reserved 120x51 box (no shift), no overlap with helper / back-to-top`, async ({ page, errors }) => {
  await open(page, p); await page.evaluate(() => scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(150);
  const r = await page.evaluate(() => { const b = e => { const x = e && e.getBoundingClientRect(); return x && { l: x.left, r: x.right, t: x.top, b: x.bottom, w: x.width, h: x.height }; };
    return { img: b(document.querySelector('.fbadge img')), fab: b(document.getElementById('gwb-fab')), up: b(document.getElementById('gwb-top')), sw: document.documentElement.scrollWidth, W: innerWidth }; });
  expect(r.fab, "helper present").toBeTruthy(); expect(Math.round(r.img.w)).toBe(120); expect(Math.round(r.img.h)).toBe(51); expect(r.sw).toBeLessThanOrEqual(r.W);
  const ov = (a, b) => b && b.w > 0 && Math.min(a.r, b.r) - Math.max(a.l, b.l) > 0 && Math.min(a.b, b.b) - Math.max(a.t, b.t) > 0;
  expect(ov(r.img, r.fab)).toBe(false); expect(ov(r.img, r.up)).toBe(false);
});
