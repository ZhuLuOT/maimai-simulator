const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const runtime=require('node:module').createRequire('C:/Users/ADMIN/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/browser-runtime.js');
const {chromium}=runtime('playwright'),G=require('../engine');
(async()=>{const browser=await chromium.launch({headless:true,channel:'msedge'});try{
 const page=await browser.newPage({viewport:{width:821,height:698}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.headerDraws=[];const original=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(img,...args){window.headerDraws.push({src:img.src,args});return original.call(this,img,...args);};});
 await page.addLocatorHandler(page.locator('[data-action="meal-later"]'),async()=>{await page.locator('[data-action="meal-later"]').click();});
 await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
 await page.locator('input[name="talent"]').first().check();await page.getByRole('button',{name:'开始春季生活'}).click();await page.locator('[data-action="intro-skip"]').click();
 const s=G.create('grinder',42);s.setupDone=true;s.profile.plate='真极';s.profile.title='title-1';s.profile.id='名牌同步检查';
 s.profile.avatar='data:image/png;base64,'+fs.readFileSync(path.resolve(__dirname,'../assets/plates/default.png')).toString('base64');
 const fixture=path.resolve(__dirname,'../artifacts/b50-header-fixture.json');fs.writeFileSync(fixture,JSON.stringify(s));
 await page.getByRole('button',{name:'存档与设置'}).click();await page.locator('#import-save').setInputFiles(fixture);await page.waitForSelector('#import-save',{state:'detached'});
 await page.getByRole('button',{name:'B50',exact:true}).click();await page.locator('[data-action="best-style"][data-value="image"]').click();
 await page.waitForFunction(()=>document.querySelector('[data-b50-image="current"]')?.naturalWidth===1500);
 const png=await page.locator('[data-b50-image="current"]').getAttribute('src');fs.writeFileSync(path.resolve(__dirname,'../artifacts/b50-player-header.png'),Buffer.from(png.split(',')[1],'base64'));
 assert.ok(await page.evaluate(()=>window.headerDraws.some(d=>d.src===window.B50_HEADERS['plate-真极'])&&window.headerDraws.some(d=>d.src===window.B50_HEADERS['rating-normal'])));
 await page.getByRole('button',{name:'日常',exact:true}).click();await page.getByRole('button',{name:'打开聊天软件'}).click();
 await page.getByRole('textbox',{name:'群聊消息'}).fill('B50');await page.getByRole('button',{name:'发送消息',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.chat-b50')?.naturalWidth===1500);
 assert.equal(await page.locator('.chat-b50').getAttribute('src'),png,'chat and current view share the same header');
 const report=await page.evaluate(async()=>{
   const s=Game.create(),snap=Game.b50Snapshot(s);s.profile.plate='真极';s.profile.title=Game.COLLECTIONS.find(c=>c.kind==='title'&&c.id!=='title-1').id;
   const updated=Game.b50Snapshot(s),a=await B50Image.generate(snap),b=await B50Image.generate(updated),results=[];
   const thresholds=[0,1000,2000,4000,7000,10000,12000,13000,14000,14500,15000],colors=['normal','blue','green','orange','red','purple','bronze','silver','gold','platinum','rainbow'];
   for(let i=0;i<thresholds.length;i++){window.headerDraws=[];const out=await B50Image.generate({...updated,rating:thresholds[i],day:2});results.push(out.startsWith('data:image/png;base64,')&&window.headerDraws.some(d=>d.src===B50_HEADERS['rating-'+colors[i]]));}
   return {updated:a!==b,plate:snap.plate,results};
 });
 assert.ok(report.updated,'changing equipment invalidates the image cache');assert.equal(report.plate,'default');assert.ok(report.results.every(Boolean),'all eleven frames render and export on file://');
 assert.deepEqual(errors,[]);console.log('PASS: current player plate/avatar/title, identical chat image, equipment cache refresh, 11 mainland Rating frames, offline PNG export.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
