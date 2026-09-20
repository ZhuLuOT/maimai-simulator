const test=require('node:test'),assert=require('node:assert/strict'),G=require('../engine'),{observe}=require('./bird-control.cjs');

test('three featured NPCs migrate in place and become chat friends at familiarity 30',()=>{
 const s=G.create('grinder',42);assert.deepEqual(s.npcs.slice(2,5).map(n=>n.id),['电压','Toqin','COLDDD']);
 s.npcs[2].familiarity=30;G.syncFriends(s);assert.ok(s.world.friends.includes('电压'));assert.ok(s.world.dm['电压'][0].text.includes('观鸟'));
 const before=s.clock;G.sendDM(s,'电压','周末去看看鸟？');assert.equal(s.clock,before+5);assert.equal(s.npcs[2].familiarity,34);assert.ok(G.validate(s));
 const old=G.create();old.npcs[2].id='捞月';old.npcs[3].id='阿澈';old.npcs[4].id='今天不推分';G.migrate(old);assert.deepEqual(old.npcs.slice(2,5).map(n=>n.id),['电压','Toqin','COLDDD']);
});

test('Guangzhou places stay hidden until strolling discovers them and entering creates an event',()=>{
 let found;
 for(let seed=1;seed<300&&!found;seed++){
  const s=G.create('grinder',seed);s.loveFailed=true;s.city.arcades=[0,1,2,3,4];s.city.restaurants=G.RESTAURANTS.map(r=>r.id);
  G.explore(s,'stroll');if(s.world.locations.length)found=s;
 }
 assert.ok(found);const place=found.world.locations[0];assert.ok(G.availableOutings(found).some(x=>x.id===place));assert.ok(found.world.notice?.title.includes('发现新地点'));
 found.world.notice=null;found.clock=480;found.stamina=100;G.explore(found,place);assert.match(found.world.notice.title,/来到/);assert.ok(G.validate(found));
 const locked=G.create('grinder',42);assert.throws(()=>G.explore(locked,'yuexiu'),/闲逛发现/);
});

test('featured quest stages cost resources, record the encyclopedia and award permanent buffs once',()=>{
 const s=G.create('grinder',42),npc=s.npcs.find(n=>n.id==='电压');npc.familiarity=30;s.world.locations=['yuexiu','shamian','canton','yongqing'];G.syncFriends(s);
 const reading=s.skills.reading;
 for(let i=0;i<4;i++){
  s.world.quests['电压'].lastDay=0;s.world.notice=null;s.clock=480;s.stamina=100;G.doQuest(s,'电压');observe(s);assert.equal(s.world.quests['电压'].stage,i+1);assert.ok(s.world.notice);s.day++;
 }
 assert.deepEqual(s.world.entries.slice(0,4),['bulbul','robin','egret','kingfisher']);assert.equal(s.skills.reading,reading);assert.equal(G.worldScoreBonus(s,{id:'fresh',index:3,tendency:'key'}),0);s.world.notice=null;s.clock=1320;s.drowsiness=0;G.doQuest(s,'电压');observe(s);assert.equal(s.world.quests['电压'].stage,5);assert.ok(s.world.entries.includes('owl'));assert.ok(s.world.locations.includes('baiyun'));assert.equal(s.skills.reading,reading+.25);assert.ok(G.worldScoreBonus(s,{id:'fresh',index:3,tendency:'key'})>.07);
 s.world.notice=null;assert.throws(()=>G.doQuest(s,'电压'),/完成/);assert.equal(s.skills.reading,reading+.25);assert.ok(G.validate(s));
});

test('cat den mahjong entry costs real time and stamina, unlocks COLDDD and records a verified result',()=>{
 const s=G.create('grinder',42);s.city.denUnlocked=true;s.clock=1320;G.startTrip(s);s.arcade=5;G.travel(s,'taxi',5);G.drink(s,'water');
 const before={clock:s.clock,stamina:s.stamina,money:s.money};G.startMahjong(s);assert.equal(s.clock,before.clock+25);assert.ok(s.stamina<before.stamina);assert.ok(s.world.friends.includes('COLDDD'));assert.ok(s.world.mahjong.active);
 G.finishMahjong(s,{scores:[27000,23000,25000,25000],text:'玩家荣和 · 2000 点'});assert.equal(s.world.mahjong.rounds,1);assert.equal(s.world.mahjong.wins,1);assert.equal(s.world.quests['COLDDD'].stage,1);assert.ok(s.world.notice);assert.ok(G.validate(s));
});

test('malformed world state is rejected while legacy saves acquire defaults',()=>{
 const legacy=G.create();delete legacy.world;assert.ok(G.validate(G.migrate(legacy)));
 for(const change of [s=>s.world.locations.push('bad'),s=>s.world.friends.push('ghost'),s=>s.world.entries.push('bad'),s=>s.world.quests['电压'].stage=99,s=>s.world.mahjong.rounds=-1]){const s=G.create();change(s);assert.equal(G.validate(s),false);}
});

