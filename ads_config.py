# AdSense settings. Ads appear ONLY in side columns (right rail next to/below the guide on tool pages, and the sidebar on the hub
# and info pages). No in-content, anchor, vignette or popup placements.
# To turn on the sidebar unit: in AdSense > Ads > By ad unit > Display ads, create a responsive VERTICAL display unit, then paste
# its data-ad-slot number below and rebuild. While it is empty, the sidebar container stays collapsed (nothing shown, no shift).
CLIENT = 'ca-pub-9780755121157050'
SCRIPT = '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9780755121157050" crossorigin="anonymous"></script>'
SLOTS = {'rail': '7011356746', 'rail2': '7653821746', 'rail3': '5027658409', 'mobile': '3786427608'}   # e.g. {'rail': '1234567890', 'mobile': '0987654321'}; mobile falls back to rail when empty
ADS_TXT = ['google.com, pub-9780755121157050, DIRECT, f08c47fec0942fa0',
           'google.com, pub-6757646035709684, DIRECT, f08c47fec0942fa0']
def rail():
    s = SLOTS.get('rail', '').strip()
    unit = (f'<ins class="adsbygoogle" style="display:block" data-ad-client="{CLIENT}" data-ad-slot="{s}" data-ad-format="auto" data-full-width-responsive="true"></ins>'
            if s else '<!-- Sidebar ad: add a vertical display unit slot ID in ads_config.py (SLOTS["rail"]) to enable. -->')
    return (f'<aside class="rail noprint{"" if s else " ad-off"}" aria-label="Advertisement (sidebar)" data-gwb-ad="rail"><span class="ad-label">Advertisement</span>'
            f'<div class="ad-slot">{unit}</div></aside>')
def rails():
    # Tool pages only: up to 3 static units in the right side column (sidebar 1 below the guide, sidebar 2 and 3 further down).
    # Sidebar 2/3 are rectangle-shaped responsive units (280px reserved) and stay hidden unless the LOADER's fit check finds room
    # for them without making the page longer; hidden units are never pushed.
    def one(key, n, fmt):
        s = SLOTS.get(key, '').strip()
        if not s: return ''
        cls = 'rail noprint' + ('' if n == 1 else f' rx r{n}')
        return (f'<aside class="{cls}" aria-label="Advertisement (sidebar {n})" data-gwb-ad="rail{"" if n == 1 else n}"><span class="ad-label">Advertisement</span>'
                f'<div class="ad-slot"><ins class="adsbygoogle" style="display:block" data-ad-client="{CLIENT}" data-ad-slot="{s}" data-ad-format="{fmt}" data-full-width-responsive="true"></ins></div></aside>')
    return '<div class="rails">' + one('rail', 1, 'auto') + one('rail2', 2, 'rectangle') + one('rail3', 3, 'rectangle') + '</div>'
def mobile():
    # Single static, in-flow banner at the very bottom (above the footer) on narrow screens with no side column. Never sticky/fixed.
    s = (SLOTS.get('mobile', '') or SLOTS.get('rail', '')).strip()
    unit = (f'<ins class="adsbygoogle" style="display:block" data-ad-client="{CLIENT}" data-ad-slot="{s}" data-ad-format="auto" data-full-width-responsive="true"></ins>'
            if s else '<!-- Bottom mobile ad: add a display unit slot ID in ads_config.py (SLOTS["mobile"], or SLOTS["rail"] as fallback) to enable. -->')
    return (f'<aside class="mban noprint{"" if s else " ad-off"}" aria-label="Advertisement (bottom)" data-gwb-ad="mobile"><span class="ad-label">Advertisement</span>'
            f'<div class="mban-slot">{unit}</div></aside>')
MCSS = ('.mban{display:none;max-width:1200px;margin:0 auto;padding:0 clamp(24px,calc(var(--gut) - (100vw - 1200px)/2),var(--gut)) 8px 24px;box-sizing:border-box}'
        '.mban-slot{min-height:100px;width:100%;overflow:hidden}.mban-slot ins.adsbygoogle{min-height:100px}'
        '@media(max-width:1000px){.mban{display:block}}@media(max-width:1100px){body:has(.layout.tl) .mban{display:block}}'
        '.mban.ad-off,.mban:has(ins.adsbygoogle[data-ad-status="unfilled"]){display:none!important}@media print{.mban{display:none!important}}')
# Push units only when their side column is actually visible (side columns are hidden on narrow screens), so nothing loads off-screen.
# Fit check (tool pages, desktop): guide keeps at least its own height (plus up to 300px of sticky travel beside long tools); extra side units are
# revealed only while guide + units still fit within the main column's height, so the page never gets longer.
FIT = ('function gwbFit(){var S=document.querySelector(".tmain>.side"),R=S&&S.querySelector(".rails");if(!R||!R.offsetWidth)return;'
       'var m=S.parentNode,G=S.querySelector(".gwrap"),g=G.firstElementChild,t=document.getElementById("tool"),cs=function(e){return parseFloat(getComputedStyle(e).rowGap)||0},'
       'mg=cs(m),sg=cs(S),rg=cs(R),T=-mg;[].forEach.call(m.children,function(e){if(e!==S&&e.offsetHeight){var c=getComputedStyle(e);T+=e.offsetHeight+mg+parseFloat(c.marginTop)+parseFloat(c.marginBottom)}});'
       'var gh=g.offsetHeight,gm=Math.max(gh,Math.min(t.offsetHeight,gh+300)),rs=R.querySelectorAll(".rail"),need=rs[0]?rs[0].offsetHeight:0,n=rs[0]?1:0;'
       'for(var i=1;i<rs.length;i++){var r=rs[i];if(n<i||r.classList.contains("ad-off"))break;r.classList.add("on");if(gm+sg+need+rg+r.offsetHeight<=T){need+=rg+r.offsetHeight;n++}else{r.classList.remove("on");break}}'
       'G.style.flexBasis=gm+"px";S.setAttribute("data-ads",n)}')
LOADER = ('<script>'+FIT+'addEventListener("load",function(){try{gwbFit()}catch(_){}document.querySelectorAll("ins.adsbygoogle:not([data-gwb-pushed])").forEach(function(e){'
          'if(e.offsetWidth>0){e.setAttribute("data-gwb-pushed","1");try{(window.adsbygoogle=window.adsbygoogle||[]).push({})}catch(_){}}})});</script>')
