const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),G=require('../engine');
const ctx={window:{}};vm.runInNewContext(fs.readFileSync(require.resolve('../data/music.js'),'utf8'),ctx);const pool=G.charts(ctx.window.MUSIC_DATA);
function unlocked(job='grinder'){const s=G.create(job,42);G.chatSend(s,'晚上有地方出勤吗？');s.money=10000;return s;}
function ready(job='grinder'){const s=unlocked(job);s.people=0;G.startTrip(s);G.travel(s,'taxi',5);G.drink(s,'water');if(s.queueUntil>s.clock)G.waitQueue(s);return s;}
test('new rewards grant skill, mood and familiarity with caps; legacy claims receive upgrades once',()=>{
 const s=G.create('grinder');s.practice['8:0']=3;const money=s.money,read=s.skills.reading;G.claimGoal(s,'practice');assert.equal(s.skills.reading,read+.25);assert.equal(s.money,money);assert.throws(()=>G.claimGoal(s,'practice'));
 s.city.walks=1;s.mood=99;G.claimGoal(s,'outing');assert.equal(s.mood,100);s.guide.chatted=true;s.npcs[0].familiarity=99;G.claimGoal(s,'social');assert.equal(s.npcs[0].familiarity,100);
 const old=G.create();old.guide.claimed=['first-pc','first-s','rating-12000'];delete old.guide.rewardVersion;const cash=old.money,key=old.skills.key;G.migrate(old);assert.equal(old.money,cash);assert.equal(old.skills.key,key+.4);assert.equal(old.city.denUnlocked,true);const snapshot=JSON.stringify(old);G.migrate(old);assert.equal(JSON.stringify(old),snapshot);assert.ok(G.validate(old));
});
test('den requires a chat invitation and is separate from the five discoverable arcades',()=>{
 const locked=G.create();G.startTrip(locked);assert.throws(()=>G.travel(locked,'taxi',5));const s=unlocked();assert.deepEqual(s.city.arcades,[0,1,2]);assert.ok(G.unlockedArcades(s).some(a=>a.id===5));s.city.arcades.push(3,4);assert.equal(G.unlockedArcades(s).length,6);assert.equal(G.ARCADE_LIMIT,5);assert.ok(G.validate(G.migrate(JSON.parse(JSON.stringify(s)))));s.city.arcades.push(5);assert.equal(G.validate(s),false);
});

test('12000 grants three skills once, preserves old den unlocks and upgrades legacy rewards once',()=>{
 const s=G.create('grinder');s.rating=12000;const before={...s.skills};G.claimGoal(s,'rating-12000');for(const skill of Object.keys(before))assert.equal(s.skills[skill],before[skill]+.25);assert.equal(s.city.denUnlocked,false);assert.throws(()=>G.claimGoal(s,'rating-12000'));
 const old=G.create('grinder');old.guide.rewardVersion=2;old.guide.claimed=['rating-12000'];old.city.denUnlocked=true;const cash=old.money;G.migrate(old);assert.equal(old.skills.reading,8.25);assert.equal(old.money,cash);assert.equal(old.city.denUnlocked,true);G.migrate(old);assert.equal(old.skills.reading,8.25);
});

test('opening chat and bot queries do not invite; an actual message invites only once',()=>{
 const s=G.create('grinder',42);G.chatOpen(s);assert.equal(s.city.denUnlocked,false);G.chatSend(s,'@bot jk');assert.equal(s.city.denUnlocked,false);
 G.chatSend(s,'机厅见');assert.equal(s.city.denUnlocked,true);G.chatSend(s,'收到');assert.equal(s.chat.filter(m=>m.text.includes('给你发个地址')).length,1);assert.ok(G.validate(s));
});
test('den prepays the first hour and includes PC and courses, with renewal money guards',()=>{
 const s=ready(),taxi=G.transportOptions(5).find(t=>t.id==='taxi');assert.equal(s.trip.cost,taxi.cost+35);assert.equal(s.money,10000-taxi.cost-35);const before=s.money;G.play(s,pool.slice(0,3),pool);assert.equal(s.money,before);s.queueUntil=s.clock;s.roundReview=false;const now=s.money;G.runCourse(s,1,pool);assert.equal(s.money,now);G.finishPlay(s);const spent=s.trip.cost;G.meal(s,'noodles','arcade');assert.equal(s.trip.cost,spent+15);s.money=29;s.trip.denMinutes=s.trip.denHours*60;s.queueUntil=s.clock;assert.match(G.playReason(s),/30/);assert.throws(()=>G.play(s,pool.slice(0,3),pool));
 const poor=unlocked();poor.money=G.transportOptions(5).find(t=>t.id==='taxi').cost+29;G.startTrip(poor);const snapshot=JSON.stringify(poor);assert.throws(()=>G.travel(poor,'taxi',5),/30/);assert.equal(JSON.stringify(poor),snapshot);
});
test('late den travel and PC cross midnight, preserve queue and settle daily costs exactly once',()=>{
 const s=unlocked('worker');s.clock=1435;G.startTrip(s);const cash=s.money,taxi=G.transportOptions(5).find(t=>t.id==='taxi');G.travel(s,'taxi',5);assert.equal(s.day,2);assert.equal(s.nightActive,undefined);assert.equal(s.money,cash-taxi.cost-30-G.JOBS.worker.daily);assert.equal(s.clock,11);G.drink(s,'water');if(s.queueUntil>s.clock)G.waitQueue(s);const before=s.money;G.play(s,pool.slice(0,3),pool);assert.equal(s.money,before);assert.ok(G.validate(s));
 G.finishPlay(s);G.meal(s,'home');s.clock=180;G.sleep(s);assert.equal(s.day,2);assert.equal(s.clock,780);assert.ok(s.workAbsences===1);assert.equal(s.drowsiness,0);
 const pc=ready();pc.clock=1435;pc.queueUntil=1435;const cashBefore=pc.money;G.play(pc,pool.slice(0,3),pool);assert.equal(pc.day,2);assert.equal(pc.clock,7);assert.equal(pc.money,cashBefore-G.JOBS.grinder.daily);assert.ok(G.validate(pc));
 const q=ready();q.clock=1435;q.queueUntil=1470;const money=q.money;G.advance(q,10);assert.equal(q.day,2);assert.equal(q.queueUntil,30);assert.equal(q.clock,5);G.waitQueue(q);assert.equal(q.clock,30);assert.equal(q.money,money-G.JOBS.grinder.daily);G.play(q,pool.slice(0,3),pool);assert.ok(G.validate(q));
});
test('ordinary closing and real obligations constrain visits without a student curfew',()=>{
 const ordinary=G.create('grinder');ordinary.clock=1415;G.startTrip(ordinary);assert.throws(()=>G.travel(ordinary,'taxi',0),/23:30/);
 const student=unlocked('student');student.clock=1400;G.startTrip(student);G.travel(student,'taxi',5);assert.equal(student.phase,'drink');
 const worker=unlocked('worker');worker.day=2;worker.clock=530;G.startTrip(worker);assert.throws(()=>G.travel(worker,'taxi',5),/冲突/);
 const late=ready();late.day=2;late.clock=235;late.queueUntil=235;assert.equal(G.playReason(late),'');G.play(late,pool.slice(0,3),pool);assert.equal(late.clock,247);assert.equal(late.phase,'play');
});
