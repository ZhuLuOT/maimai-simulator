(function(root){
 'use strict';
 let G;
 const NIGHT={COLDDD:[1320,240],'逃遁':[1380,180],'鲁米诺':[1320,120],'404NOTFOUND':[1380,240],NekoDX:[1320,120],'月读':[1380,300],'再来一把':[1320,180]};
 const JOBS={'elubos':'freelance',Toqin:'freelance',COLDDD:'freelance','逃遁':'worker','鲁米诺':'worker','404NOTFOUND':'worker',NekoDX:'student','月读':'freelance'};
 function ensure(s){s.socialLife??={day:s.day,posts:0,playPosts:0};s.socialLife.announced??=[];s.npcs.forEach((n,i)=>{n.career??=JOBS[n.id]||['worker','student','freelance'][i%3];n.nightOwl??=!!NIGHT[n.id];n.lifeEvent??='';n.playChatDay??=0;});}
 function reset(s){if(s.socialLife.day!==s.day)s.socialLife={day:s.day,posts:0,playPosts:0,announced:[]};}
 function visitors(s){return (s.npcs||[]).filter((n,i)=>{
  if(n.id==='小凛')return false;const hours=NIGHT[n.id];if(!n.nightOwl||!hours)return false;
  const startDay=s.clock<hours[1]?s.day-1:s.day,off=G.dayInfo({day:startDay+1}).rest;
  const end=n.career==='freelance'||off?hours[1]:Math.min(hours[1],90);
  return (s.clock>=hours[0]||s.clock<end)&&(n.id==='COLDDD'||n.id==='月读'||(startDay+i)%3!==0);
 });}
 function denVisitors(s){
  if(s.clock<600||s.clock>=1320)return visitors(s);
  return (s.npcs||[]).filter((n,i)=>{
   if(n.id==='小凛')return G.linArcade(s)===5;if(['work','school','before-work','rest'].includes(context(s,n)))return false;
   if(n.id==='COLDDD')return s.clock>=720;
   return (s.day+i+Math.floor(s.clock/120))%5===0;
  }).slice(0,7);
 }
 function context(s,n){const info=G.dayInfo(s),h=s.clock;
  if(visitors(s).some(x=>x.id===n.id))return 'night';
  if(h<480||h>=1380)return 'rest';
  if(info.rest)return 'holiday';
  if(n.career==='worker')return h<540?'before-work':h<1080?'work':'after-work';
  if(n.career==='student')return h>=540&&h<960?'school':'after-school';
  return 'free';
 }
 function status(s,n){if(n.id==='小凛')return G.linStatus(s);const c=context(s,n);return c==='night'?'猫窝 · 夜间出勤':c==='rest'?'休息中':c==='work'?'公司 · 上班中':c==='school'?'学校 · 上课中':c==='before-work'?'准备上班':c==='after-work'?'已下班 · 安排晚上的时间':c==='after-school'?'下课了':G.dayInfo(s).holiday?G.dayInfo(s).holiday+' · 放假':c==='holiday'?'休息日 · 自由安排':'今天时间自由';}
 function voice(s,n,event){const holiday=G.dayInfo(s).holiday||'休息日';
  const special={
   'elubos':{holiday:`${holiday}打算先去公园。树上有动静时别急着举相机，先听听。`,free:'刚把今天的鸟类记录整理好。舞萌和观鸟都得慢慢看，急了反而漏细节。',play:'这轮有几段要再看清楚，先歇一下眼睛。',reply:'收到。我先把望远镜收好，晚点看看有没有空一起打。'},
   Toqin:{holiday:`${holiday}终于能带画本出门了。今天想画骑楼投下来的影子。`,free:'今天一直在调这张画的配色，刚才那一点绿色终于顺眼了。',play:'刚才那首的曲绘真好看，已经想好回去练哪组颜色了。',reply:'嗯嗯，我先把这笔画完。今天也想留点时间打歌。'},
   COLDDD:{holiday:`${holiday}有空来猫窝吗？打完歌再坐一桌，输赢都复盘。`,night:'我在猫窝，刚下机。想拼机还是打牌？都可以。',free:'最近在看牌谱，主要记自己哪一巡开始贪了。',play:'这轮手有点紧，先缓一缓。打歌跟打牌一样，不能越急越上头。',reply:'在。刚好休息一轮，有事就说。'},
   '逃遁':{night:'末班车已经走了，我在猫窝再打一会儿。明天上班的话就早点收。',play:'刚那首又抢拍了，喝口水再说。',reply:'在呢，先看人数，别出门才发现排长队。'},
   '鲁米诺':{night:'猫窝这边还亮着灯。我打完这一轮歇一歇，你们记得带水。',play:'手套还撑得住，水快喝完了。下一轮之前先补给。',reply:'收到。水和手套带上，累了就休息。'}
  };
  const table=special[n.id]||{},ordinary={holiday:`${holiday}不用赶${n.career==='student'?'课':'班'}，吃过饭再安排出勤。`,night:'在猫窝打夜场，刚轮完一轮，还没回去。',work:'还在上班，等下班再看你们的成绩。',school:'这会儿还有课，等下课再聊。','before-work':'准备出门上班了，晚上再约。','after-work':'下班了，先吃饭，再看看哪家不用排太久。','after-school':'今天的课上完了，打算先去吃点东西。',free:'今天时间比较松，晚点去打几首熟歌。',rest:'刚准备休息，明天再聊。',play:n.tendency==='star'?'刚打一轮星星，最后一段还得再顺顺。':'这轮键盘有点抢拍，下次先稳住节奏。',reply:'看到了。先把手头的事做完，晚点再约。'};
  const variants={
 'elubos':{reply:['在，我刚整理完观鸟记录。你今天有看到什么新动静吗？','我在听今天录到的鸟鸣。打歌的事也可以说。'],play:['刚才那个转折没看清，下轮想先降点难度。','手有点酸了，先喝水，顺便看看今天拍到的鸟。']},
 Toqin:{reply:['在，刚把画笔放下。最近想画一点和曲绘有关的东西。','这张草图终于顺了。你那边今天过得怎么样？'],play:['提马亚特还是想再开一次，你可以选自己合适的难度。','刚才那段旋律一直在脑子里，想拿它试试新的画面。']},
 COLDDD:{reply:['刚看完一局牌谱。说吧，我听着。','刚停下来歇着，今天不急着推分。'],play:['这轮先记下来，感觉不好就别追着硬推。','先歇一轮，看别人打也能看出自己刚才哪里急了。'],night:['我还在猫窝，刚洗好牌，看看能不能凑齐四个人。','今晚先打几首熟歌。想打牌的话得看看现场有几位。']},
 '鲁米诺':{reply:['刚在挑鬼歌，想试哪个难度你自己定。','我在翻谱面，有几首挺有意思，下次开给你。'],play:['这首鬼歌的停顿真会骗人，下次留意一下。','刚那段我也没处理好，下次再试，先歇会儿。']},
 '逃遁':{reply:['刚下机，正在找地方坐一下。','晚点看排队人数再定，你先忙你的。'],play:['这一轮手速够了，节奏还得再稳一点。','喝口水，先别急着开下一轮。']}
 };
 const common={'after-work':['终于收工了，先找点吃的，晚上再看看机厅人数。','今天工作结束，想打两轮熟歌放松一下。'],'after-school':['下课了，先把东西放回去，晚点再约。','今天的课结束，先歇会儿，看看大家晚上去哪。'],holiday:n.career==='freelance'?['今天自由安排，吃过饭再看看去哪走走。']:['今天不用赶日程，慢慢吃完饭再出门。','放假先休息一下，下午再看谁想一起出勤。'],free:['手头的事刚忙完，先吃点东西再安排晚上。'],reply:['刚看到，等忙完再来看看。','我先把眼前的事做完，晚点聊。']};
 const choices=[table[event]||ordinary[event]||ordinary.reply,...(variants[n.id]?.[event]||(!table[event]?common[event]:[])||[])];
 const history=[...s.chat.slice(-16),...(s.world?.dm[n.id]||[]).slice(-8)].filter(m=>!m.self);
 const start=table[event]?0:(s.npcs.indexOf(n)+s.day)%choices.length,ordered=choices.slice(start).concat(choices.slice(0,start));
 return ordered.find(t=>!history.some(m=>m.text===t))||ordered[Math.floor(s.clock/30)%ordered.length];
 }
 function reply(s,id,text){const n=s.npcs.find(x=>x.id===id),c=context(s,n);
  if(/谢谢|多谢|感谢/.test(text))return id==='elubos'?'不用谢，下次发现新鸟记得告诉我。':id==='Toqin'?'不客气，能有人一起看这些小细节，我很开心。':id==='COLDDD'?'客气什么，下次继续坐我对面。':'不客气，下次一起打。';
  if(/累|困|睡/.test(text))return id==='Toqin'?'眼睛累的时候我也画不下去。先睡一觉，醒来再看会清楚很多。':id==='COLDDD'?'困了就收，硬撑最容易把安全牌打没。牌桌又不会跑。':id==='elubos'?'先去睡吧。精神好一点，鸟鸣和树叶的声音都更容易分清。':'困了就回去休息，别硬推。';
  if(/下班|上班|放假|调休|上课|下课|在哪|在干嘛/.test(text))return voice(s,n,c);
  if(id==='Toqin'){
   if(/观鸟|猫头鹰/.test(text))return '观鸟问elubos更靠谱。我会留意它们羽毛的配色，画翅膀时先抓轮廓，再补花纹。';
   if(/画|配色|灵感|构图/.test(text))return /颜色|配色/.test(text)?'先选一个主色，再拿冷暖差把重点托出来。我最近画广州，常把树荫的绿和骑楼的暖灰放在一起。':'我卡住时会先画几张小草图。别急着填细节，先看大块明暗和轮廓有没有站稳。';
   if(/任务|下一|一起|出发/.test(text)){const p=s.world.quests.Toqin,step=G.QUESTS.Toqin.steps[p.stage];return step?`我想去${G.OUTINGS.find(x=>x.id===step.place).name}找下一张画的灵感。${p.lastDay===s.day?'今天已经跑过一趟了，明天再去吧。':'有空的话，陪我一起看看？'}`:'四张画都完成了，但我还有好多想画的角落。谢谢你一直陪我找灵感。';}
   return voice(s,n,c==='free'||c==='holiday'?c:'reply');
  }
  if(id==='COLDDD'){
   if(/麻将|立直|役|胡|和牌|番|振听/.test(text))return /振听/.test(text)?'自己的舍牌里有当前听的牌，就是舍牌振听，不能荣和；自摸仍然可以。漏过别人的和牌张也要注意同巡振听。':/立直/.test(text)?'门前听牌才能立直，要交一千点。立直后基本只能摸切，所以先看巡目、打点和别人的动静。':'先确定手里有什么役，再决定要不要鸣牌。宝牌只加番，不能拿它单独当和牌的役；输了也能留下一手值得复盘的牌。';
   if(/输|赢|复盘/.test(text))return s.world.mahjong.last?'刚才那局我记着呢。'+s.world.mahjong.last.text.slice(0,150)+' 别只看结果，回头看看当时能知道哪些牌。':'还没坐下来打呢。先来一局，输赢都记得看看自己哪一步做了决定。';
   if(/任务|下一|一起|出发/.test(text))return s.world.quests.COLDDD.lastDay===s.day?'今天已经练过了，明天再继续准备比赛。现在想打普通对局也行。':'来猫窝找我。想练牌就坐下，想复盘就先把上一局的舍牌理一遍。';
  }
  if(/鸟|画/.test(text)&&id!=='elubos'&&id!=='Toqin')return '这个得问elubos和Toqin，我先把今天这几首练明白。';
  return voice(s,n,c==='night'||c==='work'||c==='school'||c==='rest'?c:'reply');
 }
 function post(s,n,text,extra={}){if(n.id==='小凛'){const recent=s.world?.dm['小凛']||[];if(recent.some(m=>!m.self&&(s.day-m.day)*1440+s.clock-m.time<20))return false;G.linMessage(s,text);return true;}const now=(s.day-1)*1440+s.clock;
  text=text.slice(0,100);if(s.chat.some(m=>!m.self&&now-((m.day-1)*1440+m.time)<120&&m.text===text))return false;
  if(s.chat.some(m=>m.id===n.id&&!m.self&&now-((m.day-1)*1440+m.time)<20))return false;
  s.chat.push({id:n.id,text:text.slice(0,100),day:s.day,time:s.clock,...extra});s.chat=s.chat.slice(-60);return true;
 }
 function conversation(s){const night=s.clock<480||s.clock>=1380,candidates=night?visitors(s):s.npcs.filter(n=>n.id!=='小凛');const list=candidates.length?candidates:s.npcs.filter(n=>n.nightOwl);const start=Math.floor(s.clock/30)%list.length;
  let sent=0;for(let i=0;i<list.length&&sent<2;i++){const n=list[(start+i)%list.length];if(post(s,n,voice(s,n,context(s,n))))sent++;}
 }
 function tick(s){reset(s);for(const c of ['holiday','after-school','after-work','night']){if(s.socialLife.announced.includes(c)||c==='holiday'&&s.clock<540)continue;const candidates=s.npcs.filter(n=>n.id!=='小凛'&&context(s,n)===c);if(!candidates.length)continue;for(const n of candidates.slice(0,2)){post(s,n,voice(s,n,c));n.lifeEvent=s.day+':'+c;s.socialLife.posts++;}s.socialLife.announced.push(c);}}
 function afterPlay(s,n){if(n.id==='小凛'){post(s,n,'刚才那首 V 家曲的停顿我又抢拍了。先喝口水，下轮再慢慢试。');return;}reset(s);if(s.socialLife.playPosts>=3||n.playChatDay===s.day)return;post(s,n,voice(s,n,'play'));n.playChatDay=s.day;s.socialLife.playPosts++;}
 function valid(s){return s.socialLife&&Number.isInteger(s.socialLife.day)&&s.socialLife.day>=1&&s.socialLife.day<=G.DAYS&&['posts','playPosts'].every(k=>Number.isInteger(s.socialLife[k])&&s.socialLife[k]>=0&&s.socialLife[k]<=8)&&Array.isArray(s.socialLife.announced)&&s.socialLife.announced.every(x=>['holiday','after-work','after-school','night'].includes(x))&&Array.isArray(s.npcs)&&s.npcs.every(n=>n&&['worker','student','freelance'].includes(n.career)&&typeof n.nightOwl==='boolean'&&typeof n.lifeEvent==='string'&&n.lifeEvent.length<50&&Number.isInteger(n.playChatDay)&&n.playChatDay>=0&&n.playChatDay<=G.DAYS);}
 function syncPhone(s){s.phone??={next:0,read:{}};for(const messages of [s.chat,...Object.values(s.world?.dm||{})])for(const m of messages)if(!Number.isSafeInteger(m.seq))m.seq=++s.phone.next;}
 function unread(s,id){syncPhone(s);const entries=id?[[id,id==='group'?s.chat:s.world?.dm[id]||[]]]:[['group',s.chat],...Object.entries(s.world?.dm||{})];return entries.reduce((sum,[key,list])=>sum+list.filter(m=>!m.self&&m.seq>(s.phone.read[key]||0)).length,0);}
 function readPhone(s,id){syncPhone(s);const list=id==='group'?s.chat:s.world?.dm[id]||[];s.phone.read[id]=Math.max(s.phone.read[id]||0,...list.map(m=>m.seq));}
 function install(api){G=api;Object.assign(api,{ensureSocialLife:ensure,nightVisitors:visitors,denVisitors,npcStatus:status,npcReply:reply,npcAfterPlay:afterPlay,socialLifeTick:tick,ambientConversation:conversation,postNPCMessage:post,syncPhone,unreadPhone:unread,readPhone});}
 const api={ensure,install,valid,conversation,reply};if(typeof module!=='undefined')module.exports=api;else root.SocialLife=api;
})(globalThis);
