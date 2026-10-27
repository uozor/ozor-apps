#!/usr/bin/env python3
"""Static checks for canonical URLs, guide depth, and FAQ JSON-LD. Run after python3 build.py."""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
problems = []

def words(html):
    text = re.sub(r'<script\b[\s\S]*?</script>', ' ', html, flags=re.I)
    text = re.sub(r'<style\b[\s\S]*?</style>', ' ', text, flags=re.I)
    text = re.sub(r'<[^>]+>', ' ', text)
    text = text.replace('&amp;', '&').replace('&nbsp;', ' ')
    return len(re.sub(r'\s+', ' ', text).split())

def hrefs(html):
    scan = re.sub(r'<script\b[\s\S]*?</script>', '', html, flags=re.I)
    scan = re.sub(r'<!--[\s\S]*?-->', '', scan)
    return re.findall(r'<a\b[^>]*\bhref="([^"]*)"', scan, flags=re.I)

sm = (ROOT / 'sitemap.xml').read_text(encoding='utf-8')
locs = re.findall(r'<loc>([^<]+)</loc>', sm)
if len(locs) != 31:
    problems.append(f'sitemap has {len(locs)} pages (expected 31)')
for loc in locs:
    if not loc.startswith('https://greaterworldmedia.tech/') or not loc.endswith('/') or 'index.html' in loc or '?' in loc:
        problems.append('sitemap loc ' + loc)

pages = [ROOT / 'index.html'] + sorted(p for p in ROOT.glob('*/index.html'))
canon_re = re.compile(r'<link rel="canonical" href="([^"]+)"')
for p in pages:
    html = p.read_text(encoding='utf-8')
    rel = p.parent.name + '/' if p.name == 'index.html' and p.parent != ROOT else ''
    label = rel or '/'
    for href in hrefs(html):
        if 'index.html' in href:
            problems.append(f'{label} href contains index.html: {href}')
        if re.search(r'[?&]cat=', href):
            problems.append(f'{label} crawlable category query: {href}')
    m = canon_re.search(html)
    if not m or not m.group(1).endswith('/') or 'index.html' in m.group(1):
        problems.append(f'{label} canonical {m.group(1) if m else "missing"}')
    for dest in ('about/', 'contact/', 'privacy/', 'terms/'):
        if dest not in html:
            problems.append(f'{label} missing link to {dest}')

helper = (ROOT / 'helper.js').read_text(encoding='utf-8')
if 'index.html' in helper.replace("x!=='index.html'", ''):
    problems.append('helper.js still contains index.html outside the recent-path filter')

home = (ROOT / 'index.html').read_text(encoding='utf-8')
for cat in ('business', 'image', 'docs', 'media', 'writing', 'security'):
    if f'id="cat-{cat}"' not in home:
        problems.append(f'home missing #cat-{cat}')

about = (ROOT / 'about' / 'index.html').read_text(encoding='utf-8')
for needle in ('OZOR INC LLC', 'currently 20+ tools', 'zero-upload', 'Revenue Procedure 2025-32', 'ca-pub-9780755121157050'):
    if needle not in about:
        problems.append('about missing ' + needle)

tools = json.loads((ROOT / 'tools.json').read_text(encoding='utf-8'))['tools']
counts = {}
if len(tools) != 26:
    problems.append(f'tools.json has {len(tools)} tools (expected 26)')
for t in tools:
    html = (ROOT / t['id'] / 'index.html').read_text(encoding='utf-8')
    g = re.search(r'<section class="card guide" id="guide"[\s\S]*?</section>', html)
    if not g:
        problems.append(t['id'] + ' missing #guide')
        continue
    counts[t['id']] = words(g.group(0))
    if counts[t['id']] < 500:
        problems.append(f"{t['id']} guide has {counts[t['id']]} words (need 500+)")
    faqpart = g.group(0).split('id="h-faq"', 1)[-1]
    n_h3 = len(re.findall(r'<h3>', faqpart))
    if not 5 <= n_h3 <= 6:
        problems.append(f"{t['id']} has {n_h3} FAQ headings")
    ld = re.search(r'<script type="application/ld\+json">(.*?)</script>', html)
    data = json.loads(ld.group(1))
    nodes = data.get('@graph', [data])
    faq = next(n for n in nodes if n.get('@type') == 'FAQPage')
    if len(faq['mainEntity']) != n_h3:
        problems.append(f"{t['id']} FAQPage {len(faq['mainEntity'])} != {n_h3} headings")
    bc = next(n for n in nodes if n.get('@type') == 'BreadcrumbList')
    item = bc['itemListElement'][1]['item']
    if '?cat=' in item or '#cat-' not in item:
        problems.append(f"{t['id']} breadcrumb {item}")
    org = next(n for n in nodes if n.get('@type') == 'Organization')
    if org.get('legalName') != 'OZOR INC LLC':
        problems.append(t['id'] + ' Organization.legalName')
    if 'index.html' in json.dumps(bc):
        problems.append(t['id'] + ' breadcrumb index.html')

print('guide words:')
for k, n in sorted(counts.items(), key=lambda kv: kv[1]):
    print(f'  {n:5d}  {k}')
if counts:
    print(f'guide words min {min(counts.values())} max {max(counts.values())} tools {len(counts)}')
if problems:
    print('SEO CHECK FAILED')
    for p in problems:
        print(' -', p)
    sys.exit(1)
print('SEO CHECK OK')
