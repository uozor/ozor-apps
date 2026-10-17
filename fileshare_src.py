# File "Send to phone" for tools whose output is a file. Self-contained; reuses the .gwbx send-to-phone styles.
FILE_TOOLS=['audio','video-to-mp3','image-compress','image-convert','pdf-tools','qr-bio','policy','logo-maker','barcode-label']
PHONE='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18h2"/></svg>'
DLI='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>'
def fsrow():
    return ('<div class="gwbf noprint" role="group" aria-labelledby="gwbf-l"><span class="gwbx-l" id="gwbf-l">Send your file to your phone:</span>'
            '<p class="gwbf-n" id="gwbf-n" aria-live="polite">No file yet. Make one with the tool above, then send it here.</p>'
            f'<button type="button" class="gwbx-b" data-gwbf-share aria-expanded="false" aria-controls="gwbf-ph">{PHONE}Send file to phone</button>'
            '<div class="gwbx-ph" id="gwbf-ph" hidden><p id="gwbf-why"></p><div class="gwbx-row">'
            f'<button type="button" class="gwbx-b" data-gwbf-dl>{DLI}Download file</button></div><div id="gwbf-qr"></div><p id="gwbf-qrt" class="hsmall"></p></div>'
            '<p class="gwbx-st" id="gwbf-st" role="status" aria-live="polite"></p><p class="gwbx-note">On a phone this opens the share sheet (Files, AirDrop, Messages). Nothing is uploaded.</p></div>')
