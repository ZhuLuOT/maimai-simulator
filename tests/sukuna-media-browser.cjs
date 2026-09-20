const assert=require('node:assert/strict'),G=require('../engine');
const runtime=require('node:module').createRequire('C:/Users/ADMIN/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/browser-runtime.js');
const {chromium}=runtime('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{const NativeAudio=window.Audio;window.__players=[];window.Audio=function(src){const a=new NativeAudio(src);window.__players.push(a);return a;};});
  await page.goto(process.env.TEST_URL||'http://127.0.0.1:4173/');
  const save=G.create('grinder',42);save.setupDone=true;save.guide.introDone=true;save.nutrition.dismissed=[0];save.rating=16000;G.check(save);G.continueGame(save);
  for(const id of ['yuai','aizo']){
   save.major.duel.music=id;
   await page.evaluate(s=>localStorage.setItem('attendance-simulator-v2',JSON.stringify(s)),save);await page.reload();
   const button=page.locator('[data-action="sukuna-music"]');await button.waitFor();
   if((await button.innerText()).startsWith('播放'))await button.click();
   await page.waitForFunction(()=>window.__players[0]?.currentTime>.15);
   const metadata=await page.evaluate(()=>{const a=window.__players[0];return {duration:a.duration,ready:a.readyState,src:a.currentSrc};});
   assert.ok(metadata.duration>120);assert.ok(metadata.ready>=2);assert.ok(metadata.src.endsWith(id+'.mp3'));
   await button.click();assert.match(await button.innerText(),/^播放/);assert.equal(await page.evaluate(()=>window.__players[0].paused),true);
   await page.locator('[data-action="duel-accept"]').click();assert.equal(await page.evaluate(()=>window.__players.length),1);assert.equal(await page.evaluate(()=>window.__players[0].paused),true);assert.match(await button.innerText(),/^播放/);
   await page.reload();assert.match(await button.innerText(),/^播放/);await button.click();await page.waitForFunction(()=>window.__players[0]?.currentTime>.15);assert.match(await button.innerText(),/^暂停/);
   await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide')));assert.equal(await page.evaluate(()=>window.__players[0].paused),true);
   console.log(`PASS: ${id}, ${metadata.duration.toFixed(1)} seconds, decoded and played over HTTP; pause, reload, resume and exit.`);
  }
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
