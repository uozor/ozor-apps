// Search Console verification meta: exactly once per page, inside <head>, next to the other verification meta.
import { test, expect, TOOLS } from './helpers.mjs';
const GSV = '<meta name="google-site-verification" content="a_trf1N_NTYLqAoX0uL9V8Ecp7slrBl4NI1GDStobpg" />';
test('google-site-verification meta once in head on every page', async ({ request }, ti) => {
  test.skip(ti.project.name !== 'desktop', 'runs once');
  for (const p of ['', 'about/', 'privacy/', 'terms/', 'contact/', ...TOOLS.map(t => t + '/')]) { const h = await (await request.get('/' + p)).text();
    expect(h.split(GSV).length - 1, p).toBe(1); expect(h.indexOf(GSV), p).toBeLessThan(h.indexOf('</head>')); expect(h, p).toContain("e72e20b1-cddd-4866-96ce-bc2e26b35368'>" + GSV); }
});
