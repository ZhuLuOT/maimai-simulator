(function(root){
  const cache=new Map(),images=new Map(),colors=['#8cc774','#eac169','#df929a','#b19bcf','#c8b7d9'];
  function jacket(id){if(images.has(id))return images.get(id);const promise=new Promise(resolve=>{const load=()=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src=root.B50_COVERS?.[id]||'';};if(root.B50_COVERS?.[id])load();else{const script=document.createElement('script');script.src=`assets/b50-covers/${encodeURIComponent(id)}.js`;script.onload=load;script.onerror=()=>resolve(null);document.head.append(script);}});images.set(id,promise);return promise;}
  function dataImage(src){return new Promise(resolve=>{if(!src)return resolve(null);const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src=src;});}
  function headerImage(key){
    const id='header:'+key;if(images.has(id))return images.get(id);
    const promise=new Promise(resolve=>{
      const load=()=>dataImage(root.B50_HEADERS?.[key]).then(resolve);
      if(root.B50_HEADERS?.[key])load();else{const script=document.createElement('script');script.src='assets/b50-headers/'+encodeURIComponent(key)+'.js';script.onload=load;script.onerror=()=>resolve(null);document.head.append(script);}
    });images.set(id,promise);return promise;
  }
  async function header(ctx,s,text){
    const frames=['normal','blue','green','orange','red','purple','bronze','silver','gold','platinum','rainbow'];
    const plateId=root.Game.collectionItem(s.plate)?.kind==='plate'?s.plate:'default';
    const keys=['plate-'+plateId,'rating-'+frames[root.Game.ratingTier(s.rating)-1],...String(s.rating).padStart(5,'0').split('').map(d=>'digit-'+d)];
    const [plate,frame,...digits]=await Promise.all(keys.map(headerImage)),avatar=await dataImage(s.avatar);
    ctx.fillStyle='#fffef7';ctx.fillRect(35,30,1430,190);
    if(plate)ctx.drawImage(plate,50,40,920,148.22);
    if(avatar){ctx.save();ctx.beginPath();ctx.roundRect(74,64,100,100,20);ctx.clip();ctx.drawImage(avatar,74,64,100,100);ctx.restore();}
    else{ctx.fillStyle='#eaf5f0';ctx.beginPath();ctx.arc(124,114,46,0,Math.PI*2);ctx.fill();text('♪',102,131,54,'#547548',true);}
    const title=root.Game.collectionItem(s.title)?.name||'新人出道';
    ctx.font='700 20px "Microsoft YaHei", sans-serif';const titleWidth=Math.min(740,ctx.measureText(title).width+28);
    ctx.fillStyle='rgba(255,254,247,.94)';ctx.beginPath();ctx.roundRect(194,62,titleWidth,34,17);ctx.fill();
    ctx.save();ctx.beginPath();ctx.rect(208,62,712,34);ctx.clip();text(title,208,86,20,'#356255',true);ctx.restore();
    ctx.save();ctx.shadowColor='#fffef7';ctx.shadowBlur=6;ctx.font='700 38px "Microsoft YaHei", sans-serif';ctx.fillStyle='#254946';ctx.fillText(s.name,194,145,738);ctx.restore();
    text('舞萌 DX · BEST 50',62,210,20,'#356255',true);text('春季出勤 · 第 '+s.day+' 天',730,210,18);
    const x=1000,y=60,w=440,h=w*86/296;
    if(frame){ctx.drawImage(frame,x,y,w,h);digits.forEach((digit,i)=>{if(!digit)return;const slot=w*.541/5,boxW=slot*.85,boxH=h*.5,scale=Math.min(boxW/digit.width,boxH/digit.height),dw=digit.width*scale,dh=digit.height*scale;ctx.drawImage(digit,x+w*.412+slot*i+(slot-dw)/2,y+h*.23+(boxH-dh)/2,dw,dh);});}
    else text('DX RATING  '+String(s.rating).padStart(5,'0'),1000,125,34,'#547548',true);
  }
  async function generate(s){const key=JSON.stringify(s);if(cache.has(key))return cache.get(key);const work=(async()=>{const canvas=document.createElement('canvas');canvas.width=1500;canvas.height=2100;const ctx=canvas.getContext('2d');ctx.fillStyle='#eaf5f0';ctx.fillRect(0,0,1500,2100);const text=(v,x,y,size=20,color='#254946',bold=false)=>{ctx.font=`${bold?'700':'400'} ${size}px "Microsoft YaHei", sans-serif`;ctx.fillStyle=color;ctx.fillText(v,x,y);};await header(ctx,s,text);
    const all=[...s.old,...s.fresh],loaded=await Promise.all(all.map(r=>jacket(r.id))),covers=new Map(all.map((r,i)=>[r.id,loaded[i]]));
    function section(records,count,startY,label){text(`${label} · ${records.reduce((a,r)=>a+r.ra,0)} RA`,42,startY,29,'#416857',true);for(let i=0;i<count;i++){const r=records[i],x=40+(i%5)*286,y=startY+22+Math.floor(i/5)*169;ctx.fillStyle='#fffef8';ctx.fillRect(x,y,276,157);if(!r){text(`#${i+1}  等待下一首`,x+20,y+78,20,'#a2b3aa');continue;}ctx.fillStyle=colors[r.index];ctx.fillRect(x,y,276,111);const cover=covers.get(r.id);if(cover)ctx.drawImage(cover,x+8,y+10,85,85);let title=r.title;ctx.font='700 16px "Microsoft YaHei", sans-serif';while(ctx.measureText(title).width>168&&title.length>1)title=title.slice(0,-2)+'…';text(title,x+99,y+29,16,'#243833',true);text(r.achievement.toFixed(4)+'%',x+99,y+64,24,'#fff',true);text(`${r.ds.toFixed(1)} → ${r.ra} RA`,x+99,y+92,18,'#253c36');text(`#${i+1} · ${r.type} · ${['BAS','ADV','EXP','MAS','Re:MAS'][r.index]}`,x+8,y+135,15);text(root.Game.rank(r.achievement)+' '+(r.combo||''),x+145,y+135,18,'#547548',true);}}
    section(s.old,35,267,'B35 / 历代版本');section(s.fresh,15,1510,'B15 / 当前版本');text('图中成绩来自出勤模拟器存档；版式参考公开查分器，非真实账号查分。',40,2070,18,'#6c8278');return canvas.toDataURL('image/png');})();cache.set(key,work);if(cache.size>8)cache.delete(cache.keys().next().value);return work;}
  async function hydrate(s){const targets=[...document.querySelectorAll('[data-b50-image]')];for(const img of targets){const index=img.dataset.b50Image,snap=index==='current'?root.Game.b50Snapshot(s):s.chat[Number(index)]?.b50;if(!snap)continue;const token=Symbol();img.b50Token=token;const src=await generate({...snap,plate:snap.plate??s.profile.plate,title:snap.title??s.profile.title,avatar:snap.avatar===undefined?s.profile.avatar:snap.avatar});if(img.isConnected&&img.b50Token===token)img.src=src;}}
  root.B50Image={generate,hydrate};
})(window);