FSCSS='.gwbf .gwbf-n{flex-basis:100%;margin:0 0 2px;font-size:.92rem;color:var(--ink);overflow-wrap:anywhere}#gwbf-qr img{display:block;margin:10px 0 4px;width:180px;height:180px;image-rendering:pixelated;background:#fff;border-radius:8px}'
from export_src import EXPCSS as _E
import re as _re
FSCSS=''.join(r.replace('.gwbx{','.gwbf{').replace('.gwbx .gwbx-b','.gwbf .gwbx-b')+'}' for r in _E.split('}') if r.startswith('.gwbx{') or '.gwbx .gwbx-b' in r)+FSCSS
FSJS=r"""/* GWB file send-to-phone: shares the tool's output file with the Web Share API (files); otherwise QR code + Download. Nothing is uploaded. */
(()=>{const D=document,G=window.GWB||(window.GWB={}),me=D.currentScript,BASE=me?me.src.replace(/[^/]*$/,''):'../vendor/';
const F=G.F={LIMIT:50*1048576},cache=new Map();let last=null,own=false,tick=0;
const kb=n=>n>=1048576?(n/1048576).toFixed(1)+' MB':Math.max(1,Math.round(n/1024))+' KB';
const okHref=h=>/^(blob|data):/.test(h||'');
const MIME={mp3:'audio/mpeg',wav:'audio/wav',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',pdf:'application/pdf',svg:'image/svg+xml',zip:'application/zip',ico:'image/x-icon',txt:'text/plain',html:'text/html',csv:'text/csv',xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'};
const typeOf=(n,t)=>{const e=(String(n).split('.').pop()||'').toLowerCase();return MIME[e]||(t&&t!=='application/octet-stream'?t.split(';')[0]:'application/octet-stream')};
const grab=(href,name)=>{const k=href+'|'+name;if(!cache.has(k)){if(cache.size>40)cache.clear();cache.set(k,fetch(href).then(r=>r.blob()).then(b=>new File([b],name,{type:typeOf(name,b.type)})).catch(()=>null))}return cache.get(k)};
const st=(m,k)=>G.status?G.status('gwbf-st',m,k):(D.getElementById('gwbf-st').textContent=m);
const links=()=>[...D.querySelectorAll('#tool a[download]')].filter(a=>a.download&&okHref(a.getAttribute('href'))&&!a.closest('[hidden]'));
async function show(){const n=D.getElementById('gwbf-n');if(!n)return;const t=++tick;if(!last){n.textContent='No file yet. Make one with the tool above, then send it here.';return}
const fs=await F.files();if(t!==tick)return;if(!fs){n.textContent='Your file is being prepared…';return}const tot=fs.reduce((a,f)=>a+f.size,0);
n.textContent=fs.length===1?`Ready to send: ${fs[0].name} (${kb(tot)})`:`Ready to send: ${fs.length} files (${kb(tot)})`}
const set=items=>{last=items&&items.length?{items}:null;items&&items.forEach(i=>grab(i.href,i.name));panel(false);show()};
F.files=async()=>{if(!last)return null;const fs=await Promise.all(last.items.map(i=>grab(i.href,i.name)));return fs.every(Boolean)?fs:null};
F.last=()=>last;
/* capture files the tool downloads directly (a.click() / jsPDF dispatchEvent), and download links it renders */
const cap=a=>{if(own||!(a instanceof HTMLAnchorElement)||!a.download||!okHref(a.getAttribute('href')))return;if(a.isConnected&&links().includes(a))return;set([{href:a.href,name:a.download}])};
const pc=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){try{cap(this)}catch(_){}return pc.apply(this,arguments)};
const pd=EventTarget.prototype.dispatchEvent;HTMLAnchorElement.prototype.dispatchEvent=function(e){try{if(e&&e.type==='click')cap(this)}catch(_){}return pd.call(this,e)};
let deb,sig='';const scan=()=>{const L=links(),s=L.map(a=>a.href+'|'+a.download).join('\n');if(s===sig)return;sig=s;if(L.length)set(L.map(a=>({href:a.href,name:a.download})));else if(last&&last.links)set(null);if(last&&L.length)last.links=true};
const start=()=>{const t=D.getElementById('tool');if(!t)return;new MutationObserver(()=>{clearTimeout(deb);deb=setTimeout(scan,60)}).observe(t,{subtree:true,childList:true,attributes:true,attributeFilter:['href','download','hidden']});scan()};
D.readyState==='loading'?D.addEventListener('DOMContentLoaded',start):start();
const panel=open=>{const p=D.getElementById('gwbf-ph'),b=D.querySelector('[data-gwbf-share]');if(!p)return;p.hidden=!open;if(b)b.setAttribute('aria-expanded',String(open));if(!open){D.getElementById('gwbf-qr').innerHTML='';D.getElementById('gwbf-qrt').textContent=''}};
const loadQR=()=>window.qrcode?Promise.resolve():new Promise((ok,no)=>{const s=D.createElement('script');s.src=BASE+'qrcode.js';s.onload=ok;s.onerror=()=>no(new Error('qr'));D.head.appendChild(s)});
async function qr(){const box=D.getElementById('gwbf-qr'),msg=D.getElementById('gwbf-qrt'),url=location.origin+location.pathname;box.innerHTML='';
try{await loadQR();if(qrcode.stringToBytesFuncs&&qrcode.stringToBytesFuncs['UTF-8'])qrcode.stringToBytes=qrcode.stringToBytesFuncs['UTF-8'];const q=qrcode(0,'M');q.addData(url,'Byte');q.make();const img=new Image();img.src=q.createDataURL(4,4);img.alt='QR code that opens this tool on your phone. Scan it with your phone camera.';img.id='gwbf-qrimg';box.append(img);msg.textContent='Scan to open this tool on your phone: '+url}
catch(_){msg.textContent='Open this page on your phone: '+url}}
async function fallback(kind,fs){const tot=fs?fs.reduce((a,f)=>a+f.size,0):0,w=D.getElementById('gwbf-why'),one=fs&&fs.length===1;panel(true);
if(kind==='big'){w.textContent=`${one?'This file is':'These files are'} ${kb(tot)}, too large to send from the browser (the limit is ${kb(F.LIMIT)}). Download ${one?'it':'them'} instead and move ${one?'it':'them'} to your phone with a cable, AirDrop or cloud storage.`;return}
w.textContent=kind==='fail'?'Your device didn\u2019t accept the file for sharing. Download it instead, or scan the QR code to open this tool on your phone and make the file there.':'This browser can\u2019t send files straight to your phone. Scan the QR code with your phone camera to open this tool there and make the file on your phone, or download it here and move it with AirDrop, email or cloud storage.';await qr()}
F.share=async btn=>{st('');clearTimeout(deb);scan();const p=D.getElementById('gwbf-ph');if(!p.hidden){panel(false);return}
if(!last){st('There\u2019s no file yet. Use the tool above to make one (for example Export, Convert or Download), then tap Send file to phone.');return}
const fs=await F.files();if(!fs){st('We couldn\u2019t read that file. Make it again with the tool above, then try once more.','error');return}
const tot=fs.reduce((a,f)=>a+f.size,0);if(tot>F.LIMIT)return fallback('big',fs);
let can=false;try{can=!!(navigator.share&&navigator.canShare&&navigator.canShare({files:fs}))}catch(_){}
if(!can)return fallback('desk',fs);
try{await navigator.share({files:fs,title:fs.length===1?fs[0].name:fs.length+' files'});st(`Sent ${fs.length===1?fs[0].name:fs.length+' files'}. On your phone, choose Save to Files, AirDrop or Messages to keep it.`)}
catch(e){if(e&&e.name==='AbortError'){st('Sharing cancelled. Your file is still here.');return}fallback('fail',fs)}};
F.download=async()=>{clearTimeout(deb);scan();const fs=await F.files();if(!fs){st('There\u2019s no file to download yet.','error');return}own=true;try{fs.forEach(f=>{const a=D.createElement('a'),u=URL.createObjectURL(f);a.href=u;a.download=f.name;D.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(u);a.remove()},4000)})}finally{own=false}st('Saved '+(fs.length===1?fs[0].name:fs.length+' files')+'.')};
D.addEventListener('click',e=>{const s=e.target.closest('[data-gwbf-share]');if(s)return F.share(s).catch(x=>st(G.msg?G.msg(x):'Something went wrong.','error'));if(e.target.closest('[data-gwbf-dl]'))F.download()});
})();"""
