(function(root){
 'use strict';let G,pool=[];
 const J=typeof module!=='undefined'?require('./judgement'):root.Judgement;
 const QUOTES=['庆贺吧，你很强。','你才是挑战者','你不过是生在没有我时代的凡夫'];
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const random=o=>{o.seed=(Math.imul(o.seed,1664525)+1013904223)>>>0;return o.seed/4294967296;};
 function ensure(s){s.major??={};const m=s.major;m.completed??={good:s.ending==='good',love:s.ending==='love'};m.returnPhase??=s.trip?'play':'home';m.duel??={stage:s.ending==='good'?'intro':'locked',result:null,quote:null};m.performance??=null;m.bird??=null;m.birdReward??=false;m.yakuReward??=false;
  const p=m.performance;
  if(p&&p.format===undefined&&Array.isArray(p.plans)&&Array.isArray(p.choices)&&p.plans.length===p.choices.length&&p.plans.every(x=>x===null||x&&typeof x==='object'&&!Array.isArray(x))){
   p.choices=p.choices.map((choice,i)=>p.plans[i]===null&&choice==='skip'?[]:[choice]);
   p.plans=p.plans.map(plan=>plan===null?[]:[plan]);p.format=2;
  }
  if(p&&Array.isArray(p.plans)&&p.plans.every(Array.isArray))battleFields(p);
 }
 const CURSES=[
  {id:'dismantle',success:'你看穿了「解」的轨迹，以术式击散斩击，反击命中了宿傩，他的达成率下降了。',failure:'未能挡住「解」，你感觉你身上多出了几道口子，没法稳住精神，你的达成率降低了。',title:'解',text:'无形的斩击沿着音符切来。宿傩抬起手：“看清了吗？”',weights:{key:.6,reading:.4},alternate:{star:.55,reading:.45},required:14.4,loss:.20,damage:.35,trait:'reading'},
  {id:'reality',success:'你的咒术与舞萌技术在这一刻融为一体，你突破了宿傩的压制，一击黑闪击中了他，他的达成率下降了。',failure:'你的术式远不如宿傩，他全面压制住了你，你的达成率降低了。',title:'机台之外的对决',text:'打到一半，你忽然觉得自己不是在打面前的舞萌，而是在与两面宿傩直接对战。你的每次落键，都能成为反击。',weights:{star:.35,key:.35,reading:.3},alternate:{key:.65,reading:.35},required:14.65,loss:.25,damage:.50,trait:'instinct'},
  {id:'shrine',success:'你在领域对拼中压过了宿傩，「伏魔御厨子」的斩击被你的领域瓦解，宿傩的达成率下降了。',failure:'你在和宿傩的领域对拼中失败了，他展开了领域「伏魔御厨子」。在斩击中，你的达成率降低了。',title:'领域展开 · 伏魔御厨子',text:'机厅被血色的领域吞没，斩击如密集音符落下。你必须展开自己的领域，与【伏魔御厨子】正面对抗。',weights:{star:.4,key:.25,reading:.35},alternate:{key:.5,reading:.5},required:14.9,loss:.35,damage:.60,trait:'expert'},
  {id:'furnace',success:'你的术式击碎宿傩的火焰！宿傩没料到这么一击，在被攻击后，宿傩的达成率下降了。',failure:'「灶」的火焰吞噬了你的全身，你逐渐失去了战意，你的达成率降低了。',title:'灶',text:'灼热的箭矢在宿傩掌中成形。火焰照亮最后一段谱面，你还有一次反击的机会。',weights:{star:.6,reading:.4},alternate:{key:.7,reading:.3},required:14.8,loss:.30,damage:.45,trait:'ghost'}
 ];
 const round4=n=>Number(n.toFixed(4));
 function battleFields(p){
  if(!p)return;p.feedback??=null;
  if(p.feedback?.kind==='curse'&&typeof p.feedback.passed==='boolean'&&CURSES[p.feedback.index])p.feedback.text=CURSES[p.feedback.index][p.feedback.passed?'success':'failure'];
  p.resolutions??=p.plans.map(list=>list.map(()=>null));
  // Existing battles keep completed chart decisions and gain the remaining encounter events.
  if(p.duel&&p.curses===undefined)p.curses=CURSES.map((e,i)=>({id:e.id,choice:null}));
 }
 function nameDuel(s,technique,domain){
  if(s.major.duel.stage!=='intro')throw Error('只能在登场时命名。');
  for(const [key,value]of Object.entries({technique,domain})){if(typeof value!=='string'||value.length>20)throw Error('术式和领域名称最多 20 个字符。');s.major.duel[key]=value.trim();}
 }
 function curseOptions(s,index){
  const e=CURSES[index],d=s.major.duel,names={star:'星星力',key:'键盘力',reading:'读谱力'};
  const trait=G.TALENTS.find(t=>t.id===e.trait),owned=s.talents.includes(e.trait);
  const specs=[{id:'combine',name:e.id==='shrine'?`展开领域【${d.domain||'无界音律'}】`:`以术式【${d.technique||'节奏共鸣'}】迎击`,weights:e.weights,required:e.required,damage:e.damage*.5},
   {id:'alternate',name:'转换底力组合，绕开攻势',weights:e.alternate,required:e.required+.25,damage:e.damage*.35},
   {id:'talent',name:`以「${trait.name}」反击宿傩`,weights:e.weights,required:e.required-.6,damage:e.damage,disabled:!owned,trait:e.trait}];
  return specs.map(o=>{const skill=Object.entries(o.weights).reduce((n,[k,w])=>n+s.skills[k]*w,0),chance=clamp(.62+(skill-o.required)*.18+(s.condition-2)*.025,.06,.97);return {...o,skill,chance,requirement:Object.entries(o.weights).map(([k,w])=>names[k]+' '+Math.round(w*100)+'%').join(' + '),effect:`成功：宿傩本曲达成率 −${round4(o.damage).toFixed(4)}%；失败：你的本曲达成率 −${e.loss.toFixed(2)}%`,lock:owned?'':`需要词条「${trait.name}」`};});
 }
 function nextAction(s){
  const p=s.major.performance;if(!p||p.feedback)return null;
  for(let i=0;i<p.charts.length;i++){
   if(p.duel&&p.curses[i].choice===null)return {kind:'curse',index:i};
   const j=p.choices[i].indexOf(null);if(j>=0)return {kind:'segment',index:i,segmentIndex:j};
  }
  return null;
 }
 function currentCurse(s){const next=nextAction(s);if(next?.kind!=='curse')return null;return {...CURSES[next.index],index:next.index,chart:pool.find(c=>G.key(c)===s.major.performance.charts[next.index]),options:curseOptions(s,next.index)};}
 function chooseCurse(s,id){
  const e=currentCurse(s),o=e?.options.find(x=>x.id===id);if(!o||o.disabled)throw Error('当前无法使用这种应对方式。');
  const passed=random(s)<o.chance,p=s.major.performance,r={id:e.id,choice:id,passed,chance:o.chance,playerLoss:passed?0:e.loss,opponentLoss:passed?round4(o.damage):0};p.curses[e.index]=r;
  const text=passed?e.success:e.failure;
  p.feedback={kind:'curse',index:e.index,passed,title:e.title,text};G.log(s,`${e.title} · ${passed?'事件成功':'事件失败'}：${text}`,'event');
 }
 function acknowledgePerformance(s){const p=s.major.performance;if(!p?.feedback)throw Error('当前没有待确认的事件结果。');p.feedback=null;if(!nextAction(s))return commitPerformance(s);}
 function opponentScore(s,c){
  const fixedChart=['834:4','11663:4'].includes(G.key(c));
  // W62 profile: specialist practice on his two signature charts, stable around SSS+.
  const level=15.15,center=fixedChart?100.5:100.83-Math.max(0,G.effectiveDifficulty(s,c)-14.6)*.32;
  const achievement=round4(clamp(center+(random(s)-.5)*(fixedChart?.24:.18),98.8,100.98));
  return {achievement,combo:achievement>=100.5?'FC+':'FC',rating:16200,level};
 }
 function validBattle(s,p){
  const num=(n,a,b)=>Number.isFinite(n)&&n>=a&&n<=b;
  if(!Array.isArray(p.resolutions)||p.resolutions.length!==p.plans.length||!p.resolutions.every((list,i)=>Array.isArray(list)&&list.length===p.plans[i].length&&list.every((r,j)=>r===null||r&&p.choices[i][j]!==null&&typeof r.passed==='boolean'&&num(r.chance,.06,.97))))return false;
  if(p.duel&&(!Array.isArray(p.curses)||p.curses.length!==4||!p.curses.every((r,i)=>r&&r.id===CURSES[i].id&&(r.choice===null||['combine','alternate','talent'].includes(r.choice)&&(r.choice!=='talent'||s.talents.includes(CURSES[i].trait))&&typeof r.passed==='boolean'&&num(r.chance,.06,.97)&&num(r.playerLoss,0,.35)&&num(r.opponentLoss,0,.6)&&r.playerLoss===(r.passed?0:CURSES[i].loss)&&r.opponentLoss===(r.passed?round4(CURSES[i].damage*(r.choice==='combine'?.5:r.choice==='alternate'?.35:1)):0)))))return false;
  const f=p.feedback;if(f){if(!['curse','segment'].includes(f.kind)||!Number.isInteger(f.index)||f.index<0||f.index>=p.charts.length||typeof f.passed!=='boolean'||typeof f.title!=='string'||f.title.length>100||typeof f.text!=='string'||f.text.length>300)return false;
   const r=f.kind==='curse'?p.curses?.[f.index]:p.resolutions[f.index]?.[f.segmentIndex];if(!r||r.passed!==f.passed)return false;
  }
  return true;
 }
 function reached(s,kind){ensure(s);s.major.completed[kind]=true;s.major.returnPhase=s.phase;if(kind==='good'&&s.major.duel.stage==='locked'){s.major.duel.stage='intro';G.log(s,'16000 的数字刚亮起，机厅中的空间被撕开。两面宿傩从裂隙走出：“有意思，这是你的领域内部吗？就让我来击败你。”','event');}}
  function canContinue(s){return ['good','love'].includes(s.ending)&&(s.day<G.DAYS||s.day===G.DAYS&&s.clock<1440);}
 function continueGame(s){if(!canContinue(s))throw Error('本次游戏已经到达日期终点。');const kind=s.ending;ensure(s);s.major.completed[kind]=true;s.ending=null;s.phase=s.trip?(['play','meal','drink'].includes(s.major.returnPhase)?s.major.returnPhase:'play'):'home';s.event=null;G.log(s,'达成的结局已保留，继续过完这个春天。','event');G.check(s);}
 function fixed(){return ['834:4','11663:4'].map(k=>pool.find(c=>G.key(c)===k));}
 function acceptDuel(s){if(s.ending||!['intro','draw'].includes(s.major.duel.stage))throw Error('当前没有这场挑战。');if(fixed().some(c=>!c))throw Error('宿傩的固定曲目缺失。');s.major.duel.stage='select';s.queueUntil=s.clock;s.roundReview=false;}
 function finishDuel(s,round){
  if(!round||round.results.length!==4)return;
  const d=s.major.duel;
  for(const [i,c]of round.results.entries()){const r=G.sukunaPerformance(s,c),effect=round.curses?.[i];c.duelBase=c.achievement;c.achievement=round4(Math.max(0,c.achievement-(effect?.playerLoss||0)));c.opponent={id:'两面宿傩',index:c.index,achievement:round4(Math.max(0,r.achievement-(effect?.opponentLoss||0))),baseAchievement:r.achievement,combo:r.combo};c.curseEffect=effect||null;c.partner=false;delete c.sync;}
  const ours=Number(round.results.reduce((n,c)=>n+c.achievement,0).toFixed(4)),theirs=Number(round.results.reduce((n,c)=>n+c.opponent.achievement,0).toFixed(4));
  const outcome=ours===theirs?'draw':ours>theirs?'win':'loss';d.stage=outcome;d.result={ours,theirs,outcome,day:s.day,charts:round.results.map(c=>({key:G.key(c),title:c.title,ours:c.achievement,theirs:c.opponent.achievement,opponentBase:c.opponent.baseAchievement,playerLoss:c.curseEffect?.playerLoss||0,opponentLoss:c.curseEffect?.opponentLoss||0}))};
  round.partnerName='两面宿傩';round.mode='pair';round.battle={opponent:'两面宿傩',outcome:outcome==='win'?'wins':outcome==='loss'?'losses':'draws',ours,theirs,day:s.day};
  G.log(s,`两面宿傩 · 四曲总分 ${ours.toFixed(4)}% / ${theirs.toFixed(4)}%：${{win:'获胜',loss:'落败',draw:'平局'}[outcome]}。`,'event');
  if(outcome==='loss'){G.grantTalent(s,'half-maimai');s.phase=s.trip?'play':'home';s.queueUntil=s.clock;s.roundReview=false;G.log(s,'空间斩切碎了舞萌DX和你的领域。睁开眼时，你发现自己坐在机厅的椅子上。','event');}
  if(outcome==='win')G.grantTalent(s,'curse-breaker');
 }
 function closeDuel(s,quote){const d=s.major.duel;if(d.stage==='win'){if(!Number.isInteger(quote)||!QUOTES[quote])throw Error('请选择要说的话。');d.quote=quote;G.log(s,'你对宿傩说：“'+QUOTES[quote]+'” 他收起笑意，消失在裂隙中。','event');}else if(d.stage!=='loss')throw Error('先完成对决。');d.stage='done';G.check(s);}
 function startPerformance(s,selection,course=0,duel=false){
  if(s.major.performance||s.major.bird||s.ending||!duel&&(s.world.notice||s.world.mahjong.active||s.event!==null||s.school.pending||s.city.encounter||s.videoEvent))throw Error('请先完成当前事件。');
  if(duel){if(s.major.duel.stage!=='select'||selection.length!==2)throw Error('请自选两首歌曲。');}
  else{if(s.major.duel.stage!=='locked'&&s.major.duel.stage!=='done')throw Error('先回应宿傩。');const reason=course?G.courseReason(s):G.playReason(s);if(reason)throw Error(reason);}
  const selected=selection.map(c=>pool.find(x=>G.key(c)===G.key(x)));if(selected.some(c=>!c||G.isUtage(c)&&duel))throw Error('请选择有效普通谱面。');
  let charts;if(duel)charts=[...selected,...fixed()];else if(course)charts=G.courseCharts(course,pool);else{const count=G.selectCount(s);if(selected.length!==count)throw Error('请完成本轮选曲。');charts=[...selected,...(s.mode==='pair'?G.preparePartner(s,pool).map(x=>pool.find(c=>c.id===x.id&&c.index===x.playerIndex)):[])];}
  if(charts.some(c=>!c))throw Error('谱面资料不完整。');
  if(!duel&&(s.gloves.durability<charts.length*1.75*s.gloves.wear||G.timeChargeReason(s,course?20:G.MODES[s.mode].duration,course?G.pcPrice(s)*2:G.pcPrice(s))))throw Error('手套耐久或余额不足本轮游玩。');
  const plans=charts.map(c=>J.planSegments(s,{...c,ds:G.effectiveDifficulty(s,c)}));
  s.major.performance={format:2,selection:(course?charts:selected).map(G.key),charts:charts.map(G.key),plans,choices:plans.map(list=>list.map(()=>null)),course,duel,partnerSongs:s.partnerSongs?structuredClone(s.partnerSongs):null};
  battleFields(s.major.performance);
  if(duel)s.major.duel.stage='battle';
  if(!nextAction(s))return commitPerformance(s);
 }
 function currentSegment(s){
  const p=s.major.performance,next=nextAction(s);if(next?.kind!=='segment')return null;
  const {index,segmentIndex}=next,c=pool.find(c=>G.key(c)===p.charts[index]),plan=p.plans[index][segmentIndex];
  return {index,total:p.charts.length,segmentIndex,segmentCount:p.plans[index].length,chart:c,tag:plan.tag,scene:J.segments[plan.tag].scene,options:J.segmentOptions(s,{...c,ds:G.effectiveDifficulty(s,c)},plan.tag)};
 }
 function chooseSegment(s,id){
  const e=currentSegment(s),o=e?.options.find(x=>x.id===id);if(!o)throw Error('无效的应对策略。');
  const p=s.major.performance,passed=random(s)<o.chance;p.choices[e.index][e.segmentIndex]=id;p.resolutions[e.index][e.segmentIndex]={passed,chance:o.chance};
  p.feedback={kind:'segment',index:e.index,segmentIndex:e.segmentIndex,passed,title:e.scene,text:passed?'稳稳接住了这段配置，本段不扣分。':'这段没有接住，本曲结算将增加 MISS 并扣分。多个难点分摊单曲失误量。'};
 }
  function duelRound(s,p,options){
    // The rift freezes the arcade clock. This one-off duel does not consume a normal PC or change records.
    const results=p.charts.map((k,i)=>{const c=pool.find(c=>G.key(c)===k);return {...c,...G.simulate(s,c,options.segments[i]),ra:0,day:s.day,partner:false};});
    const round={results,gain:0,skillsBefore:{...s.skills},mode:'pair',battle:null,queue:0,duration:0,partnerName:'两面宿傩',curses:p.curses};
    s.last=round;s.roundReview=true;return round;
  }
  function commitPerformance(s){const p=s.major.performance;if(!p||p.feedback||nextAction(s))throw Error('先选择应对方式。');s.major.performance=null;const options={duel:p.duel,segments:p.plans.map((plans,i)=>plans.map((plan,j)=>{const c=pool.find(c=>G.key(c)===p.charts[i]),option=J.segmentOptions(s,{...c,ds:G.effectiveDifficulty(s,c)},plan.tag).find(o=>o.id===p.choices[i][j]);return {tag:plan.tag,strategy:p.choices[i][j],chance:p.resolutions[i][j]?.chance??option.chance,passed:p.resolutions[i][j]?.passed,intensity:1/plans.length};}))};s.partnerSongs=p.partnerSongs;
  try{const round=p.duel?duelRound(s,p,options):p.course?G.runCourse(s,p.course,pool,options):G.play(s,p.selection.map(k=>pool.find(c=>G.key(c)===k)),pool,0,options);if(p.duel)finishDuel(s,round);return round;}
  catch(e){if(p.duel)s.major.duel.stage='select';throw e;}
 }
 function collectionRewards(s){if(!s.major||!s.world||s.ending)return;const m=s.major;if(!m.birdReward&&G.WORLD_ENTRIES.filter(e=>e.kind==='bird').every(e=>s.world.entries.includes(e.id))){m.birdReward=true;const gain=Math.min(.5,22-s.skills.reading);s.skills.reading+=gain;G.log(s,`广州鸟类图鉴全收集：读谱力 +${gain.toFixed(2)}。`,'event');}if(!m.yakuReward&&G.MAHJONG_YAKU.every(e=>s.world.mahjong.collection[e.id])){m.yakuReward=true;s.money+=8888;G.log(s,'立直麻将役种全收集：获得 ¥8888。','money');}}
 function birdReason(s,place,quest=false){
  if(s.phase!=='home'||s.ending||s.major.performance||s.major.bird||s.world.mahjong.active||s.world.notice||s.event!==null||s.school.pending||s.city.encounter||s.videoEvent)return '先完成当前行动并回家';
  if(!['locked','done'].includes(s.major.duel.stage))return '先回应宿傩';
  if(quest)return G.questReason(s,'elubos');
  if(!s.world.quests['elubos'].stage)return '先和elubos完成第一次观鸟';
  if(!['yuexiu','shamian','canton','yongqing'].includes(place)||!s.world.locations.includes(place))return '先发现观鸟地点';
  if(s.clock<360||s.clock+45>1080)return '白天 06:00–18:00，预留 45 分钟';
  if(!G.canSpendTime(s,45)||s.stamina<8||s.money<5)return '需要 45 分钟、8 体力和 ¥5';return '';
 }
 function startBird(s,place,quest=false){const reason=birdReason(s,place,quest);if(reason)throw Error(reason);const stage=s.world.quests['elubos'].stage,step=quest?G.QUESTS['elubos'].steps[stage]:{time:45,stamina:8,cost:5};
  if(!G.canSpendTime(s,step.time)||s.stamina<step.stamina||s.money<step.cost)throw Error('时间、体力或余额不足。');
  let entries=quest?[G.WORLD_ENTRIES.find(e=>e.id===step.entry)]:G.WORLD_ENTRIES.filter(e=>e.kind==='bird'&&!e.hidden&&e.place===place&&!['bulbul','robin','egret','kingfisher'].includes(e.id));
  const unseen=entries.filter(e=>!s.world.entries.includes(e.id));if(unseen.length)entries=unseen;if(!entries.length)throw Error('这里暂时没有可观察的鸟。');
  const before=s.forcedSleeps;G.advance(s,step.time);if(s.ending||s.forcedSleeps!==before)return;s.money-=step.cost;s.stamina-=step.stamina;s.nutrition.away=true;
  const bird=entries[Math.floor(random(s.world)*entries.length)];s.major.bird={entry:bird.id,quest,stage,seed:(s.seed^s.world.seed)>>>0,position:50,velocity:0,target:50,targetGoal:50,progress:25,ticks:0,width:quest&&stage===0?42:bird.hidden?24:32};
  G.log(s,`主动出发观鸟 · ${G.OUTINGS.find(x=>x.id===bird.place).name}：${step.time} 分钟，体力 -${step.stamina}，¥${step.cost}。`,'event');
 }
 function birdStep(s,held){const b=s.major.bird;if(!b||s.ending)return;if(b.ticks%18===0)b.targetGoal=10+random(b)*80;b.ticks++;b.target+=clamp(b.targetGoal-b.target,-1.6,1.6);b.velocity=clamp(b.velocity+(held?-.32:.23),-2.8,2.8);b.position=clamp(b.position+b.velocity,0,100);if(b.position===0||b.position===100)b.velocity=0;
  b.progress=clamp(b.progress+(Math.abs(b.position-b.target)<=b.width/2?.85:-.55),0,100);
  if(b.progress>=100)return endBird(s,true);if(b.progress<=0||b.ticks>=600)return endBird(s,false);
 }
 function endBird(s,success=false){const b=s.major.bird;if(!b)throw Error('当前没有观鸟。');s.major.bird=null;const entry=G.WORLD_ENTRIES.find(e=>e.id===b.entry);
  if(success){if(b.quest){if(s.world.quests['elubos'].stage!==b.stage)throw Error('支线进度已变化。');G.completeBirdQuest(s);}else{if(!s.world.entries.includes(entry.id))s.world.entries.push(entry.id);s.world.notice={title:'观鸟记录 · '+entry.name,text:'持续对准后，你记住了它的外形与行为。'+entry.note,entry:entry.id};}collectionRewards(s);G.log(s,'观察成功：'+entry.name+'。','event');}
  else{s.world.notice={title:'鸟儿飞远了',text:'这次没能看清。放下望远镜休息一下，下次可以主动出发再试。',entry:null};G.log(s,'观鸟结束：没有完成记录。','event');}G.check(s);
 }
 function blocked(s){return !!(s.major?.performance||s.major?.bird||s.major&&!['locked','done'].includes(s.major.duel.stage)&&!s.ending);}
 function valid(s){const m=s.major,num=(x,a,b)=>Number.isFinite(x)&&x>=a&&x<=b;if(!m||!m.completed||!['good','love'].every(k=>typeof m.completed[k]==='boolean')||!['home','travel','drink','play','meal','ending'].includes(m.returnPhase)||typeof m.birdReward!=='boolean'||typeof m.yakuReward!=='boolean')return false;
  const d=m.duel;if(!d||!['locked','intro','select','battle','win','loss','draw','done'].includes(d.stage)||d.quote!==null&&(!Number.isInteger(d.quote)||!QUOTES[d.quote]))return false;
  if(d.music!==undefined&&!['yuai','aizo'].includes(d.music)||d.musicPaused!==undefined&&typeof d.musicPaused!=='boolean')return false;
  if(['technique','domain'].some(k=>d[k]!==undefined&&(typeof d[k]!=='string'||d[k].length>20)))return false;
  if(['win','loss','draw','done'].includes(d.stage)&&!d.result)return false;
  if(d.result&&(!num(d.result.ours,0,404)||!num(d.result.theirs,0,404)||!['win','loss','draw'].includes(d.result.outcome)||!Array.isArray(d.result.charts)||d.result.charts.length!==4||!d.result.charts.every(c=>c&&typeof c.key==='string'&&typeof c.title==='string'&&num(c.ours,0,101)&&num(c.theirs,0,101))))return false;
  const p=m.performance;if(p){if(p.format!==2||!Array.isArray(p.charts)||!num(p.charts.length,3,4)||!p.charts.every(k=>typeof k==='string'&&(!pool.length||pool.some(c=>G.key(c)===k)))||!Array.isArray(p.selection)||!p.selection.every(k=>p.charts.includes(k))||!Array.isArray(p.plans)||p.plans.length!==p.charts.length||!p.plans.every(list=>Array.isArray(list)&&list.length<=3&&list.every(x=>x&&typeof x==='object'&&J.segments[x.tag]))||!Array.isArray(p.choices)||p.choices.length!==p.charts.length||!p.choices.every((list,i)=>Array.isArray(list)&&list.length===p.plans[i].length&&list.every(x=>x===null||['technique','alternate','read','luck'].includes(x)))||!Number.isInteger(p.course)||!num(p.course,0,10)||typeof p.duel!=='boolean'||p.duel&&d.stage!=='battle')return false;}
  if(p&&!validBattle(s,p))return false;
  const b=m.bird;if(b&&(!G.WORLD_ENTRIES.some(e=>e.id===b.entry&&e.kind==='bird')||typeof b.quest!=='boolean'||!Number.isInteger(b.stage)||!num(b.stage,0,5)||!Number.isInteger(b.seed)||!num(b.seed,0,4294967295)||!num(b.position,0,100)||!num(b.velocity,-2.8,2.8)||!num(b.target,0,100)||!num(b.targetGoal,0,100)||!num(b.progress,0,100)||!Number.isInteger(b.ticks)||!num(b.ticks,0,600)||![24,32,42].includes(b.width)||b.entry==='owl'&&(!b.quest||b.stage!==4)))return false;
  if(p&&!p.feedback&&!p.choices.some(list=>list.includes(null))&&!(p.duel&&p.curses.some(e=>e.choice===null))||d.stage==='battle'&&!p||p?.duel&&p.charts.slice(2).join(',')!=='834:4,11663:4'||p?.duel&&p.selection.length!==2||p&&!p.duel&&(s.phase!=='play'||p.charts.length!==(p.course?4:G.MODES[s.mode]?.count))||p&&p.plans.some((list,i)=>list.some(x=>pool.length&&!(pool.find(c=>G.key(c)===p.charts[i]).tags||[]).includes(x.tag))))return false;
  if(p&&(!p.selection.length||p.selection.some((k,i)=>k!==p.charts[i])||p.duel&&p.course!==0||p.course&&p.selection.length!==4||p.partnerSongs!==null&&(!Array.isArray(p.partnerSongs)||p.partnerSongs.length>2||!p.partnerSongs.every(c=>c&&typeof c.id==='string'&&Number.isInteger(c.index)&&num(c.index,0,4)&&Number.isInteger(c.playerIndex)&&num(c.playerIndex,0,4)))))return false;
  if(b&&(s.phase!=='home'||b.quest&&(b.stage!==s.world?.quests?.['elubos']?.stage||G.QUESTS['elubos'].steps[b.stage]?.entry!==b.entry)||!b.quest&&(G.WORLD_ENTRIES.find(e=>e.id===b.entry).hidden||!s.world?.quests?.['elubos']?.stage)))return false;
  return !(p&&b);
 }
 function install(api){G=api;Object.assign(api,{ensureMajor:ensure,markMilestone:reached,canContinue,continueGame,setMajorPool:p=>{pool=p;},SUKUNA_QUOTES:QUOTES,sukunaCharts:fixed,sukunaPerformance:opponentScore,nameDuel,currentCurse,chooseCurse,acknowledgePerformance,acceptDuel,closeDuel,startPerformance,currentSegment,chooseSegment,collectionRewards,birdReason,startBird,birdStep,endBird,majorBlocked:blocked});
  for(const name of ['advance','advanceMeal','packDrink','eatHome','daily','sleep','nextDay','resolveClass','teacher','startTrip','setMode','travel','drink','play','meal','runCourse','waitQueue','refill','buyGloves','chatSend','watchVideos','explore','answerEncounter','answer','contactLove','doQuest','sendDM','startMahjong']){const fn=api[name];if(fn)api[name]=function(s,...args){if(blocked(s))throw Error('请先完成当前挑战或观鸟。');return fn(s,...args);};}
 }
 const api={ensure,valid,install};if(typeof module!=='undefined')module.exports=api;else root.MajorLife=api;
})(globalThis);
