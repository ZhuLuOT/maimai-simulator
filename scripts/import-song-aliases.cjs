const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const source = 'https://maimai.lxns.net/api/v0/maimai/alias/list';

async function main() {
  const response = await fetch(source, {signal: AbortSignal.timeout(20000)});
  if (!response.ok) throw Error(`Alias download failed: ${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data.aliases) || !data.aliases.length) throw Error('Empty alias list');
  const context = {window: {}};
  vm.runInNewContext(fs.readFileSync(path.join(root, 'data/music.js'), 'utf8'), context);
  const byId = new Map(data.aliases.map(entry => [entry.song_id, entry.aliases]));
  const result = {};
  for (const song of context.window.MUSIC_DATA) {
    // LXNS shares one song ID across SD/DX; the local DX catalog adds 10000.
    if (Number(song.id) >= 100000) continue;
    const list = byId.get(Number(song.id) % 10000);
    if (Array.isArray(list)) result[song.id] = [...new Set(list.filter(alias => typeof alias === 'string' && alias.trim()))];
  }
  for (const [title, extra] of [['PANDORA PARADOXXX', ['白潘', '紫潘']], ['系ぎて', ['白系', '紫系']], ['TiamaT:F minor', ['提马亚特']]]) {
    for (const song of context.window.MUSIC_DATA.filter(song => song.title === title)) {
      result[song.id] = [...new Set([...(result[song.id] || []), ...extra])];
    }
  }
  fs.writeFileSync(path.join(root, 'data/song-aliases.cjs'), `// Source: ${source}\n// Snapshot: ${new Date().toISOString().slice(0, 10)}; local catalog IDs only.\nmodule.exports=${JSON.stringify(result)};\n`);
  console.log(`Saved aliases for ${Object.keys(result).length} catalog songs.`);
}
main().catch(error => {console.error(error);process.exitCode = 1;});
