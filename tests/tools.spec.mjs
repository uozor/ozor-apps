import { test, expect, open, fx, bigFile, denyClipboard, expectInvalid, expectValid, noBadText } from './helpers.mjs';
const EMOJI = '🚀 Café ünïcødé — 日本語', RTL = 'مرحبا بالعالم שלום', XSS = '<img src=x onerror="window.__xss=1">"\'&';
const huge = n => 'lorem ipsum dolor '.repeat(n);
const setVal = (page, sel, v) => page.locator(sel).evaluate((e, v) => { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }, v);
const noXss = async page => expect(await page.evaluate(() => window.__xss)).toBeUndefined();

test.describe('invoice', () => {
  test('happy path totals and print', async ({ page, errors }) => {
    await open(page, 'invoice'); await expect(page.locator('#total')).toHaveText('Total: $560.00');
    await setVal(page, '#tax', '10'); await expect(page.locator('#total')).toHaveText('Total: $616.00');
    await page.getByRole('button', { name: 'Download PDF' }).click(); expect(await page.evaluate(() => window.__printed)).toBe(1);
  });
  test('negative / empty / NaN numbers show inline errors, never NaN', async ({ page, errors }) => {
    await open(page, 'invoice');
    await setVal(page, '#items tr:nth-child(2) input[aria-label="Quantity"]', '-3'); await expectInvalid(page, '#items tr:nth-child(2) input[aria-label="Quantity"]');
    await setVal(page, '#items tr:nth-child(2) input[aria-label="Unit price"]', ''); await expectInvalid(page, '#items tr:nth-child(2) input[aria-label="Unit price"]');
    await setVal(page, '#tax', '-5'); await expectInvalid(page, '#tax'); await setVal(page, '#tax', '150'); await expectInvalid(page, '#tax');
    await noBadText(page);
    await setVal(page, '#items tr:nth-child(2) input[aria-label="Quantity"]', '2'); await setVal(page, '#items tr:nth-child(2) input[aria-label="Unit price"]', '5'); await setVal(page, '#tax', '0');
    await expectValid(page, '#tax'); await expect(page.locator('#total')).toHaveText('Total: $70.00');
  });
  test('special chars, emoji, RTL and XSS are escaped', async ({ page, errors }) => {
    await open(page, 'invoice'); await setVal(page, '#cur', XSS); await setVal(page, '#from', EMOJI + '\n' + RTL); await setVal(page, '#num', XSS);
    await page.getByRole('button', { name: '+ Add item' }).click();
    await setVal(page, '#items tr:last-child input[aria-label="Item description"]', XSS);
    await noXss(page); await expect(page.locator('#doc')).toContainText(RTL); await expect(page.locator('#doc')).toContainText('onerror');
  });
  test('huge input: 300 rows and 50k-char notes', async ({ page, errors }) => {
    await open(page, 'invoice');
    for (let i = 0; i < 300; i++) await page.evaluate(() => addRow('x', 1, 1));
    await setVal(page, '#notes', huge(3000)); await expect(page.locator('#total')).toHaveText('Total: $860.00');
  });
});

test.describe('resume', () => {
  test('happy path', async ({ page, errors }) => { await open(page, 'resume'); await expect(page.locator('#out')).toContainText('Managed customer emails'); });
  test('empty bullet -> inline error, previous output kept', async ({ page, errors }) => {
    await open(page, 'resume'); const before = await page.locator('#out').innerText();
    await page.fill('#orig', '   '); await page.getByRole('button', { name: 'Improve bullets' }).click();
    await expectInvalid(page, '#orig'); expect(await page.locator('#out').innerText()).toBe(before);
    await page.fill('#orig', 'wrote reports'); await page.getByRole('button', { name: 'Improve bullets' }).click(); await expectValid(page, '#orig');
  });
  test('emoji/RTL/XSS/huge input', async ({ page, errors }) => {
    await open(page, 'resume'); for (const v of [EMOJI, RTL, XSS]) { await page.fill('#orig', v); await page.getByRole('button', { name: 'Improve bullets' }).click(); } await noXss(page);
    await page.fill('#orig', huge(2000)); await page.getByRole('button', { name: 'Improve bullets' }).click(); await expectInvalid(page, '#orig');
  });
  test('copy works even when clipboard is blocked', async ({ page, errors }) => { await open(page, 'resume'); await denyClipboard(page); await page.getByRole('button', { name: 'Copy all' }).click(); await expect(page.locator('.gwb-toast')).toBeVisible(); });
});

