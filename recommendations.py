# Recommended tools per page. Swap in affiliate IDs in AFFILIATE below (one place); links stay plain official URLs while id is empty.
from urllib.parse import urlsplit, urlunsplit
AFFILIATE={
  # program: {'param': query parameter name the program uses, 'id': your affiliate/partner ID ('' = none yet)}
  'amazon':     {'param':'tag','id':''},
  'quickbooks': {'param':'cid','id':''},
  'freshbooks': {'param':'ref','id':''},
  'gusto':      {'param':'ref','id':''},
  'canva':      {'param':'ref','id':''},
  'namecheap':  {'param':'aff','id':''},
  'bitwarden':  {'param':'ref','id':''},
  'adobe':      {'param':'ref','id':''},
  'grammarly':  {'param':'ref','id':''},
  'termly':     {'param':'ref','id':''},
  'google':     {'param':'ref','id':''},
  'xero':       {'param':'ref','id':''},
  'melio':      {'param':'ref','id':''},
  '1password':  {'param':'ref','id':''},
  'monday':     {'param':'ref','id':''},
  'webflow':    {'param':'ref','id':''},
  'zoom':       {'param':'ref','id':''},
}
def link(url,program):
    a=AFFILIATE.get(program) or {}
    if not a.get('id'): return url
    s=urlsplit(url); q=(s.query+'&' if s.query else '')+f"{a['param']}={a['id']}"
    return urlunsplit((s.scheme,s.netloc,s.path,q,s.fragment))
QB=('QuickBooks Online','https://quickbooks.intuit.com/','Full accounting: track income and expenses, send invoices and get reports ready for tax time.','quickbooks')
FB=('FreshBooks','https://www.freshbooks.com/','Invoicing and accounting for freelancers, with online payments, reminders and time tracking.','freshbooks')
GU=('Gusto','https://gusto.com/','Runs payroll and files payroll taxes for you, so withholding is calculated automatically.','gusto')
CA=('Canva','https://www.canva.com/','Design tool with templates for social posts, logos and print, plus brand kits for your colors.','canva')
REC={
'tax-calculator':[GU,QB,('Tax organizer folder (Amazon)','https://www.amazon.com/s?k=tax+document+organizer','An accordion file to keep W-2s, 1099s and receipts in one place for tax season.','amazon')],
'budget-calculator':[QB,('Budget planner notebook (Amazon)','https://www.amazon.com/s?k=budget+planner','A paper planner if you prefer writing your monthly budget and bills by hand.','amazon')],
'biz-calc':[QB,FB,('Desktop printing calculator (Amazon)','https://www.amazon.com/s?k=printing+calculator','A paper-tape calculator for quick counter-side math with a printed record.','amazon')],
'invoice':[FB,QB,('Thermal receipt printer (Amazon)','https://www.amazon.com/s?k=thermal+receipt+printer','Print receipts on the spot at markets, counters or job sites.','amazon')],
'meeting-cost':[GU,('Zoom Workplace','https://www.zoom.com/','Video meetings with recording and AI summaries, so fewer people need to attend live.','zoom'),('USB conference speakerphone (Amazon)','https://www.amazon.com/s?k=usb+conference+speakerphone','Clearer audio for small-room calls, which keeps meetings shorter.','amazon')],
'image-compress':[CA,('Portable SSD (Amazon)','https://www.amazon.com/s?k=portable+ssd','Fast external storage for keeping full-size originals after you compress copies.','amazon')],
'image-convert':[CA,('Portable SSD (Amazon)','https://www.amazon.com/s?k=portable+ssd','Fast external storage to back up your image library in any format.','amazon')],
'color-palette':[CA,('Pantone color guide (Amazon)','https://www.amazon.com/s?k=pantone+color+guide','A printed swatch book to check how your palette looks on paper.','amazon')],
'qr-bio':[CA,('Label maker (Amazon)','https://www.amazon.com/s?k=label+maker','Print QR code stickers for packaging, tables and shop windows.','amazon')],
'email-signature':[CA,('Google Workspace','https://workspace.google.com/','Professional email at your own domain, so your signature matches your address.','google')],
'resume':[CA,('Grammarly','https://www.grammarly.com/','Checks grammar, clarity and tone in your resume and cover letter.','grammarly')],
'business-name':[('Namecheap','https://www.namecheap.com/','Check if a matching domain is free and register it for your new name.','namecheap'),CA],
'password':[('Bitwarden','https://bitwarden.com/','Open-source password manager to store and autofill strong passwords on every device.','bitwarden'),('YubiKey security key (Amazon)','https://www.amazon.com/s?k=yubikey','A hardware key for two-factor sign-in that phishing can\u2019t steal.','amazon')],
'pdf-tools':[('Adobe Acrobat','https://www.adobe.com/acrobat.html','Edit text in PDFs, fill and sign forms, and password-protect documents.','adobe'),('Document scanner (Amazon)','https://www.amazon.com/s?k=document+scanner','Turn paper receipts and contracts into PDFs quickly.','amazon')],
'word-counter':[('Grammarly','https://www.grammarly.com/','Spots grammar mistakes and unclear sentences as you write.','grammarly'),('Mechanical keyboard (Amazon)','https://www.amazon.com/s?k=mechanical+keyboard','A comfortable keyboard for long writing sessions.','amazon')],
'policy':[('Termly','https://termly.io/','Generates and hosts policies and cookie consent banners, and updates them when laws change.','termly'),QB],
'audio':[('USB microphone (Amazon)','https://www.amazon.com/s?k=usb+microphone','Record cleaner voiceovers and podcasts than a laptop mic.','amazon'),('Studio headphones (Amazon)','https://www.amazon.com/s?k=studio+headphones','Hear edits and fades accurately while trimming.','amazon')],
'video-to-mp3':[('Studio headphones (Amazon)','https://www.amazon.com/s?k=studio+headphones','Check extracted audio for noise and clipping.','amazon'),('USB microphone (Amazon)','https://www.amazon.com/s?k=usb+microphone','Re-record narration when the original audio isn\u2019t usable.','amazon'),CA],
}
import newtools as _NT
for _t in _NT.NEW: REC[_t['slug']]=_t['recs']
def rechtml(k):
    items=REC[k]
    li=''.join(f'<li class="rec"><a href="{link(u,p)}" rel="sponsored noopener" target="_blank" data-program="{p}">{n}<span class="vh"> (opens in a new tab)</span></a><p>{b}</p></li>' for n,u,b,p in items)
    return ('<section class="card recs noprint" aria-labelledby="h-rec"><p class="eyebrow">Want more help?</p><h2 id="h-rec">Recommended tools</h2>'
            f'<ul class="recl">{li}</ul><p class="hsmall rec-disc">Some links may earn us a commission, at no extra cost to you. We only list tools we think fit this task. GWB tools stay free either way.</p></section>')
RECCSS='.recl{list-style:none;padding:0;margin:4px 0 0;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(220px,100%),1fr));gap:14px}.rec{border:1px solid var(--line);border-radius:16px;padding:16px 18px;background:linear-gradient(180deg,#fff,#fbfbff)}.rec a{display:inline-block;padding:6px 0;font-weight:700;font-family:var(--serif);font-size:1.1rem;color:var(--brand-d);text-decoration-thickness:1px;text-underline-offset:3px}.rec a::after{content:" \u2197";font-family:var(--sans);font-size:.85em}.rec p{margin:4px 0 0;color:var(--muted);font-size:.95rem}.rec-disc{margin:14px 0 0}'
