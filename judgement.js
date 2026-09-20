(function(root){
  'use strict';
  const P=typeof module!=='undefined'?require('./precision'):root.Precision;
  const sequences=new WeakMap(),judges=['critical','perfect','great','good','miss'];
  const weights=[500,1000,1500,500,2500],clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const rand=s=>{s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296;};
  const empty=()=>({critical:0,perfect:0,great:0,good:0,miss:0});
  // BREAK has separate base and bonus fractions, as documented by ChiffonMai's achievement calculator.
  function calculate(groups,breaks){let total=0,earned=0;const judgements=empty();groups.forEach((g,i)=>{const n=Object.values(g).reduce((a,b)=>a+b,0);total+=n*weights[i];for(const k of Object.keys(judgements))judgements[k]+=g[k];if(i<4)earned+=(g.critical+g.perfect+g.great*.8+g.good*.5)*weights[i];});
    const b=breaks,breakCount=Object.values(b).reduce((a,b)=>a+b,0);earned+=2500*(b.critical+b.perfect50+b.perfect100+b.great80*.8+b.great60*.6+b.great50*.5+b.good*.4);
    const bonus=breakCount?(b.critical+b.perfect50*.75+b.perfect100*.5+(b.great80+b.great60+b.great50)*.4+b.good*.3)/breakCount:0;
    const baseScore=Number((total?earned/total*100:0).toFixed(4)),extraScore=Number(bonus.toFixed(4));
    return {achievement:Number((baseScore+extraScore).toFixed(4)),baseScore,extraScore,judgements,judgementGroups:groups,breakJudgements:b,combo:judgements.miss?'':judgements.good?'FC':judgements.great?'FC+':'AP'};
  }
  // Keep small challenges approachable; large skill deficits grow progressively harder.
  function difficultyValue(d){return d+.12*Math.max(0,d-12)**2+.35*Math.max(0,d-14.5)**2;}
  function difficultyPenalty(difficulty,ability){const gap=Math.max(0,difficultyValue(difficulty)-difficultyValue(ability));return gap*3.7+.65*Math.max(0,gap-1)**2;}
  function noteSequence(s,groups){
    const sequence=[];groups.forEach((g,i)=>judges.forEach((k,j)=>{for(let n=0;n<g[k];n++)sequence.push(i*5+j);}));
    // No chart timelines are available: interleave the sampled judgements in a seeded note order.
    const order={seed:(s.seed^0x9e3779b9)>>>0};for(let i=sequence.length-1;i>0;i--){const j=Math.floor(rand(order)*(i+1));[sequence[i],sequence[j]]=[sequence[j],sequence[i]];}return sequence;
  }
  function finish(groups,breaks,sequence){
    let current=0,maxCombo=0;for(const note of sequence){current=note%5===4?0:current+1;maxCombo=Math.max(maxCombo,current);}
    const result={...calculate(groups,breaks),maxCombo};sequences.set(result,sequence);return result;
  }
  function simulate(s,c,expected,ability){const groups=[],b={critical:0,perfect50:0,perfect100:0,great80:0,great60:0,great50:0,good:0,miss:0},margin=ability-c.ds,plays=s.practice[`${c.id}:${c.index}`]||0;
    const precision=P.lapses(s,margin,plays);
    const loss=Math.max(0,101-clamp(expected,0,101))/100*(.9+rand(s)*.2);
    c.notes.forEach((count,i)=>{const g=empty(),technical=i===2?s.skills.star:s.skills.key,weighted=s.skills.star*c.starWeight+s.skills.key*(1-c.starWeight),factor=clamp(Math.exp((weighted-technical)*.17),.45,2.3);
      // Once GREAT saturates, further loss must produce misses instead of flattening scores.
      const overload=Math.max(0,loss-.24)*.65;
      const missP=clamp((loss*.30+overload+precision.miss)*factor,0,1),goodP=clamp((loss*.25+precision.good)*factor,0,Math.min(.3,1-missP)),greatP=clamp((loss*2.5+precision.great)*factor,0,Math.min(.6,1-missP-goodP)),perfectP=clamp(loss*10+(margin<2?.04:0)+precision.perfect,0,Math.min(.65,Math.max(0,1-missP-goodP-greatP)));
      for(let n=0;n<count;n++){const r=rand(s);let judge=r<missP?'miss':r<missP+goodP?'good':r<missP+goodP+greatP?'great':r<missP+goodP+greatP+perfectP?'perfect':'critical';g[judge]++;if(i===4){if(judge==='perfect')b[rand(s)<.65?'perfect50':'perfect100']++;else if(judge==='great'){const q=rand(s);b[q<.6?'great80':q<.85?'great60':'great50']++;}else b[judge]++;}}
      groups.push(g);
    });return finish(groups,b,noteSequence(s,groups));
  }
  const segments={
    '拆弹':{skills:{star:.6,reading:.4},groups:[2,0,4],scene:'拆弹段突然展开'},
    '错位':{skills:{star:.55,reading:.45},groups:[2,0],scene:'星星与拍点错开了'},
    '一笔画':{skills:{star:.7,reading:.3},groups:[2],scene:'连续星星接成一笔画'},
    '反手':{skills:{star:.5,key:.2,reading:.3},groups:[2,0],scene:'反手配置迎面而来'},
    '绝赞段':{skills:{key:.5,reading:.5},groups:[4],scene:'连续绝赞段开始了'},
    '底力谱':{skills:{star:.3,key:.5,reading:.2},groups:[0,2],scene:'基础配置开始提速'},
    '定拍':{skills:{key:.4,reading:.6},groups:[0,1],scene:'进入稳定定拍段'},
    '诈称谱':{skills:{star:.3,key:.3,reading:.4},groups:[0,2],scene:'意料之外的难段出现了'},
    '扫键':{skills:{key:.8,reading:.2},groups:[0],scene:'扫键段扑面而来'},
    '爆发':{skills:{key:.75,reading:.25},groups:[0,4],scene:'高速爆发段开始了'},
    '大位移':{skills:{star:.4,key:.3,reading:.3},groups:[0,2],scene:'音符跳向屏幕另一侧'},
    '转圈':{skills:{key:.65,reading:.35},groups:[0,2],scene:'连续转圈段开始了'},
    '散打':{skills:{key:.6,reading:.4},groups:[0,3],scene:'散打配置铺满屏幕'},
    '跳拍':{skills:{key:.35,reading:.65},groups:[0,1],scene:'节奏突然跳拍'},
    '纵连':{skills:{key:.8,reading:.2},groups:[0],scene:'纵连音符接连落下'},
    '水':{skills:{star:.3,key:.3,reading:.4},groups:[0,2],scene:'平稳段中出现了容易大意的收尾'},
    '体力谱':{skills:{star:.3,key:.5,reading:.2},groups:[0,2],scene:'长段连打考验体力'},
    '交互':{skills:{key:.65,reading:.35},groups:[0],scene:'双手交互段开始了'},
    '高物量':{skills:{key:.6,reading:.4},groups:[0,3],scene:'密集音符涌入屏幕'}
  };
  function planSegment(s,c){
    const tags=(c.tags||[]).filter(t=>segments[t]);
    if(!tags.length||rand(s)>(s.condition<2?.45:s.condition>2?.35:.4))return null;
    return {tag:tags[Math.floor(rand(s)*tags.length)]};
  }
  function planSegments(s,c){
    const first=planSegment(s,c);if(!first)return [];
    const plans=[first],tags=[...new Set(c.tags.filter(t=>segments[t]))];
    for(const chance of [c.ds>=13.6?.55:.25,c.ds>=14?.3:.15]){
      if(rand(s)>=chance)break;
      const remaining=tags.filter(t=>!plans.some(p=>p.tag===t)),choices=remaining.length?remaining:tags;
      plans.push({tag:choices[Math.floor(rand(s)*choices.length)]});
    }
    return plans;
  }
  function segmentOptions(s,c,tag){
    const rule=segments[tag];if(!rule)return [];
    const names={star:'星星力',key:'键盘力',reading:'读谱力'};
    const star=(rule.skills.star||0)>(rule.skills.key||0),alternate=star?'key':'star';
    const variants=[{id:'technique',name:'按配置稳接',weights:rule.skills,required:c.ds},
      {id:'alternate',name:star?'拆开硬接':'预划分担',weights:{[alternate]:1},required:c.ds+(star?.85:1.15)},
      {id:'read',name:'看清节奏再动手',weights:{reading:1},required:c.ds+(tag==='跳拍'||tag==='定拍'?.15:.7)}];
    return [...variants.map(o=>{const skill=Object.entries(o.weights).reduce((n,[k,w])=>n+s.skills[k]*w,0);return {...o,requirement:Object.entries(o.weights).map(([k,w])=>`${names[k]} ${Math.round(w*100)}%`).join(' + '),skill,chance:clamp(.65+(skill-o.required)*.16+(s.condition-2)*.03-Math.max(0,50-s.stamina)*.004,.08,.97)};}),{id:'luck',name:'赌一把手感',requirement:'看运气，不依赖底力',chance:.38}];
  }
  function segment(s,c,result,decision){
    if(Array.isArray(decision)){
      if(!decision.length)return result;
      const events=[];
      for(const plan of decision){result=segment(s,c,result,plan);events.push(result.segmentEvent);}
      const combined={...result,segmentEvents:events,segmentEvent:events.findLast(e=>!e.passed)||events.at(-1)};
      sequences.set(combined,sequences.get(result));return combined;
    }
    const plan=decision===undefined?planSegment(s,c):decision;if(!plan)return result;
    const tag=plan.tag,rule=segments[tag];if(!rule||!(c.tags||[]).includes(tag))throw Error('无效难段。');
    const option=segmentOptions(s,c,tag).find(o=>o.id===(plan.strategy||'technique'));if(!option)throw Error('无效策略。');
    const chance=Number.isFinite(plan.chance)?clamp(plan.chance,.08,.97):option.chance;
    const passed=typeof plan.passed==='boolean'?plan.passed:rand(s)<chance,event={tag,scene:rule.scene,strategy:option.name,chance,passed,loss:0,misses:0};
    const withEvent=base=>{const next={...base,segmentEvent:event};sequences.set(next,sequences.get(base));return next;};
    if(passed)return withEvent(result);
    // Convert successful notes into misses, then recompute both base and BREAK bonus scores.
    const groups=result.judgementGroups.map(g=>({...g})),breaks={...result.breakJudgements},sequence=(sequences.get(result)||noteSequence(s,groups)).slice();
    let remaining=Math.max(1,Math.ceil(c.notes.reduce((a,b)=>a+b,0)*(.005+rand(s)*.01)*clamp(plan.intensity??1,1/3,1)));
    const order=[...new Set([...rule.groups,0,2,1,3,4])];
    for(const i of order){
      const g=groups[i];
      for(const k of ['critical','perfect','great','good']){
        const count=Math.min(g[k],remaining);g[k]-=count;g.miss+=count;remaining-=count;event.misses+=count;
        let toMiss=count;for(let n=0;n<sequence.length&&toMiss;n++)if(sequence[n]===i*5+judges.indexOf(k)){sequence[n]=i*5+4;toMiss--;}
        if(i===4){let left=count;const keys=k==='perfect'?['perfect50','perfect100']:k==='great'?['great80','great60','great50']:[k];for(const key of keys){const n=Math.min(breaks[key],left);breaks[key]-=n;breaks.miss+=n;left-=n;}}
        if(!remaining)break;
      }
      if(!remaining)break;
    }
    const adjusted=finish(groups,breaks,sequence);event.loss=Number((result.achievement-adjusted.achievement).toFixed(4));
    return withEvent(adjusted);
  }
  const api={calculate,difficultyPenalty,difficultyValue,simulate,segment,segments,planSegment,planSegments,segmentOptions};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Judgement=api;
})(globalThis);
