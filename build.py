import os,re
CSS="""
:root{--ink:#16142b;--muted:#4a4f63;--brand:#3b30b8;--brand-d:#2a2190;--soft:#eef0fb;--line:#dfe2ee;--bg:#fafaf7;--card:#fff;--r:18px;
--sans:system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;--serif:"Iowan Old Style","Palatino Linotype",Palatino,"Book Antiqua",Georgia,serif}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;font-family:var(--sans);color:var(--ink);background:var(--bg);line-height:1.65;font-size:1.0625rem}
h1,h2,h3{font-family:var(--serif);line-height:1.2;letter-spacing:-.01em;margin:0 0 .5em}h1{font-size:clamp(2.2rem,5vw,3.4rem)}h2{font-size:1.75rem}
a{color:var(--brand)}.skip{position:absolute;left:-999px;top:8px;background:#fff;color:var(--ink);padding:10px 16px;border-radius:8px;z-index:10}.skip:focus{left:12px}
:focus-visible{outline:3px solid #f59e0b;outline-offset:3px;border-radius:6px}
.site{background:radial-gradient(1200px 500px at 80% -10%,#5b4fe0 0,transparent 60%),linear-gradient(160deg,#1b1748,#2a2190);color:#fff}
.bar{max-width:1080px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;padding:18px 24px}.bar a{color:#fff;text-decoration:none;font-weight:600}
.logo{font-family:var(--serif);font-size:1.4rem;letter-spacing:.02em}.bar ul{list-style:none;display:flex;gap:22px;margin:0;padding:0}.bar ul a{color:#e4e2ff}
.hero{max-width:820px;margin:0 auto;padding:56px 24px 88px;text-align:center}.hero p{font-size:1.2rem;color:#ebeaff;margin:0 auto 28px;max-width:620px}
main{max-width:1080px;margin:-48px auto 0;padding:0 24px 48px}section.card{background:var(--card);border:1px solid var(--line);border-radius:var(--r);box-shadow:0 10px 40px rgba(27,23,72,.07);padding:clamp(22px,4vw,44px);margin:0 0 32px}
.eyebrow{text-transform:uppercase;letter-spacing:.12em;font-size:.8rem;font-weight:700;color:var(--brand);margin:0 0 6px}.lead{color:var(--muted);max-width:680px}
label{display:block;font-weight:600;margin:14px 0 6px;font-size:.95rem}input,textarea,select{width:100%;padding:12px 14px;border:1.5px solid #8a90a6;border-radius:10px;font:inherit;background:#fff;color:var(--ink)}textarea{min-height:96px}
input:focus,textarea:focus,select:focus{border-color:var(--brand)}.check{display:flex;gap:10px;align-items:center;font-weight:500}.check input{width:auto}
button,.btn{display:inline-flex;align-items:center;gap:8px;background:var(--brand);color:#fff;border:0;border-radius:999px;padding:12px 22px;font:inherit;font-weight:650;cursor:pointer;text-decoration:none;margin:14px 10px 0 0;transition:background .2s,transform .2s}
button:hover,.btn:hover{background:var(--brand-d)}.btn.alt,button.alt{background:var(--soft);color:var(--brand-d)}.btn.alt:hover,button.alt:hover{background:#dfe2fb}.btn.light{background:#fff;color:var(--brand-d)}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px}.out{background:#f7f8fc;border:1px solid var(--line);border-radius:14px;padding:20px;white-space:pre-wrap;margin-top:18px}
.price{border:1px solid var(--line);border-radius:16px;padding:26px;background:#fff}.price.feat{background:var(--soft);border-color:#c9cdf5}.big{font-family:var(--serif);font-size:2.2rem;font-weight:700;color:var(--brand-d)}
.tile{border:1px solid var(--line);border-radius:16px;padding:24px;background:#fff;transition:transform .25s,box-shadow .25s}.tile:hover{transform:translateY(-3px);box-shadow:0 12px 30px rgba(27,23,72,.1)}
footer{text-align:center;padding:36px 24px;color:var(--muted);font-size:.95rem}
/* reserved ad slot: fixed dimensions prevent layout shift */
.ad{max-width:728px;margin:0 auto 32px;text-align:center}.ad-label{display:block;font-size:.75rem;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:6px}.ad-slot{width:100%;height:100px;border:1px dashed var(--line);border-radius:12px;background:#f3f4f8;overflow:hidden}
@media(min-width:768px){.ad-slot{height:90px}}
table{width:100%;border-collapse:collapse}td,th{padding:8px 6px;border-bottom:1px solid var(--line);text-align:left}
@media (prefers-reduced-motion:no-preference){section.card,.hero>*{animation:rise .6s ease both}section.card:nth-of-type(2){animation-delay:.08s}section.card:nth-of-type(3){animation-delay:.16s}@keyframes rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}*{transition:none!important}}
@media print{.site,.noprint,footer,#pricing{display:none!important}main{margin:0}body{background:#fff}section.card{box-shadow:none;border:0}}"""
def page(title,tagline,how,tool,js,head="",**k):
    return f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title} | Ozor</title><meta name="description" content="{tagline}"><link rel="stylesheet" href="../style.css">{head}</head><body>
