const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const runtime=require('node:module').createRequire('C:/Users/ADMIN/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/browser-runtime.js');
const {chromium}=runtime('playwright'),G=require('../engine');
(async()=>{const browser=await chromium.launch({headless:true,channel:'msedge'});try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addLocatorHandler(page.locator('[data-action="meal-later"]'),async()=>{await page.locator('[data-action="meal-later"]').click();});
 await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
 await page.locator('input[name="talent"]').first().check();await page.getByRole('button',{name:'开始春季生活'}).click();await page.locator('[data-action="intro-skip"]').click();
 const s=G.create('student',42);s.setupDone=true;s.profile.plate='真极';s.profile.id='Maimai';s.competition.wins=45;s.competition.courses=[1,2];
 const fixture=path.resolve(__dirname,'../artifacts/cabinet-fixture.json');fs.writeFileSync(fixture,JSON.stringify(s));
 await page.getByRole('button',{name:'存档与设置'}).click();await page.locator('#import-save').setInputFiles(fixture);await page.waitForSelector('#import-save',{state:'detached'});
 assert.equal(await page.locator('.cabinet-course').getAttribute('src'),'assets/course_rank/13.webp');
 assert.equal(await page.locator('.cabinet-class').getAttribute('src'),'assets/class_rank/15.webp');
 assert.equal(await page.locator('.rating-line').count(),0);
 for(const width of [320,390,821,1232,1920]){
  await page.setViewportSize({width,height:960});await page.evaluate(()=>scrollTo(0,0));
  await page.locator('.cabinet-nameplate').evaluate(async el=>{await Promise.all([...el.querySelectorAll('img')].map(img=>img.decode()));const img=new Image();img.src=getComputedStyle(el).backgroundImage.slice(5,-2);await img.decode();});
  const layout=await page.locator('.cabinet-nameplate').evaluate(el=>{
   const rect=el.getBoundingClientRect(),name=el.querySelector('h2').getBoundingClientRect(),dan=el.querySelector('.cabinet-course').getBoundingClientRect(),rating=el.querySelector('.mainland-rating').getBoundingClientRect(),row=el.querySelector('.cabinet-name-row').getBoundingClientRect(),title=el.querySelector('.player-title').getBoundingClientRect();
   return {ratio:rect.width/rect.height,noOverlap:name.right<=dan.left+.5&&rating.bottom<=row.top+.5&&row.bottom<=title.top+.5,inside:[...el.querySelectorAll('img,h2,.player-title')].every(c=>{const r=c.getBoundingClientRect();return r.left>=rect.left-.5&&r.right<=rect.right+.5&&r.top>=rect.top-.5&&r.bottom<=rect.bottom+.5;}),overflow:document.documentElement.scrollWidth>innerWidth};
  });
  assert.ok(Math.abs(layout.ratio-720/116)<.01);assert.ok(layout.noOverlap);assert.ok(layout.inside);assert.ok(!layout.overflow);
  await page.screenshot({path:path.resolve(__dirname,`../artifacts/cabinet-header-${width}.png`)});
 }
 await page.locator('.cabinet-name-row h2').evaluate(el=>{el.textContent='十六个汉字的超长玩家名称测试示例';});
 assert.equal(await page.locator('.cabinet-name-row h2').evaluate(el=>getComputedStyle(el).textOverflow),'ellipsis');
 assert.deepEqual(errors,[]);console.log('PASS: cabinet header assets, real equipped ranks, intact 720:116 plate and no overlap at 320-1920px.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
