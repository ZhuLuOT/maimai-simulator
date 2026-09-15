const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const G=require('../engine'),P=require('../precision'),J=require('../judgement'),X=require('../systems');
const ctx={window:{}};vm.runInNewContext(fs.readFileSync(require.resolve('../data/music.js'),'utf8'),ctx);const pool=G.charts(ctx.window.MUSIC_DATA);
const chart={...pool.find(c=>c.ds===12),starWeight:.5,notes:[450,50,200,50,50],tags:[],tag:null};
function sample(base,plays,loss=0,condition=2){
 const result={ap:0,fc:0,score:0,maxCombo:0};
 for(let i=1;i<=1600;i++){
  const s=G.create('grinder',i*9973);s.skills={star:16,key:16,reading:16};s.condition=condition;
  s.precision.base=base;s.precision.loss=loss;s.practice[G.key(chart)]=plays;
  const r=J.simulate(s,chart,101,16);result.ap+=r.combo==='AP';result.fc+=!!r.combo;result.score+=r.achievement;result.maxCombo+=r.maxCombo;
 }
 for(const k of Object.keys(result))result[k]/=1600;return result;
}
function arrive(){const s=G.create('grinder',42);G.startTrip(s);G.travel(s,'bike',0);G.drink(s,'water');if(s.queueUntil>s.clock)G.waitQueue(s);return s;}
test('precision grows per completed song including utage; rejected or interrupted PCs earn none',()=>{
 const s=arrive(),c=pool.find(c=>c.utage),base=s.precision.base;assert.ok(c);
 G.play(s,[c,c,c],pool);assert.ok(Math.abs(s.precision.base-base-.036)<1e-8);assert.equal(s.practice[G.key(c)],3);
 assert.equal(s.precision.lastPlay,(s.day-1)*1440+s.clock);
 const saved=JSON.stringify(s.precision);assert.throws(()=>G.play(s,[c,c,c],pool));assert.equal(JSON.stringify(s.precision),saved);
 const tired=arrive();tired.drowsiness=99.95;const before=tired.precision.base;G.play(tired,[c,c,c],pool);
 assert.equal(tired.forcedSleeps,1);assert.equal(tired.precision.base,before);assert.equal(tired.precision.lastPlay,null);
});
test('36 hour grace covers daily play; later decay is proportional and never crosses the floor',()=>{
 const s=G.create();P.afterSong(s);const base=s.precision.base;
 s.day=2;s.clock=1200;P.tick(s);assert.equal(s.precision.loss,0);
 s.day=3;P.tick(s);assert.ok(Math.abs(s.precision.loss-3)<1e-8);
 const loss=s.precision.loss;P.tick(s);P.tick(s);assert.equal(s.precision.loss,loss);
 s.day=100;P.tick(s);assert.equal(s.precision.base,base);assert.equal(s.precision.base-s.precision.loss,40);
 s.condition=0;assert.equal(P.value(s),40);
 const inactive=G.create();inactive.day=30;P.tick(inactive);assert.equal(inactive.precision.loss,0);
});
test('playing recovers rust much faster than long-term growth, with no over-recovery',()=>{
 const s=G.create();P.afterSong(s);s.day=12;P.tick(s);const base=s.precision.base,loss=s.precision.loss;
 P.afterSong(s);assert.ok(loss-s.precision.loss>3);assert.ok(s.precision.base-base<.02);
 for(let i=0;i<20;i++)P.afterSong(s);assert.equal(s.precision.loss,0);
 s.precision.base=94.999;P.afterSong(s);assert.equal(s.precision.base,95);assert.ok(G.validate(s));
});
test('daily variation persists through reload, previews do not reroll it, and condition matters',()=>{
 const s=G.create('grinder',42),original=JSON.stringify(s.precision),seed=s.seed,value=P.value(s);
 for(let i=0;i<10;i++){P.value(s);G.expected(s,chart);}assert.equal(JSON.stringify(s.precision),original);assert.equal(s.seed,seed);
 const restored=G.migrate(JSON.parse(JSON.stringify(s)));assert.equal(P.value(restored),value);
 s.day++;P.tick(s);assert.notEqual(s.precision.dailyOffset,restored.precision.dailyOffset);
 s.condition=0;const bad=P.value(s);s.condition=4;assert.ok(P.value(s)>bad);
 const daily=s.precision.dailyOffset;X.rollCondition(s);assert.equal(s.precision.dailyOffset,daily);
});
test('sleep and normal game time apply rust without deleting learned precision',()=>{
 const s=G.create('grinder',42);s.money=10000;P.afterSong(s);s.day=4;s.clock=480;s.condition=2;
 const base=s.precision.base;G.sleep(s);assert.ok(s.precision.loss>0);assert.equal(s.precision.base,base);assert.equal(s.precision.updatedAt,(s.day-1)*1440+s.clock);
});
test('first sight and low play counts reduce AP and FC; mature precision improves both',()=>{
 const first=sample(60,0),few=sample(60,2),practiced=sample(60,30),trained=sample(95,30);
 assert.ok(first.ap<.12&&first.fc<.7);assert.ok(first.ap<few.ap&&few.ap<practiced.ap);
 assert.ok(first.fc<few.fc&&few.fc<practiced.fc);assert.ok(trained.ap>practiced.ap+.25);assert.ok(trained.fc>practiced.fc+.1);
 assert.ok(trained.maxCombo>first.maxCombo+50);assert.ok(trained.score-first.score<.4);
 assert.ok(trained.ap>0&&trained.ap<1,'AP remains possible, never guaranteed');
});
test('rust and daily condition affect combo stability more than final achievement',()=>{
 const ready=sample(90,20),rusty=sample(90,20,40),bad=sample(80,20,0,0),good=sample(80,20,0,4);
 assert.ok(ready.ap>rusty.ap+.25&&ready.fc>rusty.fc+.1);assert.ok(ready.maxCombo>rusty.maxCombo);
 assert.ok(ready.score>rusty.score&&ready.score-rusty.score<.4);assert.ok(good.ap>bad.ap&&good.fc>bad.fc);
});
test('maximum combo agrees with misses; a failed segment cannot increase it',()=>{
 let sawFailure=false,sawFC=false;
 for(let seed=1;seed<=200;seed++){
  const s=G.create('grinder',seed*9973);s.skills={star:10,key:10,reading:8};const c={...chart,tags:['拆弹']};
  const r=J.simulate(s,c,101,14),final=J.segment(s,c,r),count=c.notes.reduce((a,b)=>a+b,0);
  for(const value of [r,final]){
   assert.ok(Number.isInteger(value.maxCombo)&&value.maxCombo>=0&&value.maxCombo<=count-value.judgements.miss);
   if(!value.judgements.miss){sawFC=true;assert.equal(value.maxCombo,count);}else assert.ok(value.maxCombo<count);
   assert.equal(value.combo,G.combo(value.judgements));
  }
  if(final.segmentEvent&&!final.segmentEvent.passed){sawFailure=true;assert.ok(final.maxCombo<=r.maxCombo);}
 }
 assert.ok(sawFailure&&sawFC);
});
test('old saves initialize once, retain best records, and malformed precision/combos are rejected',()=>{
 const s=arrive();G.play(s,[pool[0],pool[0],pool[0]],pool);delete s.precision;
 const best=JSON.stringify(s.records),m=G.migrate(structuredClone(s));assert.ok(G.validate(m));assert.equal(JSON.stringify(m.records),best);
 const p=JSON.stringify(m.precision);G.migrate(m);assert.equal(JSON.stringify(m.precision),p);
 for(const mutate of [s=>s.precision=null,s=>s.precision.base=Infinity,s=>s.precision.loss=100,s=>s.precision.updatedAt=-1,s=>s.precision.lastPlay=1e8,s=>s.precision.dailyOffset=3,s=>s.precision.salt=-1,s=>s.last.results[0].maxCombo=1e9]){
  const broken=structuredClone(m);mutate(broken);assert.equal(G.validate(broken),false);
 }
});
