import {esc,icon} from './src/ui.js';
import { html, render as mount } from 'lit';
import { live } from 'lit/directives/live.js';
(function (root) {
  'use strict';

  const G = root.Game;
  const ratingFrames = ['normal', 'blue', 'green', 'orange', 'red', 'purple', 'bronze', 'silver', 'gold', 'platinum', 'rainbow'];
  function setup(s, draft, offers, run) {
    return html`<main class="setup-screen"><header><span class="brand-mark">${icon('disc-3')}</span><div><h1>出勤模拟器</h1><p>2026 春季篇 · 第 ${run} 周目</p></div></header><form id="setup-form"><div class="setup-identity"><label>玩家姓名<input id="player-name" maxlength="16" value="${esc(draft.name)}" placeholder="神秘人"></label><label>舞萌 ID<input id="player-id" maxlength="16" value="${esc(draft.id)}" placeholder="Maimai"></label></div><fieldset><legend>选择职业</legend><div class="setup-jobs">${Object.entries(G.JOBS).map(([id, j]) => html`<label class="setup-choice"><input type="radio" name="career" value="${id}" ?checked=${draft.job === id}><span>${icon(j.icon)}<b>${j.name}</b><small>初始 ¥${j.money}</small><small>${j.detail}</small><small>${id === 'student' ? '周一至周五按课表上课' : id === 'worker' ? '工作日 09:00–18:00 上班' : '时间自由，可接兼职'}</small></span></label>`)}</div></fieldset><fieldset><legend>初始词条 · 三选一</legend><div class="talent-draw">${offers.map(id => {
      const t = G.TALENTS.find(t => t.id === id);
      return html`<label class="setup-choice"><input type="radio" name="talent" value="${id}" ?checked=${draft.talent === id}><span>${icon('sparkles')}<b>${t.name}</b><small>${t.description}</small></span></label>`;
    })}</div></fieldset><div class="setup-footer"><span>${icon('hand')}随身物品：棉线手套 · 100 耐久</span><button type="submit" class="primary-btn">${icon('arrow-right')}开始春季生活</button></div></form></main>`;
  }
  function player(s) {
    const tier = G.ratingTier(s.rating),
      condition = G.CONDITIONS[s.condition],
      plate = s.profile.plate === 'default' ? '初来乍到' : s.profile.plate;
    return html`<section class="player-nameplate" aria-label="玩家名牌与状态"><div class="nameplate-top" style="background-image:url('assets/plates/${encodeURIComponent(s.profile.plate)}.png')"><button class="player-avatar" data-action="avatar" title="自定义头像" aria-label="自定义头像">${s.profile.avatar ? html`<img src="${s.profile.avatar}" alt="玩家头像">` : icon('disc-3')}</button><div class="player-identity"><span class="player-title">${esc(G.collectionItem(s.profile.title)?.name || '新人出道')}</span><h2>${esc(s.profile.id)}</h2><small>${esc(s.profile.name)} · ${G.JOBS[s.job].name}</small></div><button class="icon-btn" data-action="plates" title="名牌与解锁进度" aria-label="名牌与解锁进度">${icon('badge')}</button></div><div class="rating-line"><span>${icon('sparkles')}舞萌 DX</span><div class="mainland-rating tier-${tier}" aria-label="DX Rating ${s.rating}"><img src="assets/rating/wahlap/rating_base_${ratingFrames[tier - 1]}.png" alt="舞萌 DX 国服 Rating 框"><div class="mainland-rating-digits" aria-hidden="true">${String(s.rating).padStart(5, '0').split('').map(digit => html`<img src="assets/rating/diving-fish/UI_NUM_Drating_${digit}.png" alt="">`)}</div></div><small>目标 16,000</small></div><div class="player-status"><div class="money"><small>${icon('wallet')}钱包</small><b>¥${s.money}</b><span>每日 -¥${G.JOBS[s.job].daily}</span></div><div><small>${icon('heart')}心情</small><b>${Math.round(s.mood)}<em>/100</em></b><span class="condition condition-${s.condition}">${condition.name}</span></div><div><small>${icon('battery-medium')}体力</small><b>${Math.floor(s.stamina)}<em>/${s.maxStamina}</em></b><progress max="${s.maxStamina}" value="${s.stamina}"></progress></div><div><small>${icon('hand')}手套</small><b>${Math.floor(s.gloves.durability)}<em>耐久</em></b><span>${esc(s.gloves.name)}</span></div></div>${s.sleepDebt ? html`<div class="sleep-debuff">${icon('moon')}熬夜 ${s.sleepDebt} 级 · 预期达成率 -${(s.sleepDebt * .04).toFixed(2)}%</div>` : ''}<div class="skill-strip"><span>${icon('star')}星星 <b>${s.skills.star.toFixed(2)}</b></span><span>${icon('keyboard')}键盘 <b>${s.skills.key.toFixed(2)}</b></span><span>${icon('scan-eye')}读谱 <b>${s.skills.reading.toFixed(2)}</b></span><button class="text-btn" data-action="talents">${icon('sparkles')}词条 ${s.talents.length}</button></div></section>`;
  }
  function supplies(s) {
    return html`<div class="supply-strip"><span>${icon('battery-medium')}体力 ${Math.floor(s.stamina)}/${s.maxStamina}</span><span>${icon('cup-soda')}饮料 ${s.liquid} ml</span><span>${icon('hand')}耐久 ${Math.floor(s.gloves.durability)}</span><span class="condition condition-${s.condition}">${G.CONDITIONS[s.condition].name}</span></div><div class="supply-actions"><button class="secondary-btn" data-action="supplies">${icon('shopping-bag')}补给</button>${s.queueUntil > s.clock ? html`<button class="primary-btn" data-action="queue">${icon('clock-3')}等候 ${s.queueUntil - s.clock} 分钟</button>` : html`<span class="ready-label">轮到你上机了</span><button class="secondary-btn" data-action="queue">等待 15 分钟</button>`}${s.talents.includes('instinct') ? html`<label><input type="checkbox" id="instinct" ?checked=${s.instinct}>凭手感 · 底力 +0.3 / 体力消耗增加</label>` : ''}</div>${s.mode === 'pair' && s.partner !== null ? html`<div class="partner-line">${icon('users')}<div><b>${esc(s.npcs[s.partner].id)}</b><small>Rating ${s.npcs[s.partner].rating} · 眼熟度 ${s.npcs[s.partner].familiarity}/100</small></div><span>${s.friendship ? '“今天你多选一首！”' : '双方同时游玩'}</span></div>` : ''}`;
  }
  function shop(s) {
    return html`<h3>手套</h3><div class="option-grid">${G.GLOVES.map(g => html`<button class="option" data-action="buy-gloves" data-value="${g.id}" ?disabled=${s.money < g.cost}>${icon('hand')}<div><b>${g.name}</b><small>耐久 ${g.durability}</small></div><span>¥${g.cost}</span></button>`)}</div>${s.phase === 'play' ? html`<h3>饮品 · 每瓶 600 ml</h3><div class="option-grid">${G.DRINKS.map(d => html`<button class="option" data-action="refill" data-value="${d.id}" ?disabled=${s.money < d.cost}>${icon(d.icon)}<div><b>${d.name}</b><small>5 分钟 · ${d.note}</small></div><span>¥${d.cost}</span></button>`)}</div>` : ''}`;
  }
  function chat(s) {
    return html`<div class="chat-window">${s.chat.map((m, index) => html`<article class="chat-message ${m.self ? 'self' : ''}"><div class="chat-avatar">${esc(m.id.slice(0, 1))}</div><div><small>${esc(m.id)} · ${G.time(m.time)}</small><p>${esc(m.text)}</p>${m.b50 ? html`<button class="chat-image-button" data-action="chat-image" data-value="${index}" aria-label="查看完整 B50 成绩图"><img class="chat-b50" data-b50-image="${index}" alt="群聊 B50 成绩图片"></button>` : ''}</div></article>`)}</div><form id="chat-form" class="chat-compose"><input id="chat-message" maxlength="100" required aria-label="群聊消息" placeholder="在舞萌群发言"><button class="primary-btn" type="submit" title="发送消息" aria-label="发送消息">${icon('send')}</button></form><div class="chat-meta">发言 5 分钟 · 今日提升眼熟度 ${Math.min(s.chatDay === s.day ? s.chatCount : 0, 5)}/5 次 · @bot查看指令</div>`;
  }
  function plates(s, pool) {
    return html`<div class="plate-gallery">${G.plates(s, pool).map(p => html`<button class="plate-item ${s.profile.plate === p.id ? 'equipped' : ''}" data-action="equip-plate" data-value="${p.id}" ?disabled=${!p.unlocked}><div class="plate-preview" style="background-image:url('assets/plates/${encodeURIComponent(p.id)}.png')">${p.id === 'default' ? esc(p.name) : ''}</div><b>${p.name} ${s.profile.plate === p.id ? '· 已装备' : p.unlocked ? '· 可装备' : icon('lock-keyhole')}</b><small>${p.text}</small>${p.total ? html`<progress max="${p.total}" value="${p.done}"></progress><small>${p.done} / ${p.total} 张谱面</small>` : ''}</button>`)}</div>`;
  }
  function talents(s) {
    return html`<div class="talent-list">${G.TALENTS.filter(t => !t.initial || s.talents.includes(t.id)).map(t => html`<article class="${s.talents.includes(t.id) ? 'owned' : ''}"><span>${icon(s.talents.includes(t.id) ? 'sparkles' : 'lock-keyhole')}</span><div><b>${t.name}</b><p>${t.description}</p></div><small>${s.talents.includes(t.id) ? '已获得' : '未解锁'}</small></article>`)}</div>`;
  }
  function partnerChoices(s, pool) {
    if (s.mode !== 'pair' || !s.partnerSongs) return '';
    const names = ['BASIC', 'ADVANCED', 'EXPERT', 'MASTER', 'Re:MASTER'];
    return html`<div class="partner-choices"><h3>拼机伙伴的选曲 · 选择你的难度</h3>${s.partnerSongs.map((item, i) => {
      const charts = pool.filter(c => c.id === item.id),
        c = charts.find(c => c.index === item.index);
      return html`<label><img src="assets/covers/${item.id}.webp" alt="${esc(c.title)} 曲绘"><span><b>${esc(c.title)}</b><small>${c.type === 'DX' ? 'DX' : '标准'} · 拼机伙伴选择 ${names[item.index]} ${G.displayLevel(c.ds)}</small></span><select data-partner-slot="${i}" aria-label="拼机伙伴第 ${i + 1} 首：我的难度">${charts.map(c => html`<option value="${c.index}" ?selected=${item.playerIndex === c.index}>${names[c.index]} ${G.displayLevel(c.ds)}</option>`)}</select></label>`;
    })}</div>`;
  }
  function collections(s, pool, tab = 'achievement', query = '', page = 0, status = 'all') {
    const list = G.COLLECTIONS.filter(c => (tab === 'title' ? c.kind === 'title' : c.kind === 'plate' && (tab === 'achievement' ? ['achievement', 'default'].includes(c.category) : c.category === tab)) && (!query || `${c.name} ${c.description}`.toLowerCase().includes(query.toLowerCase()))).filter(c => status === 'all' || G.collectionProgress(s, c, pool).unlocked === (status === 'unlocked')),
      size = 18;
    return html`<div class="collection-tabs">${[['achievement', '名牌'], ['title', '称号'], ['stamp', '签到装饰'], ['region', '区域装饰']].map(([id, name]) => html`<button data-action="collection-tab" data-value="${id}" class="${tab === id ? 'selected' : ''}">${name}</button>`)}</div><div class="collection-tabs collection-status" aria-label="解锁状态">${[['all', '全部'], ['unlocked', '已解锁'], ['locked', '未解锁']].map(([id, name]) => html`<button data-action="collection-status" data-value="${id}" aria-pressed="${status === id}" class="${status === id ? 'selected' : ''}">${name}</button>`)}</div><label class="search-box collection-search">${icon('search')}<input id="collection-search" .value=${live(query)} placeholder="搜索名称 / 条件" aria-label="搜索收藏品"></label>${tab === 'stamp' ? html`<div class="collection-summary"><span>签到奖励：${esc(G.collectionItem(s.collection.stampTarget)?.name || '自动选择未完成奖励')}</span><span class="stamp-status" role="status">${icon('calendar-check')}${s.collection.lastStamp === s.day ? '今日已自动签到' : '首次上机后自动签到 · +2 进度'}</span></div>` : tab === 'title' ? html`<div class="collection-summary"><span>累计出勤距离：${s.collection.distanceKm.toFixed(1)} km · 去程与回程分别累计</span></div>` : tab === 'region' ? html`<div class="collection-summary"><span>当前区域：${esc(G.collectionItem(s.collection.regionTarget)?.region || '未选择')} · 每 PC 前进 1 / 共 10</span></div>` : ''}<div class="${tab === 'title' ? 'title-gallery' : 'plate-gallery'}">${list.slice(page * size, page * size + size).map(c => {
      const p = G.collectionProgress(s, c, pool),
        equipped = s.profile[c.kind === 'plate' ? 'plate' : 'title'] === c.id,
        active = s.collection[c.category === 'stamp' ? 'stampTarget' : 'regionTarget'] === c.id;
      return html`<article class="collection-item ${equipped ? 'equipped' : ''}">${c.kind === 'plate' ? html`<img class="collection-plate" src="assets/plates/${encodeURIComponent(c.id)}.png" alt="${esc(c.name)} 名牌">` : html`<div class="title-preview color-${esc(c.color.toLowerCase())}">${esc(c.name)}</div>`}<b>${esc(c.name)}</b><small>${c.distanceTarget ? `累计实际出勤 ${c.distanceTarget.toLocaleString()} km` : esc(c.description)}</small>${c.category === 'region' ? html`<small>本作解锁：完成所属区域 10 PC，无旅行伙伴</small>` : ''}${p.total ? html`<progress value="${p.done}" max="${p.total}"></progress><small>${p.unit ? p.done.toFixed(1) : p.done} / ${p.total}${p.unit ? ' km' : ''}</small>` : ''}${p.unsupported ? html`<small>包含 FULL SYNC 条件，尚未达成</small>` : ''}${!p.total && !p.unlocked && !['region', 'stamp'].includes(c.category) ? html`<small>该活动尚未开放</small>` : ''}<div class="collection-buttons">${['region', 'stamp'].includes(c.category) && !p.unlocked ? html`<button class="secondary-btn" data-action="collection-target" data-value="${c.id}">${active ? '已选目标' : '设为目标'}</button>` : ''}<button class="secondary-btn" data-action="equip-collection" data-value="${c.id}" ?disabled=${!p.unlocked}>${equipped ? '已装备' : p.unlocked ? '装备' : '未解锁'}</button></div></article>`;
    })}</div><div class="pagination"><span>${list.length} 件</span><button class="icon-btn" data-action="collection-page" data-value="-1" ?disabled=${page === 0} aria-label="上一页收藏">${icon('chevron-left')}</button><b>${page + 1} / ${Math.max(1, Math.ceil(list.length / size))}</b><button class="icon-btn" data-action="collection-page" data-value="1" ?disabled=${(page + 1) * size >= list.length} aria-label="下一页收藏">${icon('chevron-right')}</button></div>`;
  }
  root.LifeUI = {
    setup,
    player,
    supplies,
    shop,
    chat,
    plates,
    talents,
    collections,
    partnerChoices
  };
})(window);
