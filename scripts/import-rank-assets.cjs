const fs=require('node:fs'),path=require('node:path');
async function main(){
  for(const [kind,count] of [['class_rank',25],['course_rank',23]]){
    const dir=path.resolve(__dirname,'../assets',kind);fs.mkdirSync(dir,{recursive:true});
    for(let i=0;i<=count;i++){
      const url=`https://raw.githubusercontent.com/Lxns-Network/maimai-prober-frontend/main/public/assets/maimai/${kind}/${i}.webp`;
      const dest=path.join(dir,`${i}.webp`);if(fs.existsSync(dest))continue;
      const r=await fetch(url.replace('raw.githubusercontent.com','cdn.jsdelivr.net/gh').replace('/main/','@main/'),{signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error(`${url}: ${r.status}`);
      fs.writeFileSync(dest,Buffer.from(await r.arrayBuffer()));
    }
    console.log(`${kind}: ${count+1} assets`);
  }
}
main().catch(e=>{console.error(e);process.exitCode=1;});