<a class="skip" href="#main">Skip to content</a>
<header class="site"><nav class="bar noprint" aria-label="Main"><a class="logo" href="../index.html">Ozor</a><ul><li><a href="#tool">Tool</a></li><li><a href="#pricing">Pricing</a></li></ul></nav>
<div class="hero"><p class="eyebrow" style="color:#d9d6ff">Free · Private · No signup</p><h1>{title}</h1><p>{tagline}</p><a class="btn light" href="#tool">Try it now</a></div></header>
<main id="main"><section class="card noprint" aria-labelledby="h-how"><p class="eyebrow">How it works</p><h2 id="h-how">Three steps, zero setup</h2><p class="lead">{how}</p><p class="lead"><strong>Private by design:</strong> everything runs in your browser. Nothing is uploaded.</p></section>
<section class="card" id="tool" aria-label="{title} tool">{tool}</section>
<section class="card" id="pricing" aria-labelledby="h-price"><p class="eyebrow">Pricing</p><h2 id="h-price">Free forever. Tips welcome.</h2><div class="grid"><div class="price"><h3>Free forever</h3><div class="big">$0</div><p>Every feature, unlimited use, no account. That won't change.</p></div>
<div class="price feat"><h3>Support this tool / Tip</h3><div class="big">Any amount</div><p>If this saved you time, a small tip helps keep it free, fast and ad-free.</p><a class="btn" id="support" href="#PAYMENT_LINK">Support this tool / Tip</a></div></div></section></main>
<footer><p>&copy; 2026 Ozor · <a href="../index.html">All tools</a> · Contact: <a href="mailto:ozor.inc@gmail.com">ozor.inc@gmail.com</a></p></footer><script>{js}</script></body></html>"""
apps={}
apps['invoice']=page("Invoice & Receipt Generator","Make a clean, professional invoice or receipt in under a minute, then save it as a PDF.",
"Fill in your business and client details, add line items, and click <i>Download PDF</i> (uses your browser's Save-as-PDF).",
"""<div class="grid noprint"><div><label>Document type</label><select id="dtype"><option>INVOICE</option><option>RECEIPT</option></select>
<label>From (your business)</label><textarea id="from">Ozor Inc.
ozor.inc@gmail.com</textarea></div><div><label>Bill to</label><textarea id="to">Client Name
client@example.com</textarea>
<label>Number</label><input id="num" value="INV-001"><label>Currency symbol</label><input id="cur" value="$"><label>Tax %</label><input id="tax" type="number" value="0"></div></div>
<div class="noprint"><h3>Line items</h3><table id="items"><tr><th>Description</th><th>Qty</th><th>Price</th><th><span class="skip">Actions</span></th></tr></table><button class="alt" onclick="addRow()">+ Add item</button>
<label>Notes</label><input id="notes" value="Thank you for your business!"></div>
<div class="out" id="doc" style="white-space:normal" aria-live="polite" aria-label="Document preview"></div><div class="noprint"><button onclick="render()">Update preview</button><button onclick="render();print()">Download PDF</button></div>""",
"""function addRow(d='Service',q=1,p=100){const t=document.getElementById('items'),r=t.insertRow();r.innerHTML=`<td><input aria-label="Item description" value="${d}"></td><td><input aria-label="Quantity" type=number value=${q}></td><td><input aria-label="Unit price" type=number value=${p}></td><td><button class=alt aria-label="Remove item" onclick="this.closest('tr').remove();render()">✕</button></td>`;r.oninput=render;render()}
const esc=s=>s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
function render(){const g=id=>document.getElementById(id).value,c=g('cur');let sub=0,rows='';document.querySelectorAll('#items tr').forEach((r,i)=>{if(!i)return;const v=[...r.querySelectorAll('input')].map(x=>x.value);const a=(+v[1])*(+v[2]);sub+=a;rows+=`<tr><td>${esc(v[0])}</td><td>${v[1]}</td><td>${c}${(+v[2]).toFixed(2)}</td><td>${c}${a.toFixed(2)}</td></tr>`});
const tx=sub*(+g('tax'))/100;document.getElementById('doc').innerHTML=`<h2>${g('dtype')} ${esc(g('num'))}</h2><p>Date: ${new Date().toLocaleDateString()}</p><div class=grid><div><b>From</b><br>${esc(g('from')).replace(/\\n/g,'<br>')}</div><div><b>To</b><br>${esc(g('to')).replace(/\\n/g,'<br>')}</div></div><table><tr><th>Item</th><th>Qty</th><th>Price</th><th>Amount</th></tr>${rows}</table><p style="text-align:right">Subtotal: ${c}${sub.toFixed(2)}<br>Tax: ${c}${tx.toFixed(2)}<br><b id=total>Total: ${c}${(sub+tx).toFixed(2)}</b></p><p>${esc(g('notes'))}</p>`}
document.querySelectorAll('#tool .grid input,#tool .grid textarea,#tool .grid select,#notes').forEach(e=>e.oninput=render);addRow('Website design',1,500);addRow('Hosting (months)',3,20);""")
apps['resume']=page("Resume Bullet Improver","Turn weak resume lines into strong, quantified achievement bullets using proven recruiter templates.",
"Paste a plain duty (e.g. 'handled customer emails'), pick a few details, and get several polished bullet variants built on the action + result + metric formula.",
"""<label>Your original bullet</label><input id="orig" value="handled customer emails"><div class="grid"><div><label for="style">Action verb style</label><select id="style"><option value="lead">Leadership</option><option value="build">Building / technical</option><option value="improve">Improvement</option><option value="support" selected>Customer / support</option></select></div>
<div><label>Metric (optional)</label><input id="metric" value="200+ messages a week" placeholder="e.g. 200+ messages a week"></div><div><label>Result / impact (optional)</label><input id="result" value="raising satisfaction scores to 95%" placeholder="e.g. raising satisfaction scores to 95%"></div></div>
<button onclick="gen()">Improve bullets</button><button class="alt" onclick="navigator.clipboard.writeText(document.getElementById('out').innerText)">Copy all</button><div class="out" id="out" aria-live="polite"></div>""",
"""const V={lead:[['Led','leading'],['Oversaw','overseeing'],['Directed','directing'],['Coordinated','coordinating']],build:[['Built','building'],['Developed','developing'],['Designed','designing'],['Implemented','implementing']],improve:[['Streamlined','streamlining'],['Improved','improving'],['Optimized','optimizing'],['Reworked','reworking']],support:[['Managed','managing'],['Handled','handling'],['Owned','owning'],['Coordinated','coordinating']]};
function obj(s){s=s.trim().replace(/\\.$/,'').replace(/^(i\\s+)?(was\\s+)?(responsible for|in charge of|helped( to)?|worked on|tasked with|assisted with)\\s+/i,'');const w=s.split(/\\s+/);if(w.length>1&&/(ed|ing|e|s)$/i.test(w[0])&&!/^(the|a|an|our|my|all|new)$/i.test(w[0]))w.shift();const o=w.join(' ');return o.charAt(0).toLowerCase()+o.slice(1)}
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
function gen(){const v=V[document.getElementById('style').value],m=document.getElementById('metric').value.trim(),r=document.getElementById('result').value.trim().replace(/\\.$/,''),o=obj(document.getElementById('orig').value);
const t=[`${v[0][0]} ${o}${m?' ('+m+')':''}${r?', '+r:''}.`,
r?`${v[1][0]} ${o}${m?' ('+m+')':''} with a focus on quality and speed, ${r}.`:`${v[1][0]} ${o} end to end${m?', covering '+m:''}.`,
`Took ownership of ${o}${m?', handling '+m:''}${r?' and '+r:''}.`,
`${v[3][0]} ${o}${m?' at a volume of '+m:''}${r?', '+r:''}.`];
let tip=(!m||!r)?'\\n\\nTip: add a number and a result above. Bullets with concrete outcomes get noticeably more callbacks.':'';document.getElementById('out').innerText=t.map(x=>'• '+x).join('\\n')+tip}gen();""")
apps['meeting-cost']=page("Meeting Cost Calculator","See what a meeting really costs in real time, then decide if it should have been an email.",
"Enter attendees and their average hourly rate (or annual salary), then start the live timer or estimate a planned meeting.",
"""<div class="grid"><div><label>Attendees</label><input id="n" type="number" value="6"></div><div><label>Avg hourly rate ($)</label><input id="rate" type="number" value="55"></div><div><label>…or avg annual salary ($)</label><input id="sal" type="number" placeholder="e.g. 110000" oninput="rate.value=Math.round(this.value/2080)"></div><div><label>Planned minutes</label><input id="mins" type="number" value="60"></div></div>
<div class="out" style="text-align:center" role="group" aria-label="Meeting cost"><div>Planned cost</div><div class="big" id="plan" aria-live="polite"></div><div>Live meeting cost</div><div class="big" id="live">$0.00</div><div id="clock">00:00</div></div>
<button onclick="start()">Start</button><button class="alt" onclick="stop()">Pause</button><button class="alt" onclick="reset()">Reset</button><p id="tip"></p>""",
"""let t0=null,acc=0,iv=null;const $=id=>document.getElementById(id),perSec=()=>$('n').value*$('rate').value/3600,f=x=>'$'+x.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
function plan(){const c=perSec()*$('mins').value*60;$('plan').textContent=f(c);$('tip').textContent=`Weekly, this meeting costs ${f(c)} per occurrence, about ${f(c*52)} per year.`}
function tick(){const s=acc+(t0?(Date.now()-t0)/1000:0);$('live').textContent=f(s*perSec());$('clock').textContent=String(Math.floor(s/60)).padStart(2,'0')+':'+String(Math.floor(s%60)).padStart(2,'0')}
function start(){if(!t0){t0=Date.now();iv=setInterval(tick,250)}}function stop(){if(t0){acc+=(Date.now()-t0)/1000;t0=null;clearInterval(iv);tick()}}function reset(){stop();acc=0;tick()}
document.querySelectorAll('input').forEach(e=>e.addEventListener('input',plan));plan();""")
apps['qr-bio']=page("QR Code & Link-in-Bio Maker","Create a QR code and a shareable one-file link-in-bio page for your business, with no signup.",
"Add your name, bio and links. Download a QR code PNG for any URL and a ready-to-host <code>bio.html</code> page.",
"""<h2>QR code</h2><label>URL or text</label><input id="qrtext" value="https://example.com"><div id="qr" style="margin-top:12px"></div><button onclick="qr()">Generate QR</button><button class="alt" onclick="dlQR()">Download PNG</button>
<h2>Link-in-bio page</h2><div class="grid"><div><label>Name</label><input id="bname" value="Ozor"></div><div><label>Accent color</label><input id="bcol" type="color" value="#4338ca"></div></div><label>Bio</label><input id="bbio" value="Small tools for small businesses.">
<label>Links (one per line: Label | URL)</label><textarea id="blinks">Website | https://example.com
Email | mailto:ozor.inc@gmail.com</textarea><button onclick="bio(true)">Download bio.html</button><iframe title="Link-in-bio page preview" id="prev" style="width:100%;height:340px;border:1px solid #e2e8f0;border-radius:10px;margin-top:12px"></iframe>""",
"""function qr(){const q=qrcode(0,'M');q.addData(document.getElementById('qrtext').value);q.make();document.getElementById('qr').innerHTML=q.createImgTag(6,12,'QR code for '+document.getElementById('qrtext').value)}
function dlQR(){qr();const img=document.querySelector('#qr img'),c=document.createElement('canvas');const go=()=>{c.width=img.width;c.height=img.height;c.getContext('2d').drawImage(img,0,0);const a=document.createElement('a');a.href=c.toDataURL('image/png');a.download='qrcode.png';a.click()};img.complete?go():img.onload=go}
const e=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function bio(dl){const g=id=>document.getElementById(id).value,col=g('bcol');const links=g('blinks').split('\\n').filter(l=>l.includes('|')).map(l=>{const[a,b]=l.split('|').map(s=>s.trim());return `<a href="${e(b)}" style="display:block;margin:10px auto;max-width:360px;padding:14px;border-radius:12px;background:${col};color:#fff;text-decoration:none;font-weight:600">${e(a)}</a>`}).join('');
const h=`<!doctype html><html><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>${e(g('bname'))}</title></head><body style="font-family:system-ui;text-align:center;padding:40px 16px;background:#f6f7fb"><h1>${e(g('bname'))}</h1><p>${e(g('bbio'))}</p>${links}<p style="font-size:12px;color:#888;margin-top:30px">Made with Ozor</p></body></html>`;
document.getElementById('prev').srcdoc=h;if(dl){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([h],{type:'text/html'}));a.download='bio.html';a.click()}}
document.querySelectorAll('#tool input,#tool textarea').forEach(x=>x.addEventListener('input',()=>bio(false)));qr();bio(false);""",head='<script src="vendor/qrcode.js"></script>')
apps['policy']=page("Small-Business Policy Generator","Generate plain-English privacy policy, terms of service, and refund policy drafts for your small business.",
"Answer a few questions and get a customizable draft. These are templates, not legal advice; have a lawyer review for your jurisdiction.",
"""<div class="grid"><div><label>Business name</label><input id="biz" value="Acme Shop"></div><div><label>Website</label><input id="site" value="acmeshop.com"></div><div><label>Contact email</label><input id="em" value="hello@acmeshop.com"></div><div><label>Governing location</label><input id="loc" value="New York, USA"></div>
<div><label>Policy</label><select id="kind"><option value="privacy">Privacy Policy</option><option value="terms">Terms of Service</option><option value="refund">Refund Policy</option></select></div><div><label>Refund window (days)</label><input id="days" type="number" value="30"></div></div>
<label class="check"><input type="checkbox" id="ck" checked> Site uses cookies / analytics</label><label class="check"><input type="checkbox" id="pay" checked> Accepts online payments</label>
<button onclick="gen()">Generate</button><button class="alt" onclick="navigator.clipboard.writeText(out.innerText)">Copy</button><button class="alt" onclick="dl()">Download .txt</button><div class="out" id="out" aria-live="polite"></div><p><small>Not legal advice.</small></p>""",
"""const $=id=>document.getElementById(id);function gen(){const B=$('biz').value,S=$('site').value,E=$('em').value,L=$('loc').value,D=$('days').value,d=new Date().toLocaleDateString(),k=$('kind').value;let t;
if(k=='privacy')t=`PRIVACY POLICY\\nLast updated: ${d}\\n\\n${B} ("we") operates ${S}. This policy explains what information we collect and how we use it.\\n\\n1. Information we collect\\n- Information you provide, such as name, email, and order details.\\n${$('ck').checked?'- Usage data collected via cookies and analytics tools.\\n':''}${$('pay').checked?'- Payment details, processed securely by our third-party payment processor. We do not store full card numbers.\\n':''}\\n2. How we use it\\nTo provide and improve our services, process orders, and respond to you.\\n\\n3. Sharing\\nWe do not sell your personal information. We share it only with service providers who help us operate, or when required by law.\\n\\n4. Your rights\\nYou may request access to, correction of, or deletion of your data by emailing ${E}.\\n\\n5. Contact\\n${B}, ${E}, ${L}`;
else if(k=='terms')t=`TERMS OF SERVICE\\nLast updated: ${d}\\n\\nBy using ${S}, operated by ${B}, you agree to these terms.\\n\\n1. Use of the service\\nYou agree to use the site lawfully and not to misuse it.\\n\\n2. ${$('pay').checked?'Purchases\\nPrices and availability may change. Payments are handled by third-party processors.':'Content\\nAll content is provided for information only.'}\\n\\n3. Intellectual property\\nAll site content belongs to ${B} unless stated otherwise.\\n\\n4. Disclaimer & liability\\nThe service is provided "as is". To the extent permitted by law, ${B} is not liable for indirect damages.\\n\\n5. Governing law\\nThese terms are governed by the laws of ${L}.\\n\\n6. Contact\\n${E}`;
else t=`REFUND POLICY\\nLast updated: ${d}\\n\\nAt ${B}, we want you to be happy with your purchase.\\n\\n1. Eligibility\\nYou may request a refund within ${D} days of purchase.\\n\\n2. How to request\\nEmail ${E} with your order number and reason.\\n\\n3. Processing\\nApproved refunds go to the original payment method within 5-10 business days.\\n\\n4. Exceptions\\nCustomized items, digital downloads already accessed, and gift cards may be non-refundable.\\n\\n5. Contact\\n${B}, ${E}`;
$('out').innerText=t}function dl(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([out.innerText]));a.download=$('kind').value+'-policy.txt';a.click()}
document.querySelectorAll('#tool input,#tool select').forEach(x=>x.addEventListener('input',gen));gen();""")
open('style.css','w').write(CSS)
for k,v in apps.items():
    v=re.sub(r'<label>([^<]*)</label>(\s*)<(input|textarea|select) id="([^"]+)"',r'<label for="\4">\1</label>\2<\3 id="\4"',v);os.makedirs(k,exist_ok=True);open(f'{k}/index.html','w').write(v)
cards=[('invoice','Invoice & Receipt Generator','Professional invoices and receipts, saved as PDF in about a minute.'),('resume','Resume Bullet Improver','Turn plain duties into clear, results-focused resume bullets.'),('meeting-cost','Meeting Cost Calculator','A live cost ticker that shows what a meeting really costs.'),('qr-bio','QR & Link-in-Bio Maker','QR codes plus a one-file link page you can host anywhere.'),('policy','Policy Generator','Plain-English privacy, terms and refund policy drafts.')]
c=''.join(f'<li class="tile"><h3>{t}</h3><p class="lead">{d}</p><a class="btn alt" href="{k}/index.html">Open {t}<span aria-hidden="true"> →</span></a></li>' for k,t,d in cards)
open('index.html','w').write(f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ozor | Free tools for small businesses</title><meta name="description" content="Free, private, in-browser tools for freelancers and small businesses."><link rel="stylesheet" href="style.css"></head><body>
<a class="skip" href="#main">Skip to content</a>
<header class="site"><nav class="bar" aria-label="Main"><a class="logo" href="index.html">Ozor</a><ul><li><a href="#tools">Tools</a></li><li><a href="#reviews">Reviews</a></li><li><a href="#support">Support</a></li></ul></nav>
<div class="hero"><p class="eyebrow" style="color:#d9d6ff">Free · Private · No signup</p><h1>Small tools for small businesses</h1><p>Practical, single-purpose tools that run entirely in your browser. No accounts, no uploads, no clutter.</p><a class="btn light" href="#tools">Browse tools</a></div></header>
<main id="main"><section class="card" id="tools" aria-labelledby="h-tools"><p class="eyebrow">The toolkit</p><h2 id="h-tools">All tools</h2><ul class="grid" style="list-style:none;padding:0;margin:0">{c}</ul></section>
<section class="card" id="reviews" aria-labelledby="h-rev"><p class="eyebrow">Reviews</p><h2 id="h-rev">What people say</h2><div id="revlist" aria-live="polite"><p class="lead">No reviews yet, be the first.</p></div><a class="btn alt" href="mailto:ozor.inc@gmail.com?subject=Ozor%20tool%20review">Leave a review</a></section>
<section class="card" id="support" aria-labelledby="h-sup"><p class="eyebrow">Support</p><h2 id="h-sup">Free forever. Tips welcome.</h2><p class="lead">Every tool is free with no limits. If one saved you time, a tip helps keep them running.</p><a class="btn" href="#PAYMENT_LINK">Support this tool / Tip</a></section></main>
<footer><p>&copy; 2026 Ozor · Contact: <a href="mailto:ozor.inc@gmail.com">ozor.inc@gmail.com</a></p></footer>
<script>/* Real reviews go in reviews.json: [{{"tool":"Invoice Generator","rating":5,"text":"...","author":"optional"}}] */
fetch('reviews.json').then(r=>r.json()).then(a=>{{if(!a.length)return;const e=s=>String(s||'').replace(/[&<>]/g,c=>({{'&':'&amp;','<':'&lt;','>':'&gt;'}}[c]));
document.getElementById('revlist').innerHTML=a.map(r=>`<figure class="out" style="white-space:normal;margin:0 0 14px"><figcaption><strong>${{e(r.tool)}}</strong> <span aria-label="${{+r.rating||0}} out of 5 stars">${{'★'.repeat(+r.rating||0)}}</span></figcaption><blockquote style="margin:8px 0">${{e(r.text)}}</blockquote>${{r.author?'<small>— '+e(r.author)+'</small>':''}}</figure>`).join('')}}).catch(()=>{{}});</script></body></html>""")

