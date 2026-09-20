const assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
const runtime=require('node:module').createRequire('C:/Users/ADMIN/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/browser-runtime.js');
const {chromium}=runtime('playwright'),G=require('../engine');
const day=iso=>Math.round((Date.parse(iso+'T00:00:00Z')-G.START)/86400000)+1;
(async()=>{const browser=await chromium.launch({headless:true,channel:'msedge'});try{
 const page=await browser.newPage({viewport:{width:1232,height:960}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addLocatorHandler(page.locator('[data-action="meal-later"]'),async()=>page.locator('[data-action="meal-later"]').click());
 await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
 const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('attendance-simulator-v2')));
 async function load(s){s.setupDone=true;s.guide.introDone=true;await page.evaluate(value=>localStorage.setItem('attendance-simulator-v2',JSON.stringify(value)),s);await page.reload();}
 async function close(){await page.getByRole('button',{name:'关闭',exact:true}).click();}
 async function shot(name){await page.locator('#toast').evaluate(el=>el.classList.remove('show'));await page.screenshot({path:path.resolve(__dirname,'../artifacts/calendar-'+name+'.png'),animations:'disabled'});}
 async function fits(){assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.ok(await page.locator('.modal').evaluate(el=>el.scrollWidth<=el.clientWidth+1));assert.ok(await page.locator('.calendar-cell').evaluateAll(cells=>cells.every(el=>el.scrollWidth<=el.clientWidth+1)));}
 const s=G.create('student',42);s.day=day('2026-05-09');await load(s);
 await page.getByRole('button',{name:'查看日历',exact:true}).click();
 assert.match(await page.locator('.calendar-day-detail').innerText(),/劳动节调休 · 按周二课表/);
 assert.match(await page.locator('.calendar-day-detail').innerText(),/10:00–11:00/);
 await page.locator('[data-action="calendar-day"][data-value="'+day('2026-05-01')+'"]').click();
 assert.match(await page.locator('.calendar-day-detail').innerText(),/劳动节 · 放假/);
 assert.match(await page.locator('.calendar-day-detail').innerText(),/没有课程/);
 assert.match(await page.locator('.calendar-day-detail').innerText(),/生活费 ¥1800/);
 for(const width of [1232,390,320]){await page.setViewportSize({width,height:960});await fits();await shot('holiday-'+width);}
 await page.getByRole('button',{name:'上个月',exact:true}).click();
 await page.locator('[data-action="calendar-day"][data-value="'+day('2026-04-06')+'"]').click();assert.match(await page.locator('.calendar-day-detail').innerText(),/清明节 · 放假/);
 await page.getByRole('button',{name:'上个月',exact:true}).click();assert.ok(await page.getByRole('button',{name:'上个月',exact:true}).isDisabled());
 await page.getByRole('button',{name:'回到游戏今天',exact:true}).click();assert.match(await page.locator('.calendar-day-detail').innerText(),/2026-05-09/);
 await page.getByRole('button',{name:'下个月',exact:true}).click();assert.ok(await page.getByRole('button',{name:'下个月',exact:true}).isDisabled());
 await page.locator('[data-action="calendar-day"][data-value="'+day('2026-06-19')+'"]').click();assert.match(await page.locator('.calendar-day-detail').innerText(),/端午节 · 放假/);
 assert.equal((await saved()).day,s.day);assert.equal((await saved()).clock,s.clock);await close();
 await page.locator('[data-action="timetable"]').click();assert.equal(await page.locator('.week-schedule>div').count(),7);const saturday=page.locator('.week-schedule>div').filter({hasText:'5/9 周六'});assert.match(await saturday.innerText(),/劳动节调休/);assert.match(await saturday.innerText(),/高等数学/);
 for(const width of [1232,320]){await page.setViewportSize({width,height:960});assert.ok(await page.locator('.week-schedule').evaluate(el=>el.scrollWidth<=el.clientWidth+1));await shot('timetable-'+width);}await close();
 const worker=G.create('worker',42);worker.day=day('2026-05-09');await load(worker);await page.getByRole('button',{name:'查看日历',exact:true}).click();assert.match(await page.locator('.calendar-day-detail').innerText(),/09:00–18:00/);await close();
 const fresh=G.create('grinder',42);await load(fresh);await page.locator('[data-action="chat"]').click();await page.locator('[data-action="conversation"][data-value="group"]').click();
 assert.equal((await saved()).city.denUnlocked,false);await page.getByRole('textbox',{name:'群聊消息'}).fill('今晚有地方打歌吗');await page.getByRole('button',{name:'发送消息',exact:true}).click();
 assert.equal((await saved()).city.denUnlocked,true);assert.match(await page.locator('.chat-window').innerText(),/给你发个地址：不眠猫窝/);await close();
 const quest=G.create('grinder',42);quest.clock=1320;quest.drowsiness=0;quest.world.quests['电压'].stage=4;quest.npcs.find(n=>n.id==='电压').familiarity=50;G.syncFriends(quest);const reading=quest.skills.reading;
 await load(quest);await page.locator('[data-action="entertain"]').click();assert.equal(await page.locator('[data-action="explore"][data-value="baiyun"]').count(),0);await close();
 await page.locator('[data-action="chat"]').click();await page.locator('[data-action="conversation"][data-value="电压"]').click();assert.match(await page.locator('.quest-panel').innerText(),/22:00–04:00/);
 await page.locator('[data-action="quest"][data-value="电压"]').click();await require('./segment-browser.cjs').observeBird(page);assert.match(await page.locator('.world-event-text').innerText(),/领角鸮/);assert.match(await page.locator('.world-event-text').innerText(),/解锁新地点：白云山/);
 const owl=page.locator('.modal img.pixel-art');await owl.evaluate(img=>img.decode());assert.equal(await owl.getAttribute('src'),'assets/world/birds/owl.png');assert.equal(await owl.evaluate(img=>img.naturalWidth),256);await shot('owl-finale-mobile');
 const complete=await saved();assert.equal(complete.world.quests['电压'].stage,5);assert.ok(complete.world.entries.includes('owl'));assert.ok(complete.world.locations.includes('baiyun'));assert.equal(complete.skills.reading,reading+.25);
 await page.locator('[data-action="world-ack"]').click();await page.reload();await page.locator('[data-action="entertain"]').click();assert.ok(await page.locator('[data-action="explore"][data-value="baiyun"]').isVisible());assert.equal((await saved()).skills.reading,reading+.25);
 assert.deepEqual(errors,[]);console.log('PASS: calendar holidays/makeup/month bounds and mobile layout, chat den invitation, hidden owl finale and persistent Baiyun unlock.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
