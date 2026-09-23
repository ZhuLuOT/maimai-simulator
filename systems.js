(function(root){
  'use strict';
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const rand=s=>{s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296;};
  const IDS=['逃遁','鲁米诺','elubos','Toqin','COLDDD','星轨','小盐','404NOTFOUND','八分音符','纸飞机','折返跑','凛冬','橘子汽水','月读','栗子','白昼梦','NekoDX','竹间雨','北纬31','千层雪','再来一把','空白键','mikan','摇光','未完成','七海','镜花','下次一定','微光','晚风'];
  const CONDITIONS=[{name:'极差',score:-.65},{name:'还行',score:-.25},{name:'普通',score:0},{name:'不错',score:.13},{name:'完美',score:.26}];
  const GLOVES=[{id:'cotton',name:'棉线手套',cost:8,durability:100,wear:1},{id:'sport',name:'耐磨手套',cost:25,durability:240,wear:.85}];
  const TALENT_SKILLS={'curse-breaker':{amount:2,skills:['star','key','reading']},transfer:{amount:3,skills:['star','key','reading']},musician:{amount:2,skills:['star','key','reading']},dragon:{amount:2,skills:['star','key','reading']},foundation:{amount:2,skills:['star','key','reading']},expert:{amount:2,skills:['star','key','reading']},reader:{amount:2,skills:['reading']},key:{amount:2,skills:['key']},star:{amount:2,skills:['star']},slide:{amount:2,skills:['star']},reading:{amount:2,skills:['reading']},speed:{amount:2,skills:['key']}};
  const TALENTS=[
    ['transfer','其他音游转生者','初始全底力 +3',true],['endurance','体力过人','体力上限 +10',true],['musician','精通乐器','初始全底力 +2',true],['friends','熟人小团体','所有群友眼熟度 +25',true],['reader','读谱天才','读谱力 +2',true],['steady','稳定发挥','不会出现极差状态',true],['rich','富哥','初始资金 +1000',true],['dragon','龙B！','初始全底力 +2 · 第二周目起',true],['gifted','天赋异禀','每曲底力成长 +5%',true],
    ['foundation','基本功扎实','B35 旧最佳满 35 张且均为 12 / 12+ 谱面，全底力 +2'],['adapt','快适应体质','同谱累计游玩 10 次；复打有效底力 +0.3'],['key','键盘B','累计 500 首标级大于 12 的键盘谱（12+ 及以上）；键盘力 +2'],['star','星星B','累计 500 首标级大于 12 的星星谱（12+ 及以上）；星星力 +2'],['slide','一眼会划','100 张 12+ 以上星星谱达到鸟；星星力 +2'],['reading','见招拆招','初见 150 张谱面；读谱力 +2'],['speed','天生的手速','100 张 12+ 以上键盘谱达到鸟；键盘力 +2'],['instinct','手比脑快','累计游玩 250 首；可开启凭手感模式'],['streak','越打越有','累计 50 PC；每段连续第 5 PC 全底力临时 +2'],['challenge','就爱越级','越级谱游玩 30 首；越级有效底力 +0.3'],['stage','舞台型选手','人多时累计游玩 40 首；人越多分数略有加成'],['expert','精于此道','累计 1000 首；全底力 +2'],['classic','吃屎大王','真超檄世代游玩 50 首；对应曲有效底力 +0.5'],['vocal','V家爱好者','V 家分区游玩 80 首；对应曲有效底力 +0.5'],['touhou','东方痴','东方分区游玩 80 首；对应曲有效底力 +0.5'],['ghost','鬼歌王','鬼歌游玩 50 首；对应曲有效底力 +0.5，但拼机伙伴眼熟度 -2']
  ].map(([id,name,description,initial=false])=>({id,name,description:TALENT_SKILLS[id]?description.replace(` +${TALENT_SKILLS[id].amount}`,`最高 +${TALENT_SKILLS[id].amount}`)+'（随对应底力递减）':description,initial}));
  TALENTS.push({id:'half-maimai',name:'半个舞萌痴',description:'被空间斩送出机厅。纪念词条，无数值加成。',hidden:true},{id:'curse-breaker',name:'终结诅咒之人',description:'四曲总分战胜两面宿傩，参透咒力的核心。全底力最高 +2（随对应底力递减，仅获得时生效一次）。',hidden:true});
  const P=typeof module!=='undefined'?require('./precision'):root.Precision;
  const M=typeof module!=='undefined'?require('./gameplay'):root.Gameplay;
  let G;
  const has=(s,id)=>s.talents.includes(id);
  function ensure(s){
    P.ensure(s);
    s.skills.reading??=(s.skills.star+s.skills.key)/2;
    s.profile??={name:'玩家',id:'初来乍到',plate:'default'};
    s.talents??=[];s.curseBreakerRewarded??=false;s.maxStamina??=100;s.stamina??=s.maxStamina;
    s.gloves??={...GLOVES[0],durability:100};s.liquid??=s.drink?600:0;
    s.condition??=2;s.queueUntil??=0;s.consecutive??=0;s.partner??=null;s.friendship??=false;s.instinct??=false;
    s.metrics??={star:0,key:0,challenge:0,crowd:0,classic:0,vocal:0,touhou:0,ghost:0};
    s.npcs??=IDS.map((id,i)=>({id,rating:7800+Math.floor(rand(s)*8000),familiarity:0,activity:1+i%4}));
    const renamed={'凌晨四点':'逃遁','青柠苏打':'鲁米诺','捞月':'elubos','电压':'elubos','阿澈':'Toqin','今天不推分':'COLDDD','我要睡觉':'COLDDD'},rename=id=>renamed[id]||id;
    const partnerId=s.partner===null?null:rename(s.npcs[s.partner]?.id);
    const merged=new Map();
    for(const n of s.npcs){if(Number.isFinite(n.rating))n.rating=Math.min(G.NPC_RATING_CAP,n.rating);n.id=rename(n.id);const existing=merged.get(n.id);if(existing){existing.familiarity=Math.max(existing.familiarity,n.familiarity);existing.rating=Math.max(existing.rating,n.rating);}else merged.set(n.id,n);}
    s.npcs=[...merged.values()];
    for(const id of IDS)if(s.npcs.length<30&&!merged.has(id))s.npcs.push({id,rating:7800,familiarity:0,activity:1});
    if(partnerId){const index=s.npcs.findIndex(n=>n.id===partnerId);s.partner=index<0?null:index;}
    if(s.world){const w=s.world;w.friends=[...new Set((w.friends||[]).map(rename))];
      for(const field of ['dm','dmDays','quests','life'])if(w[field])for(const id of Object.keys(w[field])){const canonical=rename(id);if(canonical===id)continue;
        if(field==='dm')w[field][canonical]=[...(w[field][canonical]||[]),...w[field][id]].sort((a,b)=>a.day-b.day||a.time-b.time).slice(-40);
        else if(field==='quests'){if(!w[field][canonical]||w[field][id].stage>w[field][canonical].stage)w[field][canonical]=w[field][id];}
        else w[field][canonical]??=w[field][id];delete w[field][id];}
      for(const messages of Object.values(w.dm||{}))messages.forEach(m=>{if(!m.self)m.id=rename(m.id);});
    }
    s.chat?.forEach(m=>{if(!m.self)m.id=rename(m.id);});
    if(s.phone?.read)for(const id of Object.keys(s.phone.read)){const canonical=rename(id);if(canonical!==id){s.phone.read[canonical]=Math.max(s.phone.read[canonical]||0,s.phone.read[id]);delete s.phone.read[id];}}
    for(const r of [...Object.values(s.records),...(s.last?.results||[]),...(s.trip?.played||[])])if(r.opponent)r.opponent.id=rename(r.opponent.id);
    if(s.last?.partnerName)s.last.partnerName=rename(s.last.partnerName);
    for(const battle of [s.competition?.last,s.last?.battle])if(battle?.opponent)battle.opponent=rename(battle.opponent);
    s.crowdSeen??={arcade:s.arcade,count:G.peopleAt(s)};s.socialTick??=(s.day-1)*1440+s.clock;s.crowdTick??=Math.floor(s.clock/30);s.crowdShift??=0;
    s.chat??=[];s.chatDay??=s.day;s.chatCount??=0;s.chatRefresh??=-1;
    G.ensureSocialLife(s);
    s.completedRun??=false;s.setupDone??=s.started||Object.keys(s.records).length>0;
    for(const r of Object.values(s.records))r.bestCombo??=r.combo||'';
    if(['drink','play'].includes(s.phase)&&s.mode==='pair'&&(s.partner===null||G.peopleAt(s)===0||s.npcs[s.partner]?.id==='小凛'&&G.linArcade(s)!==s.arcade||s.arcade===5&&!G.denVisitors(s).some(n=>n===s.npcs[s.partner])))choosePartner(s);
    if(has(s,'curse-breaker')&&s.curseBreakerRewarded===false){const gains=applyTalentSkills(s,'curse-breaker');G.log(s,`补发词条「终结诅咒之人」奖励：${talentGainText(gains)}`,'talent');}
    return s;
  }
  function rollCondition(s){let n=Math.floor(clamp(s.mood/25+(rand(s)-.5)*2,0,4.99));if(has(s,'steady'))n=Math.max(1,n);s.condition=n;}
  function tick(s){
    P.tick(s);G.worldTick?.(s);G.linTick?.(s);G.socialLifeTick?.(s);
    const now=(s.day-1)*1440+s.clock,blocks=Math.floor((now-s.socialTick)/60);
    if(blocks>0){M.npcTick(s,blocks);s.socialTick+=blocks*60;}
    const bucket=(s.day-1)*48+Math.floor(s.clock/30);if(s.crowdTick!==bucket){s.crowdTick=bucket;s.crowdShift=Math.floor(rand(s)*5)-2;}reportCrowd(s);M.crowdChat(s);if(['drink','play'].includes(s.phase)&&s.mode==='pair'){if(G.peopleAt(s)===0){s.partner=null;s.partnerSongs=null;s.friendship=false;}else if(s.partner===null||s.npcs[s.partner]?.id==='小凛'&&G.linArcade(s)!==s.arcade||s.arcade===5&&!G.denVisitors(s).some(n=>n===s.npcs[s.partner]))choosePartner(s);}
  }
  function reportCrowd(s){const current=G.peopleAt(s),last=s.crowdSeen;if(last&&last.arcade===s.arcade&&last.count!==current&&['drink','play','meal'].includes(s.phase)){const delta=current-last.count;G.log(s,`${G.ARCADES[s.arcade].name}：${Math.abs(delta)} 位玩家${delta>0?'到店':'离店'}，当前 ${current} 人。`,'crowd');}s.crowdSeen={arcade:s.arcade,count:current};}
  function talentSkillGain(current,amount){
    // Continuous at 10, 12 and 13; every further point halves the reward.
    const scale=current<=10?1:current<13?1-(current-10)*.25:.25*2**(13-current);
    return Math.max(0,Math.min(22-current,amount*scale));
  }
  function talentGains(s,id){const reward=TALENT_SKILLS[id];return reward?Object.fromEntries(reward.skills.map(k=>[k,talentSkillGain(s.skills[k],reward.amount)])):{};}
  function talentGainText(gains){const names={star:'星星力',key:'键盘力',reading:'读谱力'};return Object.entries(gains).map(([k,n])=>`${names[k]} ${n>0&&n<.01?'+<0.01':'+'+n.toFixed(2)}`).join(' · ');}
  function applyTalentSkills(s,id){const gains=talentGains(s,id);for(const [k,n] of Object.entries(gains))s.skills[k]+=n;if(id==='curse-breaker')s.curseBreakerRewarded=true;return gains;}
  function grant(s,id){if(has(s,id))return;const t=TALENTS.find(x=>x.id===id);if(!t)throw Error('未知词条。');s.talents.push(id);
    const gains=applyTalentSkills(s,id);
    if(id==='endurance'){s.maxStamina+=10;s.stamina+=10;}if(id==='rich')s.money+=1000;
    if(id==='friends')s.npcs.forEach(n=>n.familiarity=clamp(n.familiarity+25,0,100));if(id==='steady'&&s.condition===0)s.condition=1;
    G.log(s,`获得词条「${t.name}」：${Object.keys(gains).length?talentGainText(gains):t.description}`,'talent');
  }
  function draw(s,run=1){const a=TALENTS.filter(t=>t.initial&&(t.id!=='dragon'||run>=2));for(let i=a.length-1;i>0;i--){const j=Math.floor(rand(s)*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a.slice(0,3).map(t=>t.id);}
  function setup(s,{name,id,talent,offers,playStyle='outer'}){if(s.setupDone||s.started)throw Error('角色已经创建。');name=String(name??'').trim()||'神秘人';id=String(id??'').trim()||'Maimai';if(name.length>16||id.length>16)throw Error('姓名和舞萌 ID 请填写 1–16 个字符。');if(!offers?.includes(talent))throw Error('请在本次三个词条中选择一个。');if(!G.PLAY_STYLES[playStyle])throw Error('请选择外键或内屏。');G.startGuide(s,playStyle);s.profile={name,id,plate:'default',title:'title-1',avatar:null};s.setupDone=true;grant(s,talent);rollCondition(s);}
  function crowdOffset(s){const h=s.clock/60;return h<12?-5:h>=12&&h<14?-6:h>=17&&h<19?-3:h>=19&&h<22?3:h>=22?-2:0;}
  function choosePartner(s){if(s.mode!=='pair'||G.peopleAt(s)===0){s.partner=null;s.partnerSongs=null;s.friendship=false;return;}const candidates=s.arcade===5?G.denVisitors(s):s.npcs.filter(n=>n.id!=='小凛'||G.linArcade(s)===s.arcade);if(!candidates.length){s.partner=null;s.partnerSongs=null;s.friendship=false;return;}s.partner=s.npcs.indexOf(candidates[Math.floor(rand(s)*candidates.length)]);s.partnerSongs=null;const n=s.npcs[s.partner];s.friendship=n.familiarity>=40&&rand(s)<.35;if(s.friendship)G.log(s,`${n.id}：今天你多选一首吧！本轮可自选 3 首。`,'heart');}
  function selectCount(s){return s.mode==='pair'?(s.friendship?3:2):3;}
  function partnerCharts(s,pool,count){if(s.partner===null||G.peopleAt(s)===0)return [];M.setPool(pool);return M.choose(s.npcs[s.partner],s,count);}
  function abilityBonus(s,c){let b=0;const played=s.practice[G.key(c)]||0;
    if(has(s,'adapt')&&played)b+=.3;if(has(s,'streak')&&s.consecutive>=4)b+=2;
    if(has(s,'challenge')&&G.levelValue(c)>=G.challengeThreshold(s.rating))b+=.3;
    if(has(s,'classic')&&classic(c))b+=.5;if(has(s,'vocal')&&/VOCALOID/i.test(c.genre))b+=.5;if(has(s,'touhou')&&/東方|东方/.test(c.genre))b+=.5;if(has(s,'ghost')&&c.tag==='ghost')b+=.5;
    if(s.instinct&&has(s,'instinct'))b+=.3;return b;
  }
  function scoreBonus(s,c){const plays=s.practice[G.key(c)]||0,reading=clamp((s.skills.reading-8)*.065,-.4,.65);return CONDITIONS[s.condition].score-G.sleepPenalty(s)-Math.max(0,55-s.stamina)*.025-(s.liquid<=0?.3:0)+reading*(plays? .6:1)+(has(s,'stage')?Math.min(.2,G.peopleAt(s)*.007):0);}
  function consume(s,c){const loss=M.staminaCost(s,c);if(s.trip)s.trip.staminaSpent=(s.trip.staminaSpent||0)+loss;s.stamina=clamp(s.stamina-loss,0,s.maxStamina);G.consumeDrink(s,60);s.gloves.durability=Math.max(0,s.gloves.durability-s.gloves.wear*(1+c.ds/30));}
  function classic(c){return ['maimai','maimai PLUS','maimai GreeN'].includes(c.originalVersion||c.version);}
  function qualifiedPlays(s,records,tendency){return records.filter(c=>c.tendency===tendency&&!G.isUtage(c)&&G.levelValue(c)>12).reduce((total,c)=>total+(s.practice[G.key(c)]||0),0);}
  function progress(s,results){for(const c of results){s.metrics[c.tendency]++;if(c.overreach??G.isOverreach(c.ratingBefore??s.rating,c))s.metrics.challenge++;if(G.peopleAt(s)>=12)s.metrics.crowd++;if(classic(c))s.metrics.classic++;if(/VOCALOID/i.test(c.genre))s.metrics.vocal++;if(/東方|东方/.test(c.genre))s.metrics.touhou++;if(c.tag==='ghost'){s.metrics.ghost++;if(has(s,'ghost')&&s.mode==='pair'&&s.partner!==null)s.npcs[s.partner].familiarity=Math.max(0,s.npcs[s.partner].familiarity-2);}}
    const records=Object.values(s.records),b=G.best(s);
    const triggers={foundation:b.old.length===35&&b.old.every(c=>['12','12+'].includes(G.displayLevel(c))),adapt:Object.values(s.practice).some(n=>n>=10),key:qualifiedPlays(s,records,'key')>=500,star:qualifiedPlays(s,records,'star')>=500,slide:records.filter(c=>c.tendency==='star'&&c.ds>=12.7&&c.achievement>=100).length>=100,reading:records.length>=150,speed:records.filter(c=>c.tendency==='key'&&c.ds>=12.7&&c.achievement>=100).length>=100,instinct:s.tracks>=250,streak:s.credits>=50,challenge:s.metrics.challenge>=30,stage:s.metrics.crowd>=40,expert:s.tracks>=1000,classic:s.metrics.classic>=50,vocal:s.metrics.vocal>=80,touhou:s.metrics.touhou>=80,ghost:s.metrics.ghost>=50};
    for(const [id,ready]of Object.entries(triggers))if(ready)grant(s,id);
  }
  function randomEvent(s){if(rand(s)>.22)return;const bad=rand(s)<(s.condition<2?.72:s.condition>2?.22:.4);
    if(bad){const e=Math.floor(rand(s)*3);if(e===0){s.mood=clamp(s.mood-4,0,100);G.log(s,'随机事件：一直抢拍，越打越急，心情 -4。','event');}if(e===1){s.gloves.durability=Math.max(0,s.gloves.durability-4);G.log(s,'随机事件：手套线头开了，耐久 -4。','event');}if(e===2){s.stamina=Math.max(0,s.stamina-6);G.log(s,'随机事件：肩膀发酸，体力 -6。','event');}}
    else{s.mood=clamp(s.mood+4,0,100);G.log(s,'随机事件：旁边的玩家为你刚才的发挥点赞，心情 +4。','event');}
  }
  function afterPlay(s,results){s.consecutive++;if(s.mode==='pair'&&s.partner!==null)G.npcAfterPlay(s,s.npcs[s.partner]);if(s.mode==='pair'&&s.partner!==null)s.npcs[s.partner].familiarity=clamp(s.npcs[s.partner].familiarity+2,0,100);progress(s,results);randomEvent(s);if(rand(s)<.35){const leaving=Math.min(G.peopleAt(s),1+Math.floor(rand(s)*3));s.crowdShift-=leaving;reportCrowd(s);}s.queueUntil=s.clock+G.roundInfo(s).queue;choosePartner(s);}
  function assertActive(s){if(s.ending||s.school.pending||s.event!==null||s.videoEvent||s.city.encounter||s.world?.notice||s.world?.mahjong.active)throw Error('请先处理当前事件。');}
  function spend(s,minutes){if(!G.canSpendTime(s,minutes))throw Error('时间不足或与固定日程冲突。');if(s.phase==='play'&&s.clock+minutes>G.availableUntil(s))throw Error('接近闭店或回程时间，请先下机。');G.advance(s,minutes);}
  function waitQueue(s){assertActive(s);if(s.phase!=='play')throw Error('当前不在排队。');const minutes=Math.max(0,s.queueUntil-s.clock)||15;spend(s,minutes);M.recover(s,minutes);if(s.queueUntil<=s.clock)s.roundReview=false;G.log(s,`等待 ${minutes} 分钟，体力逐渐恢复。`,'rest');}
  function rest(){throw Error('休息选项已移除，请等待或下机吃饭。');}
  function buyGloves(s,id){assertActive(s);if(!['home','travel','drink','play'].includes(s.phase))throw Error('现在不能买手套。');const g=GLOVES.find(g=>g.id===id);if(!g||s.money<g.cost)throw Error('购买手套余额不足。');s.money-=g.cost;s.gloves={...g};if(s.trip)s.trip.cost+=g.cost;G.log(s,`购买${g.name}，花费 ¥${g.cost}，耐久 ${g.durability}。`,'money');G.check(s);}
  function refill(s,id){assertActive(s);if(s.phase!=='play')throw Error('当前不在机厅。');G.packDrink(s,id);G.check(s);}
  function chatOpen(s){const bucket=(s.day-1)*48+Math.floor(s.clock/30);if(bucket===s.chatRefresh){M.crowdChat(s);return;}s.chatRefresh=bucket;G.ambientConversation(s);M.crowdChat(s);}
  function chatSend(s,text){assertActive(s);if(!['home','play','travel'].includes(s.phase))throw Error('先完成当前阶段再聊天。');text=String(text).trim();if(!text||text.length>100)throw Error('消息请输入 1–100 个字符。');if(M.bot(s,text))return;spend(s,5);if(s.ending)return;if(s.chatDay!==s.day){s.chatDay=s.day;s.chatCount=0;}s.chat.push({id:s.profile.id,text,day:s.day,time:s.clock,self:true});if(s.chatCount<5){s.npcs.filter(n=>n.id!=='小凛').forEach(n=>n.familiarity=clamp(n.familiarity+3,0,100));s.mood=clamp(s.mood+1,0,100);}s.chatCount++;const awake=G.nightVisitors(s),responders=(s.clock<480||s.clock>=1380)&&awake.length?awake:s.npcs.filter(n=>n.id!=='小凛');const n=responders[Math.floor(rand(s)*responders.length)];G.postNPCMessage(s,n,G.npcReply(s,n.id,text));s.chat=s.chat.slice(-60);s.guide.chatted=true;G.inviteToDen(s);G.log(s,'在舞萌群聊了 5 分钟。','heart');}
  function newDay(s){s.stamina=s.maxStamina;s.consecutive=0;s.queueUntil=0;s.partner=null;s.partnerSongs=null;s.friendship=false;rollCondition(s);tick(s);}
  function plates(s,pool){const groups=[['真',['maimai','maimai PLUS']],['超',['maimai GreeN']],['檄',['maimai GreeN PLUS']],['橙',['maimai ORANGE']],['晓',['maimai ORANGE PLUS']]];const out=[{id:'default',name:'初来乍到',text:'初始名牌',unlocked:true,done:0,total:0}];for(const [name,versions]of groups){const charts=pool.filter(c=>versions.includes(c.version)&&c.index<4&&c.type==='SD'&&c.title!=='ジングルベル');for(const kind of name==='真'?['极','神']:['极','将','神']){const done=charts.filter(c=>{const r=s.records[G.key(c)];return kind==='极'?!!r?.bestCombo:kind==='将'?(r?.achievement||0)>=100:r?.bestCombo==='AP';}).length;out.push({id:name+kind,name:name+kind,text:`${versions.join(' / ')} 全 BASIC–MASTER ${kind==='极'?'FC':kind==='将'?'SSS':'AP'}`,done,total:charts.length,unlocked:charts.length>0&&done===charts.length});}}return out;}
  function install(api){G=api;Object.assign(api,{NPC_IDS:IDS,TALENTS,CONDITIONS,GLOVES,drawTalents:draw,setup,grantTalent:grant,talentGains,talentGainText,selectCount,waitQueue,arcadeRest:rest,buyGloves,refill,chatOpen,chatSend,plates});}
  const api={ensure,rollCondition,tick,abilityBonus,scoreBonus,consume,afterPlay,choosePartner,selectCount,partnerCharts,newDay,install,has,crowdOffset};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.LifeSystems=api;
})(typeof window==='undefined'?globalThis:window);
