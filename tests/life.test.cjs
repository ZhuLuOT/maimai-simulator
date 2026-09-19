const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const G=require('../engine'),X=require('../systems'),ctx={window:{}};vm.runInNewContext(fs.readFileSync(require.resolve('../data/music.js'),'utf8'),ctx);const pool=G.charts(ctx.window.MUSIC_DATA);
function ready(seed=42){const s=G.create('grinder',seed);s.clock=600;s.people=18;G.startTrip(s);G.setMode(s,'pair');G.travel(s,'bike',1);G.drink(s,'water');if(s.queueUntil>s.clock)G.waitQueue(s);return s;}

test('large direct talent bonuses retain two points at low skill and cannot be claimed twice',()=>{
 for(const [id,skills] of [['reader',['reading']],['dragon',['star','key','reading']],['key',['key']],['star',['star']],['slide',['star']],['speed',['key']]]){
  const s=G.create(),before={...s.skills};G.grantTalent(s,id);G.grantTalent(s,id);
  for(const skill of ['star','key','reading'])assert.equal(s.skills[skill],before[skill]+(skills.includes(skill)?2:0),id+' '+skill);
  const restored=G.migrate(structuredClone(s));assert.deepEqual(restored.skills,s.skills);assert.ok(G.validate(restored));
 }
});

test('permanent talent gains decay continuously per skill and logs show actual awards',()=>{
 for(const [skill,gain] of [[8,2],[10,2],[11,1.5],[12,1],[13,.5],[13.6,.3298769777],[14,.25],[15,.125],[20,.00390625],[22,0]]){
  const s=G.create();s.skills={star:skill,key:skill,reading:skill};const before=JSON.stringify(s),preview=G.talentGains(s,'foundation');
  assert.equal(JSON.stringify(s),before);assert.ok(Math.abs(preview.key-gain)<1e-9);
  G.grantTalent(s,'foundation');for(const k of ['star','key','reading'])assert.ok(Math.abs(s.skills[k]-skill-gain)<1e-9);
  assert.match(s.logs[0].text,/获得词条「基本功扎实」：星星力/);assert.doesNotMatch(s.logs[0].text,/最高|B35/);
 }
 const split=G.create();split.skills={star:10,key:12,reading:13};G.grantTalent(split,'expert');assert.deepEqual(split.skills,{star:12,key:13,reading:13.5});assert.match(split.logs[0].text,/星星力 \+2\.00 · 键盘力 \+1\.00 · 读谱力 \+0\.50/);
 for(const id of ['transfer','musician','dragon','foundation','expert','reader','key','star','slide','reading','speed']){
  const s=G.create();s.skills={star:15,key:15,reading:15};const gains=G.talentGains(s,id);assert.ok(Object.keys(gains).length);
  G.grantTalent(s,id);for(const k of ['star','key','reading'])assert.equal(s.skills[k],15+(gains[k]||0));assert.ok(Object.values(gains).every(n=>n<=.1875));
 }
 const capped=G.create();capped.skills={star:21.9999,key:22,reading:13};G.grantTalent(capped,'foundation');assert.equal(capped.skills.star,22);assert.equal(capped.skills.key,22);
 for(const boundary of [10,12,13]){const s=G.create();s.skills.key=boundary-.000001;const below=G.talentGains(s,'key').key;s.skills.key=boundary+.000001;const above=G.talentGains(s,'key').key;assert.ok(below>=above&&below-above<.00001);}
});

test('stacked milestones cannot raise 13.6 skill by whole levels and never regrant on reload',()=>{
 const s=G.create();s.skills={star:13.6,key:13.6,reading:13.6};
 let priorGain=Infinity;for(const id of ['foundation','key','speed','expert']){const before=s.skills.key;G.grantTalent(s,id);const gain=s.skills.key-before;assert.ok(gain<priorGain);priorGain=gain;}
 assert.ok(s.skills.key>14&&s.skills.key<14.7);const snapshot=structuredClone(s.skills);G.migrate(s);for(const id of s.talents.slice())G.grantTalent(s,id);assert.deepEqual(s.skills,snapshot);assert.ok(G.validate(s));
 const legacy=G.create();legacy.skills={star:20,key:20,reading:20};legacy.talents=['foundation'];G.migrate(legacy);assert.equal(legacy.skills.key,20);G.grantTalent(legacy,'key');assert.ok(legacy.skills.key>20&&legacy.skills.key<20.01);
});

