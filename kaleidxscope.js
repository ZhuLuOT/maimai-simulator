(function(root){
  'use strict';
  const D=typeof module!=='undefined'?require('./data/unlocks'):root.UNLOCK_DATA;
  const J=typeof module!=='undefined'?require('./judgement'):root.Judgement;
  const H=typeof module!=='undefined'?require('./data/glitch-door'):root.GLITCH_DOOR;
  D.doors.push(H.door);
  let G,play;const nodeCache=new Map(), songNodes=new Map(), gateSongs=new Map();
  const door=id=>D.doors.find(d=>d.id===id);
  const allLocked=[...new Set([...D.regions.flatMap(r=>r.songs),...D.doors.filter(d=>!d.hidden).map(d=>d.song),...D.prismRewards])];
  const rand=s=>{s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296;};
  function ensure(s,fresh=false){
    if(!s.unlocks)s.unlocks={version:1,legacy:!fresh&&s.credits>0?allLocked.slice():[],songs:[],played:[],discovered:{},keys:[],cleared:[],randomPick:[],active:null,result:null,notices:[]};
    s.unlocks.blueUntil??=null;
    for(const name of ['legacy','songs','played'])s.unlocks[name]=s.unlocks[name].filter(id=>id!=='11879'&&(id!=='11820'||s.unlocks.cleared.includes('prism')||name==='played'));
    for(const bag of [s.records,s.practice,s.learning])if(bag)for(const k of Object.keys(bag))if(k.startsWith('11879:'))delete bag[k];
    if(s.partnerSongs?.some(c=>c.id==='11879'))s.partnerSongs=null;
    if(Array.isArray(s.selectedCharts))s.selectedCharts=s.selectedCharts.filter(k=>!k.startsWith('11879:'));
    if(s.major?.performance?.charts?.some(k=>k.startsWith('11879:'))){s.major.performance=null;if(s.major.duel.stage==='battle')s.major.duel.stage='select';}
  }
  function route(s,name){const m=G.REGIONS.find(m=>m.name===name);return m?{map:m,...G.regionState(s,m)}:null;}
  function regionSongs(name){if(nodeCache.has(name))return nodeCache.get(name);const r=D.regions.find(r=>r.region===name),m=G.REGIONS.find(m=>m.name===name);if(!r||!m||m.collab)return [];
    const list=r.songs.filter(id=>!D.doors.some(d=>d.song===id)&&!D.prismRewards.includes(id));
    const nodes=list.map((id,i)=>({id,km:Math.ceil(m.total*(i+1)/list.length)}));nodeCache.set(name,nodes);return nodes;
  }
  function lockReason(s,id){id=String(id);if(id==='11879')return '隐藏课题，仅限乱码门';const u=s.unlocks;if(id==='11820'&&!u?.cleared.includes('prism'))return '通关棱镜塔解锁';if(u?.legacy.includes(id)||u?.songs.includes(id))return '';
    const gate=gateSongs.get(id);if(gate)return `通关${gate.name}解锁`;
    const entry=songNodes.get(id);if(!entry)return '';
    const {region,n}=entry,p=route(s,region);if(p&&p.km>=n.km)return '';const selected=G.regionSelected(s);if(selected?.name===region&&selected.task?.id===id&&G.regionState(s,selected).km>=selected.task.km&&G.regionAvailable(selected,s.day))return '';return `${region} · ${n.km} km 解锁`;
  }
  function refresh(s){const u=s.unlocks;if(!u)return;
    for(const r of D.regions){const p=route(s,r.region);if(!p)continue;for(const n of regionSongs(r.region))if(p.km>=n.km&&!u.songs.includes(n.id)){u.songs.push(n.id);if(!u.legacy.includes(n.id))u.notices.push({title:'区域曲解锁',text:`${G.songTitle(n.id)} · ${r.region}`});}}
    for(const d of D.doors){if(d.hidden){if(u.cleared.includes('prism')){u.discovered[d.id]??=s.day;if(!u.keys.includes(d.id))u.keys.push(d.id);}continue;}const p=route(s,d.region);if(p?.km>=p?.map.total&&!u.discovered[d.id]){u.discovered[d.id]=s.day;u.notices.push({title:`发现${d.name}`,text:`${d.region} 已完成。取得钥匙后，可以进入万花筒挑战。`});G.log(s,`发现${d.name}。`,'event');}
      if(['blue','black','red'].includes(d.id)&&d.keySongs.every(id=>u.played.includes(id)))grantKey(s,d.id);
    }
    if(D.doors.filter(d=>d.id!=='prism'&&!d.hidden).every(d=>u.cleared.includes(d.id)))grantKey(s,'prism');
  }
  function grantKey(s,id){const u=s.unlocks;if(u.keys.includes(id))return;u.keys.push(id);u.notices.push({title:id==='prism'?'万能钥匙合成':`${door(id).name}钥匙`,text:id==='prism'?'六枚碎片汇聚成万能钥匙。发现棱镜塔后可进入挑战。':'钥匙已获得，发现对应入口后可进入三曲挑战。'});G.log(s,`获得${id==='prism'?'万能':door(id).name}钥匙。`,'event');}
  function afterRound(s,round){if(round.gate||round.course)return;const u=s.unlocks,ids=round.results.map(c=>c.id);for(const id of ids)if(!u.played.includes(id))u.played.push(id);
    if(new Set(ids).size===ids.length&&ids.length>=3){
      if(round.results.every(c=>/大国奏音/.test(c.artist)))grantKey(s,'white');
      if(round.results.every(c=>/言ノ葉/.test(c.genre)||door('purple').keySongs.includes(c.id)||D.regions.filter(r=>/BLACK ROSE/.test(r.region)).some(r=>r.songs.includes(c.id))))grantKey(s,'purple');
    }
    if(u.randomPick.length&&round.charts.join()===u.randomPick.join()&&ids.some(id=>door('yellow').keySongs.includes(id)))grantKey(s,'yellow');
    u.randomPick=[];refresh(s);
  }
  function rules(s,id){const day=s.unlocks.discovered[id],age=day?s.day-day+1:1;const stages=[[1,1,3],[4,10,3],[7,30,3],[10,50,3],[14,100,2],[21,999,0]];const [at,life,min]=stages.filter(x=>x[0]<=age).at(-1);return {age,life,min,next:stages.find(x=>x[0]>age)?.[0]||null};}
  function reason(s,id,index=3){const d=door(id),u=s.unlocks;if(!d)return '请选择门';if(u.active||u.blueUntil)return '先完成当前挑战';if(s.major?.performance||s.major?.bird||!['locked','done'].includes(s.major.duel.stage)||s.ending)return '先完成当前事件';if(!u.discovered[id])return d.hidden?'先通关棱镜塔':`先完成 ${d.region}`;if(!u.keys.includes(id))return '尚未取得钥匙';if(s.mode!=='solo')return '万花筒挑战需要单开';if(s.roundReview)return '请先进入下一轮上机';if(!Number.isInteger(index)||index<rules(s,id).min||index>3)return '该难度尚未开放';return G.playReason(s);}
  function eventPool(pool){const charts=H.song.ds.map((ds,index)=>{const base=pool.find(c=>c.id==='11820'&&c.index===index);if(!base)throw Error('隐藏课题数据不完整');const notes=H.song.notes[index],ratio=notes[2]/notes.reduce((a,b)=>a+b,0),starWeight=Math.max(.12,Math.min(.88,ratio*2.4));return {...base,...H.song,ds,index,notes,level:H.song.level[index],starWeight,tendency:starWeight>=.5?'star':'key',fit:undefined,samples:undefined,tag:undefined,comparison:undefined,tags:[],classification:'音符占比估算',eventOnly:true};});return [...pool.filter(c=>c.id!=='11879'),...charts];}
  function selection(s,d,index,pool){const available=d.pool.map(id=>pool.find(c=>c.id===id&&c.index===index)).filter(Boolean),fixed=pool.find(c=>c.id===d.song&&c.index===index);if(available.length<2||!fixed)throw Error('课题数据不完整');const first=available.splice(Math.floor(rand(s)*available.length),1)[0],second=available[Math.floor(rand(s)*available.length)];return d.hidden?[fixed,first,second]:[first,second,fixed];}
  function activate(s,id,index,pool,round){const r=rules(s,id);s.unlocks.result=null;s.unlocks.randomPick=[];s.unlocks.active={door:id,index,day:s.day,maxLife:r.life,life:r.life,round,plans:round.charts.map(k=>J.planSegments(s,pool.find(c=>G.key(c)===k))),decisions:round.charts.map(()=>[]),feedback:null};s.roundReview=true;}
  function start(s,id,index,pool){refresh(s);const why=reason(s,id,index);if(why)throw Error(why);pool=eventPool(pool);const d=door(id),seed=s.seed,chosen=selection(s,d,index,pool);let round;try{round=play.begin(s,chosen,pool,0,true);}catch(e){if(e.interrupted){G.claimHomeGoals(s);return;}s.seed=seed;throw e;}if(!round)return;activate(s,id,index,pool,round);
  }
  function current(s,pool){const a=s.unlocks.active;if(!a)return null;const i=a.round.results.length,c=eventPool(pool).find(c=>G.key(c)===a.round.charts[i]),plan=a.plans[i]?.[a.decisions[i].length];return {chart:c,index:i,plan,options:plan?J.segmentOptions(s,{...c,ds:G.effectiveDifficulty(s,c)},plan.tag):[]};}
  function choose(s,id,pool){const a=s.unlocks.active,e=current(s,pool);if(!a||a.feedback||!e.plan)throw Error('当前没有待选择的难段');const o=e.options.find(o=>o.id===id);if(!o)throw Error('无效策略');const passed=rand(s)<o.chance;a.decisions[e.index].push({tag:e.plan.tag,strategy:id,chance:o.chance,passed,intensity:1/a.plans[e.index].length});a.feedback={title:passed?'难段成功':'难段失败',text:passed?'接住了这段配置。':'出现失误，将在本曲结算时扣除 LIFE。',track:false};}
  function step(s,pool){const a=s.unlocks.active;if(!a)throw Error('没有进行中的挑战');if(a.feedback){const finished=a.feedback.track;a.feedback=null;if(finished&&(a.life===0||a.round.results.length===3))return finish(s,pool);if(finished)return;}
    const e=current(s,pool);if(e.plan)return;const c=play.record(s,a.round,e.chart,a.decisions[e.index]);const loss=c.judgements.good*D.rules.good+c.judgements.miss*D.rules.miss;a.life=Math.max(0,a.life-loss);a.feedback={title:`第 ${a.round.results.length} 首 · ${a.life>0?'CLEAR':'FAILED'}`,text:`${c.title} · ${c.achievement.toFixed(4)}% · LIFE −${loss}，剩余 ${a.life}/${a.maxLife}`,track:true};
  }
  function finish(s,pool){const a=s.unlocks.active;if(!a||a.round.results.length<3&&a.life>0)throw Error('挑战尚未结束');const passed=a.round.results.length===3&&a.life>0;const d=door(a.door),forced=passed&&d.id==='prism'&&!s.unlocks.discovered.glitch;const report={door:a.door,passed,life:a.life,maxLife:a.maxLife,results:a.round.results,pending:true};s.unlocks.active=null;play.finish(s,a.round,pool,forced);s.unlocks.result=report;
    if(passed){if(!s.unlocks.cleared.includes(d.id))s.unlocks.cleared.push(d.id);for(const id of d.hidden?[]:d.id==='prism'?D.prismRewards:[d.song])if(!s.unlocks.songs.includes(id))s.unlocks.songs.push(id);refresh(s);}
    G.log(s,`${d.name}：${passed?'通关':'挑战失败'}，LIFE ${a.life}/${a.maxLife}。`,'event');
    if(forced){const charts=eventPool(pool),index=Math.max(a.index,rules(s,'glitch').min),chosen=selection(s,H.door,index,charts);activate(s,'glitch',index,charts,{...a.round,charts:chosen.map(G.key),results:[],before:s.rating,skillsBefore:{...s.skills},duration:0,name:'乱码门',continuation:true});}
    else if(passed&&d.hidden)s.unlocks.blueUntil=Date.now()+2000;
    return report;
  }
  function endBlue(s,now=Date.now()){if(s.unlocks.blueUntil!==null&&now>=s.unlocks.blueUntil){s.unlocks.blueUntil=null;return true;}return false;}
  function randomPick(s,pool){if(G.playReason(s)||s.roundReview||s.mode!=='solo'||s.unlocks.active||s.major.performance)throw Error('请在单开选曲时使用随机选曲');const byId=new Map();for(const c of pool)if(!G.isUtage(c)&&!lockReason(s,c.id)){const old=byId.get(c.id);if(!old||Math.abs(c.ds-G.baseAbility(s,c))<Math.abs(old.ds-G.baseAbility(s,old)))byId.set(c.id,c);}const source=[...byId.values()],picked=[];while(picked.length<3&&source.length)picked.push(source.splice(Math.floor(rand(s)*source.length),1)[0]);s.unlocks.randomPick=picked.map(G.key);return picked;}
  function valid(s,record){const u=s.unlocks;if(!u||u.version!==1)return false;const ids=a=>Array.isArray(a)&&a.every(v=>typeof v==='string');if(!['legacy','songs','played','keys','cleared','randomPick'].every(k=>ids(u[k]))||!u.keys.every(id=>door(id))||!u.cleared.every(id=>door(id))||!u.discovered||!Object.entries(u.discovered).every(([id,day])=>door(id)&&Number.isInteger(day)&&day>=1&&day<=s.day)||!Array.isArray(u.notices))return false;
    if(['legacy','songs','played'].some(k=>u[k].includes('11879'))||Object.keys(s.records).some(k=>k.startsWith('11879:')))return false;
    if(u.blueUntil!==null&&(!Number.isSafeInteger(u.blueUntil)||u.blueUntil<1||u.active||u.result?.door!=='glitch'||!u.result?.passed||!u.result?.pending))return false;
    const gauge=r=>Number.isInteger(r.life)&&Number.isInteger(r.maxLife)&&[1,10,30,50,100,999].includes(r.maxLife)&&r.life>=0&&r.life<=r.maxLife;
    const result=u.result;if(result!==null&&(!result||!door(result.door)||!gauge(result)||typeof result.passed!=='boolean'||typeof result.pending!=='boolean'||!Array.isArray(result.results)||result.results.length<1||result.results.length>3||!result.results.every(record)||result.passed!==(result.results.length===3&&result.life>0)||!result.passed&&result.life!==0))return false;
    const a=u.active;if(a){const d=door(a.door),fixed=d?.hidden?0:2,random=Array.isArray(a.round?.charts)?a.round.charts.slice(d?.hidden?1:0,d?.hidden?3:2):[];if(!d||!u.keys.includes(a.door)||!u.discovered[a.door]||s.mode!=='solo'||s.phase!=='play'||!Number.isInteger(a.index)||a.index<0||a.index>3||![1,10,30,50,100,999].includes(a.maxLife)||!Number.isInteger(a.life)||a.life<0||a.life>a.maxLife||!a.round?.gate||a.round.course||!ids(a.round.charts)||a.round.charts.length!==3||a.round.charts[fixed]!==`${d.song}:${a.index}`||!random.every(k=>d.pool.includes(k.split(':')[0])&&k.endsWith(':'+a.index))||!Array.isArray(a.round.results)||a.round.results.length>3||!a.round.results.every(record)||!Array.isArray(a.plans)||a.plans.length!==3||!a.plans.every(x=>Array.isArray(x)&&x.every(p=>p&&J.segments[p.tag]))||!Array.isArray(a.decisions)||a.decisions.length!==3||!a.decisions.every((v,i)=>Array.isArray(v)&&v.length<=a.plans[i].length))return false;
      const r=a.round;if(r.mode!=='solo'||r.select!==3||(r.continuation?d.id!=='glitch'||r.duration!==0:r.duration!==G.MODES.solo.duration)||typeof r.name!=='string'||!Number.isFinite(r.before)||r.before<0||r.before>30000||!r.skillsBefore||!['star','key','reading'].every(k=>Number.isFinite(r.skillsBefore[k])&&r.skillsBefore[k]>=1&&r.skillsBefore[k]<=22)||!Number.isInteger(a.day)||a.day<1||a.day>s.day||new Set(r.charts).size!==3)return false;
      if(a.feedback!==null&&(!a.feedback||typeof a.feedback.title!=='string'||typeof a.feedback.text!=='string'||typeof a.feedback.track!=='boolean'||a.feedback.track&&r.results.length===0))return false;
      if(!a.decisions.every((v,i)=>(i>=r.results.length||v.length===a.plans[i].length)&&(i<=r.results.length||v.length===0)&&v.every((d,j)=>d&&d.tag===a.plans[i][j].tag&&['technique','alternate','read','luck'].includes(d.strategy)&&Number.isFinite(d.chance)&&d.chance>=0&&d.chance<=1&&typeof d.passed==='boolean'&&d.intensity===1/a.plans[i].length)))return false;
      let life=a.maxLife;for(const [i,c]of a.round.results.entries()){if(!life||G.key(c)!==a.round.charts[i]||!c.judgements||!['great','good','miss'].every(k=>Number.isInteger(c.judgements[k])&&c.judgements[k]>=0))return false;life=Math.max(0,life-c.judgements.good*D.rules.good-c.judgements.miss*D.rules.miss);}if(life!==a.life||a.round.results.length===3&&!a.feedback?.track||a.life===0&&!a.feedback?.track)return false;}
    return true;
  }
  function install(api,internal){G=api;play=internal;for(const r of D.regions)for(const n of regionSongs(r.region))songNodes.set(n.id,{region:r.region,n});for(const d of D.doors)gateSongs.set(d.song,d);for(const id of D.prismRewards)gateSongs.set(id,door('prism'));let titles;Object.assign(api,{UNLOCK_DATA:D,gateRefresh:refresh,gateRules:rules,gateReason:reason,startGate:start,gateCurrent:current,chooseGate:choose,stepGate:step,endGateBlueScreen:endBlue,randomSongs:randomPick,regionSongNodes:regionSongs,songLockReason:lockReason,songUnlocked:(s,id)=>!lockReason(s,id),songTitle:id=>{if(String(id)==='11879')return H.song.title;titles??=new Map((typeof module!=='undefined'?(()=>{const c={window:{}};require('vm').runInNewContext(require('fs').readFileSync(require.resolve('./data/music.js'),'utf8'),c);return c.window.MUSIC_DATA;})():root.MUSIC_DATA).map(c=>[c.id,c.title]));return titles.get(id)||id;}});
    const blocked=api.majorBlocked;api.majorBlocked=s=>!!s.unlocks?.active||!!s.unlocks?.blueUntil||blocked(s);
    for(const name of ['advance','advanceMeal','packDrink','eatHome','daily','sleep','nextDay','resolveClass','teacher','startTrip','setMode','travel','drink','play','beginCoursePlay','meal','runCourse','waitQueue','refill','buyGloves','chatSend','watchVideos','explore','answerEncounter','answer','contactLove','doQuest','sendDM','startMahjong']){const fn=api[name];if(fn)api[name]=function(s,...args){if(s.unlocks?.active)throw Error('请先完成当前挑战。');return fn(s,...args);};}
  }
  const api={ensure,afterRound,valid,install};if(typeof module!=='undefined')module.exports=api;else root.Kaleidxscope=api;
})(globalThis);
