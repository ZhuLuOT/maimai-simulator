(function(root){
 'use strict';let G;
 const STYLES={outer:{name:'外键',star:-.4,key:.4},inner:{name:'内屏',star:.4,key:-.4}};
 const INTRO=[
  [[0,'为什么目标是 W6？'],['self','因为我之前做过一个梦。'],[1,'什么梦？'],['self','梦见有人和我说，没打到万六，世界就会毁灭。'],[0,'那先从今天的一枚游戏币开始吧。']],
  [[1,'梦里的倒计时，是从 3 月到 6 月的 122 天。W6 就是 Rating 16,000。'],['self','我该先干什么？'],[0,'先处理课表或工作，再看机厅人数。出门带手套，选交通、买饮料；排到你时再选歌。'],[1,'一轮结束先看成绩。等别人打时恢复体力，饮料和手套不够就补给。']],
  [[0,'不用每首都越级。先填满 B50，练熟喜欢的歌，再尝试稍高于底力的难度。'],[1,'钱包每天会扣生活费，租房的 25 日要交租。心情低就去娱乐，别把自己打崩了。'],['self','先打好今天，再一步步向万六走。'],[0,'小目标放在日常页面。机厅之外，也有人和风景值得认识。']]
 ];
 const GOALS=[
  {id:'first-pc',name:'第一枚游戏币',text:'完成一轮上机。先看人数，准备手套和饮料，轮到你再选曲。',target:1,value:s=>s.credits,reward:{money:30,label:'¥30'},action:'attend'},
  {id:'first-s',name:'找到自己的节奏',text:'任意普通谱面达到 S（97%）。从推荐曲中找适合当前底力的歌。',target:1,value:s=>Object.values(s.records).filter(r=>!G.isUtage(r)&&r.achievement>=97).length,reward:{skills:{star:.15,key:.15},label:'星星力 +0.15 · 键盘力 +0.15'},action:'attend'},
  {id:'practice',name:'这次比上次熟悉',text:'同一谱面累计游玩 3 次，感受熟练度与读谱力的提升。',target:3,value:s=>Math.max(0,...Object.values(s.practice)),reward:{skills:{reading:.25},label:'读谱力 +0.25'},action:'attend'},
  {id:'ten-charts',name:'把歌单打开',text:'让 B50 收录 10 张不同谱面。新旧版本都试一试。',target:10,value:s=>{const b=G.best(s);return b.old.length+b.fresh.length;},reward:{skills:{reading:.2},label:'读谱力 +0.20'},action:'attend'},
  {id:'social',name:'记住一个名字',text:'在舞萌群聊一次；输入 @bot 还能查看人数与 B50 指令。',target:1,value:s=>s.guide.chatted?1:0,reward:{familiarity:5,label:'群友眼熟度 +5'},action:'chat'},
  {id:'outing',name:'也看看广州',text:'去街巷或景点走走，给心情充电，也许会发现新店。',target:1,value:s=>s.city.walks,reward:{mood:12,label:'心情 +12'},action:'entertain'},
  ...[10000,12000,14000,15000].map((n,i)=>({id:'rating-'+n,name:['迈入万分','稳步向前','摸到高难门槛','最后一千分'][i],text:`达到 ${n.toLocaleString('en-US')} Rating。补齐 B50，复打熟歌，再挑战略高于底力的谱面。`,target:n,value:s=>s.rating,reward:[{skills:{star:.25,key:.25},label:'星星力 +0.25 · 键盘力 +0.25'},{skills:{star:.25,key:.25,reading:.25},label:'三项底力各 +0.25'},{skills:{star:.3,key:.3,reading:.3},label:'三项底力各 +0.30'},{skills:{star:.35,key:.35,reading:.35},label:'三项底力各 +0.35'}][i],action:'attend'}))
 ];
 function ensure(s){s.playStyle??='balanced';s.guide??={introDone:true,step:0,claimed:[],chatted:s.logs.some(l=>l.text==='在舞萌群聊了 5 分钟。')};s.guide.posted??=0;s.roundReview??=false;s.chat=s.chat.filter(m=>!m.intro);
  if(s.guide.rewardVersion===undefined){for(const id of s.guide.claimed){const g=GOALS.find(g=>g.id===id);if(g)applyReward(s,g.reward,false);}if(s.guide.claimed.includes('rating-12000'))s.city.denUnlocked=true;s.guide.rewardVersion=3;}
  else if(s.guide.rewardVersion===2){if(s.guide.claimed.includes('rating-12000')){applyReward(s,GOALS.find(g=>g.id==='rating-12000').reward,false);s.city.denUnlocked=true;}s.guide.rewardVersion=3;}
 }
 function start(s,style){if(!STYLES[style])throw Error('请选择外键或内屏。');s.playStyle=style;s.skills.star+=STYLES[style].star;s.skills.key+=STYLES[style].key;s.guide={introDone:false,step:0,claimed:[],chatted:false,posted:0,rewardVersion:3};}
 function introMessages(s,from=0,to=s.guide.step){return INTRO.slice(from,to+1).flatMap(lines=>lines.map(([who,text])=>({id:who==='self'?s.profile.id:s.npcs[who].id,text,day:s.day,time:s.clock,...(who==='self'?{self:true}:{}),intro:true})));}
 function postIntro(s){if(s.guide.introDone||s.guide.posted>s.guide.step)return false;s.guide.posted=s.guide.step+1;return true;}
 function goals(s){return GOALS.map(g=>{const value=Math.min(g.target,g.value(s));return {...g,value,done:value>=g.target,claimed:s.guide.claimed.includes(g.id)};});}
 function applyReward(s,r,money=true){if(money)s.money+=r.money||0;for(const [skill,amount] of Object.entries(r.skills||{}))s.skills[skill]=Math.min(22,s.skills[skill]+amount);if(r.mood)s.mood=Math.min(100,s.mood+r.mood);if(r.familiarity)s.npcs.forEach(n=>n.familiarity=Math.min(100,n.familiarity+r.familiarity));}
 function inviteToDen(s){if(s.city.denUnlocked)return;s.city.denUnlocked=true;s.chat.push({id:s.npcs[1].id,text:G.homeText(s,'给你发个地址：不眠猫窝，全天开。¥30 / 小时，打歌不另收费，凌晨也能打，记得留钱回家。'),day:s.day,time:s.clock});s.chat=s.chat.slice(-60);G.log(s,'鲁米诺发来了不眠猫窝的地址，机厅地图已更新。','event');}
 function claim(s,id){const g=goals(s).find(g=>g.id===id);if(s.phase!=='home'||s.ending)throw Error(`回${G.residence(s)}后再领取小目标奖励。`);if(!g?.done||g.claimed)throw Error('目标尚未达成或已领取。');s.guide.claimed.push(id);applyReward(s,g.reward);G.log(s,`小目标「${g.name}」达成：${g.reward.label}。`,'event');}
 function valid(s){return ['balanced','outer','inner'].includes(s.playStyle)&&typeof s.roundReview==='boolean'&&s.guide&&s.guide.rewardVersion===3&&typeof s.guide.introDone==='boolean'&&typeof s.guide.chatted==='boolean'&&Number.isInteger(s.guide.posted)&&s.guide.posted>=0&&s.guide.posted<=3&&Number.isInteger(s.guide.step)&&s.guide.step>=0&&s.guide.step<=2&&Array.isArray(s.guide.claimed)&&new Set(s.guide.claimed).size===s.guide.claimed.length&&s.guide.claimed.every(id=>GOALS.some(g=>g.id===id));}
 function install(api){G=api;Object.assign(api,{PLAY_STYLES:STYLES,startGuide:start,introMessages,postIntro,goals,claimGoal:claim,inviteToDen});}
 const api={ensure,install,valid};if(typeof module!=='undefined')module.exports=api;else root.Guidance=api;
})(globalThis);
