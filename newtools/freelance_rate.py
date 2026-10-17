T=dict(slug='freelance-rate',name='Freelance Rate Calculator',summary='Hourly, day and project rates from your target income, costs and billable hours.',cat='business',
short='the freelance rate calculator',
title='Freelance Rate Calculator: Hourly, Day & Project Rates',
tagline='Work out the hourly, day and project rates you need to charge from your target income, business expenses, taxes and real billable hours.',
how='Enter the income you want to keep, your yearly business costs, an estimated tax rate and how many hours you can actually bill. We work back to the hourly, day, weekly and project rates that cover it all.',
meta=('Free Freelance Rate Calculator: Hourly, Day & Project Rate | GWB','Calculate your freelance hourly, day and project rate from target income, expenses, taxes, time off and billable hours. Free, private, no sign-up.','FinanceApplication'),
features=['Hourly, day, weekly and monthly rates','Project price from estimated hours','Target take-home income','Business expenses and tax estimate','Billable percentage and time off','Profit buffer'],
steps=['Enter the yearly income you want to take home and your yearly business expenses.','Set your estimated tax rate, working weeks, hours per week and the share of hours you can bill.','Read your minimum hourly, day and project rates, then round up when you quote.'],
qa=[('How do I calculate my freelance hourly rate?','Add the income you want to keep (grossed up for taxes) to your yearly business costs and a profit buffer, then divide by the hours you can actually bill in a year. Example: $60,000 take-home at 25% tax is $80,000, plus $10,000 costs and a 10% buffer is $99,000; over 1,344 billable hours that is $73.66 an hour.'),
    ('What billable percentage should I use?','Most freelancers bill 60–75% of their working hours. The rest goes to admin, sales, invoicing and learning. 70% is a sensible starting point.'),
    ('What tax rate should I enter?','In the US, self-employed people pay about 15.3% self-employment tax plus federal and state income tax. 25–35% of profit is a common planning range, but your rate depends on your income and state. Estimates only, not tax advice.')],
icon='<circle cx="12" cy="12" r="9"/><path d="M12 7v10M15 9.5c0-1.4-1.3-2-3-2s-3 .8-3 2.2 1.4 1.9 3 2.3 3 .9 3 2.3-1.3 2.2-3 2.2-3-.6-3-2"/>',
helper={'s':'freelance,freelancer,hourly rate,day rate,daily rate,what should i charge,how much to charge,consulting rate,contractor rate,project rate,pricing my services,billable hours,self employed,rate','say':'set your freelance hourly, day or project rate','tips':['Bill 60–75% of working hours; the rest is admin.','Include software, insurance and equipment in expenses.','Round your rate up when quoting.'],'rel':['profit-margin','paycheck-calculator']},
exports=['pdf','xlsx','csv'],
recs=[('FreshBooks','https://www.freshbooks.com/','Time tracking, proposals and invoicing built for freelancers and consultants.','freshbooks'),
      ('monday.com','https://monday.com/','Plan projects and track hours per client so your quotes match real effort.','monday'),
      ('Melio','https://melio.com/','Get paid and pay contractors by bank transfer or card without extra software.','melio')],
html=r"""<h2>Find your rate</h2><div class="grid">
<div><label for="fti">Income you want to take home per year ($)</label><input id="fti" type="number" min="0" step="any" inputmode="decimal" value="60000"></div>
<div><label for="fex">Business expenses per year ($)</label><input id="fex" type="number" min="0" step="any" inputmode="decimal" value="10000"></div>
<div><label for="ftx">Estimated tax rate (%)</label><input id="ftx" type="number" min="0" max="90" step="any" value="25"></div>
<div><label for="fbuf">Profit buffer (%)</label><input id="fbuf" type="number" min="0" max="200" step="any" value="10"></div>
<div><label for="fwk">Working weeks per year</label><input id="fwk" type="number" min="1" max="52" step="any" value="48"></div>
<div><label for="fhw">Working hours per week</label><input id="fhw" type="number" min="1" max="100" step="any" value="40"></div>
<div><label for="fbill">Billable share of hours (%)</label><input id="fbill" type="number" min="1" max="100" step="any" value="70"></div>
<div><label for="fhd">Hours in a working day</label><input id="fhd" type="number" min="1" max="24" step="any" value="8"></div>
<div><label for="fph">Project size (hours, optional)</label><input id="fph" type="number" min="0" step="any" value="20"></div></div>
<div id="fres" class="out" style="white-space:normal" aria-live="polite"></div>""",
js=r"""const $=id=>document.getElementById(id),m=x=>'$'+x.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
window.frCalc=o=>{const pre=o.ti/(1-o.tx/100),rev=(pre+o.ex)*(1+o.buf/100),hrs=o.wk*o.hw*o.bill/100,h=rev/hrs;return{pre,rev,hrs,h,day:h*o.hd,week:h*o.hw*o.bill/100,month:rev/12,project:h*(o.ph||0),taxes:pre-o.ti}};
function run(){const g=(id,o)=>GWB.num(id,o),o={ti:g('fti',{label:'Take-home income',min:0,max:1e9}),ex:g('fex',{label:'Business expenses',min:0,max:1e9,optional:true,def:0}),tx:g('ftx',{label:'Tax rate',min:0,max:90}),buf:g('fbuf',{label:'Profit buffer',min:0,max:200,optional:true,def:0}),wk:g('fwk',{label:'Working weeks',gt:0,max:52}),hw:g('fhw',{label:'Hours per week',gt:0,max:100}),bill:g('fbill',{label:'Billable share',gt:0,max:100}),hd:g('fhd',{label:'Hours per day',gt:0,max:24}),ph:g('fph',{label:'Project hours',min:0,max:100000,optional:true,def:0})};
if(Object.values(o).includes(null)){window.__fr=null;$('fres').innerHTML='<p class="gwb-bad">Fix the highlighted fields to see your rates.</p>';return}
const r=frCalc(o);window.__fr={o,r};const row=(a,b)=>`<tr><th scope="row">${a}</th><td>${b}</td></tr>`;
$('fres').innerHTML=`<p class="big" style="margin:0">${m(r.h)}<span style="font-size:1rem"> / hour</span></p><p>Minimum rate to take home ${m(o.ti)} a year after tax and costs.</p>
<table id="frates"><caption class="vh">Your rates</caption>${row('Hourly rate',m(r.h))}${row(`Day rate (${o.hd} h)`,m(r.day))}${row('Weekly (billable hours)',m(r.week))}${row('Monthly revenue needed',m(r.month))}${o.ph?row(`Project (${o.ph} h)`,m(r.project)):''}</table>
<h3>How it adds up</h3><table id="fbreak"><caption class="vh">Yearly breakdown</caption>${row('Take-home income',m(o.ti))}${row(`Estimated taxes (${o.tx}%)`,m(r.taxes))}${row('Business expenses',m(o.ex))}${row(`Profit buffer (${o.buf}%)`,m(r.rev-r.pre-o.ex))}${row('Revenue needed per year',m(r.rev))}${row('Billable hours per year',Math.round(r.hrs).toLocaleString())}</table>
<p class="hsmall">Planning estimate. Taxes are a flat percentage of pre-tax profit; check your actual rate with a tax professional. Not tax or financial advice.</p>`}
document.querySelectorAll('#tool input').forEach(i=>i.addEventListener('input',run));run();""",
spec=r"""window.GWB_EXPORT={slug:'freelance-rate',title:'Freelance Rate Plan',get(){const F=window.__fr;if(!F||GWB.hasErrors())return null;const X=GWB.X,m=x=>'$'+x.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}),{o,r}=F;
return{inputs:X.inputs(),tables:[{name:'Your rates',head:['Rate','Amount'],rows:[['Hourly rate',m(r.h)],['Day rate ('+o.hd+' h)',m(r.day)],['Weekly (billable hours)',m(r.week)],['Monthly revenue needed',m(r.month)]].concat(o.ph?[['Project ('+o.ph+' h)',m(r.project)]]:[])},
{name:'Yearly breakdown',head:['Item','Amount'],rows:[['Take-home income',m(o.ti)],['Estimated taxes ('+o.tx+'%)',m(r.taxes)],['Business expenses',m(o.ex)],['Profit buffer ('+o.buf+'%)',m(r.rev-r.pre-o.ex)],['Revenue needed per year',m(r.rev)],['Billable hours per year',Math.round(r.hrs)]]}],
notes:['Planning estimate. Taxes are a flat percentage of pre-tax profit. Not tax or financial advice.']}}};""")
