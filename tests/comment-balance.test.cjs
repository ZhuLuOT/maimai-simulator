const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const G=require('../engine'),J=require('../judgement'),ctx={window:{}};
vm.runInNewContext(fs.readFileSync(require.resolve('../data/music.js'),'utf8'),ctx);
const pool=G.charts(ctx.window.MUSIC_DATA),charts=['11311','779','11379'].map(id=>pool.find(c=>c.id===id&&c.index===3));
function player(seed,skills,plays,c,precision=60,boost=false){
 const s=G.create('grinder',seed*9973);s.skills={star:skills[0],key:skills[1],reading:skills[2]};s.precision.base=precision;s.practice[G.key(c)]=plays;s.mood=boost?100:65;s.condition=boost?4:2;s.liquid=1000;s.drink=boost?'pink':'water';
 if(boost){s.talents=['streak','adapt','ghost','instinct'];s.instinct=true;s.consecutive=5;}
 return s;
}
function sample(c,skills,plays,precision=60,boost=false){let total=0,theory=0,sss=0;
 for(let seed=1;seed<=1024;seed++){const r=G.simulate(player(seed,skills,plays,c,precision,boost),c);total+=r.achievement;theory+=r.achievement===101;sss+=r.achievement>=100.5;
  assert.equal(r.achievement,J.calculate(r.judgementGroups,r.breakJudgements).achievement);assert.equal(r.combo,G.combo(r.judgements));
 }
 return {mean:total/1024,theory,sss};
}
test('reported 14+ charts cannot be overpowered by stacked buffs or one oversized skill',()=>{
 for(const c of charts){const mid=sample(c,[10,14,10],1,65,true),skewed=sample(c,[9,17,10],1,65,true);
  assert.ok(mid.mean<95,c.title);assert.ok(skewed.mean<99.5,c.title);assert.equal(mid.sss,0);assert.equal(skewed.theory,0);
 }
});
test('second sight theory is exceptional even with veteran skills; practice and precision retain high-score progression',()=>{
 for(const c of charts){const fresh=sample(c,[16,16,16],1,60,true),trained=sample(c,[16,16,16],60,95);
  assert.ok(fresh.theory<=1,c.title);assert.ok(trained.mean>fresh.mean+.25);assert.ok(trained.sss>800,'experienced players can still master '+c.title);
 }
});
test('reading limits technical spikes, temporary bonuses are bounded, and Rating does not cap individual scores',()=>{
 const c=charts[0],s=player(42,[9,17,10],1,c,65,true),before=G.baseAbility(s,c);
 assert.ok(G.ability(s,c)-before<=.75+1e-10);s.skills.reading=16;assert.ok(G.baseAbility(s,c)>before+1);
 s.rating=0;const predicted=G.expected(s,c),seed=s.seed;s.rating=16000;assert.equal(G.expected(s,c),predicted);assert.equal(s.seed,seed);
});
test('101 targets still need BREAK timing; AP and theory remain possible and scores persist unchanged on migration',()=>{
 const c=charts[0];let freshTheory=0,trainedTheory=0,sawNonCriticalAP=false;
 for(let seed=1;seed<=2048;seed++){
  const fresh=J.simulate(player(seed,[22,22,22],1,c),c,101,22),trained=J.simulate(player(seed,[22,22,22],200,c,95),c,101,22);
  freshTheory+=fresh.achievement===101;trainedTheory+=trained.achievement===101;sawNonCriticalAP ||= fresh.combo==='AP'&&fresh.achievement<101;
 }
 assert.ok(freshTheory<3);assert.ok(trainedTheory>20);assert.ok(sawNonCriticalAP);
 const s=G.create();s.records[G.key(c)]={...c,achievement:101,ra:G.chartRating(c.ds,101),combo:'AP',bestCombo:'AP'};
 const records=JSON.stringify(s.records),skills=JSON.stringify(s.skills);G.migrate(s);assert.equal(JSON.stringify(s.records),records);assert.equal(JSON.stringify(s.skills),skills);assert.ok(G.validate(s));
});
