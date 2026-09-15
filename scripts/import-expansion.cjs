const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),tmp=process.env.TEMP,ctx={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'data/music.js'),'utf8'),ctx);
const songs=ctx.window.MUSIC_DATA,read=n=>JSON.parse(fs.readFileSync(path.join(tmp,'chiffon-'+n+'.json')));
const tags=read('tags'),tagNames=Object.fromEntries(tags.tags.map(t=>[t.id,t.localized_name['zh-Hans']]));
const difficulty=['basic','advanced','expert','master','remaster'],chartTags={};
for(const t of tags.tagSongs){const matches=songs.filter(s=>s.title===t.song_id&&s.type===(t.sheet_type==='dx'?'DX':'SD')),i=difficulty.indexOf(t.sheet_difficulty);if(i<0)continue;for(const s of matches)if(s.ds[i]){const k=s.id+':'+i;chartTags[k]??=[];if(!chartTags[k].includes(tagNames[t.tag_id]))chartTags[k].push(tagNames[t.tag_id]);}}
const catalogue=[],removedTitleIds=[];
for(const [kind,list]of [['plate',read('plates').plates],['title',read('trophies').trophies]])for(const c of list){
  if(c.id===2)continue;
  if(kind==='title'&&/覚醒|覺醒|觉醒/.test(c.description||'')){removedTitleIds.push('title-'+c.id);continue;}
  const distanceMatch=(c.description||'').normalize('NFKC').match(/(?:移動距離|移动距离)\s*([\d,]+)\s*km/i),distanceTarget=distanceMatch?Number(distanceMatch[1].replaceAll(',','')):null;
  const name=c.name.replaceAll('極','极').replaceAll('暁','晓').replaceAll('鏡','镜');
  const achievement=kind==='plate'&&/^.[极将神]$/.test(name);
  const category=achievement?'achievement':/スタンプ|签到|スタンプカード/.test(c.description||'')?'stamp':/ちほー|区域/.test(c.description||'')?'region':c.required?.length?'song':c.id===1?'default':'other';
  const required=(c.required||[]).map(r=>({...r,songs:(r.songs||[]).map(q=>{const candidate=songs.find(s=>s.title===q.title&&s.type===(q.type==='dx'?'DX':'SD'));return {id:candidate?.id||String(q.id+(q.type==='dx'?10000:0)),title:q.title};})}));
  catalogue.push({id:kind==='plate'?(c.id===1?'default':achievement?name:'plate-'+c.id):'title-'+c.id,sourceId:c.id,kind,name: c.id===1?(kind==='plate'?'初来乍到':'新人出道'):name,description:c.description||'',category,distanceTarget,color:c.color||'Normal',required,stampTarget:Number(c.description?.match(/スタンプを(\d+)個/)?.[1]||10),region:c.description?.match(/^(.*?ちほー)/)?.[1]||'活动区域'});
}
const output={retrievedAt:new Date().toISOString(),tagSource:'https://miruku.dxrating.net/api/v1/tags',collectionSource:'https://maimai.lxns.net/api/v0/maimai/',reference:'https://github.com/ChiffonOwO/ChiffonMai',chartTags,removedTitleIds,collections:catalogue};
fs.writeFileSync(path.join(root,'data/expansion.js'),`(function(r){const d=${JSON.stringify(output)};if(typeof module!=='undefined')module.exports=d;else r.EXPANSION=d;})(globalThis);\n`);
console.log({taggedCharts:Object.keys(chartTags).length,collections:catalogue.length,achievementPlates:catalogue.filter(x=>x.category==='achievement').length});
