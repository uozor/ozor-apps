#!/usr/bin/env bash
# Regenerates all test fixtures (needs ffmpeg, python3 + Pillow + pypdf).
set -e; cd "$(dirname "$0")/fixtures"
python3 - <<'PY'
from PIL import Image
import io, pypdf
Image.new('RGB',(800,600),(200,80,40)).save('photo.jpg',quality=90)
Image.new('RGBA',(300,200),(0,120,200,128)).save('alpha.png')
Image.new('RGB',(320,240),(30,160,90)).save('pic.webp')
Image.new('RGB',(9000,9000),(10,10,10)).save('huge.jpg',quality=20)
open('empty.png','wb').close(); open('empty.pdf','wb').close(); open('empty.mp4','wb').close(); open('empty.wav','wb').close()
open('corrupt.png','wb').write(b'\x89PNG\r\n\x1a\n'+b'garbage'*200)
open('corrupt.jpg','wb').write(b'\xff\xd8\xff\xe0'+b'\x00junk'*300)
open('notes.txt','w').write('just text, not an image or pdf')
open('fake.pdf','wb').write(b'%PDF-1.4\nthis is not really a pdf\n%%EOF')
open('corrupt.mp3','wb').write(b'ID3'+bytes(range(256))*40)
def mk(n,name):
  w=pypdf.PdfWriter()
  for _ in range(n): w.add_blank_page(612,792)
  w.write(name); return w
mk(3,'a.pdf'); mk(2,'b.pdf')
w=pypdf.PdfWriter(); [w.add_blank_page(612,792) for _ in range(2)]; w.encrypt(user_password='secret',owner_password='own',algorithm='AES-256'); w.write('locked.pdf')
d=open('a.pdf','rb').read(); open('truncated.pdf','wb').write(d[:len(d)//2])
PY
ffmpeg -loglevel error -y -f lavfi -i "sine=frequency=440:duration=3" -ac 2 -ar 44100 tone.wav
ffmpeg -loglevel error -y -f lavfi -i "sine=frequency=330:duration=3" -b:a 96k tone.mp3
ffmpeg -loglevel error -y -f lavfi -i "testsrc=size=160x120:rate=10:duration=2" -f lavfi -i "sine=frequency=500:duration=2" -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest clip.mp4
ffmpeg -loglevel error -y -f lavfi -i "testsrc=size=160x120:rate=10:duration=2" -c:v libx264 -pix_fmt yuv420p -an silent.mp4
# "unsupported codec": audio in a codec Chrome can't decode (AMR-NB in 3gp)
ffmpeg -loglevel error -y -f lavfi -i "sine=frequency=500:duration=2" -ar 8000 -ac 1 -c:a pcm_mulaw odd.mkv 2>/dev/null || true
