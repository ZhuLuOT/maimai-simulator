const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),G=require('../engine'),X=require('../systems');
const ctx={window:{}};vm.runInNewContext(fs.readFileSync(require.resolve('../data/music.js'),'utf8'),ctx);const pool=G.charts(ctx.window.MUSIC_DATA);
function ready(pair=false){const s=G.create('grinder',42);s.people=18;G.startTrip(s);if(pair)G.setMode(s,'pair');G.travel(s,'bike',0);G.drink(s,'water');if(s.queueUntil>s.clock)G.waitQueue(s);return s;}
test('official displayed level differs from constant; capped Rating still preserves higher achievement',()=>{
 const rush=pool.find(c=>c.id==='11657'&&c.index===2);assert.equal(rush.ds,12.5);assert.equal(G.displayLevel(rush),'12');
 assert.equal(G.displayLevel(pool.find(c=>c.title==='ATLAS RUSH'&&c.index===2)),'12+');
 assert.equal(G.chartRating(14.9,100.4999),332);assert.equal(G.coefficient(99.9999),21.4);assert.equal(G.coefficient(79.9999),12.8);assert.equal(G.chartRating(14.9,0),0);assert.equal(G.coefficient(40),6.4);assert.equal(G.chartRating(14.9,100.5),335);assert.equal(G.chartRating(14.9,101),335);assert.ok(G.chartRating(14.9,100.4998)<335);
 const s=G.create();s.records[G.key(rush)]={...rush,achievement:100.9876,ra:G.chartRating(rush.ds,100.9876)};G.recalculate(s);assert.equal(s.records[G.key(rush)].achievement,100.9876);
});
test('empty arcade cannot summon a partner, stale saves clear them, waiting can match real arrivals',()=>{
 const s=ready(true);assert.notEqual(s.partner,null);G.preparePartner(s,pool);s.people=0;s.crowdShift=0;
 assert.throws(()=>G.setMode(s,'pair'),/暂无/);assert.deepEqual(G.preparePartner(s,pool),[]);const before=[s.clock,s.money,s.credits];
 assert.throws(()=>G.play(s,pool.slice(0,2),pool),/没有可拼机/);assert.deepEqual([s.clock,s.money,s.credits],before);
 G.migrate(s);assert.equal(s.partner,null);assert.equal(s.partnerSongs,null);
 G.waitQueue(s);assert.equal(s.partner,null);s.people=18;G.waitQueue(s);assert.notEqual(s.partner,null);assert.equal(G.preparePartner(s,pool).length,2);
 G.setMode(s,'solo');assert.equal(s.partner,null);assert.equal(G.play(s,pool.slice(0,3),pool).results.length,3);
});
test('fortune is stable per day, lookup counters share aliases, tarot advances time and respects school',()=>{
 const s=G.create('grinder',42),start=s.clock;G.chatSend(s,'运势');const text=s.chat.at(-1).text;G.chatSend(s,'jrrp');assert.equal(s.chat.at(-1).text,text);
 G.chatSend(s,'B50');G.chatSend(s,'jk');assert.equal(s.clock,start);G.chatSend(s,'几卡');G.chatSend(s,'b50');assert.equal(s.clock,start+4);
 G.chatSend(s,'@bot tarot');assert.ok([start+6,start+7].includes(s.clock));assert.ok(s.chat.at(-1).text.includes('耗时 '+(s.clock-start-4)+' 分钟'));assert.equal(s.chatCount,0);assert.ok(G.validate(G.migrate(JSON.parse(JSON.stringify(s)))));
 s.clock=1380;G.sleep(s);const morning=s.clock;G.chatSend(s,'jk');G.chatSend(s,'B50');assert.equal(s.clock,morning);assert.equal(s.botUsage.tarot,0);
 const school=G.create('student');school.day=2;school.clock=539;const count=school.chat.length;assert.throws(()=>G.chatSend(school,'塔罗'));assert.equal(school.clock,539);assert.equal(school.chat.length,count);
});
test('Guangzhou outings discover persistent venues, restaurants and an actionable encounter',()=>{
 const kinds=new Set();let discovered;
 for(let seed=1;seed<160&&kinds.size<3;seed++){const s=G.create('grinder',seed);G.explore(s,'stroll');assert.equal(s.clock,570);assert.equal(s.stamina,90);
 if(s.city.encounter){kinds.add('love');assert.throws(()=>G.explore(s,'movie'));G.answerEncounter(s,0);assert.equal(s.love,1);assert.equal(s.clock,580);}
 if(s.city.arcades.length===4){kinds.add('arcade');assert.ok(s.chat.some(m=>m.text.includes('新店')));const saved=G.migrate(JSON.parse(JSON.stringify(s)));assert.equal(G.unlockedArcades(saved).length,4);saved.world.notice=null;G.startTrip(saved);G.travel(saved,'bus',3);assert.equal(saved.arcade,3);assert.equal(saved.collection.distanceKm,7.6);}
 if(s.city.restaurants.length){kinds.add('food');discovered=s;}assert.ok(G.validate(G.migrate(JSON.parse(JSON.stringify(s)))));
 }
 assert.equal(kinds.size,3);const s=discovered;s.world.notice=null;G.startTrip(s);G.travel(s,'bike',0);G.drink(s,'water');G.finishPlay(s);const food=G.mealOptions(s).find(m=>m.id===s.city.restaurants[0]);const money=s.money;G.meal(s,food.id);assert.equal(s.money,money-food.cost);assert.equal(G.foodBonus(s),food.buff);s.clock+=241;assert.equal(G.foodBonus(s),0);
 const locked=G.create();G.startTrip(locked);assert.throws(()=>G.travel(locked,'bus',3));
});
test('nonwalking entertainment does not restore stamina; outings respect money, time and endings',()=>{
 const s=G.create('grinder');s.stamina=40;G.explore(s,'movie');assert.equal(s.stamina,40);assert.equal(s.money,1762);
 s.stamina=0;assert.throws(()=>G.explore(s,'yuexiu'));s.money=0;assert.throws(()=>G.explore(s,'movie'));
 const late=G.create('grinder');late.day=122;late.clock=1380;const cash=late.money;G.explore(late,'stroll');assert.equal(late.ending,'ordinary');assert.equal(late.city.walks,0);assert.equal(late.money,cash-25);
});
test('sync awards use both combo results and relative difficulty; best sync survives a solo new best',()=>{
 for(const [a,b,notHigher,want] of [['','AP',true,'sync'],['FC','FC',false,'fs'],['FC','FC',true,'fsp'],['FC+','AP',true,'fsd'],['AP','AP',true,'fsdp']])assert.equal(G.syncBadge({combo:a,index:3},{combo:b,index:notHigher?3:2}),want);
 const s=ready(),c=pool[0];s.records[G.key(c)]={...c,achievement:0,ra:0,bestSync:'fsdp'};G.play(s,[c,c,c],pool);assert.equal(s.records[G.key(c)].bestSync,'fsdp');
 const item={id:'custom',kind:'plate',category:'song',description:'同步',required:[{fs:'fsd',songs:[{id:c.id}],difficulties:[c.index]}]};
 assert.ok(G.collectionProgress(s,item,pool).unlocked);item.required[0].fs='unknown';assert.ok(!G.collectionProgress(s,item,pool).unlocked);
});

