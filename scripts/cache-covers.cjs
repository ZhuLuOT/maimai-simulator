const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {createRequire}=require('node:module');
const requireRuntime=createRequire('C:/Users/ADMIN/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/image-runtime.js');
const sharp=requireRuntime('sharp');
const context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../data/music.js'),'utf8'),context);
const dir=path.join(__dirname,'../assets/covers');fs.mkdirSync(dir,{recursive:true});
const list=context.window.MUSIC_DATA;let cursor=0,done=0;const failed=[];
async function worker(){
  while(cursor<list.length){
    const song=list[cursor++],target=path.join(dir,`${song.id}.webp`);
    if(fs.existsSync(target)){done++;continue;}
    let success=false;
    const num=Number(song.id);
    const urls=[song.cover,...[num%100000,num%10000,num%10000+10000].map(id=>`https://www.diving-fish.com/covers/${String(id).padStart(5,'0')}.png`),`https://assets.lxns.net/maimai/jacket/${num%10000}.png`];
    for(const url of [...new Set(urls)]){
      try{const response=await fetch(url,{signal:AbortSignal.timeout(20000)});if(!response.ok)continue;
        const bytes=Buffer.from(await response.arrayBuffer());await sharp(bytes).resize(160,160,{fit:'cover'}).webp({quality:82}).toFile(target);success=true;break;
      }catch{}
    }
    if(!success)failed.push(song.id);
    done++;if(done%100===0)console.log(`${done}/${list.length} covers processed`);
  }
}
Promise.all(Array.from({length:6},worker)).then(()=>{
  const manifest={sources:['https://www.diving-fish.com/covers/','https://assets.lxns.net/maimai/jacket/'],retrievedAt:new Date().toISOString(),count:list.length,downloaded:list.length-failed.length,failed};
  fs.writeFileSync(path.join(__dirname,'../data/covers-report.json'),JSON.stringify(manifest,null,2));console.log(JSON.stringify(manifest));
});
