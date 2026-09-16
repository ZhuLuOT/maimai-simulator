const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const G=require('../engine'),M=require('../gameplay'),Round=require('../src/mahjong-round.cjs');
const data={window:{}};vm.runInNewContext(fs.readFileSync(require.resolve('../data/music.js'),'utf8'),data);const pool=G.charts(data.window.MUSIC_DATA);M.setPool(pool);
function den(clock=1320){const s=G.create('grinder',42);s.clock=clock;s.city.denUnlocked=true;s.money=10000;G.startTrip(s);G.travel(s,'taxi',5);G.drink(s,'water');return s;}

test('mahjong needs three present NPCs, accepts a queued paired player and persists the actual roster',()=>{
 const empty=den(480),before=JSON.stringify(empty);assert.equal(G.peopleAt(empty),0);assert.throws(()=>G.startMahjong(empty),/三位牌友/);assert.equal(JSON.stringify(empty),before);
 const s=den();G.setMode(s,'pair');s.queueUntil=s.clock+60;const roster=G.mahjongPlayers(s).map(n=>n.id),clock=s.clock;assert.equal(G.peopleAt(s),G.denVisitors(s).length);assert.equal(roster.length,3);assert.ok(roster.includes('COLDDD'));
 assert.equal(G.startMahjong(s),true);assert.deepEqual(s.world.mahjong.active.players,roster);assert.equal(s.clock,clock+25);assert.ok(s.queueUntil>s.clock);assert.ok(G.validate(s));
 const restored=G.migrate(JSON.parse(JSON.stringify(s)));assert.equal(restored.world.mahjong.active,null);assert.equal(restored.world.mahjong.rounds,0);
 const stale=den();stale.mode='pair';stale.partner=stale.npcs.findIndex(n=>n.id==='电压');assert.ok(!G.denVisitors(stale).some(n=>n.id==='电压'));const refreshed=G.migrate(stale);assert.ok(G.denVisitors(refreshed).includes(refreshed.npcs[refreshed.partner]));
});

test('all hours use one den roster and work nights shorten employee attendance',()=>{
 const s=G.create('grinder',42);s.city.denUnlocked=true;
 for(const day of [1,2,3,35,70])for(const clock of [60,180,300,480,840,1320,1380]){s.day=day;s.clock=clock;assert.equal(G.peopleAt(s,5),G.denVisitors(s).length);assert.ok(G.mahjongPlayers(s).every(n=>G.denVisitors(s).includes(n)));if(clock<600)for(let i=0;i<5;i++)assert.equal(G.peopleAt(s,i),0);}
 s.day=2;s.clock=180;assert.ok(G.denVisitors(s).every(n=>n.career==='freelance'));assert.ok(G.denVisitors(s).some(n=>n.id==='COLDDD'));
});

test('only player wins award yaku and COLDDD teaching completes once',()=>{
 const s=den();G.startMahjong(s);G.finishMahjong(s,{scores:[24000,28000,24000,24000],text:'对手自摸',wins:[{winner:1,yaku:[{name:'立直'}]}]});
 assert.equal(s.world.mahjong.wins,0);assert.deepEqual(s.world.mahjong.collection,{});assert.equal(s.world.mahjong.tutorialDone,true);
 s.world.notice=null;G.startMahjong(s);G.finishMahjong(s,{scores:[28000,24000,24000,24000],text:'玩家自摸',wins:[{winner:0,yaku:[{name:'立直'},{name:'ドラ'},{name:'門前清自摸和'}]}]});
 assert.equal(s.world.mahjong.wins,1);assert.equal(Object.keys(s.world.mahjong.collection).length,2);assert.ok(G.validate(s));assert.deepEqual(G.migrate(JSON.parse(JSON.stringify(s))).world.mahjong.collection,s.world.mahjong.collection);
 const alone=den();alone.world.mahjong.active={day:1,time:alone.clock,players:['电压','Toqin','逃遁']};G.finishMahjong(alone,{scores:[25000,25000,25000,25000],text:'流局',wins:[]});assert.equal(alone.world.quests.COLDDD.stage,0);assert.equal(alone.world.mahjong.tutorialDone,false);
});