test('star and keyboard milestones use 500 historical non-utage plays strictly above displayed level 12',()=>{
 for(const tendency of ['star','key']){
  const s=ready();G.setMode(s,'solo');
  const chart=pool.find(c=>c.tendency===tendency&&c.level==='12+'&&!G.isUtage(c));
  const easy=pool.find(c=>c.tendency===tendency&&c.level==='12'&&c.ds>12&&!G.isUtage(c)),lower=pool.find(c=>c.tendency===tendency&&c.level==='11+'&&!G.isUtage(c));
  const utage={...chart,id:'900003',title:'[宴] test',utage:true};
  for(const c of [chart,easy,lower,utage]){s.records[G.key(c)]={...c,achievement:99,ra:G.isUtage(c)?0:G.chartRating(c.ds,99)};s.practice[G.key(c)]=c===chart?499:1000;}
  s.metrics[tendency]=3499;
  const restored=G.migrate(structuredClone(s));assert.ok(G.validate(restored));X.afterPlay(restored,[]);assert.ok(!restored.talents.includes(tendency));
  if(restored.queueUntil>restored.clock)G.waitQueue(restored);
  G.play(restored,[easy,easy,easy],pool);assert.ok(!restored.talents.includes(tendency));
  if(restored.queueUntil>restored.clock)G.waitQueue(restored);
  restored.stamina=restored.maxStamina;G.play(restored,[chart,easy,easy],pool);
  assert.equal(restored.practice[G.key(chart)],500);assert.ok(restored.talents.includes(tendency));
  const skills={...restored.skills};X.afterPlay(restored,[]);assert.deepEqual(restored.skills,skills);
  assert.ok(G.validate(G.migrate(structuredClone(restored))));
 }
});
test('three unique initial talents; second-run dragon; setup locks career and applies once',()=>{for(let seed=0;seed<50;seed++){const s=G.create('student',seed),a=G.drawTalents(s,1);assert.equal(new Set(a).size,3);assert.ok(!a.includes('dragon'));}assert.ok(Array.from({length:100},(_,i)=>G.drawTalents(G.create('student',i),2)).flat().includes('dragon'));const s=G.create();G.setup(s,{name:'小林',id:'林DX',talent:'rich',offers:['rich','reader','steady']});assert.equal(s.money,2800);assert.equal(s.profile.id,'林DX');assert.throws(()=>G.setup(s,{name:'x',id:'x',talent:'rich',offers:['rich']}));});
test('durability and stamina block play without spending; refill and rest recover',()=>{const s=ready(),money=s.money,clock=s.clock;s.gloves.durability=0;assert.throws(()=>G.play(s,pool.slice(0,2),pool),/手套/);assert.equal(s.money,money);assert.equal(s.clock,clock);G.buyGloves(s,'sport');s.stamina=0;assert.throws(()=>G.play(s,pool.slice(0,2),pool),/体力/);assert.throws(()=>G.arcadeRest(s),/移除/);s.queueUntil=s.clock+40;G.waitQueue(s);assert.equal(s.stamina,14);G.consumeDrink(s,s.liquid);G.refill(s,'water');assert.equal(s.liquid,1000);assert.equal(s.clock,clock+45);});
test('each PC consumes four tracks of drink, stamina and gloves, then requires an explicit queue only once',()=>{const s=ready();s.people=20;const before={clock:s.clock,stamina:s.stamina,gloves:s.gloves.durability};G.play(s,pool.slice(0,2),pool);assert.equal(s.clock,before.clock+16);assert.equal(s.liquid,760);assert.ok(s.stamina<before.stamina);assert.ok(s.gloves.durability<before.gloves);assert.ok(s.queueUntil>s.clock);const until=s.queueUntil;assert.throws(()=>G.play(s,pool.slice(0,2),pool),/排队/);G.waitQueue(s);assert.equal(s.clock,until);const start=s.clock;G.play(s,pool.slice(0,2),pool);assert.equal(s.clock,start+16);});
test('rest overlaps queue instead of adding its full length twice; leaving does not require waiting',()=>{const s=ready();s.queueUntil=s.clock+40;const before=s.clock;G.refill(s,'water');G.waitQueue(s);assert.equal(s.clock,before+40);s.queueUntil=s.clock+120;G.finishPlay(s);G.meal(s,'home');assert.equal(s.clock,before+40+15+28);});
test('crowd depends on morning, mealtimes and evening, and reading never rerolls population',()=>{const s=G.create();s.people=10;s.clock=630;const morning=G.peopleAt(s);s.clock=900;const afternoon=G.peopleAt(s);s.clock=1200;const evening=G.peopleAt(s);s.clock=750;assert.ok(G.peopleAt(s)<afternoon);assert.ok(morning<afternoon&&afternoon<evening);const seed=s.seed;assert.equal(G.peopleAt(s),G.peopleAt(s));assert.equal(s.seed,seed);});
test('NPCs retain 30 unique identities, grow with elapsed time and choose their own difficulty',()=>{const s=ready(),ids=s.npcs.map(n=>n.id),ratings=s.npcs.map(n=>n.rating);assert.equal(new Set(ids).size,30);s.clock+=180;X.tick(s);assert.deepEqual(s.npcs.map(n=>n.id),ids);assert.ok(s.npcs.some((n,i)=>n.rating>ratings[i]));s.partner=0;s.npcs[0].rating=8000;const easy=X.partnerCharts(s,pool,100);s.npcs[0].rating=16000;const hard=X.partnerCharts(s,pool,100);assert.ok(easy.every(c=>c.ds<8));assert.ok(hard.every(c=>c.ds>13));});
test('chat pool is stable until time advances; send costs time, increases familiarity with daily cap and saves safely',()=>{const s=G.create('grinder',42);G.chatOpen(s);assert.equal(s.chat.length,2);const seed=s.seed;G.chatOpen(s);assert.equal(s.seed,seed);const id=s.npcs[0].id;for(let i=0;i<7;i++)G.chatSend(s,'一起打吗？');assert.equal(s.clock,515);assert.equal(s.npcs[0].familiarity,20);const copy=G.migrate(JSON.parse(JSON.stringify(s)));assert.ok(G.validate(copy));assert.equal(copy.npcs[0].id,id);assert.equal(copy.chat.findLast(m=>m.self).text,'一起打吗？');});
test('familiar partners sometimes let player choose three; four simultaneous results remain',()=>{const s=ready();s.npcs.forEach(n=>n.familiarity=100);for(let i=0;i<100&&!s.friendship;i++)X.choosePartner(s);assert.equal(G.selectCount(s),3);const out=G.play(s,pool.slice(0,3),pool);assert.equal(out.results.length,4);assert.equal(out.results.filter(c=>c.partner).length,1);assert.ok(out.partnerName);});
test('condition, hydration, stamina and reading modify expected score in the right directions',()=>{const s=ready(),c=pool.find(c=>c.ds===12);s.condition=2;s.stamina=100;s.liquid=600;const normal=G.expected(s,c);s.condition=0;assert.ok(G.expected(s,c)<normal);s.condition=4;assert.ok(G.expected(s,c)>normal);s.condition=2;s.stamina=20;assert.ok(G.expected(s,c)<normal);s.stamina=100;s.liquid=0;assert.ok(G.expected(s,c)<normal);s.liquid=600;s.skills.reading+=4;assert.ok(G.expected(s,c)>normal);s.practice[G.key(c)]=2;const repeat=G.expected(s,c);s.skills.reading-=4;assert.ok(G.expected(s,c)<repeat);G.grantTalent(s,'steady');s.mood=0;for(let i=0;i<100;i++){X.rollCondition(s);assert.notEqual(s.condition,0);}});
test('talent buffs apply once, later milestones and instinct have gameplay effects',()=>{const s=ready();const key=s.skills.key;G.grantTalent(s,'key');G.grantTalent(s,'key');assert.equal(s.skills.key,key+2);s.tracks=250;X.afterPlay(s,[]);assert.ok(s.talents.includes('instinct'));const c=pool.find(c=>c.ds===12);const before=G.ability(s,c);s.instinct=true;assert.ok(G.ability(s,c)>before);});
test('fitted tags enforce source agreement, sample size and delta; Umiyuri MASTER is star',()=>{assert.equal(pool.find(c=>c.id==='417'&&c.index===3).tendency,'star');for(const c of pool.filter(c=>c.tag)){assert.ok(c.samples>=100);assert.equal(c.comparison,c.ds);assert.ok(c.tag==='ghost'?c.fit-c.ds>=.2999:c.fit-c.ds<=-.2999);}assert.ok(pool.some(c=>c.tag==='ghost'));assert.ok(pool.some(c=>c.tag==='easy'));});
test('version plates require every chart, not rating or one high score; ReMASTER excluded and no nonexistent Shin Shou',()=>{const s=G.create(),charts=pool.filter(c=>['maimai','maimai PLUS'].includes(c.version)&&c.index<4&&c.type==='SD'&&c.title!=='ジングルベル');assert.ok(!G.plates(s,pool).find(p=>p.id==='真极').unlocked);for(const c of charts)s.records[G.key(c)]={...c,achievement:100,bestCombo:'FC'};assert.ok(G.plates(s,pool).find(p=>p.id==='真极').unlocked);assert.ok(!G.plates(s,pool).find(p=>p.id==='真将'));assert.ok(!G.plates(s,pool).find(p=>p.id==='真神').unlocked);});
test('v2 saves acquire all new systems without losing money, identity, best records or active trip',()=>{const s=ready(),money=s.money;for(const field of ['npcs','talents','profile','stamina','maxStamina','gloves','liquid','bottles','nutrition','mealBreak','condition','metrics','chat','setupDone'])delete s[field];delete s.skills.reading;const migrated=G.migrate(JSON.parse(JSON.stringify(s)));assert.ok(G.validate(migrated));assert.equal(migrated.money,money);assert.equal(migrated.phase,'play');assert.equal(migrated.npcs.length,30);assert.ok(migrated.setupDone);});
test('old paired session gets a partner on migration, old combo still counts and invalid system data is rejected',()=>{const s=ready();delete s.npcs;delete s.partner;const c=pool[0];s.records[G.key(c)]={...c,achievement:100,ra:100,combo:'FC'};const restored=G.migrate(JSON.parse(JSON.stringify(s)));assert.ok(G.validate(restored));assert.ok(Number.isInteger(restored.partner));assert.equal(restored.records[G.key(c)].bestCombo,'FC');G.play(restored,pool.slice(0,2),pool);const invalid=JSON.parse(JSON.stringify(restored));invalid.profile.plate='invalid';assert.ok(!G.validate(invalid));invalid.profile.plate='default';invalid.metrics.star=-1;assert.ok(!G.validate(invalid));});
