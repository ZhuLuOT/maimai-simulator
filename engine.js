(function(root){
  'use strict';
  const WORLD=typeof module!=='undefined'?require('./world'):root.World;
  const REST=typeof module!=='undefined'?require('./rest-life'):root.RestLife;
  const NEEDS=typeof module!=='undefined'?require('./needs'):root.Needs;
  const R=typeof module!=='undefined'?require('./romance'):root.Romance;
  const GUIDE=typeof module!=='undefined'?require('./guidance'):root.Guidance;
  const COMP=typeof module!=='undefined'?require('./competition'):root.Competition;
  const CITY=typeof module!=='undefined'?require('./city'):root.City;
  const CN=typeof module!=='undefined'?require('./data/cn-versions'):root.CN_VERSIONS;
  const M=typeof module!=='undefined'?require('./gameplay.js'):root.Gameplay;
  const X=typeof module!=='undefined'?require('./systems.js'):root.LifeSystems;
  const LIN=typeof module!=='undefined'?require('./lin-life'):root.LinLife;
  const SOCIAL=typeof module!=='undefined'?require('./social-life'):root.SocialLife;
  const META=typeof module!=='undefined'?require('./data/chart-meta.js'):root.CHART_META;
  const J=typeof module!=='undefined'?require('./judgement.js'):root.Judgement;
  const P=typeof module!=='undefined'?require('./precision'):root.Precision;
  const C=typeof module!=='undefined'?require('./collection.js'):root.Collections;
  const EXP=typeof module!=='undefined'?require('./data/expansion.js'):root.EXPANSION;
  const HOLIDAYS=typeof module!=='undefined'?require('./data/holidays-2026'):root.HOLIDAYS_2026;
  const START=Date.UTC(2026,2,1), DAYS=122, OPEN=600, CLOSE=1410, NIGHT=1440;
  const JOBS={student:{name:'学生',money:1800,monthly:1800,daily:25,mealAllowance:6,rent:0,wage:40,workTime:240,icon:'graduation-cap',detail:'月生活费 ¥1800 · 日常至多 ¥25'},grinder:{name:'挂壁',money:1800,monthly:0,daily:20,mealAllowance:5,rent:600,wage:60,workTime:240,icon:'gamepad-2',detail:'无固定收入 · 月租 ¥600'},worker:{name:'上班族',money:6000,monthly:6000,daily:45,mealAllowance:10,rent:1800,wage:0,workTime:0,icon:'briefcase-business',detail:'月薪 ¥6000 · 月租 ¥1800'}};
  const ARCADE_KM=[1.8,3.2,2.4,7.6,10.2,8.8];
  const TRANSPORT=[{id:'walk',name:'步行',cost:0,time:70,mood:-3,icon:'footprints',note:'慢一点，也能到达'},{id:'bike',name:'骑共享',cost:5,time:36,mood:2,icon:'bike',note:'让晚风先来一首'},{id:'bus',name:'公共交通',cost:8,time:44,mood:0,icon:'bus-front',note:'靠窗的位置刚刚好'},{id:'taxi',name:'打车',cost:30,time:16,mood:4,icon:'car-taxi-front',note:'钱包换时间'}];
  const DRINKS=[{id:'water',name:'大水',cost:5,ml:1000,buff:0,mood:2,icon:'droplet',note:'1000 ml · 心情 +2'},{id:'tea',name:'无糖乌龙茶',cost:5,ml:500,buff:.12,mood:5,icon:'cup-soda',note:'500 ml · 状态 +0.12 · 心情 +5'},{id:'coffee',name:'冰美式',cost:9.9,ml:200,buff:.24,mood:2,icon:'coffee',note:'200 ml · 状态 +0.24 · 心情 +2'},{id:'energy',name:'魔爪',cost:10,ml:300,buff:.2,mood:4,icon:'zap',note:'300 ml · 状态 +0.20 · 心情 +4'},{id:'pink',name:'粉色魔爪',cost:12,ml:300,buff:.35,mood:8,icon:'heart',note:'300 ml · 状态 +0.35 · 心情 +8 · 认识小凛后解锁'}];
  const MEALS=[{id:'home',name:'回家吃饭',cost:0,time:15,mood:5,stamina:30,icon:'house',note:'包含在每日生活费内'},{id:'noodles',name:'街角面馆',cost:15,time:15,mood:14,stamina:40,icon:'soup',note:'额外加餐 · 心情 +14'},{id:'burger',name:'KFC',cost:50,time:15,mood:21,stamina:45,icon:'sandwich',note:'周四疯狂星期四 ¥29.9'},{id:'hotpot',name:'好友火锅',cost:48,time:35,mood:34,stamina:60,icon:'cooking-pot',note:'额外聚餐 · 心情 +34'},{id:'saizeriya',name:'萨莉亚',cost:25,time:15,mood:18,stamina:40,icon:'utensils',note:'心情 +18'}];
  const EVENTS=R.EVENTS;
  const WEEK={1:[{id:'mon-major',name:'程序设计',kind:'major',start:540,end:660},{id:'mon-general',name:'通识选修',kind:'general',start:840,end:900}],2:[{id:'tue-general',name:'大学生涯导论',kind:'general',start:600,end:660},{id:'tue-major',name:'高等数学',kind:'major',start:840,end:960}],3:[{id:'wed-major',name:'专业实验',kind:'major',start:540,end:720}],4:[{id:'thu-general',name:'影视赏析',kind:'general',start:540,end:600},{id:'thu-major',name:'数据结构',kind:'major',start:840,end:960}],5:[{id:'fri-major',name:'专业研讨',kind:'major',start:600,end:720},{id:'fri-general',name:'就业指导',kind:'general',start:840,end:900}]};
  const MODES={solo:{id:'solo',name:'单开',count:3,select:3,cost:6,duration:12,icon:'user-round'},pair:{id:'pair',name:'拼机',count:4,select:2,cost:6,duration:16,icon:'users'}};
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)), key=c=>`${c.id}:${c.index}`;
  const isUtage=c=>!!c.utage||/^\s*\[[^\]]+\]/.test(c.title||'');
  function random(s){s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296;}
  function date(s){return new Date(START+(s.day-1)*86400000);}
  function dateISO(s){return date(s).toISOString().slice(0,10);}
  function dateLabel(s){return `${dateISO(s)} 周${'日一二三四五六'[date(s).getUTCDay()]}`;}
  function dayInfo(s){const iso=dateISO(s),weekday=date(s).getUTCDay(),holiday=HOLIDAYS.holidays.find(h=>iso>=h.start&&iso<=h.end),makeup=HOLIDAYS.makeup[iso];return {iso,weekday,holiday:holiday?.name||'',makeup:makeup?.name||'',scheduleWeekday:makeup?.weekday??weekday,rest:!!holiday||!makeup&&[0,6].includes(weekday)};}
  function time(n){return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;}
  function log(s,text,type='normal'){s.logs.unshift({day:s.day,time:s.clock,text:api.homeText(s,text),type});s.logs=s.logs.slice(0,250);}
  function crowd(s){s.people=2+Math.floor(random(s)*15)+(dayInfo(s).rest?5:0);}
  function create(job='student',seed=Date.now()){
    if(!JOBS[job])job='student';
    const s={version:2,job,seed:seed>>>0,day:1,clock:480,money:JOBS[job].money,mood:78,skills:{star:8,key:8},rating:0,records:{},practice:{},phase:'home',started:false,visits:0,credits:0,tracks:0,people:0,arcade:0,mode:'solo',trip:null,drink:null,last:null,love:0,loveFailed:false,event:null,nextLoveVisit:2,ending:null,logs:[],history:[{day:1,rating:0}],school:{academic:70,failing:false,since:null,talks:0,pending:false},completed:[],rests:0,workCount:0,paidMonths:[],lastSettlement:null};
    crowd(s);X.ensure(s);C.ensure(s);CITY.ensure(s);M.ensure(s);R.ensure(s);GUIDE.ensure(s);NEEDS.ensure(s);REST.ensure(s);WORLD.ensure(s);log(s,'2026 年 3 月 1 日，新学期与新生活开始。','start');return s;
  }
  function end(s,ending){s.ending=ending;s.phase='ending';s.event=null;s.school.pending=false;return true;}
  function check(s){if(s.guide)api.claimHomeGoals(s);s.money=Math.round(s.money*100)/100;if(s.trip)s.trip.cost=Math.round(s.trip.cost*100)/100;if(s.ending)return true;if(s.school.talks>=3)return end(s,'dropout');if(s.mood<=0)return end(s,'burnout');if(s.money<=0)return end(s,'broke');if(s.rating>=16000)return end(s,'good');return false;}
  function schedule(s){
    const info=dayInfo(s);if(info.rest)return [];
    if(s.job==='worker')return [{id:'shift',name:'公司上班',kind:'shift',start:540,end:1080}];
    return s.job==='student'?(WEEK[info.scheduleWeekday]||[]).map(c=>({...c})):[];
  }
  function pending(s){return schedule(s).filter(c=>!s.completed.includes(c.id));}
  function nextObligation(s){return pending(s)[0]||null;}
  function guard(s,phase='home'){if(s.ending)throw Error('这段故事已经结束。');if(s.school.pending)throw Error('请先回应老师约谈。');if(s.event!==null)throw Error('请先回应小凛。');if(s.world?.notice||s.world?.mahjong.active)throw Error('请先完成当前事件或对局。');if(s.city.encounter)throw Error('请先回应街头偶遇。');if(s.videoEvent)throw Error('请先看完当前手元。');if(s.phase!==phase)throw Error('请先完成当前出勤阶段。');}
  function canSpendTime(s,duration,start=s.clock){if(!Number.isInteger(duration)||duration<0||duration>1440)return false;const end=start+duration;if(pending(s).some(c=>start<c.end&&end>c.start))return false;if(end>1440){const tomorrow={...s,day:s.day+1};if(schedule(tomorrow).some(c=>end-1440>c.start))return false;}return true;}
  function rollover(s){
    const j=JOBS[s.job],expense=api.dailyExpense(s),credit=j.daily-expense;NEEDS.settle(s);s.money-=expense;s.lastSettlement={day:s.day,expense};log(s,`今日餐食与日常支出 -¥${expense}${credit?`（已付餐费抵扣 ¥${credit}）`:''}。`,'money');
    if(s.school.talks>=3){end(s,'dropout');return false;}if(s.mood<=0){end(s,'burnout');return false;}if(s.school.failing&&s.day-s.school.since+1>=10){end(s,'dropout');return false;}if(s.day===DAYS){if(!check(s))end(s,'ordinary');return false;}
    s.day++;s.clock=0;s.completed=[];s.absences=[];s.rests=0;s.workCount=0;s.queueUntil=['play','drink'].includes(s.phase)?Math.max(0,s.queueUntil-NIGHT):0;
    const d=date(s),month=d.getUTCMonth()+1;
    if(d.getUTCDate()===1&&j.monthly){s.money+=j.monthly;log(s,`${s.job==='worker'?'工资':'生活费'}到账 +¥${j.monthly}。`,'money');}
    if(d.getUTCDate()===25&&j.rent){if(s.money<j.rent){log(s,`25 日房租到期，余额不足 ¥${j.rent}。`,'money');end(s,'rent');return false;}s.money-=j.rent;s.paidMonths.push(month);log(s,`本月房租已缴 -¥${j.rent}。`,'money');}
    X.rollCondition(s);crowd(s);s.history.push({day:s.day,rating:s.rating});return !check(s);
  }
  function advance(s,duration,movement=null){return REST.advance(s,duration,movement);}
  function academicChange(s,amount){
    s.school.academic=clamp(s.school.academic+amount,0,100);
    if(s.school.academic===0&&!s.school.failing){s.school.failing=true;s.school.since=s.day;s.school.pending=true;log(s,'学力归零：进入挂科状态，老师要求约谈。','school');}
    if(s.school.failing&&s.school.academic>=20){s.school.failing=false;s.school.since=null;log(s,'学力恢复到 20，挂科状态解除。','school');}
  }
  function resolveClass(s,id,attend=true){
    guard(s);const c=nextObligation(s);if(!c||c.id!==id)throw Error('请按时间顺序处理日程。');if(c.kind==='shift'&&!attend)throw Error('上班日必须完成固定工作。');
    if(attend){s.nutrition.away=true;if(!REST.attend(s,c)||s.ending)return;s.mood=clamp(s.mood-(c.kind==='shift'?15:c.kind==='major'?7:3),0,100);if(s.job==='student')academicChange(s,c.kind==='major'?5:2);log(s,`${c.name}结束，时间 ${time(s.clock)}。`,c.kind==='shift'?'work':'school');}
    else{const major=c.kind==='major',caught=random(s)<(major?.75:.35);academicChange(s,-(major?12:4)-(caught?(major?5:2):0));if(caught)s.mood=clamp(s.mood-(major?10:5),0,100);log(s,`逃过${major?'专业课':'水课'}「${c.name}」：${caught?'被老师发现':'未被发现'}，学力 -${(major?12:4)+(caught?(major?5:2):0)}。`,'school');}
    s.completed.push(c.id);s.started=true;X.tick(s);check(s);
  }
  function teacher(s){if(!s.school.pending||s.ending)throw Error('当前没有老师约谈。');const c=nextObligation(s),duration=Math.min(20,Math.max(0,(c?c.start:NIGHT)-s.clock));advance(s,duration);if(s.ending)return;s.school.pending=false;s.school.talks++;s.mood=clamp(s.mood-5,0,100);log(s,`第 ${s.school.talks} 次约谈（${duration} 分钟）：尽快补习，学力达到 20 可解除挂科。`,'school');check(s);}
  function workIncome(s){return s.job==='worker'?0:Math.min(s.job==='grinder'?150:100,JOBS[s.job].wage+Math.floor((s.totalWorkCount||0)/2)*(s.job==='grinder'?8:5));}
  function daily(s,action){
    guard(s);if(action==='sleep')return sleep(s);if(action==='nap')return sleep(s,'nap');
    if(action==='work'){if(s.clock<360||s.clock+JOBS[s.job].workTime>NIGHT)throw Error('00:00–06:00 不可打工，兼职也不能跨过午夜。');if(s.job==='worker')throw Error('上班族不能额外打工。');if(s.workCount>=2)throw Error('每天最多接两次兼职。');const workDay=s.day;advance(s,JOBS[s.job].workTime);if(s.ending)return;s.nutrition.away=true;if(s.day===workDay)s.workCount++;const income=workIncome(s);s.totalWorkCount++;s.money+=income;s.mood=clamp(s.mood-12,0,100);log(s,`兼职 4 小时，收入 ¥${income}，心情 -12。`,'work');}
    else if(action==='fun'){if(s.money<35)throw Error('娱乐需要 ¥35。');advance(s,120);if(s.ending)return;s.money-=35;s.nutrition.away=true;s.mood=clamp(s.mood+26,0,100);log(s,'娱乐 2 小时，花费 ¥35，心情 +26。','heart');}
    else if(action==='rest')throw Error('小憩已移除，请等待或吃饭恢复体力。');
    else if(action==='study'){if(s.job!=='student')throw Error('只有学生可以补习课程。');advance(s,120);if(s.ending)return;academicChange(s,12);s.mood=clamp(s.mood-3,0,100);log(s,'复习 2 小时，学力 +12，心情 -3。','school');}
    else if(action==='wait'){const c=nextObligation(s),target=c?Math.min(c.start,s.clock+60):s.clock<OPEN?Math.min(OPEN,s.clock+60):s.clock+60;if(target<=s.clock)throw Error(c?'日程已经开始，请处理课表或上班。':'现在不需要等待。');const minutes=target-s.clock;advance(s,minutes);if(s.ending)return;M.recover(s,minutes);log(s,`时间来到 ${time(s.clock)}。`);}
    else throw Error('未知行动。');if(action==='work')s.stamina=Math.max(0,s.stamina-15);check(s);
  }
  function sleep(s,kind='full'){return REST.sleep(s,kind);}
  const pcPrice=(s,arcade=s.arcade)=>api.ARCADES[arcade]?.allNight?0:6;
  const entryPrice=(s,arcade=s.arcade)=>api.ARCADES[arcade]?.allNight?30:0;
  const allNight=(s,arcade=s.arcade)=>!!api.ARCADES[arcade]?.allNight;
  const arcadeIsOpen=(s,arcade=s.arcade)=>allNight(s,arcade)||s.clock>=OPEN&&s.clock<CLOSE;
  function peopleAt(s,arcade=s.arcade){if(!arcadeIsOpen(s,arcade))return 0;if(arcade===5)return api.denVisitors(s).length;return Math.max(0,s.people+(api.ARCADES[arcade]?.offset||0)+X.crowdOffset(s)+(s.crowdShift||0))+(api.linArcade(s)===arcade?1:0);}
  function roundInfo(s,arcade=s.arcade,mode=s.mode){
    const m=MODES[mode];if(!m)throw Error('未知上机模式。');const people=peopleAt(s,arcade),cabinets=api.ARCADES[arcade]?.cabinets||2;
    // Paired sessions serve two people simultaneously, rather than two sequential turns.
    const groups=mode==='pair'?Math.ceil(people/2):people,queue=Math.floor(groups/cabinets)*m.duration;return {...m,cost:pcPrice(s,arcade),people,cabinets,queue,total:queue+m.duration};
  }
  function roundMinutes(s,arcade=s.arcade,mode=s.mode){return MODES[mode].duration+(s.phase==='play'?Math.max(0,s.queueUntil-s.clock):roundInfo(s,arcade,mode).queue);}
  function startTrip(s){guard(s);if(!arcadeIsOpen(s)&&s.city.denUnlocked)s.arcade=5;s.phase='travel';}
  function setMode(s,mode){if(!['travel','play'].includes(s.phase)||!MODES[mode])throw Error('当前不能切换模式。');if(mode==='pair'&&peopleAt(s)===0)throw Error('机厅暂无其他玩家，暂时不能拼机。');if(s.mode===mode)return;s.mode=mode;s.partnerSongs=null;if(s.phase==='play')X.choosePartner(s);}
  function transportOptions(arcade=0){if(!api.ARCADES[arcade])throw Error('请选择机厅。');return TRANSPORT.map(t=>{if(arcade>=3){const km=ARCADE_KM[arcade];return {...t,time:2*Math.ceil(t.id==='walk'?km*12:t.id==='bike'?km*4+3:t.id==='bus'?km*1.5+10:km*1.2+5),cost:t.id==='walk'?0:t.id==='bike'?Math.ceil(km/2)*3:t.id==='bus'?6:Math.ceil(km*4)};}const offset=arcade===1?20:arcade===2?10:0;return {...t,time:t.id==='bus'&&arcade!==0?(arcade===1?36:30):t.time+offset,cost:t.id==='bus'&&arcade!==0?4:t.cost};});}
  function travel(s,id,arcade=s.arcade){
    guard(s,'travel');const t=transportOptions(arcade).find(t=>t.id===id);if(!t||!api.unlockedArcades(s).some(a=>a.id===arcade))throw Error('请选择交通和机厅。');
    const den=allNight(s,arcade),oneWay=t.time/2,arrival=s.clock+oneWay,ready=den?arrival:Math.max(OPEN,arrival),r=roundInfo(s,arcade),entry=entryPrice(s,arcade);
    if(!den&&s.clock<360)throw Error('机厅已打烊，10:00 开门；凌晨可闲逛或前往全天营业的猫窝。');if(!den&&(ready+5+r.total>CLOSE))throw Error('机厅 23:30 结束游玩，今天来不及上机了。');if(s.money<t.cost+entry+r.cost)throw Error(den?'余额不足以支付交通与首小时 ¥30。':`交通费之外还需保留 ¥${r.cost} 上机。`);
    if(!canSpendTime(s,ready-s.clock+5+r.total+oneWay+35))throw Error(`出勤会与课程 / 上班冲突或来不及回${api.residence(s)}，请先处理日程。`);
    s.money-=t.cost;advance(s,ready-s.clock,{direction:'out',arcade,oneWay});if(s.ending)return;s.money-=entry;s.mood=clamp(s.mood+t.mood,0,100);s.arcade=arcade;s.started=true;s.visits++;s.nutrition.away=true;s.phase='drink';s.crowdSeen={arcade,count:peopleAt(s)};
    s.trip={cost:t.cost+entry,rounds:0,played:[],ratingBefore:s.rating,skillsBefore:{...s.skills},transport:t.name,returnTime:oneWay,staminaSpent:0,crowd:peopleAt(s),start:s.clock,startDay:s.day,...(den?{denMinutes:0,denHours:1}:{})};s.last=null;s.roundReview=false;C.distance(s,ARCADE_KM[arcade]);
    X.tick(s);s.consecutive=0;s.queueUntil=s.clock+5+roundInfo(s).queue;X.choosePartner(s);log(s,`${t.name}到达${api.ARCADES[arcade].name}，${peopleAt(s)} 人在店${entry?`，首小时 ¥${entry}`:''}。`,'trip');check(s);
  }
  function drink(s,id){guard(s,'drink');const reason=api.bottleReason(s,id);if(reason)throw Error(reason);api.packDrink(s,id);s.phase='play';}
  function availableUntil(s){const den=allNight(s),back=s.trip?.returnTime||0;if(!den&&!arcadeIsOpen(s))return s.clock;const c=nextObligation(s),tomorrow=schedule({...s,day:s.day+1})[0],limit=den?(tomorrow?1440+tomorrow.start-back-35:1440+s.clock):CLOSE;return Math.min(limit,c?c.start-back-35:limit);}
  function playReason(s){if(s.phase!=='play'||s.ending)return '不在上机阶段';if(s.mode==='pair'&&(s.partner===null||peopleAt(s)===0))return '没有可拼机的玩家，请改单开或等待有人到店';if(api.timeChargeReason(s,MODES[s.mode].duration,pcPrice(s)))return api.timeChargeReason(s,MODES[s.mode].duration,pcPrice(s));if(s.money<pcPrice(s))return `余额不足 ¥${pcPrice(s)}`;if(s.gloves.durability<MODES[s.mode].count*1.75*s.gloves.wear)return '手套耐久不足一轮，请更换手套';if(s.stamina<12)return '体力不足，请等待或下机吃饭';if(s.clock+roundMinutes(s)>availableUntil(s))return allNight(s)?`剩余时间不足，请留出回${api.residence(s)}或处理日程的时间`:'剩余时间不足，或接近机厅 23:30 闭店';if(s.queueUntil>s.clock)return `正在排队，还需 ${s.queueUntil-s.clock} 分钟`;return '';}
  function coefficient(a){if(a>=100.5)return 22.4;if(a>=100.4999)return 22.2;if(a>=100)return 21.6;if(a>=99.9999)return 21.4;if(a>=99.5)return 21.1;if(a>=99)return 20.8;if(a>=98.9999)return 20.6;if(a>=98)return 20.3;if(a>=97)return 20;if(a>=96.9999)return 17.6;if(a>=94)return 16.8;if(a>=90)return 15.2;if(a>=80)return 13.6;if(a>=79.9999)return 12.8;if(a>=75)return 12;if(a>=70)return 11.2;if(a>=60)return 9.6;if(a>=50)return 8;return Math.floor(Math.max(0,a)/10)*1.6;}
  function chartRating(ds,a){a=clamp(a,0,100.5);return Math.floor(ds*a/100*coefficient(a));}
  function rank(a){return a>=100.5?'SSS+':a>=100?'SSS':a>=99.5?'SS+':a>=99?'SS':a>=98?'S+':a>=97?'S':a>=94?'AAA':a>=90?'AA':a>=80?'A':a>=75?'BBB':a>=70?'BB':a>=60?'B':a>=50?'C':'D';}
  function ratingTier(r){return r>=15000?11:r>=14500?10:r>=14000?9:r>=13000?8:r>=12000?7:r>=10000?6:r>=7000?5:r>=4000?4:r>=2000?3:r>=1000?2:1;}
  function best(s){const all=Object.values(s.records).filter(r=>!isUtage(r)).sort((a,b)=>b.ra-a.ra||b.achievement-a.achievement);return {old:all.filter(r=>!r.isNew).slice(0,35),fresh:all.filter(r=>r.isNew).slice(0,15)};}
  function recalculate(s){for(const r of Object.values(s.records)){r.ra=isUtage(r)?0:chartRating(r.ds,r.achievement);const cn=CN.map[r.id];if(cn){r.originalVersion??=r.version;r.version=cn.version;r.isNew=cn.versionCode===Math.max(...CN.versions.map(v=>v.version));}}const b=best(s);s.rating=[...b.old,...b.fresh].reduce((sum,r)=>sum+r.ra,0);}
  function charts(songs){const result=songs.flatMap(song=>song.ds.map((ds,index)=>{const source=song.notes?.[index]||[200,20,40,10],n=source.length===4?[source[0],source[1],source[2],0,source[3]]:source,ratio=n[2]/Math.max(1,n.reduce((a,b)=>a+b,0)),meta=META.entries[`${song.id}:${index}`],override=META.overrides[`${song.id}:${index}`],tags=EXP.chartTags[`${song.id}:${index}`]||[],star=tags.includes('星星谱'),keyboard=tags.includes('键盘谱'),starWeight=override?.starWeight??(star&&!keyboard?.85:keyboard&&!star?.15:tags.some(t=>['错位','一笔画'].includes(t))?Math.max(.65,clamp(ratio*2.4,.12,.88)):clamp(ratio*2.4,.12,.88));return {id:song.id,title:song.title,type:song.type,ds,index,level:song.level[index],isNew:CN.map[song.id]?CN.map[song.id].versionCode===Math.max(...CN.versions.map(v=>v.version)):song.isNew,artist:song.artist,genre:song.genre,version:CN.map[song.id]?.version||song.version.replace('maimai ',''),originalVersion:song.version,cover:song.cover,notes:n,starWeight,tendency:starWeight>=.5?'star':'key',fit:meta?.fit,samples:meta?.samples,tag:M.tag({ds,index,tag:meta?.tag}),comparison:meta?.other,utage:isUtage(song),tags,classification:override?'人工校正':tags.some(t=>['星星谱','键盘谱','错位','一笔画'].includes(t))?'DXRating 社区标签':'音符占比估算'};}).filter(c=>c.ds>0));M.setPool(result);api.setLinPool(result);return result;}
  function ability(s,c){const bonuses=(s.liquid>0?(DRINKS.find(d=>d.id===s.drink)?.buff||0):0)+(s.mood-65)/180+X.abilityBonus(s,c);const base=baseAbility(s,c),difficulty=M.effective(s,c);return base-Math.max(0,base-difficulty)*.15+Math.min(.75,bonuses)-(s.school.failing?.2:0);}
  function familiarity(plays){return plays===0?-.55:Math.min(.85,.12*Math.log2(plays+1));}
  function expected(s,c){const plays=s.practice[key(c)]||0,difficulty=M.effective(s,c),skill=ability(s,c);
    const predicted=100.65-J.difficultyPenalty(difficulty,skill)+familiarity(plays)+X.scoreBonus(s,c)+M.score(s,c)+api.foodBonus(s)+api.worldScoreBonus(s,c)-Math.max(0,s.consecutive-3)*.04;
    // High technical ability alone cannot substitute for knowing the chart and accurate timing.
    const ease=clamp(Math.exp(-Math.max(0,skill-difficulty)*.32),.15,1),masteryLoss=(.12+.65/(1+plays/6)+(100-P.value(s))*.0045)*ease;
    return clamp(Math.min(predicted,101-masteryLoss),0,101);
  }
  function combo(j){if(j.miss>0)return '';if(j.good>0)return 'FC';if(j.great>0)return 'FC+';return 'AP';}
  function simulate(s,c){const chart={...c,ds:M.effective(s,c)};return J.segment(s,chart,J.simulate(s,chart,expected(s,c),ability(s,c)));}
  function preparePartner(s,pool){if(s.mode!=='pair'||s.partner===null||peopleAt(s)===0)return [];if(!s.partnerSongs)s.partnerSongs=X.partnerCharts(s,pool,MODES.pair.count-X.selectCount(s)).map(c=>({id:c.id,index:c.index,playerIndex:pool.filter(p=>p.id===c.id).sort((a,b)=>Math.abs(a.ds-ability(s,a))-Math.abs(b.ds-ability(s,b)))[0].index}));return s.partnerSongs;}
  function setPartnerDifficulty(s,slot,index,pool){guard(s,'play');const item=preparePartner(s,pool)[slot];if(!item||!pool.some(c=>c.id===item.id&&c.index===index))throw Error('这首曲目没有该难度。');item.playerIndex=index;}
  function baseAbility(s,c){const technical=s.skills.star*c.starWeight+s.skills.key*(1-c.starWeight);return technical-Math.max(0,technical-s.skills.reading-1)*.4;}
  function levelValue(c){const level=api.displayLevel(c);return parseInt(level,10)+(level.endsWith('+')?.5:0);}
  function challengeThreshold(rating){return rating>=14000?14.5:rating>=13000?14:rating>=12000?13.5:rating>=11000?12:11.5;}
  function isOverreach(rating,c,achievement=c.achievement){return !isUtage(c)&&levelValue(c)>=challengeThreshold(rating)&&Number.isFinite(achievement)&&achievement<=97;}
  function growthFactor(s,c){const raw=c.ds-baseAbility(s,c),gap=J.difficultyValue?J.difficultyValue(c.ds)-J.difficultyValue(baseAbility(s,c)):raw,base=clamp(1-Math.abs(gap)*.18,.2,1),average=(s.skills.star+s.skills.key+s.skills.reading)/3,advanced=Math.max(0,average-10),maturity=1/(1+advanced*.5+advanced*advanced*.2);return base*maturity*(gap>0&&gap<1.5?1+.5*Math.min(1,gap/.4,(1.5-gap)/.5):1);}
  function recommend(s,pool,count=X.selectCount(s),exclude=[]){
    const b=best(s),oldFloor=b.old.length<35?0:b.old.at(-1).ra,newFloor=b.fresh.length<15?0:b.fresh.at(-1).ra;
    const excluded=new Set(exclude.map(c=>c.id)),recent=new Set((s.last?.results||[]).map(c=>c.id));
    const all=pool.filter(c=>!isUtage(c)).map(c=>{
      const gap=(J.difficultyValue?J.difficultyValue(c.ds)-J.difficultyValue(Math.min(15,baseAbility(s,c))):c.ds-Math.min(15,baseAbility(s,c))),gain=chartRating(c.ds,expected(s,c))-Math.max(s.records[key(c)]?.ra||0,c.isNew?newFloor:oldFloor);
      return {c,gap,score:clamp(gain,-15,35)*.65-Math.abs(gap-.15)*10-(recent.has(c.id)?18:0)-Math.min(10,(s.practice[key(c)]||0)*.5)};
    });
    const candidates=all.filter(x=>x.gap>=-1.5&&x.gap<=1.2),source=candidates.length>=count?candidates:all;
    const fresh=source.filter(x=>!excluded.has(x.c.id)),available=new Set(),picked=[];
    function pick(list){
      const eligible=list.filter(x=>!available.has(x.c.id)).sort((a,b)=>b.score-a.score).slice(0,60);
      if(!eligible.length)return false;
      const top=eligible[0].score;let total=0;const weights=eligible.map(x=>{const w=Math.exp((x.score-top)/10);total+=w;return w;});
      let roll=random(s)*total,index=0;while(index<weights.length-1&&roll>=weights[index])roll-=weights[index++];
      const chosen=eligible[index].c;available.add(chosen.id);picked.push(chosen);return true;
    }
    const primary=fresh.length>=count?fresh:source;
    if(count>1)pick(primary.filter(x=>x.gap>=.2&&x.gap<=1));
    while(picked.length<count&&pick(primary)){}
    while(picked.length<count&&pick(all.filter(x=>!excluded.has(x.c.id)))){}
    while(picked.length<count&&pick(all)){}
    return picked;
  }
  function play(s,selection,pool,courseLevel=0){
    guard(s,'play');const reason=playReason(s);if(reason)throw Error(reason);if(courseLevel&&(!Number.isInteger(courseLevel)||courseLevel<1||courseLevel>10||s.mode!=='solo'))throw Error('无效段位挑战。');const m=courseLevel?{...MODES.solo,count:4,select:4,duration:20,cost:pcPrice(s)*2}:{...MODES[s.mode],cost:pcPrice(s),select:X.selectCount(s)},known=new Map(pool.map(c=>[key(c),c]));if(s.clock+m.duration>availableUntil(s)||s.money<m.cost)throw Error('挑战所需时间或金钱不足。');if(s.gloves.durability<m.count*1.75*s.gloves.wear)throw Error('手套耐久不足。');if(!selection.length||selection.length>m.select)throw Error(`${m.name}最多自选 ${m.select} 首。`);
    const chosen=selection.map(c=>known.get(key(c)));if(chosen.some(c=>!c))throw Error('谱面不存在。');const fill=recommend(s,pool,10);while(chosen.length<m.select)chosen.push(fill.find(c=>!chosen.some(x=>key(x)===key(c)))||fill[0]);
    const partner=s.mode==='pair'?preparePartner(s,pool).map(item=>known.get(`${item.id}:${item.playerIndex}`)):[];
    if(partner.some(c=>!c))throw Error('拼机伙伴选曲无效，请重新进入出勤。');
    const feeReason=api.timeChargeReason(s,m.duration,m.cost);if(feeReason)throw Error(feeReason);
    const r=roundInfo(s),partnerIndex=s.partner,partnerNpc=s.mode==='pair'?s.npcs[s.partner]:null,partnerSongSnapshot=s.partnerSongs?.map(x=>({...x}))||[],partnerName=partnerNpc?.id||null;advance(s,m.duration);if(s.ending)return;if(partnerNpc)s.partner=partnerIndex;s.money-=m.cost;s.trip.cost+=m.cost;s.trip.rounds++;s.credits++;const before=s.rating,skillsBefore={...s.skills};
    const results=[...chosen,...partner].map((c,i)=>{const k=key(c),n=s.practice[k]||0,result={...c,...simulate(s,c),day:s.day,plays:n+1,partner:i>=m.select};result.overreach=isOverreach(before,c,result.achievement);result.ratingBefore=before;result.ra=isUtage(c)?0:chartRating(c.ds,result.achievement);const old=s.records[k],order=['','FC','FC+','AP'];result.improved=!old||result.achievement>old.achievement;result.bestSync=old?.bestSync||'';result.bestCombo=order[Math.max(order.indexOf(old?.bestCombo||old?.combo||''),order.indexOf(result.combo))];if(result.improved)s.records[k]=result;else old.bestCombo=result.bestCombo;s.practice[k]=n+1;P.afterSong(s);
      // Skill growth slows as the player becomes stronger. Early sessions still
      // feel rewarding, while repeated high-level play no longer rockets the
      // three fundamentals upward in a few days.
      const gain=.004*M.growth(c,s)*growthFactor(s,c)*(s.mood<30?.65:1)*(X.has(s,'gifted')?1.05:1);s.skills.star=clamp(s.skills.star+gain*.9*(.2+1.6*c.starWeight),1,22);s.skills.key=clamp(s.skills.key+gain*.9*(.2+1.6*(1-c.starWeight)),1,22);s.skills.reading=clamp(s.skills.reading+gain*(n? .65:1.2),1,22);X.consume(s,c);if(result.segmentEvent){const e=result.segmentEvent;log(s,`${c.title}：${e.scene}，${e.passed?'判定通过，稳稳接住。':`未通过，段落坠机，新增 ${e.misses} MISS，达成率 -${e.loss.toFixed(4)}%。`}`,'event');}return result;
    });
    if(partnerNpc)COMP.paired(s,results,partnerNpc,partnerSongSnapshot,pool);
    s.roundReview=true;s.tracks+=results.length;s.mood=clamp(s.mood-(s.mode==='pair'?4:3),0,100);recalculate(s);s.last={results,gain:s.rating-before,skillsBefore,mode:s.mode,battle:partnerNpc&&s.competition.battle?{...s.competition.last}:null,queue:0,duration:m.duration,partnerName};s.trip.played.push(...results);log(s,`${m.name}${partnerName?' · '+partnerName:''} ${results.length} 首：上机 ${m.duration} 分钟，Rating +${s.rating-before}。`,'play');X.afterPlay(s,results);api.linAfterPlay(s,results);C.stamp(s);C.route(s);s.partnerSongs=null;check(s);return s.last;
  }
  function finishPlay(s){guard(s,'play');s.phase='meal';if(s.trip.rounds&&R.offer(s)){if(s.love===0)s.event=0;else api.queueLinStory(s);}}
  function answer(s,option){R.answer(s,option);}
  function returnToPlayReason(s,id='skip'){
    if(s.phase!=='meal'||s.ending)return '当前不能返回机厅。';
    if(s.event!==null||s.school.pending)return '请先回应当前事件。';
    const m=id==='skip'?{cost:0,time:0}:api.mealOptions(s).find(m=>m.id===id);
    if(!m||id==='home')return `回${api.residence(s)}吃饭后可从日常页面再次出勤。`;
    if(s.money<m.cost+pcPrice(s))return `餐费之外需保留 ¥${pcPrice(s)} 上机。`;
    const duration=m.time+(id==='skip'?0:10),future={...s,clock:s.clock+duration},mode=s.mode==='pair'&&peopleAt(future)===0?'solo':s.mode;
    const round=roundInfo(future,s.arcade,mode);
    if(future.clock+round.total>availableUntil(future)||!canSpendTime(s,duration+round.total))return '剩余时间不足，或即将上课 / 上班、机厅闭店。';
    return '';
  }
  function meal(s,id,destination='home'){guard(s,'meal');if(!['home','arcade'].includes(destination))throw Error('请选择饭后去向。');const continuing=destination==='arcade';if(continuing){const reason=returnToPlayReason(s,id);if(reason)throw Error(reason);}const m=id==='skip'?{id:'skip',name:'不吃饭，直接回家',cost:0,time:0,mood:0}:api.mealOptions(s).find(m=>m.id===id);if(id==='skip'&&!continuing&&!M.canSkipMeal(s))throw Error(`饭点或本次体力消耗较多，先吃饭再回${api.residence(s)}。`);if(!m||s.money<m.cost)throw Error(`余额不足，可以回${api.residence(s)}吃饭。`);const mealDay=s.day,mealSlot=api.mealSlot(s);advance(s,m.time+(continuing?(id==='skip'?0:10):s.trip.returnTime),continuing?null:{direction:'home',arcade:s.arcade,meal:m.time});if(s.ending)return;if(!continuing)C.distance(s,ARCADE_KM[s.arcade]);s.money-=m.cost;s.trip.cost=Math.round((s.trip.cost+m.cost)*100)/100;if(id!=='skip'&&s.day===mealDay)api.markMeal(s,mealSlot,m.cost);s.mood=clamp(s.mood+m.mood,0,100);if(id!=='skip')s.stamina=clamp(s.stamina+(m.stamina||{home:30,noodles:40,burger:45,hotpot:60}[id]||0),0,s.maxStamina);if(continuing){
      CITY.food(s,m);s.phase='play';s.partnerSongs=null;s.roundReview=false;s.last=null;
      if(id!=='skip')s.consecutive=0;
      if(s.mode==='pair'&&peopleAt(s)===0){s.mode='solo';log(s,'机厅暂无其他玩家，改为单开；有人到店后可以再拼机。','crowd');}
      X.choosePartner(s);s.queueUntil=s.clock+roundInfo(s).queue;
      log(s,id==='skip'?'决定继续上机，按当前人数重新排队。':`${m.name}用餐后回到机厅，餐费 ¥${m.cost}，附近往返步行 10 分钟，重新排队。`,'meal');check(s);return;
    }
    log(s,`${m.name}后到家，本次花费 ¥${s.trip.cost}，现在是 ${time(s.clock)}，累计出勤 ${s.collection.distanceKm.toFixed(1)} km。`,'meal');CITY.food(s,m);s.phase='home';s.trip=null;check(s);}
  function migrate(old){
    if(!old||old.version!==1){if(old?.version===2){X.ensure(old);C.ensure(old);CITY.ensure(old);M.ensure(old);R.ensure(old);GUIDE.ensure(old);NEEDS.ensure(old);REST.ensure(old);WORLD.ensure(old);}return old;}if(!JOBS[old.job]||!Number.isFinite(old.skill)||!Number.isInteger(old.day)||!old.records)throw Error('旧存档格式错误。');
    const s=create(old.job,old.seed);s.day=clamp(old.day,1,DAYS);s.skills={star:clamp(old.skill,1,16.5),key:clamp(old.skill,1,16.5)};s.money=Number.isFinite(old.money)?old.money:s.money;s.mood=clamp(old.mood,0,100);s.records=old.records;s.started=!!old.started;s.visits=old.visits||0;s.credits=old.credits||0;s.tracks=s.credits*3;s.love=old.love||0;s.loveFailed=!!old.loveFailed;s.nextLoveVisit=old.nextLoveVisit||2;delete s.romance;delete s.precision;
    for(const [k,r] of Object.entries(s.records)){r.combo=r.combo||'';s.practice[k]=1;}s.ending=old.ending||null;if(s.ending)s.phase='ending';X.ensure(s);C.ensure(s);CITY.ensure(s);M.ensure(s);R.ensure(s);GUIDE.ensure(s);NEEDS.ensure(s);REST.ensure(s);WORLD.ensure(s);s.setupDone=true;crowd(s);recalculate(s);log(s,'已迁移旧存档：保留余额、成绩与关系；旧底力等分为星星 / 键盘，回到当天 08:00。','start');return s;
  }
  function validate(s){
    const num=(x,a,b)=>Number.isFinite(x)&&x>=a&&x<=b,integer=(x,a,b)=>Number.isInteger(x)&&num(x,a,b),record=r=>r&&typeof r.id==='string'&&typeof r.title==='string'&&integer(r.index,0,4)&&num(r.ds,0,20)&&num(r.achievement,0,101)&&num(r.ra,0,500)&&typeof r.isNew==='boolean'&&(r.maxCombo===undefined||Array.isArray(r.notes)&&r.notes.length===5&&r.notes.every(n=>integer(n,0,100000))&&integer(r.maxCombo,0,r.notes.reduce((a,b)=>a+b,0)));
    if(!s||s.version!==2||!JOBS[s.job]||!integer(s.day,1,DAYS)||!integer(s.clock,0,NIGHT)||!num(s.money,-100000,1e9)||!num(s.mood,0,100)||!s.skills||!num(s.skills.star,1,22)||!num(s.skills.key,1,22)||!integer(s.seed,0,4294967295))return false;
    if(!LIN.valid(s)||!SOCIAL.valid(s)||!WORLD.valid(s)||!REST.valid(s)||!GUIDE.valid(s)||!R.valid(s)||!P.valid(s))return false;
    if(!s.learning||!Object.entries(s.learning).every(([k,v])=>/^\d+:\d$/.test(k)&&['clear','partial'].includes(v))||!(s.videoEvent===null||s.videoEvent&&typeof s.videoEvent.key==='string'&&['clear','partial'].includes(s.videoEvent.outcome)))return false;
    if(!NEEDS.valid(s)||!num(s.skills.reading,1,22)||!num(s.stamina,0,130)||!num(s.maxStamina,70,130)||!s.gloves||!num(s.gloves.durability,0,240)||!num(s.gloves.wear,.8,1)||!integer(s.condition,0,4)||!num(s.liquid,0,3000)||!integer(s.queueUntil,0,3000)||!Array.isArray(s.talents)||!s.talents.every(id=>api.TALENTS.some(t=>t.id===id))||!Array.isArray(s.npcs)||s.npcs.length!==(30+(s.love>0?1:0))||new Set(s.npcs.map(n=>n.id)).size!==s.npcs.length||s.love>0&&!s.npcs.some(n=>n.id==='小凛')||!s.npcs.every(n=>n&&typeof n.id==='string'&&num(n.rating,0,17000)&&num(n.familiarity,0,100))||!(s.partner===null||integer(s.partner,0,s.npcs.length-1))||!s.profile||typeof s.profile.id!=='string'||typeof s.profile.name!=='string'||!Array.isArray(s.chat)||!s.metrics)return false;
    if(!api.GLOVES.some(g=>g.id===s.gloves.id)||typeof s.gloves.name!=='string'||s.profile.id.length>16||s.profile.name.length>16||!C.byId.has(s.profile.plate)||!integer(s.consecutive,0,100000)||!integer(s.socialTick,0,DAYS*1440)||!integer(s.chatCount,0,100000)||!integer(s.chatDay,1,DAYS)||typeof s.setupDone!=='boolean'||typeof s.friendship!=='boolean'||typeof s.instinct!=='boolean'||!s.npcs.every(n=>num(n.activity,1,4))||!['star','key','challenge','crowd','classic','vocal','touhou','ghost'].every(k=>integer(s.metrics[k],0,1e7))||!s.chat.every(m=>m&&typeof m.id==='string'&&typeof m.text==='string'&&m.text.length<=100&&integer(m.day,1,DAYS)&&integer(m.time,0,NIGHT)))return false;
    if(!['home','travel','drink','play','meal','ending'].includes(s.phase)||!MODES[s.mode]||!integer(s.arcade,0,5)||(s.arcade===5&&!s.city.denUnlocked)||!integer(s.people,0,1000)||typeof s.started!=='boolean'||!integer(s.visits,0,100000)||!integer(s.credits,0,100000)||!integer(s.tracks,0,400000))return false;
    if(![null,'good','love','burnout','broke','ordinary','rent','dropout'].includes(s.ending)||(s.phase==='ending')!==!!s.ending)return false;
    if(!s.school||!num(s.school.academic,0,100)||typeof s.school.failing!=='boolean'||typeof s.school.pending!=='boolean'||!integer(s.school.talks,0,3)||!(s.school.since===null||integer(s.school.since,1,s.day)))return false;
    if(s.school.failing&&s.school.since===null)return false;if(!integer(s.love,0,EVENTS.length)||typeof s.loveFailed!=='boolean'||!integer(s.nextLoveVisit,0,1e5)||!(s.event===null||(integer(s.event,0,EVENTS.length-1)&&s.event===s.love&&(s.phase==='meal'||s.event>0&&s.romance.pendingStory===s.event&&['home','play'].includes(s.phase)))))return false;
    if(!num(s.rating,0,30000)||!s.records||Array.isArray(s.records)||typeof s.records!=='object'||!Object.values(s.records).every(record)||!s.practice||Array.isArray(s.practice)||!Object.values(s.practice).every(n=>integer(n,0,1e6)))return false;
    if(!Array.isArray(s.logs)||!s.logs.every(l=>l&&typeof l.text==='string'&&typeof l.type==='string'&&integer(l.day,1,DAYS))||!Array.isArray(s.history)||!s.history.every(h=>h&&integer(h.day,1,DAYS)&&num(h.rating,0,30000)))return false;
    if(!Array.isArray(s.completed)||!s.completed.every(x=>typeof x==='string')||!Array.isArray(s.paidMonths)||!s.paidMonths.every(n=>integer(n,3,6))||!integer(s.rests,0,2)||!integer(s.workCount,0,2))return false;
    if(!integer(s.totalWorkCount,0,100000)||!integer(s.workAbsences,0,DAYS)||!Array.isArray(s.absences)||!s.collection||!C.byId.has(s.profile.title)||!(s.profile.avatar===null||typeof s.profile.avatar==='string'&&s.profile.avatar.length<300000&&/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(s.profile.avatar)))return false;
    if(!num(s.collection.distanceKm,0,1e6)||!integer(s.collection.lastStamp,0,DAYS)||!s.collection.stamps||!Object.values(s.collection.stamps).every(v=>integer(v,0,DAYS))||!s.collection.regions||!Object.values(s.collection.regions).every(v=>integer(v,0,10))||!Array.isArray(s.collection.unlocked)||!s.collection.unlocked.every(id=>C.byId.has(id))||![null,...C.byId.keys()].includes(s.collection.stampTarget)||![null,...C.byId.keys()].includes(s.collection.regionTarget)||!(s.partnerSongs===null||Array.isArray(s.partnerSongs)&&s.partnerSongs.length<=2&&s.partnerSongs.every(c=>c&&typeof c.id==='string'&&integer(c.index,0,4)&&integer(c.playerIndex,0,4))))return false;
    if(![null,...DRINKS.map(d=>d.id)].includes(s.drink))return false;if(['drink','play','meal'].includes(s.phase)&&!s.trip)return false;
    if(s.trip&&(!integer(s.trip.returnTime,0,180)||!num(s.trip.cost,0,1e9)||!integer(s.trip.rounds,0,10000)||!num(s.trip.ratingBefore,0,30000)||!Array.isArray(s.trip.played)||!s.trip.played.every(record)))return false;
    if(s.last&&(!Array.isArray(s.last.results)||!s.last.results.every(record)||!num(s.last.gain,0,30000)||!MODES[s.last.mode]||!s.last.skillsBefore))return false;return CITY.valid(s)&&M.valid(s);
  }
  const api={START,DAYS,OPEN,CLOSE,NIGHT,HOLIDAYS,dayInfo,pcPrice,entryPrice,allNight,arcadeIsOpen,JOBS,ARCADE_KM,TRANSPORT,transportOptions,DRINKS,MEALS,EVENTS,WEEK,MODES,create,date,dateISO,dateLabel,time,key,log,check,resolveClass,teacher,daily,workIncome,sleep,nextDay:sleep,schedule,pending,nextObligation,canSpendTime,academicChange,startTrip,setMode,peopleAt,roundInfo,roundMinutes,travel,drink,availableUntil,playReason,coefficient,chartRating,rank,ratingTier,best,recalculate,charts,baseAbility,levelValue,challengeThreshold,isOverreach,growthFactor,ability,familiarity,expected,combo,simulate,recommend,play,finishPlay,answer,returnToPlayReason,meal,migrate,validate};
  LIN.install(api);SOCIAL.install(api);X.install(api);C.install(api);CITY.install(api);NEEDS.install(api);M.install(api);COMP.install(api);R.install(api);GUIDE.install(api);WORLD.install(api);REST.install(api,{rollover,tick:X.tick,condition:X.rollCondition,distance:C.distance});Object.assign(api,{isUtage,advance,preparePartner,setPartnerDifficulty,calculateJudgements:J.calculate});REST.wrap(api);
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Game=api;
})(typeof window==='undefined'?globalThis:window);
