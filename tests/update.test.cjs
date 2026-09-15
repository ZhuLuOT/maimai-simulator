const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),G=require('../engine'),M=require('../gameplay');
const ctx={window:{}};vm.runInNewContext(fs.readFileSync(require.resolve('../data/music.js'),'utf8'),ctx);const pool=G.charts(ctx.window.MUSIC_DATA);
function arrive(){const s=G.create('grinder',42);G.startTrip(s);G.travel(s,'bike',0);G.drink(s,'water');if(s.queueUntil>s.clock)G.waitQueue(s);return s;}
test('stamina cost grows with difficulty and note volume; only waiting, meals and sleep recover',()=>{const s=arrive(),c=pool.find(c=>c.ds===12);assert.ok(G.staminaCost(s,{...c,ds:14})>G.staminaCost(s,c));assert.ok(G.staminaCost(s,{...c,notes:c.notes.map(n=>n*2)})>G.staminaCost(s,c));assert.throws(()=>G.arcadeRest(s),/移除/);s.stamina=40;const before=s.clock;G.waitQueue(s);assert.equal(s.clock,before+15);assert.equal(s.stamina,45.25);G.finishPlay(s);assert.ok(!G.canSkipMeal(s));G.meal(s,'home');assert.equal(s.stamina,75.25);G.daily(s,'fun');assert.equal(s.stamina,75.25);G.watchVideos(s);assert.equal(s.stamina,75.25);});
test('skipping meals requires off-mealtime, little exertion and sufficient remaining stamina',()=>{for(const clock of [630,750,930,1080]){const s=arrive();s.clock=clock;G.finishPlay(s);const eligible=clock===630||clock===930;assert.equal(G.canSkipMeal(s),eligible);if(eligible){const before=s.clock;G.meal(s,'skip');assert.equal(s.clock,before+18);assert.equal(s.stamina,100);}else assert.throws(()=>G.meal(s,'skip'),/饭点/);}const s=arrive();s.trip.staminaSpent=25;G.finishPlay(s);assert.ok(!G.canSkipMeal(s));});
test('tag restrictions apply to BASIC, ADVANCED and all constants below 10',()=>{assert.ok(pool.filter(c=>c.index===0||c.ds<10).every(c=>!c.tag));assert.ok(pool.filter(c=>c.index===1).every(c=>c.tag!=='easy'));assert.ok(pool.some(c=>c.tag==='ghost'));assert.ok(pool.some(c=>c.tag==='easy'));});
test('ghost fit difficulty, first-play penalty, video understanding and growth are chart-specific',()=>{const s=G.create(),c=pool.find(c=>c.tag==='ghost'&&c.tendency==='star'),k=pool.find(c=>c.tag==='ghost'&&c.tendency==='key');assert.equal(G.effectiveDifficulty(s,c),c.fit);assert.equal(G.scoreAdjustment(s,c),-.45);s.learning[G.key(c)]='partial';assert.equal(G.scoreAdjustment(s,c),0);assert.equal(G.effectiveDifficulty(s,c),c.fit);s.learning[G.key(c)]='clear';assert.equal(G.effectiveDifficulty(s,c),c.ds);s.learning[G.key(k)]='clear';assert.equal(G.effectiveDifficulty(s,k),Math.floor((k.ds+k.fit)*5)/10);s.videoEvent={key:G.key(c),outcome:'partial'};G.learnVideo(s);assert.equal(s.learning[G.key(c)],'clear');assert.equal(G.growthMultiplier(c),1.3);const easy=pool.find(c=>c.tag==='easy');s.rating=easy.ds*1110;assert.equal(G.growthMultiplier(easy,s),.7);assert.equal(G.scoreAdjustment(s,easy),.16);assert.ok(G.validate(G.migrate(JSON.parse(JSON.stringify(s)))));});
test('easy effects require comparable Rating while the searchable tag remains unchanged',()=>{
 const s=G.create(),c={...pool.find(c=>c.tag==='easy'),ds:13};
 for(const [rating,active] of [[0,false],[1110*11.99,false],[1110*12,true],[1110*13,true],[1110*14,true],[1110*14.01,false]]){
  s.rating=rating;assert.equal(G.scoreAdjustment(s,c),active?.16:0);assert.equal(G.growthMultiplier(c,s),active?.7:1);assert.equal(M.tag(c),'easy');assert.equal(c.tag,'easy');
 }
 s.rating=0;s.skills.star=s.skills.key=22;assert.equal(G.scoreAdjustment(s,c),0);
 const ordinary={...c,tag:null};s.rating=14430;assert.equal(G.scoreAdjustment(s,ordinary),0);assert.equal(G.growthMultiplier(ordinary,s),1);
 const ghost={...c,tag:'ghost'};s.rating=0;assert.equal(G.scoreAdjustment(s,ghost),-.45);assert.equal(G.growthMultiplier(ghost,s),1.3);
});
test('video feed selects comparable ghost charts; both outcomes occur and pending choice prevents other actions',()=>{const outcomes=new Set();for(let seed=0;seed<100;seed++){const s=G.create('grinder',seed);s.skills.star=s.skills.key=s.skills.reading=12;G.watchVideos(s);assert.equal(s.clock,510);if(!s.videoEvent)continue;const c=pool.find(c=>G.key(c)===s.videoEvent.key);assert.equal(c.tag,'ghost');assert.ok(Math.abs(c.ds-G.ability(s,c))<=1.1);outcomes.add(s.videoEvent.outcome);assert.throws(()=>G.daily(s,'work'));assert.ok(G.validate(G.migrate(JSON.parse(JSON.stringify(s)))));G.learnVideo(s);assert.equal(s.videoEvent,null);}assert.deepEqual([...outcomes].sort(),['clear','partial']);});
test('bot help and first lookup are free; repeat crowd lookup costs two minutes; messages survive reload',()=>{const s=arrive();G.play(s,G.recommend(s,pool),pool);G.finishPlay(s);G.meal(s,'home');const clock=s.clock,familiarity=s.npcs[0].familiarity;G.chatSend(s,'@bot');assert.match(s.chat.at(-1).text,/快捷指令/);G.chatSend(s,'jk');assert.ok(s.chat.at(-1).text.includes(`${G.peopleAt(s,0)} 人`));G.chatSend(s,'几卡');G.chatSend(s,'B50');const snap=s.chat.at(-1).b50;assert.equal(snap.old.length+snap.fresh.length,3);assert.equal(snap.rating,s.rating);assert.equal(s.clock,clock+2);assert.equal(s.npcs[0].familiarity,familiarity);s.rating++;assert.notEqual(snap.rating,s.rating);assert.ok(G.validate(G.migrate(JSON.parse(JSON.stringify(s)))));});
test('NPC preferences persist, choose some challenging charts and celebrate actual simulated scores',()=>{const s=arrive(),n=s.npcs[0];n.rating=14000;n.genre=pool.find(c=>c.ds===13).genre;n.tendency='star';const picks=M.choose(n,s,300);assert.ok(picks.some(c=>c.ds>n.rating/1110+.5));assert.ok(picks.some(c=>c.genre===n.genre));for(let i=0;i<10;i++)M.npcTick(s,20);assert.ok(s.chat.some(m=>m.text.includes('今天推上去了')));assert.ok(s.chat.some(m=>/恭喜|太强|好成绩/.test(m.text)));const restored=G.migrate(JSON.parse(JSON.stringify(s)));assert.equal(restored.npcs[0].genre,n.genre);assert.ok(G.validate(restored));});
test('mainland version metadata and displayed integer-plus levels match the new catalog',()=>{assert.ok(!pool.some(c=>/でらっくす/.test(c.version)));assert.ok(pool.some(c=>c.version==='舞萌DX 2026'));assert.equal(G.displayLevel(12.4),'12');assert.equal(G.displayLevel(12.5),'12');assert.equal(G.displayLevel(12.9),'12+');assert.equal(G.displayLevel(13),'13');});
test('new save fields reject corrupted NPC, video, selection and B50 payloads',()=>{for(const mutate of [s=>{s.npcs[0].risk=Infinity;},s=>{s.videoEvent={key:'missing',outcome:'clear'};},s=>{s.selectedCharts=['../../test'];},s=>{s.chat=[{id:'bot',text:'B50',day:1,time:480,b50:{name:'x',rating:0,day:1,old:[{}],fresh:[]}}];}]){const s=G.create();mutate(s);assert.equal(G.validate(s),false);}});
test('blank identities get defaults while explicit names and length limits are preserved',()=>{
  for(const input of [{},{name:'  ',id:' '},{name:'小林',id:'DX01'}]){
    const s=G.create();G.setup(s,{...input,talent:'steady',offers:['steady']});
    assert.equal(s.profile.name,input.name?.trim()||'神秘人');assert.equal(s.profile.id,input.id?.trim()||'Maimai');assert.ok(G.validate(s));
  }
  assert.throws(()=>G.setup(G.create(),{name:'a'.repeat(17),id:'',talent:'steady',offers:['steady']}),/16/);
});
test('distant bus is faster and cheaper than bike, and quotes equal actual charges and each travel leg',()=>{
  for(const arcade of [1,2]){
    const options=G.transportOptions(arcade),bus=options.find(t=>t.id==='bus'),bike=options.find(t=>t.id==='bike');
    assert.ok(bus.time<bike.time);assert.ok(bus.cost<bike.cost);
    const s=G.create('grinder',42);s.clock=900;const money=s.money;G.startTrip(s);G.travel(s,'bus',arcade);
    assert.equal(s.clock,900+bus.time/2);assert.equal(s.money,money-bus.cost);assert.equal(s.trip.returnTime,bus.time/2);assert.equal(s.trip.cost,bus.cost);
  }
  assert.deepEqual(G.transportOptions(0),G.TRANSPORT);
});
test('milder sleep score penalty is 0.04 per level without altering missed-obligation rules',()=>{
  const s=G.create(),c=pool.find(c=>c.ds===12);s.liquid=600;const score=G.expected(s,c);s.sleepDebt=1;
  assert.ok(Math.abs(score-G.expected(s,c)-.04)<1e-8);s.sleepDebt=4;assert.ok(Math.abs(score-G.expected(s,c)-.16)<1e-8);
});
test('crowded arcades trigger discussion and hesitation once per rising threshold with cooldown and save persistence',()=>{
  const s=G.create('grinder',42);s.clock=900;s.people=6;s.crowdShift=0;M.crowdChat(s);assert.equal(s.chat.length,0);
  s.people=7;M.crowdChat(s);assert.equal(s.chat.length,3);assert.match(s.chat[0].text,/次元空间 · 商场店现在 11 人，大B队来了/);
  assert.equal(s.npcs.filter(n=>n.hesitateUntil===945).length,2);
  const restored=G.migrate(JSON.parse(JSON.stringify(s))),seed=restored.seed;M.crowdChat(restored);assert.equal(restored.chat.length,3);assert.equal(restored.seed,seed);assert.ok(G.validate(restored));
  s.people=6;M.crowdChat(s);s.people=7;s.clock=960;M.crowdChat(s);assert.equal(s.chat.length,3);
  s.people=6;M.crowdChat(s);s.people=7;s.clock=1080;M.crowdChat(s);assert.equal(s.chat.length,3); // Dinner crowd is lower.
  s.clock=1200;M.crowdChat(s);assert.ok(s.chat.length>3);
  s.crowdAlerts[0].last=Infinity;assert.equal(G.validate(s),false);
});
test('boasts require at least 12.4 and strictly over SSS+ or AP; easter egg is exact and free',()=>{
  for(const [ds,achievement,combo,expected] of [[12.3,101,'AP',false],[12.4,100.5,'FC+',false],[12.4,100.5001,'',true],[13,99.99,'FC',false],[13,100.2,'AP',true]]){
    assert.equal(M.canBoast({ds},{achievement,combo}),expected);
  }
  const s=G.create('grinder',42),clock=s.clock;G.chatSend(s,'f8fq');assert.equal(s.chat.at(-1).text,'不要念辣个');assert.equal(s.clock,clock);assert.equal(s.chatCount,0);
  const active=arrive();for(let i=0;i<15;i++)M.npcTick(active,20);
  for(const m of active.chat.filter(m=>m.performance)){assert.ok(M.canBoast(m.performance,m.performance));const c=pool.find(c=>G.key(c)===m.performance.key);assert.equal(m.text,`${c.title} ${m.performance.achievement.toFixed(4)}%${m.performance.combo==='AP'?' AP':''}！今天推上去了！`);}
  assert.ok(G.validate(G.migrate(JSON.parse(JSON.stringify(active)))));
});
const J=require('../judgement');
function perfect(c){const groups=c.notes.map(n=>({critical:n,perfect:0,great:0,good:0,miss:0}));return J.calculate(groups,{critical:c.notes[4],perfect50:0,perfect100:0,great80:0,great60:0,great50:0,good:0,miss:0});}
test('all hidden techniques can fail segments, with exact note totals, BREAK scoring and lost combo',()=>{
  const tags=[...new Set(pool.flatMap(c=>c.tags))].filter(t=>!['星星谱','键盘谱'].includes(t));
  for(const tag of tags){
    const c={...pool.find(c=>c.tags.includes(tag)),tags:[tag]},original=perfect(c);let failed;
    for(let seed=0;seed<100&&!failed;seed++){const s=G.create('grinder',seed);s.seed=Math.imul(seed+1,2654435761)>>>0;s.skills.star=s.skills.key=s.skills.reading=1;const r=J.segment(s,c,original);if(r.segmentEvent&&!r.segmentEvent.passed)failed=r;}
    assert.ok(failed,tag);assert.ok(failed.achievement<original.achievement);assert.equal(failed.combo,'');assert.ok(failed.judgements.miss>0);
    assert.deepEqual(failed.judgementGroups.map(g=>Object.values(g).reduce((a,b)=>a+b,0)),c.notes);
    assert.equal(Object.values(failed.breakJudgements).reduce((a,b)=>a+b,0),c.notes[4]);
    const check=J.calculate(failed.judgementGroups,failed.breakJudgements);assert.equal(failed.achievement,check.achievement);assert.equal(failed.segmentEvent.loss,Number((original.achievement-failed.achievement).toFixed(4)));
    assert.equal(original.achievement,101);assert.equal(original.judgements.miss,0);
  }
});
test('segment frequency is moderate; dismantling responds to star and reading skill, passing changes no judgement',()=>{
  const c={...pool.find(c=>c.tags.includes('拆弹')),tags:['拆弹']},original=perfect(c);let events=0,lowPass=0,starPass=0,readingPass=0,highPass=0;
  for(let i=0;i<500;i++){
    const s=G.create('grinder',i);s.seed=Math.imul(i+1,2654435761)>>>0;s.skills={star:c.ds-2,key:c.ds-2,reading:c.ds-2};
    const low=J.segment(structuredClone(s),c,original),star=structuredClone(s),reading=structuredClone(s),high=structuredClone(s);
    star.skills.star+=4;reading.skills.reading+=4;high.skills.star+=4;high.skills.reading+=4;
    if(low.segmentEvent){events++;lowPass+=Number(low.segmentEvent.passed);}
    starPass+=Number(J.segment(star,c,original).segmentEvent?.passed||false);readingPass+=Number(J.segment(reading,c,original).segmentEvent?.passed||false);
    const result=J.segment(high,c,original);if(result.segmentEvent?.passed){highPass++;assert.deepEqual({...result,segmentEvent:undefined},{...original,segmentEvent:undefined});}
    assert.deepEqual(J.segment(structuredClone(s),c,original),low);
  }
  assert.ok(events>150&&events<250);assert.ok(starPass>lowPass);assert.ok(readingPass>lowPass);assert.ok(highPass>starPass&&highPass>readingPass);
  const s=G.create(),seed=s.seed;assert.equal(J.segment(s,{...c,tags:['星星谱']},original),original);assert.equal(s.seed,seed);
});
test('played segment results, best records and event log survive save and reload',()=>{
  const c=pool.find(c=>c.tags.includes('拆弹'));let s;
  for(let seed=1;seed<40;seed++){
    s=arrive();s.seed=Math.imul(seed,2654435761)>>>0;s.skills.star=s.skills.key=s.skills.reading=1;
    G.play(s,[c,c,c],pool);if(s.last.results.some(r=>r.segmentEvent&&!r.segmentEvent.passed))break;
  }
  assert.ok(s.last.results.some(r=>r.segmentEvent&&!r.segmentEvent.passed));const restored=G.migrate(JSON.parse(JSON.stringify(s)));assert.ok(G.validate(restored));assert.deepEqual(restored.last,s.last);
  assert.ok(s.logs.some(l=>l.text.includes('段落坠机')));
});
