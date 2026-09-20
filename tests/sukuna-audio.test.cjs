const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const moduleReady=import('data:text/javascript;base64,'+fs.readFileSync(require.resolve('../src/sukuna-audio.js')).toString('base64'));
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function fixture(random=()=>0,play=()=>Promise.resolve()){
 const {createSukunaAudio}=await moduleReady,players=[];
 const controller=createSukunaAudio({random,makeAudio(src){const a={src,paused:true,calls:0,play(){this.calls++;this.paused=false;return play();},pause(){this.paused=true;},removeAttribute(){this.src='';},load(){}};players.push(a);return a;}});
 return {controller,players,state:{ending:null,major:{duel:{stage:'intro'}}}};
}
test('both random tracks persist; renders, stages and reload do not reroll',async()=>{
 for(const [roll,id] of [[0,'yuai'],[.99,'aizo']]){
  const {controller:c,players,state:s}=await fixture(()=>roll);
  assert.equal(c.sync(s),true);await tick();assert.equal(s.major.duel.music,id);
  for(const stage of ['intro','select','battle','win','draw']){s.major.duel.stage=stage;assert.equal(c.sync(s),false);}
  assert.equal(players.length,1);assert.equal(players[0].calls,1);assert.equal(c.status,'playing');
  c.sync(JSON.parse(JSON.stringify(s)));await tick();assert.equal(players.length,2);assert.ok(players[0].paused);assert.ok(players[1].src.endsWith(id+'.mp3'));
 }
});
test('autoplay denial retries on interaction; manual pause survives render and reload',async()=>{
 let allowed=false;const {controller:c,players,state:s}=await fixture(()=>0,()=>allowed?Promise.resolve():Promise.reject(Object.assign(new Error(),{name:'NotAllowedError'})));
 c.sync(s);await tick();assert.equal(c.status,'blocked');assert.match(c.label,/播放《雨爱》/);
 allowed=true;c.retry();await tick();assert.equal(c.status,'playing');c.toggle();assert.ok(s.major.duel.musicPaused);
 c.retry();c.sync(s);await tick();assert.equal(players[0].calls,2);assert.equal(c.status,'paused');
 c.sync(JSON.parse(JSON.stringify(s)));await tick();assert.equal(players[1].calls,0);assert.equal(c.status,'paused');
 c.toggle();await tick();assert.equal(c.status,'playing');
});
test('closing, replacing a save and late play promises cannot leave old music playing',async()=>{
 let finish;const {controller:c,players,state:s}=await fixture(()=>0,()=>new Promise(resolve=>{finish=resolve;}));
 c.sync(s);s.major.duel.stage='done';c.sync(s);finish();await tick();assert.equal(c.active,false);assert.ok(players[0].paused);assert.equal(players[0].src,'');
 s.major.duel.stage='intro';c.sync(s);const pending=finish;c.sync({ending:'good',major:s.major});pending();await tick();assert.equal(c.active,false);assert.ok(players[1].paused);
 s.ending=null;c.sync(s);finish();await tick();c.stop();assert.ok(players[2].paused);
});
test('rapid pause/play keeps the latest playback; load errors offer retry',async()=>{
 const pending=[];const {controller:c,players,state:s}=await fixture(()=>0,()=>new Promise(resolve=>pending.push(resolve)));
 c.sync(s);c.toggle();c.toggle();pending[0]();await tick();assert.equal(players[0].paused,false);pending[1]();await tick();assert.equal(c.status,'playing');
 players[0].onerror();assert.equal(c.status,'error');assert.match(c.label,/重试播放/);c.toggle();pending[2]();await tick();assert.equal(c.status,'playing');
});
