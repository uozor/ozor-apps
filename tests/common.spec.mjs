import { test, expect, TOOLS, AXE, open } from './helpers.mjs';
for (const slug of TOOLS) {
  test.describe(slug + ' (common)', () => {
    test('loads clean, axe 0, no overlap/hscroll', async ({ page, errors }) => {
      await open(page, slug); await page.waitForTimeout(2000);
      await page.addScriptTag({ content: AXE });
      const v = await page.evaluate(async () => (await axe.run(document, { resultTypes: ['violations'] })).violations.map(x => x.id + ':' + x.nodes.length));
      expect(v).toEqual([]);
      const ov = await page.evaluate(() => { const W = document.documentElement.clientWidth, out = []; if (document.documentElement.scrollWidth > W + 1) out.push('hscroll');
        const clipOne = (box, e) => { let r = { left: box.left, top: box.top, right: box.right, bottom: box.bottom }; for (let p = e.parentElement; p && p !== document.documentElement; p = p.parentElement) { const s = getComputedStyle(p); if (!/auto|scroll|hidden|clip/.test(s.overflowY + s.overflowX + s.overflow)) continue; const b = p.getBoundingClientRect(); const left = Math.max(r.left, b.left), top = Math.max(r.top, b.top), right = Math.min(r.right, b.right), bottom = Math.min(r.bottom, b.bottom); r = { left, top, right, bottom }; if (right - left <= 2 || bottom - top <= 2) return null; } return r; };
        const els = [...document.querySelectorAll('h1,h2,h3,p,li,label,button,a,input,select,textarea,summary')].map(e => ({ e, rs: [...e.getClientRects()].map(r => clipOne(r, e)).filter(Boolean) })).filter(x => x.rs.length && getComputedStyle(x.e).visibility !== 'hidden' && !x.e.closest('[hidden],.vh'));
        const hit = (r, s) => Math.min(r.right, s.right) - Math.max(r.left, s.left) > 2 && Math.min(r.bottom, s.bottom) - Math.max(r.top, s.top) > 2;
        for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) { const a = els[i], c = els[j]; if (a.e.contains(c.e) || c.e.contains(a.e)) continue; if (a.rs.some(r => c.rs.some(s => hit(r, s)))) out.push(a.e.tagName + '/' + c.e.tagName + ':' + (a.e.textContent || a.e.id).trim().slice(0, 24) + '|' + (c.e.textContent || c.e.id).trim().slice(0, 24)); } return out.slice(0, 8); });
      expect(ov).toEqual([]);
      // design/SEO/ads intact
      await expect(page.locator('script[src*="adsbygoogle.js?client=ca-pub-9780755121157050"]')).toHaveCount(1);
      await expect(page.locator('link[rel=canonical]')).toHaveCount(1);
      await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);
      await expect(page.locator('#gwb-fab')).toBeVisible();
      await expect(page.locator('script[src="../safe.js"]')).toHaveCount(1);
    });
    test('keyboard-only: tab reaches and activates tool controls', async ({ page, errors }) => {
      await open(page, slug);
      await page.locator('#tool').evaluate(e => { e.setAttribute('tabindex', '-1'); e.focus(); });
      const seen = new Set();
      for (let i = 0; i < 40; i++) { await page.keyboard.press('Tab'); const info = await page.evaluate(() => { const a = document.activeElement; return { inTool: !!a.closest('#tool'), tag: a.tagName, vis: a.getBoundingClientRect().width > 0 } }); if (info.inTool) { expect(info.vis).toBe(true); seen.add(info.tag); } }
      expect(seen.size).toBeGreaterThan(0);
      // Activate the first enabled tool button with Enter (should never throw)
      const btn = page.locator('#tool button:not([disabled])').first();
      if (await btn.count()) { await btn.focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(300); }
    });
    test('keeps working offline after load', async ({ page, context, errors }) => {
      await open(page, slug); await context.setOffline(true);
      const btn = page.locator('#tool button:not([disabled])').first();
      if (await btn.count()) { await btn.click(); await page.waitForTimeout(300); }
      await context.setOffline(false);
    });
  });
}
for (const [slug, lib, file] of [['pdf-tools', 'PDFLib', 'pdf-lib.min.js'], ['audio', 'lamejs', 'lame.min.js'], ['video-to-mp3', 'lamejs', 'lame.min.js'], ['qr-bio', 'qrcode', 'qrcode.js']]) {
  test(`${slug}: graceful fallback when ${lib} fails to load`, async ({ page, errors }) => {
    await page.route('**/' + file, r => r.abort());
    await open(page, slug); await page.waitForTimeout(300);
    await expect(page.locator('#libfail')).toBeVisible();
    await expect(page.locator('#libfail')).toContainText(/couldn.t load/);
    await expect(page.locator('#libfail button')).toHaveText('Reload page');
  });
}
for (const slug of ['', 'about', 'contact', 'privacy', 'terms']) {
  test(`${slug || 'home'}: axe 0, no hscroll, company links in nav and footer`, async ({ page, errors }) => {
    await open(page, slug); await page.waitForTimeout(400);
    await page.addScriptTag({ content: AXE });
    const v = await page.evaluate(async () => (await axe.run(document, { resultTypes: ['violations'] })).violations.map(x => x.id + ':' + x.nodes.length));
    expect(v).toEqual([]);
    const sw = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, w: innerWidth }));
    expect(sw.sw).toBeLessThanOrEqual(sw.w);
    for (const name of ['About', 'Contact', 'Privacy', 'Terms']) {
      await expect(page.locator('nav[aria-label="Main"] a', { hasText: name }).first()).toBeVisible();
      await expect(page.locator('footer a', { hasText: name }).first()).toBeVisible();
    }
  });
}
