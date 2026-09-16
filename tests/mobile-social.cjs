const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const runtime=require('node:module').createRequire('C:/Users/ADMIN/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/browser-runtime.js'),{chromium}=runtime('playwright'),G=require('../engine');
(async()=>{const browser=await chromium.launch({headless:true,channel:'msedge'});try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addLocatorHandler(page.locator('[data-action="meal-later"]'),async()=>{await page.locator('[data-action="meal-later"]').click();});
 await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
 await page.locator('input[name="talent"]').first().check();await page.getByRole('button',{name:'开始春季生活'}).click();await page.locator('[data-action="intro-skip"]').click();
 async function close(){await page.getByRole('button',{name:'关闭',exact:true}).click();}
 async function shot(name){await page.screenshot({path:path.resolve(__dirname,'../artifacts/mobile-'+name+'.png'),animations:'disabled'});}
 async function load(s){s.setupDone=true;const file=path.resolve(__dirname,'../artifacts/social-fixture.json');fs.writeFileSync(file,JSON.stringify(s));await page.getByRole('button',{name:'存档与设置'}).click();await page.locator('#import-save').setInputFiles(file);await page.waitForSelector('#import-save',{state:'detached'});}
 async function fits(){assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.ok(await page.locator('.modal').evaluate(el=>el.scrollWidth<=el.clientWidth+1));}
 const original=await page.locator('.player-avatar img').getAttribute('src');assert.ok(original.startsWith('data:image/'));
 await page.getByRole('button',{name:'自定义头像'}).click();assert.equal(await page.locator('.avatar-choice').count(),24);await fits();await shot('avatars');
 const chosen=await page.locator('.avatar-choice').nth(5).locator('img').getAttribute('src');await page.locator('.avatar-choice').nth(5).click();assert.equal(await page.locator('.avatar-choice[aria-pressed="true"]').count(),1);await close();
 assert.equal(await page.locator('.player-avatar img').getAttribute('src'),chosen);await page.reload();assert.equal(await page.locator('.player-avatar img').getAttribute('src'),chosen);
 await page.getByRole('button',{name:'自定义头像'}).click();await page.locator('.modal').evaluate(el=>el.scrollTop=el.scrollHeight);
 const closeBox=await page.getByRole('button',{name:'关闭',exact:true}).boundingBox();assert.ok(closeBox.y>=0&&closeBox.y+closeBox.height<=844);assert.ok(closeBox.height>=44);
 await page.getByRole('button',{name:'恢复默认'}).click();await close();assert.equal(await page.locator('.player-avatar img').getAttribute('src'),original);
 const social=G.create('grinder',42);social.love=2;social.romance.trust=20;social.romance.nextDay=7;social.romance.memories=[{stage:0,day:1,ok:true,text:G.EVENTS[0].reply}];await load(social);
 await page.locator('[data-action="relationship"]').click();assert.match(await page.locator('.relationship-summary').innerText(),/故事 2 \/ 8/);assert.match(await page.locator('.relationship-memories').innerText(),/小凛/);
 await page.locator('[data-action="love-contact"][data-value="chat"]').click();assert.match(await page.locator('.relationship-summary').innerText(),/23\/100/);assert.ok(await page.locator('[data-action="love-contact"][data-value="walk"]').isDisabled());await shot('relationship');await close();assert.equal(await page.locator('.clock-display>b').innerText(),'08:15');
 await page.locator('[data-action="chat"]').click();assert.ok(await page.locator('.conversation-list').isVisible());await page.locator('[data-action="conversation"][data-value="group"]').click();await page.setViewportSize({width:390,height:500});await page.locator('#chat-message').focus();await fits();
 const chatBox=await page.locator('#chat-message').boundingBox();assert.ok(chatBox.height>=44&&chatBox.y>=0&&chatBox.y+chatBox.height<=500);await shot('chat-short');await close();await page.setViewportSize({width:390,height:844});
 const discovered=G.create('grinder',42);discovered.city.arcades=[0,1,2,3,4];await load(discovered);await page.locator('[data-action="attend"]').click();assert.match(await page.locator('.phone-location').innerText(),/已发现 5 \/ 5 家/);assert.match(await page.locator('.phone-footer').innerText(),/本城机厅已全部发现/);await fits();await shot('travel');await close();
 const active=G.create('grinder',42);active.people=18;G.startTrip(active);G.travel(active,'bike',0);G.drink(active,'water');if(active.queueUntil>active.clock)G.waitQueue(active);await load(active);
 await page.locator('[data-action="attend"]').click();await page.locator('[data-action="picker"]').first().scrollIntoViewIfNeeded();
 const before=await page.locator('.modal').evaluate(el=>el.scrollTop);await page.locator('[data-action="picker"]').first().click();assert.equal(await page.locator('.modal').evaluate(el=>el.scrollTop),0);await fits();
 for(const width of [320,390]){await page.setViewportSize({width,height:844});await fits();await shot('picker-'+width);}
 await page.locator('[data-action="pick"]').first().click();assert.ok(Math.abs(await page.locator('.modal').evaluate(el=>el.scrollTop)-before)<5,'returning from song picker preserves scroll position');
 const play=await page.locator('[data-action="play"]').boundingBox();assert.ok(play.height>=44&&play.y+play.height<=844);await shot('selection');
 assert.deepEqual(errors,[]);console.log('PASS: original/default avatars persist, daily relationship contact, five arcade cap, mobile sticky controls, keyboard-sized chat and picker scroll restoration.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
