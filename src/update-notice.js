export function watchRelease({current,notify,fetchRelease,setInterval:repeat=globalThis.setInterval}) {
  let checking=false,announced='';
  async function check(){
    if(checking)return;
    checking=true;
    try{
      const release=await fetchRelease();
      if(!release||typeof release.version!=='string'||!/^\w[\w.-]{0,79}$/.test(release.version))return;
      if(release.version!==current&&release.version!==announced){announced=release.version;notify(release);}
    }catch{/* Offline players can continue until the next successful check. */}
    finally{checking=false;}
  }
  const timer=repeat(check,60000);
  check();
  return {check,timer};
}

export function installUpdateNotice({current,save,hasSave}){
  const key='attendance-release';
  let dialog=null;
  function show(release){
    if(!dialog){
      dialog=document.createElement('dialog');dialog.className='release-dialog';
      dialog.setAttribute('aria-labelledby','release-title');
      dialog.addEventListener('cancel',e=>e.preventDefault());
      dialog.addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();dialog.querySelector('button').focus();}});
      document.body.append(dialog);
    }
    dialog.replaceChildren();
    const title=document.createElement('h2');title.id='release-title';title.textContent='游戏已更新，请刷新';
    const description=document.createElement('p');description.textContent=release.summary||'新版本已就绪，刷新后继续当前进度。';
    const status=document.createElement('p');status.setAttribute('role','status');
    const button=document.createElement('button');button.className='primary-btn';button.textContent='保存进度并刷新';
    button.addEventListener('click',()=>{
      if(save()===false){status.textContent='保存失败，暂未刷新。请释放浏览器存储空间后重试。';return;}
      try{localStorage.setItem(key,release.version);}catch{}
      const url=new URL(location.href);url.searchParams.set('v',release.version);location.replace(url.href);
    });
    dialog.append(title,description,status,button);
    if(!dialog.open)dialog.showModal();
  }
  try{
    const seen=localStorage.getItem(key);
    if(hasSave&&seen!==current)show({version:current,summary:'修复麻将结算后返回猫窝卡住的问题。新增隐藏猫头鹰与白云山深夜观鸟结局；猫窝改为聊天解锁，12000 Rating 奖励三项底力。高底力成长放缓，新增真实节假日日历，开场对话独立展示。赛季仍于 6 月 30 日结束。'});
    else if(!seen)localStorage.setItem(key,current);
  }catch{}
  if(!/^https?:$/.test(location.protocol))return;
  const watcher=watchRelease({current,notify:show,fetchRelease:async()=>{
    const response=await fetch(new URL('version.json?t='+Date.now(),location.href),{cache:'no-store',signal:AbortSignal.timeout(10000)});
    if(!response.ok)throw Error('Release unavailable');
    return response.json();
  }});
  window.addEventListener('focus',watcher.check);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)watcher.check();});
}
