import { test, expect, open, expectInvalid, noBadText } from './helpers.mjs';
import { standardSuite, grab } from './newtool.mjs';
import { execFileSync } from 'child_process'; import fs from 'fs'; import os from 'os'; import path from 'path';
const S = 'logo-maker';
const pngSize = b => [b.readUInt32BE(16), b.readUInt32BE(20)];
test.describe('logo maker', () => {
  test('preview updates; layouts; icon pick; contrast warning', async ({ page, errors }) => {
    await open(page, S); const pv = page.locator('#lgpv svg');
    await expect(pv).toContainText('Bloom Bakery'); await expect(pv).toContainText('Fresh every morning');
    await page.fill('#lgname', 'Acme & <Co>'); await expect(pv).toContainText('Acme & <Co>');
    await page.selectOption('#lglay', 'icon'); await expect(pv.locator('text')).toHaveCount(0);
    await page.selectOption('#lglay', 'top'); await expect(pv.locator('text').first()).toHaveAttribute('text-anchor', 'middle');
    await page.locator('#lgiconset label').first().click(); await expect(page.locator('#lgiconset input').first()).toBeChecked();
    await page.locator('#lgtc').evaluate(e => { e.value = '#f0f0f0'; e.dispatchEvent(new Event('input', { bubbles: true })); });
    await expect(page.locator('#lgwarn')).toContainText('Low contrast');
    await expect(page.locator('#lgfav img')).toHaveCount(3); await noBadText(page);
  });
  test('SVG and PNG downloads', async ({ page, errors }) => {
    await open(page, S);
    const s = await grab(page, '#lgsvg'); expect(s.name).toBe('bloom-bakery-logo.svg'); const t = s.buf.toString(); expect(t).toMatch(/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/); expect(t).toContain('Bloom Bakery');
    const p = await grab(page, '#lgpng'); expect(p.name).toBe('bloom-bakery-logo.png'); expect(p.buf.subarray(1, 4).toString()).toBe('PNG'); expect(pngSize(p.buf)[0]).toBe(2000);
    await expect(page.locator('#lgst')).toContainText('2000×');
  });
  test('favicon.ico has 16/32/48 PNG entries', async ({ page, errors }) => {
    await open(page, S); const { name, buf } = await grab(page, '#lgico'); expect(name).toBe('favicon.ico');
    expect([buf.readUInt16LE(0), buf.readUInt16LE(2), buf.readUInt16LE(4)]).toEqual([0, 1, 3]);
    const sizes = [0, 1, 2].map(i => buf[6 + 16 * i]); expect(sizes).toEqual([16, 32, 48]);
    for (let i = 0; i < 3; i++) { const off = buf.readUInt32LE(6 + 16 * i + 12); expect(buf.subarray(off + 1, off + 4).toString()).toBe('PNG'); expect(pngSize(buf.subarray(off))[0]).toBe(sizes[i]); }
  });
  test('favicon pack zip is valid and complete', async ({ page, errors }) => {
    await open(page, S); const { name, buf } = await grab(page, '#lgzip'); expect(name).toBe('bloom-bakery-favicon-pack.zip');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fav-')), f = path.join(dir, 'p.zip'); fs.writeFileSync(f, buf);
    const list = execFileSync('python3', ['-c', 'import zipfile,sys;z=zipfile.ZipFile(sys.argv[1]);assert z.testzip() is None;print("\\n".join(z.namelist()))', f]).toString();
    for (const n of ['favicon.ico', 'favicon-16x16.png', 'favicon-32x32.png', 'apple-touch-icon.png', 'android-chrome-192x192.png', 'android-chrome-512x512.png', 'site.webmanifest', 'head-tags.html', 'favicon.svg']) expect(list).toContain(n);
    const man = JSON.parse(execFileSync('python3', ['-c', 'import zipfile,sys;print(zipfile.ZipFile(sys.argv[1]).read("site.webmanifest").decode())', f]).toString()); expect(man.name).toBe('Bloom Bakery');
    const a = execFileSync('python3', ['-c', 'import zipfile,sys,struct;d=zipfile.ZipFile(sys.argv[1]).read("apple-touch-icon.png");print(struct.unpack(">II",d[16:24]))', f]).toString(); expect(a.trim()).toBe('(180, 180)');
  });
  test('edge cases: empty name, icon-only, text-only favicon', async ({ page, errors }) => {
    await open(page, S); await page.fill('#lgname', ''); await expectInvalid(page, '#lgname'); await page.click('#lgsvg'); await expect(page.locator('#lgpv svg')).toHaveCount(0);
    await page.selectOption('#lglay', 'icon'); await expect(page.locator('#lgpv svg')).toHaveCount(1); const s = await grab(page, '#lgsvg'); expect(s.name).toBe('logo-logo.svg');
    await page.fill('#lgname', 'Zed'); await page.selectOption('#lglay', 'text'); await expect(page.locator('#lgpv svg rect')).toHaveCount(0);
    const f = await page.evaluate(() => favSVG({ name: 'Zed', lay: 'text', font: 'sans', ic: '#123456', icon: 'star', shape: 'none' })); expect(f).toContain('>Z<');
  });
});
standardSuite(S, { stem: 'logo-brand-sheet', fmts: ['pdf', 'csv'], want: ['Bloom Bakery: Brand Sheet', 'Brand colors', '#E8366B'] });
