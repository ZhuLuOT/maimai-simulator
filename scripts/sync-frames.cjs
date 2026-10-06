const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const expansion = require('../data/expansion');

const root = path.resolve(__dirname, '..');
const dest = path.join(root, 'assets/frames');
const source = 'https://maimai.lxns.net/api/v0/maimai/frame/list?version=25500&required=true';
const area = description => description.match(/^(.*?ちほー\d*) (?:complete)$/)?.[1]
  || description.match(/^(.*?ちほー\d*)で獲得/)?.[1];

async function main() {
  const response = await fetch(source);
  if (!response.ok) throw Error(`Frame catalogue: HTTP ${response.status}`);
  const catalogue = (await response.json()).frames;
  const knownAreas = new Set(expansion.collections.filter(item => item.category === 'region').map(item =>
    item.description.match(/^(.*?)で獲得/)?.[1] || item.description.match(/^(.*?) complete$/)?.[1]
  ).filter(Boolean));
  const frames = catalogue.filter(frame => frame.id === 1 || knownAreas.has(area(frame.description || '')))
    .map(frame => ({id:`frame-${frame.id}`,sourceId:frame.id,kind:'frame',name:frame.id===1?'默认背景框':frame.name,
      description:frame.description,region:area(frame.description || '') || null,sourceGenre:frame.genre}));
  fs.mkdirSync(dest, {recursive:true});
  const queue = frames.slice();
  const failed = [];
  await Promise.all(Array.from({length:8}, async () => {
    while (queue.length) {
      const frame = queue.shift();
      const file = path.join(dest, `${frame.sourceId}.png`);
      if (fs.existsSync(file) || fs.existsSync(path.join(dest, `${frame.sourceId}.webp`))) continue;
      try {
        const image = await fetch(`https://assets2.lxns.net/maimai/frame/${frame.sourceId}.png`, {signal:AbortSignal.timeout(20000)});
        if (!image.ok) throw Error(`HTTP ${image.status}`);
        const buffer = Buffer.from(await image.arrayBuffer());
        if (buffer.toString('ascii',1,4) !== 'PNG') throw Error('Invalid PNG');
        fs.writeFileSync(file, buffer);
      } catch (error) { failed.push({id:frame.sourceId,error:error.message}); }
    }
  }));
  if (failed.length) throw Error(`Frame images missing: ${JSON.stringify(failed)}`);
  const conversion = spawnSync('python', [path.join(__dirname, 'compress-frames.py')], {stdio:'inherit'});
  if (conversion.status !== 0) throw Error('Frame compression failed; install Pillow and retry.');
  fs.writeFileSync(path.join(root,'data/frames.js'),`(function(r){const d=${JSON.stringify({source,retrievedAt:new Date().toISOString(),frames})};if(typeof module!=='undefined')module.exports=d;else r.FRAME_DATA=d;})(globalThis);\n`);
  console.log(`Cached ${frames.length} mainland-area frames.`);
}
main().catch(error => {console.error(error);process.exitCode=1;});