test('all sync tiers use this track combo and chart color, independent of level and achievement',()=>{
 const combos=['','FC','FC+','AP','AP+'];
 const eligible=[['sync','sync','sync','sync','sync'],['sync','fsp','fsp','fsp','fsp'],['sync','fsp','fsd','fsd','fsd'],['sync','fsp','fsd','fsdp','fsdp'],['sync','fsp','fsd','fsdp','fsdp']];
 for(let a=0;a<5;a++)for(let b=0;b<5;b++)for(let ours=0;ours<5;ours++)for(let theirs=0;theirs<5;theirs++){
  const left={id:'song',index:ours,combo:combos[a],achievement:100.5,ds:15,level:'15'},right={id:'song',index:theirs,combo:combos[b],achievement:99.5,ds:1,level:'1'};
  assert.equal(G.syncBadge(left,right),ours>theirs&&a&&b?'fs':eligible[a][b],`${combos[a]} / ${combos[b]} at ${ours} / ${theirs}`);
 }
 const ap={id:'song',type:'SD',index:3,combo:'AP',bestCombo:'AP',bestSync:'fsdp',judgements:{critical:100,perfect:1,great:0,good:0,miss:0}};
 for(const [key,want] of [['miss','sync'],['good','fsp'],['great','fsd']]){
  const current={...ap,judgements:{...ap.judgements,[key]:1}};
  assert.equal(G.syncBadge(ap,current),want);assert.equal(G.syncBadge(current,ap),want);
 }
 assert.equal(G.syncBadge(ap,{...ap,combo:''}),'fsdp');
 assert.equal(G.syncBadge(ap,null),'');assert.equal(G.syncBadge(null,ap),'');
 assert.equal(G.syncBadge(ap,{...ap,id:'another-song'}),'');assert.equal(G.syncBadge(ap,{...ap,type:'DX'}),'');
});