test.describe('meeting-cost', () => {
  test('happy path + repeated start clicks', async ({ page, errors }) => {
    await open(page, 'meeting-cost'); await expect(page.locator('#plan')).toHaveText('$330.00');
    const s = page.getByRole('button', { name: 'Start' }); for (let i = 0; i < 6; i++) await s.click();
    await page.waitForTimeout(1300); await page.getByRole('button', { name: 'Pause' }).click(); await expect(page.locator('#clock')).toHaveText('00:01');
    await page.getByRole('button', { name: 'Reset' }).click(); await expect(page.locator('#live')).toHaveText('$0.00');
  });
  test('invalid numbers', async ({ page, errors }) => {
    await open(page, 'meeting-cost');
    await setVal(page, '#n', '-4'); await expectInvalid(page, '#n'); await setVal(page, '#rate', ''); await expectInvalid(page, '#rate');
    await setVal(page, '#mins', '1e20'); await expectInvalid(page, '#mins'); await setVal(page, '#sal', '-100'); await expectInvalid(page, '#sal');
    await noBadText(page); await expect(page.locator('#plan')).toHaveText('$330.00'); // last good value kept
    await setVal(page, '#n', '2'); await setVal(page, '#rate', '60'); await setVal(page, '#mins', '30'); await expect(page.locator('#plan')).toHaveText('$60.00');
  });
});

test.describe('qr-bio', () => {
  test('happy path QR + bio', async ({ page, errors }) => {
    await open(page, 'qr-bio'); await expect(page.locator('#qr img')).toHaveCount(1);
    const dl = page.waitForEvent('download'); await page.getByRole('button', { name: 'Download PNG' }).click(); expect((await dl).suggestedFilename()).toBe('qrcode.png');
    const d2 = page.waitForEvent('download'); await page.getByRole('button', { name: 'Download bio.html' }).click(); expect((await d2).suggestedFilename()).toBe('bio.html');
  });
  test('too-long and empty QR text -> friendly inline error, input kept', async ({ page, errors }) => {
    await open(page, 'qr-bio'); const long = 'x'.repeat(5000); await page.fill('#qrtext', long); await page.getByRole('button', { name: 'Generate QR' }).click();
    await expectInvalid(page, '#qrtext'); expect(await page.inputValue('#qrtext')).toBe(long);
    await page.getByRole('button', { name: 'Download PNG' }).click();
    await page.fill('#qrtext', ''); await page.getByRole('button', { name: 'Generate QR' }).click(); await expectInvalid(page, '#qrtext');
    await page.fill('#qrtext', EMOJI + RTL); await page.getByRole('button', { name: 'Generate QR' }).click(); await expectValid(page, '#qrtext');
  });
  test('unsafe javascript: links are stripped from bio page', async ({ page, errors }) => {
    await open(page, 'qr-bio'); await setVal(page, '#blinks', 'Bad | javascript:alert(1)\nGood | https://ok.example\n' + XSS + ' | https://x.example');
    const doc = await page.locator('#prev').getAttribute('srcdoc'); expect(doc).not.toContain('javascript:'); expect(doc).toContain('https://ok.example'); await noXss(page);
    await expect(page.locator('#blinks-err')).toContainText(/link/i);
  });
  test('Generate when QR library is missing -> friendly message', async ({ page, errors }) => {
    await page.route('**/qrcode.js', r => r.abort()); await open(page, 'qr-bio');
    await page.getByRole('button', { name: 'Generate QR' }).click(); await expect(page.locator('#qrst')).toContainText(/didn.t load/);
    await page.getByRole('button', { name: 'Download PNG' }).click();
    await page.getByRole('button', { name: 'Download bio.html' }).click(); // bio still works
  });
});

