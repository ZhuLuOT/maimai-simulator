import {html} from 'lit';
import Round from './mahjong-round.cjs';
import {icon} from './ui.js';

let session=null;
const names=p=>p[0]==='z'?['','东','南','西','北','白','发','中'][+p[1]]:p[1];
const suit=p=>({m:'万',p:'筒',s:'索',z:''})[p[0]];
const tile=p=>html`<span class="tile ${p[0]}" title=${names(p)+suit(p)}>${names(p)}<small>${suit(p)}</small></span>`;
export function startTable(name,refresh,done){
 if(session?.alive)throw Error('已有一桌对局进行中。');
 session={name,refresh,done,alive:true,round:Round.createRound()};return session;
}
export function chooseMahjong(index){const t=session;if(!t?.alive)return;
 // Leave the result visible until the player confirms, then advance the quest.
 if(t.round.result){if(index!==0)return;t.alive=false;t.done(t.round.result);t.refresh();return;}
 if(Round.choose(t.round,index))t.refresh();
}
export function autoMahjong(){const t=session;if(t?.alive)chooseMahjong(0);}
export function abandonMahjong(){session=null;}
export function mahjongView(){const t=session;if(!t)return html`<p>牌桌已结束。</p>`;const r=t.round,n=Round.node(r);
 return html`<div class="mahjong-table"><div class="mahjong-status" role="status">${r.result?'本局结束':`关键节点 ${r.stage+1} / 3`} · 省略普通巡目</div><div class="mahjong-scoreboard">${[t.name,'COLDDD','逃遁','鲁米诺'].map((name,i)=>html`<span>${name} ${r.result?.scores[i]??25000} 点</span>`)}</div><h3>${r.opening.name}</h3><div class="mahjong-hand" aria-label="开局手牌">${r.opening.tiles.split(' ').map(tile)}</div><section class="mahjong-node"><h3>${n.title}</h3><p>${n.text}</p><div class="mahjong-controls">${n.options.map((o,i)=>html`<button class="option" data-action="mahjong-choice" data-value=${i}><b>${o.label}</b><small>${o.detail}</small></button>`)}</div></section>${r.events.length?html`<details class="mahjong-recap"><summary>本局回顾</summary>${r.events.map(e=>html`<p>${e}</p>`)}</details>`:''}</div><div class="mahjong-actions">${r.result?html`<button class="primary-btn" data-action="mahjong-choice" data-value="0">结束本局，回到猫窝</button>`:html`<button class="secondary-btn" data-action="mahjong-help">${icon('lightbulb')}采用稳健选择</button><button class="secondary-btn" data-action="mahjong-leave">${icon('log-out')}中途离桌</button>`}</div>`;
}
