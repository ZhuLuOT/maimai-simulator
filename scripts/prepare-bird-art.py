"""Export generated bird atlas art without touching the original chat photos."""
import argparse
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--preview-only', action='store_true')
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    manifest = json.loads((root / 'docs/bird-atlas-art.json').read_text(encoding='utf-8'))
    source = root / 'output/imagegen'
    destination = root / 'assets/world/birds'
    species = manifest['species']
    missing = [bird['id'] for bird in species if not (source / (bird['id'] + '.png')).is_file()]
    if missing and not args.preview_only:
        raise SystemExit('Missing generated images: ' + ', '.join(missing))
    if not args.preview_only:
        destination.mkdir(parents=True, exist_ok=True)
    sheet = Image.new('RGB', (1200, ((len(species) + 4) // 5) * 288), '#edf1f3')
    draw = ImageDraw.Draw(sheet)
    font_path = Path('C:/Windows/Fonts/msyh.ttc')
    font = ImageFont.truetype(str(font_path), 18) if font_path.exists() else ImageFont.load_default(size=18)
    records = []
    for index, bird in enumerate(species):
        file = source / (bird['id'] + '.png')
        x, y = (index % 5) * 240, (index // 5) * 288
        if file.is_file():
            with Image.open(file) as image:
                image.load()
                if image.width != image.height or image.width < 256:
                    raise ValueError('Invalid image size: ' + str(file))
                art = image.convert('RGB').resize((256, 256), Image.Resampling.NEAREST)
                if not args.preview_only:
                    art.save(destination / file.name, optimize=True)
                sheet.paste(art.resize((224, 224), Image.Resampling.NEAREST), (x + 8, y + 8))
                records.append({'id': bird['id'], 'name': bird['name'], 'scientificName': bird['scientificName'],
                                'file': file.name, 'sourceSize': list(image.size), 'subjectPrompt': bird['subjectPrompt']})
        draw.text((x + 10, y + 242), str(index + 1).zfill(2) + ' ' + bird['name'], fill='#263d47', font=font)
    (root / 'artifacts').mkdir(exist_ok=True)
    sheet.save(root / 'artifacts/bird-atlas-contact-sheet.png', optimize=True)
    if not args.preview_only:
        metadata = {'type': 'AI-generated pixel illustrations', 'model': 'gpt-image-2',
                    'provider': 'ShuaiAPI', 'endpoint': '/v1/images/edits/async',
                    'requestedSize': '1024x1024', 'quality': 'medium', 'atlasSize': '256x256',
                    'reference': Path(manifest['reference']).name, 'referenceRole': manifest['referenceRole'],
                    'sharedPrompt': manifest['sharedPrompt'],
                    'promptSuffix': 'Input image 1 is a style reference only. Create one NEW individual bird sprite, not the reference collage. Use chunky 48 by 48 logical pixel art enlarged with nearest-neighbor scaling. Flat background RGB 174,193,199. Keep the sprite occupying about 75 percent of the square.',
                    'images': records}
        (destination / 'sources.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(('Previewed' if args.preview_only else 'Exported') + ' ' + str(len(records)) + '/' + str(len(species)) + ' bird illustrations.')


if __name__ == '__main__':
    main()
