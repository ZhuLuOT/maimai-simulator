(function(root){
  'use strict';
  const permanent=/^(はじまりの|青春|メトロポリス|ドラゴン|天界|BLACK ROSE|みかんヶ岡|でらっくす|しゅわしゅわ|スカイストリート|しゅわーランド|kawaii|高天原|宇宙すてーしょん|7sRef|ユニバース|ハピフェス|フェスティバル|10周年記念|パーリィ|バディーズ|プリズム|なないろ|月面|裏 月面)ちほー/;
  let maps=[],byId=new Map(),byReward=new Map(),batches=[],G;
  const normalize=text=>text.normalize('NFKC').toLowerCase();
  function mapName(item){
    const text=item.description;
    if(/オトモダチ|\//.test(text))return null;
    const match=text.match(/^(.*?)で獲得/)||text.match(/^(.*?) complete$/)||text.match(/^(.*?)のキャラクター/)||text.match(/^(.*?)制覇$/);
    return match&&match[1].includes('ちほー')?match[1].trim():null;
  }
  function configure(items,music){
    const groups=new Map();
    for(const item of items.filter(c=>c.category==='region')){
      const name=mapName(item);if(!name)continue;
      if(!groups.has(name))groups.set(name,{id:item.id,name,family:name.match(/^(.*?ちほー)/)[1],rewards:[]});
      if(['オリジナルちほー','イベントちほー'].includes(item.sourceGenre))groups.get(name).sourceGenre=item.sourceGenre;
      groups.get(name).rewards.push(item.id);
    }
    const collab=m=>m.sourceGenre?m.sourceGenre==='イベントちほー':!permanent.test(m.name);
    const families=[...new Set([...groups.values()].filter(collab).map(m=>m.family))];
    batches=Array.from({length:Math.min(4,families.length)},(_,i)=>families.filter((_,j)=>j%4===i));
    maps=[...groups.values()].map(m=>{
      const stem=normalize(m.family.replace(/ちほー$/,''));
      const bonus=music.filter(song=>{
        if(!song.ds.some(ds=>ds>0))return false;
        if(/東方/.test(m.family))return /東方/.test(song.genre);
        if(/Project DIVA|プロジェクトセカイ/.test(m.family))return /VOCALOID/.test(song.genre);
        return stem.length>=3&&normalize(song.artist||'').includes(stem);
      }).map(song=>song.id);
      const total=Math.max(120,m.rewards.length*40);
      return {...m,collab:collab(m),batch:families.indexOf(m.family)%4,total,
        nodes:m.rewards.map((id,i)=>({id,km:Math.ceil(total*(i+1)/m.rewards.length)})),bonus,
        task:bonus.length?{id:bonus[0],title:music.find(song=>song.id===bonus[0]).title,km:Math.floor(total/2)}:null};
    });
    byId=new Map(maps.map(m=>[m.id,m]));byReward=new Map(maps.flatMap(m=>m.rewards.map(id=>[id,m])));
  }
  function ensure(s,items){
    const c=s.collection;
    if(c.exploration!==undefined)return;
    c.exploration={selected:byReward.get(c.regionTarget)?.id||null,progress:{},stock:0,lastCredit:0};
    // Preserve every reward the former shared 10-PC counter had already earned.
    for(const item of items.filter(c=>c.category==='region')){
      const old=s.collection.regions[item.region]||0;
      if(old>=10&&!c.unlocked.includes(item.id))c.unlocked.push(item.id);
    }
    for(const m of maps){
      const legacy=Math.max(...m.rewards.map(id=>s.collection.regions[items.find(c=>c.id===id).region]||0));
      if(legacy){const km=Math.floor(m.total*legacy/10);c.exploration.progress[m.id]={km,taskCleared:legacy>=10||!!m.task&&km>m.task.km};}
    }
    // The encounter NPC titles require the omitted travel-partner subsystem.
    for(const item of items.filter(c=>c.category==='region'&&/オトモダチ/.test(c.description)))if(!c.unlocked.includes(item.id))c.unlocked.push(item.id);
  }
  function cycle(day){const index=Math.floor((day-1)/10);return {index,batch:index%batches.length,left:10-(day-1)%10,nextBatch:(index+1)%batches.length};}
  function available(m,day){return !m.collab||m.batch===cycle(day).batch;}
  function state(s,m){return s.collection.exploration.progress[m.id]||{km:0,taskCleared:false};}
  function selected(s){return byId.get(s.collection.exploration.selected)||null;}
  function select(s,id){
    const m=byId.get(id)||byReward.get(id);if(!m)throw Error('该区域尚未开放。');
    if(!available(m,s.day))throw Error('该联动区域本期未开放，进度已保留。');
    if(s.unlocks?.active||s.major?.performance||s.competition.lastCourse?.pending)throw Error('请先完成本轮游玩。');
    s.collection.exploration.selected=m.id;s.collection.regionTarget=m.rewards[0];
  }
  function snapshot(s){const m=selected(s);return m&&available(m,s.day)?{id:m.id,day:s.day}:null;}
  function rewardProgress(s,item){
    const m=byReward.get(item.id);if(m){const p=state(s,m),total=m.nodes.find(n=>n.id===item.id).km;return {unlocked:p.km>=total,done:Math.min(p.km,total),total,unit:'km'};}
    if(/オトモダチ/.test(item.description))return {unlocked:true,done:1,total:1};
    if(item.description.includes('/')){
      const names=item.description.replace(/制覇$/,'').split('/');
      const done=names.filter(name=>maps.some(m=>m.name===name&&state(s,m).km===m.total)).length;
      return {unlocked:done===names.length,done,total:names.length};
    }
    return {unlocked:false,done:0,total:0};
  }
  function settle(s,round){
    const e=s.collection.exploration;
    if(!round||round.course||round.results.length!==round.charts.length||e.lastCredit===s.credits||!round.region)return null;
    const m=byId.get(round.region.id);if(!m||!available(m,round.region.day))return null;
    e.lastCredit=s.credits;
    const p=e.progress[m.id]??={km:0,taskCleared:false},before=p.km;
    if(before>=m.total)return {id:m.id,name:m.name,gain:0,km:before,total:m.total,rewards:[],completed:true,already:true};
    let playBonus=round.mode==='pair'?1:0;
    for(const r of round.results){
      if(['FC','FC+'].includes(r.combo))playBonus=Math.max(playBonus,2);
      if(['AP','AP+'].includes(r.combo))playBonus=Math.max(playBonus,3);
      if(['fs','fsp','fsd','fsdp'].includes(r.sync))playBonus=4;
    }
    const songBonus=round.results.some(r=>m.bonus.includes(r.id))?2:0;
    const distance=Math.ceil((4+playBonus+songBonus)*round.results.length);
    const result={id:m.id,name:m.name,gain:0,km:before,total:m.total,rewards:[],completed:false,playBonus,songBonus,distance};
    if(m.task&&before===m.task.km&&!p.taskCleared){
      if(!round.results.some(r=>r.id===m.task.id&&r.achievement>=80))return {...result,blocked:true,task:m.task,stock:e.stock};
      p.taskCleared=true;result.taskPassed=true;
    }
    const limit=m.task&&!p.taskCleared?m.task.km:m.total;
    const remaining=before+distance+e.stock;
    p.km=Math.min(limit,remaining);e.stock=Math.min(999,Math.max(0,remaining-limit));
    if(p.km===m.total)e.stock=0;
    for(const n of m.nodes)if(n.km<=p.km&&!s.collection.unlocked.includes(n.id)){
      s.collection.unlocked.push(n.id);result.rewards.push(n.id);G.log(s,`区域探索：获得 ${G.collectionItem(n.id).name}。`,'collection');
    }
    Object.assign(result,{gain:p.km-before,km:p.km,completed:p.km===m.total,stock:e.stock});
    if(m.task&&p.km===m.task.km&&!p.taskCleared)Object.assign(result,{blocked:true,task:m.task});
    G.log(s,`${m.name} 前进 ${result.gain} km · ${p.km}/${m.total}${result.completed?'，区域完成。':result.blocked?'，下一轮完成课题曲后继续。':'。'}`,'collection');
    return result;
  }
  function valid(s){
    const e=s.collection.exploration,integer=(n,max)=>Number.isInteger(n)&&n>=0&&n<=max;
    return !!e&&(e.selected===null||byId.has(e.selected))&&integer(e.stock,999)&&integer(e.lastCredit,s.credits)&&
      !!e.progress&&typeof e.progress==='object'&&!Array.isArray(e.progress)&&Object.entries(e.progress).every(([id,p])=>{
        const m=byId.get(id);return m&&p&&integer(p.km,m.total)&&typeof p.taskCleared==='boolean'&&(!m.task||p.taskCleared||p.km<=m.task.km);
      });
  }
  function install(api){G=api;Object.assign(api,{REGIONS:maps,regionCycle:cycle,regionAvailable:available,regionState:state,regionSelected:selected,regionSelect:select,regionSnapshot:snapshot,regionByReward:id=>byReward.get(id),regionFamilies:batches});}
  const api={configure,ensure,rewardProgress,select,snapshot,settle,valid,install};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Regions=api;
})(globalThis);
