const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const G=require('../engine');const ctx={window:{}};vm.runInNewContext(fs.readFileSync(require.resolve('../data/music.js'),'utf8'),ctx);const pool=G.charts(ctx.window.MUSIC_DATA);
function player(){const s=G.create('grinder',42);s.setupDone=true;s.guide.introDone=true;s.nutrition.dismissed=[0];return s;}
test('recommendation locks intersect unplayed and difficulty pools',()=>{
 const s=player(),level=G.displayLevel(pool.find(c=>!G.isUtage(c)&&G.displayLevel(c)==='12+'));
 const first=pool.find(c=>!G.isUtage(c)&&G.displayLevel(c)===level);s.records[G.key(first)]={...first,achievement:100,ra:100,bestCombo:'FC'};
 const list=G.recommend(s,pool,3,[],{unplayed:true,levels:[level]});assert.ok(list.length>0);assert.ok(list.every(c=>!s.records[G.key(c)]&&G.displayLevel(c)===level));
});
test('recommendation lock can target an achievement plate song pool',()=>{
 const s=player(),plate=G.COLLECTIONS.find(c=>c.kind==='plate'&&c.category==='achievement'&&c.required?.some(r=>r.songs?.length));assert.ok(plate);
 const allowed=new Set(plate.required.flatMap(r=>r.songs.flatMap(song=>(r.difficulties?.length?r.difficulties:[0,1,2,3,4]).map(index=>G.key({id:song.id,index})))));
 const list=G.recommend(s,pool,3,[],{charts:[...allowed]});assert.ok(list.length>0);assert.ok(list.every(c=>allowed.has(G.key(c))));
});
test('recommendation options do not alter save state',()=>{const s=player(),before=JSON.stringify({records:s.records,practice:s.practice,rating:s.rating,skills:s.skills});G.recommend(s,pool,3,[],{unplayed:true,levels:['13+']});assert.equal(JSON.stringify({records:s.records,practice:s.practice,rating:s.rating,skills:s.skills}),before);});
