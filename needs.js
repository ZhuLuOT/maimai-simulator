(function(root){
  'use strict';
  let G,baseMeals;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const cents=n=>Math.round(n*100)/100;
  const residence=s=>s.job==='student'?'宿舍':'家';
  const homeText=(s,text)=>s.job==='student'?String(text).replace(/回家/g,'回宿舍').replace(/到家/g,'到宿舍').replace(/在家/g,'在宿舍').replace(/家中/g,'宿舍内'):String(text);
  const slot=s=>s.clock<360?-1:s.clock<660?0:s.clock<1020?1:2;
  const labels=['早餐','午餐','晚餐'];
  function ensure(s){
    s.nutrition??={meals:[false,false,false],dismissed:[],away:false,badDays:0,goodDays:0};s.mealBreak??=null;
    if(!s.bottles){const d=G.DRINKS.find(d=>d.id===s.drink);s.bottles=[];let ml=s.liquid||0;while(d&&ml>0&&s.bottles.length<3){const amount=Math.min(d.ml,ml);s.bottles.push({id:d.id,ml:amount});ml-=amount;}sync(s);}
  }
  function sync(s){s.liquid=s.bottles.reduce((n,b)=>n+b.ml,0);s.drink=s.bottles[0]?.id||null;}
  function drinks(s){return G.DRINKS.filter(d=>d.id!=='pink'||s.love>0);}
  function bottleReason(s,id){
    const d=drinks(s).find(d=>d.id===id);
    if(!d)return '尚未解锁这款饮料。';
    if(s.bottles.length>=3)return '最多同时携带 3 瓶饮料。';
    if(id==='water'&&s.bottles.filter(b=>b.id==='water').length>=2)return '大水最多同时携带 2 瓶。';
    if(s.money<d.cost+G.hourlyCost(s,5)+(s.phase==='drink'?G.pcPrice(s):0))return '余额不足以购买饮料或续时。';
    return '';
  }
  function pack(s,id){
    if(!['drink','play'].includes(s.phase)||s.ending||s.event!==null||s.school.pending||s.videoEvent||s.city.encounter||s.world?.notice||s.world?.mahjong.active)throw Error('先完成当前事件，再购买饮料。');
    const reason=bottleReason(s,id);if(reason)throw Error(reason);
    if(s.phase==='play'&&s.clock+5>G.availableUntil(s))throw Error('接近闭店或回程时间，请先下机。');
    const d=drinks(s).find(d=>d.id===id);G.advance(s,5);s.money=cents(s.money-d.cost);s.trip.cost=cents(s.trip.cost+d.cost);s.bottles.push({id,ml:d.ml});sync(s);s.mood=clamp(s.mood+d.mood,0,100);
    G.log(s,`购买${d.name} ${d.ml} ml，¥${d.cost}，携带 ${s.bottles.length}/3 瓶。`,'money');G.check(s);
  }
  function use(s,index){if(!['drink','play'].includes(s.phase)||!Number.isInteger(index)||!s.bottles[index])throw Error('请选择携带的饮料。');const [b]=s.bottles.splice(index,1);s.bottles.unshift(b);sync(s);}
  function consume(s,ml){
    while(ml>0&&s.bottles.length){const b=s.bottles[0],used=Math.min(ml,b.ml);b.ml-=used;ml-=used;if(b.ml===0)s.bottles.shift();}sync(s);
  }
  function meals(s){return baseMeals(s).map(m=>m.id==='home'?{...m,name:`回${residence(s)}吃饭`}:m.id==='burger'?{...m,cost:G.date(s).getUTCDay()===4?29.9:50,note:G.date(s).getUTCDay()===4?'疯狂星期四 · 心情 +21':'心情 +21'}:m);}
  function homeMeals(s){return meals(s).map(m=>m.id==='home'?{...m,name:s.mealBreak?'午休便当':s.job==='student'?'食堂打饭带回宿舍':'家常饭'}:m).concat(s.job==='student'&&!s.mealBreak?[{id:'delivery',name:'美团拼好饭',cost:12,time:15,mood:10,stamina:35,icon:'bike',note:'宿舍用餐 · 心情 +10'}]:[]);}
  function due(s){const i=slot(s);return i>=0&&!s.nutrition.meals[i]?i:-1;}
  function reminder(s){const i=due(s);return ['home','travel'].includes(s.phase)&&i>=0&&s.clock>=[480,720,1080][i]&&!s.nutrition.dismissed.includes(i)?i:-1;}
  function mark(s,i=slot(s)){if(i>=0)s.nutrition.meals[i]=true;}
  function canEat(s,id){const m=homeMeals(s).find(x=>x.id===id);if(!m||s.money<m.cost||due(s)<0)return false;const c=G.nextObligation(s);return G.canSpendTime(s,m.time)||!!(c&&s.mealBreak===c.id&&s.clock>=720&&s.clock+m.time<=c.end);}
  function ready(s){if(s.phase!=='drink'||s.ending)throw Error('当前不能进入排队。');if(s.money<G.pcPrice(s))throw Error('余额不足以上机。');s.phase='play';}
  function eat(s,id){
    if(!['home','travel'].includes(s.phase)||s.ending||s.school.pending||s.event!==null||s.videoEvent||s.city.encounter||s.world?.notice||s.world?.mahjong.active)throw Error(`先回${residence(s)}并处理当前事件。`);
    const m=homeMeals(s).find(m=>m.id===id),i=slot(s),day=s.day;if(!canEat(s,id))throw Error('本餐已吃过，或用餐时间 / 余额不足。');
    G.advanceMeal(s,m.time);s.money=cents(s.money-m.cost);s.mood=clamp(s.mood+m.mood,0,100);s.stamina=clamp(s.stamina+(m.stamina||{home:30,noodles:40,burger:45,saizeriya:40,hotpot:60}[id]||30),0,s.maxStamina);
    if(day===s.day)mark(s,i);if(!['home','delivery'].includes(id))s.nutrition.away=true;G.applyFoodBuff(s,m);G.log(s,`${m.name} · ${i<0?'加餐':labels[i]}，${m.time} 分钟，¥${m.cost}。`,'meal');G.check(s);
  }
  function settle(s){
    const n=s.nutrition,count=n.meals.filter(Boolean).length;
    if(count<3){n.badDays++;n.goodDays=0;if(n.badDays>=3){s.maxStamina=Math.max(70,s.maxStamina-2);G.log(s,'连续漏餐，最大体力 -2。','health');}}
    else{n.badDays=0;if(n.away){n.goodDays++;if(n.goodDays>=3){s.maxStamina=Math.min(s.talents.includes('endurance')?130:120,s.maxStamina+1);G.log(s,'规律三餐并出门活动，最大体力 +1。','health');n.goodDays=0;}}else n.goodDays=0;}
    s.stamina=Math.min(s.stamina,s.maxStamina);n.meals=[false,false,false];n.dismissed=[];n.away=false;s.mealBreak=null;
  }
  function valid(s){const n=s.nutrition;return (s.mealBreak===null||typeof s.mealBreak==='string'&&G.schedule(s).some(c=>c.id===s.mealBreak))&&!!n&&Array.isArray(n.meals)&&n.meals.length===3&&n.meals.every(x=>typeof x==='boolean')&&Array.isArray(n.dismissed)&&n.dismissed.length<=3&&n.dismissed.every(i=>Number.isInteger(i)&&i>=0&&i<3)&&typeof n.away==='boolean'&&['badDays','goodDays'].every(k=>Number.isInteger(n[k])&&n[k]>=0&&n[k]<=G.DAYS)&&Array.isArray(s.bottles)&&s.bottles.length<=3&&s.bottles.every(b=>b&&G.DRINKS.some(d=>d.id===b.id&&Number.isInteger(b.ml)&&b.ml>0&&b.ml<=d.ml))&&s.bottles.filter(b=>b.id==='water').length<=2&&s.liquid===s.bottles.reduce((n,b)=>n+b.ml,0)&&s.drink===(s.bottles[0]?.id||null);}
  function install(api){G=api;baseMeals=api.mealOptions;Object.assign(api,{residence,homeText,drinkOptions:drinks,bottleReason,packDrink:pack,consumeDrink:consume,useBottle:use,mealOptions:meals,homeMeals,canEatHome:canEat,finishDrinks:ready,mealSlot:slot,mealDue:due,mealReminder:reminder,MEAL_NAMES:labels,eatHome:eat,markMeal:mark});}
  const api={ensure,settle,valid,install};if(typeof module!=='undefined')module.exports=api;else root.Needs=api;
})(globalThis);