test.describe('policy', () => {
  test('happy path all kinds + download', async ({ page, errors }) => {
    await open(page, 'policy'); for (const k of ['privacy', 'terms', 'refund']) { await page.selectOption('#kind', k); await expect(page.locator('#out')).toContainText(k === 'privacy' ? 'PRIVACY POLICY' : k === 'terms' ? 'TERMS OF SERVICE' : 'within 30 days'); }
    const d = page.waitForEvent('download'); await page.getByRole('button', { name: 'Download .txt' }).click(); expect((await d).suggestedFilename()).toBe('refund-policy.txt');
  });
  test('invalid refund days and empty name', async ({ page, errors }) => {
    await open(page, 'policy'); await page.selectOption('#kind', 'refund');
    await setVal(page, '#days', '-5'); await expectInvalid(page, '#days'); await expect(page.locator('#out')).not.toContainText('-5');
    await setVal(page, '#days', '2.5'); await expectInvalid(page, '#days');
    await setVal(page, '#biz', ''); await expectInvalid(page, '#biz');
    await setVal(page, '#em', 'not-an-email'); await expectInvalid(page, '#em');
    await setVal(page, '#biz', EMOJI + RTL); await setVal(page, '#days', '14'); await setVal(page, '#em', 'a@b.co'); await expect(page.locator('#out')).toContainText('within 14 days');
  });
  test('copy blocked', async ({ page, errors }) => { await open(page, 'policy'); await denyClipboard(page); await page.getByRole('button', { name: 'Copy', exact: true }).click(); await expect(page.locator('.gwb-toast')).toBeVisible(); });
});

for (const slug of ['audio', 'video-to-mp3']) {
  const inp = slug === 'audio' ? '#file' : '#f', st = slug === 'audio' ? '#info' : '#st', go = slug === 'audio' ? '#exp' : '#go', good = slug === 'audio' ? 'tone.wav' : 'clip.mp4';
  test.describe(slug, () => {
    test('happy path MP3 and WAV export', async ({ page, errors }) => {
      await open(page, slug); await page.setInputFiles(inp, fx(good)); await expect(page.locator(st)).toContainText(/3\.0 s|2\.\d s|Audio found/);
      for (const f of ['mp3', 'wav']) { await page.selectOption('#fmt', f); await page.click(go); await expect.poll(() => page.evaluate(() => window.lastExport && window.lastExport.type)).toBe(f === 'mp3' ? 'audio/mpeg' : 'audio/wav'); await page.evaluate(() => window.lastExport = null); }
    });
    test('mp3 input decodes', async ({ page, errors }) => { await open(page, slug); await page.setInputFiles(inp, fx('tone.mp3')); await expect(page.locator(go)).toBeEnabled(); });
    for (const [f, re] of [['notes.txt', /doesn.t look like/], ['empty.wav', /empty \(0 bytes\)/], ['corrupt.mp3', /couldn.t|could not/], ...(slug === 'audio' ? [['odd.mkv', /doesn.t look/]] : [])]) {
      test(`rejects ${f} with a friendly message`, async ({ page, errors }) => {
        await open(page, slug); await page.setInputFiles(inp, fx(f)); await expect(page.locator(st)).toContainText(re); await expect(page.locator(go)).toBeDisabled();
      });
    }
    if (slug === 'video-to-mp3') test('uncommon container/codec (mkv, mu-law PCM) is accepted', async ({ page, errors }) => { await open(page, slug); await page.setInputFiles(inp, fx('odd.mkv')); await expect(page.locator(go)).toBeEnabled(); });
    if (slug === 'video-to-mp3') test('video without audio track', async ({ page, errors }) => { await open(page, slug); await page.setInputFiles(inp, fx('silent.mp4')); await expect(page.locator(st)).toContainText(/no audio/i); await expect(page.locator(go)).toBeDisabled(); });
    test('very large file rejected before reading (memory guard)', async ({ page, errors }) => {
      await open(page, slug); await page.setInputFiles(inp, bigFile(slug === 'audio' ? 'big.wav' : 'big.mp4')); await expect(page.locator(st)).toContainText(/MB limit/);
    });
    test('good file after bad file recovers; repeated export clicks run once', async ({ page, errors }) => {
      await open(page, slug); await page.setInputFiles(inp, fx('corrupt.mp3')); await page.setInputFiles(inp, fx(good)); await expect(page.locator(go)).toBeEnabled();
      await page.selectOption('#fmt', 'wav'); await page.evaluate(id => { window.__n = 0; const o = URL.createObjectURL; URL.createObjectURL = b => { if (b && b.type === 'audio/wav') window.__n++; return o(b) }; const b = document.querySelector(id); for (let i = 0; i < 5; i++) b.click(); }, go);
      await expect.poll(() => page.evaluate(() => window.__n)).toBe(1); await page.waitForTimeout(500); expect(await page.evaluate(() => window.__n)).toBe(1);
    });
    test('MP3 export when encoder failed to load -> friendly + retry', async ({ page, errors }) => {
      await page.route('**/lame.min.js', r => r.abort()); await open(page, slug); await page.setInputFiles(inp, fx(good)); await expect(page.locator(go)).toBeEnabled();
      await page.selectOption('#fmt', 'mp3'); await page.click(go); const sx = slug === 'audio' ? '#status' : '#st';
      await expect(page.locator(sx)).toContainText(/didn.t load/); await expect(page.locator(sx + ' .gwb-retry')).toBeVisible();
      await page.selectOption('#fmt', 'wav'); await page.click(go); await expect.poll(() => page.evaluate(() => window.lastExport && window.lastExport.type)).toBe('audio/wav');
    });
  });
}
test('audio: invalid trim/fade numbers', async ({ page, errors }) => {
  await open(page, 'audio'); await page.setInputFiles('#file', fx('tone.wav')); await expect(page.locator('#exp')).toBeEnabled();
  await setVal(page, '#fi', '-2'); await expectInvalid(page, '#fi'); await setVal(page, '#fo', 'abc'); 
  await setVal(page, '#s', '99'); await setVal(page, '#e', '-1'); await noBadText(page);
  await page.click('#exp'); await expect(page.locator('#status')).toContainText(/fix/i);
  await setVal(page, '#fi', '0'); await setVal(page, '#fo', '0'); await page.selectOption('#fmt', 'wav'); await page.click('#exp');
  await expect.poll(() => page.evaluate(() => window.lastExport && window.lastExport.size)).toBeGreaterThan(44);
  await page.click('#play'); await page.click('#play');
});

