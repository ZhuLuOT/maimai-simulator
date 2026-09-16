const Majiang=require('@kobalab/majiang-core');
const Player=require('@kobalab/majiang-ai');
const tileName=p=>p[0]==='z'?['','东','南','西','北','白','发','中'][+p[1]]:(p[1]==='0'?'赤五':'一二三四五六七八九'[+p[1]-1])+({m:'万',p:'筒',s:'索'})[p[0]];
const meldName=m=>(m.match(/\d/g)||[]).map(n=>tileName(m[0]+n)).join(' ');

class Human extends Player {
 constructor(round){super();this.round=round;}
 prompt(title,text,options){this.round.pending={title,text,options,reply:this._callback};this.round.decisions++;}
 discards(){const out=[];for(const p of this.get_dapai(this.shoupai)||[]){out.push({type:'discard',tile:p.slice(0,2),label:'打 '+tileName(p),reply:{dapai:p}});if(this.allow_lizhi(this.shoupai,p))out.push({type:'riichi',tile:p.slice(0,2),label:'立直 · 打 '+tileName(p),reply:{dapai:p+'*'}});}return out;}
 action_zimo(data,gangzimo){
  if(data.l!==this._menfeng)return this._callback();
  const options=[];
  if(this.select_hule(null,gangzimo))options.push({type:'win',label:'自摸',reply:{hule:'-'}});
  for(const m of this.get_gang_mianzi(this.shoupai)||[])options.push({type:'kan',label:(/^[mpsz]\d{4}$/.test(m)?'暗杠 ':'加杠 ')+meldName(m),reply:{gang:m}});
  if(this.allow_pingju(this.shoupai))options.push({type:'draw',label:'九种九牌 · 流局',reply:{daopai:'-'}});
  options.push(...this.discards());
  this.prompt(gangzimo?'岭上摸牌':'轮到你出牌','摸到'+tileName(data.p)+(this.shoupai.lizhi?' · 已立直':''),options);
 }
 action_dapai(data){
  if(data.l===this._menfeng)return this._callback();
  const options=[],direction=['','+','=','-'][(4+data.l-this._menfeng)%4],p=data.p.slice(0,2)+direction;
  if(this.select_hule(data))options.push({type:'win',label:'荣和',reply:{hule:'-'}});
  for(const [type,list]of [['chi',this.get_chi_mianzi(this.shoupai,p)],['pon',this.get_peng_mianzi(this.shoupai,p)],['kan',this.get_gang_mianzi(this.shoupai,p)]])for(const m of list||[])options.push({type,label:({chi:'吃 ',pon:'碰 ',kan:'明杠 '})[type]+meldName(m),reply:{fulou:m}});
  if(!options.length)return this._callback();
  options.push({type:'pass',label:'不鸣牌 / 过',reply:{}});
  this.prompt('回应弃牌',this.model.player[this.model.player_id[data.l]]+'打出'+tileName(data.p)+(data.p.endsWith('*')?'并宣告立直':''),options);
 }
 action_fulou(data){if(data.l!==this._menfeng||/^[mpsz]\d{4}/.test(data.m))return this._callback();this.prompt('副露后出牌',meldName(data.m),this.discards());}
 action_gang(data){if(data.l===this._menfeng||!this.select_hule(data,true))return this._callback();this.prompt('抢杠机会',this.model.player[this.model.player_id[data.l]]+'宣告加杠',[{type:'win',label:'抢杠荣和',reply:{hule:'-'}},{type:'pass',label:'过',reply:{}}]);}
}

function createRound({name='玩家',names=['COLDDD','逃遁','鲁米诺'],dealer=Math.floor(Math.random()*4),wall=null}={}){
 const r={pending:null,result:null,decisions:0,events:[],wins:[]};
 r.human=new Human(r);
 const game=r.game=new Majiang.Game([r.human,new Player(),new Player(),new Player()],null,Majiang.rule({'場数':0,'延長戦方式':0}));
 game.model.player=[name,...names];game._sync=true;game.speed=0;
 const add=game.add_paipu.bind(game);game.add_paipu=event=>{
  add(event);const model=game.model,who=l=>model.player[model.player_id[l]];
  if(event.dapai){const d=event.dapai;r.events.push(who(d.l)+(d.p.endsWith('*')?'立直，':'')+'打出'+tileName(d.p));}
  if(event.fulou)r.events.push(who(event.fulou.l)+'副露：'+meldName(event.fulou.m));
  if(event.gang)r.events.push(who(event.gang.l)+'开杠：'+meldName(event.gang.m));
  if(event.hule){const h=event.hule;r.wins.push({winner:model.player_id[h.l],from:h.baojia==null?null:model.player_id[h.baojia],yaku:h.hupai.map(y=>({...y})),fu:h.fu||0,han:h.fanshu||0,yakuman:h.damanguan||0,points:h.defen,hand:h.shoupai});}
  if(event.pingju)r.draw=event.pingju.name;
 };
 // Settle the entire hand, including double ron, without starting another hand.
 game.last=()=>{r.result={scores:[...game.model.defen],wins:r.wins,draw:r.draw||null,lizhiSticks:game.model.lizhibang,text:r.wins.length?r.wins.map(w=>game.model.player[w.winner]+(w.from===null?'自摸':'荣和 '+game.model.player[w.from])+'，'+(w.yakuman?w.yakuman+' 倍役满':w.han+' 番 '+w.fu+' 符')+'，'+w.points+' 点。').join(' '):(r.draw||'流局')+'，按听牌状态结算。'};};
 if(wall){const qipai=game.qipai.bind(game);game.qipai=()=>qipai(wall);}
 game.kaiju(dealer);pump(r);return r;
}
function pump(r){let n=0;while(!r.pending&&!r.result&&r.game._reply.filter(Boolean).length===4){if(++n>1000)throw Error('牌局推进异常。');r.game.next();}}
function node(r){return r.result?{title:'本局结算',text:r.result.text,options:[]}:r.pending||{title:'等待其他玩家',text:'',options:[]};}
function choose(r,index){const p=r.pending;if(!p||r.result||!Number.isInteger(index)||!p.options[index])return false;r.pending=null;p.reply(p.options[index].reply);pump(r);return true;}
function recommend(r){const p=r.pending;if(!p)return -1;const win=p.options.findIndex(o=>o.type==='win');if(win>=0)return win;
 if(p.options.some(o=>o.type==='discard')){const best=r.human.select_dapai(),index=p.options.findIndex(o=>o.reply.dapai===best);return index>=0?index:p.options.findIndex(o=>o.type==='discard');}
 return p.options.findIndex(o=>o.type==='pass');
}
function tiles(hand){const out=[];for(const suit of ['m','p','s','z'])for(let n=1;n<(suit==='z'?8:10);n++){let count=hand._bingpai[suit][n];if(suit!=='z'&&n===5){for(let i=0;i<hand._bingpai[suit][0];i++)out.push(suit+'0');count-=hand._bingpai[suit][0];}for(let i=0;i<count;i++)out.push(suit+n);}return out;}
function snapshot(r){const m=r.human.model;return {names:m.player,seat:r.human._menfeng,scores:r.result?.scores||m.defen,remaining:m.shan.paishu,dora:[...m.shan.baopai],sticks:m.lizhibang,hand:tiles(r.human.shoupai),seats:m.shoupai.map((h,l)=>({name:m.player[m.player_id[l]],wind:'东南西北'[l],riichi:h.lizhi,river:[...m.he[l]._pai],melds:[...h._fulou]}))};}
module.exports={createRound,node,choose,recommend,snapshot,tileName,meldName};
