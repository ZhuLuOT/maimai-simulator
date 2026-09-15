const fs=require('node:fs'),path=require('node:path');
const runtime=require('node:module').createRequire('C:/Users/ADMIN/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/browser-runtime.js'),sharp=runtime('sharp');
(async()=>{
 const response=await fetch('https://maimai.lxns.net/api/v0/maimai/icon/list');if(!response.ok)throw Error(response.status);
 const {icons}=await response.json(),selected=icons.filter(c=>![2,3,10].includes(c.id)).slice(0,96),items=[];
 const dir=path.resolve(__dirname,'../assets/avatars');fs.mkdirSync(dir,{recursive:true});
 for(const c of selected){const file=path.join(dir,c.id+'.webp'),url=`https://assets2.lxns.net/maimai/icon/${c.id}.png`;
  if(!fs.existsSync(file)){const r=await fetch(url,{signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error(`${url}: ${r.status}`);await sharp(Buffer.from(await r.arrayBuffer())).resize(160,160,{fit:'cover'}).webp({quality:88}).toFile(file);}
  items.push({id:c.id,name:c.id===1?'默认头像':c.name,src:'data:image/webp;base64,'+fs.readFileSync(file).toString('base64'),source:url});
 }
 fs.writeFileSync(path.resolve(__dirname,'../data/avatars.js'),'window.AVATARS = '+JSON.stringify(items)+';\n');console.log(`Cached ${items.length} original avatars.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