test('NPC messages obey per-speaker and exact-text cooldowns across midnight and reload',()=>{
 const s=G.create('grinder',42);s.clock=1430;s.chat=[];const [a,b]=s.npcs;assert.equal(G.postNPCMessage(s,a,'先歇一轮。'),true);
 assert.equal(G.postNPCMessage(s,a,'下一首换熟歌。'),false);assert.equal(G.postNPCMessage(s,b,'先歇一轮。'),false);
 s.day++;s.clock=5;assert.equal(G.postNPCMessage(s,a,'下一首换熟歌。'),false);s.clock=10;assert.equal(G.postNPCMessage(s,a,'下一首换熟歌。'),true);
 const restored=G.migrate(JSON.parse(JSON.stringify(s)));assert.equal(G.postNPCMessage(restored,b,'先歇一轮。'),false);restored.clock=110;assert.equal(G.postNPCMessage(restored,b,'先歇一轮。'),true);
 const chat=G.create('grinder',42);for(let i=0;i<15;i++)G.chatSend(chat,'一起打吗？');for(let i=0;i<chat.chat.length;i++){const m=chat.chat[i];if(m.self||m.id==='bot')continue;const previous=chat.chat.slice(0,i).findLast(p=>p.id===m.id&&!p.self);if(previous)assert.ok((m.day-previous.day)*1440+m.time-previous.time>=20);}
});

test('phone tracks each conversation independently and retains unread state through reload',()=>{
 const s=G.create('grinder',42);s.chat=[];s.npcs.find(n=>n.id==='电压').familiarity=30;G.syncFriends(s);G.syncPhone(s);assert.equal(G.unreadPhone(s,'电压'),1);G.readPhone(s,'group');assert.equal(G.unreadPhone(s),1);
 G.readPhone(s,'电压');assert.equal(G.unreadPhone(s),0);s.chat.push({id:'Toqin',text:'画完啦。',day:1,time:480});assert.equal(G.unreadPhone(s),1);
 const restored=G.migrate(JSON.parse(JSON.stringify(s)));assert.equal(G.unreadPhone(restored),1);G.readPhone(restored,'group');assert.equal(G.unreadPhone(restored),0);assert.ok(G.validate(restored));restored.phone.read.group=Infinity;assert.equal(G.validate(restored),false);
});

test('signature song choices retain real difficulties and distinct NPC interests',()=>{
 const s=G.create('grinder',42),toqin=s.npcs.find(n=>n.id==='Toqin'),lumino=s.npcs.find(n=>n.id==='鲁米诺');
 for(let i=0;i<8;i++){const picks=M.choose(toqin,s,2);assert.equal(picks[0].title,'TiamaT:F minor');assert.ok(pool.includes(picks[0]));assert.equal(new Set(picks.map(G.key)).size,2);assert.equal(M.choose(lumino,s,2)[0].tag,'ghost');}
 assert.match(G.npcReply(s,'Toqin','最近在画什么'),/草图|轮廓/);assert.match(G.npcReply(s,'COLDDD','怎么立直'),/门前听牌.*一千点/);s.day=2;s.clock=600;assert.match(G.npcReply(s,'逃遁','在干嘛'),/上班/);
});

test('real riichi rounds offer legal choices, conserve points and allow multiple different winners',t=>{
 let seed=1;t.mock.method(Math,'random',()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;});const winners=new Set();let mostDecisions=0;
 for(let fixture=1;fixture<=12;fixture++){seed=fixture;const r=Round.createRound({name:'玩家',names:['甲','乙','丙'],dealer:fixture%4});let decisions=0;
  while(!r.result){const node=Round.node(r);assert.ok(node.options.length);const legal=r.human.get_dapai(r.human.shoupai)||[];
   for(const option of node.options){if(option.type==='discard')assert.ok(legal.includes(option.reply.dapai));if(option.type==='riichi')assert.ok(r.human.allow_lizhi(r.human.shoupai,option.reply.dapai.replace('*','')));}
   assert.equal(Round.choose(r,-1),false);const decision=Round.recommend(r);assert.ok(decision>=0);assert.equal(Round.choose(r,decision),true);assert.ok(++decisions<160);
  }
  assert.equal(r.result.scores.reduce((a,b)=>a+b,0)+r.result.lizhiSticks*1000,100000);for(const win of r.result.wins){winners.add(win.winner);assert.ok(win.yaku.length);assert.ok(win.points>0);}
  assert.deepEqual(Round.snapshot(r).names,['玩家','甲','乙','丙']);assert.equal(Round.choose(r,0),false);mostDecisions=Math.max(mostDecisions,decisions);
 }
 assert.ok(mostDecisions>10);assert.ok(winners.has(0));assert.ok(winners.size>=3);
});
