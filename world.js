(function(root){
  'use strict';
  let G;
  const YAKU=typeof module!=='undefined'?require('./data/mahjong-yaku'):root.MAHJONG_YAKU;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)), now=s=>(s.day-1)*1440+s.clock;
  const NAMES=['elubos','Toqin','COLDDD'],friendNames=s=>[...NAMES,...(s.love?['小凛']:[])];
  const DISCOVERABLE=['yuexiu','shamian','canton','yongqing'];
  const LOCATIONS=[...DISCOVERABLE,'baiyun'];
  const CHAT_BIRDS=['bulbul','robin','egret','kingfisher'];
  const BIRD_TIPS=[
    '先停下来听鸟鸣，再看树梢和枝叶间的动静，慢慢靠近比追着跑更容易观察。',
    '认鸟可以先记体型、嘴形、尾巴和明显色块，再对照图鉴，不用一开始就记住所有名字。',
    '带望远镜能在远处看清特征；游戏里不用另买装备，我们的观鸟记录也不要求拍照。',
    '观鸟时保持距离，不投喂、不追赶、不用鸟鸣录音引诱；遇到巢和幼鸟时更要退远一点。',
    '清晨常能听到活跃的鸟鸣。不过夜鹭等鸟也会在黄昏或夜间活动，不同鸟的作息不一样。'
  ];
  const ENTRIES=[
    {id:'bulbul',kind:'bird',name:'白头鹎',place:'yuexiu',note:'广州公园与街头常见的留鸟。白色后枕和活泼的叫声是辨认线索。'},
    {id:'robin',kind:'bird',name:'鹊鸲',place:'shamian',note:'常在树荫和草地附近活动，黑白羽色鲜明，会翘起长尾。'},
    {id:'egret',kind:'bird',name:'白鹭',place:'canton',note:'珠江沿岸与湿地可见，黑嘴、黑腿与黄色脚趾是重要特征。'},
    {id:'kingfisher',kind:'bird',name:'普通翠鸟',place:'yongqing',note:'留意水边低枝上的蓝色身影。保持距离，不惊扰、不投喂。'},
    {id:'tree-sparrow',kind:'bird',name:'树麻雀',place:'shamian',note:'栗色头顶、白脸上的黑色颊斑，是街头这位小邻居的标志。'},
    {id:'spotted-dove',kind:'bird',name:'珠颈斑鸠',place:'shamian',note:'粉褐色胸部与细长尾羽十分柔和，颈侧黑底白点像一串珍珠。'},
    {id:'crested-myna',kind:'bird',name:'八哥',place:'yuexiu',note:'通体黑色，额前竖着小羽冠；浅色嘴和黄色脚很醒目。'},
    {id:'red-whiskered-bulbul',kind:'bird',name:'红耳鹎',place:'yuexiu',note:'高高的黑色羽冠、白颊后的红斑和红色尾下覆羽，是辨认线索。'},
    {id:'red-billed-blue-magpie',kind:'bird',name:'红嘴蓝鹊',place:'yuexiu',note:'红嘴红脚、蓝色翅膀，长长的尾羽在林间转身时格外显眼。'},
    {id:'cinereous-tit',kind:'bird',name:'苍背山雀',place:'yuexiu',note:'黑头白颊、灰色背部，浅色腹部中央有一道黑色纵纹。'},
    {id:'swinhoes-white-eye',kind:'bird',name:'暗绿绣眼鸟',place:'yuexiu',note:'橄榄绿色的小身影常在枝叶间跳动，完整的白眼圈像细细的绣线。'},
    {id:'long-tailed-shrike',kind:'bird',name:'棕背伯劳',place:'shamian',note:'黑色眼罩、棕色背部与修长黑尾，常见它停在开阔处的高枝上。'},
    {id:'black-drongo',kind:'bird',name:'黑卷尾',place:'shamian',note:'全身黑色带微弱光泽，末端分叉的长尾是最醒目的特征。'},
    {id:'black-collared-starling',kind:'bird',name:'黑领椋鸟',place:'shamian',note:'浅色头部配上宽大的黑色颈环，眼周裸露的黄色皮肤也很特别。'},
    {id:'white-rumped-munia',kind:'bird',name:'白腰文鸟',place:'yuexiu',note:'厚实的锥形嘴适合啄食种子，深褐色身体后方藏着一块白腰。'},
    {id:'scaly-breasted-munia',kind:'bird',name:'斑文鸟',place:'yuexiu',note:'栗褐色头部下方，浅色胸腹布满细密的深色鳞状斑纹。'},
    {id:'chinese-blackbird',kind:'bird',name:'乌鸫',place:'shamian',note:'雄鸟深色羽毛衬着橙黄色嘴和眼圈，常在草地上翻找食物。'},
    {id:'white-wagtail',kind:'bird',name:'白鹡鸰',place:'canton',note:'黑白相间、身形纤细，走路时常不停摆动那条修长的尾巴。'},
    {id:'barn-swallow',kind:'bird',name:'家燕',place:'canton',note:'蓝黑色背部、栗红色额和喉，深叉形尾巴末端拖着两条细长尾羽。'},
    {id:'night-heron',kind:'bird',name:'夜鹭',place:'canton',note:'黑顶灰翅、红色眼睛，蹲着时脖子短短的，常在黄昏水边活动。'},
    {id:'chinese-pond-heron',kind:'bird',name:'池鹭',place:'canton',note:'繁殖期头颈转为栗红色，白色翅膀和深色背部形成鲜明对比。'},
    {id:'grey-heron',kind:'bird',name:'苍鹭',place:'canton',note:'灰色的大型鹭鸟，长颈长腿，头侧的黑色眉纹一直延伸到后枕。'},
    {id:'common-moorhen',kind:'bird',name:'黑水鸡',place:'yongqing',note:'红色额甲与黄色嘴尖很醒目，体侧有白线，长脚趾适合在水边行走。'},
    {id:'white-breasted-waterhen',kind:'bird',name:'白胸苦恶鸟',place:'yongqing',note:'白脸白胸与深灰色背部相衬，尾下栗色，常悄悄穿行在水边植被中。'},
    {id:'owl',kind:'bird',name:'领角鸮',place:'baiyun',hidden:true,note:'猫头鹰的一种。短短的耳羽簇、圆圆的面盘与灰褐色斑纹，让它几乎融进夜间的树影。'},
    {id:'chiffon',kind:'art',name:'シフォン · 榕荫来信',place:'yuexiu',note:'树荫下忽然出现的像素身影，让 Toqin 找到了柔和的配色。'},
    {id:'shama',kind:'art',name:'しゃま · 骑楼午后',place:'shamian',note:'骑楼的线条和搭档的轮廓，变成了画册里的广州午后。'},
    {id:'milk',kind:'art',name:'みるく · 珠江晚风',place:'canton',note:'把珠江边的光点拼成像素，Toqin 终于画出了想要的表情。'},
    {id:'salt',kind:'art',name:'ソルト · 西关漫游',place:'yongqing',note:'西关小巷的最后一张速写，补全了这组城市奇遇。'}
  ];
  const QUESTS={
    'elubos':{title:'观鸟奇遇',buff:'敏锐观察',effect:'读谱力 +0.25，初见谱面预期达成率 +0.08%',steps:[
      {name:'第一次听见鸟鸣',place:'yuexiu',time:45,stamina:8,cost:0,entry:'bulbul',text:'elubos把望远镜递给你：“先听，再找。榕树上那只是白头鹎。”你们开始记录广州的鸟类。'},
      {name:'沙面的黑白歌者',place:'shamian',time:50,stamina:10,cost:0,entry:'robin',text:'你们安静地等在树荫下。鹊鸲落在草地边，elubos按下快门：“这次没有惊动它。”'},
      {name:'沿江的白色身影',place:'canton',time:60,stamina:12,cost:0,entry:'egret',text:'白鹭沿着江岸缓缓觅食。你学会先观察路线，再寻找合适的记录角度。'},
      {name:'翠色的一瞬',place:'yongqing',time:60,stamina:12,cost:0,entry:'kingfisher',text:'蓝色身影一闪，你先发现了水边的翠鸟。elubos收好相机：“最后还有一位夜里的朋友。下次深夜 22:00–04:00，留出 90 分钟，和我一起进白云山吧。”'},
      {name:'白云山的夜行者',place:'baiyun',unlockPlace:true,night:true,time:90,stamina:18,cost:10,entry:'owl',text:'你和elubos走进白云山，放轻脚步，循着低低的鸣声望向树梢。一只领角鸮转过头来，圆圆的眼睛映着微光。“找到它了。”你们安静记录下这位隐藏的夜行者，约好以后再来。'}]},
    'Toqin':{title:'像素灵感漫游',buff:'构图直觉',effect:'星星力 +0.25，星星谱面预期达成率 +0.06%',steps:[
      {name:'没有灵感的画手',place:'yuexiu',time:45,stamina:8,cost:0,entry:'chiffon',text:'Toqin 正对着空白画布发愁。榕树下出现了像素化的シフォン！你们赶紧记下这个不可思议的轮廓。'},
      {name:'骑楼里的像素',place:'shamian',time:55,stamina:10,cost:0,entry:'shama',text:'しゃま的身影从骑楼边探出来。你帮 Toqin 选景，他终于画下第一张满意的草稿。'},
      {name:'把晚风画下来',place:'canton',time:60,stamina:12,cost:0,entry:'milk',text:'珠江边的みるく化成了小小光点。Toqin 不再追求完美，而是认真记住这一刻。'},
      {name:'广州像素画展',place:'yongqing',time:75,stamina:14,cost:10,entry:'salt',text:'最后遇见了ソルト。四幅画在西关的小展墙上排开，Toqin 把你的名字写进了创作感谢。'}]},
    'COLDDD':{title:'狂赌之渊',buff:'牌桌定心',effect:'键盘力 +0.25，低于普通状态时的状态扣分减少 30%',steps:[
      {name:'猫窝初对局',time:0,stamina:0,cost:0,text:'“我叫COLDDD，但今晚还想打一局。”她拉开猫窝牌桌旁的椅子，你们开始了第一场练习。'},
      {name:'复盘与舍牌',time:30,stamina:5,cost:0,text:'你们把牌河重新摆了一遍。她开始记住什么时候该进攻，什么时候该停手。'},
      {name:'赛前练习',time:0,stamina:0,cost:0,text:'“再陪我练一场吧。”这次她不再只盯着自己的手牌，也会观察另外三家的动作。'},
      {name:'广州预选赛',time:0,stamina:0,cost:0,text:'练习终于有了回报。她完成了预选赛，拿着参赛证约你继续准备下一轮。'},
      {name:'决赛前的约定',time:40,stamina:8,cost:0,text:'你陪她整理牌谱和比赛安排。她说：“输赢之外，我现在真的喜欢打麻将了。”'},
      {name:'广州立直麻将大赛',time:0,stamina:0,cost:0,text:'最后一场打完，她认真向你道谢。这个春天的牌桌故事，成了你们共同的回忆。'}]}
  };
  function ensure(s){
    s.world??={};const w=s.world;
    w.seed??=(s.seed^0x4abcde)>>>0;w.locations??=(s.city?.visited||[]).filter(id=>LOCATIONS.includes(id));
    w.friends??=[];w.dm??={};w.dmDays??={};w.quests??={};w.entries??=[];w.notice??=null;w.lifeBucket??=-1;w.life??={};w.metSleep??=false;w.mahjong??={rounds:0,wins:0,last:null,active:null};
    w.mahjong.collection??={};w.mahjong.tutorialDone??=w.mahjong.rounds>0;
    w.dialogue??={birdGuideSent:(w.dm['elubos']||[]).some(m=>!m.self&&/一起出发|整段游览/.test(m.text))};
    for(const id of NAMES){w.quests[id]??={stage:0,lastDay:0,started:false};w.quests[id].rewarded??=w.quests[id].stage>=(id==='elubos'?4:QUESTS[id].steps.length);}
    w.friends=[...new Set(w.friends.filter(id=>friendNames(s).includes(id)))];
    for(const field of ['dm','dmDays'])for(const id of Object.keys(w[field]))if(!w.friends.includes(id))delete w[field][id];
    syncFriends(s);
    if(s.love){const history=w.dm['小凛'];for(const m of s.chat.filter(m=>!m.self&&m.id==='小凛'))if(!history.some(x=>x.day===m.day&&x.time===m.time&&x.text===m.text))history.push({...m});w.dm['小凛']=history.sort((a,b)=>a.day-b.day||a.time-b.time).slice(-40);s.chat=s.chat.filter(m=>m.self||m.id!=='小凛');}
    // A reload forfeits the live table; already spent time and fees stay spent.
    if(w.mahjong.active){w.mahjong.active=null;w.mahjong.last={text:'上次对局中途离桌，未计入支线进度。',scores:[]};}
  }
  function rand(s){const w=s.world;w.seed=(Math.imul(w.seed,1664525)+1013904223)>>>0;return w.seed/4294967296;}
  function message(s,id,text,entry=null){G.postNPCMessage(s,s.npcs.find(n=>n.id===id),text,entry?{worldEntry:entry}:{});}
  function dm(s,id,text,self=false){const a=s.world.dm[id]??=[];if(!self&&a.some(m=>!m.self&&m.text===text&&now(s)-((m.day-1)*1440+m.time)<20))return;a.push({id:self?s.profile.id:id,text,day:s.day,time:s.clock,self});s.world.dm[id]=a.slice(-40);}
  function collectibleBirds(s,place){return ENTRIES.filter(e=>e.kind==='bird'&&!e.hidden&&e.place===place&&!CHAT_BIRDS.includes(e.id)&&!s.world.entries.includes(e.id));}
  function birdReply(s,text){
    const p=s.world.quests['elubos'],step=QUESTS['elubos'].steps[p.stage];
    const daily='在娱乐或图鉴里点“出发观鸟”，主动选择已发现的地点，白天 06:00–18:00 留出 45 分钟。按住按钮让取景框上升，松开下降，持续对准鸟儿积累观察进度。观察成功才会记入图鉴；普通闲逛不会自动记录鸟。';
    let guide;
    if(p.stage===0)guide=s.world.locations.includes('yuexiu')?'第一次观鸟我陪你去越秀公园。在我们的私聊或好友支线里点“一起出发”，完成这一轮后，你就能自己去各处记录更多鸟了。':'先从娱乐里的“出门闲逛”发现越秀公园，再到我们的私聊或好友支线里点“一起出发”。第一次观鸟我陪你去，之后你就能自己收集更多鸟了。';
    else if(step?.night)guide='最后一轮，和我一起去白云山找夜行的朋友吧。22:00–04:00 之间留出完整的 90 分钟，凌晨最晚 02:30 出发；准备 18 体力和 ¥10。在我们的支线里点“一起出发”，完成后还能解锁白云山。';
    else guide=daily+(step?`我们下一轮去${G.OUTINGS.find(x=>x.id===step.place).name}，在私聊或好友支线里点“一起出发”。`:'我们一起的观鸟故事完成了，还没记全的鸟可以继续慢慢找。');
    // Hidden birds only enter the conversation's species pool after discovery.
    const bird=ENTRIES.find(e=>e.kind==='bird'&&(!e.hidden||s.world.entries.includes(e.id))&&(text.includes(e.name)||e.id==='kingfisher'&&text.includes('翠鸟')));
    const place=G.OUTINGS.find(x=>DISCOVERABLE.includes(x.id)&&text.includes({yuexiu:'越秀',shamian:'沙面',canton:'花城',yongqing:'永庆'}[x.id]));
    if(p.stage>0&&place){const left=collectibleBirds(s,place.id).length;guide=`${place.name}${s.world.locations.includes(place.id)?'已经找到了':'还没发现，先出门闲逛找一找'}。那里还有 ${left} 种普通鸟没记录。${daily}`;}
    else if(p.stage>0&&(/自己|白天|随机|概率|重复|没.*鸟|不.*触发/.test(text)||p.stage!==4&&/时间|几点/.test(text)))guide=daily+(step?.night?'不过我们最后一轮的邀约要在深夜 22:00–04:00，留足 90 分钟。':'');
    if(step&&p.lastDay===s.day)guide+='今天已经一起去过了，下一轮要等明天。';
    if(step&&s.phase!=='home')guide+='先结束这次出勤，回去后再一起出发。';
    if(p.stage>0&&p.stage<4&&step&&!s.world.locations.includes(step.place))guide+='下一处地点还没发现的话，先出门闲逛找一找。';
    const previous=[...(s.world.dm['elubos']||[])].reverse().find(m=>!m.self)?.text||'';
    const tip=bird?`${bird.name}：${bird.note}`:/猫头鹰|领角鸮|白云山|隐藏/.test(text)?'夜间观察要放轻声音，避免用闪光灯或强光直照鸟的眼睛，听到叫声也不要用录音引诱。':/装备|望远镜|相机|拍照/.test(text)?BIRD_TIPS[2]:/投喂|保护|注意|巢|幼鸟/.test(text)?BIRD_TIPS[3]:/辨认|识别|认鸟/.test(text)?BIRD_TIPS[1]:/鸟鸣|叫声|清晨|黄昏/.test(text)?BIRD_TIPS[4]:BIRD_TIPS[(BIRD_TIPS.findIndex(t=>previous.includes(t))+1)%BIRD_TIPS.length];
    const asked=!!place||/怎么.*观鸟|如何.*观鸟|自己.*观鸟|观鸟.*(时间|触发)|下一轮|出发|几点|随机|概率/.test(text);
    const explain=!s.world.dialogue.birdGuideSent||asked;s.world.dialogue.birdGuideSent=true;
    return explain?[guide,tip]:[tip];
  }
  function syncFriends(s){if(!s.world||!s.npcs)return;const w=s.world;if(s.love&&!w.friends.includes('小凛')){w.friends.push('小凛');dm(s,'小凛','我是小凛。以后想约打歌、聊近况，都在这里找我吧。');}for(const n of s.npcs){if(!NAMES.includes(n.id)||n.familiarity<30||w.friends.includes(n.id))continue;if(n.id==='COLDDD'&&!w.metSleep)continue;w.friends.push(n.id);dm(s,n.id,NAMES.includes(n.id)?{'elubos':'除了舞萌，我还喜欢观鸟。有空一起去广州的公园走走？','Toqin':'最近画画卡住了……你听说街头那些像素搭档了吗？','COLDDD':'猫窝的牌桌一直给你留着位置。陪我练练，目标广州大赛！'}[n.id]:'群里经常见，终于加上好友了！有空一起出勤。');}}
  function tick(s){if(!s.world)return;syncFriends(s);const w=s.world,b=Math.floor(now(s)/240);if(w.lifeBucket===b)return;w.lifeBucket=b;
    for(const [i,id]of NAMES.entries()){
      const night=s.clock<480||s.clock>=1380,places=['yuexiu','shamian','canton','yongqing'],place=places[(Math.floor(rand(s)*4)+i)%4];
      w.life[id]=id==='elubos'&&w.quests[id].stage===4&&(s.clock>=1320||s.clock<240)?'白云山山脚 · 等你一起观鸟':night||id==='COLDDD'?G.npcStatus(s,s.npcs.find(n=>n.id===id)):G.OUTINGS.find(x=>x.id===place).name+(id==='elubos'?' · 观鸟':' · 街头速写');
      if(!night&&rand(s)<.34){const entry=ENTRIES.find(e=>e.place===place&&(id==='elubos'?CHAT_BIRDS.includes(e.id):e.kind==='art'));
        message(s,id,id==='elubos'?`今天在${G.OUTINGS.find(x=>x.id===place).name}记录了${entry.name}，把照片发给大家看看。`:id==='Toqin'?'出门找了找灵感，广州街头好像真的有像素搭档！':(G.denVisitors(s).some(n=>n.id===id)?'在猫窝摆牌谱，刚才那手还是应该早点防守。':'在家复盘，刚才那手还是应该早点防守。'),id==='elubos'?entry.id:null);}
    }
  }
  function notify(s,title,text,entry=null){s.world.notice={title,text,entry};G.log(s,text,'event');}
  function active(s){if(G.majorBlocked(s)||s.ending||s.school.pending||s.event!==null||s.videoEvent||s.city.encounter||s.world.notice||s.world.mahjong.active)throw Error('请先完成当前事件或对局。');}
  function spend(s,time,stamina,cost=0){active(s);if(s.stamina<stamina||s.money<cost+G.hourlyCost(s,time))throw Error('体力或余额不足。');if(!G.canSpendTime(s,time)||s.phase==='play'&&s.clock+time>G.availableUntil(s))throw Error('时间不足或与固定日程冲突。');G.advance(s,time);if(s.ending)return false;s.stamina-=stamina;s.money-=cost;return true;}
  function send(s,id,text){syncFriends(s);if(!s.world.friends.includes(id))throw Error('眼熟度达到 30 后可成为好友。');if(!['home','play','travel'].includes(s.phase))throw Error('先完成当前阶段。');text=String(text).trim();if(!text||text.length>100)throw Error('请输入 1–100 个字符。');if(!spend(s,5,0))return;if(id==='小凛'){G.chatLin(s,text);G.log(s,'和小凛私聊了 5 分钟。','heart');return;}dm(s,id,text,true);const n=s.npcs.find(n=>n.id===id);if(s.world.dmDays[id]!==s.day){n.familiarity=clamp(n.familiarity+4,0,100);s.world.dmDays[id]=s.day;}if(id==='elubos'){if(/谢谢|多谢|累|困|睡|麻将|打歌|舞萌|下班|在干嘛/.test(text))dm(s,id,G.npcReply(s,id,text));else for(const reply of birdReply(s,text))dm(s,id,reply);}else dm(s,id,G.npcReply(s,id,text));G.log(s,`和${id}私聊了 5 分钟。`,'heart');}
  function questReason(s,id){const q=QUESTS[id],p=s.world.quests[id];if(!q)return '没有这条支线';if(!s.world.friends.includes(id))return id==='COLDDD'?'先在猫窝打一局麻将':'眼熟度达到 30 后解锁好友';if(p.stage>=q.steps.length)return '故事已完成';if(p.lastDay===s.day)return '明天再继续';const step=q.steps[p.stage];if(step.place&&!step.unlockPlace&&!s.world.locations.includes(step.place))return `出门闲逛发现${G.OUTINGS.find(x=>x.id===step.place).name}`;if(step.night&&!(s.clock>=1320||s.clock+step.time<=240))return '深夜 22:00–04:00，预留 90 分钟';if(id==='COLDDD'){if(s.phase!=='play'||s.arcade!==5)return '前往猫窝';if(!step.time)return '完成一局麻将以继续';}else if(s.phase!=='home')return '结束出勤后再出门';return '';}
  function complete(s,id){const p=s.world.quests[id],q=QUESTS[id],step=q.steps[p.stage];p.started=true;p.stage++;p.lastDay=s.day;
    if(step.entry&&!s.world.entries.includes(step.entry))s.world.entries.push(step.entry);s.mood=clamp(s.mood+8,0,100);s.money+=20;
    const n=s.npcs.find(n=>n.id===id);n.familiarity=clamp(n.familiarity+8,0,100);dm(s,id,step.text);
    let reward='心情 +8 · 获得 ¥20';if(p.stage===q.steps.length&&!p.rewarded){const key={'elubos':'reading','Toqin':'star','COLDDD':'key'}[id];s.skills[key]=clamp(s.skills[key]+.25,1,22);p.rewarded=true;reward+=` · 获得「${q.buff}」：${q.effect}`;}
    if(step.unlockPlace&&!s.world.locations.includes(step.place)){s.world.locations.push(step.place);reward+=' · 解锁新地点：'+G.OUTINGS.find(x=>x.id===step.place).name;}
    notify(s,q.title+' · '+step.name,step.text+'\n'+reward,step.entry);G.check(s);
  }
  function quest(s,id){const reason=questReason(s,id);if(reason)throw Error(reason);const step=QUESTS[id].steps[s.world.quests[id].stage];if(id==='elubos')return G.startBird(s,step.place,true);if(!spend(s,step.time,step.stamina,step.cost))return;if(step.place)s.nutrition.away=true;complete(s,id);}
  function bonus(s,c){if(!s.world)return 0;let value=0;if(s.world.quests['elubos'].rewarded&&!s.practice[G.key(c)])value+=.08;if(s.world.quests.Toqin.stage===4&&c.tendency==='star')value+=.06;if(s.world.quests['COLDDD'].stage===6&&s.condition<2)value+=Math.abs(G.CONDITIONS[s.condition].score)*.3;return value;}
  function afterExplore(s,id,before){const w=s.world;if(s.ending||s.city.encounter)return;
    if(LOCATIONS.includes(id)){
      const place=G.OUTINGS.find(x=>x.id===id);
      notify(s,'来到'+place.name,`${place.place}。${NAMES.filter(n=>w.life[n]?.startsWith(place.name)).map(n=>`${n}也在这里，朝你挥了挥手。`).join('')||'你放慢脚步，看看今天的街景。'}`);return;
    }
    if(id!=='stroll')return;
    const a=s.city.arcades.find(x=>!before.arcades.includes(x)),r=s.city.restaurants.find(x=>!before.restaurants.includes(x));
    if(a!==undefined){notify(s,'发现新机厅',`你走进一条没来过的街巷，发现了${G.ARCADES[a].name}。群友已经开始约下一次出勤。`);return;}
    if(r){notify(s,'发现餐馆',`香味从门口飘出来，你记下了${G.RESTAURANTS.find(x=>x.id===r).name}的地址，下机后可以来吃。`);return;}
    const left=DISCOVERABLE.filter(x=>!w.locations.includes(x));if(left.length){const place=left[Math.floor(rand(s)*left.length)];w.locations.push(place);const x=G.OUTINGS.find(x=>x.id===place);notify(s,'发现新地点 · '+x.name,`闲逛时，你来到${x.name}，${x.place}让你停下脚步。现在可以再次来这里，也许能遇到正在外出的好友。`);message(s,'elubos',`你发现了${x.name}？那里很适合慢慢走，下次一起。`);}else notify(s,'熟悉街巷的新风景','广州的几处特别去处都记下了。今天沿着熟悉的街道走了走，也很开心。');
  }
  function startMahjong(s){active(s);if(s.phase!=='play'||s.arcade!==5)throw Error('请先前往猫窝。');const seats=G.mahjongPlayers(s);if(seats.length<3)throw Error('猫窝还没凑齐三位牌友，晚点再来。');if(!spend(s,25,8))return false;
    const w=s.world;if(seats.some(n=>n.id==='COLDDD')){w.metSleep=true;const n=s.npcs.find(n=>n.id==='COLDDD');n.familiarity=Math.max(30,n.familiarity);syncFriends(s);}w.mahjong.active={day:s.day,time:s.clock,players:seats.map(n=>n.id)};G.log(s,'在猫窝和'+seats.map(n=>n.id).join('、')+'开了一桌立直麻将。25 分钟，体力 -8，计入小时费用。','heart');return true;
  }
  function finishMahjong(s,result){
    const w=s.world,m=w.mahjong;if(!m.active)throw Error('当前没有对局。');
    if(!result||typeof result.text!=='string'||!Array.isArray(result.scores)||result.scores.length!==4||!result.scores.every(Number.isFinite)||result.wins!==undefined&&(!Array.isArray(result.wins)||!result.wins.every(x=>Number.isInteger(x.winner)&&x.winner>=0&&x.winner<4&&Array.isArray(x.yaku)&&x.yaku.every(y=>typeof y.name==='string'))))throw Error('无效对局结果。');
    const withTeacher=!m.active.players||m.active.players.includes('COLDDD');if(withTeacher)m.tutorialDone=true;const playerWins=result.wins?.filter(x=>x.winner===0)||[];m.active=null;m.rounds++;if(result.wins?playerWins.length:result.scores[0]>25000)m.wins++;
    const earned=[...new Set(playerWins.flatMap(x=>x.yaku.map(y=>YAKU.find(e=>e.source.includes(y.name))?.id).filter(Boolean)))];
    for(const id of earned){const record=m.collection[id]??={count:0,firstDay:s.day};record.count++;}
    m.last={text:result.text.slice(0,200),scores:result.scores,yaku:earned};s.mood=clamp(s.mood+5,0,100);const q=w.quests['COLDDD'];
    if(withTeacher&&q.stage<6&&!QUESTS['COLDDD'].steps[q.stage].time&&q.lastDay!==s.day)complete(s,'COLDDD');else G.log(s,'猫窝麻将结束：'+result.text,'heart');
    G.collectionRewards(s);if(earned.length)G.log(s,'役种记录：'+earned.map(id=>YAKU.find(e=>e.id===id).name).join('、'),'event');
  }
  function mahjongPlayers(s){return G.denVisitors(s).sort((a,b)=>Number(b.id==='COLDDD')-Number(a.id==='COLDDD')).slice(0,3);}
  function valid(s){const w=s.world;if(!w||!Number.isInteger(w.seed)||!Array.isArray(w.locations)||new Set(w.locations).size!==w.locations.length||!w.locations.every(x=>LOCATIONS.includes(x)))return false;
    if(typeof w.mahjong?.tutorialDone!=='boolean')return false;
    if(s.phone&&(!Number.isSafeInteger(s.phone.next)||s.phone.next<0||!s.phone.read||Array.isArray(s.phone.read)||!Object.entries(s.phone.read).every(([id,value])=>['group',...friendNames(s)].includes(id)&&Number.isSafeInteger(value)&&value>=0&&value<=s.phone.next)))return false;
    if(!w.dialogue||typeof w.dialogue.birdGuideSent!=='boolean'||!w.mahjong?.collection||Array.isArray(w.mahjong.collection)||!Object.entries(w.mahjong.collection).every(([id,v])=>YAKU.some(e=>e.id===id)&&v&&Number.isInteger(v.count)&&v.count>0&&v.count<=w.mahjong.wins&&Number.isInteger(v.firstDay)&&v.firstDay>=1&&v.firstDay<=s.day))return false;
    if(!Array.isArray(w.friends)||w.friends.length>4||new Set(w.friends).size!==w.friends.length||!w.friends.every(x=>friendNames(s).includes(x)&&s.npcs.some(n=>n.id===x))||!Array.isArray(w.entries)||w.entries.length>ENTRIES.length||new Set(w.entries).size!==w.entries.length||!w.entries.every(x=>ENTRIES.some(e=>e.id===x)))return false;
    if(!w.quests||!NAMES.every(id=>{const p=w.quests[id];return p&&Number.isInteger(p.stage)&&p.stage>=0&&p.stage<=QUESTS[id].steps.length&&Number.isInteger(p.lastDay)&&p.lastDay>=0&&p.lastDay<=s.day&&typeof p.started==='boolean'&&typeof p.rewarded==='boolean';}))return false;
    if(!w.dm||!Object.entries(w.dm).every(([id,a])=>w.friends.includes(id)&&Array.isArray(a)&&a.length<=40&&a.every(m=>typeof m.text==='string'&&m.text.length<=300&&typeof m.id==='string'&&Number.isInteger(m.day)&&Number.isInteger(m.time))))return false;
    const m=w.mahjong;return typeof w.metSleep==='boolean'&&w.dmDays&&w.life&&Number.isInteger(w.lifeBucket)&&!!m&&['rounds','wins'].every(k=>Number.isInteger(m[k])&&m[k]>=0&&m[k]<=10000)&&m.wins<=m.rounds&&(!w.notice||typeof w.notice.title==='string'&&w.notice.title.length<100&&typeof w.notice.text==='string'&&w.notice.text.length<1000&&(!w.notice.entry||ENTRIES.some(e=>e.id===w.notice.entry)))&&(!m.active||Number.isInteger(m.active.day)&&Number.isInteger(m.active.time)&&Array.isArray(m.active.players)&&m.active.players.length===3&&new Set(m.active.players).size===3&&m.active.players.every(id=>s.npcs.some(n=>n.id===id)));
  }
  function install(api){G=api;Object.assign(api,{WORLD_ENTRIES:ENTRIES,MAHJONG_YAKU:YAKU,QUESTS,completeBirdQuest:s=>complete(s,'elubos'),worldTick:tick,syncFriends,sendDM:send,questReason,doQuest:quest,mahjongPlayers,startMahjong,finishMahjong,worldScoreBonus:bonus,availableOutings:s=>G.OUTINGS.filter(x=>!LOCATIONS.includes(x.id)||s.world.locations.includes(x.id))});
    const explore=G.explore;G.explore=(s,id)=>{active(s);if(!G.availableOutings(s).some(x=>x.id===id))throw Error('先出门闲逛发现这个地点。');const before={day:s.day,clock:s.clock,arcades:[...s.city.arcades],restaurants:[...s.city.restaurants]};explore(s,id);afterExplore(s,id,before);};
  }
  const api={ensure,valid,install};if(typeof module!=='undefined')module.exports=api;else root.World=api;
})(globalThis);
