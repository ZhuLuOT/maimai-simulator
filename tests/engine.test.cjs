const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const G=require('../engine.js'),ctx={window:{}};vm.runInNewContext(fs.readFileSync(require.resolve('../data/music.js'),'utf8'),ctx);
const songs=ctx.window.MUSIC_DATA,pool=G.charts(songs);
function care(s){if(s.ending||s.phase!=='home')return;if(s.school.pending)G.teacher(s);if(!s.ending&&G.canEatHome(s,'home'))G.eatHome(s,'home');}
function obligations(s){care(s);while(G.nextObligation(s)&&!s.ending){G.resolveClass(s,G.nextObligation(s).id,true);care(s);}}
function arrive(s,mode='solo'){if(s.clock<G.OPEN)G.advance(s,G.OPEN-s.clock);G.startTrip(s);G.setMode(s,mode);G.travel(s,'bike',1);if(s.bottles.length)G.finishDrinks(s);else G.drink(s,'water');if(s.queueUntil>s.clock)G.waitQueue(s);}
test('calendar starts March 1 and ends June 30 with UTC-stable dates',()=>{
 const s=G.create();assert.equal(G.dateISO(s),'2026-03-01');assert.equal(G.date(s).getUTCDay(),0);s.day=31;assert.equal(G.dateISO(s),'2026-03-31');s.day=122;assert.equal(G.dateISO(s),'2026-06-30');
 s.money=10000;obligations(s);G.sleep(s);assert.equal(s.ending,'ordinary');assert.equal(s.day,122);
});
test('real chart metadata, covers, types and per-chart tendencies',()=>{
 assert.equal(songs.length,1394);assert.equal(pool.length,5537);assert.ok(pool.every(c=>c.version&&c.notes.length===5&&c.cover));
 assert.ok(pool.some(c=>c.type==='SD'&&c.tendency==='star'));assert.ok(pool.some(c=>c.type==='DX'&&c.tendency==='key'));
 assert.ok(songs.every(s=>fs.existsSync(require('node:path').join(__dirname,`../assets/covers/${s.id}.webp`))));
});
test('101 is an achievement while Rating caps at 100.5 and combo is independent',()=>{
 assert.equal(G.chartRating(14,101),315);assert.equal(G.chartRating(14,100.5),315);assert.equal(G.chartRating(14,100),302);assert.equal(G.chartRating(14,99.5),293);
 assert.equal(G.rank(101),'SSS+');assert.equal(G.rank(100.5),'SSS+');assert.equal(G.rank(100),'SSS');
 assert.equal(G.combo({miss:1,good:0,great:0}),'');assert.equal(G.combo({miss:0,good:1,great:0}),'FC');assert.equal(G.combo({miss:0,good:0,great:1}),'FC+');assert.equal(G.combo({miss:0,good:0,great:0}),'AP');
});
test('judgements match note totals, scores and logical combos including 101 AP',()=>{
 const s=G.create('student',42),c=pool.find(c=>c.ds<5);s.skills={star:16,key:16,reading:16};s.liquid=600;s.condition=4;s.practice[G.key(c)]=200;s.mood=100;
 const perfect=G.calculateJudgements(c.notes.map(critical=>({critical,perfect:0,great:0,good:0,miss:0})),{critical:c.notes[4],perfect50:0,perfect100:0,great80:0,great60:0,great50:0,good:0,miss:0});assert.equal(perfect.achievement,101);assert.equal(perfect.combo,'AP');
 for(const c of pool.filter((_,i)=>i%37===0)){
  const r=G.simulate(s,c),j=r.judgements;assert.equal(Object.values(j).reduce((a,b)=>a+b),c.notes.reduce((a,b)=>a+b));assert.equal(r.combo,G.combo(j));assert.ok(r.achievement<=101&&r.achievement>=0);
 }
});
test('first play penalty, repeated practice and category-specific ability/growth',()=>{
 const s=G.create(),star=pool.find(c=>c.starWeight>.7),keys=pool.find(c=>c.starWeight<.15);
 const first=G.expected(s,star);s.practice[G.key(star)]=1;assert.ok(G.expected(s,star)>first);const second=G.expected(s,star);s.practice[G.key(star)]=5;assert.ok(G.expected(s,star)>second);
 s.skills={star:13,key:9,reading:9.8};assert.ok(G.ability(s,star)>G.ability(s,keys));
 const p=G.create();arrive(p);G.play(p,[star,star,star],pool);assert.ok(p.skills.star-8>p.skills.key-8);
});
test('practice count increments even when best score does not improve',()=>{
 const s=G.create();arrive(s);const c=pool.find(c=>c.ds===10);s.records[G.key(c)]={...c,ra:G.chartRating(c.ds,101),achievement:101,combo:'AP'};const before=s.records[G.key(c)];
 G.play(s,[c,c,c],pool);assert.equal(s.practice[G.key(c)],3);assert.equal(s.records[G.key(c)].achievement,101);assert.equal(s.records[G.key(c)],before);
});
test('solo repeats settle three tracks independently with lower star/key growth',()=>{
 const s=G.create('grinder',42);arrive(s);const c=pool.find(c=>c.ds===8&&!c.utage);
 const before={money:s.money,liquid:s.liquid,gloves:s.gloves.durability,precision:s.precision.base,skills:{...s.skills},clock:s.clock};
 const multiplier=G.growthMultiplier(c,s),skills={...s.skills};
 for(let i=0;i<3;i++){
  const shadow={...s,skills},gain=.004*multiplier*G.growthFactor(shadow,c);
  skills.star+=gain*.9*(.2+1.6*c.starWeight);skills.key+=gain*.9*(.2+1.6*(1-c.starWeight));skills.reading+=gain*(i?.65:1.2);
 }
 const result=G.play(s,[c,c,c],pool);
 assert.deepEqual(result.results.map(r=>r.plays),[1,2,3]);assert.equal(s.practice[G.key(c)],3);
 assert.equal(s.records[G.key(c)].achievement,Math.max(...result.results.map(r=>r.achievement)));
 assert.equal(s.money,before.money-6);assert.equal(s.clock,before.clock+12);assert.equal(s.liquid,before.liquid-180);
 assert.ok(s.gloves.durability<before.gloves);assert.ok(Math.abs(s.precision.base-before.precision-.036)<1e-8);
 for(const k of ['star','key','reading'])assert.ok(Math.abs(s.skills[k]-skills[k])<1e-9,k);
 assert.ok(G.validate(G.migrate(JSON.parse(JSON.stringify(s)))));
});
test('B35 + B15 retains separate records per chart and version',()=>{
 const s=G.create();for(let i=0;i<50;i++)s.records['old'+i]={ds:(300.5+i)/21.6,ra:300+i,isNew:false,achievement:100};for(let i=0;i<25;i++)s.records['new'+i]={ds:(300.5+i)/21.6,ra:300+i,isNew:true,achievement:100};G.recalculate(s);
 assert.equal(G.best(s).old.length,35);assert.equal(G.best(s).fresh.length,15);assert.equal(s.rating,35*(315+349)/2+15*(310+324)/2);
});
test('daily actions consume hours without ending the day; sleep charges baseline once',()=>{
 const s=G.create('grinder');G.daily(s,'work');assert.equal(s.clock,720);assert.equal(s.day,1);assert.equal(s.money,1840);G.daily(s,'wait');assert.equal(s.clock,780);G.daily(s,'fun');assert.equal(s.clock,900);
 const before=s.money;G.sleep(s);assert.equal(s.day,1);assert.equal(s.clock,1380);assert.equal(s.money,before);G.daily(s,'wait');assert.equal(s.day,2);assert.equal(s.money,before-25);
});
test('worker cannot take side jobs, skip shifts, sleep through work or attend during work',()=>{
 const s=G.create('worker');s.day=2;assert.throws(()=>G.daily(s,'work'));assert.throws(()=>G.resolveClass(s,'shift',false));
 G.startTrip(s);const money=s.money;assert.throws(()=>G.travel(s,'taxi',1));assert.equal(s.money,money);s.phase='home';G.resolveClass(s,'shift',true);assert.equal(s.clock,720);G.eatHome(s,'home');G.resolveClass(s,'shift',true);assert.equal(s.clock,1080);arrive(s);assert.ok(s.clock>=1080);
});
test('student water and professional courses cost mood, skipping costs appropriate academic points',()=>{
 const s=G.create('student',1);s.day=2;assert.equal(G.schedule(s).length,2);const initial=s.school.academic,mood=s.mood;
 G.resolveClass(s,'mon-major',true);assert.equal(s.clock,660);assert.equal(s.school.academic,initial+5);assert.equal(s.mood,mood-7);
 const clock=s.clock,academic=s.school.academic;G.resolveClass(s,'mon-general',false);assert.equal(s.clock,clock);assert.ok([4,6].includes(academic-s.school.academic));
 const p=G.create('student',2);p.day=2;const a=p.school.academic;G.resolveClass(p,'mon-major',false);assert.ok([12,17].includes(a-p.school.academic));
});
test('teacher event and recovery, three consultations and continuous ten-day failure',()=>{
 const s=G.create();G.academicChange(s,-70);assert.ok(s.school.pending);assert.throws(()=>G.daily(s,'rest'));G.teacher(s);assert.equal(s.school.talks,1);G.daily(s,'study');G.daily(s,'study');assert.equal(s.school.failing,false);
 for(let i=0;i<2;i++){G.academicChange(s,-100);G.teacher(s);if(!s.ending)G.academicChange(s,20);}assert.equal(s.ending,'dropout');
 const d=G.create();d.money=10000;G.academicChange(d,-70);G.teacher(d);d.day=9;d.completed=G.schedule(d).map(c=>c.id);d.clock=1380;G.sleep(d);assert.equal(d.ending,null);assert.equal(d.day,10);d.completed=G.schedule(d).map(c=>c.id);d.clock=1380;G.sleep(d);assert.equal(d.ending,'dropout');
});
test('rent checks on the 25th, reserves are deducted only once, salary on the 1st',()=>{
 const s=G.create('worker');s.day=24;s.money=1866;s.clock=1380;s.completed=G.schedule(s).map(c=>c.id);G.sleep(s);assert.equal(s.day,25);assert.equal(s.money,1);assert.deepEqual(s.paidMonths,[3]);
 s.money=5000;s.clock=1380;s.completed=G.schedule(s).map(c=>c.id);G.sleep(s);assert.equal(s.money,4935);assert.deepEqual(s.paidMonths,[3]);
 const poor=G.create('grinder');poor.day=24;poor.money=624;poor.clock=1380;G.sleep(poor);assert.equal(poor.ending,'rent');assert.equal(poor.day,25);
 const paid=G.create('worker');paid.day=31;paid.money=2000;paid.clock=1380;paid.completed=G.schedule(paid).map(c=>c.id);G.sleep(paid);assert.equal(G.dateISO(paid),'2026-04-01');assert.equal(paid.money,7935);
 const student=G.create();student.day=31;student.money=1000;student.clock=1380;student.completed=G.schedule(student).map(c=>c.id);G.sleep(student);assert.equal(student.money,2765);
});
test('paired queue serves two people simultaneously, two chosen and two partner songs',()=>{
 const s=G.create();s.people=8;s.clock=900;const solo=G.roundInfo(s,0,'solo'),pair=G.roundInfo(s,0,'pair');assert.equal(solo.duration,12);assert.equal(pair.duration,16);assert.equal(solo.queue,48);assert.equal(pair.queue,32);assert.equal(pair.total,48);
 arrive(s,'pair');const before=s.clock,cash=s.money;const r=G.play(s,G.recommend(s,pool),pool);assert.equal(r.results.length,4);assert.equal(r.results.filter(c=>c.partner).length,2);assert.equal(s.money,cash-6);assert.equal(s.clock,before+16);
 assert.throws(()=>G.play(s,pool.slice(0,3),pool));
});
test('arcade closing, return and meal deadlines, and outing does not end the day',()=>{
 const s=G.create();s.clock=1395;G.startTrip(s);assert.throws(()=>G.travel(s,'taxi'));assert.equal(s.clock,1395);
 const t=G.create();arrive(t);t.clock=G.availableUntil(t)-G.roundMinutes(t);assert.equal(G.playReason(t),'');G.play(t,G.recommend(t,pool),pool);assert.ok(t.clock<=1410);assert.ok(G.playReason(t));G.finishPlay(t);G.meal(t,'home');assert.equal(t.day,2);assert.ok(t.clock<60);assert.equal(t.phase,'home');
});
test('romance final event strictly requires >13000 and correct chain',()=>{
 const s=G.create('grinder');s.phase='meal';for(let i=0;i<G.EVENTS.length-1;i++){s.day=Math.max(s.day,s.romance.nextDay);s.clock=600;s.event=i;G.answer(s,G.EVENTS[i].correct);}s.day=s.romance.nextDay;s.phase='play';s.trip={rounds:1};s.visits=30;s.rating=13000;G.finishPlay(s);assert.equal(s.event,null);s.phase='play';s.rating=13001;G.finishPlay(s);assert.equal(s.event,G.EVENTS.length-1);G.answer(s,0);assert.equal(s.ending,'love');
});
test('old saves migrate with finances, chart records and relationships intact',()=>{
 const c=pool[0],old={version:1,job:'student',seed:42,day:13,money:128,mood:64,skill:11.64,records:{[G.key(c)]:{...c,achievement:100.5,ra:112}},started:true,visits:6,credits:10,love:1,loveFailed:false,nextLoveVisit:8};
 const s=G.migrate(old);assert.ok(G.validate(s));assert.equal(s.money,128);assert.equal(s.skills.star,11.64);assert.equal(s.skills.key,11.64);assert.equal(s.day,13);assert.equal(s.clock,480);assert.equal(s.love,1);assert.equal(Object.keys(s.records).length,1);
});
test('save validation handles all live phases and rejects corrupted saves',()=>{
 const s=G.create();assert.ok(G.validate(s));arrive(s);assert.ok(G.validate(s));G.play(s,G.recommend(s,pool),pool);assert.ok(G.validate(s));G.finishPlay(s);assert.ok(G.validate(s));G.meal(s,'home');assert.ok(G.validate(s));s.clock=1500;assert.ok(!G.validate(s));assert.ok(!G.validate({version:2}));
});
// Near the goal, practice a chart that can improve B50 instead of only sampling new recommendations.
function seasonSelection(s){
 if(s.rating<15000)return G.recommend(s,pool);
 const best=G.best(s),targets=pool.filter(c=>!G.isUtage(c)&&c.ds<=G.ability(s,c)+.3).map(c=>{
  const expected=G.expected(s,c),group=c.isNew?best.fresh:best.old,limit=c.isNew?15:35;
  const floor=Math.max(s.records[G.key(c)]?.ra||0,group.length<limit?0:group.at(-1).ra);
  return {c,gain:G.chartRating(c.ds,Math.min(101,expected+.2))-floor};
 }).filter(x=>x.gain>0).sort((a,b)=>b.gain-a.gain);
 return targets.length?Array(G.selectCount(s)).fill(targets[0].c):G.recommend(s,pool);
}
test('regular play and targeted practice allow each career to reach W6',()=>{
 for(const job of Object.keys(G.JOBS)){
  const s=G.create(job,42);G.setup(s,{name:'测试玩家',id:'Maimai',talent:'gifted',offers:['gifted'],playStyle:'outer'});s.loveFailed=true;
  while(!s.ending){
   if(s.phase==='travel')s.phase='home';care(s);for(const g of G.goals(s))if(g.done&&!g.claimed&&!s.ending&&s.phase==='home')G.claimGoal(s,g.id);const wake=s.forcedSleeps;
   obligations(s);if(s.ending)break;
   if(s.mood<48&&G.canSpendTime(s,120)&&s.money>35)G.daily(s,'fun');
   if(s.money<G.JOBS[job].rent+450&&job!=='worker'&&s.clock>=360&&s.clock+240<=1440&&G.canSpendTime(s,240)){G.daily(s,'work');if(s.mood<42&&G.canSpendTime(s,120)&&s.money>35)G.daily(s,'fun');}
   care(s);if(s.money>G.JOBS[job].rent+80&&s.mood>30&&s.phase==='home'){
    try{arrive(s,'pair');}catch{if(s.phase==='travel')s.phase='home';}
    if(s.phase==='play'){
     while(s.phase==='play'&&s.mood>25&&s.money>G.JOBS[job].rent+80&&s.drowsiness<87){
      try{if(s.gloves.durability<10)G.buyGloves(s,'sport');if(s.stamina<45)G.waitQueue(s);if(s.liquid<240)G.refill(s,'water');if(s.queueUntil>s.clock)G.waitQueue(s);if(G.playReason(s))break;G.play(s,seasonSelection(s),pool);}catch{break;}if(s.ending)break;
     }
     if(s.ending)break;if(s.phase==='play'){G.finishPlay(s);G.meal(s,s.money>G.JOBS[job].rent+300&&G.canSpendTime(s,30+s.trip.returnTime)?'noodles':'home');}
    }
   }
   if(!s.ending&&wake===s.forcedSleeps){care(s);if(s.phase==='home'&&s.clock<1080&&G.canSpendTime(s,1080-s.clock))G.advance(s,1080-s.clock);care(s);if(s.phase==='home'&&s.clock<1320&&G.canSpendTime(s,1320-s.clock))G.advance(s,1320-s.clock);if(wake===s.forcedSleeps){care(s);G.sleep(s);}}
  }
  console.log(`${job}: ${s.ending}, ${G.dateISO(s)}, Rating ${s.rating}, star ${s.skills.star.toFixed(2)}, key ${s.skills.key.toFixed(2)}`);
  assert.equal(s.ending,'good',`${job} failed to reach W6`);
 }
});