test('repeated partner songs settle against their own slots without overriding our selected tracks',()=>{
 const C=require('../competition'),s=ready(true),song=pool.find(c=>c.index===4),charts=pool.filter(c=>c.id===song.id);
 const npc={id:'test partner',rating:15000,tendency:'key'},expected=charts.slice().sort((a,b)=>Math.abs(a.ds-npc.rating/1110)-Math.abs(b.ds-npc.rating/1110))[0];
 assert.notEqual(expected.index,0);
 const results=[{...song,combo:'AP',partner:false},{...song,combo:'AP',partner:true},{...song,combo:'AP',partner:true}];
 C.paired(s,results,npc,[{id:song.id,index:0},{id:song.id,index:2}],pool);
 assert.deepEqual(results.map(r=>r.opponent.index),[expected.index,0,2]);
 assert.ok(results.slice(1).every(r=>['sync','fs'].includes(r.sync)));
 const solo=[{...song,combo:'AP'}];C.paired(s,solo,null,[],pool);assert.equal(solo[0].sync,undefined);
});
test('paired battle settles four same-difficulty scores and sync records without discarding achievements',()=>{
 const s=ready(true);s.competition.battle=true;const r=G.play(s,G.recommend(s,pool),pool);
 assert.equal(r.results.length,4);for(const c of r.results){assert.equal(c.opponent.index,c.index);assert.ok(c.sync);assert.ok(s.records[G.key(c)].bestSync);}
 assert.equal(s.competition.wins+s.competition.losses+s.competition.draws,1);assert.equal(r.battle.opponent,r.partnerName);assert.ok(G.validate(G.migrate(JSON.parse(JSON.stringify(s)))));
});
test('simulator courses consume actual resources, fail or pass LIFE and unlock true dan plate',()=>{
 for(const skill of [1,22]){const s=ready();s.skills={star:skill,key:skill,reading:skill};const before=[s.clock,s.money,s.credits];G.runCourse(s,1,pool);assert.equal(s.last.results.length,4);assert.equal(s.clock,before[0]+20);assert.equal(s.money,before[1]-12);assert.equal(s.credits,before[2]+1);assert.equal(s.competition.lastCourse.passed,skill===22);assert.equal(G.collectionProgress(s,G.collectionItem('plate-250051'),pool).unlocked,skill===22);assert.ok(G.validate(G.migrate(JSON.parse(JSON.stringify(s)))));}
 const s=ready();s.money=11;const before=s.clock;assert.throws(()=>G.runCourse(s,1,pool));assert.equal(s.clock,before);assert.equal(s.competition.courses.length,0);
});
test('new saved fields reject malformed courses, sync, counters and discoveries; old saves acquire defaults',()=>{
 const old=ready();for(const k of ['city','botUsage','competition'])delete old[k];assert.ok(G.validate(G.migrate(old)));
 for(const change of [s=>s.city.arcades.push(99),s=>s.botUsage.tarot=-1,s=>s.competition.courses=[1,1],s=>s.competition.lastCourse={level:1,life:300,passed:false,day:1},s=>s.competition.last={ours:Infinity},s=>s.records[G.key(pool[0])]={...pool[0],achievement:100,ra:1,bestSync:'bad'}]){const s=G.create();change(s);assert.equal(G.validate(s),false);}
});
test('recommendations include manageable stretch charts, rerolls exclude current songs and stay diverse',()=>{
 const s=G.create('grinder',42);s.skills={star:10,key:10,reading:10};let previous=[],seen=new Set();
 for(let i=0;i<20;i++){const next=G.recommend(s,pool,3,previous);assert.equal(next.length,3);assert.equal(new Set(next.map(c=>c.id)).size,3);assert.ok(next.every(c=>!previous.some(p=>p.id===c.id)&&!G.isUtage(c)));assert.ok(next.some(c=>c.ds>=10.2&&c.ds<=11));assert.ok(next.every(c=>c.ds>=8.5&&c.ds<=11.2));next.forEach(c=>seen.add(c.id));previous=next;}
 assert.ok(seen.size>=25);s.skills.star=s.skills.key=22;assert.ok(G.recommend(s,pool).every(c=>c.ds>=13.5));
});
test('overreach uses pre-play Rating, official levels and at-most-97 achievement',()=>{
 for(const [rating,level] of [[0,'11+'],[9999,'11+'],[10000,'11+'],[11000,'12'],[12000,'13+'],[13000,'14'],[14000,'14+'],[16000,'14+']]){
 const c={title:'test',level,ds:1};assert.ok(G.isOverreach(rating,c,97));assert.ok(G.isOverreach(rating,c,96));assert.ok(!G.isOverreach(rating,c,97.0001));assert.ok(!G.isOverreach(rating,{...c,level:String(parseInt(level)-1)},90));assert.ok(!G.isOverreach(rating,{...c,title:'[宴]test'},90));}
 const rush=pool.find(c=>c.id==='11657'&&c.index===2);assert.ok(G.isOverreach(11000,rush,97));assert.ok(!G.isOverreach(12000,rush,97));
 const s=ready();s.rating=11999;s.skills={star:1,key:1,reading:1};const c=pool.find(c=>c.level==='12');G.play(s,[c,c,c],pool);assert.ok(s.last.results.every(c=>c.overreach&&c.ratingBefore===11999));assert.equal(s.metrics.challenge,3);
});
test('slightly harder charts grant extra growth without rewarding extreme overreach',()=>{
 const s=ready();s.skills={star:10,key:10,reading:10};const c={...pool[0],ds:10,starWeight:1};
 assert.equal(G.growthFactor(s,c),1);assert.ok(G.growthFactor(s,{...c,ds:10.5})>1.3);assert.ok(G.growthFactor(s,{...c,ds:11})>1.2);assert.ok(G.growthFactor(s,{...c,ds:12})<1);
 const actual=pool.find(c=>c.ds===10.5),equal=structuredClone(s),stretch=structuredClone(s);equal.skills={star:10.5,key:10.5,reading:10.5};
 G.play(equal,[actual,actual,actual],pool);G.play(stretch,[actual,actual,actual],pool);
 assert.ok(stretch.skills.star-10>equal.skills.star-10.5);assert.ok(stretch.skills.key-10>equal.skills.key-10.5);
});
test('meal can return to arcade, preserving the visit and supplies while charging food and requeueing',()=>{
 const s=ready(true);G.play(s,G.recommend(s,pool),pool);s.city.restaurants.push('wonton');G.finishPlay(s);
 const before={money:s.money,clock:s.clock,visits:s.visits,km:s.collection.distanceKm,rounds:s.trip.rounds,liquid:s.liquid,gloves:s.gloves.durability,stamina:s.stamina};
 G.meal(s,'wonton','arcade');assert.equal(s.phase,'play');assert.equal(s.money,before.money-24);assert.equal(s.clock,before.clock+30);assert.equal(s.visits,before.visits);assert.equal(s.collection.distanceKm,before.km);assert.equal(s.trip.rounds,before.rounds);assert.equal(s.liquid,before.liquid);assert.equal(s.gloves.durability,before.gloves);assert.equal(s.stamina,Math.min(100,before.stamina+50));assert.equal(G.foodBonus(s),.08);assert.equal(s.queueUntil,s.clock+G.roundInfo(s).queue);assert.ok(G.validate(G.migrate(JSON.parse(JSON.stringify(s)))));
 if(s.queueUntil>s.clock)G.waitQueue(s);G.play(s,G.recommend(s,pool),pool);assert.equal(s.trip.rounds,before.rounds+1);
});
test('returning without food restores no stamina, supports empty arcades, and final home return counts distance once',()=>{
 const s=ready();G.finishPlay(s);s.mode='pair';s.people=0;s.crowdShift=-10;const before=[s.clock,s.money,s.stamina,s.collection.distanceKm,s.visits];G.meal(s,'skip','arcade');
 assert.deepEqual([s.clock,s.money,s.stamina,s.collection.distanceKm,s.visits],before);assert.equal(s.mode,'solo');assert.equal(s.partner,null);assert.equal(s.phase,'play');
 G.finishPlay(s);G.meal(s,'home');assert.equal(s.phase,'home');assert.equal(s.collection.distanceKm,before[3]+G.ARCADE_KM[s.arcade]);G.startTrip(s);assert.equal(s.phase,'travel');
});
test('continuing after a meal rejects closing, obligations, insufficient funds and unresolved events without spending',()=>{
 for(const modify of [s=>s.clock=1400,s=>s.money=20,s=>{s.job='student';s.day=2;s.clock=790;},s=>{s.love=0;s.event=0;}]){
 const s=ready();G.finishPlay(s);modify(s);const before=JSON.stringify(s);assert.throws(()=>G.meal(s,'noodles','arcade'));assert.equal(JSON.stringify(s),before);
 }
 const s=ready();G.finishPlay(s);assert.throws(()=>G.meal(s,'home','arcade'));assert.throws(()=>G.meal(s,'noodles','missing'));
});
