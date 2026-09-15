(function(root){
  'use strict';
  const DATA=typeof module!=='undefined'?require('./data/expansion'):root.EXPANSION;
  const chartIndexes=new WeakMap();
  let G;const removedTitleIds=new Set(DATA.removedTitleIds||[]);const byId=new Map(DATA.collections.map(c=>[c.id,c])),ratings={d:0,c:50,b:60,bb:70,bbb:75,a:80,aa:90,aaa:94,s:97,sp:98,ss:99,ssp:99.5,sss:100,sssp:100.5};
  const initial=()=>({stampTarget:null,stamps:{},lastStamp:0,regionTarget:null,regions:{},unlocked:[]});
  function ensure(s){s.collection??=initial();s.collection.distanceKm??=0;s.profile.title??='title-1';if(removedTitleIds.has(s.profile.title))s.profile.title='title-1';if(Array.isArray(s.collection.unlocked))s.collection.unlocked=s.collection.unlocked.filter(id=>!removedTitleIds.has(id));if(removedTitleIds.has(s.collection.regionTarget))s.collection.regionTarget=null;s.profile.avatar??=null;s.nightActive??=false;s.sleepDebt??=0;s.workAbsences??=0;s.absences??=[];s.partnerSongs??=null;}
  function progress(s,item,pool){
    if(item.category==='default'||s.collection.unlocked.includes(item.id))return {unlocked:true,done:1,total:1};
    if(item.distanceTarget){const done=s.collection.distanceKm,total=item.distanceTarget;return {unlocked:done>=total,done:Math.min(done,total),total,unit:'km'};}
    const ratingTarget=item.description.match(/レーティング(\d+)達成/);if(ratingTarget){const total=Number(ratingTarget[1]);return {unlocked:s.rating>=total,done:Math.min(s.rating,total),total};}
    if(item.description==='maimai でらっくすをプレイ')return {unlocked:s.credits>0,done:Math.min(1,s.credits),total:1};
    if(item.category==='stamp'){const done=s.collection.stamps[item.id]||0;return {unlocked:done>=item.stampTarget,done,total:item.stampTarget};}
    if(item.category==='region'){const done=s.collection.regions[item.region]||0;return {unlocked:done>=10,done,total:10};}
    if(!chartIndexes.has(pool))chartIndexes.set(pool,new Map(pool.filter(c=>!G.isUtage(c)).map(c=>[G.key(c),c])));const known=chartIndexes.get(pool);let done=0,total=0,unsupported=false;
    for(const rule of item.required){if(rule.fs)unsupported=true;const diffs=rule.difficulties?.length?rule.difficulties:null;for(const song of rule.songs){const candidates=diffs?diffs.map(i=>`${song.id}:${i}`):[...known.keys()].filter(k=>k.startsWith(song.id+':'));const tests=candidates.map(k=>{const r=s.records[k];if(!known.has(k)||!r)return false;const fc=r.bestCombo||r.combo||'';return (!rule.rate||r.achievement>=(ratings[rule.rate]??102))&&(!rule.fc||(rule.fc==='fc'?!!fc:rule.fc==='fcp'?['FC+','AP'].includes(fc):rule.fc==='ap'?fc==='AP':r.achievement===101&&fc==='AP'))&&!rule.fs;});if(diffs){total+=diffs.length;done+=tests.filter(Boolean).length;}else{total++;if(tests.some(Boolean))done++;}}}
    return {unlocked:total>0&&done===total&&!unsupported,done,total,unsupported};
  }
  function stamp(s){if(s.ending||s.collection.lastStamp===s.day)return;let item=byId.get(s.collection.stampTarget);if(!item||item.category!=='stamp'||(s.collection.stamps[item.id]||0)>=item.stampTarget)item=DATA.collections.find(c=>c.category==='stamp'&&(s.collection.stamps[c.id]||0)<c.stampTarget);s.collection.lastStamp=s.day;if(!item)return;s.collection.stampTarget=item.id;s.collection.stamps[item.id]=Math.min(item.stampTarget,(s.collection.stamps[item.id]||0)+2);G.log(s,`首次上机自动签到：${item.name} ${s.collection.stamps[item.id]}/${item.stampTarget}。`,'collection');}
  function distance(s,km){s.collection.distanceKm=Math.round((s.collection.distanceKm+km)*10)/10;}
  function route(s){const item=byId.get(s.collection.regionTarget);if(!item||item.category!=='region')return;s.collection.regions[item.region]=Math.min(10,(s.collection.regions[item.region]||0)+1);if(s.collection.regions[item.region]===10)G.log(s,`${item.region} 区域完成，相关装饰已开放。`,'collection');}
  function target(s,id){const c=byId.get(id);if(!c)throw Error('不存在的收藏品。');if(c.category==='stamp')s.collection.stampTarget=id;else if(c.category==='region')s.collection.regionTarget=id;else throw Error('该收藏品通过成绩解锁。');}
  function equip(s,id,pool){const c=byId.get(id);if(!c||!progress(s,c,pool).unlocked)throw Error('尚未满足解锁条件。');s.profile[c.kind==='plate'?'plate':'title']=id;}
  function plates(s,pool){return DATA.collections.filter(c=>c.kind==='plate'&&['default','achievement'].includes(c.category)).map(c=>({...c,text:c.description,...progress(s,c,pool)}));}
  function install(api){G=api;Object.assign(api,{COLLECTIONS:DATA.collections,collectionProgress:progress,collectionTarget:target,equipCollection:equip,collectionItem:id=>byId.get(id),plates});}
  const api={ensure,stamp,distance,route,install,byId};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Collections=api;
})(globalThis);
