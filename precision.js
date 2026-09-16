(function(root){
  'use strict';
  const FLOOR=40,START=60,CAP=95,GRACE=36*60,DECAY=3/1440,GROWTH=.012;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),now=s=>(s.day-1)*1440+s.clock;
  function dailyOffset(salt,day){let n=(salt^Math.imul(day,2654435761))>>>0;n=Math.imul(n^(n>>>16),2246822507)>>>0;return (n/4294967296-.5)*4;}
  function ensure(s){
    if(s.precision===undefined){const salt=s.seed>>>0;s.precision={base:Math.min(CAP,START+(s.tracks||0)*GROWTH),loss:0,lastPlay:null,updatedAt:now(s),day:s.day,salt,dailyOffset:dailyOffset(salt,s.day)};}
  }
  function lossAt(s){const p=s.precision;return clamp(p.loss+(p.lastPlay===null?0:Math.max(0,now(s)-Math.max(p.updatedAt,p.lastPlay+GRACE))*DECAY),0,p.base-FLOOR);}
  function tick(s){ensure(s);const p=s.precision;p.loss=lossAt(s);p.updatedAt=now(s);if(p.day!==s.day){p.day=s.day;p.dailyOffset=dailyOffset(p.salt,s.day);}}
  // Reading/previewing performance never consumes randomness or restores lost precision.
  function value(s){
    if(!s.precision)return 75; // NPC simulations have no player life history.
    const p=s.precision,offset=p.day===s.day?p.dailyOffset:dailyOffset(p.salt,s.day);
    return clamp(p.base-lossAt(s)+offset+[-6,-3,0,2,4][s.condition??2],FLOOR,100);
  }
  function afterSong(s){tick(s);const p=s.precision;p.base=Math.min(CAP,p.base+GROWTH);p.loss=Math.max(0,p.loss-Math.max(.8,p.loss*.18));p.lastPlay=now(s);p.updatedAt=p.lastPlay;}
  function lapses(s,margin,plays){
    const instability=(100-value(s))/60,unfamiliar=1/(1+plays/3),control=clamp(Math.exp(-Math.max(0,margin)*.18),.4,1);
    return {miss:(.00015+instability*.0009+unfamiliar*.00085)*control,good:(.0001+instability*.0008+unfamiliar*.0006)*control,great:(.00025+instability*.003+unfamiliar*.003)*control,perfect:(.02+instability*.14+unfamiliar*.16)*Math.max(.7,control)};
  }
  function valid(s){
    const p=s.precision,n=(x,a,b)=>Number.isFinite(x)&&x>=a&&x<=b,i=(x,a,b)=>Number.isInteger(x)&&n(x,a,b);
    return !!p&&n(p.base,START,CAP)&&n(p.loss,0,p.base-FLOOR)&&i(p.updatedAt,0,now(s))&&(p.lastPlay===null||i(p.lastPlay,0,p.updatedAt))&&i(p.day,1,s.day)&&i(p.salt,0,4294967295)&&n(p.dailyOffset,-2,2);
  }
  const api={ensure,tick,value,afterSong,lapses,valid};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Precision=api;
})(globalThis);