test.describe('image-compress', () => {
  for (const f of ['photo.jpg', 'alpha.png', 'pic.webp', 'huge.jpg']) test('happy ' + f, async ({ page, errors }) => {
    await open(page, 'image-compress'); await page.setInputFiles('#f', fx(f)); await expect(page.locator('#dl')).toBeVisible({ timeout: 20000 }); await expect(page.locator('#st')).toContainText('→');
    for (const o of ['image/webp', 'image/png']) { await page.selectOption('#o', o); } await page.click('#go'); await expect(page.locator('#st')).toContainText('→');
  });
  for (const [f, re] of [['corrupt.png', /couldn.t|could not/], ['empty.png', /empty/], ['notes.txt', /doesn.t look like/]]) test('rejects ' + f + ' (after a good image)', async ({ page, errors }) => {
    await open(page, 'image-compress'); await page.setInputFiles('#f', fx('photo.jpg')); await expect(page.locator('#dl')).toBeVisible();
    await page.setInputFiles('#f', fx(f)); await expect(page.locator('#st')).toContainText(re); await expect(page.locator('#go')).toBeDisabled(); await expect(page.locator('#dl')).toBeHidden();
  });
  test('invalid width; very large file', async ({ page, errors }) => {
    await open(page, 'image-compress'); await page.setInputFiles('#f', fx('photo.jpg')); await expect(page.locator('#dl')).toBeVisible();
    for (const v of ['-5', '0', '99999']) { await setVal(page, '#w', v); await page.click('#go'); await expectInvalid(page, '#w'); } await noBadText(page);
    await setVal(page, '#w', '200'); await page.click('#go'); await expect(page.locator('#st')).toContainText('(200×150)');
    await page.setInputFiles('#f', bigFile('big.jpg')); await expect(page.locator('#st')).toContainText(/MB limit/);
  });
});

