(function(root){
  let G;
  const EVENTS=[
    {title:'旁边的粉黑色身影',text:'排队时，穿着地雷系服饰的女生指着空位：“这里有人吗？”她把手套收进包里，认真等你的回答。',options:['“没有，一起排吧。”','戴上耳机，不作回应'],correct:0,reply:'“我叫小凛。”你们聊起常来的时间，约好下次见面打招呼。',fail:'她往旁边挪了挪。下次见面，或许可以认真打个招呼。'},
    {title:'记住了你的选曲',text:'几天后，小凛认出了你：“上次那首歌叫什么？我回去还在哼。”她也分享了一首自己喜欢的歌。',options:['只顾着刷新自己的成绩','记下她的推荐，聊聊喜欢的曲风'],correct:1,reply:'你们交换了歌单和联系方式。聊天里第一次出现了与分数无关的话题。',fail:'话题很快冷了下来，她把手机收回口袋。'},
    {title:'差一点点的 SSS',text:'小凛打出 99.98%，却不想立刻重开：“你有空帮我看看吗？不用替我选歌。”',options:['“这不是随便打吗？”','先问她卡在哪里，再一起看手元'],correct:1,reply:'你们慢慢拆开那段节奏。她说，下次也想听听你最近遇到的难点。',fail:'“我只是想问问，不是想被比较。”她有些失落。'},
    {title:'一场突然的雨',text:'下机后广州突然下起雨。小凛说今天本来心情不好，来机厅只是想换个环境。她问你有没有时间在屋檐下聊一会儿。',options:['收好手机，听她讲今天的事','催她快点说，自己还要刷成绩'],correct:0,reply:'雨慢慢小了。她感谢你没有急着给建议，你也说起了自己的烦恼。',fail:'她说改天再聊，撑开伞先走了。'},
    {title:'各自的生活',text:'你们原本约好出勤，小凛临时要准备考试。她发来消息：“抱歉，今天可能去不了了。”',options:['让她先忙，重新约一个双方方便的时间','要求她证明你比考试重要'],correct:0,reply:'你们各自完成手头的事，再确认了下一次见面的日期。约定开始变得可靠。',fail:'她觉得这份要求让人喘不过气，暂时减少了联系。'},
    {title:'比推分更重要的事',text:'小凛今天手腕有些酸，仍在犹豫要不要再开一轮：“来都来了……”',options:['“今天必须拿下，别停。”','“先停一下吧，改天也能打。”'],correct:1,reply:'你们坐到一旁，聊了各自想去的地方。她说，和你待着不一定非要上机。',fail:'她摘下手套自己去休息了。陪伴并不等于催促。'},
    {title:'没有游戏币的下午',text:'你们聊起广州的街巷和周末计划。小凛问：“下次除了机厅，也一起去沙面走走吧？我想多认识一点平常的你。”',options:['认真商量路线，也问问她想去哪里','说没 Rating 涨的活动都没意思'],correct:0,reply:'你们留出了一个没有推分计划的下午。回家后，她发来一句：“今天很开心。”',fail:'她笑了笑，把话题转回了游戏。'},
    {title:'下一次，还有下下一次',text:'经历了许多次出勤与日常联系，小凛在门口等你：“我期待见到你，不只是因为能一起打歌。以后，也可以一直和你一起吗？”',options:['“我也一样。下一次，还有下下一次。”','坦白自己只想保持朋友关系'],correct:0,reply:'你们确认了彼此的心意。新的约定里，有舞萌，也有普通日子的陪伴。',fail:'你们认真说清了彼此的想法，决定停留在朋友的位置。'}
  ];
  const STAGES=['还未相遇','初次相识','交换歌单','一起练习','聊起日常','彼此体谅','相互陪伴','心意渐明','一起出勤'];
  function ensure(s){
    if(s.romance){G.ensureLin(s);return;}
    const map=[0,1,3,5,8];s.love=map[s.love]??s.love;
    if(s.event!==null)s.event=map[s.event]??s.event;
    s.romance={nextDay:s.day,lastContact:0,trust:Math.min(100,s.love*10),mistakes:0,memories:[]};G.ensureLin(s);
  }
  function offer(s){return s.romance.pendingStory===null&&!s.loveFailed&&s.love<EVENTS.length&&s.visits>=s.nextLoveVisit&&s.day>=s.romance.nextDay&&(s.love<EVENTS.length-1||s.rating>13000&&s.romance.trust>=45);}
  function answer(s,choice){
    if(s.event===null||s.event!==s.love||![0,1].includes(choice)||s.ending||s.day<s.romance.nextDay)throw Error('没有待回应的事件。');
    G.advance(s,15);if(s.ending)return;
    const stage=s.event,e=EVENTS[stage],ok=choice===e.correct;s.event=null;
    s.romance.memories.push({stage,day:s.day,ok,text:ok?e.reply:e.fail});
    s.romance.nextDay=s.day+(stage>=3?7:4);s.nextLoveVisit=s.visits+2;
    if(ok){s.love++;s.romance.trust=Math.min(100,s.romance.trust+6);s.mood=Math.min(100,s.mood+8);}
    else{s.romance.mistakes++;s.romance.trust=Math.max(0,s.romance.trust-10);if(stage===EVENTS.length-1||s.romance.mistakes>=3)s.loveFailed=true;}
    s.romance.pendingStory=null;G.ensureLin(s);G.syncFriends(s);G.linMessage(s,ok?e.reply:e.fail);G.log(s,ok?e.reply:e.fail,'heart');if(s.love===EVENTS.length&&s.rating>13000){G.markMilestone(s,'love');s.ending='love';s.phase='ending';G.log(s,'结局：love','ending');}
  }
  function contact(s,id){
    if(s.phase!=='home'||s.ending||s.school.pending||s.event!==null||s.videoEvent||s.city.encounter||s.world?.notice||s.world?.mahjong.active)throw Error('先完成当前行动。');
    if(!s.love||s.loveFailed||s.love>=EVENTS.length)throw Error('现在无法邀约。');
    if(s.romance.lastContact===s.day)throw Error('今天已经联系过了，给彼此留些时间。');
    const options={chat:{time:15,cost:0,mood:4,trust:1,text:'你们聊了今天的小事，小凛也发来了她的近况。'},walk:{time:60,cost:8,mood:14,trust:2,text:'你们沿着广州街巷走了一段路，聊起游戏之外的生活。'}};
    const x=options[id];if(!x||s.money<x.cost||id==='walk'&&s.stamina<8)throw Error('金钱或体力不足。');
    G.advance(s,x.time);if(s.ending)return;s.money-=x.cost;if(id==='walk')s.stamina-=8;s.mood=Math.min(100,s.mood+x.mood);s.romance.trust=Math.min(100,s.romance.trust+x.trust);s.romance.lastContact=s.day;
    G.log(s,x.text,'heart');G.ensureLin(s);G.syncFriends(s);G.linMessage(s,id==='walk'?'今天散步很开心，下次也记得留点时间吃饭。':'看到你的消息啦。今天也照顾好自己，改天机厅见。');G.check(s);
  }
  function valid(s){const r=s.romance,int=(n,max)=>Number.isInteger(n)&&n>=0&&n<=max;return !!r&&int(r.nextDay,G.DAYS+7)&&int(r.lastContact,s.day)&&int(r.trust,100)&&int(r.mistakes,3)&&Array.isArray(r.memories)&&r.memories.length<=10&&r.memories.every(m=>int(m.stage,7)&&int(m.day,s.day)&&typeof m.ok==='boolean'&&typeof m.text==='string'&&m.text.length<200);}
  function install(api){G=api;Object.assign(api,{relationshipLabel:s=>s.loveFailed?'保持距离':STAGES[s.love],contactLove:contact});}
  const api={EVENTS,ensure,offer,answer,valid,install};if(typeof module!=='undefined')module.exports=api;else root.Romance=api;
})(globalThis);
