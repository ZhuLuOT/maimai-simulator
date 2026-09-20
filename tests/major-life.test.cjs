const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const G=require('../engine'),J=require('../judgement'),{observe}=require('./bird-control.cjs');
const ctx={window:{}};vm.runInNewContext(fs.readFileSync(require.resolve('../data/music.js'),'utf8'),ctx);const pool=G.charts(ctx.window.MUSIC_DATA);
function player(seed=42){const s=G.create('grinder',seed);s.money=10000;s.setupDone=true;s.guide.introDone=true;s.nutrition.dismissed=[0];return s;}
function finish(s){for(let i=0;s.major.performance&&i<40;i++){if(s.major.performance.feedback)G.acknowledgePerformance(s);else if(G.currentCurse(s))G.chooseCurse(s,'combine');else G.chooseSegment(s,'technique');}assert.equal(s.major.performance,null);}
function enter(s){s.clock=900;G.startTrip(s);G.travel(s,'bike',0);G.drink(s,'water');if(s.queueUntil>s.clock)G.waitQueue(s);return s;}
function reached(s){s.rating=16000;G.check(s);assert.equal(s.ending,'good');assert.equal(s.major.duel.stage,'intro');G.continueGame(s);G.acceptDuel(s);}
test('W6 and love milestones continue once, legacy endings migrate, calendar end stays terminal',()=>{
 const s=enter(player());reached(s);assert.equal(s.phase,'play');assert.equal(s.ending,null);G.check(s);assert.equal(s.ending,null);assert.equal(s.major.completed.good,true);
 const love=player();G.markMilestone(love,'love');love.ending='love';love.phase='ending';G.continueGame(love);assert.equal(love.phase,'home');assert.equal(love.major.completed.love,true);assert.equal(love.major.duel.stage,'locked');
 const old=player();delete old.major;old.ending='good';old.phase='ending';G.migrate(old);assert.ok(G.validate(old));G.continueGame(old);assert.equal(old.major.duel.stage,'intro');
 const end=player();end.day=122;end.clock=1439;end.major.completed={good:true,love:true};G.advance(end,1);assert.equal(end.ending,'ordinary');assert.equal(G.canContinue(end),false);assert.throws(()=>G.continueGame(end));
});
test('Sukuna uses the correct two Re:MASTER charts and scores exactly four songs',()=>{
 const s=enter(player());s.skills={star:22,key:22,reading:22};s.precision.base=95;s.condition=4;for(const c of pool)s.practice[G.key(c)]=100;reached(s);assert.deepEqual(G.sukunaCharts().map(G.key),['834:4','11663:4']);
 const before={money:s.money,clock:s.clock,stamina:s.stamina,gloves:s.gloves.durability,records:JSON.stringify(s.records),skills:{...s.skills}};
 const choices=pool.filter(c=>c.ds===13&&!G.isUtage(c)).slice(0,2);G.startPerformance(s,choices,0,true);finish(s);
 const d=s.major.duel;assert.equal(d.stage,'win');assert.equal(d.result.charts.length,4);assert.deepEqual(d.result.charts.slice(2).map(c=>c.key),['834:4','11663:4']);assert.equal(d.result.ours,Number(d.result.charts.reduce((n,c)=>n+c.ours,0).toFixed(4)));
 assert.equal(s.money,before.money);assert.equal(s.clock,before.clock);assert.equal(s.stamina,before.stamina);assert.equal(s.gloves.durability,before.gloves);assert.equal(JSON.stringify(s.records),before.records);assert.deepEqual(s.skills,before.skills);
 assert.ok(s.talents.includes('curse-breaker'));assert.throws(()=>G.closeDuel(s,4));G.closeDuel(s,2);assert.equal(s.major.duel.quote,2);assert.equal(s.major.duel.stage,'done');assert.ok(G.validate(G.migrate(structuredClone(s))));
});
test('Sukuna loss ejects player, awards a cosmetic title and does not softlock continued play',()=>{
 const s=enter(player());reached(s);G.startPerformance(s,pool.filter(c=>c.ds===12).slice(0,2),0,true);finish(s);
 assert.equal(s.major.duel.stage,'loss');assert.equal(s.phase,'play');assert.ok(s.trip);assert.ok(s.talents.includes('half-maimai'));assert.deepEqual(G.talentGains(s,'half-maimai'),{});G.closeDuel(s);assert.equal(G.majorBlocked(s),false);assert.ok(G.validate(s));assert.throws(()=>G.acceptDuel(s));G.markMilestone(s,'good');assert.equal(s.major.duel.stage,'done');assert.equal(G.replayDuel,undefined);G.waitQueue(s);assert.equal(s.ending,null);
});
test('exact ties permit a rematch without granting either hidden title',()=>{
 const s=player();reached(s);const original=G.sukunaPerformance,simulate=G.simulate;
 G.sukunaPerformance=(state,c)=>{const i=state.last.results.indexOf(c),e=state.last.curses[i];return {achievement:100-e.playerLoss+e.opponentLoss,combo:'FC'};};G.simulate=()=>({achievement:100,combo:'FC',judgements:{critical:1,perfect:0,great:0,good:0,miss:0}});
 try{G.startPerformance(s,pool.filter(c=>c.ds===12).slice(0,2),0,true);finish(s);assert.equal(s.major.duel.stage,'draw');assert.ok(!s.talents.includes('half-maimai'));assert.ok(!s.talents.includes('curse-breaker'));G.acceptDuel(s);assert.equal(s.major.duel.stage,'select');}finally{G.sukunaPerformance=original;G.simulate=simulate;}
});
test('different patterns and skills produce distinct strategy chances; saved decisions settle a PC only once',()=>{
 const s=enter(player(7)),tagged=pool.find(c=>c.ds<14&&c.tags.includes('拆弹'));assert.ok(tagged);s.skills={star:14,key:8,reading:14};
 const options=J.segmentOptions(s,tagged,'拆弹');assert.ok(options.find(x=>x.id==='technique').chance>options.find(x=>x.id==='alternate').chance+.2);assert.equal(options.find(x=>x.id==='luck').chance,.38);
 assert.notDeepEqual(J.segmentOptions(s,tagged,'跳拍'),options);
 // Find a seeded event without altering its saved plan or its outcome.
 let pending;for(let seed=1;seed<100;seed++){const trial=structuredClone(s);trial.seed=seed*12345;G.startPerformance(trial,[tagged,tagged,tagged]);if(trial.major.performance){pending=trial;break;}}
 assert.ok(pending);assert.ok(G.validate(pending));const saved=G.migrate(structuredClone(pending));assert.deepEqual(G.currentSegment(saved),G.currentSegment(pending));assert.throws(()=>G.daily(saved,'wait'));assert.throws(()=>G.startPerformance(saved,[tagged]));
 const credits=saved.credits;finish(saved);assert.equal(saved.credits,credits+1);assert.equal(saved.last.results.length,3);assert.ok(saved.last.results.some(r=>r.segmentEvent?.strategy));assert.throws(()=>G.chooseSegment(saved,'luck'));assert.equal(saved.credits,credits+1);assert.ok(G.validate(saved));
});
test('multiple segments in one song advance separately, survive reload and charge one PC',()=>{
 const base=enter(player()),c=pool.find(c=>c.ds>=13.6&&c.tags.filter(t=>J.segments[t]).length>=2);let s;
 for(let seed=1;seed<200;seed++){const trial=structuredClone(base);trial.seed=seed*12345;G.startPerformance(trial,[c,c,c]);if(G.currentSegment(trial)?.segmentCount>=2){s=trial;break;}}
 assert.ok(s);const first=G.currentSegment(s),credits=s.credits,money=s.money,plan=structuredClone(s.major.performance.plans);
 G.chooseSegment(s,'read');assert.ok(s.major.performance.feedback);G.acknowledgePerformance(s);assert.equal(s.credits,credits);assert.equal(s.money,money);
 const next=G.currentSegment(s);assert.equal(next.index,first.index);assert.equal(next.segmentIndex,1);assert.equal(s.major.performance.choices[first.index][0],'read');
 s=G.migrate(JSON.parse(JSON.stringify(s)));assert.ok(G.validate(s));assert.deepEqual(G.currentSegment(s),next);assert.deepEqual(s.major.performance.plans,plan);
 for(const mutate of [x=>x.major.performance.plans[0].push(...Array(4).fill({tag:c.tags[0]})),x=>x.major.performance.choices[0]=[],x=>x.major.performance.plans[0][0]={tag:'unknown'}]){const bad=structuredClone(s);mutate(bad);assert.equal(G.validate(bad),false);}
 finish(s);assert.equal(s.credits,credits+1);assert.equal(s.last.results[first.index].segmentEvents.length,first.segmentCount);assert.equal(s.last.results[first.index].segmentEvents[0].strategy,'看清节奏再动手');assert.ok(G.validate(G.migrate(structuredClone(s))));
 assert.throws(()=>G.chooseSegment(s,'luck'));assert.equal(s.credits,credits+1);
});
test('legacy pending single-segment saves keep answered choices during migration',()=>{
 const s=enter(player()),c=pool.find(c=>c.tags.includes('拆弹'));s.major.performance={selection:[c,c,c].map(G.key),charts:[c,c,c].map(G.key),plans:[{tag:'拆弹'},{tag:'拆弹'},null],choices:['read',null,'skip'],course:0,duel:false,partnerSongs:null};
 const migrated=G.migrate(structuredClone(s));assert.ok(G.validate(migrated));assert.deepEqual(migrated.major.performance.choices,[['read'],[null],[]]);assert.equal(G.currentSegment(migrated).index,1);
 const credits=migrated.credits;G.chooseSegment(migrated,'technique');G.acknowledgePerformance(migrated);assert.equal(migrated.credits,credits+1);assert.ok(G.validate(migrated));
});
test('multiple failures retain every outcome and conserve note totals, score loss and combo',()=>{
 const c={...pool.find(c=>c.ds===14),tags:['拆弹','跳拍','扫键']};let failed=false;
 for(let seed=1;seed<80&&!failed;seed++){
  const s=player(seed),original=J.simulate(s,c,100.5,15),plans=c.tags.map(tag=>({tag,strategy:'luck',chance:.08,intensity:1/3})),r=J.segment(s,c,original,plans);
  assert.equal(r.segmentEvents.length,3);assert.equal(r.achievement,J.calculate(r.judgementGroups,r.breakJudgements).achievement);
  r.judgementGroups.forEach((group,i)=>assert.equal(Object.values(group).reduce((a,b)=>a+b,0),c.notes[i]));
  assert.equal(r.judgements.miss-original.judgements.miss,r.segmentEvents.reduce((n,e)=>n+e.misses,0));
  assert.ok(Math.abs(original.achievement-r.achievement-r.segmentEvents.reduce((n,e)=>n+e.loss,0))<.00001);assert.ok(r.maxCombo<=original.maxCombo);
  failed=r.segmentEvents.every(e=>!e.passed);
 }
 assert.ok(failed);
 const s=player(),high={...c,ds:15},counts=new Set();for(let i=0;i<1000;i++){const plans=J.planSegments(s,high);assert.ok(plans.length<=3);assert.equal(new Set(plans.map(p=>p.tag)).size,plans.length);counts.add(plans.length);}
 assert.deepEqual([...counts].sort(),[0,1,2,3]);
});
test('active observation survives reload, uses time once, can fail, and needs skillful tracking',()=>{
 const s=player();s.world.quests['电压'].stage=1;s.world.locations=['yuexiu'];const money=s.money,clock=s.clock;G.startBird(s,'yuexiu');assert.equal(s.money,money-5);assert.equal(s.clock,clock+45);assert.equal(s.world.entries.length,0);
 for(let i=0;i<10;i++)G.birdStep(s,true);const restored=G.migrate(structuredClone(s));assert.ok(G.validate(restored));assert.deepEqual(restored.major.bird,s.major.bird);assert.throws(()=>G.sleep(restored));assert.throws(()=>G.startBird(restored,'yuexiu'));observe(restored);assert.equal(restored.money,money-5);assert.equal(restored.clock,clock+45);
 s.world.notice=null;G.endBird(s);assert.equal(s.world.entries.length,0);assert.equal(s.major.bird,null);assert.match(s.world.notice.title,/飞远/);
 const failure=player();failure.world.quests['电压'].stage=1;failure.world.locations=['yuexiu'];G.startBird(failure,'yuexiu');for(let i=0;i<600&&failure.major.bird;i++)G.birdStep(failure,false);assert.equal(failure.major.bird,null);assert.equal(failure.world.entries.length,0);
});
test('paired and course sessions preserve four charts, partner selections and course settlement',()=>{
 const tagged=pool.find(c=>c.ds<14&&c.tags.includes('拆弹'));
 for(const course of [0,10]){
  const base=enter(player());if(!course){G.setMode(base,'pair');if(base.queueUntil>base.clock)G.waitQueue(base);}
  let s;for(let seed=1;seed<100;seed++){const trial=structuredClone(base);trial.seed=seed*12345;G.startPerformance(trial,course?[]:Array(G.selectCount(trial)).fill(tagged),course);if(trial.major.performance){s=G.migrate(structuredClone(trial));break;}}
  assert.ok(s);assert.ok(G.validate(s));const pending=structuredClone(s.major.performance),credits=s.credits;
  const chances=pending.plans.map((plans,i)=>plans.map(p=>J.segmentOptions(s,{...pool.find(c=>G.key(c)===pending.charts[i]),ds:G.effectiveDifficulty(s,pool.find(c=>G.key(c)===pending.charts[i]))},p.tag)[0].chance));
  finish(s);assert.equal(s.credits,credits+1);assert.equal(s.last.results.length,4);assert.deepEqual(s.last.results.map(G.key),pending.charts);
  s.last.results.forEach((r,i)=>{assert.deepEqual((r.segmentEvents||[]).map(e=>e.chance),chances[i]);});
  if(course){assert.equal(s.competition.lastCourse.level,10);assert.equal(s.last.courseLevel,10);}else{assert.ok(s.last.partnerName);assert.ok(s.last.results.every(r=>r.opponent));}
  assert.ok(G.validate(s));
 }
});
test('full collections grant one-time rewards, including imported complete collections',()=>{
 const s=player();s.world.entries=G.WORLD_ENTRIES.filter(e=>e.kind==='bird').map(e=>e.id);s.world.mahjong.rounds=s.world.mahjong.wins=1;for(const e of G.MAHJONG_YAKU)s.world.mahjong.collection[e.id]={count:1,firstDay:1};
 const before={cash:s.money,reading:s.skills.reading};delete s.major;G.migrate(s);G.collectionRewards(s);assert.equal(s.money,before.cash+8888);assert.equal(s.skills.reading,before.reading+.5);const restored=G.migrate(structuredClone(s));G.collectionRewards(restored);assert.equal(restored.money,s.money);assert.equal(restored.skills.reading,s.skills.reading);assert.ok(G.validate(restored));
});
test('malformed new saved activities are rejected',()=>{
 for(const mutate of [s=>s.major.duel.stage='battle',s=>s.major.completed.good=1,s=>s.major.duel.quote=99,s=>s.major.bird={entry:'owl',quest:false},s=>s.major.performance={charts:[]}]){const s=player();mutate(s);assert.equal(G.validate(s),false);}
});
test('Sukuna signature charts stay around SSS+ before event damage, independently of player skills',()=>{
 const s=player(),values=[];for(let i=0;i<500;i++)for(const c of G.sukunaCharts()){const r=G.sukunaPerformance(s,c);assert.equal(r.rating,16200);assert.ok(r.achievement>=100.38&&r.achievement<=100.62);values.push(r.achievement);}
 assert.ok(Math.abs(values.reduce((a,b)=>a+b,0)/values.length-100.5)<.02);
 const c=G.sukunaCharts()[0],a=player(),b=player();a.skills={star:1,key:1,reading:1};b.skills={star:22,key:22,reading:22};assert.deepEqual(G.sukunaPerformance(a,c),G.sukunaPerformance(b,c));
});
test('curse events are ordered, talent-gated, persistent and apply announced damage exactly once',()=>{
 const s=player();s.rating=16000;G.check(s);G.continueGame(s);G.nameDuel(s,'四键共鸣','无尽星轨');G.acceptDuel(s);G.startPerformance(s,pool.filter(c=>c.ds===13).slice(0,2),0,true);
 const e=G.currentCurse(s);assert.equal(e.id,'dismantle');assert.match(e.options[0].name,/四键共鸣/);assert.ok(e.options.find(o=>o.id==='talent').disabled);assert.throws(()=>G.chooseCurse(s,'talent'));assert.throws(()=>G.chooseSegment(s,'luck'));
 s.skills={star:15,key:15,reading:15};s.talents.push('reading');assert.equal(G.currentCurse(s).options.find(o=>o.id==='talent').disabled,false);
 for(const seed of [1,100000]){
  const trial=structuredClone(s);trial.seed=seed;G.chooseCurse(trial,'talent');const feedback=structuredClone(trial.major.performance.feedback),resolution=structuredClone(trial.major.performance.curses[0]);
  assert.equal(feedback.passed,seed===1);assert.equal(resolution.opponentLoss,feedback.passed?.35:0);assert.equal(resolution.playerLoss,feedback.passed?0:.2);
  assert.throws(()=>G.chooseCurse(trial,'talent'));assert.throws(()=>G.chooseSegment(trial,'luck'));const restored=G.migrate(JSON.parse(JSON.stringify(trial)));assert.ok(G.validate(restored));assert.deepEqual(restored.major.performance.feedback,feedback);assert.deepEqual(restored.major.performance.curses[0],resolution);
  const effects=[];while(restored.major.performance){const p=restored.major.performance;if(p.feedback){G.acknowledgePerformance(restored);continue;}const curse=G.currentCurse(restored);if(curse){effects.push(curse.id);if(curse.id==='shrine')assert.match(curse.options[0].name,/无尽星轨/);G.chooseCurse(restored,'combine');}else G.chooseSegment(restored,'technique');}
  assert.deepEqual(effects,['reality','shrine','furnace']);const result=restored.major.duel.result.charts[0];assert.equal(result.playerLoss,resolution.playerLoss);assert.equal(result.opponentLoss,resolution.opponentLoss);assert.ok(Math.abs(result.theirs-(result.opponentBase-resolution.opponentLoss))<.0001);assert.ok(G.validate(G.migrate(structuredClone(restored))));
 }
 const bad=structuredClone(s);bad.major.performance.curses[0].opponentLoss=Infinity;bad.major.performance.curses[0].choice='talent';assert.equal(G.validate(bad),false);
});
test('segment feedback is fixed on selection, blocks further input, and matches actual result',()=>{
 const base=enter(player()),c=pool.find(c=>c.tags.includes('拆弹'));let s;
 for(let i=1;i<50;i++){const trial=structuredClone(base);trial.seed=i*12345;G.startPerformance(trial,[c,c,c]);if(G.currentSegment(trial)){s=trial;break;}}
 const e=G.currentSegment(s);G.chooseSegment(s,'luck');const f=structuredClone(s.major.performance.feedback);assert.throws(()=>G.chooseSegment(s,'luck'));const restored=G.migrate(structuredClone(s));assert.deepEqual(restored.major.performance.feedback,f);finish(restored);assert.equal(restored.last.results[e.index].segmentEvents[e.segmentIndex].passed,f.passed);
});
test('14 / 14+ require increasingly specific practice while 13+ and ghost behavior stay separate',()=>{
 const template=pool.find(c=>c.ds===13.7&&!c.tag),s=player();s.skills={star:14.5,key:14.5,reading:14.5};s.condition=2;s.mood=65;s.liquid=1000;
 const charts=[13.7,14.2,14.8,15].map(ds=>({...template,ds,tag:null,tags:[],starWeight:.5})),fresh=charts.map(c=>G.expected(s,c));for(let i=1;i<fresh.length;i++)assert.ok(fresh[i]<fresh[i-1],fresh.join(','));
 const c=charts[2],before=G.expected(s,c);s.practice[G.key(c)]=60;assert.ok(G.expected(s,c)>before+1);s.skills={star:16,key:16,reading:16};assert.ok(G.expected(s,c)>99.5);s.rating=16000;const unchanged=G.expected(s,c);s.rating=14000;assert.equal(G.expected(s,c),unchanged,'Rating is not a hard performance cap');
});

