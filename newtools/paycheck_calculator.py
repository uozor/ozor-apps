T=dict(slug='paycheck-calculator',name='Paycheck Calculator 2026',summary='Convert hourly to salary and see take-home pay per paycheck.',cat='business',
short='the paycheck calculator',
title='Paycheck Calculator 2026: Hourly to Salary & Take-Home',
tagline='Convert hourly pay to salary (and back), then see your 2026 take-home pay per paycheck after federal, state and payroll taxes.',
how='Enter an hourly rate or a yearly salary, your hours and pay frequency. We convert it to every pay period and estimate take-home pay with 2026 federal and state tax tables.',
meta=('Free Paycheck Calculator 2026: Hourly to Salary & Take-Home Pay | GWB','Convert hourly wage to annual salary and back, and estimate 2026 take-home pay per paycheck for any US state. Free, private, no sign-up.','FinanceApplication'),
features=['Hourly to salary and salary to hourly','Overtime at 1.5x','Weekly, biweekly, semimonthly or monthly paychecks','2026 federal and state income tax, Social Security and Medicare','Pre-tax 401(k)','All 50 states plus DC'],
steps=['Choose whether you are entering an hourly rate or a yearly salary.','Set hours per week, weeks worked, any overtime, and how often you are paid.','Pick your state and filing status to see gross and take-home pay for every period.'],
qa=[('How do I convert hourly pay to a yearly salary?','Multiply the hourly rate by hours per week and by weeks worked per year. For example, $25 an hour × 40 hours × 52 weeks = $52,000 a year.'),
    ('How is take-home pay estimated?','We apply the 2026 federal brackets and standard deduction, your state\'s 2026 income tax, Social Security (6.2% up to $184,500) and Medicare (1.45%, plus 0.9% above the threshold). Credits, local taxes and other deductions are not included. Estimates only, not tax advice.'),
    ('What is the difference between biweekly and semimonthly?','Biweekly means every two weeks (26 paychecks a year). Semimonthly means twice a month (24 paychecks a year), so each semimonthly check is slightly larger.')],
icon='<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 9v.01M18 15v.01"/>',
helper={'s':'paycheck,pay check,take home,take-home,net pay,hourly to salary,salary to hourly,hourly,wage,wages,per hour,biweekly,overtime,how much will i get paid,salary','say':'convert hourly pay to salary and see take-home pay','tips':['Enter overtime hours separately; they are paid at 1.5x.','Semimonthly is 24 checks a year; biweekly is 26.','Add 401(k) to see how it lowers income tax.'],'rel':['tax-calculator','budget-calculator']},
exports=['pdf','xlsx','csv'],
recs=[('Gusto','https://gusto.com/','Runs payroll with automatic tax withholding and direct deposit for your team.','gusto'),
      ('QuickBooks Payroll','https://quickbooks.intuit.com/payroll/','Payroll that syncs with QuickBooks accounting and files payroll taxes for you.','quickbooks'),
      ('Xero','https://www.xero.com/','Accounting software to track wages alongside the rest of your business finances.','xero')],
head='<script src="../tax-calculator/tax.js" data-gwb-lib="GWBTax" data-gwb-name="tax tables"></script>',
html=r"""<h2>Calculate your paycheck</h2><p class="gwb-note" style="display:block"><strong>Tax year 2026, estimates only, not tax advice.</strong> Wages only; credits and local taxes are not included.</p>
<div class="grid"><div><label for="mode">I'm entering</label><select id="mode"><option value="hour">An hourly rate</option><option value="year">A yearly salary</option></select></div>
<div><label for="amt">Hourly rate ($)</label><input id="amt" type="number" min="0" step="any" inputmode="decimal" value="25"></div>
<div><label for="hpw">Hours per week</label><input id="hpw" type="number" min="1" max="100" step="any" value="40"></div>
<div><label for="wpy">Weeks worked per year</label><input id="wpy" type="number" min="1" max="52" step="any" value="52"></div>
<div id="otw"><label for="ot">Overtime hours per week (1.5x)</label><input id="ot" type="number" min="0" max="80" step="any" value="0"></div>
<div><label for="freq">Pay frequency</label><select id="freq"><option value="26">Every two weeks (26)</option><option value="52">Weekly (52)</option><option value="24">Twice a month (24)</option><option value="12">Monthly (12)</option></select></div>
<div><label for="pst">State</label><select id="pst"></select></div>
<div><label for="pfs">Filing status</label><select id="pfs"><option value="single">Single</option><option value="mfj">Married filing jointly</option><option value="mfs">Married filing separately</option><option value="hoh">Head of household</option></select></div>
<div><label for="pk">Pre-tax 401(k) per year (optional)</label><input id="pk" type="number" min="0" step="any" placeholder="0"></div></div>
<div id="pres" class="out" style="white-space:normal" aria-live="polite"></div>""",
js=r"""const $=id=>document.getElementById(id),T=window.GWBTax,m=x=>'$'+x.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}),pc=x=>(x*100).toFixed(2)+'%';
if(T){$('pst').innerHTML=Object.entries(T.STATES).map(([c,s])=>`<option value="${c}">${s.n}</option>`).join('');$('pst').value='TX'}
const FREQ={26:'Biweekly paycheck',52:'Weekly paycheck',24:'Semimonthly paycheck',12:'Monthly paycheck'};
window.payCalc=o=>{const{mode,amt,hpw,wpy,ot}=o,rate=mode==='hour'?amt:amt/(hpw*wpy),gross=mode==='hour'?amt*hpw*wpy+amt*1.5*(ot||0)*wpy:amt;return{rate,gross,otPay:mode==='hour'?amt*1.5*(ot||0)*wpy:0}};
function lab(){$('amt').previousElementSibling.textContent=$('mode').value==='hour'?'Hourly rate ($)':'Yearly salary ($)';$('otw').hidden=$('mode').value!=='hour'}
function run(){try{GWB.need('GWBTax','tax tables')}catch(e){return GWB.fail('pres',GWB.msg(e),()=>location.reload())}
const mode=$('mode').value,amt=GWB.num('amt',{label:mode==='hour'?'Hourly rate':'Yearly salary',min:0,max:mode==='hour'?100000:1e9}),hpw=GWB.num('hpw',{label:'Hours per week',gt:0,max:100}),wpy=GWB.num('wpy',{label:'Weeks per year',gt:0,max:52}),ot=mode==='hour'?GWB.num('ot',{label:'Overtime hours',min:0,max:80,optional:true,def:0}):0,k=GWB.num('pk',{label:'401(k) contribution',min:0,max:T.K401,optional:true,def:0});
if([amt,hpw,wpy,ot,k].includes(null)){window.__pay=null;$('pres').innerHTML='<p class="gwb-bad">Fix the highlighted fields to see your paycheck.</p>';return}
if(hpw+ot>168)return GWB.fieldError('ot','Hours plus overtime can\'t be more than 168 a week.');
const p=payCalc({mode,amt,hpw,wpy,ot});if(k>p.gross){window.__pay=null;return GWB.fieldError('pk','Your 401(k) contribution can\'t be more than your pay.')}
const r=T.calc({gross:p.gross,status:$('pfs').value,state:$('pst').value,k401:k}),n=+$('freq').value,hrs=(hpw+ot)*wpy;
const per=[['Hourly',p.gross/hrs,r.takeHome/hrs],['Daily (5-day week)',p.gross/(wpy*5),r.takeHome/(wpy*5)],['Weekly',p.gross/52,r.takeHome/52],['Biweekly',p.gross/26,r.takeHome/26],['Semimonthly',p.gross/24,r.takeHome/24],['Monthly',p.gross/12,r.takeHome/12],['Yearly',p.gross,r.takeHome]];
const ck=[['Gross pay',p.gross/n],...(k?[['Pre-tax 401(k)',-k/n]]:[]),['Federal income tax',-r.federal/n],[r.stateName+' income tax',-r.state/n],['Social Security',-r.ss/n],['Medicare',-r.medicare/n],['Take-home pay',(r.takeHome)/n]];
window.__pay={p,r,n,per,ck};const row=(a,b)=>`<tr><th scope="row">${a}</th><td>${b}</td></tr>`;
$('pres').innerHTML=`<p class="big" style="margin:0">${m(r.takeHome/n)}</p><p>Take-home per ${FREQ[n].toLowerCase()} · ${m(p.gross)} a year gross${mode==='year'?` · ${m(p.rate)} an hour`:''}</p>
<h3>${FREQ[n]}</h3><table id="pck"><caption class="vh">${FREQ[n]} breakdown</caption>${ck.map(([a,v])=>row(a,(v<0?'-':'')+m(Math.abs(v)))).join('')}</table>
<h3>Pay by period</h3><table id="pper"><caption class="vh">Gross and take-home pay by period</caption><tr><th scope="col">Period</th><th scope="col">Gross</th><th scope="col">Take-home</th></tr>${per.map(([a,g,t])=>`<tr><th scope="row">${a}</th><td>${m(g)}</td><td>${m(t)}</td></tr>`).join('')}</table>
<table id="prate"><caption class="vh">Tax rates</caption>${row('Effective tax rate',pc(r.effective))}${row('Marginal tax rate',pc(r.marginal))}</table>
<p class="hsmall">Sources: IRS Rev. Proc. 2025-32 (2026 brackets and standard deduction), SSA 2026 wage base ($184,500), Tax Foundation 2026 state income tax table. Estimates only, not tax advice.</p>`}
$('mode').addEventListener('change',()=>{const a=GWB.num('amt',{optional:true,def:0,min:0}),h=+$('hpw').value||40,w=+$('wpy').value||52;if(a){$('amt').value=$('mode').value==='year'?Math.round(a*h*w*100)/100:Math.round(a/(h*w)*100)/100}lab();run()});
['amt','hpw','wpy','ot','pk'].forEach(i=>$(i).addEventListener('input',run));['freq','pst','pfs'].forEach(i=>$(i).addEventListener('change',run));lab();run();""",
spec=r"""window.GWB_EXPORT={slug:'paycheck',title:'Paycheck Estimate (Tax Year 2026)',get(){const P=window.__pay;if(!P||GWB.hasErrors())return null;const X=GWB.X,m=x=>(x<0?'-$':'$')+Math.abs(x).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
return{inputs:X.inputs('#mode,#amt,#hpw,#wpy,#ot,#freq,#pst,#pfs,#pk'),tables:[{name:'Paycheck breakdown',head:['Item','Amount'],rows:P.ck.map(([a,v])=>[a,m(v)])},{name:'Pay by period',head:['Period','Gross','Take-home'],rows:P.per.map(([a,g,t])=>[a,m(g),m(t)])},{name:'Rates',head:['Rate','Value'],rows:[['Effective tax rate',(P.r.effective*100).toFixed(2)+'%'],['Marginal tax rate',(P.r.marginal*100).toFixed(2)+'%']]}],
notes:['Tax year 2026, estimates only, not tax advice.','Wages only; credits, itemized deductions and local taxes are not included.','Sources: IRS Rev. Proc. 2025-32, SSA 2026 wage base ($184,500), Tax Foundation 2026 state income tax table.']}}};""")
