# US income tax calculator engine (written to /tax-calculator/tax.js by build.py)
import json
STATES=open('tax_states_2026.json').read()
TAXJS=r"""/* GWB tax engine. Estimates only, not tax advice.
 Federal: IRS Rev. Proc. 2025-32 (tax year 2026 inflation adjustments incl. One Big Beautiful Bill Act),
   https://www.irs.gov/newsroom/irs-releases-tax-inflation-adjustments-for-tax-year-2026-including-amendments-from-the-one-big-beautiful-bill
 Social Security wage base 2026 $184,500 (SSA 2026 COLA fact sheet, https://www.ssa.gov/news/press/factsheets/colafacts2026.pdf).
 Additional Medicare tax 0.9% over $200k single/HoH, $250k MFJ, $125k MFS (IRC 3101(b)(2), not indexed).
 401(k) elective deferral limit 2026 $24,500 (IRS Notice 2025-67).
 State: Tax Foundation, "State Individual Income Tax Rates and Brackets, 2026" (as of Jan 1, 2026),
   https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/ . Simplified: wages only, state standard deduction
   and personal exemption/credit applied, no local/city taxes, no phase-outs, no state payroll taxes (e.g. CA SDI),
   head of household and married-separate use the single schedule. Washington taxes capital gains only, so wages = $0. */
(function(G){const FED={single:{sd:16100,b:[[0,.10],[12400,.12],[50400,.22],[105700,.24],[201775,.32],[256225,.35],[640600,.37]],addl:200000},
mfj:{sd:32200,b:[[0,.10],[24800,.12],[100800,.22],[211400,.24],[403550,.32],[512450,.35],[768700,.37]],addl:250000},
mfs:{sd:16100,b:[[0,.10],[12400,.12],[50400,.22],[105700,.24],[201775,.32],[256225,.35],[384350,.37]],addl:125000},
hoh:{sd:24150,b:[[0,.10],[17700,.12],[67450,.22],[105700,.24],[201775,.32],[256200,.35],[640600,.37]],addl:200000}};
const SS_BASE=184500,K401=24500,STATES=__STATES__;
function brackets(t,b){let tax=0,marg=0;if(t<=0)return{tax:0,marg:b.length?b[0][1]:0};for(let i=0;i<b.length;i++){const lo=b[i][0],hi=i+1<b.length?b[i+1][0]:Infinity;if(t>lo){tax+=(Math.min(t,hi)-lo)*b[i][1];marg=b[i][1]}}return{tax,marg}}
function calc({gross,status='single',state='TX',k401=0}){if(!(gross>=0)||!isFinite(gross))throw new Error('gross');const F=FED[status];if(!F)throw new Error('status');const S=STATES[state];if(!S)throw new Error('state');
 k401=Math.min(Math.max(0,k401||0),K401,gross);const agi=gross-k401,ft=Math.max(0,agi-F.sd),fed=brackets(ft,F.b);
 const ss=Math.min(gross,SS_BASE)*.062,med=gross*.0145+Math.max(0,gross-F.addl)*.009;
 const j=status==='mfj'?1:0,sb=j?S.m:S.s,st=Math.max(0,agi-S.sd[j]-(S.cr?0:S.ex[j])),sr=brackets(st,sb),stax=Math.max(0,sr.tax-(S.cr?S.ex[j]:0));
 const total=fed.tax+stax+ss+med,take=gross-total-k401;
 return{gross,k401,fedTaxable:ft,federal:fed.tax,stateTaxable:st,state:stax,ss,medicare:med,total,takeHome:take,marginal:fed.marg+(sb.length?sr.marg:0)+(gross<SS_BASE?.062:0)+(gross>F.addl?.0235:.0145),fedMarginal:fed.marg,stateMarginal:sb.length?sr.marg:0,effective:gross?total/gross:0,noStateTax:!sb.length,stateName:S.n}}
G.GWBTax={calc,FED,STATES,SS_BASE,K401,brackets}})(typeof window!=='undefined'?window:globalThis);"""
TAXJS=TAXJS.replace('__STATES__',STATES)
