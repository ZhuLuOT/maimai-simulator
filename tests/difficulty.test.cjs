const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const G=require('../engine.js'),J=require('../judgement.js'),ctx={window:{}};
vm.runInNewContext(fs.readFileSync(require.resolve('../data/music.js'),'utf8'),ctx);
const pool=G.charts(ctx.window.MUSIC_DATA);
// Identical note mix isolates difficulty from song length, category and random segment events.
const chart={...pool.find(c=>c.ds===12.7),starWeight:.5,tag:null,tags:[],notes:[600,100,180,60,60]};
function player(skill,seed){
 const s=G.create('grinder',seed);s.seed=seed*9973;s.skills={star:skill,key:skill,reading:skill};
 s.condition=2;s.mood=65;s.stamina=100;s.liquid=1000;s.drink='water';return s;
}
function average(c,skill=8,prepare=()=>{}){
 let score=0,misses=0;
 for(let seed=1;seed<=256;seed++){
  const s=player(skill,seed);prepare(s,c);const r=G.simulate(s,c);
  score+=r.achievement;misses+=r.judgements.miss;
 }
 return {score:score/256,misses:misses/256};
}
test('large difficulty gaps separate 12+ and 15 and keep worsening beyond 14',()=>{
 const levels=[12.7,13.5,14,14.5,15],results=levels.map(ds=>average({...chart,ds}));
 assert.ok(results[0].score-results[4].score>18,'boss scores must be clearly below 12+');
 for(let i=1;i<results.length;i++){
  assert.ok(results[i-1].score-results[i].score>3,`difficulty ${levels[i]} must not flatten`);
  assert.ok(results[i].misses>results[i-1].misses);
 }
});
test('small challenges stay playable and stronger skills improve boss scores',()=>{
 const close=average({...chart,ds:12.7},12),boss=average({...chart,ds:15},12);
 assert.ok(close.score>96&&close.score<100);
 assert.ok(close.score-boss.score>9);
 assert.ok(boss.score>average({...chart,ds:15},8).score+25);
 assert.ok(average({...chart,ds:15},15).score>99);
});
test('the two reported real Re:MASTER charts have a clear score gap',()=>{
 const easier=pool.find(c=>c.id==='414'&&c.index===4),boss=pool.find(c=>c.id==='11663'&&c.index===4);
 assert.equal(easier.level,'12+');assert.equal(boss.level,'15');
 const a=average(easier),b=average(boss);
 assert.ok(a.score-b.score>17,`reported pair still too close: ${a.score} vs ${b.score}`);
});
test('practice and good condition help without cancelling large difficulty gaps',()=>{
 const boss={...chart,ds:15},buff=s=>{s.practice[G.key(boss)]=100;s.mood=100;s.condition=4;s.skills.reading=16;s.drink='pink';};
 const base=average(boss),improved=average(boss,8,buff),easier=average({...chart,ds:12.7},8,buff);
 assert.ok(improved.score>base.score);
 assert.ok(easier.score-improved.score>17);
 const star={...chart,ds:12,starWeight:.85},keys={...star,starWeight:.15};
 const s=player(8,1);s.skills.star=12;
 assert.ok(G.expected(s,star)>G.expected(s,keys)+10,'category ability must still matter');
});
test('extreme losses become misses with valid judgement totals and recomputed scores',()=>{
 const c={...chart,ds:15};let moderate=0,severe=0;
 for(let seed=1;seed<=256;seed++){
  const a=J.simulate(player(8,seed),c,60,8),b=J.simulate(player(8,seed),c,30,8);
  moderate+=a.achievement;severe+=b.achievement;
  for(const r of [a,b]){
   assert.ok(r.achievement>=0&&r.achievement<=101);
   r.judgementGroups.forEach((group,i)=>assert.equal(Object.values(group).reduce((a,b)=>a+b,0),c.notes[i]));
   const {maxCombo,...score}=r;assert.deepEqual(J.calculate(r.judgementGroups,r.breakJudgements),score);
   assert.equal(G.combo(r.judgements),r.combo);
  }
 }
 assert.ok((moderate-severe)/256>20,'severe deficits must not collect at the GREAT score floor');
 const groups=c.notes.map(critical=>({critical,perfect:0,great:0,good:0,miss:0}));
 const perfect=J.calculate(groups,{critical:c.notes[4],perfect50:0,perfect100:0,great80:0,great60:0,great50:0,good:0,miss:0});
 assert.equal(perfect.achievement,101);assert.equal(perfect.combo,'AP');
});
