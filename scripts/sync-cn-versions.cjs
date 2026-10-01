const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const input = process.argv[2];
if (!input) throw Error('Usage: node scripts/sync-cn-versions.cjs <LXNS version=25500 song snapshot>');
const data = JSON.parse(fs.readFileSync(input, 'utf8'));
if (!data.versions.some(v => v.version === 25500 && v.title === '舞萌DX 2026')) throw Error('Expected mainland 2026 version metadata');
const context = {window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root, 'data/music.js'), 'utf8'), context);
const versions = [...data.versions].sort((a,b) => a.version-b.version), map = {}, missing = [];
for (const song of context.window.MUSIC_DATA) {
  const id = Number(song.id), base = id >= 10000 && id < 100000 ? id-10000 : id;
  const match = data.songs.find(s => s.id === base);
  const type = id >= 100000 ? 'utage' : song.type === 'DX' ? 'dx' : 'standard';
  const intro = match?.difficulties[type]?.[0]?.version;
  const version = intro && versions.filter(v => v.version <= intro).at(-1);
  if (!version) { missing.push(song.id); continue; }
  map[song.id] = {version:version.title, versionCode:version.version};
}
if (missing.length) throw Error('Missing mainland versions: '+missing.join(', '));
const output = {source:'https://maimai.lxns.net/api/v0/maimai/song/list?version=25500&notes=true',date:new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Shanghai'}),versions,map};
fs.writeFileSync(path.join(root, 'data/cn-versions.js'), `(function(r){const d=${JSON.stringify(output)};if(typeof module!=='undefined')module.exports=d;else r.CN_VERSIONS=d;})(globalThis);\n`);
console.log({mapped:Object.keys(map).length, total:context.window.MUSIC_DATA.length});
