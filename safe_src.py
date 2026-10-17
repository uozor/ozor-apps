# Shared error-handling layer for all tool pages (written to /safe.js by build.py)
SAFEJS=r"""/* GWB safe.js: validation, busy states, friendly errors, library fallback, global error handler */
(()=>{const G=window.GWB={};const D=document;
const el=x=>typeof x==='string'?D.getElementById(x):x;
G.FRIENDLY='Something went wrong while processing. Your input is still here, so you can adjust it and try again.';
/* small non-modal message (never a pop-up/alert) */
let tw=null,tt=null;
G.toast=(msg,kind)=>{if(!D.body)return;if(!tw){tw=D.createElement('div');tw.className='gwb-toast noprint';tw.setAttribute('role','status');tw.setAttribute('aria-live','polite');tw.innerHTML='<p></p><button type="button" class="gwb-toast-x" aria-label="Dismiss message">\u00d7</button>';tw.querySelector('button').onclick=()=>{tw.hidden=true};D.body.appendChild(tw)}
tw.querySelector('p').textContent=msg;tw.dataset.kind=kind||'error';tw.hidden=false;clearTimeout(tt);tt=setTimeout(()=>{tw.hidden=true},9000)};
/* inline field errors: aria-invalid + aria-describedby + live message */
G.fieldError=(x,msg)=>{x=el(x);if(!x)return;const id=(x.id||('f'+Math.random().toString(36).slice(2)))+'-err';if(!x.id)x.id=id.slice(0,-4);let m=D.getElementById(id);
if(!m){m=D.createElement('p');m.id=id;m.className='ferr';m.setAttribute('aria-live','polite');x.insertAdjacentElement('afterend',m)}
m.textContent=msg;x.setAttribute('aria-invalid','true');const db=(x.getAttribute('aria-describedby')||'').split(' ').filter(Boolean);if(!db.includes(id)){db.push(id);x.setAttribute('aria-describedby',db.join(' '))}return false};
G.clearError=x=>{x=el(x);if(!x)return true;x.removeAttribute('aria-invalid');const m=D.getElementById(x.id+'-err');if(m)m.textContent='';return true};
G.hasErrors=root=>!!el(root||'tool').querySelector('[aria-invalid=true]');
/* number validation: returns a number or null (and shows an inline message) */
G.num=(x,o={})=>{x=el(x);const raw=String(x.value).trim(),lab=o.label||'This field';
if(raw===''){if(o.optional){G.clearError(x);return o.def!==undefined?o.def:null}G.fieldError(x,`${lab} is required. Enter a number.`);return null}
const v=Number(raw.replace(/,/g,''));if(!Number.isFinite(v)){G.fieldError(x,`${lab} must be a number (for example ${o.eg||'10'}).`);return null}
if(o.int&&!Number.isInteger(v)){G.fieldError(x,`${lab} must be a whole number.`);return null}
if(o.min!==undefined&&v<o.min){G.fieldError(x,o.min===0?`${lab} can't be negative.`:`${lab} must be at least ${o.min}.`);return null}
if(o.gt!==undefined&&v<=o.gt){G.fieldError(x,`${lab} must be more than ${o.gt}.`);return null}
if(o.max!==undefined&&v>o.max){G.fieldError(x,`${lab} must be ${o.max.toLocaleString()} or less.`);return null}
G.clearError(x);return v};
G.text=(x,o={})=>{x=el(x);const v=x.value.trim();if(!v&&!o.optional)return G.fieldError(x,`${o.label||'This field'} is required.`),null;if(o.max&&v.length>o.max)return G.fieldError(x,`${o.label||'This field'} is too long (max ${o.max.toLocaleString()} characters).`),null;G.clearError(x);return v};
/* file checks before processing */
G.fmtSize=b=>b>=1048576?(b/1048576).toFixed(1)+' MB':Math.max(1,Math.round(b/1024))+' KB';
G.checkFile=(f,o={})=>{const kind=o.kind||'file';if(!f)return `Choose a ${kind} first.`;
if(f.size===0)return `"${f.name}" is empty (0 bytes). Choose a different ${kind}.`;
const okType=!o.types||o.types.test(f.type||'')||(o.ext&&o.ext.test(f.name));if(!okType)return `"${f.name}" doesn't look like a ${kind}. ${o.hint||''}`.trim();
if(o.maxMB&&f.size>o.maxMB*1048576)return `"${f.name}" is ${G.fmtSize(f.size)}, which is over the ${o.maxMB} MB limit for this tool in a browser. Try a smaller file.`;return ''};
/* status area with plain-language error and a retry path */
G.status=(x,msg,kind)=>{x=el(x);if(!x)return;x.classList.remove('gwb-bad');x.textContent=msg;if(kind==='error')x.classList.add('gwb-bad')};
G.fail=(x,msg,retry)=>{x=el(x);if(!x){G.toast(msg);return}x.textContent='';x.classList.add('gwb-bad');const p=D.createElement('span');p.textContent=msg;x.append(p);
if(retry){const b=D.createElement('button');b.type='button';b.className='alt gwb-retry';b.textContent='Try again';b.onclick=()=>retry();x.append(' ',b)}};
/* busy state: disables button, sets aria-busy, catches errors (never throws) */
G.busy=async(btn,fn,o={})=>{btn=el(btn);if(btn&&btn.dataset.busy)return;let label;if(btn){btn.dataset.busy='1';label=btn.innerHTML;btn.disabled=true;btn.setAttribute('aria-busy','true');if(o.busyText)btn.textContent=o.busyText}
const reg=btn&&btn.closest('section,.card');if(reg)reg.setAttribute('aria-busy','true');
try{return await fn()}catch(e){console.warn('[GWB]',e);G.fail(o.status,(o.message&&o.message(e))||G.FRIENDLY,o.retry===false?null:(o.retry||(()=>btn&&btn.click())))}
finally{if(btn){delete btn.dataset.busy;btn.disabled=!!(o.keepDisabled&&o.keepDisabled());btn.removeAttribute('aria-busy');if(o.busyText)btn.innerHTML=label}if(reg)reg.removeAttribute('aria-busy')}};
G.safe=(fn,o={})=>function(...a){try{const r=fn.apply(this,a);if(r&&r.catch)r.catch(e=>{console.warn('[GWB]',e);G.toast(o.msg||G.FRIENDLY)});return r}catch(e){console.warn('[GWB]',e);G.toast(o.msg||G.FRIENDLY)}};
/* clipboard with fallback */
G.copy=async(text,statusEl,okMsg)=>{try{if(!navigator.clipboard)throw 0;await navigator.clipboard.writeText(text);G.status(statusEl,okMsg||'Copied.');G.toast(okMsg||'Copied.','ok')}catch(_){
try{const t=D.createElement('textarea');t.value=text;t.setAttribute('readonly','');t.style.position='fixed';t.style.opacity='0';D.body.appendChild(t);t.select();const ok=D.execCommand('copy');t.remove();if(!ok)throw 0;G.status(statusEl,okMsg||'Copied.');G.toast(okMsg||'Copied.','ok')}catch(__){G.toast('Your browser blocked copying. Select the text and press Ctrl+C (or Cmd+C).')}}};
/* library fallback */
G.libs={};G.need=(glob,name)=>{if(window[glob])return true;const m=`The ${name} didn't load, so this action can't run right now. Check your connection and reload the page. Your input is kept.`;throw Object.assign(new Error(m),{friendly:m})};
G.msg=e=>(e&&e.friendly)||G.FRIENDLY;
window.addEventListener('load',()=>{D.querySelectorAll('script[data-gwb-lib]').forEach(s=>{const g=s.dataset.gwbLib;if(window[g])return;const t=D.getElementById('tool');if(!t||D.getElementById('libfail'))return;
const n=D.createElement('div');n.id='libfail';n.className='gwb-note';n.setAttribute('role','status');n.innerHTML='<p></p><button type="button" class="alt">Reload page</button>';n.querySelector('p').textContent=`The ${s.dataset.gwbName||'processing library'} couldn't load (you may be offline or a blocker stopped it). Some actions won't work until you reload.`;n.querySelector('button').onclick=()=>location.reload();t.prepend(n)})});
/* global safety net: small non-modal message, never a pop-up */
const same=f=>!f||f.startsWith(location.origin)||f.startsWith('file:');
window.addEventListener('error',e=>{if(e.target&&e.target!==window){return}if(!same(e.filename)||e.message==='Script error.')return;G.toast(G.FRIENDLY)});
window.addEventListener('unhandledrejection',e=>{const r=e.reason,u=((r&&r.stack)||'').match(/https?:\/\/[^\s)]+/g)||[];if(u.length&&!u.some(x=>x.startsWith(location.origin)))return;G.toast((r&&r.friendly)||G.FRIENDLY)});
})();"""
SAFECSS='[hidden]{display:none!important}.ferr{margin:6px 0 0;color:#a1122f;font-size:.92rem;font-weight:600}.ferr:empty{display:none}[aria-invalid=true]{border-color:#c2183a!important}.gwb-bad{color:#8f1029}.gwb-bad .gwb-retry{margin:8px 0 0}.gwb-note{display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px;margin:0 0 18px;padding:12px 16px;border:1px solid #f1c27d;background:#fff6e6;color:#5c3a00;border-radius:14px}.gwb-note p{margin:0;flex:1 1 240px}.gwb-note button{margin:0}.gwb-toast{position:fixed;left:12px;bottom:12px;z-index:60;display:flex;align-items:flex-start;gap:8px;max-width:min(420px,calc(100vw - 90px));padding:10px 10px 10px 14px;background:#2a1030;color:#fff;border-radius:12px;box-shadow:0 10px 30px -8px rgba(0,0,0,.45);font-size:.92rem;line-height:1.45}.gwb-toast[data-kind=ok]{background:#0b4d34}.gwb-toast[hidden]{display:none}.gwb-toast p{margin:0;flex:1}.gwb-toast .gwb-toast-x{margin:0;padding:0;width:28px;height:28px;justify-content:center;background:transparent;box-shadow:none;color:#fff;font-size:1.2rem;flex:none}[aria-busy=true] button[aria-busy=true]{cursor:progress}@media print{.gwb-toast,.gwb-note{display:none}}'
