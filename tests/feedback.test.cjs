const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const G=require('../engine'),X=require('../systems');
const ctx={window:{}};vm.runInNewContext(fs.readFileSync(require.resolve('../data/music.js'),'utf8'),ctx);const pool=G.charts(ctx.window.MUSIC_DATA);

test('goals settle automatically on return, remain pending outside, and survive reload without double rewards',()=>{
 const s=G.create('grinder',42);s.clock=900;s.money=10000;G.startTrip(s);G.travel(s,'bike',0);G.drink(s,'water');if(s.queueUntil>s.clock)G.waitQueue(s);
 const c=pool.find(c=>c.ds<5&&!G.isUtage(c));G.play(s,[c,c,c],pool);
 assert.ok(!s.guide.claimed.includes('first-pc'));assert.ok(!s.guide.claimed.includes('practice'));
 G.finishPlay(s);const cash=s.money,skills={...s.skills};G.meal(s,'home');
 assert.equal(s.phase,'home');assert.equal(s.money,cash+30);assert.ok(s.guide.claimed.includes('practice'));assert.equal(s.skills.reading,skills.reading+.25);
 const restored=G.migrate(structuredClone(s)),snapshot=JSON.stringify(restored);G.claimHomeGoals(restored);G.claimHomeGoals(restored);assert.equal(JSON.stringify(restored),snapshot);assert.ok(G.validate(restored));
 const legacy=G.create();legacy.credits=1;legacy.practice[G.key(c)]=3;G.claimHomeGoals(legacy);assert.equal(legacy.money,1830);assert.equal(legacy.skills.reading,8.25);
});

test('foundation needs exactly a full B35 of levels 12 and 12+ regardless of chart color or B15',()=>{
 const charts=pool.filter(c=>!c.isNew&&!G.isUtage(c)&&['12','12+'].includes(c.level)&&c.index!==2).slice(0,35);assert.equal(charts.length,35);
 const s=G.create('grinder',42),add=c=>{s.records[G.key(c)]={...c,achievement:100,ra:G.chartRating(c.ds,100)};};
 charts.slice(0,34).forEach(add);X.afterPlay(s,[]);assert.ok(!s.talents.includes('foundation'));
 add(charts[34]);const higher=pool.find(c=>!c.isNew&&c.ds>=14&&!G.isUtage(c));add(higher);X.afterPlay(s,[]);assert.ok(!s.talents.includes('foundation'));
 delete s.records[G.key(higher)];const before={...s.skills};X.afterPlay(s,[]);assert.ok(s.talents.includes('foundation'));assert.equal(G.best(s).fresh.length,0);
 for(const k of Object.keys(before))assert.equal(s.skills[k],before[k]+2);const after={...s.skills};X.afterPlay(s,[]);assert.deepEqual(s.skills,after);
 const fresh=G.create();charts.forEach(c=>{fresh.records[G.key(c)]={...c,isNew:true,achievement:100,ra:270};});X.afterPlay(fresh,[]);assert.ok(!fresh.talents.includes('foundation'));
});

test('condition refreshes at midnight even after a six-hour sleep, and daytime sleeps do not reroll it',()=>{
 const s=G.create('grinder',42);s.condition=4;s.mood=20;s.clock=30;G.sleep(s,360);assert.equal(s.condition,4);
 s.clock=1430;s.drowsiness=10;G.advance(s,20);assert.equal(s.day,2);assert.ok(s.condition<4);const condition=s.condition;
 G.sleep(s,360);assert.equal(s.condition,condition);G.sleep(s,480);assert.equal(s.condition,condition);
 const restored=G.migrate(structuredClone(s));assert.equal(restored.condition,condition);assert.ok(G.validate(restored));
});

test('daily costs credit each paid meal once, retain a base expense and migrate old nutrition safely',()=>{
 const s=G.create('worker',42);const cash=s.money;
 G.eatHome(s,'noodles');assert.equal(G.dailyExpense(s),35);assert.throws(()=>G.eatHome(s,'noodles'));
 s.clock=720;G.eatHome(s,'saizeriya');s.clock=1080;G.eatHome(s,'home');assert.equal(G.dailyExpense(s),25);
 const expense=G.dailyExpense(s);s.clock=1439;s.drowsiness=0;G.advance(s,1);assert.equal(s.money,cash-15-25-expense);assert.equal(s.lastSettlement.expense,25);assert.equal(G.dailyExpense(s),45);
 const money=s.money;G.advance(s,1);assert.equal(s.money,money);assert.ok(G.validate(s));
 delete s.nutrition.paidMeals;G.migrate(s);assert.deepEqual(s.nutrition.paidMeals,[0,0,0]);assert.ok(G.validate(s));
 for(const x of [NaN,-1,11]){const bad=structuredClone(s);bad.nutrition.paidMeals[0]=x;assert.equal(G.validate(bad),false);}
});

test('midnight receives salary before judging bankruptcy, rent and expenses still settle once',()=>{
 for(const job of ['student','worker']){const s=G.create(job,42);s.day=31;s.clock=1439;s.completed=G.schedule(s).map(c=>c.id);s.money=1;s.drowsiness=0;
  G.advance(s,1);assert.equal(s.ending,null);assert.equal(s.day,32);assert.equal(s.money,1-G.JOBS[job].daily+G.JOBS[job].monthly);
  const cash=s.money;G.advance(s,1);assert.equal(s.money,cash);assert.ok(G.validate(s));
 }
 const s=G.create('grinder',42);s.clock=1439;s.money=G.JOBS.grinder.daily;s.drowsiness=0;G.advance(s,1);assert.equal(s.ending,'broke');
});

test('a worker can afford a month of ordinary attendance expenses, daily basics and rent',()=>{
 const s=G.create('worker',42);
 while(s.day<=31&&!s.ending){
  G.eatHome(s,'home');for(const c of G.schedule(s)){G.resolveClass(s,c.id);if(s.mealBreak){G.eatHome(s,'home');G.resolveClass(s,c.id);}}
  if(!s.nutrition.meals[1]){s.clock=720;G.eatHome(s,'home');}s.clock=1080;G.eatHome(s,'home');
  // Daily budget: six ordinary PCs, bike, water and averaged glove replacement.
  s.money-=48;s.clock=1380;s.drowsiness=60;G.sleep(s,480);
 }
 assert.equal(s.ending,null);assert.equal(s.day,32);assert.deepEqual(s.paidMonths,[3]);assert.equal(s.workAbsences,0);assert.equal(s.money,6000+6000-1800-31*(45+48));assert.ok(G.validate(s));
});

test('skill surplus has reduced influence while progress and difficulty deficits remain meaningful',()=>{
 const s=G.create('grinder',42),c={...pool.find(c=>c.ds===12),tag:null,starWeight:.5};s.mood=65;s.liquid=0;s.condition=2;
 s.skills={star:12,key:12,reading:12};const equal=G.ability(s,c),score=G.expected(s,c);
 s.skills={star:14,key:14,reading:14};assert.ok(Math.abs(G.ability(s,c)-equal-1.7)<1e-9);assert.ok(G.expected(s,c)>score);
 s.skills={star:10,key:10,reading:10};assert.equal(G.ability(s,c),10);assert.ok(G.expected(s,c)<score);
});
