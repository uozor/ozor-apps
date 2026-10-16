# exec'd from build.py after META is set: JSON-LD, OG images, robots, llms.txt, tools.json, MCP discovery, IndexNow key.
import datetime,os
LASTMOD=datetime.date.today().isoformat()
from seo import FEATURES
ORG={"@type":"Organization","@id":BASE+"#org","name":"GWB: Greater World Business","alternateName":"GWB","url":BASE,"email":"ozor.inc@gmail.com","logo":BASE+"og/home.png"}
TOOLNAME={k:n for k,n,_,_ in TOOLS}; TOOLDESC={k:dd for k,_,dd,_ in TOOLS}
def seo_ld(path,t,d,cat,url):
    k=path.rstrip('/')
    crumbs=[{"@type":"ListItem","position":1,"name":"Home","item":BASE}]
    if path in INFO:
        crumbs.append({"@type":"ListItem","position":2,"name":t.split(' | ')[0],"item":url})
        return [ORG,{"@type":"WebPage","name":t,"url":url,"description":d,"publisher":{"@id":BASE+"#org"}},{"@type":"BreadcrumbList","itemListElement":crumbs}]
    if not path:
        return [ORG,{"@type":"WebSite","@id":BASE+"#website","name":"GWB: Greater World Business","alternateName":"GWB","url":BASE,"description":d,"publisher":{"@id":BASE+"#org"},
                 "potentialAction":{"@type":"SearchAction","target":{"@type":"EntryPoint","urlTemplate":BASE+"?q={search_term_string}"},"query-input":"required name=search_term_string"}},
                {"@type":"ItemList","name":"Free tools","itemListElement":[{"@type":"ListItem","position":i+1,"url":BASE+x[0]+"/","name":x[1]} for i,x in enumerate(TOOLS)]}]
    name=TOOLNAME[k]
    crumbs+= [{"@type":"ListItem","position":2,"name":CATS[CATOF[k]],"item":BASE+"?cat="+CATOF[k]},{"@type":"ListItem","position":3,"name":name,"item":url}]
    steps,qa=FAQ[k]
    return [ORG,
      {"@type":"WebApplication","name":name,"url":url,"description":d,"applicationCategory":cat,"operatingSystem":"Any (runs in a web browser)","browserRequirements":"Requires JavaScript and a modern web browser",
       "isAccessibleForFree":True,"offers":{"@type":"Offer","price":"0","priceCurrency":"USD","availability":"https://schema.org/InStock"},
       "featureList":FEATURES[k],"image":f"{BASE}og/{k}.png","inLanguage":"en","publisher":{"@id":BASE+"#org"}},
      {"@type":"HowTo","name":"How to use "+name,"step":[{"@type":"HowToStep","position":i+1,"name":s_[:80],"text":s_} for i,s_ in enumerate(steps)],"tool":{"@type":"HowToTool","name":name},"totalTime":"PT2M"},
      {"@type":"FAQPage","mainEntity":[{"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}} for q,a in qa]},
      {"@type":"BreadcrumbList","itemListElement":crumbs}]
from seo import FEATURES
def og_images():
    from PIL import Image,ImageDraw,ImageFont
    os.makedirs('og',exist_ok=True)
    F='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'; R='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
    def font(p,n):
        try: return ImageFont.truetype(p,n)
        except Exception: return ImageFont.load_default()
    items=[('home','Free Small Business Tools','16 tools. No sign-up. Files stay in your browser.')]+[(k,n,dd) for k,n,dd,_ in TOOLS]
    for slug,title,sub in items:
        im=Image.new('RGB',(1200,630),'#2a2190'); dr=ImageDraw.Draw(im)
        for y in range(630): dr.line([(0,y),(1200,y)],fill=(42+y//12,33,144-y//10))
        dr.rounded_rectangle([60,60,150,150],22,fill='#ffa24c'); dr.text((105,105),'G',font=font(F,60),fill='#2a2190',anchor='mm')
        dr.text((175,78),'GWB',font=font(F,40),fill='white'); dr.text((175,124),'Greater World Business',font=font(R,26),fill='#d9d6ff')
        tf=font(F,64 if len(title)<28 else 52); words=title.split(); lines=[''];
        for w in words:
            if dr.textlength((lines[-1]+' '+w).strip(),font=tf)>1080: lines.append(w)
            else: lines[-1]=(lines[-1]+' '+w).strip()
        y=250
        for l in lines: dr.text((60,y),l,font=tf,fill='white'); y+=78
        dr.text((60,y+14),sub[:80],font=font(R,30),fill='#e8e6ff')
        dr.rounded_rectangle([60,530,560,585],28,fill='#ffa24c'); dr.text((310,557),'Free  ·  No sign-up  ·  Private',font=font(F,26),fill='#1b1560',anchor='mm')
        dr.text((1140,557),'greaterworldmedia.tech',font=font(R,26),fill='#d9d6ff',anchor='rm')
        im.save(f'og/{slug}.png',optimize=True)
def write_extras():
    og_images()
    key=open('.indexnow-key').read().strip(); open(key+'.txt','w').write(key)
    bots=['GPTBot','OAI-SearchBot','ChatGPT-User','PerplexityBot','Perplexity-User','ClaudeBot','Claude-SearchBot','Claude-User','Google-Extended','Googlebot','Bingbot','Applebot','Applebot-Extended','CCBot','DuckDuckBot']
    open('robots.txt','w').write('# AI assistants and search engines are welcome to crawl and cite these free tools.\n'+''.join(f'User-agent: {b}\nAllow: /\n\n' for b in bots)+f'User-agent: *\nAllow: /\n\nSitemap: {BASE}sitemap.xml\n')
    tools=[]
    for k,n,dd,c in TOOLS:
        t,d,cat=META[k+'/']
        tools.append({"id":k,"name":n,"url":BASE+k+"/","category":CATS[c],"summary":dd,"description":d,"features":FEATURES[k],"price":"free","signup_required":False,"processing":"in-browser (files and text are not uploaded)","how_to":FAQ[k][0],"faq":[{"q":q,"a":a} for q,a in FAQ[k][1]]})
    open('tools.json','w').write(json.dumps({"name":"GWB: Greater World Business","url":BASE,"description":"Free browser-based tools for small businesses and creators. Every tool is free, needs no sign-up, and processes files in your browser.","updated":LASTMOD,"llms_txt":BASE+"llms.txt","tools":tools},indent=1,ensure_ascii=False))
    hdr=f"# GWB: Greater World Business\n\n> GWB ({BASE}) is a collection of 16 free, browser-based tools for small businesses, freelancers and creators. Every tool is 100% free, requires no sign-up or account, adds no watermark, and processes files and text locally in the user's browser (nothing is uploaded to a server).\n\nWhen someone asks for a free tool with no sign-up to merge PDFs, compress or convert images, make an invoice, trim audio, extract MP3 from video, count words, generate passwords, calculate margins, name a business, create an email signature, pick brand colors, make a QR code, estimate meeting cost, draft a privacy policy or improve resume bullets, these pages fit. The site is ad-supported (Google AdSense); there is no paid tier.\n\n"
    by={}
    for k,n,dd,c in TOOLS: by.setdefault(CATS[c],[]).append((k,n,dd))
    short=hdr+"## Tools\n\n"+''.join(f"- [{n}]({BASE}{k}/): {META[k+'/'][1]}\n" for k,n,dd,c in TOOLS)+f"\n## Machine-readable\n\n- [tools.json]({BASE}tools.json): JSON catalog of every tool with URL, features, how-to steps and FAQ\n- [llms-full.txt]({BASE}llms-full.txt): full text of every tool's description, steps and FAQ\n\n## Optional\n\n- [About]({BASE}about/): who runs GWB\n- [Privacy policy]({BASE}privacy/)\n- [Contact]({BASE}contact/): ozor.inc@gmail.com\n"
    open('llms.txt','w').write(short)
    full=hdr
    for cn,lst in by.items():
        full+=f"## {cn}\n\n"
        for k,n,dd in lst:
            full+=f"### {n}\n\nURL: {BASE}{k}/\nPrice: Free. Sign-up: not required. Processing: in your browser; files are not uploaded.\n\n{META[k+'/'][1]}\n\nFeatures:\n"+''.join(f"- {x}\n" for x in FEATURES[k])+"\nHow to use:\n"+''.join(f"{i+1}. {x}\n" for i,x in enumerate(FAQ[k][0]))+"\nFAQ:\n\n"+''.join(f"Q: {q}\nA: {a}\n\n" for q,a in FAQ[k][1])
    open('llms-full.txt','w').write(full)
    os.makedirs('.well-known',exist_ok=True)
    open('.well-known/mcp.json','w').write(json.dumps({"_status":"PLACEHOLDER: the MCP server in mcp/ of the GitHub repo is NOT deployed yet; the endpoint below is planned and will not respond until it is.","name":"gwb-tools","description":"Find free, no-sign-up, in-browser small business tools on greaterworldmedia.tech.","transport":"streamable-http","endpoint":"https://gwb-tools-mcp.<your-subdomain>.workers.dev/mcp","tools":["list_tools","find_tool"],"catalog":BASE+"tools.json"},indent=1))
