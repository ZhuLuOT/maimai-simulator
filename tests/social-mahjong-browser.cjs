const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const runtime=require('node:module').createRequire('C:/Users/ADMIN/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/browser-runtime.js'),{chromium}=runtime('playwright'),G=require('../engine');
(async()=>{const browser=await chromium.launch({headless:true,channel:'msedge'});try{
 const version=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../version.json'),'utf8')).version;
 for(const mobile of [false,true]){
  const page=await browser.newPage({viewport:{width:mobile?390:1234,height:960},isMobile:mobile,hasTouch:mobile}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(v=>localStorage.setItem('attendance-release',v),version);
  await page.addLocatorHandler(page.locator('[data-action="meal-later"]'),async()=>page.locator('[data-action="meal-later"]').click());
  await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
  async function load(s){s.setupDone=true;s.guide.introDone=true;await page.evaluate(s=>localStorage.setItem('attendance-simulator-v2',JSON.stringify(s)),s);await page.reload();}
  async function shot(name){await page.screenshot({path:path.resolve(__dirname,'../artifacts/revision-'+name+(mobile?'-mobile':'-desktop')+'.png'),animations:'disabled'});}
  async function close(){await page.getByRole('button',{name:'关闭',exact:true}).click();}
  const social=G.create('grinder',42);social.npcs.find(n=>n.id==='电压').familiarity=30;G.syncFriends(social);G.syncPhone(social);G.readPhone(social,'group');await load(social);
  assert.ok(await page.locator('.phone-launch.has-unread').count());await shot('phone-unread');await page.locator('[data-action="chat"]').click();
  if(mobile)await page.locator('[data-action="conversation"][data-value="group"]').click();
  assert.ok((await page.locator('.conversation-main').boundingBox()).width>=250);assert.ok(await page.locator('.chat-phone-shell').evaluate(el=>el.scrollWidth<=el.clientWidth+1));
  assert.doesNotMatch(await page.locator('.chat-window').innerText(),/第\s*\d+\s*天/);const shell=await page.locator('.chat-phone-shell').boundingBox();assert.ok(shell.y>=0&&shell.y+shell.height<=960);await shot('chat');
  if(mobile)await page.locator('.conversation-back').click();await page.locator('[data-action="conversation"][data-value="电压"]').click();await close();assert.ok(await page.locator('.phone-launch.is-read').count());await page.reload();assert.ok(await page.locator('.phone-launch.is-read').count());
  if(mobile){await page.setViewportSize({width:320,height:500});await page.locator('[data-action="chat"]').click();await page.locator('[data-action="conversation"][data-value="group"]').click();await page.locator('#chat-message').focus();const input=await page.locator('#chat-message').boundingBox();assert.ok(input.y>=0&&input.y+input.height<=500);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await shot('keyboard');await close();await page.setViewportSize({width:390,height:960});}
  const den=G.create('grinder',42);den.city.denUnlocked=true;den.money=10000;den.clock=1320;G.startTrip(den);G.travel(den,'taxi',5);G.drink(den,'water');den.queueUntil=den.clock+60;den.drowsiness=83;await load(den);
  await page.locator('[data-action="attend"]').click();assert.equal(await page.locator('.modal .drowsiness-strip progress').getAttribute('value'),'83');assert.ok(await page.locator('[data-action="mahjong"]').isEnabled());await shot('arcade');await page.locator('[data-action="mahjong"]').click();assert.ok(await page.locator('.mahjong-lesson').isVisible());assert.equal(await page.locator('.mahjong-controls .discard').count(),0);
  for(let i=0;i<20&&!await page.locator('.hand-tile:not(:disabled)').count();i++)await page.locator('[data-action="mahjong-help"]').click();
  const tile=page.locator('.hand-tile:not(:disabled)').first(),before=await page.locator('.self-seat .river-tiles .tile').count();
  if(mobile){await tile.tap();await tile.tap();}else await tile.dblclick();
  assert.equal(await page.locator('.self-seat .river-tiles .tile').count(),before+1);await shot('mahjong');
  await page.locator('[data-action="mahjong-leave"]').click();assert.equal(await page.locator('.modal').getAttribute('data-modal'),'trip');
  const ready={...den,queueUntil:0};await load(ready);await page.locator('[data-action="attend"]').click();assert.equal(await page.locator('.supply-actions .ready-label').count(),0);assert.ok(await page.locator('.ready-label').isVisible());
  const empty=G.create('grinder',42);empty.city.denUnlocked=true;G.startTrip(empty);G.travel(empty,'taxi',5);G.drink(empty,'water');await load(empty);await page.locator('[data-action="attend"]').click();assert.ok(await page.locator('[data-action="mahjong"]').isDisabled());assert.deepEqual(errors,[]);await page.close();
 }
 const live=await browser.newPage({viewport:{width:979,height:960}}),saved=G.create('grinder',42);saved.setupDone=true;saved.guide.introDone=true;
 await live.addInitScript(s=>{if(!sessionStorage.getItem('release-fixture')){localStorage.setItem('attendance-simulator-v2',JSON.stringify(s));localStorage.setItem('attendance-release','older-release');sessionStorage.setItem('release-fixture','1');}},saved);
 await live.goto('http://127.0.0.1:4173/');await live.locator('.release-dialog[open]').waitFor();assert.equal(await live.locator('.release-changes li').count(),require('../src/release-notes.cjs').changes.length);assert.doesNotMatch(await live.locator('.release-dialog').innerText(),/赛季|6月30日/);await live.screenshot({path:path.resolve(__dirname,'../artifacts/revision-release.png')});
 await live.getByRole('button',{name:'保存进度并刷新'}).click();await live.waitForURL(url=>url.searchParams.get('v')===version);assert.equal(await live.locator('.release-dialog[open]').count(),0);assert.equal(await live.evaluate(()=>JSON.parse(localStorage.getItem('attendance-simulator-v2')).money),saved.money);await live.close();
 console.log('PASS: desktop double-click and mobile double-tap discard, COLDDD guidance, real attendance, queue bypass, drowsiness bar, pixel phone unread/read persistence and keyboard layout.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
