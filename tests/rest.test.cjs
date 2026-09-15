const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),G=require('../engine');
const context={window:{}};vm.runInNewContext(fs.readFileSync(require.resolve('../data/music.js'),'utf8'),context);const pool=G.charts(context.window.MUSIC_DATA);
function den(){const s=G.create('grinder',42);s.city.denUnlocked=true;s.money=10000;s.people=0;G.startTrip(s);G.travel(s,'taxi',5);G.drink(s,'water');s.queueUntil=0;return s;}
test('hourly billing renews at minute 61, persists, includes queue/chat and pauses for meals',()=>{
 let s=den();const cash=s.money;G.advance(s,55);assert.equal(s.trip.denMinutes,60);assert.equal(s.money,cash);
 s=G.migrate(JSON.parse(JSON.stringify(s)));G.advance(s,1);assert.equal(s.money,cash-30);assert.equal(s.trip.denHours,2);
 s.queueUntil=s.clock+10;G.waitQueue(s);assert.equal(s.trip.denMinutes,71);G.chatSend(s,'大家好');assert.equal(s.trip.denMinutes,76);
 G.finishPlay(s);const minutes=s.trip.denMinutes;G.meal(s,'noodles','arcade');assert.equal(s.trip.denMinutes,minutes);assert.ok(G.validate(s));
});
test('unaffordable renewal rejects a round before time or resources change',()=>{
 const s=den();s.trip.denMinutes=60;s.money=29;const before=JSON.stringify(s);assert.throws(()=>G.play(s,pool.slice(0,3),pool),/续时/);assert.equal(JSON.stringify(s),before);
});
test('midnight charges can end a paid-hour action without corrupting the outing',()=>{
 const s=den();s.clock=1439;s.trip.denMinutes=59;s.money=40;G.advance(s,5);assert.equal(s.phase,'meal');assert.equal(s.money,15);assert.equal(s.trip.denHours,1);assert.equal(s.trip.denMinutes,60);assert.ok(G.validate(s));
});
test('drowsiness accumulates independently, impacts performance above 60 and naps restore resources',()=>{
 const s=G.create('grinder',42);s.stamina=40;G.advance(s,180);assert.ok(Math.abs(s.drowsiness-18.75)<1e-8);assert.equal(s.stamina,40);
 s.drowsiness=80;assert.equal(G.sleepPenalty(s),.5);const c=pool[10],tired=G.expected(s,c);s.drowsiness=60;assert.ok(G.expected(s,c)>tired);
 s.drowsiness=80;const clock=s.clock;G.sleep(s,'nap');assert.equal(s.clock,clock+30);assert.equal(s.drowsiness,65);assert.equal(s.stamina,60);
 G.sleep(s);assert.equal(s.drowsiness,0);assert.equal(s.stamina,s.maxStamina);assert.ok(G.validate(s));
});
test('full drowsiness interrupts wages, PC rewards and courses without continuing after sleep',()=>{
 const s=G.create('grinder',42);s.drowsiness=99.9;const money=s.money;G.daily(s,'work');assert.equal(s.money,money);assert.equal(s.workCount,0);assert.equal(s.clock,961);assert.equal(s.forcedSleeps,1);assert.equal(s.drowsiness,0);
 for(const course of [false,true]){const p=den(),before=p.credits,km=p.collection.distanceKm,back=p.trip.returnTime,clock=p.clock;p.drowsiness=99.9;if(course)G.runCourse(p,1,pool);else G.play(p,pool.slice(0,3),pool);assert.equal(p.phase,'home');assert.equal(p.credits,before);assert.equal(p.last,null);assert.equal(p.clock,clock+1+back+480);assert.equal(p.collection.distanceKm,km+G.ARCADE_KM[5]);assert.equal(p.competition.courses.length,0);assert.ok(G.validate(p));}
});
test('forced return during an existing return journey only adds its remaining minutes',()=>{
 const s=den();G.finishPlay(s);const clock=s.clock,back=s.trip.returnTime;s.drowsiness=100-20*100/960;G.meal(s,'home');assert.equal(s.clock,clock+15+back+480);assert.equal(s.phase,'home');assert.equal(s.collection.distanceKm,G.ARCADE_KM[5]*2);assert.ok(G.validate(s));
});
test('forced sleep en route charges transport but does not admit or charge a den hour',()=>{
 const s=G.create('grinder',42);s.city.denUnlocked=true;s.drowsiness=99.9;const cash=s.money,clock=s.clock,fare=G.transportOptions(5).find(t=>t.id==='taxi').cost;G.startTrip(s);G.travel(s,'taxi',5);assert.equal(s.phase,'home');assert.equal(s.visits,0);assert.equal(s.money,cash-fare);assert.equal(s.clock,clock+2+480);assert.ok(s.collection.distanceKm>0);assert.ok(G.validate(s));
});
test('sleep overlaps record the appropriate absence, including naps and interrupted lessons',()=>{
 const s=G.create('student',42);s.day=2;s.clock=530;s.drowsiness=50;G.sleep(s,'nap');assert.ok(s.absences.includes('mon-major'));assert.equal(s.school.academic,53);assert.equal(s.clock,560);
 const w=G.create('worker',42);w.day=2;w.clock=300;G.sleep(w);assert.equal(w.clock,780);assert.equal(w.workAbsences,1);assert.equal(w.money,6000-273);
 const c=G.create('student',42);c.day=2;c.clock=540;c.drowsiness=99.9;G.resolveClass(c,'mon-major');assert.ok(c.absences.includes('mon-major'));assert.ok(c.school.academic<70);assert.equal(c.phase,'home');assert.equal(c.forcedSleeps,1);
});
test('new characters start lower while existing skill progress and valid saves survive migration',()=>{
 const s=G.create('grinder');assert.deepEqual(s.skills,{star:8,key:8,reading:8});s.skills={star:12,key:13,reading:11};delete s.drowsiness;delete s.forcedSleeps;s.sleepDebt=3;G.migrate(s);assert.deepEqual(s.skills,{star:12,key:13,reading:11});assert.equal(s.sleepDebt,0);assert.ok(G.validate(s));s.drowsiness=101;assert.equal(G.validate(s),false);
});