test('explicit daytime bird outings can collect twenty additional birds without consuming quest unlocks',()=>{
 const s=G.create('grinder',42),original=['bulbul','robin','egret','kingfisher'];
 s.world.locations=['yuexiu','shamian','canton','yongqing'];s.world.quests['电压'].stage=1;s.world.entries=['bulbul'];
 assert.equal(G.WORLD_ENTRIES.filter(e=>e.kind==='bird').length,25);
 for(const place of s.world.locations){
  const birds=G.WORLD_ENTRIES.filter(e=>e.kind==='bird'&&e.place===place&&!original.includes(e.id));
  for(let i=0;i<birds.length;i++){
   s.world.notice=null;s.clock=480;s.stamina=100;s.money=1000;s.drowsiness=0;
   const count=s.world.entries.length;G.startBird(s,place);assert.equal(s.world.entries.length,count);observe(s);
   assert.equal(s.world.entries.length,count+1);assert.ok(birds.some(e=>e.id===s.world.notice.entry));assert.equal(s.money,995);assert.ok(G.validate(s));
  }
  s.world.notice=null;s.clock=480;s.stamina=100;s.drowsiness=0;const count=s.world.entries.length;G.explore(s,place);assert.equal(s.world.entries.length,count);
 }
 assert.equal(s.world.entries.length,21);assert.ok(original.slice(1).every(id=>!s.world.entries.includes(id)));
});

test('bird discoveries require the first quest and a daytime visit',()=>{
 for(const [stage,clock] of [[0,480],[1,180],[1,330],[1,1050],[1,1200]]){
  const s=G.create('grinder',42);s.world.locations=['yuexiu'];s.world.quests['电压'].stage=stage;s.clock=clock;s.stamina=100;s.money=1000;
  G.explore(s,'yuexiu');assert.deepEqual(s.world.entries,[]);assert.equal(s.world.notice.entry,null);
 }
 const s=G.create('grinder',42);s.world.locations=['yuexiu'];s.world.quests['电压'].stage=1;s.clock=360;s.stamina=100;G.explore(s,'yuexiu');assert.equal(s.world.entries.length,0);s.world.notice=null;G.startBird(s,'yuexiu');observe(s);assert.equal(s.world.entries.length,1);
});

test('full bird and art collections survive save migration and reject duplicate records',()=>{
 const s=G.create('grinder',42);s.world.entries=G.WORLD_ENTRIES.map(e=>e.id);assert.equal(s.world.entries.length,29);assert.ok(G.validate(s));
 const restored=G.migrate(JSON.parse(JSON.stringify(s)));assert.deepEqual(restored.world.entries,s.world.entries);assert.ok(G.validate(restored));
 restored.world.entries.push('bulbul');assert.equal(G.validate(restored),false);
 const duplicate=G.create();duplicate.world.entries=['bulbul','bulbul'];assert.equal(G.validate(duplicate),false);
});

test('owl and Baiyun Mountain cannot appear during ordinary exploration',()=>{
 for(let seed=1;seed<60;seed++){
  const s=G.create('grinder',seed);s.loveFailed=true;s.world.quests['电压'].stage=4;s.world.locations=['yuexiu','shamian','canton','yongqing'];s.city.arcades=[0,1,2,3,4];s.city.restaurants=G.RESTAURANTS.map(r=>r.id);
  assert.ok(!G.availableOutings(s).some(x=>x.id==='baiyun'));assert.throws(()=>G.explore(s,'baiyun'));G.explore(s,'stroll');assert.ok(!s.world.locations.includes('baiyun'));assert.ok(!s.world.entries.includes('owl'));
 }
});

test('final bird quest enforces the night window, crosses midnight, and migrates old rewards once',()=>{
 function ready(){const s=G.create('grinder',42);s.world.quests['电压'].stage=4;s.npcs.find(n=>n.id==='电压').familiarity=50;G.syncFriends(s);s.drowsiness=0;return s;}
 for(const clock of [240,480,1319,180]){const s=ready();s.clock=clock;const before=JSON.stringify(s);assert.match(G.questReason(s,'电压'),/深夜/);assert.throws(()=>G.doQuest(s,'电压'));assert.equal(JSON.stringify(s),before);}
 for(const clock of [0,150,1320,1410]){const s=ready();s.clock=clock;const day=s.day;G.doQuest(s,'电压');observe(s);assert.equal(s.world.quests['电压'].stage,5);assert.equal(s.world.notice.entry,'owl');assert.ok(G.availableOutings(s).some(x=>x.id==='baiyun'));assert.equal(s.day,day+(clock===1410?1:0));assert.ok(G.validate(s));}
 const old=ready();delete old.world.quests['电压'].rewarded;old.skills.reading=8.25;G.migrate(old);assert.equal(old.world.quests['电压'].rewarded,true);assert.ok(G.worldScoreBonus(old,{id:'1',index:0})>.07);old.clock=1320;G.doQuest(old,'电压');observe(old);assert.equal(old.skills.reading,8.25);G.migrate(old);assert.equal(old.skills.reading,8.25);
 const interrupted=ready();interrupted.clock=1320;interrupted.drowsiness=99;G.doQuest(interrupted,'电压');assert.equal(interrupted.world.quests['电压'].stage,4);assert.ok(!interrupted.world.entries.includes('owl'));assert.ok(!interrupted.world.locations.includes('baiyun'));
});

test('Dianya group posts continue to use only the four original photo entries',()=>{
 const s=G.create('grinder',42),posted=new Set();
 for(let i=0;i<150;i++){s.day=1+Math.floor(i/3);s.clock=480+(i%3)*240;s.world.lifeBucket=-1;G.worldTick(s);for(const m of s.chat)if(m.id==='电压'&&m.worldEntry)posted.add(m.worldEntry);}
 assert.deepEqual([...posted].sort(),['bulbul','egret','kingfisher','robin']);
});
