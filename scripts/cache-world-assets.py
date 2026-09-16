"""Cache attributed source images and produce nearest-neighbor pixel artwork."""
import io
import json
import pathlib
import urllib.parse
import urllib.request
from PIL import Image, ImageOps

DEST = pathlib.Path(__file__).resolve().parents[1] / 'assets' / 'world'
DEST.mkdir(parents=True, exist_ok=True)

def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'AttendanceSimulator/1.0 (local game art research)'})
    with urllib.request.urlopen(req, timeout=45) as response:
        return response.read()

sources = []
for key, number, name in [('chiffon','02','シフォン'),('shama','01','しゃま'),('milk','08','みるく'),('salt','04','ソルト')]:
    url = f'https://maimai.sega.jp/storage/area/region/torikoro2/icon/{number}.png'
    picture = Image.open(io.BytesIO(fetch(url))).convert('RGBA')
    thumb = ImageOps.contain(picture, (56,56), Image.Resampling.LANCZOS)
    canvas = Image.new('RGBA', (64,64)); canvas.alpha_composite(thumb, ((64-thumb.width)//2,(64-thumb.height)//2))
    canvas.resize((256,256), Image.Resampling.NEAREST).save(DEST / f'{key}.png')
    sources.append({'id':key,'name':name,'source':url,'reference':'https://maimai.sega.jp/data/circleplusArea/torikoro2.json','copyright':'SEGA / original illustrators; unofficial fan-game pixel adaptation','transformation':'56px downsample, nearest-neighbor enlargement'})

birds = [('bulbul','Light-vented bulbul'),('robin','Oriental magpie-robin'),('egret','Little egret'),('kingfisher','Common kingfisher')]
for key, title in birds:
    query = urllib.parse.urlencode({'action':'query','format':'json','prop':'pageimages','titles':title,'piprop':'thumbnail|name','pithumbsize':300})
    page = next(iter(json.loads(fetch('https://en.wikipedia.org/w/api.php?'+query))['query']['pages'].values()))
    url = page['thumbnail']['source']
    query = urllib.parse.urlencode({'action':'query','format':'json','prop':'imageinfo','titles':'File:'+page['pageimage'],'iiprop':'extmetadata'})
    info = next(iter(json.loads(fetch('https://commons.wikimedia.org/w/api.php?'+query))['query']['pages'].values()))['imageinfo'][0]['extmetadata']
    picture = Image.open(io.BytesIO(fetch(url))).convert('RGB')
    ImageOps.fit(picture,(64,64),Image.Resampling.LANCZOS).resize((256,256),Image.Resampling.NEAREST).save(DEST / f'{key}.png')
    sources.append({'id':key,'name':title,'source':url,'file':page['pageimage'],'artist':info.get('Artist',{}).get('value'),'license':info.get('LicenseShortName',{}).get('value'),'license_url':info.get('LicenseUrl',{}).get('value'),'reference':'https://en.wikipedia.org/wiki/'+title.replace(' ','_'),'transformation':'square crop, 64px downsample, nearest-neighbor enlargement'})

(DEST/'sources.json').write_text(json.dumps(sources,ensure_ascii=False,indent=2),encoding='utf-8')
print('Cached',len(sources),'attributed pixel images')
