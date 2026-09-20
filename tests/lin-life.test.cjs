const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),G=require('../engine'),M=require('../gameplay');
const data={window:{}};vm.runInNewContext(fs.readFileSync(require.resolve('../data/music.js'),'utf8'),data);const pool=G.charts(data.window.MUSIC_DATA);
function met(){const s=G.create('grinder',42);s.city.encounter=true;G.answerEncounter(s,0);return s;}
function request(){const s=met();s.day=2;s.clock=1080;s.romance.requestSeed=0;G.linTick(s);assert.ok(s.romance.request);return s;}
test('crowd announcements exclude Lin; migration removes her old crowd alert but preserves conversations',()=>{
 const original={unlockedArcades:G.unlockedArcades,arcadeIsOpen:G.arcadeIsOpen,peopleAt:G.peopleAt};
 try{
  G.unlockedArcades=()=>[{id:0,name:'测试机厅'}];G.arcadeIsOpen=()=>true;G.peopleAt=()=>20;
  for(let seed=1;seed<=100;seed++){
   const s=met();s.seed=seed*1234567;s.clock=1100;s.chat=[];s.crowdAlerts.forEach(a=>{a.high=false;a.last=-1;});s.socialLife.posts=0;const before=JSON.stringify(s.world.dm['小凛']);
   M.crowdChat(s);assert.equal(JSON.stringify(s.world.dm['小凛']),before);assert.ok(s.chat.some(m=>m.text.includes('大B队')));assert.ok(!s.chat.some(m=>m.id==='小凛'));
  }
 }finally{Object.assign(G,original);}
 const s=met(),text='测试机厅现在 20 人，大B队来了！';
 s.world.dm['小凛'].push({id:'小凛',text,day:1,time:500},{id:s.profile.id,text,day:1,time:501,self:true},{id:'小凛',text:'下次一起打 V 家曲吧。',day:1,time:502});
 const copy=G.migrate(s);assert.ok(!copy.world.dm['小凛'].some(m=>!m.self&&m.text===text));assert.ok(copy.world.dm['小凛'].some(m=>m.self&&m.text===text));assert.ok(copy.world.dm['小凛'].some(m=>m.text==='下次一起打 V 家曲吧。'));assert.ok(G.validate(copy));
});

test('meeting Lin adds one private friend and migrates her old group messages without duplicates',()=>{
 const s=met();assert.equal(s.romance.trust,6);assert.equal(s.romance.nextDay,5);assert.equal(s.npcs.filter(n=>n.id==='小凛').length,1);assert.ok(s.world.friends.includes('小凛'));assert.ok(G.validate(s));
 s.chat.push({id:'小凛',text:'今天散步很开心。',day:1,time:490});const copy=G.migrate(s);assert.ok(!copy.chat.some(m=>m.id==='小凛'));assert.equal(copy.world.dm['小凛'].filter(m=>m.text==='今天散步很开心。').length,1);const saved=JSON.stringify(copy);assert.equal(JSON.stringify(G.migrate(copy)),saved);
 const before=copy.romance.trust;G.sendDM(copy,'小凛','喜欢什么曲风？');G.sendDM(copy,'小凛','初音的歌呢？');assert.equal(copy.romance.trust,before+1);assert.match(copy.world.dm['小凛'].findLast(m=>!m.self).text,/V 家/);assert.ok(G.validate(copy));
});

test('later stories wait in Lin conversation and can be answered from home after reload',()=>{
 const s=met();s.day=5;s.clock=600;s.visits=4;s.phase='play';s.trip={rounds:1};G.finishPlay(s);assert.equal(s.event,null);assert.equal(s.romance.pendingStory,1);assert.ok(s.world.dm['小凛'].some(m=>m.text===G.EVENTS[1].text));
 s.phase='home';s.trip=null;G.openLinStory(s);assert.equal(s.event,1);assert.ok(G.validate(s));const copy=G.migrate(JSON.parse(JSON.stringify(s)));assert.equal(copy.event,1);G.answer(copy,1);assert.equal(copy.love,2);assert.equal(copy.romance.trust,12);assert.equal(copy.romance.pendingStory,null);assert.ok(G.validate(copy));
});

