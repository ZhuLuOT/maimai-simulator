const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),G=require('../engine');

test('custom sleep previews actual recovery and midnight without mutating the save',()=>{
  for(const minutes of [30,90,240,480,720]){
    const s=G.create('grinder',42);s.clock=1380;s.drowsiness=80;s.stamina=10;
    const before=JSON.stringify(s),p=G.sleepPlan(s,minutes);assert.equal(JSON.stringify(s),before);
    G.sleep(s,minutes);assert.equal(s.day,p.day);assert.equal(s.clock,p.clock);
    assert.equal(s.drowsiness,80-p.recovery);assert.equal(s.stamina,10+p.staminaRecovery);assert.ok(G.validate(s));
  }
  const s=G.create();for(const minutes of [0,-30,31,750,NaN,Infinity,'bad']){
    const before=JSON.stringify(s);assert.throws(()=>G.sleep(s,minutes));assert.equal(JSON.stringify(s),before);
  }
});

test('work experience grows across days and eight hours never exceeds 200',()=>{
  const s=G.create('grinder',42);s.money=10000;let previous=0;
  for(let day=1;day<=15;day++){
    s.day=day;s.clock=480;s.drowsiness=0;s.workCount=0;s.mood=100;const before=s.money,quote=G.workIncome(s);
    G.daily(s,'work');assert.equal(s.money-before,quote);assert.ok(quote>=previous);previous=quote;
    G.daily(s,'work');assert.ok(s.money-before<=200);assert.equal(s.totalWorkCount,day*2);assert.throws(()=>G.daily(s,'work'),/两次/);
    assert.ok(G.validate(G.migrate(JSON.parse(JSON.stringify(s)))));
  }
  assert.equal(G.workIncome(s),100);
  s.clock=1200;s.workCount=0;s.drowsiness=0;G.daily(s,'work');assert.equal(s.workCount,0);assert.equal(s.totalWorkCount,31);
  s.clock=480;s.drowsiness=99.99;const count=s.totalWorkCount;G.daily(s,'work');assert.equal(s.totalWorkCount,count);
});

test('03:00 is free for all careers; only actual obligations block time',()=>{
  for(const job of Object.keys(G.JOBS)){
    const s=G.create(job,42);s.day=2;s.clock=180;s.city.denUnlocked=true;s.people=40;
    for(let i=0;i<5;i++){assert.equal(G.peopleAt(s,i),0);assert.equal(G.arcadeIsOpen(s,i),false);}
    assert.ok(G.arcadeIsOpen(s,5));assert.ok(G.canSpendTime(s,90));
    G.explore(s,'music');assert.equal(s.clock,225);
    s.people=0;G.startTrip(s);assert.equal(s.arcade,5);G.travel(s,'taxi');G.drink(s,'water');assert.equal(G.playReason(s),'');
    if(job!=='grinder'){s.phase='home';s.trip=null;s.clock=530;assert.equal(G.canSpendTime(s,30),false);}
  }
  const closed=G.create('worker');closed.day=2;closed.clock=180;G.startTrip(closed);
  assert.throws(()=>G.travel(closed,'taxi',0),/已打烊/);assert.equal(closed.clock,180);
  const late=G.create('worker');late.clock=1430;assert.ok(G.canSpendTime(late,120));
  assert.equal(G.canSpendTime(late,600),false);
});

test('only story NPCs become friends and old COLDDD duplicates merge with their progress',()=>{
  const s=G.create('grinder',42);s.npcs.forEach(n=>n.familiarity=100);G.syncFriends(s);
  assert.deepEqual(s.world.friends,['电压','Toqin']);s.world.metSleep=true;G.syncFriends(s);assert.equal(s.world.friends.length,3);
  s.npcs[5].id='我要睡觉';s.npcs[5].rating=16000;s.npcs[4].familiarity=20;
  s.partner=5;s.world.friends.push('我要睡觉','逃遁');s.world.dm['逃遁']=[];
  s.world.dm['我要睡觉']=[{id:'我要睡觉',text:'你好',day:1,time:480}];s.world.quests['我要睡觉']={stage:2,lastDay:1,started:true};
  s.chat.push({id:'我要睡觉',text:'你好',day:1,time:480});
  G.migrate(s);assert.equal(s.npcs.length,30);assert.equal(new Set(s.npcs.map(n=>n.id)).size,30);
  assert.equal(s.npcs[s.partner].id,'COLDDD');assert.equal(s.npcs[s.partner].rating,16000);assert.equal(s.npcs[s.partner].familiarity,100);
  assert.equal(s.world.quests.COLDDD.stage,2);assert.equal(s.world.dm.COLDDD.at(-1).id,'COLDDD');assert.equal(s.chat.at(-1).id,'COLDDD');
  assert.equal(s.world.friends.length,3);assert.ok(!s.world.dm['逃遁']);assert.ok(G.validate(s));
  const before=JSON.stringify(s);G.migrate(s);assert.equal(JSON.stringify(s),before);
});

test('new releases notify once, recover after network failure and ignore malformed responses',async()=>{
  const source=fs.readFileSync(require.resolve('../src/update-notice.js'),'utf8');
  const code=require('esbuild').transformSync(source,{format:'cjs'}).code;
  const context={module:{exports:{}},globalThis:{}};vm.runInNewContext(code,context);
  const {watchRelease}=context.module.exports,seen=[];let response={version:'one'},poll;
  const watcher=watchRelease({current:'one',notify:r=>seen.push(r.version),setInterval:fn=>{poll=fn;return 1;},fetchRelease:async()=>{if(response instanceof Error)throw response;return response;}});
  await new Promise(resolve=>setImmediate(resolve));assert.deepEqual(seen,[]);
  response=Error('offline');await watcher.check();response={version:'two'};await poll();await poll();assert.deepEqual(seen,['two']);
  response={version:'<invalid>'};await poll();response={version:'three'};await poll();assert.deepEqual(seen,['two','three']);
});
