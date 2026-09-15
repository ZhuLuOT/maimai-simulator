const test=require('node:test'),assert=require('node:assert/strict'),G=require('../engine');
const options={name:'',id:'',talent:'rich',offers:['rich','reader','steady']};
test('opening story is stored in the group chat once, resumes after reload and grants no chat rewards',()=>{
 const s=G.create();G.setup(s,options);const before=[s.clock,s.money,s.chatCount,s.npcs[0].familiarity];
 assert.equal(G.postIntro(s),true);assert.equal(s.chat.length,5);assert.equal(s.chat[0].id,'逃遁');assert.equal(s.chat[2].id,'鲁米诺');assert.ok(s.chat[1].self);assert.equal(G.postIntro(s),false);
 const restored=G.migrate(JSON.parse(JSON.stringify(s)));assert.equal(G.postIntro(restored),false);restored.guide.step=1;G.postIntro(restored);restored.guide.step=2;G.postIntro(restored);assert.equal(restored.chat.length,13);restored.guide.introDone=true;assert.equal(G.postIntro(restored),false);
 assert.deepEqual([restored.clock,restored.money,restored.chatCount,restored.npcs[0].familiarity],before);assert.equal(restored.guide.chatted,false);assert.ok(G.validate(restored));const chat=JSON.stringify(restored.chat);G.introMessages(restored);assert.equal(JSON.stringify(restored.chat),chat);
});
test('starting play styles balance star and key, stack with talents once and survive save migration',()=>{
 const outer=G.create(),inner=G.create();G.setup(outer,{...options,playStyle:'outer'});G.setup(inner,{...options,playStyle:'inner'});
 assert.ok(Math.abs(outer.skills.key-inner.skills.key-.8)<1e-9);assert.ok(Math.abs(inner.skills.star-outer.skills.star-.8)<1e-9);assert.equal(outer.skills.reading,inner.skills.reading);assert.equal(outer.guide.introDone,false);assert.equal(outer.money,2800);
 assert.throws(()=>G.setup(outer,{...options,playStyle:'inner'}));const m=G.migrate(JSON.parse(JSON.stringify(outer)));assert.deepEqual(m.skills,outer.skills);assert.ok(G.validate(m));
 const legacy=G.create();delete legacy.guide;delete legacy.playStyle;delete legacy.roundReview;legacy.skills.key=15;G.migrate(legacy);assert.equal(legacy.playStyle,'balanced');assert.equal(legacy.skills.key,15);assert.equal(legacy.guide.introDone,true);
});
test('small goals use actual progress, reward once and cannot be claimed during an outing',()=>{
 const s=G.create('grinder');assert.throws(()=>G.claimGoal(s,'first-pc'));const money=s.money;s.credits=1;G.claimGoal(s,'first-pc');assert.equal(s.money,money+30);assert.throws(()=>G.claimGoal(s,'first-pc'));assert.ok(G.validate(G.migrate(JSON.parse(JSON.stringify(s)))));
 assert.equal(G.goals(s).find(g=>g.id==='social').done,false);G.chatSend(s,'机厅见');assert.equal(G.goals(s).find(g=>g.id==='social').done,true);G.startTrip(s);assert.throws(()=>G.claimGoal(s,'social'));assert.equal(s.guide.claimed.length,1);
 const bad=G.create();bad.guide.claimed=['fake'];assert.equal(G.validate(bad),false);
});
test('short meals retain price and recovery and only consume their duration plus real return travel',()=>{
 const s=G.create('grinder');G.startTrip(s);G.travel(s,'bike',0);G.drink(s,'water');G.finishPlay(s);s.stamina=10;const clock=s.clock,back=s.trip.returnTime,money=s.money;G.meal(s,'noodles');assert.equal(s.clock,clock+15+back);assert.equal(s.money,money-15);assert.equal(s.stamina,50);assert.equal(G.MEALS.find(x=>x.id==='hotpot').time,35);
});
