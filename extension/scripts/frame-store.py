#!/usr/bin/env python3
"""Compose a 1280x800 store frame: a page, an optional popup, and a caption."""
import argparse
from PIL import Image, ImageDraw, ImageFilter, ImageFont


def load_font(size: int, bold: bool) -> ImageFont.ImageFont:
    names = (
        ("DejaVuSans-Bold.ttf", "DejaVuSans.ttf"),
        ("LiberationSans-Bold.ttf", "LiberationSans-Regular.ttf"),
    )
    folders = (
        "/usr/share/fonts/truetype/dejavu",
        "/usr/share/fonts/truetype/liberation",
    )
    for folder in folders:
        for pair in names:
            path = f"{folder}/{pair[0] if bold else pair[1]}"
            try:
                return ImageFont.truetype(path, size)
            except OSError:
                continue
    return ImageFont.load_default()


def gradient_line(draw: ImageDraw.ImageDraw, width: int) -> None:
    for x in range(width):
        t = x / max(width - 1, 1)
        if t < 0.34:
            color = (255, 138, 61, 255)
        elif t < 0.67:
            color = (232, 54, 107, 255)
        else:
            color = (124, 92, 255, 255)
        draw.line([(x, 0), (x, 3)], fill=color)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--page", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--caption", required=True)
    parser.add_argument("--popup", default="")
    args = parser.parse_args()

    width, height = 1280, 800
    canvas = Image.open(args.page).convert("RGBA").resize((width, height), Image.Resampling.LANCZOS)
    if args.popup:
        canvas = Image.alpha_composite(canvas, Image.new("RGBA", (width, height), (16, 14, 40, 72)))
        popup = Image.open(args.popup).convert("RGBA")
        scale = min(420 / popup.width, 680 / popup.height, 1)
        if scale < 1:
            popup = popup.resize((round(popup.width * scale), round(popup.height * scale)), Image.Resampling.LANCZOS)
        mask = Image.new("L", popup.size, 0)
        ImageDraw.Draw(mask).rounded_rectangle((0, 0, popup.width - 1, popup.height - 1), 22, fill=255)
        popup.putalpha(mask)
        shadow = Image.new("RGBA", (popup.width + 56, popup.height + 56), (0, 0, 0, 0))
        ImageDraw.Draw(shadow).rounded_rectangle((18, 16, popup.width + 18, popup.height + 16), 22, fill=(12, 8, 32, 150))
        shadow = shadow.filter(ImageFilter.GaussianBlur(12))
        x = width - popup.width - 36
        y = 24
        canvas.alpha_composite(shadow, (x - 18, y - 8))
        canvas.alpha_composite(popup, (x, y))

    bar_h = 78
    bar = Image.new("RGBA", (width, bar_h), (21, 18, 58, 244))
    draw = ImageDraw.Draw(bar)
    gradient_line(draw, width)
    draw.rounded_rectangle((18, 24, 54, 60), 10, fill=(232, 54, 107, 255))
    draw.text((27, 30), "G", font=load_font(18, True), fill=(255, 255, 255, 255))
    draw.text((68, 16), "GWB Tools", font=load_font(15, True), fill=(255, 217, 191, 255))
    draw.text((68, 38), args.caption, font=load_font(22, True), fill=(255, 255, 255, 255))
    canvas.alpha_composite(bar, (0, height - bar_h))
    canvas.convert("RGB").save(args.out, "PNG")


if __name__ == "__main__":
    main()
