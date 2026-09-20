const assert=require('node:assert/strict'),G=require('../engine');
exports.observe=s=>{assert.ok(s.major.bird,'outing must start an observation');const entry=s.major.bird.entry;for(let i=0;i<600&&s.major.bird;i++){const b=s.major.bird;G.birdStep(s,b.position+b.velocity*5>b.target);}assert.ok(s.world.entries.includes(entry),'tracking the bird must complete a record');};
