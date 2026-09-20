const test=require('node:test'),assert=require('node:assert/strict'),G=require('../engine');
function ready(stage=0){const s=G.create('grinder',42);s.npcs.find(n=>n.id==='电压').familiarity=30;G.syncFriends(s);s.world.quests['电压'].stage=stage;return s;}
function ask(s,text){G.sendDM(s,'电压',text);assert.ok(G.validate(s));const messages=s.world.dm['电压'],self=messages.findLastIndex(m=>m.self);return messages.slice(self+1).map(m=>m.text).join('\n');}

test('Dianya explains the first bird quest and chat does not collect or unlock anything',()=>{
 const s=ready(),before={clock:s.clock,entries:[...s.world.entries],locations:[...s.world.locations]};
 const reply=ask(s,'怎么开始观鸟？');assert.match(reply,/出门闲逛.*越秀公园/);assert.match(reply,/一起出发/);assert.match(reply,/鸟鸣/);assert.equal(s.clock,before.clock+5);assert.equal(s.npcs[2].familiarity,34);
 assert.deepEqual(s.world.entries,before.entries);assert.deepEqual(s.world.locations,before.locations);assert.equal(s.world.quests['电压'].stage,0);
 s.world.locations.push('yuexiu');const known=ask(s,'出发吧');assert.match(known,/第一次观鸟我陪你去越秀公园/);assert.doesNotMatch(known,/出门闲逛/);assert.equal(s.npcs[2].familiarity,34);
});

test('Dianya explains active observation, visit hours, remaining birds and daily quest limits',()=>{
 const s=ready(1);s.world.locations=['yuexiu'];s.world.quests['电压'].lastDay=s.day;
 const reply=ask(s,'自己观鸟是随机触发吗？');assert.match(reply,/白天 06:00–18:00 留出 45 分钟/);assert.match(reply,/观察成功才会记入图鉴/);assert.match(reply,/下一轮要等明天/);
 assert.match(ask(s,'越秀公园还有鸟吗'),/还有 7 种普通鸟/);
 s.world.entries=G.WORLD_ENTRIES.filter(e=>e.kind==='bird'&&e.place==='yuexiu').map(e=>e.id);assert.match(ask(s,'越秀还有什么鸟'),/还有 0 种普通鸟/);
 assert.match(ask(s,'沙面呢'),/沙面岛还没发现/);
});

test('species questions use atlas knowledge and general replies rotate observation tips',()=>{
 const s=ready(1);assert.match(ask(s,'白头鹎怎么认'),/白头鹎：.*白色后枕/);assert.match(ask(s,'翠鸟有什么特点'),/普通翠鸟：.*蓝色身影/);
 assert.match(ask(s,'要买望远镜吗'),/不用另买装备/);assert.match(ask(s,'观鸟要注意什么'),/不投喂.*不追赶/);
 const first=ask(s,'聊聊观鸟'),second=ask(s,'继续聊聊');assert.notEqual(first.split('\n').at(-1),second.split('\n').at(-1));
});

test('hidden owl guidance waits for the final quest and completed stories offer collection help',()=>{
 const early=ready(2);assert.doesNotMatch(ask(early,'猫头鹰在哪里？白云山吗？'),/白云山|领角鸮|22:00/);assert.ok(!early.world.entries.includes('owl'));
 const final=ready(4);final.world.quests['电压'].lastDay=final.day;const reply=ask(final,'几点一起出发？');assert.match(reply,/白云山/);assert.match(reply,/22:00–04:00/);assert.match(reply,/02:30/);assert.match(reply,/90 分钟/);assert.match(reply,/下一轮要等明天/);assert.doesNotMatch(reply,/领角鸮/);
 const done=ready(5);done.world.quests['电压'].rewarded=true;done.world.entries=['owl'];assert.match(ask(done,'领角鸮怎么认'),/观鸟故事完成了/);done.clock+=20;assert.match(ask(done,'领角鸮'),/领角鸮：.*耳羽簇/);
});

test('other friends keep their own voice and blocked chats do not generate bird advice',()=>{
 const s=ready();s.npcs.find(n=>n.id==='Toqin').familiarity=30;G.syncFriends(s);G.sendDM(s,'Toqin','如何观鸟');assert.match(s.world.dm.Toqin.at(-1).text,/观鸟问电压.*配色/);assert.doesNotMatch(s.world.dm.Toqin.at(-1).text,/06:00/);
 s.world.notice={title:'待处理',text:'先回应事件'};const before=JSON.stringify(s.world.dm['电压']);assert.throws(()=>G.sendDM(s,'电压','如何观鸟'));assert.equal(JSON.stringify(s.world.dm['电压']),before);
});

test('bird instructions are sent proactively once and remembered beyond chat history and reload',()=>{
 const s=ready();assert.match(ask(s,'你好'),/一起出发/);assert.doesNotMatch(ask(s,'聊聊'),/一起出发|出门闲逛/);
 s.world.dm['电压']=[];G.migrate(s);assert.doesNotMatch(ask(s,'今天怎么样'),/一起出发|出门闲逛/);assert.match(ask(s,'怎么开始观鸟'),/一起出发/);
 const old=ready();old.world.dm['电压'].push({id:'电压',text:'点“一起出发”开始观鸟。',day:1,time:480});delete old.world.dialogue;G.migrate(old);assert.doesNotMatch(ask(old,'你好'),/一起出发/);
});
