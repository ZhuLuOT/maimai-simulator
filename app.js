import {esc,icon} from './src/ui.js';
import { html, render as mount } from 'lit';
import {intro,guideSummary,goals as guideGoals} from './src/guide-ui.js';
import {chatApp,atlas as atlasView,quests as questsView,worldNotice} from './src/social-ui.js';
import {startTable,chooseMahjong,autoMahjong,abandonMahjong,mahjongView} from './src/mahjong-ui.js';
(() => {
  'use strict';

  const G = window.Game,
    songs = window.MUSIC_DATA,
    pool = G.charts(songs),
    catalog = new Map(pool.map(c => [G.key(c), c])),
    KEY = 'attendance-simulator-v2',
    OLD = 'attendance-simulator-v1';
  songs.forEach(s => {
    s.originalVersion ??= s.version;
    s.version = pool.find(c => c.id === s.id)?.version || s.version;
  });
  const $ = s => document.querySelector(s);
  function updateKeyboardViewport(){
    const viewport=window.visualViewport;
    document.documentElement.style.setProperty('--keyboard-height',(viewport?.height||window.innerHeight)+'px');
    document.documentElement.style.setProperty('--keyboard-top',(viewport?.offsetTop||0)+'px');
  }
  window.visualViewport?.addEventListener('resize',updateKeyboardViewport);
  window.visualViewport?.addEventListener('scroll',updateKeyboardViewport);
  window.addEventListener('resize',updateKeyboardViewport);
  updateKeyboardViewport();
  const names = ['BASIC', 'ADVANCED', 'EXPERT', 'MASTER', 'Re:MASTER'],
    arcades = G.ARCADES.map(a => a.name);
  let renderedModal = null, avatarPage = 0, forceModalTop = false, introReplay = false, conversation = 'group', conversationList = false, atlasTab = 'bird';
  const modalScroll = new Map();
  let state = G.create(),
    view = 'home',
    modal = null,
    search = '',
    difficulty = 'all',
    typeFilter = 'all',
    page = 0,
    eraFilter = 'all',
    genreFilter = 'all',
    patternFilter = 'all',
    utageFilter = 'exclude',
    collectionTab = 'achievement',
    collectionSearch = '',
    collectionPage = 0,
    collectionStatus = 'all',
    picked = [],
    recommendations = [],
    bestStyle = 'list',
    pickSlot = 0,
    courseLevel = 1,
    supplyReturn = 'trip',
    mealDestination = 'home',
    sound = false,
    audioCtx,
    oldAvailable = false,
    saveWarning = false;
  try {
    const s = G.migrate(JSON.parse(localStorage.getItem(KEY)));
    if (G.validate(s)) {
      state = s;
      G.recalculate(state);
    }
    oldAvailable = !!localStorage.getItem(OLD);
  } catch {
    saveWarning = true;
  }
  let seenForcedSleeps=state.forcedSleeps,mealReturn=null;
  picked=(state.selectedCharts||[]).map(k=>catalog.get(k)).filter(Boolean);
  let run = 1,
    draft = {
      name: '',
      id: '',
      job: 'student',
      playStyle: 'outer', talent: ''
    },
    offers = [];
  try {
    run = Math.max(1, Number(localStorage.getItem('attendance-run')) || 1);
    const d = JSON.parse(localStorage.getItem('attendance-setup'));
    if (d && d.run === run && Array.isArray(d.offers) && d.offers.length === 3) {
      draft = d.draft;
      offers = d.offers;
    }
  } catch {}
  if (!offers.length) offers = G.drawTalents(state, run);
  function saveDraft() {
    try {
      localStorage.setItem('attendance-setup', JSON.stringify({
        run,
        draft,
        offers
      }));
    } catch {}
  }
  saveDraft();
  function save() {
    if(state.phase==='play'){
      G.preparePartner(state,pool);
      const count=G.selectCount(state);
      if(recommendations.length!==count)recommendations=G.recommend(state,pool);
      if(picked.length){picked=picked.slice(0,count);while(picked.length<count)picked.push(recommendations[picked.length]);}
    }
    state.selectedCharts=picked.map(G.key);
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      if (!saveWarning) {
        toast('无法自动保存，请导出存档。');
        saveWarning = true;
      }
    }
  }
  function toast(t) {
    $('#toast').textContent = t;
    $('#toast').classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => $('#toast').classList.remove('show'), 3500);
  }
  function icons() {
    B50Image.hydrate(state);
  }
  function beep() {
    if (!sound) return;
    try {
      audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator(),
        g = audioCtx.createGain();
      o.frequency.value = 760;
      g.gain.setValueAtTime(.035, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(.001, audioCtx.currentTime + .08);
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start();
      o.stop(audioCtx.currentTime + .09);
    } catch {}
  }
  function stat(label, value, ic, cls, detail) {
    return html`<div class="stat ${cls}"><div class="stat-label">${icon(ic)}${label}</div><div class="stat-value">${value}</div><div class="stat-detail">${detail}</div></div>`;
  }
  function render() {
    if (!state.setupDone && !state.ending) {
      mount(LifeUI.setup(state, draft, offers, run), $('#app'));
      mount('', $('#modal-root'));
      document.body.classList.remove('modal-open');
      icons();
      return;
    }
    const j = G.JOBS[state.job],
      next = G.nextObligation(state),
      tier = G.ratingTier(state.rating),
      frame = Math.min(tier, 10),
      labels = ['白', '蓝', '绿', '黄', '红', '紫', '铜', '银', '金', '白金', '虹'];
    mount(html`<header class="topbar"><a class="brand" href="#" data-action="nav" data-value="home"><span class="brand-mark">${icon('disc-3')}</span><span>出勤模拟器<span class="brand-en">MAIMAI LIFE SIMULATOR</span></span></a><nav aria-label="主导航">${[['home', 'house', '日常'], ['library', 'disc-3', '曲库'], ['best', 'trophy', 'B50'], ['journal', 'notebook-pen', '手账']].map(([v, i, n]) => html`<button class="nav-item ${v === view ? 'active' : ''}" aria-label="${n}" title="${n}" data-action="nav" data-value="${v}">${icon(i)}<span>${n}</span></button>`)}</nav><div class="top-tools"><span class="save-state"><span></span>自动存档</span><button class="icon-btn" data-action="sound" title="${sound ? '关闭' : '开启'}音效" aria-label="音效">${icon(sound ? 'volume-2' : 'volume-x')}</button><button class="icon-btn" data-action="settings" title="存档与设置" aria-label="存档与设置">${icon('settings-2')}</button></div></header>
      <main><div class="date-toolbar"><div class="calendar-date">${icon('calendar-days')}<b>${G.dateLabel(state)}</b><span>第 ${state.day} / ${G.DAYS} 天</span></div><div class="clock-display">${icon('clock-3')}<b class="${state.nightActive ? 'late-hours' : ''}">${G.time(state.clock)}</b><span>${state.nightActive ? '尚未充分休息' : next ? `${next.name} ${G.time(next.start)}` : '今日无剩余日程'}</span></div></div>
      ${LifeUI.player(state)}
      ${view === 'home' ? html`${guideSummary(state)}${home()}` : view === 'library' ? library() : view === 'best' ? bestView() : journal()}
      <footer><span>出勤模拟器 · 2026 春季篇</span><button class="text-btn" data-action="about">曲库来源与游戏规则 ${icon('arrow-up-right')}</button></footer></main>`, $('#app'));
    renderModal();
    icons();
  }
  function home() {
    const j = G.JOBS[state.job],
      busy = state.phase !== 'home' || !!state.ending,
      classes = G.schedule(state),
      next = G.nextObligation(state),
      school = state.school;
    return html`<section class="career-bar"><div class="career-title">${icon(j.icon)}<b>${j.name}</b><span>${j.detail}</span></div><button class="text-btn" data-action="supplies">${icon('shopping-bag')}购买手套</button></section>
    <div class="daily-layout"><section class="schedule-panel"><div class="section-heading"><h2>今日${state.job === 'student' ? '课表' : '日程'}</h2>${state.job === 'student' ? html`<button class="text-btn" data-action="timetable">整周课表</button>` : html`<span>${state.job === 'worker' ? '工作日 09:00–18:00' : '自由安排'}</span>`}</div><div class="day-track"><span style="left:${state.clock / 1440 * 100}%"></span>${classes.map(c => html`<i title="${c.name}" class="${c.kind}" style="left:${c.start / 1440 * 100}%;width:${(c.end - c.start) / 1440 * 100}%"></i>`)}</div><div class="track-labels"><span>00:00</span><span>08:00</span><span>16:00</span><span>24:00</span></div>
    <div class="schedule-list">${classes.length ? classes.map(c => {
      const done = state.completed.includes(c.id);
      return html`<div class="schedule-row ${done ? 'done' : ''}"><span class="schedule-time">${G.time(c.start)}<small>${G.time(c.end)}</small></span><div><b>${c.name}</b><small>${c.kind === 'major' ? '专业课 · 学力 +5 / 心情 -7' : c.kind === 'general' ? '水课 · 学力 +2 / 心情 -3' : '固定工作 · 心情 -15'}${state.absences.includes(c.id) ? (c.kind === 'shift' ? ' · 旷工' : ' · 旷课') : done ? ' · 已处理' : ''}</small></div><div class="schedule-buttons">${!done ? html`<button class="secondary-btn" data-action="class" data-value="${c.id}" ?disabled=${busy || c.id !== next?.id}>${icon(c.kind === 'shift' ? 'briefcase-business' : 'book-open')}${c.kind === 'shift' ? '上班' : '上课'}</button>${c.kind !== 'shift' ? html`<button class="icon-btn" data-action="skip-dialog" data-value="${c.id}" ?disabled=${busy || c.id !== next?.id} title="逃课" aria-label="逃课 ${c.name}">${icon('door-open')}</button>` : ''}` : icon('circle-check')}</div></div>`;
    }) : html`<div class="free-day">${icon('sun')}<div><b>${state.job === 'student' ? '今日无课' : '今天没有固定日程'}</b><span>机厅 10:00 开门，23:30 结束游玩</span></div></div>`}</div>
    ${state.job === 'student' ? html`<div class="academic-line ${school.failing ? 'warning' : ''}"><span>${icon('graduation-cap')}学力 <b>${school.academic}/100</b></span><span>约谈 ${school.talks}/3</span><span>${school.failing ? `挂科第 ${state.day - school.since + 1}/10 天` : '学业正常'}</span><button class="text-btn" data-action="daily" data-value="study" ?disabled=${busy}>补习 2 小时 ${icon('book-open')}</button></div>` : html`<div class="rent-line"><span>${icon('house')}每月 25 日房租</span><b>¥${j.rent}</b><span class="${state.money < j.rent ? 'danger-text' : ''}">${state.money >= j.rent ? '余额已足够' : '还差 ¥' + (j.rent - state.money)}</span></div>`}</section>
    <aside class="life-panel"><div class="section-heading"><h2>本月收支</h2><span>${G.date(state).getUTCMonth() + 1} 月</span></div><div class="ledger"><div><span>${state.job === 'worker' ? '工资 · 每月 1 日发放' : state.job === 'student' ? '生活费 · 每月 1 日发放' : '固定收入'}</span><b>¥${j.monthly}</b></div><div><span>每日基本开销</span><b>-¥${j.daily}</b></div><div><span>25 日房租</span><b>${j.rent ? '-¥' + j.rent : '住宿费已缴'}</b></div></div><div class="goal-inline"><span>W6 进度</span><b>${Math.round(state.rating / 16000 * 100)}%</b></div><div class="meter"><span style="width:${Math.min(100, state.rating / 16000 * 100)}%"></span></div><div class="relationship">${icon('heart-handshake')}<div><b>${G.relationshipLabel(state)}</b><small>${state.visits} 次出勤 · ${state.tracks} 首游玩</small></div></div></aside></div>
    <section class="actions-section"><div class="section-heading"><h2>安排接下来的时间</h2><span>${G.time(state.clock)} · 困意 ${Math.round(state.drowsiness)}/100</span></div><div class="action-grid"><button class="action-card attend" data-action="attend" ?disabled=${state.ending}><span class="action-icon">${icon('disc-3')}</span><div><h3>${state.phase === 'home' ? '出发，打舞萌！' : '继续出勤'}</h3><p>普通机厅 ¥6 / PC${state.city.denUnlocked?' · 猫窝 ¥30/小时':''}</p><small>${state.city.denUnlocked?'普通店 23:30 停机 · 猫窝全天营业':'23:30 结束游玩'}</small></div>${icon('arrow-up-right')}</button>${state.job !== 'worker' ? html`<button class="action-card work" data-action="daily" data-value="work" ?disabled=${busy}><span class="action-icon">${icon('briefcase-business')}</span><div><h3>打工，攒钱</h3><p>4 小时 · +¥${j.wage}</p><small>心情 -12 · 每天最多 2 次</small></div>${icon('arrow-up-right')}</button>` : ''}<button class="action-card fun" data-action="entertain" ?disabled=${busy}><span class="action-icon">${icon('gamepad-2')}</span><div><h3>娱乐</h3><p>给心情充个电</p><small>外出娱乐 · 刷视频</small></div>${icon('arrow-up-right')}</button></div>${LifeUI.mealStatus(state)}<div class="day-controls"><button class="secondary-btn" data-action="daily-meal" ?disabled=${busy}>${icon('utensils')}一日三餐</button>${state.love ? html`<button class="secondary-btn" data-action="relationship">${icon('heart-handshake')}小凛 · ${G.relationshipLabel(state)}</button>` : ''}<button class="secondary-btn" data-action="plates" aria-label="名牌与解锁进度">${icon('badge')}名牌与装饰</button><button class="secondary-btn" data-action="chat">${icon('messages-square')}打开聊天软件</button><button class="secondary-btn" data-action="daily" data-value="wait" ?disabled=${busy}>${icon('clock-3')}等待</button><button class="primary-btn" data-action="sleep-menu" ?disabled=${busy}>${icon('moon')}睡觉</button></div></section>
    <section class="recent-section"><div class="section-heading"><h2>今日手账</h2><button class="text-btn" data-action="nav" data-value="journal">全部记录 ${icon('arrow-right')}</button></div>${logRows(state.logs.slice(0, 5))}</section>`;
  }
  function logRows(items) {
    return html`<div class="log-list">${items.map(l => html`<div class="log-row"><span class="log-day">DAY ${l.day}<small>${G.time(l.time || 0)}</small></span><span class="log-dot ${esc(l.type)}"></span><span>${esc(l.text.replace('的鬼歌手元，','的手元，').replace('；这次没有刷到适合自己的手元。','。'))}</span></div>`)}</div>`;
  }
  function cover(c) {
    return html`<span class="song-cover"><img src="assets/covers/${esc(c.id)}.webp" data-cover="${esc(c.id)}" loading="lazy" alt="${esc(c.title)} 曲绘"><span>${c.type === 'DX' ? 'DX' : '标准'}</span></span>`;
  }
  function canonical(c) {
    return {
      ...c,
      ...catalog.get(G.key(c)),
      ...(c.achievement !== undefined ? {
        achievement: c.achievement,
        ra: c.ra,
        combo: c.combo
      } : {})
    };
  }
  function badge(c) {
    return html`${G.isUtage(c) ? html`<span class="chart-tag utage-tag">宴 · 不计 Rating</span>` : ''}${c.tag ? html`<span class="chart-tag ${c.tag}">${c.tag === 'ghost' ? '鬼歌' : '吃分推荐'}</span>` : ''}<span class="tendency ${c.tendency === 'star' ? 'star' : 'key'}">${icon(c.tendency === 'star' ? 'star' : 'keyboard')}${c.tendency === 'star' ? '星星' : '键盘'}</span>`;
  }
  function rows(list, selectable = false) {
    return list.map(raw => {
      const c = canonical(raw),
        r = c.achievement !== undefined ? c : state.records[G.key(c)],
        isPicked = picked[pickSlot] && G.key(picked[pickSlot]) === G.key(c);
      return html`<div class="song-row">${cover(c)}<div class="song-info"><b>${esc(c.title)}</b><small>${esc(c.version)} · ${c.type === 'DX' ? 'DX' : '标准'} ${badge(c)}</small></div><span class="difficulty diff-${c.index}">${names[c.index]}<b>${G.displayLevel(c)}</b></span>${selectable ? html`<button class="icon-btn pick-btn ${isPicked ? 'picked' : ''}" data-action="pick" data-value="${esc(G.key(c))}" title="选择谱面" aria-label="选择 ${esc(c.title)} ${c.type} ${names[c.index]}">${icon(isPicked ? 'check' : 'plus')}</button>` : html`<div class="record-score">${r ? html`<b>${r.achievement.toFixed(4)}%</b><small>${G.rank(r.achievement)} · ${r.ra} RA ${esc(r.combo || '')}</small>` : html`<small>未游玩</small>`}</div>`}</div>`;
    });
  }
  function chartMatches(c) {
    const levelQuery = /^\d{1,2}\+?$/.test(search.trim()) ? search.trim() : null;
    return (!levelQuery || G.displayLevel(c) === levelQuery) && (difficulty === 'all' || c.index === Number(difficulty)) && (patternFilter === 'all' || c.tendency === patternFilter || c.tag === patternFilter);
  }
  function filtered() {
    const q = search.trim().toLowerCase();
    return songs.filter(s => (typeFilter === 'all' || s.type === typeFilter) && (eraFilter === 'all' || s.version === eraFilter) && (genreFilter === 'all' || s.genre === genreFilter) && (utageFilter === 'all' || utageFilter === 'only' === G.isUtage(s)) && (!q || /^\d{1,2}\+?$/.test(q) || `${s.title} ${s.artist} ${s.id}`.toLowerCase().includes(q)) && s.ds.some((_, i) => {
      const c = catalog.get(s.id + ':' + i);
      return c && chartMatches(c);
    }));
  }
  function filters() {
    const select = (id, label, options, value) => html`<select id="${id}" aria-label="${label}"><option value="all">${label}</option>${options.map(([v, t]) => html`<option value="${esc(v)}" ?selected=${value === v}>${esc(t)}</option>`)}</select>`;
    return html`<div class="library-filters"><label class="search-box">${icon('search')}<input id="song-search" aria-label="搜索曲名、艺术家或曲目 ID" value="${esc(search)}" placeholder="曲名 / ID / 等级（如 12+）" autocomplete="off"></label><select id="difficulty" aria-label="谱面难度"><option value="all">全部难度</option>${names.map((n, i) => html`<option value="${i}" ?selected=${difficulty === String(i)}>${n}</option>`)}</select><select id="song-type" aria-label="谱面版本"><option value="all">标准 + DX</option><option value="SD" ?selected=${typeFilter === 'SD'}>标准</option><option value="DX" ?selected=${typeFilter === 'DX'}>DX</option></select>${select('song-era', '全部时代', [...new Set(songs.map(s => s.version))].map(v => [v, v]), eraFilter)}${select('song-genre', '全部分区', [...new Set(songs.map(s => s.genre))].map(v => [v, v]), genreFilter)}${select('song-pattern', '全部配置', [['star', '星星谱'], ['key', '键盘谱'], ['ghost', '鬼歌'], ['easy', '吃分推荐']], patternFilter)}<select id="song-utage" aria-label="宴曲筛选">${[['exclude', '排除宴曲'], ['only', '只看宴曲'], ['all', '包含宴曲']].map(([v, t]) => html`<option value="${v}" ?selected=${utageFilter === v}>${t}</option>`)}</select></div>`;
  }
  function grouped(list, selectable = false) {
    return list.map(s => html`<article class="song-group"><div class="song-group-header">${cover(s)}<div><h3>${esc(s.title)} <span class="type-label ${s.type}">${s.type === 'DX' ? 'DX' : '标准'}</span></h3><p>${esc(s.artist)}</p><small>${esc(s.version)} · ${s.bpm} BPM · ID ${s.id}</small></div></div><div class="difficulty-grid">${s.ds.map((ds, index) => {
      if (difficulty !== 'all' && Number(difficulty) !== index) return '';
      const c = catalog.get(`${s.id}:${index}`);
      if (!c || !chartMatches(c)) return '';
      const r = state.records[G.key(c)],
        chosen = picked[pickSlot] && G.key(picked[pickSlot]) === G.key(c);
      return html`<button class="chart-cell diff-${index} ${chosen ? 'chosen' : ''}" data-action="${selectable ? 'pick' : 'chart-detail'}" data-value="${esc(G.key(c))}" aria-label="${selectable ? '选择' : '查看'} ${esc(s.title)} ${s.type} ${names[index]}"><span>${names[index]} ${chosen ? icon('check') : ''}</span><b>${G.displayLevel(c)}</b>${badge(c)}<small>${r ? `${r.achievement.toFixed(4)}% · ${r.ra} RA` : '未游玩'}</small>${r?.combo ? html`<em>${esc(r.combo)}</em>` : ''}</button>`;
    })}</div></article>`);
  }
  function pagination(total, size) {
    return html`<div class="pagination"><span>${total} 首曲目</span><button class="icon-btn" data-action="page" data-value="-1" ?disabled=${page === 0} title="上一页" aria-label="上一页">${icon('chevron-left')}</button><b>${page + 1} / ${Math.max(1, Math.ceil(total / size))}</b><button class="icon-btn" data-action="page" data-value="1" ?disabled=${(page + 1) * size >= total} title="下一页" aria-label="下一页">${icon('chevron-right')}</button></div>`;
  }
  function libraryResults() {
    const f = filtered(),
      size = modal === 'picker' ? 6 : 10;
    return html`${f.length ? grouped(f.slice(page * size, page * size + size), modal === 'picker') : html`<div class="empty">没有找到这首歌。</div>`}${pagination(f.length, size)}`;
  }
  function library() {
    return html`<section class="library-section"><div class="section-heading"><h2>舞萌曲库<span>${songs.length} SONGS · ${pool.length} CHARTS</span></h2><span>按歌曲 / 标准・DX 分组</span></div>${filters()}<div id="song-results">${libraryResults()}</div></section>`;
  }
  function bestView() {
    const b = G.best(state),
      toggle = html`<div class="section-heading"><h2>B50</h2><div class="view-toggle"><button class="secondary-btn" data-action="best-style" data-value="list" aria-pressed="${bestStyle === 'list'}">${icon('list')}列表</button><button class="secondary-btn" data-action="best-style" data-value="image" aria-pressed="${bestStyle === 'image'}">${icon('image')}成绩图</button></div></div>`;
    if (bestStyle === 'image') return html`${toggle}${html`<div class="b50-image-view"><img data-b50-image="current" alt="B50 成绩图片"><button class="secondary-btn" data-action="download-b50">${icon('download')}下载成绩图</button></div>`}`;
    return html`${toggle}${html`<div class="best-columns">${[[b.old, 'B35', '旧版本最佳 35 张'], [b.fresh, 'B15', '新版本最佳 15 张']].map(([r, t, d]) => html`<section><div class="best-heading"><b>${t}<small>${d}</small></b><span>${r.reduce((s, c) => s + c.ra, 0)} RA</span></div>${r.length ? rows(r) : html`<div class="empty">第一首歌，等你来点亮。</div>`}</section>`)}</div>`}`;
  }
  function journal() {
    return html`<section><div class="section-heading"><h2>春季出勤手账</h2><span>${state.visits} 次出勤 · ${state.tracks} 首游玩</span></div><div class="rating-history">${state.history.filter((_, i) => i % Math.max(1, Math.ceil(state.history.length / 32)) === 0).map(h => html`<div title="第 ${h.day} 天 · Rating ${h.rating}"><span style="height:${Math.max(2, h.rating / 16000 * 100)}%"></span><small>${h.day}</small></div>`)}</div>${logRows(state.logs)}</section>`;
  }
  function frame(title, sub, body, wide = false, close = true) {
    return html`<div class="modal-backdrop"><section class="modal ${wide ? 'wide' : ''}" data-modal=${modal} role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1"><div class="modal-heading"><div><span class="eyebrow">${sub}</span><h2 id="modal-title">${title}</h2></div>${close ? html`<button class="icon-btn" data-action="close" title="关闭" aria-label="关闭">${icon('x')}</button>` : ''}</div>${body}</section></div>`;
  }
  function options(list, action) {
    return html`<div class="option-grid">${list.map(x => {
      const unavailable = x.cost > state.money || action==='eat-home'&&(!G.canEatHome(state,x.id)) || action === 'meal' && (mealDestination==='arcade'?!!G.returnToPlayReason(state,x.id):(!G.canSpendTime(state, x.time + state.trip.returnTime) || state.job === 'student' && state.clock + x.time + state.trip.returnTime > 1440));
      return html`<button class="option" data-action="${action}" data-value="${x.id}" ?disabled=${unavailable}>${icon(x.icon)}<div><b>${x.name}</b><small>${x.note}</small></div><span>${x.cost ? `¥${x.cost}` : ['meal','eat-home'].includes(action) ? '已含' : '免费'}${x.time ? html`<small>${action === 'travel' ? '往返 ' : ''}${x.time} 分钟</small>` : ''}</span></button>`;
    })}</div>`;
  }
  function steps(n) {
    return html`<div class="trip-steps">${['出门', '上机 / 排队', '下机'].map((t, i) => html`<span class="${i === n ? 'active' : ''}"><b>0${i + 1}</b>${t}</span>`)}</div>`;
  }
  function phone(select = false) {
    return html`<div class="phone-shell"><div class="phone-status"><b>${G.time(state.clock)}</b><span>${icon('signal')}${icon('wifi')}${icon('battery-full')}</span></div><div class="phone-title"><span class="phone-app-icon">${icon('map-pinned')}</span><div><h3>机厅看看</h3><small>普通店 10:00–23:30 · 猫窝全天营业</small></div></div><div class="phone-location">${icon('map-pin')}广州 · 大学城出发 <span>已发现 ${state.city.arcades.length} / ${G.ARCADE_LIMIT} 家${state.city.denUnlocked?' · 特殊场所 1 家':''}</span></div>${G.unlockedArcades(state).map(({name:a, id:i}) => html`<button class="arcade-option ${state.arcade === i ? 'selected' : ''}" aria-pressed=${state.arcade === i} data-action="arcade" data-value="${i}" ?disabled=${!select}><div><b>${a}</b><small>${G.ARCADE_KM[i].toFixed(1)} km 单程 · ${G.ARCADES[i].cabinets} 台双人机组</small><small>${G.allNight(state,i)?'24 小时营业 · ¥30 / 小时 · 打歌不另收费':'10:00–23:30 · 每 PC ¥6'}</small></div><span class="crowd-count"><b>${G.peopleAt(state, i)}</b>人在店</span></button>`)}<div class="phone-footer">${state.city.arcades.length===G.ARCADE_LIMIT?'本城机厅已全部发现 · ':''}人数随时段与进出店变化 · ${state.mode === 'pair' ? '全员双人拼机' : '单人排队'}</div></div>`;
  }
  function modeControl() {
    const r = G.roundInfo(state),
      waiting = state.phase === 'play' ? Math.max(0, state.queueUntil - state.clock) : r.queue;
    return html`<div class="mode-select">${Object.values(G.MODES).map(m => html`<button class="${state.mode === m.id ? 'selected' : ''}" ?disabled=${m.id==='pair'&&G.peopleAt(state)===0} data-action="mode" data-value="${m.id}" aria-pressed="${state.mode === m.id}">${icon(m.icon)}${m.name}<small>${m.count} 首 · 自选 ${m.id === 'pair' && state.mode === 'pair' ? G.selectCount(state) : m.select} 首</small></button>`)}</div><div class="mode-status">${icon('circle-check')}当前模式：${G.MODES[state.mode].name}${state.mode === 'pair' ? ' · 双人同时游玩' : ' · 单人游玩'}</div><div class="queue-info">${icon('users')}${state.phase === 'play' ? '还需等候' : '预计排队'} ${waiting} 分钟 · 机厅 ${G.peopleAt(state)} 人<span>${G.allNight(state)?'¥30 / 小时':`每人 ¥${G.pcPrice(state)}`}</span></div>`;
  }
  function results() {
    if (!state.last) return '';
    return html`${state.last.battle?html`<p class="battle-result">友人对战 · ${state.last.battle.outcome==='wins'?'获胜':state.last.battle.outcome==='losses'?'落败':'平局'} · ${state.last.battle.ours.toFixed(4)} / ${state.last.battle.theirs.toFixed(4)}</p>`:''}<div class="result-banner"><div>${icon('sparkles')}Rating <b>+${state.last.gain}</b></div><span>星星 +${(state.skills.star - state.last.skillsBefore.star).toFixed(3)} · 键盘 +${(state.skills.key - state.last.skillsBefore.key).toFixed(3)} · 读谱 +${(state.skills.reading - (state.last.skillsBefore.reading ?? state.skills.reading)).toFixed(3)}</span></div><div class="performance-results">${state.last.results.map(c => html`<article>${cover(c)}<div><small class="diff-text-${c.index}">${names[c.index]} ${G.displayLevel(c)} · ${state.last.courseLevel ? '段位课题' : c.partner ? '对方选曲' : '自选'}</small><b>${esc(c.title)}</b><div class="performance-score">${c.achievement.toFixed(4)}% <em class="grade-icon"><img src="assets/grades/music_icon_${G.rank(c.achievement).toLowerCase().replace('+','p')}.png" alt="${G.rank(c.achievement)}"></em><span class="combo-badge">${c.combo || 'CLEAR'}</span></div>${c.opponent?html`<small class="sync-result">${G.syncLabel(c.sync)} · ${esc(c.opponent.id)} ${names[c.opponent.index]} ${c.opponent.achievement.toFixed(4)}% ${c.opponent.combo||'CLEAR'}</small>`:''}<small>${c.overreach ? '越级 · ' : ''}第 ${c.plays} 次 · ${c.improved ? 'NEW BEST' : ''}</small><details class="judgement-fold"><summary>查看判定</summary>${Number.isInteger(c.maxCombo)?html`<small>最大连击 ${c.maxCombo} / ${c.notes.reduce((a,b)=>a+b,0)}</small>`:''}<div class="judgements">${['critical', 'perfect', 'great', 'good', 'miss'].map((k, i) => html`<span>${['CRITICAL', 'PERFECT', 'GREAT', 'GOOD', 'MISS'][i]} <b>${c.judgements?.[k] ?? 0}</b></span>`)}</div>${c.breakJudgements ? html`<small class="break-details">BREAK 判定 · 基础 ${c.baseScore.toFixed(4)}% + 加分 ${c.extraScore.toFixed(4)}%</small>` : ''}</details>${c.segmentEvent ? html`<p class="segment-outcome ${c.segmentEvent.passed ? 'passed' : 'failed'}">${c.segmentEvent.scene} · ${c.segmentEvent.passed ? '判定通过' : `段落坠机 · +${c.segmentEvent.misses} MISS · -${c.segmentEvent.loss.toFixed(4)}%`}</p>` : ''}</div></article>`)}</div>`;
  }
  function sleepForecast(kind) {
    const plan=G.sleepPlan(state,kind),day=plan.day===state.day?'今天':'明天';
    return `预计 ${day} ${G.time(plan.clock)} 起床${plan.conflicts.length?' · 将错过：'+plan.conflicts.map(c=>c.name).join('、'):''}`;
  }
  function renderModal() {
    if (state.ending && modal !== 'restart') modal = 'ending';else if (state.world?.mahjong.active) modal='mahjong';else if(state.world?.notice) modal='world-event';else if (state.school.pending) modal = 'teacher';else if (state.event !== null) modal = 'event';else if (state.city.encounter) modal = 'city-encounter';else if (state.videoEvent) modal = 'video';else if(state.setupDone&&!state.guide.introDone){modal='chat';if(G.postIntro(state))save();}
    if(state.forcedSleeps!==seenForcedSleeps){seenForcedSleeps=state.forcedSleeps;modal=null;state.roundReview=false;picked=[];recommendations=[];forceModalTop=true;toast(G.homeText(state,'困意已满，已结束行动并回家睡觉。'));}
    if(state.ending&&modal!=='restart')modal='ending';else if(!state.ending&&state.school.pending)modal='teacher';
    if(!state.ending&&!state.school.pending&&state.event===null&&!state.city.encounter&&!state.world?.notice&&!state.world?.mahjong.active&&!state.videoEvent&&state.setupDone&&state.guide.introDone&&(!modal||['trip','chat','entertain'].includes(modal))&&G.mealReminder(state)>=0){mealReturn=modal;modal='daily-meal';forceModalTop=true;}
    const root = $('#modal-root');
    if (!modal) {
      const dialog=root.querySelector('.modal');
      if(renderedModal&&dialog) modalScroll.set(renderedModal,dialog.scrollTop);
      renderedModal=null;
      mount('', root);
      document.body.classList.remove('modal-open');
      return;
    }
    document.body.classList.add('modal-open');
    let content = '';
    if(modal==='daily-meal')content=frame(`${G.MEAL_NAMES[G.mealDue(state)]||'用餐'}时间，吃点什么`,`${G.time(state.clock)} · ${state.mealBreak?'午休':G.residence(state)}`,html`${LifeUI.mealStatus(state)}${options(G.homeMeals(state),'eat-home')}<p class="form-note">连续 3 天漏餐开始降低最大体力；连续 3 天规律三餐并出门活动，最大体力 +1。</p><button class="secondary-btn" data-action="meal-later">稍后再吃</button>`,false,false);
    if(modal==='sleep')content=frame('休息一下',`困意 ${Math.round(state.drowsiness)}/100 · 体力 ${Math.floor(state.stamina)}/${state.maxStamina}`,html`<div class="option-grid"><button class="option" data-action="sleep-now" data-value="nap">${icon('alarm-clock')}<div><b>小睡一会</b><small>30 分钟 · 困意 -15 · 体力 +20</small><small>${sleepForecast('nap')}</small></div></button><button class="option" data-action="sleep-now" data-value="full">${icon('moon')}<div><b>好好睡一觉</b><small>至少 8 小时 · 困意清零 · 体力恢复满</small><small>${sleepForecast('full')}</small></div></button></div><p class="form-note">夜间休息最早 08:00 起床；晚睡会相应晚起。睡过课程记旷课，睡过班次记旷工。</p>`);
    if(modal==='guide')content=frame('从今天的一枚游戏币开始','春季小目标',guideGoals(state),true);
    if (modal === 'chat') {const guided=!state.guide.introDone||introReplay,shown=introReplay?{...state,chat:G.introMessages(state)}:state;content=frame('聊天软件',guided?'开局群聊':'群聊、好友与支线',chatApp(shown,conversation,conversationList,guided,guided?intro(state,introReplay):''),true,!guided);}
    if (modal?.startsWith('b50chat:')) content = frame('B50 成绩图', '群聊中的成绩记录', html`<div class="b50-image-view"><img data-b50-image="${modal.split(':')[1]}" alt="群聊 B50 完整成绩图片"></div>`, true);
    if(modal==='atlas')content=frame('城市图鉴','观鸟记录 · 像素画作',atlasView(state,atlasTab),true);
    if(modal==='quests')content=frame('好友支线','他们也有自己的广州生活',questsView(state),true);
    if(modal==='world-event')content=frame(state.world.notice.title,'广州 · 新的相遇',worldNotice(state),false,false);
    if(modal==='mahjong')content=frame('猫窝麻将','立直麻将一局战 · 我要睡觉 / 逃遁 / 鲁米诺',mahjongView(),true,false);
    if (modal === 'supplies') content = frame('手套与补给', '钱包 ¥' + state.money, LifeUI.shop(state));
    if (modal === 'plates') content = frame('我的名牌', '版本成就 · 极 / 将 / 神 / 舞舞', LifeUI.collections(state, pool, collectionTab, collectionSearch, collectionPage, collectionStatus), true);
    if (modal === 'ranks') content = frame('段位与友人对战','友人对战 · 四曲 LIFE 挑战',LifeUI.ranks(state,pool),true);
    if (modal === 'course-preview') {
      const charts=G.courseCharts(courseLevel,pool),reason=G.courseReason(state);
      content=frame(G.COURSE_NAMES[courseLevel-1]+' · 段位挑战',`四曲 · 20 分钟 · ${G.allNight(state)?'计入小时费用':`¥${G.pcPrice(state)*2}`}`,html`${steps(1)}<div class="trip-info">${icon('wallet')}¥${state.money}<span>LIFE 300</span><span>${G.time(state.clock)}</span></div>${LifeUI.supplies(state)}<div class="small-heading">固定课题 · 按顺序游玩<span>${icon('lock-keyhole')}曲目与难度不可更换</span></div><div class="course-fixed-charts">${charts.map((c,i)=>html`<section data-course-chart="${G.key(c)}"><small class="course-track-number">第 ${i+1} 首</small>${rows([c])}</section>`)}</div><p class="form-note">GREAT -1 / GOOD -2 / MISS -3；完成四曲后 LIFE 大于 0 即合格。</p><div class="modal-actions"><button class="secondary-btn" data-action="ranks">返回段位列表</button><button class="primary-btn" data-action="course-start" ?disabled=${!!reason}>${icon('play')}${G.allNight(state)?'开始挑战 · 已计时':`投币挑战 · ¥${G.pcPrice(state)*2}`}</button></div>${reason?html`<p class="warning">${reason}</p>`:''}`,true);
    }
    if(modal==='course-result'){
      const r=state.competition.lastCourse;
      content=frame(G.COURSE_NAMES[r.level-1]+' · 挑战结算',r.passed?'合格':'未合格',html`<div class="outing-summary"><div><small>剩余 LIFE</small><b>${r.life}<span> / 300</span></b></div><div><small>固定课题</small><b>4<span> 首</span></b></div></div>${results()}<div class="modal-actions"><button class="secondary-btn" data-action="ranks">查看段位</button><button class="primary-btn" data-action="close">返回上机</button></div>`,true);
    }
    if (modal === 'avatar') content = frame('头像', '默认 / 原有头像 / 自定义', html`<div class="avatar-editor"><img src="${state.profile.avatar || window.AVATARS[0].src}" alt="当前头像"><div class="avatar-controls"><label class="secondary-btn">${icon('upload')}上传图片<input id="avatar-upload" type="file" accept="image/png,image/jpeg,image/webp" hidden></label><button class="secondary-btn" data-action="reset-avatar">${icon('rotate-ccw')}恢复默认</button></div></div><div class="avatar-gallery">${window.AVATARS.slice(avatarPage*24,(avatarPage+1)*24).map(a=>html`<button class="avatar-choice" data-action="original-avatar" data-value="${a.id}" aria-pressed=${(state.profile.avatar || window.AVATARS[0].src)===a.src} title="${a.name}"><img loading="lazy" src="${a.src}" alt="${a.name}"><span>${a.name}</span></button>`)}</div><div class="modal-actions avatar-pages"><button class="secondary-btn" data-action="avatar-page" data-value="-1" ?disabled=${avatarPage===0}>上一页</button><span>${avatarPage+1} / ${Math.ceil(window.AVATARS.length/24)} · 共 ${window.AVATARS.length} 款</span><button class="secondary-btn" data-action="avatar-page" data-value="1" ?disabled=${(avatarPage+1)*24>=window.AVATARS.length}>下一页</button></div>`);
    if (modal === 'relationship') content = frame('与小凛的日常',G.relationshipLabel(state),html`<div class="relationship-summary"><span>故事 ${state.love} / ${G.EVENTS.length}</span><span>信任 ${state.romance.trust}/100</span></div><div class="modal-actions"><button class="secondary-btn" data-action="love-contact" data-value="chat" ?disabled=${state.phase!=='home'||state.loveFailed||state.romance.lastContact===state.day}>${icon('messages-square')}聊聊近况 · 15 分钟</button><button class="secondary-btn" data-action="love-contact" data-value="walk" ?disabled=${state.phase!=='home'||state.loveFailed||state.romance.lastContact===state.day||state.stamina<8||state.money<8}>${icon('footprints')}一起散步 · 60 分钟 / ¥8</button></div><div class="relationship-memories">${state.romance.memories.length?state.romance.memories.map(m=>html`<article><small>第 ${m.day} 天 · ${G.EVENTS[m.stage].title}</small><p>${m.text}</p></article>`):html`<p>从下一次见面开始，记下共同的回忆。</p>`}</div>`);
    if (modal === 'talents') content = frame('词条', '已获得 ' + state.talents.length + ' 项', LifeUI.talents(state), true);
    if (modal === 'video') {
      const c = catalog.get(state.videoEvent.key);
      content = frame('刷到了一段手元', c.title, html`${rows([c])}<p class="event-text">${state.videoEvent.outcome === 'clear' ? '反复看了关键段落，终于理顺了动作与节奏。' : '记住了开头和几个难点，还需要上机试试。'}</p><div class="modal-actions"><button class="primary-btn" data-action="learn-video">${icon('scan-eye')}${state.videoEvent.outcome === 'clear' ? '大彻大悟' : '似懂非懂'}</button></div>`, false, false);
    }
    if (modal === 'phone') content = frame('机厅看看', 'ARCADE RADAR', phone());
    if (modal === 'trip') {
      if (state.phase === 'travel') content = frame('选择机厅与出行方式', `${G.dateLabel(state)} · ${G.time(state.clock)}`, html`${steps(0)}<div class="travel-layout">${phone(true)}<div>${modeControl()}<p class="form-note">${G.allNight(state)?html`<span class="den-price">猫窝全天营业 · ¥30 / 小时，入场预付首小时，超时按整小时续费。PC / 段位不另收费，离店吃饭暂停计时。困意满会强制回${G.residence(state)}睡觉。</span>`:''}本次单程 ${G.ARCADE_KM[state.arcade].toFixed(1)} km，往返 ${(G.ARCADE_KM[state.arcade] * 2).toFixed(1)} km；到店与回${G.residence(state)}时分别累计。</p>${options(G.transportOptions(state.arcade), 'travel')}<button class="finish-btn" data-action="cancel-trip">今天先不出门 ${icon('undo-2')}</button></div></div>`, true);
      if (state.phase === 'drink') content = frame('上机前，喝点什么', `${G.time(state.clock)} · ${arcades[state.arcade]}`, html`${steps(1)}${LifeUI.drinkShop(state)}<button class="primary-btn" data-action="drinks-ready">选好了，进入排队</button>`);
      if (state.phase === 'play') {
        const reason = G.playReason(state), canSelect=state.queueUntil<=state.clock&&!state.roundReview;
        if(canSelect&&!recommendations.length)recommend();
        content = frame('上机 / 排队', `${G.time(state.clock)} · ${G.allNight(state)?'猫窝全天营业 · ':''}最晚 ${G.availableUntil(state)>=1440?'次日 ':''}${G.time(G.availableUntil(state)%1440)} 结束上机`, html`${steps(1)}${!canSelect?results():''}${modeControl()}<div class="crowd-broadcast" role="status">${state.logs.filter(l=>l.type==='crowd'&&l.day===state.day&&(l.day>(state.trip.startDay||state.day)||l.time>=state.trip.start)).slice(0,3).map(l=>html`<p>${G.time(l.time)} · ${esc(l.text)}</p>`)}</div>${LifeUI.supplies(state)}${state.mode==='solo'&&canSelect?html`<div class="supply-actions"><button class="secondary-btn" data-action="ranks">${icon('medal')}段位挑战</button>${state.arcade===5?html`<button class="secondary-btn" data-action="mahjong">${icon('grid-2x2')}猫窝麻将 · 25 分钟</button>`:''}</div>`:''}${state.last ? html`<div class="round-events">${state.logs.filter(l => l.day === state.day && l.time === state.clock && ['event', 'crowd', 'talent', 'heart'].includes(l.type)).slice(0, 4).map(l => html`<p>${icon('sparkles')}${esc(l.text.replace('的鬼歌手元，','的手元，').replace('；这次没有刷到适合自己的手元。','。'))}</p>`)}</div>` : ''}${canSelect?html`<div class="small-heading">本轮自选 ${G.selectCount(state)} 首<span>${state.mode === 'pair' ? '拼机伙伴选择剩余曲目，两人同时游玩' : '单人三首 · 可重复选同一首'}</span></div><div class="selection-slots">${Array.from({
          length: G.selectCount(state)
        }, (_, i) => html`<button class="secondary-btn" data-action="picker" data-value="${i}">${icon('disc-3')}第 ${i + 1} 首 · ${esc(picked[i]?.title || recommendations[i]?.title || '选择曲目')}</button>`)}</div>${state.mode==='solo'?html`<div class="supply-actions">${(picked.length?picked:recommendations).map((c,i)=>html`<button class="secondary-btn" data-action="repeat-song" data-value="${i}" aria-label="本轮连打三首 ${esc(c.title)}">连打第 ${i+1} 首 ×3</button>`)}</div>`:''}${rows(picked.length ? picked : recommendations)}${LifeUI.partnerChoices(state, pool)}<div class="modal-actions"><button class="secondary-btn" data-action="picker">${icon('list-music')}自选曲目</button><button class="secondary-btn" data-action="reroll" title="换一组">${icon('shuffle')}换一组</button><button class="primary-btn" data-action="play" ?disabled=${reason}>${icon('play')}${G.allNight(state)?'开始游玩 · 已计时':`投币上机 · ¥${G.pcPrice(state)}`}</button></div>${reason ? html`<p class="warning">${reason}</p>` : ''}`:html`<p class="queue-notice">本轮已结束或正在排队，轮到上机后再选择下一轮曲目。</p>${state.queueUntil<=state.clock?html`<button class="primary-btn" data-action="next-round">下一轮上机 · 开始选曲</button>`:''}`}<button class="finish-btn" data-action="finish">结束上机，去吃饭 ${icon('arrow-right')}</button>`, true);
      }
      if (state.phase === 'meal') content = frame('下机了，好好吃顿饭', `${G.time(state.clock)} · 回程 ${state.trip.returnTime} 分钟`, html`${steps(2)}<div class="outing-summary"><div><small>本次上机</small><b>${state.trip.rounds}<span> 轮</span></b></div><div><small>Rating 提升</small><b>+${state.rating - state.trip.ratingBefore}</b></div><div><small>已花费</small><b>¥${state.trip.cost}</b></div></div><div class="mode-select" aria-label="饭后去向">${[['home',`吃完回${G.residence(state)}`],['arcade','吃完回机厅继续打']].map(([id,label])=>html`<button class="${mealDestination===id?'selected':''}" aria-pressed=${mealDestination===id} data-action="meal-destination" data-value="${id}">${label}</button>`)}</div>${options(G.mealOptions(state).filter(m=>mealDestination!=='arcade'||m.id!=='home'), 'meal')}<button class="secondary-btn" data-action="resume-play" ?disabled=${!!G.returnToPlayReason(state)}>先不吃，返回机厅继续打</button>${mealDestination==='home'&&G.canSkipMeal(state) ? html`<button class="secondary-btn" data-action="meal" data-value="skip">不吃饭，直接回${G.residence(state)}</button>` : ''}<p class="form-note">选择回机厅：附近用餐另计往返步行 10 分钟，回店后重新排队；仍须在闭店或固定日程前结束。回${G.residence(state)}后也可再次出勤。基础餐食包含在每日 ¥${G.JOBS[state.job].daily} 生活开销内。</p>`);
    }
    if (modal === 'picker') content = frame(`自选曲目 · ${G.MODES[state.mode].name}`, `选择第 ${pickSlot + 1} 首 / 共 ${G.selectCount(state)} 首`, html`${filters()}<div class="picker-list" id="song-results">${libraryResults()}</div><div class="modal-actions"><span id="pick-count">${picked[pickSlot] ? esc(picked[pickSlot].title) : '本首尚未选择'}</span><button class="primary-btn" data-action="picked">${icon('check')}确认选曲</button></div>`, true);
    if(modal==='city-encounter') content=frame('街角的偶遇','广州 · 小凛',html`<p class="event-text">小凛拎着舞萌手套朝你挥了挥手：“你也来这边逛呀？”</p><div class="modal-actions"><button class="primary-btn" data-action="city-answer" data-value="0">聊聊舞萌，加个好友</button><button class="secondary-btn" data-action="city-answer" data-value="1">点头招呼，下次再聊</button></div><p class="form-note">交谈 10 分钟</p>`,false,false);
    if (modal === 'entertain') content = frame('娱乐', `${G.time(state.clock)} · 心情 ${state.mood}/100`, html`<div class="option-grid"><button class="option" data-action="daily" data-value="fun" ?disabled=${state.money < 35}>${icon('popcorn')}<div><b>和朋友出去玩</b><small>2 小时 · 心情 +26</small></div><span>¥35</span></button><button class="option" data-action="watch-videos">${icon('clapperboard')}<div><b>刷视频</b><small>30 分钟 · 心情 +7</small></div><span>免费</span></button>${G.availableOutings(state).map(x=>html`<button class="option" data-action="explore" data-value="${x.id}" ?disabled=${state.money<x.cost||state.stamina<x.stamina||!G.canSpendTime(state,x.time)}>${icon(x.icon)}<div><b>${x.name}</b><small>${G.homeText(state,x.place)} · ${x.time} 分钟 · 心情 +${x.mood}${x.stamina?` · 体力 -${x.stamina}`:''}</small></div><span>${x.cost?`¥${x.cost}`:'免费'}</span></button>`)}</div>`);
    if (modal === 'teacher') content = frame('老师约谈', 'ACADEMIC WARNING', html`<p class="event-text">“你最近的课程已经跟不上了。请尽快把落下的内容补上。”</p><div class="warning">挂科第 ${state.day - state.school.since + 1}/10 天 · 本次是第 ${state.school.talks + 1}/3 次约谈。<br>补习或上课将学力恢复到 20，可解除挂科；连续挂科 10 天或第 3 次约谈将进入肄业结局。</div><div class="modal-actions"><button class="primary-btn" data-action="teacher">${icon('book-open')}回应老师</button></div>`, false, false);
    if (modal === 'skip') {
      const c = G.nextObligation(state),
        major = c?.kind === 'major';
      content = frame(`逃课：${c?.name || ''}`, 'CLASS ATTENDANCE', html`<p class="event-text">${major ? '专业课：75% 概率被抓，学力 -12；被抓额外 -5，心情 -10。' : '水课：35% 概率被抓，学力 -4；被抓额外 -2，心情 -5。'}</p><p class="form-note">逃课不会消耗该节课的时间。学力归零将进入挂科状态。</p><div class="modal-actions"><button class="secondary-btn" data-action="close">再想想</button><button class="primary-btn" data-action="skip" data-value="${c?.id}">${icon('door-open')}确认逃课</button></div>`);
    }
    if (modal === 'timetable') content = frame('本周课表', 'MONDAY — FRIDAY', html`<div class="week-schedule">${[1, 2, 3, 4, 5].map(d => html`<div><b>周${'日一二三四五六'[d]}</b>${G.schedule(state, d).map(c => html`<p><span>${G.time(c.start)}–${G.time(c.end)}</span><b>${c.name}</b><small>${c.kind === 'major' ? '专业课' : '水课'}</small></p>`)}</div>`)}</div>`, true);
    if (modal === 'event') {
      const e = G.EVENTS[state.event];
      content = frame(e.title, `小凛 · ${state.event + 1}/${G.EVENTS.length}`, html`<div class="event-art"><div class="character"><span class="hair"></span><span class="face"></span><span class="eye left"></span><span class="eye right"></span><span class="bow left"></span><span class="bow right"></span><span class="dress"></span></div><div><small>机厅里的另一段旋律</small><b>小凛</b></div></div><p class="event-text">${e.text}</p><div class="event-choices">${e.options.map((o, i) => html`<button class="option" data-action="answer" data-value="${i}"><b>${o}</b>${icon('arrow-right')}</button>`)}</div>`, false, false);
    }
    if (modal === 'ending') {
      const endings = {
        good: ['GOOD ENDING', '化身龙 b', '从第一枚游戏币，到 16,000 Rating。今天起，你也是别人眼里的大佬了。', 'trophy'],
        love: ['LOVE ENDING', '下一次，也一起出勤。', '你收获了分数，也收获了那个愿意等你下机的人。', 'heart-handshake'],
        broke: ['BAD ENDING', '最后一枚游戏币', '钱包耗尽，这段出勤旅程暂时画上句号。', 'wallet'],
        burnout: ['BAD ENDING', '热爱也需要休息', '心情耗尽。下一次，记得好好照顾自己。', 'cloud-rain'],
        ordinary: ['NORMAL ENDING', '春季篇，完结', '6 月结束了。那些下课后的奔跑、下班后的出发，都成为了你的故事。', 'sunset'],
        rent: ['BAD ENDING', '没有凑齐的房租', '25 日已经到来，你没能在截止日期前准备足够的房租。', 'house'],
        dropout: ['BAD ENDING', '肄业通知', '第三次老师约谈，或连续十天未解除挂科。这个学期以肄业告终。', 'graduation-cap']
      };
      const [tag, title, desc, ic] = endings[state.ending];
      content = frame(title, tag, html`<div class="ending-art ${state.ending}">${icon(ic)}</div><p class="event-text">${desc}</p><div class="outing-summary"><div><small>日期</small><b class="ending-date">${G.dateISO(state)}</b></div><div><small>Rating</small><b>${state.rating}</b></div><div><small>出勤次数</small><b>${state.visits}</b></div></div><div class="modal-actions"><button class="secondary-btn" data-action="export">${icon('download')}导出存档</button><button class="primary-btn" data-action="restart">${icon('rotate-ccw')}开启新故事</button></div>`, false, false);
    }
    if (modal === 'settings') content = frame('存档与设置', `${G.dateLabel(state)} · ${G.time(state.clock)}`, html`<div class="settings-buttons"><button class="secondary-btn" data-action="export">${icon('download')}导出存档</button><label class="secondary-btn">${icon('upload')}导入存档<input id="import-save" type="file" accept=".json,application/json" hidden></label><button class="secondary-btn" data-action="restart">${icon('rotate-ccw')}重新开始</button>${oldAvailable ? html`<button class="secondary-btn" data-action="legacy">迁移旧版存档</button>` : ''}</div><p class="form-note">新版独立保存。旧版存档仍保留，迁移时保留余额、成绩和关系，返回对应日期 08:00。</p>`);
    if (modal === 'restart') content = frame('开始新的故事？', 'NEW STORY', html`<p class="event-text">当前新版进度会被替换，可以先导出存档。</p><div class="modal-actions"><button class="secondary-btn" data-action="export">${icon('download')}导出存档</button><button class="primary-btn" data-action="confirm-restart">${icon('rotate-ccw')}确认重新开始</button></div>`);
    if (modal === 'about') content = frame('规则与来源', '2026 SPRING', html`<div class="about-copy"><h3>2026 年 3 月 1 日至 6 月 30 日</h3><p>共 122 天，每天 24 小时。完整睡眠至少 8 小时，夜间最早 08:00 起床，小睡 30 分钟，行动消耗分钟；机厅 10:00 开门、23:30 结束游玩。吃饭、回程均耗时，午夜结算当天收支。上班日为周一至周五 09:00–18:00；学生按每周课表上课。</p><h3>经济与学业</h3><p>开局资金：学生 ¥1800、挂壁 ¥1800、上班族 ¥6000。每月 1 日学生生活费 ¥1800、上班族工资 ¥6000 入账，开局已含 3 月资金。每日基础开销分别为 ¥35 / ¥25 / ¥65。挂壁房租 ¥600，上班族 ¥1800，25 日零点检查并缴纳。上班族不可打工。</p><p>水课被抓概率 35%，专业课 75%。学力归零进入挂科并触发约谈；恢复到 20 解除。第三次约谈或连续挂科 10 天进入肄业结局。</p><h3>分数与底力</h3><p>达成率上限 101.0000%，Rating 仅计算到 100.5%。旧版本最佳 35 张 + 新版本最佳 15 张。同谱面初见有 -0.55 个百分点的预期修正，重复游玩逐步增加熟练度；实际成绩还受底力、心情、饮品、疲劳与判定波动影响。</p><p>FC：没有 MISS；FC+：没有 GOOD / MISS；AP：没有 GREAT / GOOD / MISS。成绩与徽章由模拟判定统计产生，不是通过百分比直接指定。判定分布是本作模拟，非官方谱面重放。</p><p>星星 / 键盘优先采用 ChiffonMai 同源 DXRating 社区标签，未标注谱面按音符占比估算。海底谭 MASTER 保留人工校正。对应底力影响达成率，也会获得更多成长。单开三首，拼机通常双方各选两首、同步游玩四首；玩家可单独选择拼机伙伴选曲的难度。两人一组计算排队，普通机厅每人 ¥6；猫窝每人 ¥30 / 小时，预付首小时，续时按整小时收费，PC 和段位不另计费。</p><h3>午夜与宴曲</h3><p>午夜自动跨日并结算生活开销、工资和房租。挂壁和上班族可在凌晨回家后继续活动，不再限制凌晨 04:00 入睡。清醒行动每小时增加 6.25 点困意，连续清醒 16 小时到满，超过 60 开始影响成绩，达到 100 终止行动并回家休息至少 8 小时（夜间最早 08:00 起床）；睡眠覆盖课程或班次记为旷课、旷工。00:00–06:00 不能打工，学生仍需午夜前回宿舍。</p><p>名称以方括号标签开头的曲目统一作为宴曲：不自动推荐、不参与 B50，手动游玩保留达成率但 Rating 为 0。</p><h3>三餐与饮料</h3><p>早餐 06:00–11:00、午餐 11:00–17:00、晚餐 17:00–24:00 各记一次；在住处或准备出门时，08:00 / 12:00 / 18:00 后首次操作提醒选饭。上班、长课程中途可午休吃饭。学生回宿舍，可选美团拼好饭 ¥12。基础餐食包含在每日开销中；萨莉亚 ¥25 / 心情 +18，KFC 平日 ¥50、周四 ¥29.9。</p><p>连续漏餐 3 天后，每个漏餐日最大体力 -2，下限 70；连续 3 天吃齐三餐并出门活动，最大体力 +1，上限 120（体力过人为 130）。最多带 3 瓶饮料，大水最多 2 瓶：大水 1L / ¥5，乌龙茶 500ml / ¥5，冰美式 200ml / ¥9.9，魔爪 300ml / ¥10；认识小凛后解锁粉色魔爪 300ml / ¥12，状态与心情加成更高。可以切换正在喝的饮料，喝完自动开下一瓶，剩余饮料会随身保留。</p><h3>体力与成长</h3><p>手套每曲磨损，耐久不足一轮时须更换。每曲消耗体力与 60 ml 饮料；体力低于 55 逐渐减分，饮料耗尽额外减分。难度与物量越高消耗越快。等待每分钟恢复 0.35，吃饭恢复 30–60；家或宿舍内小睡 30 分钟恢复 20 体力、降低 15 困意；普通娱乐不回体。非饭点且本次消耗较少可直接返回住处。状态每日结合心情随机决定，读谱力修正初见与复打表现。鬼歌以拟合定数计算表现、初见额外 -0.45%，成长 ×1.3；吃分预期 +0.16%，成长 ×0.7。刷视频可能学到鬼歌手元：大彻大悟降低该谱面计算难度，似懂非懂免除额外初见惩罚。词条依据本地 maimai-talent-tags.md。</p><p>推荐会搭配适合当前底力与稍高难度的曲目，“换一组”避开当前歌曲。定数略高于分类底力的谱面获得更多成长，差距过大则降低成长效率。越级按游玩前 Rating、官方标级与成绩不高于 97% 判断：低于 11,000 对应 11+，11,000 对应 12，12,000 对应 13+，13,000 对应 14，14,000 及以上对应 14+。</p><h3>群聊与广州闲逛</h3><p>群聊输入 @bot 查看快捷指令；运势每天固定，塔罗每次 2–3 分钟。B50 与人数查询每天各首次免费，之后每次 2 分钟。闲逛及游览广州景点消耗体力、恢复心情，可能遇到小凛、发现新机厅或餐馆；发现的店铺会永久加入选项。</p><h3>名牌与拟合</h3><p>版本名牌参考公开查分器规则：极为全 BASIC–MASTER FC，将为全 SSS，神为全 AP。曲目范围与难度要求按落雪收藏品 API 核验；舞系包含指定 Re:MASTER。真系没有“真将”。收录 71 块极 / 将 / 神名牌，另有签到、区域装饰和称号。区域装饰以选定区域累计 10 PC 解锁，每日首次上机后自动签到，增加 2 点进度；已移除要求觉醒的称号；移动距离称号按实际往返机厅的公里数累计。舞舞牌按同步最佳成绩逐谱面解锁。收藏与上机页可进入模拟段位及友人对战。</p><p>拟合数据来自水鱼 chart_stats，落雪公开曲库用于交叉核对官方定数。样本至少 100、两站定数一致且拟合差值绝对值 ≥0.3 才打标签。未获得落雪公开拟合数据，因此不是两站拟合共识。数据快照 2026-09-14。</p><h3>素材与数据</h3><p>非官方同人游戏。${songs.length} 首曲目与定数来自 <a href="https://www.diving-fish.com/api/maimaidxprober/music_data" target="_blank" rel="noreferrer">水鱼公开曲库</a>（2026-09-14 快照）。版本按落雪国服曲库映射为舞萌DX 2020–2026，B50 按国服引入版本分组，与故事月份独立。</p><p>曲绘来自水鱼 covers 公开图片服务，名牌与分数框来自 <a href="https://github.com/Yuri-YuzuChaN/maimaiDX" target="_blank" rel="noreferrer">maimaiDX</a> 的 CN1.55 公开素材包，本作现用国服“舞萌 DX”标识适配框，非原始官方框截图；扩充的名牌图案与称号条件来自落雪公共服务；社区技术标签来源经 <a href="https://github.com/ChiffonOwO/ChiffonMai" target="_blank" rel="noreferrer">ChiffonMai</a> 核对。相关版权归原权利人。无官方音源。图标使用 Lucide。</p></div>`);
    if (modal?.startsWith('chart:')) {
      const c = catalog.get(modal.slice(6)),
        r = state.records[G.key(c)];
      content = frame(c.title, `${c.type === 'DX' ? 'DX' : '标准'} · ${c.version}`, html`${rows([c])}<div class="chart-details"><div><b>${names[c.index]} ${c.ds}</b>${badge(c)}</div><p>${esc(c.classification)} · 星星权重 ${Math.round(c.starWeight * 100)}% · 键盘权重 ${Math.round((1 - c.starWeight) * 100)}%</p><p>已游玩 ${state.practice[G.key(c)] || 0} 次 · ${r ? `${r.achievement.toFixed(4)}% ${G.rank(r.achievement)} ${r.combo || ''}` : '暂无成绩'}</p>${Number.isFinite(c.fit) ? html`<p>水鱼拟合 ${c.fit.toFixed(3)} · 官方 ${c.ds} · 差值 ${(c.fit - c.ds).toFixed(3)}<br>样本 ${c.samples} · 落雪定数 ${c.comparison ?? '未收录'}<br>样本 ≥100 且定数一致时，差值 ≥0.3 为鬼歌，≤-0.3 为吃分推荐；BASIC 和定数 <10 不标记，ADVANCED 不标吃分。</p>` : html`<p>暂无拟合数据，不添加难度推荐标签。</p>`}<p>TAP ${c.notes[0]} · HOLD ${c.notes[1]} · SLIDE ${c.notes[2]} · TOUCH ${c.notes[3]} · BREAK ${c.notes[4]}</p></div>`);
    }
    const activeElement = document.activeElement;
    const modalKey = modal==='trip' ? modal+':'+state.phase : modal;
    const previousDialog = root.querySelector('.modal');
    if(renderedModal && previousDialog) modalScroll.set(renderedModal, previousDialog.scrollTop);
    mount(content, root);
    if(forceModalTop||renderedModal!==modalKey) root.querySelector('.modal')?.scrollTo(0,forceModalTop?0:modalScroll.get(modalKey)||0);
    forceModalTop=false;
    renderedModal=modalKey;
    icons();
    // Keep an existing control focused during incremental updates, including IME input.
    if (!root.contains(activeElement) || document.activeElement !== activeElement) {
      root.querySelector('.modal')?.focus({ preventScroll: true });
    }
    if (modal === 'chat') {
      const chat = $('.chat-window');
      chat.scrollTop = chat.scrollHeight;
    }
  }
  function recommend(exclude = []) {
    if(state.phase==='play'&&(state.queueUntil>state.clock||state.roundReview)){recommendations=[];return;}
    recommendations = G.recommend(state, pool, G.selectCount(state), exclude);
    if (state.phase === 'play') G.preparePartner(state, pool);
  }
  function exportSave() {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
        type: 'application/json'
      }),
      url = URL.createObjectURL(blob),
      a = document.createElement('a');
    a.href = url;
    a.download = `出勤模拟器-${G.dateISO(state)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function loadSave(s) {
    s = G.migrate(s);
    if (!G.validate(s)) throw Error('这不是有效存档。');
    state = s;
    seenForcedSleeps=state.forcedSleeps;
    introReplay=false;
    G.recalculate(state);
    G.check(state);
    modal = null;
    picked=(state.selectedCharts||[]).map(k=>catalog.get(k)).filter(Boolean);
    recommend();
    save();
  }
  function act(a, v) {
    switch (a) {
      case 'sleep-menu':modal='sleep';break;
      case 'daily-meal':mealReturn=null;modal='daily-meal';break;
      case 'eat-home':G.eatHome(state,v);modal=mealReturn;mealReturn=null;break;
      case 'meal-later':{const i=G.mealDue(state);if(i>=0&&!state.nutrition.dismissed.includes(i))state.nutrition.dismissed.push(i);modal=mealReturn;mealReturn=null;break;}
      case 'pack-drink':G.packDrink(state,v);break;
      case 'use-bottle':G.useBottle(state,Number(v));break;
      case 'drinks-ready':G.finishDrinks(state);recommend();break;
      case 'sleep-now':G.sleep(state,v);modal=null;break;
      case 'intro-skip':state.guide.introDone=true;introReplay=false;modal=null;break;
      case 'intro-next':if(state.guide.step<2)state.guide.step++;else{state.guide.introDone=true;introReplay=false;modal=null;}forceModalTop=true;break;
      case 'intro-back':state.guide.step=Math.max(0,state.guide.step-1);forceModalTop=true;break;
      case 'intro-replay':state.guide.step=0;introReplay=true;modal='chat';break;
      case 'guide':modal='guide';break;
      case 'goal-claim':G.claimGoal(state,v);break;
      case 'goal-go':modal=null;act(v);break;
      case 'avatar-page':avatarPage=Math.max(0,Math.min(Math.ceil(window.AVATARS.length/24)-1,avatarPage+Number(v)));forceModalTop=true;break;
      case 'next-round':if(state.queueUntil>state.clock)throw Error('请先等待轮到上机。');state.roundReview=false;recommend();forceModalTop=true;break;
      case 'nav':
        view = v;
        modal = null;
        page = 0;
        break;
      case 'chat':
        G.chatOpen(state);G.syncFriends(state);conversation='group';conversationList=innerWidth<=600;
        modal = 'chat';
        break;
      case 'plates':
      case 'talents':
      case 'avatar':
      case 'relationship':
        modal = a;
        break;
      case 'supplies':supplyReturn=modal==='course-preview'?'course-preview':'trip';modal='supplies';break;
      case 'collection-status':
        collectionStatus = v;
        collectionPage = 0;
        break;
      case 'collection-tab':
        collectionTab = v;
        collectionSearch = '';
        collectionPage = 0;
        break;
      case 'collection-page':
        collectionPage = Math.max(0, collectionPage + Number(v));
        break;
      case 'collection-target':
        G.collectionTarget(state, v);
        break;
      case 'equip-collection':
        G.equipCollection(state, v, pool);
        break;
      case 'original-avatar':
        state.profile.avatar = window.AVATARS.find(x=>x.id===Number(v))?.src || null;
        break;
      case 'love-contact':
        G.contactLove(state,v);
        break;
      case 'reset-avatar':
        state.profile.avatar = null;
        break;
      case 'equip-plate':
        {
          const p = G.plates(state, pool).find(p => p.id === v);
          if (!p?.unlocked) throw Error('名牌尚未解锁。');
          state.profile.plate = v;
          break;
        }
      case 'queue':
        G.waitQueue(state);
        if(state.queueUntil<=state.clock)state.roundReview=false;
        recommend();forceModalTop=true;
        break;
      case 'chat-image':modal='b50chat:'+v;break;
      case 'conversation':conversation=v;conversationList=false;forceModalTop=true;break;
      case 'conversation-list':conversationList=true;break;
      case 'atlas':modal='atlas';break;
      case 'atlas-tab':atlasTab=v;break;
      case 'quests':modal='quests';break;
      case 'quest':G.doQuest(state,v);modal=state.world.notice?'world-event':'quests';break;
      case 'world-ack':state.world.notice=null;modal=null;break;
      case 'mahjong':G.startMahjong(state);startTable(state.profile.name,()=>renderModal(),result=>{G.finishMahjong(state,result);save();});modal='mahjong';break;
      case 'mahjong-choice':chooseMahjong(Number(v));break;
      case 'mahjong-help':autoMahjong();break;
      case 'mahjong-leave':abandonMahjong();state.world.mahjong.active=null;state.world.mahjong.last={text:'中途离桌，本局未计入支线进度。',scores:[]};G.log(state,'从猫窝麻将桌中途离开，本局未计入支线进度。','heart');modal='trip';break;
      case 'mahjong-return':abandonMahjong();modal=state.world.notice?'world-event':'trip';break;
      case 'best-style':
        bestStyle = v;
        break;
      case 'download-b50':
        B50Image.generate(G.b50Snapshot(state)).then(src => {
          const a = document.createElement('a');
          a.href = src;
          a.download = '出勤模拟器-B50.png';
          a.click();
        });
        break;
      case 'ranks':modal='ranks';break;
      case 'course':courseLevel=Number(v);G.courseCharts(courseLevel,pool);modal='course-preview';break;
      case 'course-start':G.runCourse(state,courseLevel,pool);picked=[];state.roundReview=true;recommend();forceModalTop=true;modal='course-result';break;
      case 'battle':state.competition.battle=!state.competition.battle;break;
      case 'explore':G.explore(state,v);modal=state.city.encounter?'city-encounter':state.world.notice?'world-event':null;break;
      case 'city-answer':G.answerEncounter(state,Number(v));modal=null;break;
      case 'watch-videos':
        G.watchVideos(state);
        modal = state.videoEvent ? 'video' : null;
        break;
      case 'learn-video':
        G.learnVideo(state);
        modal = null;
        break;
      case 'buy-gloves':
        G.buyGloves(state, v);
        toast('手套已更换');
        break;
      case 'refill':
        G.refill(state, v);
        modal = state.phase==='play'?'supplies':null;
        break;
      case 'phone':
      case 'settings':
      case 'about':
      case 'timetable':
        modal = a;
        break;
      case 'sound':
        sound = !sound;
        beep();
        break;
      case 'close':
        introReplay=false;
        modal = modal==='atlas'||modal==='quests'?'chat':modal==='supplies'&&state.phase==='play'?supplyReturn:modal==='course-preview'?'ranks':modal?.startsWith('b50chat:')?'chat':modal === 'picker' || ['supplies','ranks','course-result'].includes(modal) && state.phase === 'play' ? 'trip' : null;
        break;
      case 'attend':
        if (state.phase === 'home') G.startTrip(state);
        modal = 'trip';
        if (state.phase === 'play') recommend();
        break;
      case 'arcade':
        if (state.phase === 'travel') state.arcade = Number(v);
        break;
      case 'mode':
        G.setMode(state, v);
        picked = [];
        recommend();
        break;
      case 'cancel-trip':
        if (state.phase === 'travel') {
          state.phase = 'home';
          modal = null;
        }
        break;
      case 'travel':
        G.travel(state, v, state.arcade);
        break;
      case 'drink':
        G.drink(state, v);
        picked = [];
        recommend();
        break;
      case 'play':
        G.play(state, picked.length ? picked : recommendations, pool);
        state.roundReview=true;forceModalTop=true;
        picked = [];
        recommend();
        break;
      case 'reroll': {
        const previous=picked.length?picked:recommendations;
        picked=[];recommend(previous);break;
      }
      case 'picker':
        if(state.queueUntil>state.clock||state.roundReview)throw Error('轮到上机后再选曲。');
        pickSlot = Number(v) || 0;
        modal = 'picker';
        page = 0;
        search = '';
        difficulty = 'all';
        typeFilter = 'all';
        eraFilter = 'all';
        genreFilter = 'all';
        patternFilter = 'all';
        utageFilter = 'exclude';
        break;
      case 'repeat-song': {
        if(state.phase!=='play'||state.mode!=='solo'||state.queueUntil>state.clock||state.roundReview)throw Error('单开轮到上机后才能设置连打。');
        const song=(picked.length?picked:recommendations)[Number(v)];
        if(!song||!catalog.has(G.key(song)))throw Error('请先选择曲目。');
        picked=Array(G.selectCount(state)).fill(song);
        modal='trip';break;
      }
      case 'pick':
        {
          if (!catalog.has(v)) throw Error('谱面不存在。');
          if (!picked.length) picked = [...recommendations];
          picked[pickSlot] = catalog.get(v);
          modal = 'trip';
          break;
        }
      case 'picked':
        if (!picked.length) throw Error('至少选择一张谱面。');
        modal = 'trip';
        break;
      case 'finish':
        mealDestination='home';
        G.finishPlay(state);
        break;
      case 'answer':
        G.answer(state, Number(v));
        modal = 'trip';
        break;
      case 'meal-destination':mealDestination=v;break;
      case 'resume-play':G.meal(state,'skip','arcade');recommend();modal='trip';break;
      case 'meal':
        G.meal(state,v,mealDestination);
        if(state.phase==='play'){recommend();modal='trip';toast('已回到机厅，按当前人数重新排队。');}
        else{modal=null;if(!state.ending)toast(G.homeText(state,'已经到家，可以继续安排今天。'));}
        break;
      case 'entertain':
        modal = 'entertain';
        break;
      case 'daily':
        G.daily(state, v);
        modal = null;
        toast(state.logs[0].text);
        break;
      case 'class':
        G.resolveClass(state, v, true);
        break;
      case 'skip-dialog':
        modal = 'skip';
        break;
      case 'skip':
        G.resolveClass(state, v, false);
        modal = null;
        break;
      case 'teacher':
        G.teacher(state);
        modal = null;
        break;
      case 'chart-detail':
        modal = `chart:${v}`;
        break;
      case 'page':
        page = Math.max(0, page + Number(v));
        break;
      case 'export':
        exportSave();
        break;
      case 'legacy':
        loadSave(JSON.parse(localStorage.getItem(OLD)));
        toast('旧存档已迁移，原存档仍保留。');
        break;
      case 'restart':
        modal = 'restart';
        break;
      case 'confirm-restart':
        if (state.ending) {
          run++;
          try {
            localStorage.setItem('attendance-run', String(run));
          } catch {}
        }
        state = G.create();
        draft = {
          name: '',
          id: '',
          job: 'student',
          playStyle: 'outer', talent: ''
        };
        offers = G.drawTalents(state, run);
        saveDraft();
        view = 'home';
        modal = null;
        picked = [];
        recommendations = [];
        break;
    }
  }
  document.addEventListener('click', event => {
    const b = event.target.closest('[data-action]');
    if (!b || b.disabled) return;
    event.preventDefault();
    try {
      beep();
      act(b.dataset.action, b.dataset.value);
      save();
      render();
    } catch (e) {
      toast(e.message);
    }
  });
  document.addEventListener('submit', e => {
    if (!['setup-form', 'chat-form'].includes(e.target.id)) return;
    e.preventDefault();
    try {
      if (e.target.id === 'setup-form') {
        state = G.create(draft.job);
        G.setup(state, {
          name: draft.name,
          id: draft.id,
          talent: draft.talent,
          offers,
          playStyle: draft.playStyle||'outer'
        });
      } else {
        conversation==='group'?G.chatSend(state, $('#chat-message').value):G.sendDM(state,conversation,$('#chat-message').value);
        $('#chat-message').value = '';
      }
      save();
      render();
    } catch (error) {
      toast(error.message);
    }
  });
  const composingInputs = new WeakSet();
  document.addEventListener('compositionstart', e => composingInputs.add(e.target));
  document.addEventListener('compositionend', e => {
    composingInputs.delete(e.target);
    updateInput(e);
  });
  function updateInput(e) {
    if (e.isComposing || composingInputs.has(e.target)) return;
    if (e.target.id === 'collection-search') {
      if (collectionSearch === e.target.value) return;
      collectionSearch = e.target.value;
      collectionPage = 0;
      renderModal();
    }
    if (['player-name', 'player-id'].includes(e.target.id)) {
      draft[e.target.id === 'player-name' ? 'name' : 'id'] = e.target.value;
      saveDraft();
    }
    if (e.target.id === 'song-search') {
      if (search === e.target.value) return;
      search = e.target.value;
      page = 0;
      render();
      icons();
    }
  }
  document.addEventListener('input', updateInput);
  document.addEventListener('change', async e => {
    if (e.target.dataset.partnerSlot !== undefined) {
      try {
        G.setPartnerDifficulty(state, Number(e.target.dataset.partnerSlot), Number(e.target.value), pool);
        save();
        render();
      } catch (error) {
        toast(error.message);
      }
      return;
    }
    if (e.target.id === 'avatar-upload') {
      try {
        const file = e.target.files[0];
        if (!file) return;
        if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 5e6) throw Error('请选择小于 5 MB 的 PNG、JPEG 或 WebP 图片。');
        const bitmap = await createImageBitmap(file),
          size = Math.min(bitmap.width, bitmap.height),
          canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        canvas.getContext('2d').drawImage(bitmap, (bitmap.width - size) / 2, (bitmap.height - size) / 2, size, size, 0, 0, 256, 256);
        bitmap.close();
        state.profile.avatar = canvas.toDataURL('image/jpeg', .9);
        save();
        render();
        toast('头像已更新');
      } catch (error) {
        toast(error.message);
      }
      return;
    }
    if (['career','talent','play-style'].includes(e.target.name)) {
      draft[e.target.name === 'career' ? 'job' : e.target.name==='play-style'?'playStyle':'talent'] = e.target.value;
      saveDraft();
    }
    if (e.target.id === 'instinct') {
      state.instinct = e.target.checked;
      save();
    }
    if (['difficulty', 'song-type', 'song-era', 'song-genre', 'song-pattern', 'song-utage'].includes(e.target.id)) {
      if (e.target.id === 'difficulty') difficulty = e.target.value;else if (e.target.id === 'song-type') typeFilter = e.target.value;else if (e.target.id === 'song-era') eraFilter = e.target.value;else if (e.target.id === 'song-genre') genreFilter = e.target.value;else if (e.target.id === 'song-pattern') patternFilter = e.target.value;else utageFilter = e.target.value;
      page = 0;
      render();
      icons();
    }
    if (e.target.id === 'import-save') {
      try {
        const f = e.target.files[0];
        if (!f) return;
        if (f.size > 10e6) throw Error('文件过大。');
        loadSave(JSON.parse(await f.text()));
        render();
        toast('存档已恢复');
      } catch (error) {
        toast(`导入失败：${error.message}`);
      }
    }
  });
  document.addEventListener('error', e => {
    const img = e.target;
    if (!(img instanceof HTMLImageElement) || !img.dataset.cover) return;
    if (!img.dataset.fallback) {
      img.dataset.fallback = '1';
      img.src = `https://www.diving-fish.com/covers/${String(Number(img.dataset.cover)).padStart(5, '0')}.png`;
    } else {
      img.classList.add('unavailable');
      img.alt = '曲绘暂不可用';
    }
  }, true);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal && !['event', 'ending', 'teacher', 'video', 'city-encounter'].includes(modal)) {
      act('close');
      render();
    }
    if (e.key === 'Tab' && modal) {
      const f = [...document.querySelectorAll('.modal button:not([disabled]),.modal select,.modal input:not([hidden]),.modal a[href]')],
        first = f[0],
        last = f.at(-1);
      if (!first) return;
      if (e.shiftKey && (document.activeElement === first || !$('.modal').contains(document.activeElement))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !$('.modal').contains(document.activeElement))) {
        e.preventDefault();
        first.focus();
      }
    }
  });
  if (state.phase === 'play') {
    recommend();
    save();
  }
  render();
})();
