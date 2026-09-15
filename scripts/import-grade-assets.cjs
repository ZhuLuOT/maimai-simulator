const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
(async()=>{
 const dir=path.resolve(__dirname,'../assets/grades');fs.mkdirSync(dir,{recursive:true});
 const ranks=['d','c','b','bb','bbb','a','aa','aaa','s','sp','ss','ssp','sss','sssp'];
 const sources=await Promise.all(ranks.map(async rank=>{
  const file=`music_icon_${rank}.png`,url=`https://maimai.wahlap.com/maimai-mobile/img/${file}`;
  const r=await fetch(url,{signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error(`${url}: ${r.status}`);
  const bytes=Buffer.from(await r.arrayBuffer());if(bytes.readUInt32BE(0)!==0x89504e47)throw Error('Expected PNG: '+file);
  fs.writeFileSync(path.join(dir,file),bytes);return {rank,file,url,sha256:crypto.createHash('sha256').update(bytes).digest('hex')};
 }));fs.writeFileSync(path.join(dir,'sources.json'),JSON.stringify({source:'华立舞萌 DX 国服官网，原图未改绘',files:sources},null,2));console.log(`Saved ${sources.length} grade icons.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
