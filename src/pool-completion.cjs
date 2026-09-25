const isStandardLevel=level=>/^\d{1,2}\+?$/.test(String(level));
const levelOrder=(a,b)=>parseInt(a)-parseInt(b)||a.length-b.length;

function difficultyLevels(pool,displayLevel){
  return [...new Set(pool.map(displayLevel).filter(isStandardLevel))].sort(levelOrder);
}

function createPoolCompletion(pool,{displayLevel,isUtage,key}){
  const levels=new Map(),genres=new Map();
  function add(groups,id,chart){if(!groups.has(id))groups.set(id,[]);groups.get(id).push(key(chart));}
  for(const chart of pool){
    if(isUtage(chart)||!isStandardLevel(displayLevel(chart)))continue;
    add(levels,displayLevel(chart),chart);
    add(genres,chart.genre,chart);
  }
  function grade(keys,records){
    let lowest=101;
    for(const id of keys){
      const score=records[id]?.achievement;
      if(!Number.isFinite(score)||score<97)return '';
      lowest=Math.min(lowest,score);
    }
    return lowest>=100?'SSS':lowest>=99?'SS':'S';
  }
  return records=>Object.fromEntries([['levels',levels],['genres',genres]].map(([kind,groups])=>[
    kind,new Map([...groups].map(([id,keys])=>[id,grade(keys,records)]))
  ]));
}

module.exports={difficultyLevels,createPoolCompletion};
