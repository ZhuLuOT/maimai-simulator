const test=require('node:test'),assert=require('node:assert/strict'),G=require('../engine');
const day=iso=>Math.round((Date.parse(iso+'T00:00:00Z')-G.START)/86400000)+1;
function at(iso,job='student'){const s=G.create(job,42);s.day=day(iso);s.clock=480;return s;}

test('2026 official holidays remove classes and work without extending the season',()=>{
 assert.equal(G.DAYS,122);assert.equal(G.dateISO({day:G.DAYS}),'2026-06-30');
 for(const iso of ['2026-04-04','2026-04-05','2026-04-06','2026-05-01','2026-05-02','2026-05-03','2026-05-04','2026-05-05','2026-06-19','2026-06-20','2026-06-21']){
  for(const job of ['student','worker']){const s=at(iso,job);assert.ok(G.dayInfo(s).holiday);assert.deepEqual(G.schedule(s),[]);assert.equal(G.canSpendTime(s,600),true);}
 }
 for(const iso of ['2026-04-03','2026-04-07','2026-05-06','2026-06-18','2026-06-22'])assert.ok(G.schedule(at(iso)).length);
});

test('May 9 is a makeup workday and uses the Tuesday student timetable',()=>{
 const s=at('2026-05-09');assert.equal(G.dayInfo(s).makeup,'劳动节调休');assert.equal(G.dayInfo(s).rest,false);assert.deepEqual(G.schedule(s).map(c=>c.id),['tue-general','tue-major']);
 const worker=at('2026-05-09','worker');assert.equal(G.schedule(worker)[0].start,540);assert.equal(G.canSpendTime(worker,120),false);
 assert.deepEqual(G.schedule(at('2026-05-10')),[]);assert.deepEqual(G.schedule(at('2026-05-09','grinder')),[]);
});

test('cross-midnight actions and sleep previews respect holidays and makeup shifts',()=>{
 const holiday=at('2026-04-03','worker');holiday.clock=1380;assert.equal(G.canSpendTime(holiday,720),true);assert.deepEqual(G.sleepPlan(holiday,720).conflicts,[]);
 for(const iso of ['2026-04-06','2026-05-08']){const work=at(iso,'worker');work.clock=1380;assert.equal(G.canSpendTime(work,720),false);assert.ok(G.sleepPlan(work,720).conflicts.length>0);}
 const old=at('2026-05-01','worker');old.mealBreak='shift';G.migrate(old);assert.equal(old.mealBreak,null);assert.ok(G.validate(old));
});

test('higher matched ability requires increasingly more practice for the same gain',()=>{
 const factors=[10,12,14,16].map(level=>{const s=G.create('grinder',42);s.skills={star:level,key:level,reading:level};return G.growthFactor(s,{ds:level,starWeight:.5});});
 assert.equal(factors[0],1);assert.ok(factors.every((n,i)=>n>0&&(!i||n<factors[i-1])));assert.ok(factors[2]<.2);assert.ok(1/factors[3]>10);
});
