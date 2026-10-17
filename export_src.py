# GWB export: understated "Save results" row in the tip card + lazy-loaded jsPDF/autotable/SheetJS (self-hosted in vendor/).
EXPCSS='.gwbx{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:18px 0 0;padding-top:14px;border-top:1px solid var(--line);font-size:1rem;color:var(--brand-d);text-align:left}.gwbx-l{font-weight:700;flex-basis:100%;margin-bottom:-2px}.gwbx .gwbx-b{display:inline-flex;align-items:center;gap:5px;background:#fff;box-shadow:none;color:var(--brand-d);border:1.5px solid #b9b2f0;padding:8px 11px;min-height:44px;min-width:44px;margin:0;font-weight:650;font-size:.95rem;border-radius:999px;transform:none}.gwbx .gwbx-b svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}.gwbx .gwbx-b:hover{background:var(--soft);border-color:var(--brand-d)}.gwbx .gwbx-b[aria-busy=true]{opacity:.7;cursor:progress}.gwbx-st{flex-basis:100%;margin:0;font-size:.85rem;color:var(--muted)}.gwbx-st:empty{display:none}.gwbx-note{flex-basis:100%;margin:0;font-size:.8rem;color:var(--muted)}.gwbx-ph{flex-basis:100%;margin-top:6px;padding:12px;border:1px solid var(--line);border-radius:14px;background:var(--soft);color:var(--ink);font-size:.92rem}.gwbx-ph[hidden]{display:none}.gwbx-ph p{margin:0 0 8px}.gwbx-ph .gwbx-row{display:flex;flex-wrap:wrap;gap:6px}#gwbx-qr img{display:block;margin:10px 0 4px;width:180px;height:180px;image-rendering:pixelated;background:#fff;border-radius:8px}'
FMTNAME={'pdf':('PDF','Download results as PDF'),'xlsx':('Excel','Download results as an Excel spreadsheet (.xlsx)'),'csv':('CSV','Download results as CSV')}
def exprow(fmts,note=''):
    b=[]
    for f in fmts:
        n,l=FMTNAME[f]; b.append(f'<button type="button" class="gwbx-b" data-gwbx="{f}" aria-label="{l}"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>{n}</button>')
    return ('<div class="gwbx noprint" role="group" aria-labelledby="gwbx-l"><span class="gwbx-l" id="gwbx-l">Save results:</span>'+''.join(b)
            +'<button type="button" class="gwbx-b" data-gwbx-share aria-expanded="false" aria-controls="gwbx-ph" aria-label="Send to phone as a note"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18h2"/></svg>Send to phone</button>'
            +'<div class="gwbx-ph" id="gwbx-ph" hidden><p>Send these results to your phone as a note. Nothing is uploaded.</p><div class="gwbx-row"><button type="button" class="gwbx-b" data-gwbx-note="copy">Copy as note</button><button type="button" class="gwbx-b" data-gwbx-note="txt">Download .txt note</button></div><div id="gwbx-qr"></div><p id="gwbx-qrt" class="hsmall" aria-live="polite"></p></div>'
            +'<p class="gwbx-st" id="gwbx-st" role="status" aria-live="polite"></p>'+(f'<p class="gwbx-note">{note}</p>' if note else '')+'</div>')
