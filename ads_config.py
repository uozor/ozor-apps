# AdSense settings. Ads appear ONLY in side columns (right rail next to/below the guide on tool pages, and the sidebar on the hub
# and info pages). No in-content, anchor, vignette or popup placements.
# To turn on the sidebar unit: in AdSense > Ads > By ad unit > Display ads, create a responsive VERTICAL display unit, then paste
# its data-ad-slot number below and rebuild. While it is empty, the sidebar container stays collapsed (nothing shown, no shift).
CLIENT = 'ca-pub-6757646035709684'
SCRIPT = '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6757646035709684" crossorigin="anonymous"></script>'
SLOTS = {'rail': ''}   # e.g. {'rail': '1234567890'}
ADS_TXT = ['google.com, pub-9780755121157050, DIRECT, f08c47fec0942fa0',
           'google.com, pub-6757646035709684, DIRECT, f08c47fec0942fa0']
def rail():
    s = SLOTS.get('rail', '').strip()
    unit = (f'<ins class="adsbygoogle" style="display:block" data-ad-client="{CLIENT}" data-ad-slot="{s}" data-ad-format="vertical" data-full-width-responsive="false"></ins>'
            if s else '<!-- Sidebar ad: add a vertical display unit slot ID in ads_config.py (SLOTS["rail"]) to enable. -->')
    return (f'<aside class="rail noprint{"" if s else " ad-off"}" aria-label="Advertisement (sidebar)" data-gwb-ad="rail"><span class="ad-label">Advertisement</span>'
            f'<div class="ad-slot">{unit}</div></aside>')
# Push units only when their side column is actually visible (side columns are hidden on narrow screens), so nothing loads off-screen.
LOADER = ('<script>addEventListener("load",function(){document.querySelectorAll("ins.adsbygoogle:not([data-gwb-pushed])").forEach(function(e){'
          'if(e.offsetWidth>0){e.setAttribute("data-gwb-pushed","1");try{(window.adsbygoogle=window.adsbygoogle||[]).push({})}catch(_){}}})});</script>')
