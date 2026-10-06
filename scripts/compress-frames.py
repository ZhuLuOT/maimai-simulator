from pathlib import Path

from PIL import Image


frames = Path(__file__).resolve().parent.parent / "assets" / "frames"
converted = 0
for source in frames.glob("*.png"):
    target = source.with_suffix(".webp")
    with Image.open(source) as image:
        image.save(target, "WEBP", quality=84, method=6)
    with Image.open(target) as image:
        image.verify()
    source.unlink()
    converted += 1

print(f"Compressed {converted} frame images to WebP.")
