from pathlib import Path
import argparse
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument("--force", action="store_true", help="regenerate all images")
args = parser.parse_args()
OUT = ROOT / "img" / "og"
OUT.mkdir(parents=True, exist_ok=True)

font_candidates_regular = [
    Path(r"C:\Windows\Fonts\msyh.ttc"),
    Path(r"C:\Windows\Fonts\simhei.ttf"),
    Path(r"/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"),
    Path(r"/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
]
font_candidates_bold = [
    Path(r"C:\Windows\Fonts\msyhbd.ttc"),
    Path(r"/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc"),
    Path(r"/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
]
font_regular = next((path for path in font_candidates_regular if path.exists()), None)
font_bold = next((path for path in font_candidates_bold if path.exists()), font_regular)
if font_regular is None:
    raise SystemExit("No usable font found for OG image generation")


def wrap_text(draw, text, font, max_width):
    lines, line = [], ""
    for char in text:
        candidate = line + char
        if draw.textlength(candidate, font=font) <= max_width or not line:
            line = candidate
        else:
            lines.append(line)
            line = char
    if line:
        lines.append(line)
    return lines[:3]


def create_card(post, slug):
    width, height = 1200, 630
    image = Image.new("RGB", (width, height), "#0e1510")
    draw = ImageDraw.Draw(image)
    for y in range(height):
        ratio = y / height
        color = (int(14 + ratio * 10), int(25 + ratio * 20), int(18 + ratio * 14))
        draw.line((0, y, width, y), fill=color)
    overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.ellipse((820, -150, 1320, 350), fill=(127, 165, 138, 45))
    od.ellipse((-180, 380, 360, 900), fill=(79, 123, 89, 55))
    image = Image.alpha_composite(image.convert("RGBA"), overlay).convert("RGB")
    draw = ImageDraw.Draw(image)

    title_font = ImageFont.truetype(str(font_bold), 72)
    tag_font = ImageFont.truetype(str(font_regular), 30)
    meta_font = ImageFont.truetype(str(font_regular), 28)
    brand_font = ImageFont.truetype(str(font_bold), 30)

    draw.rectangle((72, 74, 82, 556), fill="#7fa58a")
    tags = post.get("tags", [])
    tag_text = "  ".join("#" + tag for tag in tags) if tags else "#未分类"
    tag_width = int(draw.textlength(tag_text, font=tag_font))
    draw.rounded_rectangle((132, 82, 132 + tag_width + 42, 138), radius=28, fill="#1b3121", outline="#416a4c", width=2)
    draw.text((153, 96), tag_text, font=tag_font, fill="#9ac3a2")

    lines = wrap_text(draw, post["title"], title_font, 930)
    y = 205
    for line in lines:
        draw.text((132, y), line, font=title_font, fill="#f2f7f3")
        y += 88

    draw.text((132, 520), post["date_obj"].strftime("%Y/%m/%d"), font=meta_font, fill="#aab6ad")
    draw.text((868, 520), "Merisk'B1og", font=brand_font, fill="#dce9df")
    image.save(OUT / f"{slug}.png", "PNG", optimize=True)
    return OUT / f"{slug}.png"


def strip_front_matter(text):
    if not text.startswith("---\n"):
        return "", text
    end = text.find("\n---\n", 4)
    return text[4:end], text[end + 5:]


def parse_value(raw):
    raw = raw.strip()
    if raw.startswith("[") and raw.endswith("]"):
        return [item.strip().strip('"').strip("'") for item in raw[1:-1].split(",") if item.strip()]
    return raw.strip('"').strip("'")


def parse_front_matter(raw):
    data = {}
    for line in raw.splitlines():
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        key, value = line.split(":", 1)
        data[key.strip()] = parse_value(value)
    return data

slug_overrides = {"2026-10-04-auto-generated-article": "blog-changelog"}
for path in (ROOT / "_posts").glob("*.md"):
    raw, body = strip_front_matter(path.read_text(encoding="utf-8"))
    data = parse_front_matter(raw)
    from datetime import date
    data["date_obj"] = date.fromisoformat(str(data["date"]))
    slug = slug_overrides.get(path.stem)
    if not slug:
        slug = path.stem
        if len(slug) > 11 and slug[4] == "-" and slug[7] == "-" and slug[10] == "-":
            slug = slug[11:]
    image_path = OUT / f"{slug}.png"
    if args.force or not image_path.exists():
        image_path = create_card(data, slug)
    image_url = "/" + str(image_path.relative_to(ROOT)).replace("\\", "/")
    lines = path.read_text(encoding="utf-8").splitlines()
    lines = [line for line in lines if not line.startswith("image:")]
    insert_at = next((i for i, line in enumerate(lines) if line.startswith("summary:")), None)
    if insert_at is None:
        insert_at = next(i for i, line in enumerate(lines) if line.startswith("date:"))
    lines.insert(insert_at + 1, f'image: "{image_url}"')
    path.write_text("\n".join(lines) + "\n", encoding="utf-8", newline="\n")
    print(f"{path.name} -> {image_url}")
