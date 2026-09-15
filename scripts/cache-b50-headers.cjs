const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),dest=path.join(root,'assets/b50-headers');
fs.mkdirSync(dest,{recursive:true});
function cache(key,file){
  const content=`(window.B50_HEADERS??={})[${JSON.stringify(key)}]=${JSON.stringify('data:image/'+(file.endsWith('.webp')?'webp':'png')+';base64,'+fs.readFileSync(file).toString('base64'))};`;
  const target=path.join(dest,key+'.js');
  if(!fs.existsSync(target)||fs.readFileSync(target,'utf8')!==content)fs.writeFileSync(target,content);
}
for(const file of fs.readdirSync(path.join(root,'assets/plates')))if(file.endsWith('.png'))cache('plate-'+path.basename(file,'.png'),path.join(root,'assets/plates',file));
for(const color of ['normal','blue','green','orange','red','purple','bronze','silver','gold','platinum','rainbow'])cache('rating-'+color,path.join(root,'assets/rating/wahlap',`rating_base_${color}.png`));
for(const file of fs.readdirSync(path.join(root,'assets/cabinet')))if(file.endsWith('.png'))cache('cabinet-'+path.basename(file,'.png'),path.join(root,'assets/cabinet',file));
for(const kind of ['class_rank','course_rank'])for(const file of fs.readdirSync(path.join(root,'assets',kind)))if(file.endsWith('.webp'))cache(kind+'-'+path.basename(file,'.webp'),path.join(root,'assets',kind,file));
for(let n=0;n<10;n++)cache('digit-'+n,path.join(root,'assets/rating/diving-fish',`UI_NUM_Drating_${n}.png`));
