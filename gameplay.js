(function(root){
  'use strict';
  const CITY=typeof module!=='undefined'?require('./city'):root.City;
  let G,pool=[];const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),rand=s=>{s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296;};
  const genres=['流行&动漫','niconico & VOCALOID','东方Project','音击&中二节奏','舞萌','其他游戏'];
  function ensure(s){s.learning??={};s.selectedCharts??=[];s.videoEvent??=null;s.npcBoasts??={day:s.day,count:0};s.crowdAlerts??=[];while(s.crowdAlerts.length<6)s.crowdAlerts.push({high:false,last:-1});s.npcs?.forEach((n,i)=>{n.genre??=genres[i%genres.length];n.tendency??=i%2?'key':'star';n.risk??=.2+(i%5)*.12;n.lastBoast??=0;n.bestAchievement??=0;n.hesitateUntil??=0;});if(s.trip)s.trip.staminaSpent??=0;}
  function tag(c){if(c.ds<10||c.index===0)return null;if(c.index===1&&c.tag==='easy')return null;return c.tag||null;}
  function effective(s,c){if(tag(c)!=='ghost'||!Number.isFinite(c.fit))return c.ds;const learned=s.learning?.[G.key(c)];return learned==='clear'?(c.tendency==='star'?c.ds:Math.floor((c.ds+c.fit)*5)/10):Math.max(c.ds,c.fit);}
  function easyActive(s,c){return tag(c)==='easy'&&Number.isFinite(s?.rating)&&Math.abs(c.ds-s.rating/1110)<=1;}
  function score(s,c){return easyActive(s,c)?.16:tag(c)==='ghost'&&!(s.practice[G.key(c)]||s.learning[G.key(c)])?-.45:0;}
  function growth(c,s){return tag(c)==='ghost'?1.3:easyActive(s,c)?.7:1;}
  function staminaCost(s,c){const notes=c.notes.reduce((a,b)=>a+b,0);return (1+notes/180)*Math.pow(Math.max(3,c.ds)/10,1.7)*(s.instinct?1.35:1);}
  function recover(s,minutes){s.stamina=clamp(s.stamina+minutes*.35,0,s.maxStamina);if(minutes>=15)s.consecutive=0;}
  function mealTime(s){return s.clock>=660&&s.clock<840||s.clock>=1020&&s.clock<1200;}
  function canSkipMeal(s){return s.phase==='meal'&&!mealTime(s)&&(s.trip?.staminaSpent||0)<25&&s.stamina>=60;}
  function choose(n,s,count=1){const level=clamp(n.rating/1110,5,15.1),candidates=pool.filter(c=>!G.isUtage(c)&&c.ds>=level-.65&&c.ds<=level+.5+n.risk);let remaining=candidates.length?candidates:pool.filter(c=>!G.isUtage(c));if(n.id==='小凛'){const vocal=remaining.filter(c=>c.genre==='niconico & VOCALOID');remaining=vocal.length?vocal:pool.filter(c=>!G.isUtage(c)&&c.genre==='niconico & VOCALOID').sort((a,b)=>Math.abs(a.ds-level)-Math.abs(b.ds-level)).slice(0,12);}const out=[];const signature=n.id==='Toqin'?pool.filter(c=>c.title==='TiamaT:F minor'&&!G.isUtage(c)).sort((a,b)=>Math.abs(a.ds-level)-Math.abs(b.ds-level)).slice(0,1):n.id==='鲁米诺'?remaining.filter(c=>tag(c)==='ghost'):[];if(signature.length&&count>0){out.push(signature[Math.floor(rand(s)*signature.length)]);remaining=remaining.filter(c=>c.id!==out[0].id);}for(let i=out.length;i<count&&remaining.length;i++){const weights=remaining.map(c=>1+(c.genre===n.genre?3:0)+(c.tendency===n.tendency?2:0)+(c.ds>level?1:0)),total=weights.reduce((a,b)=>a+b,0);let x=rand(s)*total,index=weights.length-1;for(let j=0;j<weights.length;j++){x-=weights[j];if(x<=0){index=j;break;}}out.push(remaining[index]);remaining=remaining.filter((_,j)=>j!==index);}return out;}
  function message(s,id,text,extra={}){const n=s.npcs.find(n=>n.id===id);if(n&&!extra.self){G.postNPCMessage(s,n,text,extra);return;}s.chat.push({id,text:String(text).slice(0,100),day:s.day,time:s.clock,...extra});s.chat=s.chat.slice(-60);}
  const J=typeof module!=='undefined'?require('./judgement'):root.Judgement;
  const praise=['这么强！？','龙B来了','太强了！这段我还在练。','好成绩！下次教教我。','恭喜推分，今天状态真好。','这就是你的实力吗！','恭喜拿下！','我先抄作业了。','手元交一下！','这也能推，厉害。'];
  const canBoast=(c,r)=>c.ds>=12.4&&(r.achievement>100.5||r.combo==='AP');
  function crowdChat(s){
    if(!s.crowdAlerts)return;
    const now=(s.day-1)*1440+s.clock;
    G.unlockedArcades(s).forEach(({name,id:i})=>{
      const alert=s.crowdAlerts[i];if(!G.arcadeIsOpen(s,i)){alert.high=false;return;}const count=G.peopleAt(s,i),high=count>10;
      if(high&&!alert.high&&(alert.last<0||now-alert.last>=180)){
        alert.last=now;
        const index=Math.floor(rand(s)*s.npcs.length),a=s.npcs[index],b=s.npcs[(index+1)%s.npcs.length],c=s.npcs[(index+2)%s.npcs.length];
        message(s,a.id,`${name}现在 ${count} 人，大B队来了！`);
        message(s,b.id,['这么多人，我先看看再决定出不出勤。','排队怕是要好久，要不晚点再去？','本来想出门的，等人数少一点吧。'][Math.floor(rand(s)*3)]);
        message(s,c.id,['我也犹豫了，先吃个饭。','那我先不去了，有空位再叫我。','我晚一点，先在群里蹲人数。'][Math.floor(rand(s)*3)]);
        b.hesitateUntil=Math.max(b.hesitateUntil,now+45);c.hesitateUntil=Math.max(c.hesitateUntil,now+45);
      }
      alert.high=high;
    });
  }
  function npcTick(s,blocks){
    if(!pool.length||!G.unlockedArcades(s).some(a=>G.arcadeIsOpen(s,a.id)))return;
    if(s.npcBoasts.day!==s.day)s.npcBoasts={day:s.day,count:0};
    const now=(s.day-1)*1440+s.clock;
    for(const n of s.npcs){
      if(n.id==='小凛'&&G.linArcade(s)===null||/上班中|上课中|休息中|准备上班/.test(G.npcStatus(s,n))||(s.clock<G.OPEN||s.clock>=G.CLOSE)&&!G.denVisitors(s).some(x=>x.id===n.id)||now<n.hesitateUntil||rand(s)>Math.min(.8,blocks*.08*n.activity))continue;
      const c=choose(n,s)[0];if(!c)continue;
      const level=n.rating/1110,expected=clamp(99.4-(c.ds-level)*1.3+(rand(s)-.5)*2,85,100.95);
      const simulated={seed:s.seed,skills:{star:level+(n.tendency==='star'?.2:0),key:level+(n.tendency==='key'?.2:0)},practice:{},condition:2};
      const result=J.simulate(simulated,c,expected,level);s.seed=simulated.seed;
      n.rating=clamp(n.rating+Math.floor(Math.max(0,result.achievement-97)*n.activity),0,16900);
      if(canBoast(c,result)&&n.lastBoast!==s.day&&s.npcBoasts.count<2){
        n.lastBoast=s.day;s.npcBoasts.count++;n.bestAchievement=Math.max(n.bestAchievement,result.achievement);
        message(s,n.id,`${c.title} ${result.achievement.toFixed(4)}%${result.combo==='AP'?' AP':''}！今天推上去了！`,{performance:{key:G.key(c),ds:c.ds,achievement:result.achievement,combo:result.combo}});
        const other=s.npcs.find(x=>x.id!==n.id&&x.tendency===n.tendency)||s.npcs.find(x=>x!==n);
        message(s,other.id,praise[Math.floor(rand(s)*praise.length)]);
      }else G.npcAfterPlay(s,n);
    }
  }
  function watch(s){if(s.ending||s.phase!=='home'||s.school.pending||s.event!==null||s.videoEvent||s.city.encounter||s.world?.notice||s.world?.mahjong.active)throw Error('先完成当前事件，再刷视频。');G.advance(s,30);if(s.ending)return;s.mood=clamp(s.mood+7,0,100);const candidates=pool.filter(c=>tag(c)==='ghost'&&!G.isUtage(c)&&Math.abs(c.ds-G.ability(s,c))<=1);if(candidates.length&&rand(s)<.65){const c=candidates[Math.floor(rand(s)*candidates.length)],clear=rand(s)<clamp(.25+(s.skills.reading-c.ds)*.08,.12,.75);s.videoEvent={key:G.key(c),outcome:clear?'clear':'partial'};G.log(s,`刷到 ${c.title} ${G.displayLevel(c)} 的手元，停下来研究了一会儿。`,'event');}else G.log(s,'刷视频 30 分钟，心情 +7。','heart');G.check(s);}
  function learn(s){if(!s.videoEvent||s.ending)throw Error('当前没有待观看的手元。');const {key,outcome}=s.videoEvent;if(s.learning[key]!=='clear')s.learning[key]=outcome;s.videoEvent=null;G.log(s,`${outcome==='clear'?'大彻大悟':'似懂非懂'}：记住了这张谱面的处理方法。`,'event');}
  function snapshot(s){const b=G.best(s),compact=r=>({id:r.id,index:r.index,title:r.title,type:r.type,ds:r.ds,achievement:r.achievement,ra:r.ra,combo:r.bestCombo||r.combo||'',isNew:r.isNew});return {classRank:G.friendRank(s),courseRank:Math.max(0,...s.competition.courses),name:s.profile.id,plate:s.profile.plate,title:s.profile.title,avatar:s.profile.avatar||root.AVATARS?.[0]?.src||null,rating:s.rating,day:s.day,old:b.old.map(compact),fresh:b.fresh.map(compact)};}
  function bot(s,text){const q=text.trim().toLowerCase().replace(/^@bot\s*/,''),isBot=/^@bot/i.test(text);if(!isBot&&!['b50','jk','几卡','f8fq','运势','今日运势','每日运势','jrrp','塔罗','塔罗牌','tarot'].includes(q))return false;const reply=CITY.bot(s,q);if(reply?.ended)return true;message(s,s.profile.id,text,{self:true});if(reply?.text){message(s,'bot',reply.text);return true;}if(q==='f8fq'){message(s,'bot','不要念辣个');}else if(q==='b50'){s.chat.forEach(m=>{if(m.b50){delete m.b50;m.text='之前的 B50 图片已归档，输入 B50 查看最新成绩。';}});message(s,'bot','你的 B50 成绩图',{b50:snapshot(s)});}else if(['jk','几卡'].includes(q)){message(s,'bot',G.unlockedArcades(s).map(a=>`${a.name.split(' · ')[0]}：${G.peopleAt(s,a.id)} 人 / ${a.cabinets} 台机组`).join('\n'));}else message(s,'bot','快捷指令：B50 查成绩；jk / 几卡 查人数（每天各首查免费，之后每次 2 分钟）；运势 / jrrp 看今日运势；塔罗 / tarot 抽牌（2–3 分钟）。');return true;}
  function valid(s){const segmentValid=r=>!r.segmentEvent||(typeof r.segmentEvent.tag==='string'&&typeof r.segmentEvent.scene==='string'&&r.segmentEvent.scene.length<100&&typeof r.segmentEvent.passed==='boolean'&&Number.isFinite(r.segmentEvent.loss)&&r.segmentEvent.loss>=0&&r.segmentEvent.loss<=101&&Number.isInteger(r.segmentEvent.misses)&&r.segmentEvent.misses>=0&&r.segmentEvent.misses<=100000);const chartKey=k=>typeof k==='string'&&/^\d+:\d$/.test(k)&&(!pool.length||pool.some(c=>G.key(c)===k)),score=r=>r&&/^\d+$/.test(r.id)&&Number.isInteger(r.index)&&r.index>=0&&r.index<=4&&typeof r.title==='string'&&r.title.length<300&&['SD','DX'].includes(r.type)&&Number.isFinite(r.ds)&&r.ds>0&&r.ds<=20&&Number.isFinite(r.ra)&&r.ra>=0&&r.ra<=500&&Number.isFinite(r.achievement)&&r.achievement>=0&&r.achievement<=101;return [...Object.values(s.records),...(s.last?.results||[]),...(s.trip?.played||[])].every(segmentValid)&&Array.isArray(s.crowdAlerts)&&s.crowdAlerts.length===6&&s.crowdAlerts.every(a=>a&&typeof a.high==='boolean'&&Number.isInteger(a.last)&&a.last>=-1&&a.last<=G.DAYS*1440)&&s.npcs.every(n=>Number.isInteger(n.hesitateUntil)&&n.hesitateUntil>=0&&n.hesitateUntil<=(G.DAYS+1)*1440)&&Array.isArray(s.selectedCharts)&&s.selectedCharts.length<=3&&s.selectedCharts.every(chartKey)&&s.npcs.every(n=>genres.includes(n.genre)&&['star','key'].includes(n.tendency)&&Number.isFinite(n.risk)&&n.risk>=0&&n.risk<=1)&&s.npcBoasts&&Number.isInteger(s.npcBoasts.day)&&s.npcBoasts.day>=1&&s.npcBoasts.day<=G.DAYS&&Number.isInteger(s.npcBoasts.count)&&s.npcBoasts.count>=0&&s.npcBoasts.count<=2&&(!s.videoEvent||chartKey(s.videoEvent.key))&&(!s.trip||Number.isFinite(s.trip.staminaSpent)&&s.trip.staminaSpent>=0)&&s.chat.every(m=>(!m.performance||chartKey(m.performance.key)&&Number.isFinite(m.performance.ds)&&m.performance.ds>=12.4&&m.performance.ds<=20&&Number.isFinite(m.performance.achievement)&&m.performance.achievement>=0&&m.performance.achievement<=101&&['','FC','FC+','AP'].includes(m.performance.combo)&&canBoast(m.performance,m.performance))&&(!m.b50||(m.b50.classRank===undefined||Number.isInteger(m.b50.classRank)&&m.b50.classRank>=0&&m.b50.classRank<=25)&&(m.b50.courseRank===undefined||Number.isInteger(m.b50.courseRank)&&m.b50.courseRank>=0&&m.b50.courseRank<=10)&&(m.b50.plate===undefined||G.collectionItem(m.b50.plate)?.kind==='plate')&&(m.b50.title===undefined||G.collectionItem(m.b50.title)?.kind==='title')&&(m.b50.avatar==null||typeof m.b50.avatar==='string'&&m.b50.avatar.length<300000&&/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(m.b50.avatar))&&typeof m.b50.name==='string'&&m.b50.name.length<=16&&Number.isFinite(m.b50.rating)&&m.b50.rating>=0&&m.b50.rating<=30000&&Number.isInteger(m.b50.day)&&m.b50.day>=1&&m.b50.day<=G.DAYS&&Array.isArray(m.b50.old)&&m.b50.old.length<=35&&m.b50.old.every(score)&&Array.isArray(m.b50.fresh)&&m.b50.fresh.length<=15&&m.b50.fresh.every(score)));}
  function install(api){G=api;Object.assign(api,{displayLevel:c=>typeof c==='object'&&c.level?c.level:String(Math.floor(typeof c==='object'?c.ds:c))+(Math.round((typeof c==='object'?c.ds:c)*10)%10>=6?'+':''),effectiveDifficulty:effective,scoreAdjustment:score,growthMultiplier:growth,staminaCost,canSkipMeal,watchVideos:watch,learnVideo:learn,b50Snapshot:snapshot});}
  const api={ensure,valid,tag,effective,score,growth,recover,staminaCost,canSkipMeal,npcTick,crowdChat,canBoast,choose,bot,install,setPool:p=>{pool=p;}};if(typeof module!=='undefined')module.exports=api;else root.Gameplay=api;
})(globalThis);
