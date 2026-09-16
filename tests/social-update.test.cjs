const test=require('node:test'),assert=require('node:assert/strict'),G=require('../engine'),R=require('../romance');
function outing(s){s.phase='play';s.trip={rounds:1};s.visits+=2;G.finishPlay(s);}
test('eight romance events require separate days, real visits, trust and final Rating',()=>{
 const s=G.create('grinder',42);s.money=10000;
 for(let stage=0;stage<8;stage++){
  s.day=Math.max(s.day,s.romance.nextDay);s.clock=600;
  if(stage===7){s.rating=13000;outing(s);assert.equal(s.event,null);s.rating=13001;}
  outing(s);if(stage>0){assert.equal(s.event,null);assert.equal(s.romance.pendingStory,stage);G.openLinStory(s);}assert.equal(s.event,stage);G.answer(s,G.EVENTS[stage].correct);
  assert.equal(s.love,stage+1);assert.equal(s.romance.memories.length,stage+1);
  if(stage<7){outing(s);assert.equal(s.event,null);s.phase='home';G.contactLove(s,'chat');}
 }
 assert.ok(s.day>=40);assert.equal(s.ending,'love');
});
test('one poor response is recoverable but repeated disrespect ends the route',()=>{
 const s=G.create('grinder');outing(s);G.answer(s,1);assert.equal(s.loveFailed,false);assert.equal(s.love,0);
 for(let i=0;i<2;i++){s.day=s.romance.nextDay;s.clock=600;outing(s);G.answer(s,1);}
 assert.equal(s.loveFailed,true);assert.equal(s.romance.mistakes,3);assert.equal(R.offer(s),false);
});
test('daily contact consumes resources, observes obligations and cannot rush the next story event',()=>{
 const s=G.create('grinder');s.love=1;s.romance.nextDay=5;const before=s.clock;G.contactLove(s,'walk');
 assert.equal(s.clock,before+60);assert.equal(s.money,1792);assert.equal(s.stamina,92);assert.equal(s.romance.nextDay,5);assert.equal(s.world.dm['小凛'].at(-1).id,'小凛');assert.equal(s.romance.trust,2);assert.ok(!s.chat.some(m=>m.id==='小凛'));assert.throws(()=>G.contactLove(s,'chat'));
 assert.ok(G.validate(G.migrate(JSON.parse(JSON.stringify(s)))));
 const student=G.create();student.love=1;student.day=2;student.clock=535;const saved=JSON.stringify(student);assert.throws(()=>G.contactLove(student,'chat'));assert.equal(JSON.stringify(student),saved);
});
test('legacy relationship chapters migrate once without resetting existing endings',()=>{
 for(const [old,current] of [[0,0],[1,1],[2,3],[3,5],[4,8]]){const s=G.create();delete s.romance;s.love=old;if(old===4){s.ending='love';s.phase='ending';}const m=G.migrate(s);assert.equal(m.love,current);assert.equal(G.migrate(m).love,current);assert.ok(G.validate(m));}
 const s=G.create();s.romance.memories=[{stage:99,day:1,ok:true,text:'bad'}];assert.equal(G.validate(s),false);
});
test('exploration stops discovering arcades after five distinct locations',()=>{
 const s=G.create('grinder',42);s.city.arcades=[0,1,2,3,4];s.loveFailed=true;s.money=10000;
 for(let i=0;i<100;i++){s.clock=480;s.stamina=100;s.world.notice=null;G.explore(s,'stroll');assert.equal(s.city.arcades.length,G.ARCADE_LIMIT);}
 assert.equal(G.unlockedArcades(s).length,5);assert.ok(!s.logs.some(l=>l.text.includes('发现新机厅')));assert.ok(!s.chat.some(m=>m.text.includes('散步发现了')));s.city.arcades.push(5);assert.equal(G.validate(s),false);
});
