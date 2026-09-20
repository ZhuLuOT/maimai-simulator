import {html} from 'lit';
import Round from './mahjong-round.cjs';
import {icon} from './ui.js';
let session=null;
const names=p=>p[0]==='z'?['','东','南','西','北','白','发','中'][+p[1]]:p[1]==='0'?'5':p[1];
const suit=p=>({m:'万',p:'筒',s:'索',z:''})[p[0]];
const tile=p=>html`<span class="tile ${p[0]} ${p[1]==='0'?'red-five':''} ${p.includes('*')?'riichi-tile':''}" title=${Round.tileName(p)}>${names(p)}<small>${suit(p)}</small></span>`;
export function startTable(name,refresh,done,{players,tutorial=false}={}){if(session?.alive)throw Error('已有一桌对局进行中。');session={name,refresh,done,tutorial,selected:null,alive:true,round:Round.createRound({name,names:players})};return session;}
export function tapMahjong(index){const t=session;if(!t?.alive||t.round.result)return;const p=Round.node(t.round).options[index];if(p?.type!=='discard')return;const now=performance.now();if(t.selected?.index===index&&t.selected.decision===t.round.decisions&&now-t.selected.time<450){t.selected=null;chooseMahjong(index);}else{t.selected={index,decision:t.round.decisions,time:now};t.refresh();}}
function lesson(r){const n=Round.node(r);if(r.result)return '这局先看点数怎么转移，再回头看关键舍牌。和出过的役会记进收藏，输一局也很正常。';if(n.options.some(o=>o.type==='win'))return '现在有合法和牌机会了。自摸由三家支付，荣和由放铳的人支付；先看看这一手有哪些役。';if(n.options.some(o=>o.type==='riichi'))return '门前听牌，可以交 1000 点立直。立直后不能随意改手，先比较等待张数，再决定要不要宣告。';if(n.options.some(o=>o.type==='pass'))return '先看鸣牌之后还有没有役。吃只能吃上家，碰可以碰任意一家；门前清会被副露打破，不急着吃碰也可以。';return r.decisions<4?'先把手牌往四组面子加一对雀头整理。双击同一张手牌就能打出，也可以用键盘确认选中的牌。宝牌只加番，和牌还得有役。':'看看四家的舍牌再决定进攻还是防守。自己的舍牌含有当前等待牌会振听，这时只能自摸；对手立直后，别只顾着凑自己的牌。';}
export function chooseMahjong(index){const t=session;if(!t?.alive)return;if(t.round.result){if(index!==0)return;t.done(t.round.result);t.alive=false;t.refresh();return;}t.selected=null;if(Round.choose(t.round,index))t.refresh();}
export function autoMahjong(){const t=session;if(t?.alive&&!t.round.result){const i=Round.recommend(t.round);if(i>=0)chooseMahjong(i);}}
export function abandonMahjong(){session=null;}
export function mahjongView(){
 const t=session;if(!t)return html`<p>牌桌已结束。</p>`;const r=t.round,n=Round.node(r),v=Round.snapshot(r);
 return html`<div class="mahjong-table"><div class="mahjong-status" role="status">${r.result?'本局结束':`东一局 · 第 ${r.decisions} 次决策`} · 余牌 ${v.remaining} · 供托 ${v.sticks*1000} 点</div>
 <div class="mahjong-scoreboard">${v.names.map((name,i)=>html`<span>${name} <b>${v.scores[i]}</b> 点</span>`)}</div>
 <div class="mahjong-dora"><span>宝牌指示牌</span>${v.dora.map(tile)}</div>
 <div class="mahjong-rivers">${v.seats.map((seat,i)=>html`<section class=${i===v.seat?'self-seat':''}><b>${seat.wind} · ${seat.name}${seat.riichi?' · 立直':''}</b><div class="river-tiles">${seat.river.map(tile)}</div>${seat.melds.map(m=>html`<p class="mahjong-meld">${Round.meldName(m)}</p>`)}</section>`)}</div>
 ${t.tutorial?html`<aside class="mahjong-lesson"><b>COLDDD</b><p>${lesson(r)}</p></aside>`:''}<h3>你的手牌 · ${'东南西北'[v.seat]}家</h3><div class="mahjong-hand" aria-label="你的手牌">${v.hand.map(p=>{const i=n.options.findIndex(o=>o.type==='discard'&&o.tile===p);return html`<button class="hand-tile ${t.selected?.index===i?'selected':''}" data-action="mahjong-tile" data-value=${i} @keydown=${e=>{if((e.key==='Enter'||e.key===' ')&&!e.repeat&&i>=0){e.preventDefault();chooseMahjong(i);}}} ?disabled=${i<0} aria-label=${Round.tileName(p)} aria-pressed=${t.selected?.index===i}>${tile(p)}</button>`;})}</div>
 <section class="mahjong-node"><h3>${n.title}</h3><p>${n.text}</p><div class="mahjong-controls">${n.options.map((o,i)=>o.type==='discard'?'':html`<button class="option ${o.type}" data-action="mahjong-choice" data-value=${i}>${o.tile?tile(o.tile):icon(o.type==='win'?'trophy':o.type==='pass'?'arrow-right':'layers')}<b>${o.label}</b></button>`)}</div></section>
 ${r.result?.wins.map(w=>html`<div class="mahjong-win"><b>${v.names[w.winner]} · ${w.yakuman?w.yakuman+' 倍役满':w.han+' 番 '+w.fu+' 符'} · ${w.points} 点</b><p>${w.yaku.map(y=>(window.Game.MAHJONG_YAKU.find(e=>e.source.includes(y.name))?.name||y.name)+' '+(typeof y.fanshu==='number'?y.fanshu+' 番':y.fanshu.length+' 倍役满')).join(' · ')}</p></div>`)}
 <details class="mahjong-recap"><summary>本局牌谱 · ${r.events.length} 条</summary>${r.events.map(e=>html`<p>${e}</p>`)}</details></div>
 <div class="mahjong-actions">${r.result?html`<button class="primary-btn" data-action="mahjong-choice" data-value="0">结束本局，回到猫窝</button>`:html`<button class="secondary-btn" data-action="mahjong-help">${icon('lightbulb')}采用建议选择</button><button class="secondary-btn" data-action="mahjong-leave">${icon('log-out')}中途离桌</button>`}</div>`;
}
export function yakuCollection(s){const catalog=window.Game.MAHJONG_YAKU,owned=s.world.mahjong.collection;return html`<p>役种收藏 ${Object.keys(owned).length} / ${catalog.length} · 和牌 ${s.world.mahjong.wins} 次 · ${s.major.yakuReward?'全收集奖励已领取':'全收集奖励 ¥8888（自动到账）'}</p><div class="yaku-collection">${catalog.map(e=>html`<article class=${owned[e.id]?'collected':''}><div>${icon(owned[e.id]?'check':'lock-keyhole')}<h3>${e.name}</h3><span>${e.han}</span></div><p>${e.description}</p><small>${owned[e.id]?`已和出 ${owned[e.id].count} 次 · 首次第 ${owned[e.id].firstDay} 天`:'尚未和出'}</small></article>`)}</div>`;}