test.describe('image-convert', () => {
  test('batch happy path', async ({ page, errors }) => {
    await open(page, 'image-convert'); await page.setInputFiles('#f', [fx('photo.jpg'), fx('alpha.png'), fx('pic.webp')]);
    for (const t of ['image/png', 'image/jpeg', 'image/webp']) { await page.selectOption('#to', t); await page.click('#go'); await expect(page.locator('#st')).toHaveText('Converted 3 of 3 image(s).'); }
  });
  test('no files, invalid quality, mixed bad files', async ({ page, errors }) => {
    await open(page, 'image-convert'); await page.click('#go'); await expect(page.locator('#f')).toHaveAttribute('aria-invalid', 'true');
    await page.setInputFiles('#f', [fx('photo.jpg'), fx('corrupt.jpg'), fx('notes.txt'), fx('empty.png')]);
    await setVal(page, '#q', '5'); await page.click('#go'); await expectInvalid(page, '#q');
    await setVal(page, '#q', '0.8'); await page.click('#go'); await expect(page.locator('#st')).toHaveText('Converted 1 of 4 image(s).');
    await expect(page.locator('#list')).toContainText(/empty/); await expect(page.locator('#list')).toContainText(/doesn.t look like/);
  });
  test('repeated clicks convert once; huge file guarded', async ({ page, errors }) => {
    await open(page, 'image-convert'); await page.setInputFiles('#f', [fx('huge.jpg')]);
    await page.evaluate(() => { const b = document.getElementById('go'); for (let i = 0; i < 4; i++) b.click() });
    await expect(page.locator('#st')).toHaveText('Converted 1 of 1 image(s).', { timeout: 30000 }); await expect(page.locator('#list li')).toHaveCount(1);
    await page.setInputFiles('#f', [bigFile('big.png')]); await page.click('#go'); await expect(page.locator('#list')).toContainText(/MB limit/);
  });
});

test.describe('pdf-tools', () => {
  test('merge, split, each, images', async ({ page, errors }) => {
    await open(page, 'pdf-tools'); await page.setInputFiles('#mf', [fx('a.pdf'), fx('b.pdf')]); await page.click('#bm'); await expect(page.locator('#res a')).toContainText('5 pages');
    await page.selectOption('#mode', 'split'); await page.setInputFiles('#sf', fx('a.pdf')); await page.fill('#rng', '2-3'); await page.click('#bs'); await expect(page.locator('#res a')).toContainText('2 pages');
    await page.check('#each'); await page.click('#bs'); await expect(page.locator('#res a')).toHaveCount(2);
    await page.selectOption('#mode', 'img'); await page.setInputFiles('#if', [fx('photo.jpg'), fx('alpha.png'), fx('pic.webp')]); await page.selectOption('#ps', 'a4'); await page.click('#bi'); await expect(page.locator('#res a')).toContainText('3 pages');
  });
  for (const [f, re] of [['locked.pdf', /password/i], ['truncated.pdf', /damaged|couldn.t/i], ['fake.pdf', /damaged|couldn.t/i], ['empty.pdf', /empty/], ['notes.txt', /doesn.t look like a PDF/]]) test('merge rejects ' + f, async ({ page, errors }) => {
    await open(page, 'pdf-tools'); await page.setInputFiles('#mf', [fx('a.pdf'), fx(f)]); await page.click('#bm'); await expect(page.locator('#res')).toContainText(re); await expect(page.locator('#res a')).toHaveCount(0);
    await expect(page.locator('#bm')).toBeEnabled();
  });
  test('split edge cases: no file, bad range, out of range, locked', async ({ page, errors }) => {
    await open(page, 'pdf-tools'); await page.selectOption('#mode', 'split'); await page.click('#bs'); await expect(page.locator('#sf')).toHaveAttribute('aria-invalid', 'true');
    await page.setInputFiles('#sf', fx('a.pdf')); await page.fill('#rng', 'abc'); await page.click('#bs'); await expectInvalid(page, '#rng');
    await page.fill('#rng', '9'); await page.click('#bs'); await expectInvalid(page, '#rng'); await expect(page.locator('#rng-err')).toContainText('3 pages');
    await page.fill('#rng', ''); await page.setInputFiles('#sf', fx('locked.pdf')); await page.click('#bs'); await expect(page.locator('#res')).toContainText(/password/i);
  });
  test('merge with one file; image mode with bad images; huge file', async ({ page, errors }) => {
    await open(page, 'pdf-tools'); await page.setInputFiles('#mf', [fx('a.pdf')]); await page.click('#bm'); await expect(page.locator('#mf')).toHaveAttribute('aria-invalid', 'true');
    await page.setInputFiles('#mf', [fx('a.pdf'), bigFile('big.pdf')]); await page.click('#bm'); await expect(page.locator('#res')).toContainText(/MB limit/);
    await page.selectOption('#mode', 'img'); await page.setInputFiles('#if', [fx('corrupt.png')]); await page.click('#bi'); await expect(page.locator('#res')).toContainText(/couldn.t|damaged/);
    await page.setInputFiles('#if', [fx('notes.txt')]); await page.click('#bi'); await expect(page.locator('#res')).toContainText(/doesn.t look like/);
  });
  test('repeated merge clicks produce one result', async ({ page, errors }) => {
    await open(page, 'pdf-tools'); await page.setInputFiles('#mf', [fx('a.pdf'), fx('b.pdf')]);
    await page.evaluate(() => { const b = document.getElementById('bm'); for (let i = 0; i < 5; i++) b.click() }); await expect(page.locator('#res a')).toHaveCount(1);
  });
  test('PDF engine missing -> friendly message with retry', async ({ page, errors }) => {
    await page.route('**/pdf-lib.min.js', r => r.abort()); await open(page, 'pdf-tools'); await page.setInputFiles('#mf', [fx('a.pdf'), fx('b.pdf')]); await page.click('#bm');
    await expect(page.locator('#res')).toContainText(/didn.t load/); await expect(page.locator('#res .gwb-retry')).toBeVisible();
  });
});