test('curse-breaker grants diminishing all-skill gains once and migrates cosmetic owners once',()=>{
 for(const initial of [{star:10,key:12,reading:13},{star:14,key:15,reading:22}]){
  const expected=initial.star===10?{star:12,key:13,reading:13.5}:{star:14.25,key:15.125,reading:22};
  for(const legacy of [false,true]){
   let s=player();s.skills={...initial};
   if(legacy){s.talents.push('curse-breaker');delete s.curseBreakerRewarded;s=G.migrate(s);}else G.grantTalent(s,'curse-breaker');
   assert.deepEqual(s.skills,expected);assert.equal(s.curseBreakerRewarded,true);assert.ok(G.validate(s));
   for(let i=0;i<3;i++){s=G.migrate(JSON.parse(JSON.stringify(s)));G.grantTalent(s,'curse-breaker');assert.deepEqual(s.skills,expected);assert.equal(s.talents.filter(t=>t==='curse-breaker').length,1);}
  }
 }
 const s=player(),before={...s.skills};G.grantTalent(s,'half-maimai');assert.deepEqual(s.skills,before);assert.equal(s.curseBreakerRewarded,false);
 s.curseBreakerRewarded='yes';assert.equal(G.validate(s),false);
});
test('all failed curses show narrative feedback and migrate pending text without rerolling',()=>{
 const expected=[
  '未能挡住「解」，你感觉你身上多出了几道口子，没法稳住精神，你的达成率降低了。',
  '你的术式远不如宿傩，他全面压制住了你，你的达成率降低了。',
  '你在和宿傩的领域对拼中失败了，他展开了领域「伏魔御厨子」。在斩击中，你的达成率降低了。',
  '「灶」的火焰吞噬了你的全身，你逐渐失去了战意，你的达成率降低了。'
 ];
 let s=player();s.skills={star:1,key:1,reading:1};reached(s);G.startPerformance(s,pool.filter(c=>c.ds===13).slice(0,2),0,true);let checked=0;
 while(s.major.performance){
  const curse=G.currentCurse(s);
  if(curse){s.seed=100000;G.chooseCurse(s,'combine');const p=s.major.performance;assert.equal(p.feedback.passed,false);assert.equal(p.feedback.text,expected[curse.index]);const resolutions=structuredClone(p.curses),seed=s.seed;
   p.feedback.text='未能挡住旧版事件。';s=G.migrate(JSON.parse(JSON.stringify(s)));assert.equal(s.major.performance.feedback.text,expected[curse.index]);assert.deepEqual(s.major.performance.curses,resolutions);assert.equal(s.seed,seed);assert.ok(G.validate(s));checked++;
  }else if(s.major.performance.feedback)G.acknowledgePerformance(s);else G.chooseSegment(s,'technique');
 }
 assert.equal(checked,4);assert.deepEqual(s.major.duel.result.charts.map(c=>c.playerLoss),[.2,.25,.35,.3]);
});
