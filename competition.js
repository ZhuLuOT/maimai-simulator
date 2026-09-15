(function(root){
  'use strict';
  const J=typeof module!=='undefined'?require('./judgement'):root.Judgement;
  let G;
  const syncOrder=['','sync','fs','fsp','fsd','fsdp'];
  const courseNames=['真初段','真二段','真三段','真四段','真五段','真六段','真七段','真八段','真九段','真十段'];
  const courseLevels=[8,9,10,10.8,11.5,12,12.5,13,13.7,14.4];
  function comboTier(result){
    const j=result.judgements;
    if(j)return j.miss>0?0:j.good>0?1:j.great>0?2:3;
    return ({FC:1,'FC+':2,AP:3,'AP+':3})[result.combo]||0;
  }
  // Difficulty means chart color, not displayed level, constant, Rating or achievement.
  // https://gamerch.com/maimai/533359 ; https://zh.moegirl.org.cn/Maimai
  function sync(a,b){
    if(!a||!b||(a.id&&b.id&&a.id!==b.id)||(a.type&&b.type&&a.type!==b.type))return '';
    const tier=Math.min(comboTier(a),comboTier(b));
    if(!tier)return 'sync';
    if(!Number.isInteger(a.index)||!Number.isInteger(b.index))return 'sync';
    if(a.index>b.index)return 'fs';
    return ['sync','fsp','fsd','fsdp'][tier];
  }
  function paired(s,results,n,partnerSongs,pool){
    if(!n)return;
    let partnerSlot=0;
    for(const result of results){
      // Partner choices belong to track slots; the same song can appear more than once.
      const picked=result.partner?partnerSongs[partnerSlot++]:null,charts=pool.filter(c=>c.id===result.id);
      const other=s.competition.battle?charts.find(c=>c.index===result.index):picked?charts.find(c=>c.index===picked.index):charts.slice().sort((a,b)=>Math.abs(a.ds-n.rating/1110)-Math.abs(b.ds-n.rating/1110))[0];
      if(!other)continue;
      const level=n.rating/1110,sim={seed:s.seed,skills:{star:level+(n.tendency==='star'?.2:0),key:level+(n.tendency==='key'?.2:0)},practice:{[G.key(other)]:3},condition:2};
      const r=J.simulate(sim,other,Math.min(101,100.45-J.difficultyPenalty(other.ds,level)),level);s.seed=sim.seed;
      result.opponent={id:n.id,index:other.index,achievement:r.achievement,combo:r.combo};
      result.sync=sync(result,{...other,...r});
      const record=s.records[G.key(result)];if(record){record.bestSync=syncOrder[Math.max(syncOrder.indexOf(record.bestSync||''),syncOrder.indexOf(result.sync))];result.bestSync=record.bestSync;}
    }
    if(s.competition.battle){const ours=results.reduce((sum,r)=>sum+r.achievement,0),theirs=results.reduce((sum,r)=>sum+(r.opponent?.achievement||0),0),outcome=Math.abs(ours-theirs)<.0001?'draws':ours>theirs?'wins':'losses';s.competition[outcome]++;s.competition.last={opponent:n.id,outcome,ours:Number(ours.toFixed(4)),theirs:Number(theirs.toFixed(4)),day:s.day};G.log(s,`友人对战 · ${n.id}：${outcome==='wins'?'获胜':outcome==='losses'?'落败':'平局'}，四曲达成率合计 ${ours.toFixed(4)} / ${theirs.toFixed(4)}。`,'event');}
  }
  function courseCharts(level,pool){if(!Number.isInteger(level)||level<1||level>10)throw Error('请选择段位。');const ds=courseLevels[level-1];return pool.filter(c=>!G.isUtage(c)&&c.ds>=ds&&c.ds<=ds+.3).sort((a,b)=>Number(a.id)-Number(b.id)||a.index-b.index).filter((c,i,a)=>a.findIndex(x=>x.id===c.id)===i).slice(0,4);}
  function courseReason(s){
    if(s.mode!=='solo')return '段位挑战需要单开。';
    return G.playReason(s)||(s.money<G.pcPrice(s)*2?`段位挑战需要 ¥${G.pcPrice(s)*2}。`:s.clock+20>G.availableUntil(s)?'剩余时间不足以完成 20 分钟挑战。':s.gloves.durability<4*1.75*s.gloves.wear?'手套耐久不足四首，请更换手套。':'');
  }
  function course(s,level,pool){
    const reason=courseReason(s);if(reason)throw Error(reason);const charts=courseCharts(level,pool);if(charts.length!==4)throw Error('该段位曲目尚未齐备。');
    const result=G.play(s,charts,pool,level);if(!result)return;
    const loss=result.results.reduce((n,r)=>n+r.judgements.great+r.judgements.good*2+r.judgements.miss*3,0),passed=loss<300;
    s.last.courseLevel=level;s.competition.lastCourse={level,life:Math.max(0,300-loss),passed,day:s.day};
    if(passed&&!s.competition.courses.includes(level))s.competition.courses.push(level);
    G.log(s,`${courseNames[level-1]}模拟段位：${passed?'合格':'挑战失败'}，剩余 LIFE ${Math.max(0,300-loss)}/300。`,'event');
  }
  function install(api){G=api;Object.assign(api,{FRIEND_RANKS:[...['B','A','S','SS','SSS'].flatMap(t=>[5,4,3,2,1].map(n=>t+n)),'LEGEND'],syncBadge:sync,syncLabel:v=>({'sync':'SYNC','fs':'FS','fsp':'FS+','fsd':'FSD','fsdp':'FSD+'}[v]||''),COURSE_NAMES:courseNames,courseReason,courseCharts,runCourse:course,friendRank:s=>Math.min(25,Math.floor(s.competition.wins/3))});}
  const api={paired,install};if(typeof module!=='undefined')module.exports=api;else root.Competition=api;
})(globalThis);