test.describe('word-counter', () => {
  test('counts incl. emoji/RTL', async ({ page, errors }) => {
    await open(page, 'word-counter'); await page.fill('#t', 'Hello world. Second one!'); await expect(page.locator('#w')).toHaveText('4'); await expect(page.locator('#s')).toHaveText('2');
    await page.fill('#t', RTL); await expect(page.locator('#w')).toHaveText('3'); await page.fill('#t', '🚀🚀 ok'); await expect(page.locator('#c')).toHaveText('5'); await expect(page.locator('#cn')).toHaveText('4');
    await page.fill('#t', ''); await expect(page.locator('#w')).toHaveText('0'); await expect(page.locator('#rt')).toHaveText('0 min'); await expect(page.locator('#kw')).toHaveText('None yet.');
  });
  test('huge 2 MB text stays responsive', async ({ page, errors }) => {
    await open(page, 'word-counter'); const t0 = Date.now(); await setVal(page, '#t', huge(120000)); await expect(page.locator('#w')).toHaveText('360,000', { timeout: 8000 }); expect(Date.now() - t0).toBeLessThan(8000);
    await page.click('#clr'); await expect(page.locator('#w')).toHaveText('0');
  });
});

test.describe('password', () => {
  test('generates unique passwords of right length', async ({ page, errors }) => {
    await open(page, 'password'); for (const L of ['8', '64']) { await setVal(page, '#len', L); const p = await page.locator('#list code').allInnerTexts(); expect(p).toHaveLength(5); expect(new Set(p).size).toBe(5); p.forEach(x => expect(x.length).toBe(+L)); }
    for (let i = 0; i < 20; i++) await page.click('#gen');
  });
  test('all sets unchecked -> message, not silent', async ({ page, errors }) => {
    await open(page, 'password'); for (const id of ['#up', '#lo', '#di', '#sy']) await page.uncheck(id);
    await expect(page.locator('#str')).toContainText(/at least one/i);
    await page.check('#di'); await page.check('#am'); const p = await page.locator('#list code').allInnerTexts(); p.forEach(x => expect(x).toMatch(/^[2-9]+$/));
  });
  test('copy blocked', async ({ page, errors }) => { await open(page, 'password'); await denyClipboard(page); await page.getByRole('button', { name: 'Copy password 1' }).click(); await expect(page.locator('.gwb-toast')).toBeVisible(); });
});

test.describe('biz-calc', () => {
  test('happy path', async ({ page, errors }) => {
    await open(page, 'biz-calc'); await expect(page.locator('#mo')).toContainText('Margin: 38.46%'); await expect(page.locator('#to')).toContainText('Total: 108.88');
    await expect(page.locator('#lo')).toContainText('Monthly payment: 500.95'); await expect(page.locator('#bo')).toContainText('200 units');
  });
  test('empty, negative, zero and NaN inputs', async ({ page, errors }) => {
    await open(page, 'biz-calc');
    await setVal(page, '#mc', '-10'); await expectInvalid(page, '#mc'); await setVal(page, '#mp', '0'); await expectInvalid(page, '#mp');
    await setVal(page, '#ta', ''); await expectInvalid(page, '#ta'); await setVal(page, '#ly', '0'); await expectInvalid(page, '#ly');
    await setVal(page, '#la', '1e400'); await expectInvalid(page, '#la'); await setVal(page, '#bf', ''); await expectInvalid(page, '#bf');
    await noBadText(page); await expect(page.locator('#tool')).not.toContainText('—');
    await setVal(page, '#bp', '5'); await setVal(page, '#bf', '100'); await expect(page.locator('#bo')).toContainText(/higher than/);
  });
});

