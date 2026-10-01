const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const root = path.join(__dirname, '..');
const snapshots = path.resolve(process.argv[2] || path.join(root, 'artifacts/region-check'));
const read = name => JSON.parse(fs.readFileSync(path.join(snapshots, name), 'utf8'));
const context = {window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root, 'data/music.js'), 'utf8'), context);
const local = context.window.MUSIC_DATA, fish = read('fish-current.json').filter(s=>s.id!=='11879'), lxns = read('lxns-current.json');
const cn = require('../data/cn-versions'), expansion = require('../data/expansion'), G = require('../engine');
const ids = new Set(local.map(s => s.id)), fishIds = new Set(fish.map(s => s.id));
const plates = read('plates-current.json').plates, trophies = read('trophies-current.json').trophies;
const partner = c => /親密度|覚醒|覺醒|觉醒/.test(c.description || '');
const plateScope = c => ![1,2].includes(c.id) && !partner(c);
const localPlates = expansion.collections.filter(c => c.kind === 'plate' && c.sourceId !== 1 && !partner(c));
const songKey = s => String(s.id + (s.type === 'dx' ? 10000 : 0));
const songTrophies = trophies.filter(c => !partner(c) && c.required?.some(r => r.songs?.length) && c.required.every(r => r.songs.every(s => ids.has(songKey(s)))));
const describe = c => ({id:c.id, name:c.name || c.title});
const result = {
  checkedAt:new Date().toISOString(),
  sources:{songs:'https://www.diving-fish.com/api/maimaidxprober/music_data', versions:cn.source, plates:'https://maimai.lxns.net/api/v0/maimai/plate/list?version=25500&required=true', trophies:'https://maimai.lxns.net/api/v0/maimai/trophy/list?version=25500&required=true'},
  songs:{api:fish.length, local:local.length, includesUtage:true, excludedInvalid:['11879'],
    missing:fish.filter(s => !ids.has(s.id)).map(describe), extra:local.filter(s => !fishIds.has(s.id)).map(describe),
    changed:fish.filter(s => {const l=local.find(l => l.id===s.id);return l && ['title','type','ds','level'].some(k => JSON.stringify(s[k])!==JSON.stringify(l[k]));}).map(describe),
    missingVersions:local.filter(s => !cn.map[s.id]).map(describe),
    missingCovers:local.filter(s => !fs.existsSync(path.join(root, 'assets/covers', s.id+'.webp'))).map(describe)},
  mainlandVersion:lxns.versions.find(v => v.version === 25500),
  plates:{api:plates.length, applicable:plates.filter(plateScope).length, local:localPlates.length,
    skippedPartner:plates.filter(partner).map(describe),
    missing:plates.filter(plateScope).filter(c => !localPlates.some(l => l.sourceId===c.id)).map(describe),
    extra:localPlates.filter(c => !plates.some(p => p.id===c.sourceId)).map(describe)},
  songTitles:{applicable:songTrophies.length, missing:songTrophies.filter(c => !expansion.collections.some(l => l.kind==='title' && l.sourceId===c.id)).map(describe),
    unsupportedByCurrentSongPool:expansion.collections.filter(c => c.kind==='title' && c.category==='song' && !G.collectionItem(c.id)).length},
  regions:{total:G.REGIONS.length, permanent:G.REGIONS.filter(m => !m.collab).length,
    missingPlateRegions:plates.filter(c => c.genre==='オリジナルちほー' && /で獲得$/.test(c.description)).filter(c => !G.REGIONS.some(m => m.rewards.includes('plate-'+c.id))).map(describe),
    note:'收藏品目录包含历代奖励，不提供区域当前开放或关闭日期；常驻表示模拟器中的原创区域分类，不等于当前机台开放清单。'},
};
fs.writeFileSync(path.join(snapshots, 'catalogue-comparison.json'), JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
