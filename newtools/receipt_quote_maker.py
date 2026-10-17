T=dict(slug='receipt-quote-maker',name='Receipt & Quote Maker',summary='Make receipts, estimates and quotes with discounts, tax and deposits.',cat='business',
short='the receipt and quote maker',
title='Receipt, Estimate & Quote Maker',
tagline='Create professional receipts, estimates and quotes with line items, discount, tax and deposit, then print or save as PDF.',
how='Pick receipt, estimate or quote, fill in your business and customer, add line items, and set discount, tax and deposit. Print it, save it as a PDF, or export the data to Excel or CSV.',
meta=('Free Receipt Maker & Quote / Estimate Generator (PDF), No Sign-Up | GWB','Make receipts, estimates and price quotes with line items, discount, sales tax and deposit. Print or save as PDF, export to Excel. Free, no watermark.','BusinessApplication'),
features=['Receipts, estimates and quotes','Line items with quantity and price','Discount, tax and deposit','Valid-until date for quotes','Payment method on receipts','Print or save as PDF','No watermark'],
steps=['Choose Receipt, Estimate or Quote and enter your business and customer details.','Add line items, then set any discount, tax rate and (for quotes) a deposit.','Print or save the document as a PDF, or export the data to Excel or CSV.'],
qa=[('What is the difference between an estimate and a quote?','An estimate is an approximate price that may change as the work becomes clearer. A quote is a fixed price offer, usually valid until a set date. Both become an invoice once the customer accepts and the work is done.'),
    ('Is the discount applied before tax?','Yes. The discount reduces the subtotal first, then tax is calculated on the discounted amount, which is how most US sales tax rules work.'),
    ('Can I add my logo?','This version is text only, to keep documents clean and printable. You can use the Logo Maker on this site to design one for your other materials.')],
icon='<path d="M6 2h12v20l-3-2-3 2-3-2-3 2z"/><path d="M9 7h6M9 11h6M9 15h4"/>',
helper={'s':'receipt,receipts,quote,quotes,quotation,estimate,estimates,bid,proposal,price quote,sales receipt,paid receipt,deposit','say':'make a receipt, estimate or quote','tips':['Use Quote for a fixed price with a valid-until date.','The discount is applied before tax.','Print and choose Save as PDF for a PDF copy.'],'rel':['invoice','sales-tax']},
exports=['pdf','xlsx','csv'],
recs=[('FreshBooks','https://www.freshbooks.com/','Send estimates that customers accept online and turn into invoices in one click.','freshbooks'),
      ('QuickBooks Online','https://quickbooks.intuit.com/','Create estimates and sales receipts that flow straight into your accounting.','quickbooks'),
      ('Thermal receipt printer (Amazon)','https://www.amazon.com/s?k=thermal+receipt+printer','Print paper receipts at the counter, markets or job sites.','amazon')],
css='#qitems{table-layout:fixed}#qitems th:nth-child(1){width:46%}#qitems th:nth-child(4){width:56px}#qitems td input{min-width:0;padding:8px;margin:0}#qitems td button{padding:8px 10px;margin:0;min-height:44px;min-width:44px;justify-content:center}#qdoc table{table-layout:fixed;word-break:break-word}#qdoc .qt{text-align:right}',
html=r"""<div class="noprint"><h2>Create your document</h2><div class="grid"><div><label for="qtype">Document type</label><select id="qtype"><option value="RECEIPT">Receipt</option><option value="ESTIMATE">Estimate</option><option value="QUOTE">Quote</option></select></div>
<div><label for="qnum">Number</label><input id="qnum" value="R-001" maxlength="40"></div>
<div><label for="qdate">Date</label><input id="qdate" type="date"></div>
<div id="qvw"><label for="qvalid">Valid until</label><input id="qvalid" type="date"></div>
<div id="qpw"><label for="qpay">Payment method</label><select id="qpay"><option>Card</option><option>Cash</option><option>Bank transfer</option><option>Check</option><option>Other</option></select></div>
<div><label for="qcur">Currency symbol</label><input id="qcur" value="$" maxlength="8"></div></div>
<div class="grid"><div><label for="qfrom">From (your business)</label><textarea id="qfrom" maxlength="600">Your Business
you@example.com</textarea></div><div><label for="qto">Customer</label><textarea id="qto" maxlength="600">Customer Name
customer@example.com</textarea></div></div>
<h3>Line items</h3><table id="qitems"><thead><tr><th scope="col">Description</th><th scope="col">Qty</th><th scope="col">Price</th><th scope="col"><span class="vh">Remove</span></th></tr></thead><tbody></tbody></table><button type="button" class="alt" id="qadd">+ Add item</button>
<div class="grid"><div><label for="qdisc">Discount (%)</label><input id="qdisc" type="number" min="0" max="100" step="any" value="0"></div><div><label for="qtax">Tax (%)</label><input id="qtax" type="number" min="0" max="100" step="any" value="0"></div><div id="qdw"><label for="qdep">Deposit required (%)</label><input id="qdep" type="number" min="0" max="100" step="any" value="0"></div></div>
<label for="qnotes">Notes / terms</label><textarea id="qnotes" maxlength="1000">Thank you for your business!</textarea></div>
<div class="out" id="qdoc" style="white-space:normal;background:#fff" aria-live="polite" aria-label="Document preview"></div>
<div class="noprint"><button type="button" id="qprint">Print / Save as PDF</button></div>""",
js=r"""const $=id=>document.getElementById(id),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),fm=x=>x.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');(()=>{const d=new Date();$('qdate').value=iso(d);d.setDate(d.getDate()+30);$('qvalid').value=iso(d)})();
const PFX={RECEIPT:'R-',ESTIMATE:'E-',QUOTE:'Q-'};let uid=0;
const r2=x=>Math.round((x+Number.EPSILON)*100)/100;window.qCalc=(items,disc,tax,dep)=>{const sub=r2(items.reduce((s,x)=>s+r2(x.q*x.p),0)),d=r2(sub*disc/100),taxable=r2(sub-d),tx=r2(taxable*tax/100),total=r2(taxable+tx);return{sub,d,tx,total,dep:r2(total*dep/100)}};
function addRow(d='',q=1,p=0){const r=$('qitems').tBodies[0].insertRow(),i=++uid;r.innerHTML=`<td><input id="qd${i}" aria-label="Item description" maxlength="200"></td><td><input id="qq${i}" type="number" min="0" step="any" aria-label="Quantity"></td><td><input id="qp${i}" type="number" min="0" step="any" aria-label="Unit price"></td><td><button type="button" class="alt" aria-label="Remove item">\u00d7</button></td>`;const[a,b,c]=r.querySelectorAll('input');a.value=d;b.value=q;c.value=p;
r.querySelector('button').onclick=()=>{r.remove();render();$('qadd').focus()};return r}
function vis(){const t=$('qtype').value;$('qvw').hidden=t==='RECEIPT';$('qpw').hidden=t!=='RECEIPT';$('qdw').hidden=t==='RECEIPT'}
function render(){const t=$('qtype').value,c=esc($('qcur').value.slice(0,8)||'$');let bad=false;const items=[...$('qitems').tBodies[0].rows].map(r=>{const[d,qe,pe]=r.querySelectorAll('input'),q=GWB.num(qe,{label:'Quantity',min:0,max:1e9}),p=GWB.num(pe,{label:'Unit price',min:0,max:1e12});if(q===null||p===null)bad=true;return{d:d.value.trim()||'Item',q:q||0,p:p||0}});
const disc=GWB.num('qdisc',{label:'Discount',min:0,max:100,optional:true,def:0}),tax=GWB.num('qtax',{label:'Tax',min:0,max:100,optional:true,def:0}),dep=t==='RECEIPT'?0:GWB.num('qdep',{label:'Deposit',min:0,max:100,optional:true,def:0});
if(bad||[disc,tax,dep].includes(null)){window.__q=null;return false}if(!items.length){window.__q=null;$('qdoc').innerHTML='<p class="gwb-bad">Add at least one line item.</p>';return false}
const R=qCalc(items,disc,tax,dep),L={RECEIPT:'Receipt',ESTIMATE:'Estimate',QUOTE:'Quote'}[t],dt=v=>v?new Date(v+'T00:00').toLocaleDateString('en-US',{dateStyle:'medium'}):'';
window.__q={t,L,items,disc,tax,dep,R,cur:$('qcur').value.slice(0,8)||'$'};const line=(a,b,s='')=>`<tr><th scope="row" class="qt">${a}</th><td class="qt"${s}>${b}</td></tr>`;
$('qdoc').innerHTML=`<h2>${L} ${esc($('qnum').value)}</h2><p>Date: ${dt($('qdate').value)}${t!=='RECEIPT'&&$('qvalid').value?' · Valid until: '+dt($('qvalid').value):''}${t==='RECEIPT'?' · Paid by: '+esc($('qpay').value):''}</p>
<div class="grid"><div><b>From</b><br>${esc($('qfrom').value).replace(/\n/g,'<br>')}</div><div><b>${t==='RECEIPT'?'Received from':'Prepared for'}</b><br>${esc($('qto').value).replace(/\n/g,'<br>')}</div></div>
<table id="qlines"><caption class="vh">Line items</caption><tr><th scope="col">Item</th><th scope="col">Qty</th><th scope="col">Price</th><th scope="col">Amount</th></tr>${items.map(x=>`<tr><td>${esc(x.d)}</td><td>${x.q}</td><td>${c}${fm(x.p)}</td><td>${c}${fm(x.q*x.p)}</td></tr>`).join('')}</table>
<table id="qtot"><caption class="vh">Totals</caption>${line('Subtotal',c+fm(R.sub))}${disc?line(`Discount (${disc}%)`,'-'+c+fm(R.d)):''}${line(`Tax (${tax}%)`,c+fm(R.tx))}${line('<b>Total</b>','<b>'+c+fm(R.total)+'</b>')}${t==='RECEIPT'?line('Amount paid',c+fm(R.total))+line('Balance due',c+'0.00'):dep?line(`Deposit due (${dep}%)`,c+fm(R.dep))+line('Balance on completion',c+fm(R.total-R.dep)):''}</table>
<p>${esc($('qnotes').value).replace(/\n/g,'<br>')}</p>${t==='ESTIMATE'?'<p class="hsmall">This is an estimate; the final price may change.</p>':''}`}
$('qtype').addEventListener('change',()=>{const t=$('qtype').value,n=$('qnum');if(/^[REQ]-/.test(n.value))n.value=PFX[t]+n.value.slice(2);vis();render()});
$('qadd').onclick=()=>{addRow().querySelector('input').focus();render()};$('tool').addEventListener('input',render);$('tool').addEventListener('change',render);
$('qprint').onclick=()=>{if(render()===false)return GWB.toast('Please fix the highlighted fields first. Your entries are kept.');print()};
addRow('Consultation (hours)',2,150);addRow('Materials',1,80);vis();render();""",
spec=r"""window.GWB_EXPORT={slug:'receipt',title:'Receipt',get(){if(typeof render==='function'&&render()===false)return null;const Q=window.__q;if(!Q)return null;const $=id=>document.getElementById(id),c=Q.cur,f=x=>c+x.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}),R=Q.R;
const tot=[['Subtotal',f(R.sub)]].concat(Q.disc?[['Discount ('+Q.disc+'%)','-'+f(R.d)]]:[],[['Tax ('+Q.tax+'%)',f(R.tx)],['Total',f(R.total)]],Q.t==='RECEIPT'?[['Amount paid',f(R.total)],['Balance due',f(0)]]:Q.dep?[['Deposit due ('+Q.dep+'%)',f(R.dep)],['Balance on completion',f(R.total-R.dep)]]:[]);
return{slug:Q.L.toLowerCase(),title:Q.L+' '+$('qnum').value,inputs:[['Document type',Q.L],['Number',$('qnum').value],['Date',$('qdate').value]].concat(Q.t!=='RECEIPT'?[['Valid until',$('qvalid').value]]:[['Payment method',$('qpay').value]],[['From',$('qfrom').value.replace(/\n/g,', ')],['Customer',$('qto').value.replace(/\n/g,', ')]]),
tables:[{name:'Line items',head:['Description','Qty','Unit price','Amount'],rows:Q.items.map(x=>[x.d,x.q,f(x.p),f(x.q*x.p)])},{name:'Totals',head:['','Amount'],rows:tot}],notes:[$('qnotes').value].filter(Boolean).concat(Q.t==='ESTIMATE'?['This is an estimate; the final price may change.']:[])}}};""")
