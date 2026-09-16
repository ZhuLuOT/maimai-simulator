// A short narrative round: ordinary draws are skipped; the player's choices
// change hand progress, value and exposure to an opponent's riichi.
const OPENINGS=[
 {name:'两面较多的平顺手',text:'两组顺子已经成形，留下两面搭子有机会尽快听牌。',tiles:'m2 m3 m4 p3 p4 p5 s4 s5 s7 s8 z1 z1 z3',speed:.14,value:2000,draw:'六索',drawText:'摸到六索，索子部分连了起来。现在可以争取速度，也可以保留高打点的变化。'},
 {name:'对子较多的一手',text:'起手有四组对子，可以向七对子靠拢；拆掉对子追速度也有机会。',tiles:'m2 m2 m7 m7 p3 p3 s6 s6 p4 s8 z1 z2 z5',speed:.06,value:3200,draw:'四筒',drawText:'摸到四筒，又多了一组对子。七对子的方向更清楚了，但还需要后续进张。'},
 {name:'零散而偏重的起手',text:'字牌和边张偏多，暂时离听牌较远。先整理手牌，留一张安全牌会更稳妥。',tiles:'m1 m4 m8 p1 p5 p9 s2 s6 s9 z1 z3 z5 z5',speed:-.08,value:3900,draw:'白',drawText:'摸到第三张白，终于有了役牌刻子。继续整理有机会成牌，也可以先留住防守余地。'}
];
function createRound(random=Math.random){const opening=OPENINGS[Math.floor(random()*OPENINGS.length)];return {opening,stage:0,progress:opening.speed,value:opening.value,reserve:false,fold:false,risk:.2,events:[],result:null};}
function node(r){if(r.result)return {title:'本局结算',text:r.result.text,options:[]};return [
 {title:'开局 · 看看牌型',text:r.opening.text,options:[{label:'优先牌效',detail:'尽快整理搭子，提高后续成牌机会。'},{label:'留一张安全牌',detail:'进度稍慢，受到立直压力时更好防守。'}]},
 {title:'中盘 · 关键进张：'+r.opening.draw,text:r.opening.drawText,options:[{label:'抓住进张，争取听牌',detail:'提高和牌机会，保留当前打点。'},{label:'再做大一点',detail:'提高可能的打点，但进度与防守都会受影响。'}]},
 {title:'后盘 · 我要睡觉立直了',text:'她打出一张九筒宣告立直。你手里有同样的九筒可作现物，但维持进攻需要切出没有安全依据的中张。',options:[{label:'切现物，转为防守',detail:'放弃本轮和牌机会，避开这次放铳风险。'},{label:'继续进攻',detail:'保留和牌机会，也可能把点数送给她。'}]}
 ][r.stage];}
function choose(r,index,random=Math.random){if(r.result||!Number.isInteger(index)||index<0||index>1)return false;const step=node(r);r.events.push(step.title+'：'+step.options[index].label);
 if(r.stage===0){if(index===0)r.progress+=.12;else {r.reserve=true;r.risk-=.06;}}
 if(r.stage===1){if(index===0)r.progress+=.16;else {r.value+=2000;r.progress-=.04;r.risk+=.12;}}
 if(r.stage===2){r.fold=index===0;r.result=settle(r,random);}
 r.stage++;return true;
}
function settle(r,random){const scores=[25000,25000,25000,25000],roll=random();let text,outcome;
 if(!r.fold&&roll<r.risk){scores[0]-=5200;scores[1]+=5200;outcome='deal-in';text='进攻牌被我要睡觉荣和，放铳 5200 点。她拉着你复盘了刚才的危险信号。';}
 else if(!r.fold&&roll<r.risk+Math.max(.08,Math.min(.6,.18+r.progress))){const payer=1+Math.floor(random()*3);scores[0]+=r.value;scores[payer]-=r.value;outcome='win';text='关键进张接上了，最终和牌，获得 '+r.value+' 点。我要睡觉点点头：“这次推进得不错。”';}
 else if(r.fold){outcome='defend';if(random()<.55){scores[2]-=3900;scores[1]+=3900;text='你切出现物后持续防守，避过放铳；随后逃遁放铳，我要睡觉收下 3900 点。';}else {text='你切出现物后持续防守，安全走到流局。大家约好再来一局。';}}
 else {outcome='draw';text='继续进攻后没能等到最后的进张，本局流局。大家一起讨论了这手牌的取舍。';}
 return {scores,text,outcome};
}
module.exports={createRound,node,choose};
