T=dict(slug='loan-calculator',name='Loan Calculator',summary='Business, equipment, SBA or mortgage loan payments with a full amortization schedule.',cat='business',
short='the loan calculator',
title='Loan Calculator with Amortization Schedule',
tagline='Work out the monthly payment, total interest and full amortization schedule for business, equipment, SBA and mortgage loans.',
how='Pick a loan type, enter the amount, interest rate and term, and optionally a down payment or extra monthly payment. You get the payment, total interest, payoff date and a month-by-month schedule.',
meta=('Free Loan Calculator with Amortization Schedule (Business, SBA, Mortgage) | GWB','Calculate monthly payments, total interest and a full amortization schedule for business, equipment, SBA and mortgage loans. Extra payments supported. Free, no sign-up.','FinanceApplication'),
features=['Business, equipment, SBA 7(a) and mortgage presets','Monthly payment and total interest','Down payment','Extra monthly payments and interest saved','Yearly summary and full monthly amortization schedule','Payoff date'],
steps=['Pick a loan type to load typical example values, then enter your own amount, rate and term.','Add a down payment or an extra monthly payment if you plan to make one.','Read the monthly payment, total interest and payoff date, and open the full schedule.'],
qa=[('How is the monthly payment calculated?','We use the standard amortization formula: payment = P × r ÷ (1 − (1 + r)^−n), where P is the amount borrowed, r is the monthly rate (APR ÷ 12) and n is the number of monthly payments.'),
    ('How much do extra payments save?','Extra principal payments shorten the loan and cut total interest. The calculator shows the new payoff date and how much interest you save compared with no extra payments.'),
    ('Are the preset rates real offers?','No. Presets are example values to get started. Your actual rate depends on the lender, your credit and the loan program, so enter the rate you were quoted. Estimates only, not financial advice.')],
icon='<path d="M3 10l9-6 9 6"/><path d="M5 10v9h14v-9"/><path d="M10 19v-5h4v5"/>',
helper={'s':'loan,loans,borrow,borrowing,mortgage,sba,equipment loan,business loan,amortization,amortisation,interest,monthly payment,repayment,payoff,refinance,apr','say':'work out loan payments and an amortization schedule','tips':['Use the APR your lender quoted.','Try an extra monthly payment to see interest saved.','Open the full schedule to see each month.'],'rel':['biz-calc','profit-margin']},
exports=['pdf','xlsx','csv'],
recs=[('QuickBooks Online','https://quickbooks.intuit.com/','Track loan payments and interest expense in your books so they are ready for tax time.','quickbooks'),
      ('Xero','https://www.xero.com/','Accounting software with bank feeds to reconcile loan payments automatically.','xero'),
      ('Melio','https://meliopayments.com/','Schedule and pay business bills, including lender payments, by bank transfer or card.','melio')],
css='.lsched{max-height:420px;overflow:auto;border:1px solid var(--line);border-radius:12px;margin-top:8px}.lsched table{margin:0}.lsched th{position:sticky;top:0;background:#fff}details.lmore summary{cursor:pointer;font-weight:700;padding:12px 0;min-height:44px}',
html=r"""<h2>Calculate your loan</h2>
<div class="grid"><div><label for="ltype">Loan type</label><select id="ltype"><option value="business">Business term loan</option><option value="equipment">Equipment loan</option><option value="sba">SBA 7(a) loan</option><option value="mortgage">Mortgage</option><option value="custom">Other / custom</option></select></div>
<div><label for="lamt" id="lamtl">Loan amount ($)</label><input id="lamt" type="number" min="0" step="any" inputmode="decimal" value="50000"></div>
<div id="ldw"><label for="ldown">Down payment ($)</label><input id="ldown" type="number" min="0" step="any" inputmode="decimal" value="0"></div>
<div><label for="lrate">Interest rate (APR %)</label><input id="lrate" type="number" min="0" max="100" step="any" value="9"></div>
<div><label for="lyears">Term (years)</label><input id="lyears" type="number" min="0" max="50" step="any" value="5"></div>
<div><label for="lextra">Extra payment per month ($, optional)</label><input id="lextra" type="number" min="0" step="any" placeholder="0"></div>
<div><label for="lstart">First payment month</label><input id="lstart" type="month"></div></div>
<p class="hsmall">Presets are example values, not offers. Enter the rate and term your lender quoted.</p>
<div id="lres" class="out" style="white-space:normal" aria-live="polite"></div>""",
js=r"""const $=id=>document.getElementById(id),m=x=>'$'+x.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const PRE={business:[50000,0,9,5],equipment:[40000,4000,8,5],sba:[150000,0,10.5,10],mortgage:[400000,80000,6.5,30]};
(()=>{const d=new Date();d.setMonth(d.getMonth()+1);$('lstart').value=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')})();
window.loanCalc=({P,apr,n,extra=0})=>{const r=apr/1200,pay=n<=0?0:(r?P*r/(1-Math.pow(1+r,-n)):P/n),rows=[];let bal=P,ti=0,k=0;
while(bal>0.005&&k<n){k++;const it=bal*r;let pr=Math.min(bal,pay-it+extra);if(k===n)pr=bal;const p=it+pr;bal=Math.max(0,bal-pr);ti+=it;rows.push({k,pay:p,int:it,prin:pr,bal})}
const base=r?pay*n-P:0;return{pay,rows,ti,total:P+ti,months:rows.length,saved:Math.max(0,base-ti)}};
function setType(){const t=$('ltype').value,p=PRE[t];$('ldw').hidden=!(t==='equipment'||t==='mortgage');$('lamtl').textContent=t==='mortgage'?'Home price ($)':t==='equipment'?'Equipment price ($)':'Loan amount ($)';if(p){$('lamt').value=p[0];$('ldown').value=p[1];$('lrate').value=p[2];$('lyears').value=p[3]}}
const mon=(s,k)=>{if(!s)return'';const[y,mo]=s.split('-').map(Number),d=new Date(y,mo-1+k-1,1);return d.toLocaleDateString('en-US',{month:'short',year:'numeric'})};
function run(){const A=GWB.num('lamt',{label:'Amount',gt:0,max:1e10}),dn=$('ldw').hidden?0:GWB.num('ldown',{label:'Down payment',min:0,max:1e10,optional:true,def:0}),apr=GWB.num('lrate',{label:'Interest rate',min:0,max:100}),y=GWB.num('lyears',{label:'Term',gt:0,max:50}),ex=GWB.num('lextra',{label:'Extra payment',min:0,max:1e9,optional:true,def:0});
if([A,dn,apr,y,ex].includes(null)){window.__loan=null;$('lres').innerHTML='<p class="gwb-bad">Fix the highlighted fields to see your loan.</p>';return}
if(dn>=A){window.__loan=null;return GWB.fieldError('ldown','The down payment must be less than the price.')}
const P=A-dn,n=Math.round(y*12),L=loanCalc({P,apr,n,extra:ex}),st=$('lstart').value,yrs=[];
L.rows.forEach(r=>{const i=Math.floor((r.k-1)/12);(yrs[i]=yrs[i]||{y:i+1,pay:0,int:0,prin:0,bal:0});yrs[i].pay+=r.pay;yrs[i].int+=r.int;yrs[i].prin+=r.prin;yrs[i].bal=r.bal});
window.__loan={P,apr,n,ex,L,yrs,st,type:$('ltype').selectedOptions[0].textContent};const row=(a,b)=>`<tr><th scope="row">${a}</th><td>${b}</td></tr>`;
$('lres').innerHTML=`<p class="big" style="margin:0">${m(L.pay)}</p><p>Monthly payment for ${n} months${ex?` (plus ${m(ex)} extra)`:''}</p>
<table id="lsum"><caption class="vh">Loan summary</caption>${row('Amount borrowed',m(P))}${row('Monthly payment',m(L.pay))}${row('Total interest',m(L.ti))}${row('Total paid',m(L.total))}${row('Number of payments',L.months)}${st?row('Payoff date',mon(st,L.months)):''}${ex?row('Interest saved by extra payments',m(L.saved))+row('Months saved',n-L.months):''}</table>
<h3>Yearly summary</h3><table id="lyear"><caption class="vh">Amortization by year</caption><tr><th scope="col">Year</th><th scope="col">Paid</th><th scope="col">Interest</th><th scope="col">Principal</th><th scope="col">Balance</th></tr>${yrs.map(v=>`<tr><th scope="row">${v.y}</th><td>${m(v.pay)}</td><td>${m(v.int)}</td><td>${m(v.prin)}</td><td>${m(v.bal)}</td></tr>`).join('')}</table>
<details class="lmore"><summary>Full monthly schedule (${L.months} payments)</summary><div class="lsched" tabindex="0" role="region" aria-label="Monthly amortization schedule"><table id="lmon"><tr><th scope="col">#</th><th scope="col">Month</th><th scope="col">Payment</th><th scope="col">Interest</th><th scope="col">Principal</th><th scope="col">Balance</th></tr>${L.rows.map(r=>`<tr><td>${r.k}</td><td>${mon(st,r.k)}</td><td>${m(r.pay)}</td><td>${m(r.int)}</td><td>${m(r.prin)}</td><td>${m(r.bal)}</td></tr>`).join('')}</table></div></details>
<p class="hsmall">Fixed-rate loan with monthly compounding. Excludes fees, taxes and insurance. Estimates only, not financial advice.</p>`}
$('ltype').addEventListener('change',()=>{setType();run()});['lamt','ldown','lrate','lyears','lextra','lstart'].forEach(i=>$(i).addEventListener('input',run));setType();run();""",
spec=r"""window.GWB_EXPORT={slug:'loan',title:'Loan Amortization Schedule',get(){const D=window.__loan;if(!D||GWB.hasErrors())return null;const X=GWB.X,m=x=>'$'+x.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}),L=D.L,mon=k=>{if(!D.st)return'';const[y,mo]=D.st.split('-').map(Number);return new Date(y,mo-1+k-1,1).toLocaleDateString('en-US',{month:'short',year:'numeric'})};
return{title:D.type+': Loan Amortization Schedule',inputs:X.inputs('#ltype,#lamt,#ldown,#lrate,#lyears,#lextra,#lstart'),tables:[{name:'Summary',head:['Item','Value'],rows:[['Amount borrowed',m(D.P)],['Monthly payment',m(L.pay)],['Total interest',m(L.ti)],['Total paid',m(L.total)],['Number of payments',L.months]].concat(D.ex?[['Interest saved by extra payments',m(L.saved)]]:[])},
{name:'Yearly summary',head:['Year','Paid','Interest','Principal','Balance'],rows:D.yrs.map(v=>[v.y,m(v.pay),m(v.int),m(v.prin),m(v.bal)])},
{name:'Monthly schedule',noteSkip:true,sheet:'Schedule',head:['#','Month','Payment','Interest','Principal','Balance'],rows:L.rows.map(r=>[r.k,mon(r.k),+r.pay.toFixed(2),+r.int.toFixed(2),+r.prin.toFixed(2),+r.bal.toFixed(2)]),pdf:{styles:{fontSize:8,cellPadding:3}}}],
notes:['Fixed-rate loan with monthly compounding. Excludes fees, taxes and insurance.','Estimates only, not financial advice.']}}};""")
