(function(root){
 'use strict';let G,rollover,tick,depth=0,route=null;
 const RATE=100/960,DAYS_HOURS=122*24;
 class Interrupted extends Error{constructor(){super('困意已满，已终止行动并回家睡觉。');this.interrupted=true;}}
 function ensure(s){s.drowsiness??=Math.min(90,Math.max(0,(s.clock-480)*RATE)+(s.sleepDebt||0)*5);delete s.sleepDebt;delete s.nightActive;s.totalWorkCount??=s.workCount||0;s.forcedSleeps??=0;if(s.trip&&s.arcade===5){s.trip.denMinutes??=0;s.trip.denHours??=1;}}
 const onSite=s=>s.arcade===5&&s.trip&&['drink','play'].includes(s.phase);
 function hourlyCost(s,minutes){if(!onSite(s))return 0;return Math.max(0,Math.ceil((s.trip.denMinutes+minutes)/60)-s.trip.denHours)*30;}
 function timeReason(s,minutes,reserve=0){return s.money<hourlyCost(s,minutes)+reserve?'余额不足以支付猫窝续时费用（¥30 / 小时）。':'';}
 function missed(s,start,end){
  for(const c of G.schedule(s)){if(s.completed.includes(c.id)||c.start>=end||c.end<=start)continue;s.completed.push(c.id);s.absences.push(c.id);
   if(c.kind==='shift'){s.workAbsences++;const cost=Math.round(G.JOBS.worker.monthly/22);s.money-=cost;s.mood=Math.max(0,s.mood-10);G.log(s,`睡眠或强制返程与上班冲突：旷工，扣薪 ¥${cost}。`,'work');}
   else{const loss=c.kind==='major'?17:6;G.academicChange(s,-loss);s.mood=Math.max(0,s.mood-5);G.log(s,`睡过「${c.name}」：记为旷课，学力 -${loss}。`,'school');}
  }
 }
 // Advance by minute so midnight settlement, billed hours and forced sleep occur in order.
 function elapse(s,minutes,{sleeping=false,bypass=false,charge=true}={}){
  for(let i=0;i<minutes&&!s.ending;i++){
   if(bypass)missed(s,s.clock,s.clock+1);
   if(charge&&onSite(s)){if(s.trip.denMinutes>=s.trip.denHours*60){if(s.money<30){s.phase='meal';s.queueUntil=0;s.roundReview=false;G.log(s,'余额不足以续时，结束游玩，请离店。','money');throw new Interrupted();}s.money-=30;s.trip.cost+=30;s.trip.denHours++;G.log(s,'猫窝续时 1 小时，扣费 ¥30。','money');}s.trip.denMinutes++;}
   s.clock++;if(route&&!sleeping)route.elapsed++;if(!sleeping)s.drowsiness=Math.min(100,s.drowsiness+RATE);
   if(s.clock>=1440&&!rollover(s))throw new Interrupted();
   if(!sleeping&&s.clock%30===0)tick(s);
   if(!sleeping&&s.drowsiness>=100-1e-8){forceSleep(s);throw new Interrupted();}
  }
  tick(s);
 }
 function sleepPlan(s,kind='full'){
  const duration=kind==='full'?600:kind==='nap'?30:Number(kind);
  if(!Number.isInteger(duration)||duration<30||duration>720||duration%30)throw Error('请选择 30 分钟至 12 小时的睡眠时长（每档 30 分钟）。');
  const end=s.clock+duration,dayOffset=Math.floor(end/1440),clock=end%1440,conflicts=[];
  for(let offset=0;offset<=dayOffset;offset++){
   const day=s.day+offset;if(day>G.DAYS)break;
   for(const c of G.schedule({...s,day})){
    if(offset===0&&s.completed.includes(c.id))continue;
    if(c.start+offset*1440<end&&c.end+offset*1440>s.clock)conflicts.push({name:c.name,kind:c.kind,day});
   }
  }
  return {duration,day:s.day+dayOffset,clock,conflicts,recovery:Math.min(s.drowsiness,duration*100/480),staminaRecovery:Math.min(s.maxStamina-s.stamina,duration*s.maxStamina/480)};
 }
 function sleep(s,kind='full',forced=false){
  if(!forced&&(s.phase!=='home'||s.ending||s.school.pending||s.event!==null||s.videoEvent||s.city.encounter||s.world?.notice||s.world?.mahjong.active))throw Error(`先回${G.residence(s)}并处理当前事件，再睡觉。`);
  const {duration,recovery,staminaRecovery}=sleepPlan(s,kind);s.started=true;elapse(s,duration,{sleeping:true,bypass:true,charge:false});if(s.ending)return;
  s.drowsiness=Math.max(0,s.drowsiness-recovery);s.stamina=duration>=480?s.maxStamina:Math.min(s.maxStamina,s.stamina+staminaRecovery);s.consecutive=0;
  if(duration>=480){s.partner=null;s.partnerSongs=null;s.friendship=false;s.queueUntil=0;s.mood=Math.min(100,s.mood+8);}
  const hours=Math.floor(duration/60),minutes=duration%60;
  G.log(s,`${kind==='nap'?'小睡 30 分钟':`休息了 ${hours} 小时${minutes?` ${minutes} 分钟`:''}`}，${G.time(s.clock)} 起床，困意降至 ${Math.round(s.drowsiness)}，体力 ${Math.floor(s.stamina)}。`,'rest');G.check(s);
 }
 function forceSleep(s){
  G.log(s,'困意达到 100，终止当前行动，回家睡觉。','rest');s.forcedSleeps++;const movement=route,arcade=movement?.arcade??s.arcade;let back=s.trip?.returnTime||0,distance=back?G.ARCADE_KM[arcade]:0;
  if(movement?.direction==='out'){back=Math.min(movement.oneWay,movement.elapsed);distance=2*G.ARCADE_KM[arcade]*back/movement.oneWay;}
  if(movement?.direction==='home')back=Math.max(0,back-Math.max(0,movement.elapsed-movement.meal));route=null;
  if(s.world){s.world.notice=null;s.world.mahjong.active=null;}s.event=null;s.videoEvent=null;s.city.encounter=false;s.phase='home';s.trip=null;s.last=null;s.roundReview=false;s.selectedCharts=[];s.partnerSongs=null;s.partner=null;s.queueUntil=0;
  elapse(s,back,{sleeping:true,bypass:true,charge:false});if(distance)G.addTravelDistance(s,distance);if(!s.ending)sleep(s,480,true);
 }
 function advance(s,minutes,movement=null){if(!G.canSpendTime(s,minutes))throw Error('时间不足或与课程 / 工作冲突。');const reason=timeReason(s,minutes);if(reason)throw Error(reason);s.started=true;route=movement?{...movement,elapsed:0}:null;try{elapse(s,minutes);}finally{route=null;}}
 function attend(s,c){const lunch=720;if(!s.nutrition.meals[1]&&s.clock<lunch&&c.end>lunch){elapse(s,lunch-s.clock,{charge:false});s.mealBreak=c.start<lunch?c.id:null;G.log(s,c.start<lunch?`${c.name}暂告一段落，午休时间，先吃午饭。`:`距离${c.name}还有一会儿，先吃午饭。`,'meal');return false;}s.mealBreak=null;const duration=Math.max(0,c.end-s.clock);elapse(s,duration,{charge:false});return true;}
 function advanceMeal(s,minutes){const c=G.nextObligation(s);if(c&&s.mealBreak===c.id&&s.clock>=720&&s.clock+minutes<=c.end){s.started=true;elapse(s,minutes,{charge:false});}else advance(s,minutes);}
 function install(api,callbacks){G=api;rollover=callbacks.rollover;tick=callbacks.tick;Object.assign(api,{sleepPlan,advanceMeal,hourlyCost,timeChargeReason:timeReason,sleepPenalty:s=>Math.max(0,(s.drowsiness||0)-60)*.025,rollDailyCondition:callbacks.condition,addTravelDistance:callbacks.distance});}
 function wrap(api){for(const name of ['advance','advanceMeal','packDrink','eatHome','daily','sleep','nextDay','resolveClass','teacher','travel','drink','play','meal','runCourse','waitQueue','refill','chatSend','watchVideos','explore','answerEncounter','answer','contactLove','doQuest','sendDM','startMahjong']){const fn=api[name];api[name]=function(...args){depth++;try{return fn(...args);}catch(e){if(!e.interrupted||depth>1)throw e;}finally{depth--;if(depth===0)api.claimHomeGoals(args[0]);}};}}
 function valid(s){return Number.isFinite(s.drowsiness)&&s.drowsiness>=0&&s.drowsiness<=100&&Number.isInteger(s.forcedSleeps)&&s.forcedSleeps>=0&&s.forcedSleeps<10000&&(!s.trip||s.arcade!==5||Number.isInteger(s.trip.denMinutes)&&s.trip.denMinutes>=0&&Number.isInteger(s.trip.denHours)&&s.trip.denHours>=1&&s.trip.denHours<=DAYS_HOURS&&s.trip.denMinutes<=s.trip.denHours*60);}
 const api={ensure,advance,sleep,attend,install,wrap,valid};if(typeof module!=='undefined')module.exports=api;else root.RestLife=api;
})(globalThis);
