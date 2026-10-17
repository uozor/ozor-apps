import { test, expect, TOOLS, AXE, open } from './helpers.mjs';
for (const slug of TOOLS) {
  test.describe(slug + ' (common)', () => {
    test('loads clean, axe 0, no overlap/hscroll', async ({ page, errors }) => {
      await open(page, slug); await page.waitForTimeout(2000);
      await page.addScriptTag({ content: AXE });
      const v = await page.evaluate(async () => (await axe.run(document, { resultTypes: ['violations'] })).violations.map(x => x.id + ':' + x.nodes.length));
      expect(v).toEqual([]);
      const ov = await page.evaluate(() => { const W = document.documentElement.clientWidth, out = []; if (document.documentElement.scrollWidth > W + 1) out.push('hscroll');
        const els = [...document.querySelectorAll('h1,h2,h3,p,li,label,button,a,input,select,textarea,summary')].filter(e => { const r = e.getBoundingClientRect(), s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && !e.closest('[hidden],.vh') });
        for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) { const a = els[i], c = els[j]; if (a.contains(c) || c.contains(a)) continue; const r = a.getBoundingClientRect(), s = c.getBoundingClientRect(); const ox = Math.min(r.right, s.right) - Math.max(r.left, s.left), oy = Math.min(r.bottom, s.bottom) - Math.max(r.top, s.top); if (ox > 2 && oy > 2) out.push(a.tagName + '/' + c.tagName + ':' + (a.textContent || a.id).trim().slice(0, 20) + '|' + (c.textContent || c.id).trim().slice(0, 20)) } return out });
      expect(ov).toEqual([]);
      // design/SEO/ads intact
      await expect(page.locator('script[src*="adsbygoogle.js?client=ca-pub-6757646035709684"]')).toHaveCount(1);
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