test.describe('business-name', () => {
  test('happy + accented/RTL keywords', async ({ page, errors }) => {
    await open(page, 'business-name'); await expect(page.locator('#list li')).toHaveCount(18);
    await page.fill('#kw', 'café'); await page.click('#go'); expect((await page.locator('#list').innerText())).toMatch(/Café|café/);
    await page.fill('#kw', 'مخبز'); await page.click('#go'); expect(await page.locator('#list li').count()).toBeGreaterThan(3); await expect(page.locator('#list')).toContainText('مخبز');
  });
  test('empty / symbols-only keyword -> inline error, previous list kept', async ({ page, errors }) => {
    await open(page, 'business-name'); await page.fill('#kw', '🚀!!'); await page.click('#go'); await expectInvalid(page, '#kw'); await expect(page.locator('#list li')).toHaveCount(18);
    await page.fill('#kw', ''); await page.click('#go'); await expectInvalid(page, '#kw'); await page.fill('#kw', huge(500)); await page.click('#go');
  });
});

test.describe('email-signature', () => {
  test('happy + XSS escaped', async ({ page, errors }) => {
    await open(page, 'email-signature'); await expect(page.locator('#pv')).toContainText('Your Name'); await setVal(page, '#n', XSS); await setVal(page, '#co', RTL + EMOJI); await noXss(page);
    await expect(page.locator('#pv')).toContainText('onerror');
  });
  test('invalid email and website -> inline errors', async ({ page, errors }) => {
    await open(page, 'email-signature'); await setVal(page, '#em', 'nope'); await expectInvalid(page, '#em'); await setVal(page, '#web', 'javascript:alert(1)'); await expectInvalid(page, '#web');
    expect(await page.locator('#pv').innerHTML()).not.toContain('javascript:'); await setVal(page, '#em', 'me@x.io'); await expectValid(page, '#em');
  });
  test('copy blocked falls back gracefully', async ({ page, errors }) => {
    await open(page, 'email-signature'); await denyClipboard(page); await page.click('#cp'); await expect(page.locator('#st')).toContainText(/Ctrl\+C/); await page.click('#ch'); await expect(page.locator('.gwb-toast')).toBeVisible();
  });
});

test.describe('color-palette', () => {
  test('every harmony + random x20', async ({ page, errors }) => {
    await open(page, 'color-palette'); for (const s of ['analogous', 'complementary', 'triadic', 'split', 'mono']) { await page.selectOption('#sch', s); await expect(page.locator('#sw .swatch')).toHaveCount(5); }
    for (let i = 0; i < 20; i++) await page.click('#rnd'); expect(await page.inputValue('#css')).toMatch(/--color-5: #[0-9a-f]{6}/);
    await setVal(page, '#base', '#000000'); await setVal(page, '#base', '#ffffff'); await noBadText(page);
  });
  test('copy blocked', async ({ page, errors }) => { await open(page, 'color-palette'); await denyClipboard(page); await page.locator('#sw .swatch').first().click(); await expect(page.locator('.gwb-toast')).toBeVisible(); });
});

test('global handler shows a non-modal message for an uncaught error', async ({ page }) => {
  const errs = []; page.on('dialog', d => { errs.push(d.message()); d.dismiss() }); await page.route(u => !/127\.0\.0\.1:8787/.test(u.href), r => r.fulfill({ status: 200, body: '' }));
  await open(page, 'word-counter'); await page.evaluate(() => setTimeout(() => { throw new Error('boom') }, 0)); await expect(page.locator('.gwb-toast')).toBeVisible();
  await expect(page.locator('.gwb-toast')).toHaveAttribute('role', 'status'); expect(errs).toEqual([]);
  await page.evaluate(() => { Promise.reject(new Error('async boom')); }); await expect(page.locator('.gwb-toast p')).toContainText(/input is still here/);
});
