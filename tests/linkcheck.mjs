// Link audit: node tests/linkcheck.mjs [baseURL] [--external]
// Internal: every <a href> on every sitemap page resolves 200 with a matching target; #anchors exist; hub tiles -> right tool;
// llms.txt / llms-full.txt / tools.json / sitemap URLs valid; mailto address. External (--external): follow redirects, report status + final host.
const BASE = (process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'https://greaterworldmedia.tech').replace(/\/$/, '');
const EXT = process.argv.includes('--external'), CANON = 'https://greaterworldmedia.tech';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36';
const cache = new Map(), problems = [], rows = [];
const get = u => { if (!cache.has(u)) cache.set(u, fetch(u, { redirect: 'follow', headers: { 'user-agent': UA, accept: 'text/html,*/*' }, signal: AbortSignal.timeout(25000) }).then(async r => ({ status: r.status, url: r.url, type: r.headers.get('content-type') || '', body: /text|json|xml|javascript/.test(r.headers.get('content-type') || '') ? await r.text() : '' })).catch(e => ({ status: 0, err: String(e.cause?.code || e.name), url: u, body: '' }))); return cache.get(u); };
const local = u => u.startsWith(CANON) ? BASE + u.slice(CANON.length) : u;
const strip = h => h.replace(/<script\b[\s\S]*?<\/script>/gi, '');
const ids = h => new Set([...h.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
const sm = await get(BASE + '/sitemap.xml'); const pages = [...sm.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => local(m[1]));
if (pages.length !== 31) problems.push(`sitemap has ${pages.length} pages (expected 31)`);
const counts = { internal: 0, anchors: 0, tiles: 0, external: new Map(), mailto: 0, stripe: 0, files: 0 };
for (const p of pages) {
  const r = await get(p); if (r.status !== 200) { problems.push(`page ${p} -> ${r.status}`); continue; }
  const h = strip(r.body), pid = ids(r.body);
  for (const m of h.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const attrs = m[1], href = (attrs.match(/\bhref="([^"]*)"/) || [])[1]; if (href === undefined) continue;
    if (href.startsWith('mailto:')) { counts.mailto++; if (href.split('?')[0] !== 'mailto:gwm.tech@greaterworldmedia.tech') problems.push(`${p}: mailto ${href}`); continue; }
    if (href.startsWith('#')) { counts.anchors++; if (href.length > 1 && !pid.has(href.slice(1))) problems.push(`${p}: missing anchor ${href}`); continue; }
    const abs = new URL(href, p).href;
    if (abs.startsWith(BASE) || abs.startsWith(CANON)) {
      counts.internal++; const [u, frag] = local(abs).split('#'); const t = await get(u);
      if (t.status !== 200) problems.push(`${p}: ${href} -> ${t.status}`);
      else if (frag && !ids(t.body).has(frag)) problems.push(`${p}: ${href} -> anchor #${frag} missing`);
    } else {
      if (/buy\.stripe\.com/.test(abs)) counts.stripe++;
      const e = counts.external.get(abs) || { pages: new Set(), rel: new Set(), text: m[2].replace(/<[^>]+>/g, '').trim() }; e.pages.add(p.replace(BASE, '') || '/'); e.rel.add((attrs.match(/\brel="([^"]*)"/) || [, ''])[1]); counts.external.set(abs, e);
    }
  }
  if (p === BASE + '/') { const TJ = JSON.parse((await get(BASE + '/tools.json')).body).tools, dec = s => s.replace(/&amp;/g, '&');
    for (const m of r.body.matchAll(/<li class="tile"[^>]*>[\s\S]*?<h3><a href="([^"]+)">([^<]+)<\/a><\/h3>/g)) {
      counts.tiles++; const u = new URL(m[1], p).href, t = await get(u), slug = m[1].split('/')[0], tool = TJ.find(x => x.id === slug), can = (t.body.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
      if (t.status !== 200 || !tool || tool.name !== dec(m[2]) || can !== tool.url) problems.push(`tile "${m[2]}" -> ${m[1]} (${t.status}, tools.json "${tool && tool.name}", canonical ${can})`); } }
}
// llms / tools.json / sitemap URLs
const tj = JSON.parse((await get(BASE + '/tools.json')).body); const urls = new Set();
for (const t of tj.tools) for (const k of Object.keys(t)) if (typeof t[k] === 'string' && t[k].startsWith('http')) urls.add(t[k]);
for (const f of ['/llms.txt', '/llms-full.txt']) { const b = (await get(BASE + f)).body; if (!b) problems.push(`${f} empty`); for (const m of b.matchAll(/https?:\/\/[^\s)\]>"]+/g)) urls.add(m[0].replace(/[.,]$/, '')); }
for (const u of urls) { if (!u.startsWith(CANON)) continue; counts.files++; const r = await get(local(u).split('#')[0]); if (r.status !== 200) problems.push(`listed URL ${u} -> ${r.status}`); }
for (const p of pages) if (!p.endsWith('/')) problems.push(`sitemap URL without trailing slash ${p}`);
for (const f of ['/robots.txt', '/ads.txt', '/vendor/gwb-export.js', '/vendor/gwb-fileshare.js', '/safe.js', '/helper.js', '/style.css']) { counts.files++; const r = await get(BASE + f); if (r.status !== 200) problems.push(`${f} -> ${r.status}`); }
// external
if (EXT) for (const [u, e] of counts.external) {
  let r = await get(u); if (r.status >= 400 || r.status === 0) { await new Promise(s => setTimeout(s, 1500)); cache.delete(u); r = await get(u); }
  const host = new URL(u).hostname.replace(/^www\./, ''), fin = r.url ? new URL(r.url).hostname.replace(/^www\./, '') : '';
  const sameSite = fin === host || fin.endsWith('.' + host) || host.endsWith('.' + fin) || (host === 'aboutads.info' && fin.endsWith('aboutads.info')) || (host === 'adssettings.google.com' && /google\.com$/.test(fin));
  const parked = /domain (is )?for sale|parked|this domain may be|buy this domain/i.test(r.body.slice(0, 20000));
  rows.push([r.status, u, r.url, [...e.rel].join('|'), [...e.pages].length, sameSite && !parked ? 'ok' : (parked ? 'PARKED' : 'OFFSITE')]);
  if (r.status === 404 || r.status === 410 || parked || !sameSite) problems.push(`external ${u} -> ${r.status} ${r.url}${parked ? ' (parked)' : ''}`);
}
console.log(JSON.stringify({ base: BASE, pages: pages.length, internalLinks: counts.internal, inPageAnchors: counts.anchors, hubTiles: counts.tiles, mailto: counts.mailto, stripeLinks: counts.stripe, listedUrlsAndFiles: counts.files, externalUnique: counts.external.size }));
for (const r of rows) console.log('EXT', r.join(' \t '));
console.log(problems.length ? 'PROBLEMS:\n' + problems.join('\n') : 'NO PROBLEMS'); process.exit(problems.length ? 1 : 0);