EXPJS=r"""/* GWB export: client-side PDF / Excel / CSV. Libraries are self-hosted and loaded only on click. */
(()=>{const D=document,G=window.GWB||(window.GWB={}),me=D.currentScript,BASE=me?me.src.replace(/[^/]*$/,''):'../vendor/';
const X=G.X={},loaded={};
X.load=src=>loaded[src]||(loaded[src]=new Promise((ok,no)=>{const s=D.createElement('script');s.src=BASE+src;s.async=true;s.onload=ok;s.onerror=()=>{delete loaded[src];const m='The export library didn\u2019t load. Check your connection and try again. Your input is kept.';no(Object.assign(new Error(m),{friendly:m}))};D.head.appendChild(s)}));
X.today=()=>{const d=new Date(),p=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())};
X.stamp=()=>new Date().toLocaleString('en-US',{dateStyle:'long',timeStyle:'short'});
/* helpers for tool specs */
X.val=el=>el.type==='checkbox'?(el.checked?'Yes':'No'):el.tagName==='SELECT'?(el.selectedOptions[0]||{}).textContent||'':el.value;
X.labelOf=el=>{const l=el.id&&D.querySelector('label[for="'+el.id+'"]');let t=l?l.textContent:(el.closest('label')||{}).textContent||el.getAttribute('aria-label')||el.id;return t.replace(/\s+/g,' ').replace(/:\s*\d+$/,'').trim()};
X.inputs=(sel)=>[...D.querySelectorAll(sel||'#tool input,#tool select,#tool textarea')].filter(e=>e.type!=='file'&&e.type!=='button'&&!e.closest('[hidden]')&&!e.closest('#items')&&!e.readOnly).map(e=>[X.labelOf(e),X.val(e)]).filter(r=>r[0]&&String(r[1]).trim()!=='');
X.table=t=>[...t.querySelectorAll('tr')].map(r=>[...r.cells].map(c=>c.textContent.trim()));
X.lines=id=>{const e=typeof id==='string'?D.getElementById(id):id;return(e?e.innerText:'').split('\n').map(s=>s.trim()).filter(Boolean)};
X.kv=lines=>lines.map(s=>{const i=s.indexOf(':');return i>0?[s.slice(0,i).trim(),s.slice(i+1).trim()]:[s,'']});
/* "$1,234.50" -> number with format, so spreadsheets can sum it */
const cell=v=>{if(typeof v==='number')return{v,t:'n'};const s=String(v==null?'':v).trim(),m=s.match(/^(-?)\$(-?[\d,]+(?:\.\d+)?)$/);if(m){return{v:+(m[1]+m[2].replace(/,/g,'')),t:'n',z:'$#,##0.00'}}
const p=s.match(/^(-?[\d,]*\.?\d+)%$/);if(p)return{v:+p[1].replace(/,/g,'')/100,t:'n',z:'0.00%'};if(/^0\d/.test(s)||/^\d{12,}$/.test(s))return{v:s,t:'s'};if(/^-?\d{1,3}(,\d{3})+(\.\d+)?$|^-?\d+(\.\d+)?$/.test(s)&&s.length<16)return{v:+s.replace(/,/g,''),t:'n'};return{v:s,t:'s'}};
X.spec=()=>{const S=window.GWB_EXPORT;if(!S)throw Object.assign(new Error('no spec'),{friendly:'Nothing to export on this page.'});const d=S.get();if(!d)throw Object.assign(new Error('invalid'),{friendly:'Fix the highlighted fields first, then export again.'});
return Object.assign({title:S.title,slug:S.slug,inputs:[],tables:[],notes:[]},d)};
const fname=(s,ext)=>'gwb-'+s.slug+'-'+X.today()+'.'+ext;
const save=(blob,name)=>{const a=D.createElement('a'),u=URL.createObjectURL(blob);a.href=u;a.download=name;a.rel='noopener';a.style.display='none';D.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(u);a.remove()},4000)};
const NOTE_ALL='Generated with GWB: Greater World Business (greaterworldmedia.tech). Free tools that run in your browser.';
function rowsAll(s){const R=[[s.title],['GWB: Greater World Business · greaterworldmedia.tech'],['Generated',s.generated],[]];
if(s.inputs.length){R.push(['Inputs used']);s.inputs.forEach(r=>R.push(r));R.push([])}
s.tables.forEach(t=>{R.push([t.name]);if(t.head)R.push(t.head);t.rows.forEach(r=>R.push(r));R.push([])});
R.push(['Notes']);s.notes.concat(NOTE_ALL).forEach(n=>R.push([n]));return R}
X.xlsx=async s=>{await X.load('xlsx.mini.min.js');G.need('XLSX','spreadsheet library');const R=rowsAll(s),ws={};let maxc=1;
R.forEach((r,i)=>{r.forEach((v,j)=>{const c=(i<3||!r.length)?{v:String(v),t:'s'}:cell(v);ws[XLSX.utils.encode_cell({r:i,c:j})]=c;maxc=Math.max(maxc,j+1)})});
ws['!ref']=XLSX.utils.encode_range({s:{r:0,c:0},e:{r:Math.max(0,R.length-1),c:maxc-1}});
const w=[];for(let j=0;j<maxc;j++){let m=10;R.forEach((r,i)=>{if(i>2&&r.length>1&&r[j]!=null)m=Math.max(m,Math.min(60,String(r[j]).length+2))});w.push({wch:m})}ws['!cols']=w;
const wb=XLSX.utils.book_new();wb.Props={Title:s.title,Author:'GWB: Greater World Business',Company:'GWB'};XLSX.utils.book_append_sheet(wb,ws,(s.sheet||'Report').slice(0,31));
s.tables.filter(t=>t.sheet).forEach(t=>XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([t.head||[]].concat(t.rows)),t.sheet.slice(0,31)));
const out=XLSX.write(wb,{bookType:'xlsx',type:'array'});save(new Blob([out],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),fname(s,'xlsx'))};
X.csv=async s=>{const q=v=>{v=String(v==null?'':v);return /[",\n\r]/.test(v)||/^[=+\-@]/.test(v)?'"'+(/^[=+\-@]/.test(v)?"'":'')+v.replace(/"/g,'""')+'"':v};
save(new Blob(['\ufeff'+rowsAll(s).map(r=>r.map(q).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}),fname(s,'csv'))};
/* jsPDF core fonts are Latin-1 only */
const L1=t=>String(t==null?'':t).replace(/[\u2018\u2019\u2032]/g,"'").replace(/[\u201c\u201d]/g,'"').replace(/[\u2013\u2014\u2212]/g,'-').replace(/\u2022/g,'-').replace(/\u2026/g,'...').replace(/\u00a0/g,' ').replace(/\u2192/g,'->').replace(/[^\x00-\xff]/g,'?');
X.pdf=async s=>{await X.load('jspdf.umd.min.js');await X.load('jspdf.plugin.autotable.min.js');if(!window.jspdf)G.need('jspdf','PDF library');const doc=new jspdf.jsPDF({unit:'pt',format:'letter'});
if(typeof doc.autoTable!=='function')G.need('__noAutoTable','PDF table library');const W=doc.internal.pageSize.getWidth(),M=48,BR=[51,36,173];
doc.setProperties({title:L1(s.title),author:'GWB: Greater World Business',creator:'GWB (greaterworldmedia.tech)'});
doc.setFillColor(...BR);doc.rect(0,0,W,64,'F');doc.setFillColor(255,162,76);doc.roundedRect(M,16,32,32,8,8,'F');doc.setTextColor(51,36,173);doc.setFont('helvetica','bold');doc.setFontSize(18);doc.text('G',M+16,38,{align:'center'});
doc.setTextColor(255,255,255);doc.setFontSize(15);doc.text('GWB',M+44,32);doc.setFont('helvetica','normal');doc.setFontSize(10);doc.text('Greater World Business',M+44,46);doc.text('greaterworldmedia.tech',W-M,38,{align:'right'});
doc.setTextColor(20,18,43);doc.setFont('helvetica','bold');doc.setFontSize(20);const tl=doc.splitTextToSize(L1(s.title),W-2*M);doc.text(tl,M,98);let y=98+tl.length*22;
doc.setFont('helvetica','normal');doc.setFontSize(10);doc.setTextColor(75,80,101);doc.text(L1('Generated '+s.generated),M,y);y+=18;if(s.image&&s.image.data){const iw=Math.min(W-2*M,s.image.maxW||300),ih=iw*s.image.h/s.image.w;doc.addImage(s.image.data,'PNG',M,y,iw,ih);y+=ih+20}
const head={fillColor:BR,textColor:255,fontStyle:'bold'},base={font:'helvetica',fontSize:10,cellPadding:5,overflow:'linebreak',textColor:[20,18,43]};
const sec=(t)=>{if(y>doc.internal.pageSize.getHeight()-90){doc.addPage();y=M}doc.setFont('helvetica','bold');doc.setFontSize(13);doc.setTextColor(20,18,43);doc.text(L1(t),M,y+10);y+=18};
const tab=(h,rows,o={})=>{doc.autoTable(Object.assign({startY:y,head:h?[h.map(L1)]:undefined,body:rows.map(r=>r.map(L1)),margin:{left:M,right:M},styles:base,headStyles:head,alternateRowStyles:{fillColor:[246,246,251]},theme:'grid'},o));y=doc.lastAutoTable.finalY+20};
if(s.inputs.length){sec('Inputs used');tab(['Field','Value'],s.inputs,{columnStyles:{0:{cellWidth:180,fontStyle:'bold'}}})}
(s._pdfOnlyText?[]:s.tables).forEach(t=>{sec(t.name);tab(t.head,t.rows,t.pdf||{})});
if(s.text){sec(s.textTitle||'Document');doc.setFont('helvetica','normal');doc.setFontSize(10.5);doc.setTextColor(20,18,43);const H=doc.internal.pageSize.getHeight();
L1(s.text).split('\n').forEach(par=>{const ls=par.trim()?doc.splitTextToSize(par,W-2*M):[''];ls.forEach(l=>{if(y>H-60){doc.addPage();y=M}doc.text(l,M,y);y+=14})});y+=10}
if(s.swatches){sec('Swatches');let x=M;s.swatches.forEach(c=>{const n=parseInt(c.slice(1),16);doc.setFillColor(n>>16,(n>>8)&255,n&255);doc.roundedRect(x,y,80,56,6,6,'F');doc.setFontSize(9);doc.setTextColor(20,18,43);doc.text(c.toUpperCase(),x,y+70);x+=92});y+=90}
sec('Notes');y+=6;doc.setFont('helvetica','normal');doc.setFontSize(9.5);doc.setTextColor(75,80,101);s.notes.concat(NOTE_ALL).forEach(n=>{const ls=doc.splitTextToSize(L1(n),W-2*M);if(y+ls.length*12>doc.internal.pageSize.getHeight()-50){doc.addPage();y=M}doc.text(ls,M,y);y+=ls.length*12+4});
const P=doc.getNumberOfPages();for(let i=1;i<=P;i++){doc.setPage(i);const H=doc.internal.pageSize.getHeight();doc.setFontSize(8.5);doc.setTextColor(120,124,140);doc.text('GWB: Greater World Business - greaterworldmedia.tech',M,H-24);doc.text('Page '+i+' of '+P,W-M,H-24,{align:'right'})}
save(doc.output('blob'),fname(s,'pdf'))};
X.run=(fmt,btn)=>G.busy(btn,async()=>{G.status('gwbx-st','');const s=X.spec();s.generated=X.stamp();await X[fmt](s);const n=fname(s,fmt);G.status('gwbx-st','Saved '+n+'.');window.__gwbLastExport=n},{status:'gwbx-st',busyText:'Preparing\u2026',retry:false,message:e=>G.msg(e)});
/* Send to phone: plain-text note via Web Share, else copy / .txt / QR */
X.note=s=>{const cn=document.querySelector('link[rel=canonical]'),L=[s.title,'GWB: Greater World Business (greaterworldmedia.tech)','Open this tool: '+(cn?cn.href:location.origin+location.pathname),'Generated '+s.generated,''];if(s.inputs.length){L.push('INPUTS');s.inputs.forEach(r=>L.push('- '+r[0]+': '+r[1]));L.push('')}
s.tables.forEach(t=>{if(t.noteSkip)return;L.push(String(t.name).toUpperCase());t.rows.forEach(r=>L.push('- '+r.filter(c=>c!==''&&c!=null).join(': ')));L.push('')});if(s.text&&s._pdfOnlyText){L.length=s.inputs.length?L.length:L.length;L.push(s.text,'')}
s.notes.forEach(n=>L.push('Note: '+n));return L.join('\n').replace(/\n{3,}/g,'\n\n').trim()+'\n'};
X.noteOf=()=>{const s=X.spec();s.generated=X.stamp();if(s._pdfOnlyText)s.tables=[];return{s,text:X.note(s),name:'gwb-'+s.slug+'-'+X.today()+'-note.txt'}};
const QRMAX=1100;
X.qr=async t=>{const box=D.getElementById('gwbx-qr'),msg=D.getElementById('gwbx-qrt');box.innerHTML='';const n=new TextEncoder().encode(t).length;
if(n>QRMAX){msg.textContent=`This note is too long for a QR code (${n.toLocaleString()} characters; the limit is about ${QRMAX.toLocaleString()}). Use Copy as note or Download .txt note instead.`;return false}
await X.load('qrcode.js');G.need('qrcode','QR code library');if(qrcode.stringToBytesFuncs&&qrcode.stringToBytesFuncs['UTF-8'])qrcode.stringToBytes=qrcode.stringToBytesFuncs['UTF-8'];
const q=qrcode(0,'L');q.addData(t,'Byte');q.make();const img=new Image();img.src=q.createDataURL(4,4);img.alt='QR code containing the note text. Scan it with your phone camera to open the note.';img.id='gwbx-qrimg';box.append(img);
msg.textContent='Scan with your phone camera to see the note, then copy it into Notes or Messages.';return true};
const panel=open=>{const p=D.getElementById('gwbx-ph'),b=D.querySelector('[data-gwbx-share]');p.hidden=!open;if(b)b.setAttribute('aria-expanded',String(open))};
X.share=btn=>G.busy(btn,async()=>{G.status('gwbx-st','');const p=D.getElementById('gwbx-ph');if(!p.hidden){panel(false);return}const{s,text,name}=X.noteOf();
if(navigator.share){const data={title:s.title,text};try{const f=new File([text],name,{type:'text/plain'});if(navigator.canShare&&navigator.canShare({files:[f]}))data.files=[f]}catch(_){}
try{await navigator.share(data);G.status('gwbx-st','Shared. Pick Notes, Messages or Mail on your phone to keep it.');return}catch(e){if(e&&e.name==='AbortError')return}}
panel(true);await X.qr(text)},{status:'gwbx-st',retry:false,message:e=>G.msg(e)});
X.noteAct=(kind,btn)=>G.busy(btn,async()=>{const{text,name}=X.noteOf();if(kind==='copy'){await G.copy(text,'gwbx-st','Note copied. Paste it into Notes, Messages or an email to yourself.')}
else{save(new Blob([text],{type:'text/plain;charset=utf-8'}),name);G.status('gwbx-st','Saved '+name+'.')}},{status:'gwbx-st',retry:false,message:e=>G.msg(e)});
D.addEventListener('click',e=>{const b=e.target.closest('[data-gwbx]');if(b)return X.run(b.dataset.gwbx,b);const sh=e.target.closest('[data-gwbx-share]');if(sh)return X.share(sh);const n=e.target.closest('[data-gwbx-note]');if(n)X.noteAct(n.dataset.gwbxNote,n)});
})();"""
# per-tool spec: (formats, note, js defining window.GWB_EXPORT)
EX={}
EX['tax-calculator']=(['pdf','xlsx','csv'],'',r"""window.GWB_EXPORT={slug:'tax-estimate',title:'US Income Tax Estimate (Tax Year 2026)',get(){const X=GWB.X,ts=[...document.querySelectorAll('#res table')];if(!ts.length||GWB.hasErrors())return null;
return{inputs:X.inputs('#sal,#per,#hrs,#st,#fs,#k'),tables:[{name:'Tax breakdown',head:['Item','Amount'],rows:X.table(ts[0])},{name:'Take-home pay',head:['Period','Take-home pay'],rows:X.table(ts[1]||ts[0])}],
notes:['Tax year 2026, estimates only, not tax advice.','Wages only; credits, itemized deductions and local taxes are not included.','Sources: IRS Rev. Proc. 2025-32 (2026 federal brackets and standard deduction), SSA 2026 wage base ($184,500), Tax Foundation 2026 state income tax table.']}}};""")
EX['biz-calc']=(['pdf','xlsx','csv'],'',r"""window.GWB_EXPORT={slug:'business-calculations',title:'Business Calculations',get(){const X=GWB.X;if(GWB.hasErrors())return null;
const sec=[...document.querySelectorAll('#tool fieldset')].map(f=>{const name=f.querySelector('legend').textContent,o=f.querySelector('output');return{name,inputs:X.inputs('#'+[...f.querySelectorAll('input')].map(i=>i.id).join(',#')),out:X.kv(X.lines(o))}});
return{inputs:[],tables:sec.map(s=>({name:s.name,head:['Item','Value'],rows:s.inputs.map(r=>[r[0]+' (input)',r[1]]).concat(s.out)})),notes:['Results are estimates for planning. Loan payments assume a fixed rate with monthly compounding.']}}};""")
EX['meeting-cost']=(['pdf','xlsx','csv'],'',r"""window.GWB_EXPORT={slug:'meeting-cost',title:'Meeting Cost Estimate',get(){const X=GWB.X,$=id=>document.getElementById(id);if(GWB.hasErrors())return null;
const n=+$('n').value,r=+$('rate').value,m=+$('mins').value,c=n*r*m/60,f=x=>'$'+x.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
return{inputs:X.inputs(),tables:[{name:'Cost estimate',head:['Measure','Value'],rows:[['Cost per minute',f(n*r/60)],['Cost per hour',f(n*r)],['Planned meeting cost',f(c)],['Yearly cost if weekly (52x)',f(c*52)],['Live timer cost so far',$('live').textContent],['Live timer elapsed',$('clock').textContent]]}],
notes:['Cost = attendees x average hourly rate x length. Salary converts to hourly using 2,080 working hours a year.','Excludes benefits, overhead and opportunity cost.']}}};""")
EX['invoice']=(['pdf','xlsx','csv'],'Tip: the PDF here is a data copy; use Download PDF above for the print layout.',r"""window.GWB_EXPORT={slug:'invoice',title:'Invoice',get(){const X=GWB.X,$=id=>document.getElementById(id);if(typeof render==='function'&&render()===false)return null;
const cur=$('cur').value.slice(0,8)||'$',f=x=>cur+x.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});let sub=0;
const rows=[...document.querySelectorAll('#items tr')].slice(1).map(r=>{const[d,q,p]=r.querySelectorAll('input'),qq=+q.value,pp=+p.value;sub+=qq*pp;return[d.value,qq,f(pp),f(qq*pp)]});
const tax=+$('tax').value||0,tx=sub*tax/100;this.title=$('dtype').value.charAt(0)+$('dtype').value.slice(1).toLowerCase()+' '+$('num').value;
return{title:this.title,inputs:[['Document type',$('dtype').value],['Number',$('num').value],['From',$('from').value.replace(/\n/g,', ')],['Bill to',$('to').value.replace(/\n/g,', ')],['Date',new Date().toLocaleDateString('en-US')],['Tax rate',tax+'%']],
tables:[{name:'Line items',head:['Description','Qty','Unit price','Amount'],rows},{name:'Totals',head:['','Amount'],rows:[['Subtotal',f(sub)],['Tax ('+tax+'%)',f(tx)],['Total',f(sub+tx)]]}],notes:[$('notes').value].filter(Boolean)}}};""")
EX['word-counter']=(['pdf','xlsx','csv'],'',r"""window.GWB_EXPORT={slug:'word-count',title:'Word & Character Count Report',get(){const $=id=>document.getElementById(id),t=$('t').value;
const st=[...document.querySelectorAll('#tool .stat')].map(s=>[s.childNodes[1]?s.textContent.replace(s.querySelector('b').textContent,'').trim():'',s.querySelector('b').textContent]);
const kw=($('kw').textContent.match(/([^,(]+)\s\((\d+)\)/g)||[]).map(x=>{const m=x.match(/\s*(.+)\s\((\d+)\)/);return[m[1],+m[2]]});
return{inputs:[['Text length',t.length.toLocaleString()+' characters'],['Text preview',t.slice(0,160)+(t.length>160?'...':'')]],tables:[{name:'Counts',head:['Measure','Value'],rows:st},{name:'Top keywords',head:['Keyword','Count'],rows:kw.length?kw:[['None yet','']]}],
notes:['Reading time uses about 238 words per minute; speaking time about 150 words per minute.','Keywords exclude common stop words and words of 1-2 letters.']}}};""")
EX['color-palette']=(['pdf','xlsx','csv'],'',r"""window.GWB_EXPORT={slug:'color-palette',title:'Color Palette',get(){const X=GWB.X,cs=[...document.querySelectorAll('#sw .swatch')].map(b=>b.textContent.trim());
const rgb=h=>{const n=parseInt(h.slice(1),16);return[n>>16,(n>>8)&255,n&255]},hsl=h=>{let[r,g,b]=rgb(h).map(v=>v/255);const mx=Math.max(r,g,b),mn=Math.min(r,g,b);let H=0,S=0,L=(mx+mn)/2;if(mx!==mn){const d=mx-mn;S=L>.5?d/(2-mx-mn):d/(mx+mn);H=mx==r?(g-b)/d+(g<b?6:0):mx==g?(b-r)/d+2:(r-g)/d+4;H*=60}return`hsl(${Math.round(H)}, ${Math.round(S*100)}%, ${Math.round(L*100)}%)`};
return{inputs:X.inputs('#base,#sch').map(r=>r[0]==='Base color'?[r[0],r[1].toUpperCase()]:r),swatches:cs,tables:[{name:'Colors',head:['#','Hex','RGB','HSL','CSS variable'],rows:cs.map((c,i)=>[i+1,c,'rgb('+rgb(c).join(', ')+')',hsl(c),'--color-'+(i+1)])}],
notes:['Check text/background contrast (WCAG 4.5:1 for body text) before using colors for text.']}}};""")
EX['business-name']=(['pdf','xlsx','csv'],'',r"""window.GWB_EXPORT={slug:'business-names',title:'Business Name Ideas',get(){const X=GWB.X,ns=[...document.querySelectorAll('#list li')].map(l=>l.textContent);if(!ns.length)return null;
return{inputs:X.inputs('#kw,#tone'),tables:[{name:'Name ideas',head:['#','Name idea'],rows:ns.map((n,i)=>[i+1,n])}],notes:['Ideas only. Check trademark databases, business registries and domain availability before using a name.']}}};""")
EX['resume']=(['pdf','xlsx'],'',r"""window.GWB_EXPORT={slug:'resume-bullets',title:'Improved Resume Bullets',get(){const X=GWB.X,ls=X.lines('out');if(!ls.length||GWB.hasErrors())return null;
const b=ls.filter(l=>/^\u2022/.test(l)).map(l=>l.replace(/^\u2022\s*/,'')),tip=ls.filter(l=>!/^\u2022/.test(l));
return{inputs:X.inputs(),tables:[{name:'Bullet options',head:['#','Bullet'],rows:b.map((x,i)=>[i+1,x])}],notes:tip.concat('Adjust details so every bullet is accurate.')}}};""")
EX['policy']=(['pdf','xlsx'],'',r"""window.GWB_EXPORT={slug:'policy',title:'Policy Draft',get(){const X=GWB.X,$=id=>document.getElementById(id),t=$('out').innerText.trim();if(!t||GWB.hasErrors())return null;const k=$('kind').selectedOptions[0].textContent;
return{slug:$('kind').value+'-policy',title:k+' (Draft)',inputs:X.inputs(),text:t,textTitle:k,tables:[],sheet:'Policy',
notes:['Template only, not legal advice. Have a qualified lawyer review it for your business and jurisdiction.']}}};
/* spreadsheet: one paragraph line per row */
(()=>{const g=window.GWB_EXPORT.get;window.GWB_EXPORT.get=function(){const d=g.call(this);if(d){d.tables=[{name:'Policy text',head:['Line','Text'],rows:d.text.split('\n').filter(s=>s.trim()).map((s,i)=>[i+1,s]),pdf:{}}];d._pdfOnlyText=true}return d}})();""")
EX['email-signature']=(['pdf','xlsx'],'',r"""window.GWB_EXPORT={slug:'email-signature',title:'Email Signature',get(){const X=GWB.X;if(GWB.hasErrors())return null;
return{inputs:X.inputs(),tables:[{name:'Signature preview (text)',head:['Line'],rows:X.lines('pv').map(l=>[l])},{name:'Signature HTML code',noteSkip:true,head:['HTML'],rows:[[html()]],pdf:{styles:{font:'courier',fontSize:7.5,cellPadding:5,overflow:'linebreak'}}}],
notes:['Paste the HTML into your email client settings, or use Copy signature on the page for rich paste.']}}};""")

from budget_src import BUDGET_SPEC
EX['budget-calculator']=(['pdf','xlsx','csv'],'',BUDGET_SPEC)

import newtools as _NT
for _t in _NT.NEW:
    if _t.get('exports'): EX[_t['slug']]=(_t['exports'],'',_t['spec'])
