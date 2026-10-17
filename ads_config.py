# AdSense settings. Ads appear ONLY in side columns (right rail next to/below the guide on tool pages, and the sidebar on the hub
# and info pages). No in-content, anchor, vignette or popup placements.
# To turn on the sidebar unit: in AdSense > Ads > By ad unit > Display ads, create a responsive VERTICAL display unit, then paste
# its data-ad-slot number below and rebuild. While it is empty, the sidebar container stays collapsed (nothing shown, no shift).
CLIENT = 'ca-pub-6757646035709684'
SCRIPT = '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6757646035709684" crossorigin="anonymous"></script>'
SLOTS = {'rail': '', 'mobile': ''}   # e.g. {'rail': '1234567890', 'mobile': '0987654321'}; mobile falls back to rail when empty
ADS_TXT = ['google.com, pub-9780755121157050, DIRECT, f08c47fec0942fa0',
           'google.com, pub-6757646035709684, DIRECT, f08c47fec0942fa0']
def rail():
    s = SLOTS.get('rail', '').strip()
    unit = (f'<ins class="adsbygoogle" style="display:block" data-ad-client="{CLIENT}" data-ad-slot="{s}" data-ad-format="vertical" data-full-width-responsive="false"></ins>'
            if s else '<!-- Sidebar ad: add a vertical display unit slot ID in ads_config.py (SLOTS["rail"]) to enable. -->')
    return (f'<aside class="rail noprint{"" if s else " ad-off"}" aria-label="Advertisement (sidebar)" data-gwb-ad="rail"><span class="ad-label">Advertisement</span>'
            f'<div class="ad-slot">{unit}</div></aside>')
def mobile():
    # Single static, in-flow banner at the very bottom (above the footer) on narrow screens with no side column. Never sticky/fixed.
    s = (SLOTS.get('mobile', '') or SLOTS.get('rail', '')).strip()
    unit = (f'<ins class="adsbygoogle" style="display:block" data-ad-client="{CLIENT}" data-ad-slot="{s}" data-ad-format="horizontal" data-full-width-responsive="true"></ins>'
            if s else '<!-- Bottom mobile ad: add a display unit slot ID in ads_config.py (SLOTS["mobile"], or SLOTS["rail"] as fallback) to enable. -->')
    return (f'<aside class="mban noprint{"" if s else " ad-off"}" aria-label="Advertisement (bottom)" data-gwb-ad="mobile"><span class="ad-label">Advertisement</span>'
            f'<div class="mban-slot">{unit}</div></aside>')
MCSS = ('.mban{display:none;max-width:1200px;margin:0 auto;padding:0 clamp(24px,calc(var(--gut) - (100vw - 1200px)/2),var(--gut)) 8px 24px;box-sizing:border-box}'
        '.mban-slot{min-height:100px;width:100%;overflow:hidden}.mban-slot ins.adsbygoogle{min-height:100px}'
        '@media(max-width:1000px){.mban{display:block}}@media(max-width:1100px){body:has(.layout.tl) .mban{display:block}}'
        '.mban.ad-off,.mban:has(ins.adsbygoogle[data-ad-status="unfilled"]){display:none!important}@media print{.mban{display:none!important}}')
# Push units only when their side column is actually visible (side columns are hidden on narrow screens), so nothing loads off-screen.
LOADER = ('<script>addEventListener("load",function(){document.querySelectorAll("ins.adsbygoogle:not([data-gwb-pushed])").forEach(function(e){'
          'if(e.offsetWidth>0){e.setAttribute("data-gwb-pushed","1");try{(window.adsbygoogle=window.adsbygoogle||[]).push({})}catch(_){}}})});</script>')