# ---- SEO + ad slot post-processing ----
BASE="https://uozor.github.io/ozor-apps/"  # change if the final Pages URL differs
META={'':('Ozor | Free tools for small businesses','Free, private, in-browser tools for freelancers and small businesses: invoices, resume bullets, meeting costs, QR codes and policy templates.','BusinessApplication'),
'invoice/':('Free Invoice & Receipt Generator (PDF) | Ozor','Create professional invoices and receipts in your browser and save them as PDF. Free, private, no signup.','BusinessApplication'),
'resume/':('Resume Bullet Improver: Free Achievement Bullet Writer | Ozor','Turn plain job duties into clear, quantified resume bullets with recruiter-tested templates. Free and private.','BusinessApplication'),
'meeting-cost/':('Meeting Cost Calculator: Live Meeting Cost Timer | Ozor','See what a meeting really costs with a live timer based on attendees and hourly rates. Free, no signup.','BusinessApplication'),
'qr-bio/':('Free QR Code Generator & Link-in-Bio Page Maker | Ozor','Generate QR code PNGs and a one-file link-in-bio page you can host anywhere. Free, private, no account.','DesignApplication'),
'policy/':('Free Privacy Policy, Terms & Refund Policy Generator | Ozor','Generate plain-English privacy policy, terms of service and refund policy drafts for your small business. Free.','BusinessApplication')}
AD='''<aside class="ad noprint" aria-label="Advertisement"><span class="ad-label">Advertisement</span><div class="ad-slot">
<!-- AD SLOT: paste the AdSense <ins class="adsbygoogle" ...> unit (or Carbon/EthicalAds code) here.
     Load the network script once in <head> where marked AD-SCRIPT. Add /ads.txt at the site root after approval. --></div></aside>'''
