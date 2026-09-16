const test=require('node:test'),assert=require('node:assert/strict'),G=require('../engine');

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
  s.world.quests['电压'].lastDay=0;s.world.notice=null;s.clock=480;s.stamina=100;G.doQuest(s,'电压');assert.equal(s.world.quests['电压'].stage,i+1);assert.ok(s.world.notice);s.day++;
 }
 assert.deepEqual(s.world.entries.slice(0,4),['bulbul','robin','egret','kingfisher']);assert.equal(s.skills.reading,reading+.25);assert.ok(G.worldScoreBonus(s,{id:'fresh',index:3,tendency:'key'})>.07);
 s.world.notice=null;assert.throws(()=>G.doQuest(s,'电压'),/完成/);assert.equal(s.skills.reading,reading+.25);assert.ok(G.validate(s));
});

test('cat den mahjong entry costs real time and stamina, unlocks COLDDD and records a verified result',()=>{
 const s=G.create('grinder',42);s.city.denUnlocked=true;G.startTrip(s);s.arcade=5;G.travel(s,'taxi',5);G.drink(s,'water');
 const before={clock:s.clock,stamina:s.stamina,money:s.money};G.startMahjong(s);assert.equal(s.clock,before.clock+25);assert.ok(s.stamina<before.stamina);assert.ok(s.world.friends.includes('COLDDD'));assert.ok(s.world.mahjong.active);
 G.finishMahjong(s,{scores:[27000,23000,25000,25000],text:'玩家荣和 · 2000 点'});assert.equal(s.world.mahjong.rounds,1);assert.equal(s.world.mahjong.wins,1);assert.equal(s.world.quests['COLDDD'].stage,1);assert.ok(s.world.notice);assert.ok(G.validate(s));
});

test('malformed world state is rejected while legacy saves acquire defaults',()=>{
 const legacy=G.create();delete legacy.world;assert.ok(G.validate(G.migrate(legacy)));
 for(const change of [s=>s.world.locations.push('bad'),s=>s.world.friends.push('ghost'),s=>s.world.entries.push('bad'),s=>s.world.quests['电压'].stage=99,s=>s.world.mahjong.rounds=-1]){const s=G.create();change(s);assert.equal(G.validate(s),false);}
});