test('Lin attendance is deterministic, respects classes and closing, and pairing selects Vocaloid',()=>{
 const s=met();s.city.denUnlocked=true;for(const clock of [180,480,600,900,1380]){s.day=2;s.clock=clock;assert.equal(G.linArcade(s),null);}
 s.day=2;s.clock=1080;const arcade=G.linArcade(s);assert.notEqual(arcade,null);s.money=10000;G.startTrip(s);G.travel(s,'taxi',arcade);G.drink(s,'water');G.pairWithLin(s);assert.equal(s.npcs[s.partner].id,'小凛');assert.ok(G.preparePartner(s,pool).every(item=>pool.find(c=>c.id===item.id&&c.index===item.index).genre==='niconico & VOCALOID'));assert.ok(G.validate(s));
 const before=s.npcs[s.partner].rating;M.npcTick(s,100);assert.ok(s.npcs.find(n=>n.id==='小凛').rating>=before);
 s.clock=1300;assert.throws(()=>G.pairWithLin(s));const copy=G.migrate(s);assert.notEqual(copy.npcs[copy.partner]?.id,'小凛');
 assert.equal(G.ARCADES[5].cabinets,3);
});

test('requests choose nearby Vocaloid charts, last 72 hours and cannot reroll through reload',()=>{
 const s=request(),q=s.romance.request,c=pool.find(c=>G.key(c)===q.key);assert.equal(c.genre,'niconico & VOCALOID');assert.ok(Math.abs(c.ds-G.baseAbility(s,c))<=.65);assert.equal(q.deadline-q.issuedAt,4320);
 const copy=G.migrate(JSON.parse(JSON.stringify(s)));G.linTick(copy);assert.deepEqual(copy.romance.request,q);assert.ok(G.validate(copy));
 const no=met();no.day=2;no.clock=1080;no.romance.requestSeed=10000;G.linTick(no);const check=no.romance.requestCheckDay;G.linTick(no);assert.equal(no.romance.requestCheckDay,check);
 const end=met();end.day=121;end.clock=1080;end.romance.requestSeed=0;G.linTick(end);assert.equal(end.romance.request,null);
});

test('only a fresh matching chart score before the deadline awards affection exactly once',()=>{
 const s=request(),q=s.romance.request,c=pool.find(c=>G.key(c)===q.key),trust=s.romance.trust;s.records[q.key]={...c,achievement:100.5,ra:G.chartRating(c.ds,100.5),combo:'',bestCombo:''};G.linTick(s);assert.equal(q.status,'active');
 G.linAfterPlay(s,[{...c,index:(c.index+1)%4,achievement:100.5}]);G.linAfterPlay(s,[{...c,achievement:99.9999}]);assert.equal(s.romance.trust,trust);
 G.linAfterPlay(s,[{...c,achievement:100}]);assert.equal(q.status,'completed');assert.equal(s.romance.trust,trust+3);G.linAfterPlay(s,[{...c,achievement:100.5}]);assert.equal(s.romance.trust,trust+3);assert.ok(G.validate(s));
 const late=request(),deadline=late.romance.request.deadline;late.day=Math.floor((deadline+1)/1440)+1;late.clock=(deadline+1)%1440;G.linTick(late);assert.equal(late.romance.request.status,'expired');const old=late.romance.trust;G.linAfterPlay(late,[{...c,achievement:101}]);assert.equal(late.romance.trust,old);
});

test('actual PC completion settles Lin request, and malformed task payloads fail validation',()=>{
 const s=request(),q=s.romance.request,c=pool.find(c=>G.key(c)===q.key);s.clock=1080;s.money=10000;s.skills={star:22,key:22,reading:22};s.precision.base=95;s.condition=4;s.practice[q.key]=100;G.startTrip(s);G.travel(s,'taxi',0);G.drink(s,'water');if(s.queueUntil>s.clock)G.waitQueue(s);s.drowsiness=0;s.stamina=s.maxStamina;G.play(s,[c,c,c],pool);assert.equal(q.status,'completed');assert.ok(G.validate(s));
 for(const change of [s=>s.romance.request.deadline=Infinity,s=>s.romance.request.key='8:0',s=>s.romance.request.status='fake',s=>s.romance.pendingStory=7]){const bad=request();change(bad);assert.equal(G.validate(bad),false);}
});
