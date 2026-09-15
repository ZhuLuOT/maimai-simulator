(function(root){
  'use strict';
  let G;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),rand=s=>{s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296;};
  const ARCADES=[
    {id:0,name:'星光游艺 · 大学城店',km:1.8,cabinets:2,offset:0},
    {id:1,name:'街角电玩 · 老街店',km:3.2,cabinets:2,offset:-5},
    {id:2,name:'次元空间 · 商场店',km:2.4,cabinets:4,offset:4},
    {id:3,name:'珠江游艺 · 海珠店',km:7.6,cabinets:3,offset:-2},
    {id:4,name:'西关电玩 · 荔湾店',km:10.2,cabinets:2,offset:-4}
  ];
  const OUTINGS=[
    {id:'stroll',name:'出去闲逛',place:'广州街巷',time:90,cost:0,stamina:10,mood:14,icon:'footprints'},
    {id:'yuexiu',name:'越秀公园',place:'五羊石像与林荫步道',time:150,cost:8,stamina:18,mood:27,icon:'trees'},
    {id:'shamian',name:'沙面岛',place:'榕树与骑楼街景',time:150,cost:8,stamina:14,mood:25,icon:'camera'},
    {id:'canton',name:'花城广场',place:'珠江新城与广州塔夜景',time:120,cost:8,stamina:12,mood:23,icon:'building-2'},
    {id:'yongqing',name:'永庆坊',place:'西关骑楼与粤剧艺术博物馆',time:150,cost:8,stamina:16,mood:26,icon:'map-pinned'},
    {id:'movie',name:'看一场电影',place:'附近电影院',time:150,cost:38,stamina:0,mood:30,icon:'film'},
    {id:'music',name:'听音乐',place:'在家听歌',time:45,cost:0,stamina:0,mood:9,icon:'headphones'},
    {id:'games',name:'和群友联机',place:'线上游戏',time:60,cost:0,stamina:0,mood:12,icon:'gamepad-2'}
  ];
  const RESTAURANTS=[
    {id:'rice-roll',name:'西关肠粉小店',cost:16,time:30,mood:22,stamina:45,buff:.06,icon:'utensils',note:'心情 +22 · 体力 +45 · 饱足 +0.06'},
    {id:'wonton',name:'竹升云吞面馆',cost:24,time:35,mood:25,stamina:50,buff:.08,icon:'soup',note:'心情 +25 · 体力 +50 · 饱足 +0.08'},
    {id:'claypot',name:'老街煲仔饭',cost:32,time:45,mood:30,stamina:60,buff:.1,icon:'cooking-pot',note:'心情 +30 · 体力 +60 · 饱足 +0.10'}
  ];
  const TAROT=['愚者','魔术师','女祭司','皇后','皇帝','教皇','恋人','战车','力量','隐者','命运之轮','正义','倒吊人','死神','节制','恶魔','高塔','星星','月亮','太阳','审判','世界'];
  function ensure(s){s.city??={arcades:[0,1,2],restaurants:[],visited:[],encounter:false,walks:0,foodUntil:0,foodBuff:0};s.botUsage??={day:s.day,b50:0,crowd:0,fortune:null,tarot:0};s.competition??={wins:0,losses:0,draws:0,battle:false,courses:[],last:null};}
  const now=s=>(s.day-1)*1440+s.clock;
  function say(s,id,text){s.chat.push({id,text:text.slice(0,100),day:s.day,time:s.clock});s.chat=s.chat.slice(-60);}
  function spend(s,time){if(s.city.encounter)throw Error('先回应偶遇事件。');if(!G.canSpendTime(s,time)||s.phase==='play'&&s.clock+time>G.availableUntil(s))throw Error('剩余时间不足，或与课表 / 工作冲突。');G.advance(s,time);}
  function explore(s,id){
    if(s.phase!=='home'||s.ending||s.school.pending||s.event!==null||s.videoEvent||s.city.encounter)throw Error('先完成当前事件或出勤。');
    const x=OUTINGS.find(x=>x.id===id);if(!x)throw Error('请选择活动。');if(s.money<x.cost||s.stamina<x.stamina)throw Error('金钱或体力不足。');
    spend(s,x.time);if(s.ending)return;s.money-=x.cost;s.stamina-=x.stamina;s.mood=clamp(s.mood+x.mood,0,100);
    G.log(s,`${x.name} · ${x.place}：${x.time} 分钟，¥${x.cost}，心情 +${x.mood}${x.stamina?`，体力 -${x.stamina}`:''}。`,'heart');
    if(x.stamina){
      s.city.walks++;if(!s.city.visited.includes(id))s.city.visited.push(id);
      const roll=rand(s);
      if(roll<.22&&!s.loveFailed&&s.love===0&&G.canSpendTime(s,10)){s.city.encounter=true;G.log(s,'在街角遇到拎着舞萌手套的小凛，她似乎也认出了你。','event');}
      else if(roll<.45&&s.city.arcades.length<ARCADES.length){const a=ARCADES.find(a=>!s.city.arcades.includes(a.id));s.city.arcades.push(a.id);G.log(s,`发现新机厅：${a.name}！已加入机厅地图。`,'event');say(s,s.profile.id,`散步发现了${a.name}，有 ${a.cabinets} 台机组！`);say(s,s.npcs[2].id,'新店！下次一起去探探。');say(s,s.npcs[7].id,'我先记下了，人少就去出勤。');}
      else if(roll<.7&&s.city.restaurants.length<RESTAURANTS.length){const r=RESTAURANTS.find(r=>!s.city.restaurants.includes(r.id));s.city.restaurants.push(r.id);G.log(s,`发现${r.name}，记下地址，下机后可以来吃。`,'event');}
      else G.log(s,`走过${x.place}，今天的广州也有值得停下来的风景。`,'heart');
    }else if(id==='games')s.npcs.forEach(n=>n.familiarity=clamp(n.familiarity+1,0,100));
    G.check(s);
  }
  function encounter(s,choice){if(!s.city.encounter||s.ending)throw Error('没有待回应的偶遇。');if(![0,1].includes(choice))throw Error('请选择回应。');s.city.encounter=false;try{spend(s,10);}catch(e){s.city.encounter=true;throw e;}if(s.ending)return;if(choice===0){s.love=1;s.nextLoveVisit=s.visits+2;s.mood=clamp(s.mood+8,0,100);G.log(s,'你和小凛聊起舞萌，互加了好友，约好下次机厅见。','heart');}else G.log(s,'你们点头打了招呼，各自继续散步。','heart');}
  function meals(s){return [...G.MEALS,...RESTAURANTS.filter(r=>s.city.restaurants.includes(r.id))];}
  function food(s,m){if(m.buff){s.city.foodBuff=m.buff;s.city.foodUntil=now(s)+240;G.log(s,`吃得很满足，接下来 4 小时预期达成率 +${m.buff.toFixed(2)}%。`,'heart');}}
  function bot(s,q){
    if(!['b50','jk','几卡','运势','今日运势','每日运势','jrrp','塔罗','塔罗牌','tarot'].includes(q))return null;
    if(s.botUsage.day!==s.day)s.botUsage={day:s.day,b50:0,crowd:0,fortune:null,tarot:0};
    const u=s.botUsage,kind=q==='b50'?'b50':['jk','几卡'].includes(q)?'crowd':['塔罗','塔罗牌','tarot'].includes(q)?'tarot':'fortune';
    const time=kind==='tarot'?2+Math.floor(rand(s)*2):['b50','crowd'].includes(kind)&&u[kind]>0?2:0;
    if(time)spend(s,time);if(s.ending)return {ended:true};
    if(u.day!==s.day)s.botUsage={day:s.day,b50:0,crowd:0,fortune:null,tarot:0};
    const today=s.botUsage;if(kind!=='fortune')today[kind]++;
    if(kind==='fortune'){
      if(today.fortune===null)today.fortune=Math.floor(rand(s)*101);
      return {text:`今日运势：${today.fortune}/100 · ${today.fortune>=80?'宜推分，也记得吃饭。':today.fortune>=40?'稳稳来，熟歌也有新收获。':'慢一点，留些时间照顾自己。'}（仅供娱乐）`};
    }
    if(kind==='tarot'){const card=TAROT[Math.floor(rand(s)*TAROT.length)],upright=rand(s)<.5;return {text:`塔罗：${card} · ${upright?'正位':'逆位'}。${upright?'把注意力放回当下，认真完成想做的一件事。':'放慢节奏，看看是否忽略了休息与生活。'}耗时 ${time} 分钟，仅供娱乐。`};}
    return {time};
  }
  function valid(s){const c=s.city,u=s.botUsage,p=s.competition,int=(x,max)=>Number.isInteger(x)&&x>=0&&x<=max;
    const day=x=>int(x,s.day)&&x>=1,syncs=['','sync','fs','fsp','fsd','fsdp'],scores=[...Object.values(s.records),...(s.last?.results||[]),...(s.trip?.played||[])];
    if(!scores.every(r=>(r.bestSync===undefined||syncs.includes(r.bestSync))&&(r.sync===undefined||syncs.includes(r.sync))&&(!r.opponent||typeof r.opponent.id==='string'&&r.opponent.id.length<=30&&int(r.opponent.index,4)&&Number.isFinite(r.opponent.achievement)&&r.opponent.achievement>=0&&r.opponent.achievement<=101&&['','FC','FC+','AP'].includes(r.opponent.combo))))return false;
    const battle=b=>b&&typeof b.opponent==='string'&&b.opponent.length<=30&&['wins','losses','draws'].includes(b.outcome)&&['ours','theirs'].every(k=>Number.isFinite(b[k])&&b[k]>=0&&b[k]<=404)&&day(b.day);
    if(p?.last&&!battle(p.last)||s.last?.battle&&!battle(s.last.battle))return false;
    if(p?.lastCourse&&(!int(p.lastCourse.level,10)||p.lastCourse.level<1||!int(p.lastCourse.life,300)||typeof p.lastCourse.passed!=='boolean'||p.lastCourse.passed!==(p.lastCourse.life>0)||!day(p.lastCourse.day)))return false;
    return !!c&&Array.isArray(c.arcades)&&[0,1,2].every(i=>c.arcades.includes(i))&&new Set(c.arcades).size===c.arcades.length&&c.arcades.every(i=>int(i,4))&&Array.isArray(c.restaurants)&&c.restaurants.length<=3&&c.restaurants.every(id=>RESTAURANTS.some(r=>r.id===id))&&Array.isArray(c.visited)&&c.visited.length<=5&&c.visited.every(id=>OUTINGS.some(x=>x.id===id&&x.stamina))&&typeof c.encounter==='boolean'&&int(c.walks,20000)&&Number.isFinite(c.foodBuff)&&c.foodBuff>=0&&c.foodBuff<=.1&&int(c.foodUntil,(G.DAYS+1)*1440)&&!!u&&int(u.day,G.DAYS)&&u.day>=1&&['b50','crowd','tarot'].every(k=>int(u[k],1e5))&&(u.fortune===null||int(u.fortune,100))&&!!p&&['wins','losses','draws'].every(k=>int(p[k],1e5))&&typeof p.battle==='boolean'&&Array.isArray(p.courses)&&new Set(p.courses).size===p.courses.length&&p.courses.length<=10&&p.courses.every(n=>int(n,10)&&n>=1);
  }
  function install(api){G=api;Object.assign(api,{ARCADES,OUTINGS,RESTAURANTS,unlockedArcades:s=>ARCADES.filter(a=>s.city.arcades.includes(a.id)),explore,answerEncounter:encounter,mealOptions:meals,foodBonus:s=>now(s)<s.city.foodUntil?s.city.foodBuff:0});}
  const api={ensure,valid,install,food,bot,say,spend};if(typeof module!=='undefined')module.exports=api;else root.City=api;
})(globalThis);
