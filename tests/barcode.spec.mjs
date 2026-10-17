import { test, expect, open, expectInvalid, noBadText } from './helpers.mjs';
import { standardSuite, grab, today, xlsxRows, pdfText } from './newtool.mjs';
const S = 'barcode-label';
async function codes(page, type, txt) { await page.selectOption('#bctype', type); await page.fill('#bccodes', txt); }
test.describe('barcode & labels', () => {
  test('check digits (unit)', async ({ page, errors }) => {
    await open(page, S);
    const r = await page.evaluate(() => [bcValidate('400638133393', 'EAN13'), bcValidate('4006381333931', 'EAN13'), bcValidate('4006381333932', 'EAN13'), bcValidate('03600029145', 'UPC'), bcValidate('036000291452', 'UPC'), bcValidate('12345', 'UPC'), bcValidate('12A456789012', 'EAN13'), bcValidate('héllo', 'CODE128')]);
    expect(r[0]).toMatchObject({ code: '4006381333931', check: 1, added: true }); expect(r[1].code).toBe('4006381333931'); expect(r[2].err).toContain('last digit should be 1');
    expect(r[3]).toMatchObject({ code: '036000291452', check: 2 }); expect(r[4].code).toBe('036000291452'); expect(r[5].err).toContain('needs 11 digits'); expect(r[6].err).toContain('only contain digits'); expect(r[7].err).toContain('keyboard characters');
  });
  test('preview, sheet layout and copies', async ({ page, errors }) => {
    await open(page, S); await expect(page.locator('#bcone svg rect').first()).toBeAttached(); await expect(page.locator('#bcone')).toContainText('SKU-10042');
    await expect(page.locator('.bclab')).toHaveCount(6); await expect(page.locator('#bcsum')).toHaveText('6 labels on 1 Avery 5160 sheet.');
    await page.fill('#bccopies', '20'); await expect(page.locator('#bcsum')).toContainText('40 labels on 2 Avery 5160 sheets'); await expect(page.locator('.bcpage')).toHaveCount(2);
    await page.selectOption('#bctpl', '5167'); await expect(page.locator('#bcsum')).toContainText('on 1 Avery 5167 sheet'); await expect(page.locator('.bclab span')).toHaveCount(0);
    await codes(page, 'EAN13', '400638133393'); await expect(page.locator('#bcmsg')).toContainText('4006381333931'); await expect(page.locator('#bcone')).toContainText('4006381333931');
    await codes(page, 'QR', 'https://greaterworldmedia.tech/'); await expect(page.locator('#bcone svg path')).toBeAttached(); await noBadText(page);
  });
  test('SVG, PNG and label sheet PDF downloads; print', async ({ page, errors }) => {
    await open(page, S);
    const s = await grab(page, '#bcsvg'); expect(s.name).toBe('barcode-SKU-10042.svg'); expect(s.buf.toString()).toContain('<svg'); expect(s.buf.toString()).toContain('SKU-10042');
    const p = await grab(page, '#bcpng'); expect(p.buf.subarray(1, 4).toString()).toBe('PNG'); expect(p.buf.readUInt32BE(16)).toBeGreaterThan(300);
    await page.fill('#bccopies', '20');
    const d = await grab(page, '#bcpdf'); expect(d.name).toBe(`gwb-labels-avery-5160-${today}.pdf`); const t = pdfText(d.buf); expect(t.startsWith('%PDF-')).toBe(true);
    expect((t.match(/\/Type \/Page\b/g) || []).length).toBe(2); expect((t.match(/\/Subtype \/Image/g) || []).length).toBeGreaterThanOrEqual(1); expect(t).toContain('Blue mug - $14.00');
    await expect(page.locator('#bcst')).toContainText('2 pages'); await page.click('#bcprint'); expect(await page.evaluate(() => window.__printed)).toBe(1);
  });
  test('edge cases', async ({ page, errors }) => {
    await open(page, S); await codes(page, 'UPC', '03600029145\n036000291453'); await expectInvalid(page, '#bccodes'); await expect(page.locator('#bccodes-err')).toContainText('Line 2');
    await page.click('#bcpdf'); await expect(page.locator('#bcst')).toContainText('Fix the highlighted');
    await page.fill('#bccodes', ''); await expectInvalid(page, '#bccodes'); await codes(page, 'CODE128', 'ABC'); await page.fill('#bccopies', '0'); await expectInvalid(page, '#bccopies');
    await page.fill('#bccopies', '1.5'); await expectInvalid(page, '#bccopies'); await page.fill('#bccopies', '1'); await expect(page.locator('#bcsum')).toContainText('1 label on 1');
  });
  test('UPC with leading zero stays text in Excel', async ({ page, errors }) => {
    await open(page, S); await codes(page, 'UPC', '03600029145 | Cereal | $3.99');
    const { buf } = await grab(page, '[data-gwbx="xlsx"]'); const rows = xlsxRows(buf); const r = rows.find(r => r[1] === '036000291452'); expect(r).toBeTruthy(); expect(String(r[3])).toBe('2');
  });
});
standardSuite(S, { stem: 'barcodes', fmts: ['pdf', 'xlsx', 'csv'], want: ['Barcode Label List', 'SKU-10042', 'Blue mug'] });
