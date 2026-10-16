#!/usr/bin/env python3
"""Ping IndexNow (shared by Bing, Yandex, Seznam, Naver...) with every URL in sitemap.xml."""
import json,re,sys,urllib.request
key=open('.indexnow-key').read().strip()
urls=re.findall(r'<loc>([^<]+)</loc>',open('sitemap.xml').read())
host=urls[0].split('/')[2]
body=json.dumps({"host":host,"key":key,"keyLocation":f"https://{host}/{key}.txt","urlList":urls}).encode()
for ep in ["https://api.indexnow.org/indexnow","https://www.bing.com/indexnow","https://yandex.com/indexnow"]:
    try:
        r=urllib.request.urlopen(urllib.request.Request(ep,data=body,headers={"Content-Type":"application/json; charset=utf-8"}),timeout=20)
        print(ep,r.status)
    except Exception as e: print(ep,"error:",e)  # never fail the deploy over a ping
