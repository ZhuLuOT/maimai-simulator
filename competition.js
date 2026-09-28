(function(root){
  'use strict';
  const J=typeof module!=='undefined'?require('./judgement'):root.Judgement;
  const courses=typeof module!=='undefined'?require('./data/courses'):root.COURSES;
  let G;
  const syncOrder=['','sync','fs','fsp','fsd','fsdp'];
  const courseNames=Array.from({length:courses.length},(_,i)=>courses.find(c=>c.id===i+1).name);
  const courseDefinition=level=>courses.find(c=>c.id===level);
  const highestCourse=s=>courses.filter(c=>s.competition.courses.includes(c.id)).at(-1)?.id||0;
  const courseAsset=level=>courseDefinition(level)?.asset||0;
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
  function courseCharts(level,pool){const def=courseDefinition(level);if(!def)throw Error('请选择段位。');const charts=def.charts.map(k=>pool.find(c=>G.key(c)===k));if(charts.some(c=>!c))throw Error('该段位课题资料不完整。');return charts;}
  function courseLife(level,results){
    const def=courseDefinition(level);if(!def)throw Error('请选择段位。');
    let life=def.life;const tracks=[];
    for(const r of results){
      if(life<=0||tracks.length===4)break;
      const before=life,j=r.judgements,loss=j.great*def.great+j.good*def.good+j.miss*def.miss;
      life=Math.max(0,life-loss);const afterLoss=life;
      // A depleted gauge fails immediately; a clear bonus cannot revive it.
      const recovery=life>0?Math.min(def.recovery,def.life-life):0;life+=recovery;
      tracks.push({before,loss,afterLoss,recovery,life,passed:afterLoss>0});
    }
    return {level,edition:'prism-plus',maxLife:def.life,life,passed:tracks.length===4&&life>0,tracks};
  }
  function validCourseReport(r){
    if(!r)return true;
    const def=courseDefinition(r.level),int=(v,max)=>Number.isInteger(v)&&v>=0&&v<=max;
    if(!def||typeof r.passed!=='boolean'||r.pending!==undefined&&typeof r.pending!=='boolean')return false;
    if(r.edition===undefined)return r.level<=10&&int(r.life,300)&&r.passed===(r.life>0);
    if(r.edition!=='prism-plus'||r.maxLife!==def.life||!int(r.life,def.life)||!Array.isArray(r.tracks)||r.tracks.length<1||r.tracks.length>4)return false;
    let life=def.life;
    for(const t of r.tracks){
      if(!t||life===0||t.before!==life||!int(t.loss,1e7))return false;
      const after=Math.max(0,life-t.loss),recovery=after>0?Math.min(def.recovery,def.life-after):0;
      life=after+recovery;
      if(t.afterLoss!==after||t.recovery!==recovery||t.life!==life||t.passed!==(after>0))return false;
    }
    return r.life===life&&r.passed===(r.tracks.length===4&&life>0)&&(life===0||r.tracks.length===4);
  }
  function courseUnlockReason(s,level){
    const def=courseDefinition(level);if(!def)return '请选择段位。';
    const prerequisite=def.prerequisite;if(!prerequisite||s.competition.courses.includes(prerequisite))return '';
    return `需先通过${courseDefinition(prerequisite).name}，才能挑战${def.name}。`;
  }
  function courseReason(s,level=0){
    const locked=level?courseUnlockReason(s,level):'';if(locked)return locked;
    if(s.mode!=='solo')return '段位挑战需要单开。';
    return G.playReason(s)||(s.money<G.pcPrice(s)*2?`段位挑战需要 ¥${G.pcPrice(s)*2}。`:s.clock+20>G.availableUntil(s)?'剩余时间不足以完成 20 分钟挑战。':s.gloves.durability<4*1.75*s.gloves.wear?'手套耐久不足四首，请更换手套。':'');
  }
  function course(s,level,pool,options={}){
    const reason=courseReason(s,level);if(reason)throw Error(reason);const charts=courseCharts(level,pool);if(charts.length!==4)throw Error('该段位曲目尚未齐备。');
    const result=G.play(s,charts,pool,level,options);if(!result)return;
    return completeCourse(s,level,result);
  }
  function completeCourse(s,level,result){
    const report=courseLife(level,result.results),{passed}=report;
    s.last.courseLevel=level;s.competition.lastCourse={...report,day:s.day,pending:true};
    if(passed&&!s.competition.courses.includes(level))s.competition.courses.push(level);
    G.log(s,`${courseNames[level-1]}段位认证：${passed?'合格':'挑战失败'}，剩余 LIFE ${report.life}/${report.maxLife}。`,'event');return result;
  }
  function install(api){G=api;Object.assign(api,{FRIEND_RANKS:[...['B','A','S','SS','SSS'].flatMap(t=>[5,4,3,2,1].map(n=>t+n)),'LEGEND'],syncBadge:sync,syncLabel:v=>({'sync':'SYNC','fs':'FS','fsp':'FS+','fsd':'FSD','fsdp':'FSD+'}[v]||''),COURSES:courses,courseDefinition,courseLife,validCourseReport,highestCourse,courseAsset,COURSE_NAMES:courseNames,courseUnlockReason,courseReason,courseCharts,completeCourse,runCourse:course,friendRank:s=>Math.min(25,Math.floor(s.competition.wins/3))});}
  const api={paired,install};if(typeof module!=='undefined')module.exports=api;else root.Competition=api;
})(globalThis);