import json
for path,(t,d,cat) in META.items():
    f=(path or '')+'index.html';h=open(f).read();url=BASE+path
    h=re.sub(r'<title>.*?</title><meta name="description" content="[^"]*">','',h,count=1)
    ld=[{"@context":"https://schema.org","@type":"WebApplication","name":t.split(' | ')[0],"url":url,"description":d,"applicationCategory":cat,"operatingSystem":"Any (web browser)","offers":{"@type":"Offer","price":"0","priceCurrency":"USD"},"publisher":{"@type":"Organization","name":"Ozor","email":"ozor.inc@gmail.com"}}]
    if not path: ld=[{"@context":"https://schema.org","@type":"Organization","name":"Ozor","url":url,"email":"ozor.inc@gmail.com"},{"@context":"https://schema.org","@type":"WebSite","name":"Ozor","url":url}]
    head=f'''<title>{t}</title><meta name="description" content="{d}"><link rel="canonical" href="{url}"><meta name="theme-color" content="#2a2190">
<meta property="og:type" content="website"><meta property="og:site_name" content="Ozor"><meta property="og:title" content="{t}"><meta property="og:description" content="{d}"><meta property="og:url" content="{url}">
<meta name="twitter:card" content="summary"><meta name="twitter:title" content="{t}"><meta name="twitter:description" content="{d}">
<script type="application/ld+json">{json.dumps(ld if len(ld)>1 else ld[0])}</script>
<!-- AD-SCRIPT: after AdSense approval, add: <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXX" crossorigin="anonymous"></script> -->'''
    h=h.replace('<meta name="viewport" content="width=device-width,initial-scale=1">','<meta name="viewport" content="width=device-width,initial-scale=1">'+head,1)
    anchor='<section class="card" id="pricing"' if path else '<section class="card" id="support"'
    h=h.replace(anchor,AD+anchor,1)
    open(f,'w').write(h)
open('sitemap.xml','w').write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+''.join(f'  <url><loc>{BASE+p}</loc><changefreq>monthly</changefreq></url>\n' for p in META)+'</urlset>\n')
open('robots.txt','w').write(f'User-agent: *\nAllow: /\nSitemap: {BASE}sitemap.xml\n')
open('ads.txt.example','w').write('# Rename to ads.txt after ad-network approval, e.g.:\n# google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0\n')
