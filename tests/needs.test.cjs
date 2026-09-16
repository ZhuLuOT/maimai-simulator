const test=require('node:test'),assert=require('node:assert/strict'),G=require('../engine');
function active(){const s=G.create('grinder',42);G.startTrip(s);G.travel(s,'bike',0);G.drink(s,'water');return s;}
test('16 awake hours trigger sleep; naps remove sleepiness without restoring a full day',()=>{
 const s=G.create('grinder',42);G.advance(s,959);assert.equal(s.forcedSleeps,0);assert.ok(s.drowsiness>99);G.advance(s,1);assert.equal(s.forcedSleeps,1);assert.equal(s.day,2);assert.equal(s.clock,480);assert.equal(s.drowsiness,0);assert.ok(G.validate(s));
 G.advance(s,480);const before=s.drowsiness;G.sleep(s,'nap');assert.equal(s.drowsiness,before-6.25);assert.equal(s.clock,990);
});
test('bottles have actual volumes and prices; caps reject without spending; consumption switches buffs',()=>{
 const s=active(),cash=s.money;G.refill(s,'coffee');assert.equal(s.money,Math.round((cash-9.9)*100)/100);G.refill(s,'tea');assert.equal(s.liquid,1700);assert.equal(s.bottles.length,3);const snapshot=JSON.stringify(s);assert.throws(()=>G.refill(s,'energy'),/3 瓶/);assert.equal(JSON.stringify(s),snapshot);
 G.useBottle(s,1);assert.equal(s.drink,'coffee');G.consumeDrink(s,200);assert.equal(s.drink,'water');assert.equal(s.bottles.length,2);assert.equal(s.liquid,1500);G.refill(s,'water');G.consumeDrink(s,500);G.useBottle(s,1);G.consumeDrink(s,500);assert.equal(s.bottles.length,2);assert.match(G.bottleReason(s,'water'),/2 瓶/);assert.ok(G.validate(s));
 const saved=G.migrate(JSON.parse(JSON.stringify(s)));assert.deepEqual(saved.bottles,s.bottles);assert.equal(saved.liquid,s.liquid);G.finishPlay(saved);G.meal(saved,'home');G.sleep(saved);assert.deepEqual(saved.bottles,s.bottles);assert.ok(G.validate(saved));
});
test('pink Monster unlocks after meeting Xiaolin, and offers stronger mood and performance buffs',()=>{
 const s=active();assert.ok(!G.drinkOptions(s).some(d=>d.id==='pink'));assert.throws(()=>G.refill(s,'pink'),/解锁/);s.love=1;s.mood=50;const pink=G.drinkOptions(s).find(d=>d.id==='pink'),plain=G.DRINKS.find(d=>d.id==='energy');assert.ok(pink.buff>plain.buff);assert.ok(pink.mood>plain.mood);G.refill(s,'pink');assert.equal(s.mood,58);assert.equal(s.bottles.at(-1).ml,300);
});
test('daily meal reminders can be postponed, are suppressed in arcades and record distinct meals',()=>{
 const s=G.create('student',42);assert.equal(G.mealReminder(s),0);s.nutrition.dismissed.push(0);assert.equal(G.mealReminder(s),-1);G.eatHome(s,'home');assert.deepEqual(s.nutrition.meals,[true,false,false]);assert.equal(G.mealDue(s),-1);assert.throws(()=>G.eatHome(s,'home'),/本餐已吃过/);s.clock=720;assert.equal(G.mealReminder(s),1);G.eatHome(s,'delivery');assert.equal(s.money,1788);s.clock=1080;G.eatHome(s,'saizeriya');assert.deepEqual(s.nutrition.meals,[true,true,true]);assert.equal(s.money,1763);assert.ok(G.validate(s));
 const a=active();a.clock=720;assert.equal(G.mealReminder(a),-1);G.finishPlay(a);G.meal(a,'saizeriya','arcade');assert.equal(a.nutrition.meals[1],true);assert.equal(a.phase,'play');
});
test('a weekday shift pauses for lunch, resumes once and still blocks incompatible actions',()=>{
 const s=G.create('worker',42);s.day=2;G.eatHome(s,'home');G.resolveClass(s,'shift');assert.equal(s.clock,720);assert.equal(s.mealBreak,'shift');assert.equal(s.completed.length,0);assert.equal(G.mealReminder(s),1);assert.throws(()=>G.daily(s,'fun'),/冲突/);G.eatHome(s,'home');G.resolveClass(s,'shift');assert.equal(s.clock,1080);assert.deepEqual(s.completed,['shift']);assert.ok(s.nutrition.meals[1]);assert.equal(s.workAbsences,0);assert.equal(s.mealBreak,null);assert.ok(G.validate(s));
});
test('KFC Thursday discount is calendar based, Saizeriya and dorm delivery have correct effects',()=>{
 const s=G.create('student',42);assert.equal(G.mealOptions(s).find(m=>m.id==='burger').cost,50);s.day=5;assert.equal(G.date(s).getUTCDay(),4);assert.equal(G.mealOptions(s).find(m=>m.id==='burger').cost,29.9);const m=G.mealOptions(s).find(m=>m.id==='saizeriya');assert.equal(m.cost,25);assert.equal(m.mood,18);assert.ok(G.homeMeals(s).some(m=>m.id==='delivery'));assert.ok(!G.homeMeals(G.create('worker')).some(m=>m.id==='delivery'));assert.equal(G.mealOptions(s)[0].name,'回宿舍吃饭');G.log(s,'回家后，在家休息。');assert.equal(s.logs[0].text,'回宿舍后，在宿舍休息。');
});
test('long-term missed meals lower capacity; three healthy active days raise it, once at midnight',()=>{
 const s=G.create('grinder',42);s.money=10000;for(let i=0;i<2;i++){s.clock=1439;s.drowsiness=0;G.advance(s,1);}assert.equal(s.maxStamina,100);s.clock=1439;G.advance(s,1);assert.equal(s.maxStamina,98);assert.equal(s.stamina,98);
 for(let i=0;i<3;i++){s.nutrition.meals=[true,true,true];s.nutrition.away=true;s.clock=1439;G.advance(s,1);}assert.equal(s.maxStamina,99);assert.equal(s.nutrition.badDays,0);assert.equal(s.nutrition.goodDays,0);const saved=G.migrate(JSON.parse(JSON.stringify(s)));assert.equal(saved.maxStamina,99);assert.ok(G.validate(saved));
 s.maxStamina=70;s.nutrition.badDays=10;s.clock=1439;G.advance(s,1);assert.equal(s.maxStamina,70);s.maxStamina=120;s.nutrition.meals=[true,true,true];s.nutrition.away=true;s.nutrition.goodDays=2;s.clock=1439;G.advance(s,1);assert.equal(s.maxStamina,120);
});
test('crowd increases and decreases report actual headcounts, never imaginary departures',()=>{
 const s=active(),X=require('../systems');s.clock=900;s.crowdTick=(s.day-1)*48+30;s.people=12;s.crowdShift=0;s.crowdSeen={arcade:0,count:7};X.tick(s);assert.match(s.logs[0].text,/5 位玩家到店，当前 12 人/);s.crowdShift=-4;X.tick(s);assert.match(s.logs[0].text,/4 位玩家离店，当前 8 人/);const count=s.logs.filter(l=>l.type==='crowd').length;X.tick(s);assert.equal(s.logs.filter(l=>l.type==='crowd').length,count);
});
test('old stock migrates without monetary or skill loss and malformed food/stock saves are rejected',()=>{
 const s=active();delete s.bottles;delete s.nutrition;delete s.mealBreak;s.drink='coffee';s.liquid=600;const cash=s.money;G.migrate(s);assert.equal(s.liquid,600);assert.equal(s.bottles.length,3);assert.equal(s.money,cash);assert.ok(G.validate(s));s.bottles.push({id:'water',ml:1000});assert.equal(G.validate(s),false);s.bottles=[null];assert.equal(G.validate(s),false);
});
