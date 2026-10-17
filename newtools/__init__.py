# New tools are registered here, one module per tool. Each module defines T = dict(...)
import importlib
ORDER=['paycheck-calculator','loan-calculator','profit-margin','receipt-quote-maker','freelance-rate','logo-maker']
NEW=[importlib.import_module('newtools.'+m.replace('-','_')).T for m in ORDER]
FN={'pdf':'PDF','xlsx':'Excel (.xlsx)','csv':'CSV'}
def helper_js():
    import json
    return ''.join('{k:%s,s:%s,say:%s,tips:%s,rel:%s},\n'%(json.dumps(t['slug']),json.dumps(t['helper']['s']),json.dumps(t['helper']['say']),json.dumps(t['helper']['tips']),json.dumps(t['helper'].get('rel',[]))) for t in NEW)
