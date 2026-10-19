#!/usr/bin/env python3
"""Draw the GWB globe mark at every size the stores ask for."""
import math
import os
from pathlib import Path

try:
    from PIL import Image, ImageDraw
except ImportError:
    import subprocess
    import sys
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'pillow', '-q'])
    from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SIZES = [16, 19, 32, 38, 48, 64, 96, 128, 256, 512, 1024]
DESTS = [ROOT / 'public' / 'icons', ROOT / 'store' / 'icons']


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def color_at(x, y, size):
    t = (x + y) / (2 * (size - 1 or 1))
    orange = (255, 162, 76)
    pink = (232, 54, 107)
    purple = (124, 92, 255)
    if t < 0.55:
        return lerp(orange, pink, t / 0.55)
    return lerp(pink, purple, (t - 0.55) / 0.45)


def draw(size):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    px = img.load()
    radius = size * 0.28
    for y in range(size):
        for x in range(size):
            # rounded-rect mask
            dx = min(x, size - 1 - x)
            dy = min(y, size - 1 - y)
            inside = True
            if dx < radius and dy < radius:
                if (radius - dx) ** 2 + (radius - dy) ** 2 > radius ** 2:
                    inside = False
            if inside:
                r, g, b = color_at(x, y, size)
                px[x, y] = (r, g, b, 255)
    draw = ImageDraw.Draw(img)
    cx = cy = (size - 1) / 2
    stroke = max(1, round(size * 0.055))
    r = size * 0.28
    draw.ellipse((cx - r, cy - r, cx + r, cy + r), outline=(255, 255, 255, 255), width=stroke)
    draw.ellipse((cx - r * 0.44, cy - r, cx + r * 0.44, cy + r), outline=(255, 255, 255, 255), width=max(1, stroke - 1))
    inset = r * 0.38
    draw.line((cx - r, cy - inset, cx + r, cy - inset), fill=(255, 255, 255, 255), width=max(1, stroke - 1))
    draw.line((cx - r, cy + inset, cx + r, cy + inset), fill=(255, 255, 255, 255), width=max(1, stroke - 1))
    dot = max(1.5, size * 0.075)
    dx = cx + r * 0.95
    dy = cy - r * 0.95
    draw.ellipse((dx - dot, dy - dot, dx + dot, dy + dot), fill=(255, 255, 255, 255))
    return img


def main():
    for dest in DESTS:
        dest.mkdir(parents=True, exist_ok=True)
    for size in SIZES:
        img = draw(size)
        for dest in DESTS:
            img.save(dest / f'{size}.png')
    print('icons', ', '.join(str(s) for s in SIZES))


if __name__ == '__main__':
    main()
