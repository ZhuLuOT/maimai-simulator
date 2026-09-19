const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const runtime=require('node:module').createRequire('C:/Users/ADMIN/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/browser-runtime.js'),{chromium}=runtime('playwright'),G=require('../engine');
(async()=>{const browser=await chromium.launch({headless:true,channel:'msedge'});try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
 async function load(s){s.setupDone=true;s.guide.introDone=true;s.nutrition.dismissed=[0];await page.evaluate(s=>localStorage.setItem('attendance-simulator-v2',JSON.stringify(s)),s);await page.reload();}
 const s=G.create('grinder',42);s.skills={star:10,key:13.6,reading:15};
 for(const width of [1234,390,320]){
  await page.setViewportSize({width,height:960});await load(s);await page.locator('[data-action="talents"]').click();
  const foundation=page.locator('.talent-list article').filter({has:page.locator('b',{hasText:'基本功扎实'})});
  assert.match(await foundation.innerText(),/最高 \+2（随对应底力递减）/);assert.match(await foundation.locator('.talent-gain').innerText(),/星星力 \+2\.00 · 键盘力 \+0\.33 · 读谱力 \+0\.13/);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.ok(await page.locator('.modal').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
  await foundation.scrollIntoViewIfNeeded();await page.screenshot({path:path.resolve(__dirname,'../artifacts/talent-decay-'+width+'.png'),animations:'disabled'});
 }
 G.grantTalent(s,'foundation');await load(s);await page.locator('[data-action="talents"]').click();const owned=page.locator('.talent-list article').filter({has:page.locator('b',{hasText:'基本功扎实'})});assert.equal(await owned.locator('.talent-gain').count(),0);assert.match(await owned.innerText(),/已获得/);
 const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('attendance-simulator-v2')));assert.deepEqual((await saved()).skills,s.skills);await page.reload();assert.deepEqual((await saved()).skills,s.skills);assert.match(await page.locator('.recent-section').innerText(),/键盘力 \+0\.33/);assert.deepEqual(errors,[]);
 console.log('PASS: talent decay previews, earned logs and reload persistence at desktop/390/320 widths.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
