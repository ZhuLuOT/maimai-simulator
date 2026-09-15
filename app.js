import {esc,icon} from './src/ui.js';
import { html, render as mount } from 'lit';
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
  const names = ['BASIC', 'ADVANCED', 'EXPERT', 'MASTER', 'Re:MASTER'],
    arcades = ['星光游艺 · 大学城店', '街角电玩 · 老街店', '次元空间 · 商场店'];
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
  picked=(state.selectedCharts||[]).map(k=>catalog.get(k)).filter(Boolean);
  let run = 1,
    draft = {
      name: '',
      id: '',
      job: 'student',
      talent: ''
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
      <main><div class="date-toolbar"><div class="calendar-date">${icon('calendar-days')}<b>${G.dateLabel(state)}</b><span>第 ${state.day} / ${G.DAYS} 天</span></div><div class="clock-display">${icon('clock-3')}<b class="${state.nightActive ? 'late-hours' : ''}">${G.time(state.clock)}</b><span>${state.nightActive ? '尚未入睡 · 最晚 04:00' : next ? `${next.name} ${G.time(next.start)}` : '今日无剩余日程'}</span></div></div>
      ${LifeUI.player(state)}
      ${view === 'home' ? home() : view === 'library' ? library() : view === 'best' ? bestView() : journal()}
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
      return html`<div class="schedule-row ${done ? 'done' : ''}"><span class="schedule-time">${G.time(c.start)}<small>${G.time(c.end)}</small></span><div><b>${c.name}</b><small>${c.kind === 'major' ? '专业课 · 学力 +5 / 心情 -7' : c.kind === 'general' ? '水课 · 学力 +2 / 心情 -3' : '固定工作 · 心情 -15'}${state.absences.includes(c.id) ? ' · 旷课 / 旷工' : done ? ' · 已处理' : ''}</small></div><div class="schedule-buttons">${!done ? html`<button class="secondary-btn" data-action="class" data-value="${c.id}" ?disabled=${busy || state.nightActive || c.id !== next?.id}>${icon(c.kind === 'shift' ? 'briefcase-business' : 'book-open')}${c.kind === 'shift' ? '上班' : '上课'}</button>${c.kind !== 'shift' ? html`<button class="icon-btn" data-action="skip-dialog" data-value="${c.id}" ?disabled=${busy || state.nightActive || c.id !== next?.id} title="逃课" aria-label="逃课 ${c.name}">${icon('door-open')}</button>` : ''}` : icon('circle-check')}</div></div>`;
    }) : html`<div class="free-day">${icon('sun')}<div><b>${state.job === 'student' ? '今日无课' : '今天没有固定日程'}</b><span>机厅 10:00 开门，23:30 结束游玩</span></div></div>`}</div>
    ${state.job === 'student' ? html`<div class="academic-line ${school.failing ? 'warning' : ''}"><span>${icon('graduation-cap')}学力 <b>${school.academic}/100</b></span><span>约谈 ${school.talks}/3</span><span>${school.failing ? `挂科第 ${state.day - school.since + 1}/10 天` : '学业正常'}</span><button class="text-btn" data-action="daily" data-value="study" ?disabled=${busy}>补习 2 小时 ${icon('book-open')}</button></div>` : html`<div class="rent-line"><span>${icon('house')}每月 25 日房租</span><b>¥${j.rent}</b><span class="${state.money < j.rent ? 'danger-text' : ''}">${state.money >= j.rent ? '余额已足够' : '还差 ¥' + (j.rent - state.money)}</span></div>`}</section>
    <aside class="life-panel"><div class="section-heading"><h2>本月收支</h2><span>${G.date(state).getUTCMonth() + 1} 月</span></div><div class="ledger"><div><span>${state.job === 'worker' ? '工资 · 每月 1 日发放' : state.job === 'student' ? '生活费 · 每月 1 日发放' : '固定收入'}</span><b>¥${j.monthly}</b></div><div><span>每日基本开销</span><b>-¥${j.daily}</b></div><div><span>25 日房租</span><b>${j.rent ? '-¥' + j.rent : '住宿费已缴'}</b></div></div><div class="goal-inline"><span>W6 进度</span><b>${Math.round(state.rating / 16000 * 100)}%</b></div><div class="meter"><span style="width:${Math.min(100, state.rating / 16000 * 100)}%"></span></div><div class="relationship">${icon('heart-handshake')}<div><b>${state.loveFailed ? '擦肩而过' : state.love === 0 ? '还未相遇' : state.love === 1 ? '认识小凛' : state.love === 2 ? '逐渐熟悉' : state.love === 3 ? '心照不宣' : '一起出勤'}</b><small>${state.visits} 次出勤 · ${state.tracks} 首游玩</small></div></div></aside></div>
    <section class="actions-section"><div class="section-heading"><h2>安排接下来的时间</h2><span>${G.time(state.clock)} · 最晚 04:00 入睡</span></div><div class="action-grid"><button class="action-card attend" data-action="attend" ?disabled=${state.ending}><span class="action-icon">${icon('disc-3')}</span><div><h3>${state.phase === 'home' ? '出发，打舞萌！' : '继续出勤'}</h3><p>单开 / 拼机 · 每轮 ¥6</p><small>23:30 结束游玩</small></div>${icon('arrow-up-right')}</button>${state.job !== 'worker' ? html`<button class="action-card work" data-action="daily" data-value="work" ?disabled=${busy}><span class="action-icon">${icon('briefcase-business')}</span><div><h3>打工，攒钱</h3><p>4 小时 · +¥${j.wage}</p><small>心情 -12 · 每天最多 2 次</small></div>${icon('arrow-up-right')}</button>` : ''}<button class="action-card fun" data-action="entertain" ?disabled=${busy}><span class="action-icon">${icon('gamepad-2')}</span><div><h3>娱乐</h3><p>给心情充个电</p><small>外出娱乐 · 刷视频</small></div>${icon('arrow-up-right')}</button></div><div class="day-controls"><button class="secondary-btn" data-action="chat">${icon('messages-square')}查看舞萌群</button><button class="secondary-btn" data-action="daily" data-value="wait" ?disabled=${busy}>${icon('clock-3')}等待</button><button class="primary-btn" data-action="daily" data-value="sleep" ?disabled=${busy}>${icon('moon')}睡觉</button></div></section>
    <section class="recent-section"><div class="section-heading"><h2>今日手账</h2><button class="text-btn" data-action="nav" data-value="journal">全部记录 ${icon('arrow-right')}</button></div>${logRows(state.logs.slice(0, 5))}</section>`;
  }
  function logRows(items) {
    return html`<div class="log-list">${items.map(l => html`<div class="log-row"><span class="log-day">DAY ${l.day}<small>${G.time(l.time || 0)}</small></span><span class="log-dot ${esc(l.type)}"></span><span>${esc(l.text)}</span></div>`)}</div>`;
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
        isPicked = picked.some(p => G.key(p) === G.key(c));
      return html`<div class="song-row">${cover(c)}<div class="song-info"><b>${esc(c.title)}</b><small>${esc(c.version)} · ${c.type === 'DX' ? 'DX' : '标准'} ${badge(c)}</small></div><span class="difficulty diff-${c.index}">${names[c.index]}<b>${G.displayLevel(c.ds)}</b></span>${selectable ? html`<button class="icon-btn pick-btn ${isPicked ? 'picked' : ''}" data-action="pick" data-value="${esc(G.key(c))}" title="选择谱面" aria-label="选择 ${esc(c.title)} ${c.type} ${names[c.index]}">${icon(isPicked ? 'check' : 'plus')}</button>` : html`<div class="record-score">${r ? html`<b>${r.achievement.toFixed(4)}%</b><small>${G.rank(r.achievement)} · ${r.ra} RA ${esc(r.combo || '')}</small>` : html`<small>未游玩</small>`}</div>`}</div>`;
    });
  }
  function chartMatches(c) {
    const levelQuery = /^\d{1,2}\+?$/.test(search.trim()) ? search.trim() : null;
    return (!levelQuery || G.displayLevel(c.ds) === levelQuery) && (difficulty === 'all' || c.index === Number(difficulty)) && (patternFilter === 'all' || c.tendency === patternFilter || c.tag === patternFilter);
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
        chosen = picked.some(p => G.key(p) === G.key(c));
      return html`<button class="chart-cell diff-${index} ${chosen ? 'chosen' : ''}" data-action="${selectable ? 'pick' : 'chart-detail'}" data-value="${esc(G.key(c))}" aria-label="${selectable ? '选择' : '查看'} ${esc(s.title)} ${s.type} ${names[index]}"><span>${names[index]} ${chosen ? icon('check') : ''}</span><b>${G.displayLevel(ds)}</b>${badge(c)}<small>${r ? `${r.achievement.toFixed(4)}% · ${r.ra} RA` : '未游玩'}</small>${r?.combo ? html`<em>${esc(r.combo)}</em>` : ''}</button>`;
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
    return html`<div class="modal-backdrop"><section class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1"><div class="modal-heading"><div><span class="eyebrow">${sub}</span><h2 id="modal-title">${title}</h2></div>${close ? html`<button class="icon-btn" data-action="close" title="关闭" aria-label="关闭">${icon('x')}</button>` : ''}</div>${body}</section></div>`;
  }
  function options(list, action) {
    return html`<div class="option-grid">${list.map(x => {
      const unavailable = x.cost > state.money || action === 'meal' && (!G.canSpendTime(state, x.time + state.trip.returnTime) || state.job === 'student' && state.clock + x.time + state.trip.returnTime > 1440);
      return html`<button class="option" data-action="${action}" data-value="${x.id}" ?disabled=${unavailable}>${icon(x.icon)}<div><b>${x.name}</b><small>${x.note}</small></div><span>${x.cost ? `¥${x.cost}` : action === 'meal' ? '已含' : '免费'}${x.time ? html`<small>${action === 'travel' ? '往返 ' : ''}${x.time} 分钟</small>` : ''}</span></button>`;
    })}</div>`;
  }
  function steps(n) {
    return html`<div class="trip-steps">${['出门', '上机 / 排队', '下机'].map((t, i) => html`<span class="${i === n ? 'active' : ''}"><b>0${i + 1}</b>${t}</span>`)}</div>`;
  }
  function phone(select = false) {
    return html`<div class="phone-shell"><div class="phone-status"><b>${G.time(state.clock)}</b><span>${icon('signal')}${icon('wifi')}${icon('battery-full')}</span></div><div class="phone-title"><span class="phone-app-icon">${icon('map-pinned')}</span><div><h3>机厅看看</h3><small>10:00 开门 · 23:30 停机</small></div></div><div class="phone-location">${icon('map-pin')}大学城附近 <span>3 家机厅</span></div>${arcades.map((a, i) => html`<button class="arcade-option ?selected=${state.arcade === i}" data-action="arcade" data-value="${i}" ?disabled=${!select}><div><b>${a}</b><small>${G.ARCADE_KM[i].toFixed(1)} km 单程 · ${i === 2 ? 4 : 2} 台双人机组</small></div><span class="crowd-count"><b>${G.peopleAt(state, i)}</b>人在店</span></button>`)}<div class="phone-footer">人数随时段与进出店变化 · ${state.mode === 'pair' ? '全员双人拼机' : '单人排队'}</div></div>`;
  }
  function modeControl() {
    const r = G.roundInfo(state),
      waiting = state.phase === 'play' ? Math.max(0, state.queueUntil - state.clock) : r.queue;
    return html`<div class="mode-select">${Object.values(G.MODES).map(m => html`<button class="?selected=${state.mode === m.id}" data-action="mode" data-value="${m.id}" aria-pressed="${state.mode === m.id}">${icon(m.icon)}${m.name}<small>${m.count} 首 · 自选 ${m.id === 'pair' && state.mode === 'pair' ? G.selectCount(state) : m.select} 首</small></button>`)}</div><div class="queue-info">${icon('users')}${state.phase === 'play' ? '还需等候' : '预计排队'} ${waiting} 分钟 + 游玩 ${r.duration} 分钟<span>每人 ¥6</span></div>`;
  }
  function results() {
    if (!state.last) return '';
    return html`<div class="result-banner"><div>${icon('sparkles')}Rating <b>+${state.last.gain}</b></div><span>星星 +${(state.skills.star - state.last.skillsBefore.star).toFixed(3)} · 键盘 +${(state.skills.key - state.last.skillsBefore.key).toFixed(3)} · 读谱 +${(state.skills.reading - (state.last.skillsBefore.reading ?? state.skills.reading)).toFixed(3)}</span></div><div class="performance-results">${state.last.results.map(c => html`<article>${cover(c)}<div><small class="diff-text-${c.index}">${names[c.index]} ${G.displayLevel(c.ds)} · ${c.partner ? '对方选曲' : '自选'}</small><b>${esc(c.title)}</b><div class="performance-score">${c.achievement.toFixed(4)}% <em>${G.rank(c.achievement)}</em><span class="combo-badge">${c.combo || 'CLEAR'}</span></div><small>${c.ra} RA · 第 ${c.plays} 次 · ${c.improved ? 'NEW BEST' : ''}</small><div class="judgements">${['critical', 'perfect', 'great', 'good', 'miss'].map((k, i) => html`<span>${['CRITICAL', 'PERFECT', 'GREAT', 'GOOD', 'MISS'][i]} <b>${c.judgements?.[k] ?? 0}</b></span>`)}</div>${c.breakJudgements ? html`<details class="break-details"><summary>BREAK 判定 · 基础 ${c.baseScore.toFixed(4)}% + 加分 ${c.extraScore.toFixed(4)}%</summary><p>${Object.entries(c.breakJudgements).map(([k, v]) => `${{
      critical: 'CP',
      perfect50: '50 落 P',
      perfect100: '100 落 P',
      great80: '80% G',
      great60: '60% G',
      great50: '50% G',
      good: 'GOOD',
      miss: 'MISS'
    }[k]} ${v}`).join(' · ')}</p></details>` : ''}${c.segmentEvent ? html`<p class="segment-outcome ${c.segmentEvent.passed ? 'passed' : 'failed'}">${c.segmentEvent.scene} · ${c.segmentEvent.passed ? '判定通过' : `段落坠机 · +${c.segmentEvent.misses} MISS · -${c.segmentEvent.loss.toFixed(4)}%`}</p>` : ''}</div></article>`)}</div>`;
  }
  function renderModal() {
    if (state.ending && modal !== 'restart') modal = 'ending';else if (state.school.pending) modal = 'teacher';else if (state.event !== null) modal = 'event';else if (state.videoEvent) modal = 'video';
    const root = $('#modal-root');
    if (!modal) {
      mount('', root);
      document.body.classList.remove('modal-open');
      return;
    }
    document.body.classList.add('modal-open');
    let content = '';
    if (modal === 'chat') content = frame('舞萌出勤群', '30 位群友 · ' + G.time(state.clock), LifeUI.chat(state));
    if (modal?.startsWith('b50chat:')) content = frame('B50 成绩图', '群聊中的成绩记录', html`<div class="b50-image-view"><img data-b50-image="${modal.split(':')[1]}" alt="群聊 B50 完整成绩图片"></div>`, true);
    if (modal === 'supplies') content = frame('手套与补给', '钱包 ¥' + state.money, LifeUI.shop(state));
    if (modal === 'plates') content = frame('我的名牌', '版本成就 · 极 / 将 / 神', LifeUI.collections(state, pool, collectionTab, collectionSearch, collectionPage, collectionStatus), true);
    if (modal === 'avatar') content = frame('自定义头像', '保存在本机存档中', html`<div class="avatar-editor">${state.profile.avatar ? html`<img src="${state.profile.avatar}" alt="当前头像">` : icon('circle-user-round')}<div class="avatar-controls"><label class="secondary-btn">${icon('upload')}选择图片<input id="avatar-upload" type="file" accept="image/png,image/jpeg,image/webp" hidden></label><button class="secondary-btn" data-action="reset-avatar">${icon('rotate-ccw')}恢复默认</button></div></div>`);
    if (modal === 'talents') content = frame('词条', '已获得 ' + state.talents.length + ' 项', LifeUI.talents(state), true);
    if (modal === 'video') {
      const c = catalog.get(state.videoEvent.key);
      content = frame('刷到了一段手元', c.title, html`${rows([c])}<p class="event-text">${state.videoEvent.outcome === 'clear' ? '反复看了关键段落，终于理顺了动作与节奏。' : '记住了开头和几个难点，还需要上机试试。'}</p><div class="modal-actions"><button class="primary-btn" data-action="learn-video">${icon('scan-eye')}${state.videoEvent.outcome === 'clear' ? '大彻大悟' : '似懂非懂'}</button></div>`, false, false);
    }
    if (modal === 'phone') content = frame('机厅看看', 'ARCADE RADAR', phone());
    if (modal === 'trip') {
      if (state.phase === 'travel') content = frame('选择机厅与出行方式', `${G.dateLabel(state)} · ${G.time(state.clock)}`, html`${steps(0)}<div class="travel-layout">${phone(true)}<div>${modeControl()}<p class="form-note">本次单程 ${G.ARCADE_KM[state.arcade].toFixed(1)} km，往返 ${(G.ARCADE_KM[state.arcade] * 2).toFixed(1)} km；到店与回家时分别累计。</p>${options(G.transportOptions(state.arcade), 'travel')}<button class="finish-btn" data-action="cancel-trip">今天先不出门 ${icon('undo-2')}</button></div></div>`, true);
      if (state.phase === 'drink') content = frame('上机前，喝点什么', `${G.time(state.clock)} · ${arcades[state.arcade]}`, html`${steps(1)}${options(G.DRINKS, 'drink')}<p class="form-note">购饮 5 分钟 · 600 ml · 每首消耗 60 ml</p>`);
      if (state.phase === 'play') {
        const reason = G.playReason(state);
        content = frame('上机 / 排队', `${G.time(state.clock)} · 最晚 ${G.time(G.availableUntil(state))} 结束上机`, html`${steps(1)}<div class="trip-info">${icon('wallet')}¥${state.money}<span>${state.trip.rounds} 轮已完成</span><span>机厅 ${G.peopleAt(state)} 人</span></div>${results()}${modeControl()}${LifeUI.supplies(state)}${state.last ? html`<div class="round-events">${state.logs.filter(l => l.day === state.day && l.time === state.clock && ['event', 'crowd', 'talent', 'heart'].includes(l.type)).slice(0, 4).map(l => html`<p>${icon('sparkles')}${esc(l.text)}</p>`)}</div>` : ''}<div class="small-heading">本轮自选 ${G.selectCount(state)} 首<span>${state.mode === 'pair' ? '拼机伙伴选择剩余曲目，两人同时游玩' : '单人三首'}</span></div><div class="selection-slots">${Array.from({
          length: G.selectCount(state)
        }, (_, i) => html`<button class="secondary-btn" data-action="picker" data-value="${i}">${icon('disc-3')}第 ${i + 1} 首 · ${esc(picked[i]?.title || recommendations[i]?.title || '选择曲目')}</button>`)}</div>${rows(picked.length ? picked : recommendations)}${LifeUI.partnerChoices(state, pool)}<div class="modal-actions"><button class="secondary-btn" data-action="picker">${icon('list-music')}自选曲目</button><button class="secondary-btn" data-action="reroll" title="换一组">${icon('shuffle')}换一组</button><button class="primary-btn" data-action="play" ?disabled=${reason}>${icon('play')}投币上机 · ¥6</button></div>${reason ? html`<p class="warning">${reason}</p>` : ''}<button class="finish-btn" data-action="finish">结束上机，去吃饭 ${icon('arrow-right')}</button>`, true);
      }
      if (state.phase === 'meal') content = frame('下机了，好好吃顿饭', `${G.time(state.clock)} · 回程 ${state.trip.returnTime} 分钟`, html`${steps(2)}<div class="outing-summary"><div><small>本次上机</small><b>${state.trip.rounds}<span> 轮</span></b></div><div><small>Rating 提升</small><b>+${state.rating - state.trip.ratingBefore}</b></div><div><small>已花费</small><b>¥${state.trip.cost}</b></div></div>${options(G.MEALS, 'meal')}${G.canSkipMeal(state) ? html`<button class="secondary-btn" data-action="meal" data-value="skip">不吃饭，直接回家</button>` : ''}<p class="form-note">吃饭后返回家中，可以继续当天安排。基础餐食包含在每日 ¥${G.JOBS[state.job].daily} 生活开销内。</p>`);
    }
    if (modal === 'picker') content = frame(`自选曲目 · ${G.MODES[state.mode].name}`, `选择第 ${pickSlot + 1} 首 / 共 ${G.selectCount(state)} 首`, html`${filters()}<div class="picker-list" id="song-results">${libraryResults()}</div><div class="modal-actions"><span id="pick-count">${picked[pickSlot] ? esc(picked[pickSlot].title) : '本首尚未选择'}</span><button class="primary-btn" data-action="picked">${icon('check')}确认选曲</button></div>`, true);
    if (modal === 'entertain') content = frame('娱乐', `${G.time(state.clock)} · 心情 ${state.mood}/100`, html`<div class="option-grid"><button class="option" data-action="daily" data-value="fun" ?disabled=${state.money < 35}>${icon('popcorn')}<div><b>和朋友出去玩</b><small>2 小时 · 心情 +26</small></div><span>¥35</span></button><button class="option" data-action="watch-videos">${icon('clapperboard')}<div><b>刷视频</b><small>30 分钟 · 心情 +7</small></div><span>免费</span></button></div>`);
    if (modal === 'teacher') content = frame('老师约谈', 'ACADEMIC WARNING', html`<p class="event-text">“你最近的课程已经跟不上了。请尽快把落下的内容补上。”</p><div class="warning">挂科第 ${state.day - state.school.since + 1}/10 天 · 本次是第 ${state.school.talks + 1}/3 次约谈。<br>补习或上课将学力恢复到 20，可解除挂科；连续挂科 10 天或第 3 次约谈将进入肄业结局。</div><div class="modal-actions"><button class="primary-btn" data-action="teacher">${icon('book-open')}回应老师</button></div>`, false, false);
    if (modal === 'skip') {
      const c = G.nextObligation(state),
        major = c?.kind === 'major';
      content = frame(`逃课：${c?.name || ''}`, 'CLASS ATTENDANCE', html`<p class="event-text">${major ? '专业课：75% 概率被抓，学力 -12；被抓额外 -5，心情 -10。' : '水课：35% 概率被抓，学力 -4；被抓额外 -2，心情 -5。'}</p><p class="form-note">逃课不会消耗该节课的时间。学力归零将进入挂科状态。</p><div class="modal-actions"><button class="secondary-btn" data-action="close">再想想</button><button class="primary-btn" data-action="skip" data-value="${c?.id}">${icon('door-open')}确认逃课</button></div>`);
    }
    if (modal === 'timetable') content = frame('本周课表', 'MONDAY — FRIDAY', html`<div class="week-schedule">${[1, 2, 3, 4, 5].map(d => html`<div><b>周${'日一二三四五六'[d]}</b>${G.schedule(state, d).map(c => html`<p><span>${G.time(c.start)}–${G.time(c.end)}</span><b>${c.name}</b><small>${c.kind === 'major' ? '专业课' : '水课'}</small></p>`)}</div>`)}</div>`, true);
    if (modal === 'event') {
      const e = G.EVENTS[state.event];
      content = frame(e.title, `小凛 · ${state.event + 1}/4`, html`<div class="event-art"><div class="character"><span class="hair"></span><span class="face"></span><span class="eye left"></span><span class="eye right"></span><span class="bow left"></span><span class="bow right"></span><span class="dress"></span></div><div><small>机厅里的另一段旋律</small><b>小凛</b></div></div><p class="event-text">${e.text}</p><div class="event-choices">${e.options.map((o, i) => html`<button class="option" data-action="answer" data-value="${i}"><b>${o}</b>${icon('arrow-right')}</button>`)}</div>`, false, false);
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
    if (modal === 'about') content = frame('规则与来源', '2026 SPRING', html`<div class="about-copy"><h3>2026 年 3 月 1 日至 6 月 30 日</h3><p>共 122 天，每天 24 小时。正常睡眠后 08:00 起床，行动消耗分钟；机厅 10:00 开门、23:30 结束游玩。吃饭、回程均耗时，午夜结算当天收支。上班日为周一至周五 09:00–18:00；学生按每周课表上课。</p><h3>经济与学业</h3><p>开局资金：学生 ¥1800、挂壁 ¥1800、上班族 ¥6000。每月 1 日学生生活费 ¥1800、上班族工资 ¥6000 入账，开局已含 3 月资金。每日基础开销分别为 ¥35 / ¥25 / ¥65。挂壁房租 ¥600，上班族 ¥1800，25 日零点检查并缴纳。上班族不可打工。</p><p>水课被抓概率 35%，专业课 75%。学力归零进入挂科并触发约谈；恢复到 20 解除。第三次约谈或连续挂科 10 天进入肄业结局。</p><h3>分数与底力</h3><p>达成率上限 101.0000%，Rating 仅计算到 100.5%。旧版本最佳 35 张 + 新版本最佳 15 张。同谱面初见有 -0.55 个百分点的预期修正，重复游玩逐步增加熟练度；实际成绩还受底力、心情、饮品、疲劳与判定波动影响。</p><p>FC：没有 MISS；FC+：没有 GOOD / MISS；AP：没有 GREAT / GOOD / MISS。成绩与徽章由模拟判定统计产生，不是通过百分比直接指定。判定分布是本作模拟，非官方谱面重放。</p><p>星星 / 键盘优先采用 ChiffonMai 同源 DXRating 社区标签，未标注谱面按音符占比估算。海底谭 MASTER 保留人工校正。对应底力影响达成率，也会获得更多成长。单开三首，拼机通常双方各选两首、同步游玩四首；玩家可单独选择拼机伙伴选曲的难度。两人一组计算排队，每人 ¥6。</p><h3>午夜与宴曲</h3><p>午夜自动跨日并结算生活开销、工资和房租。挂壁和上班族可在凌晨回家后继续活动，最晚 04:00 入睡。过零点入睡后按八小时睡眠延迟起床，获得当天熬夜减益；睡眠覆盖课程或班次记为旷课、旷工。00:00–06:00 不能打工，学生仍需午夜前回家。</p><p>名称以方括号标签开头的曲目统一作为宴曲：不自动推荐、不参与 B50，手动游玩保留达成率但 Rating 为 0。</p><h3>体力与成长</h3><p>手套每曲磨损，耐久不足一轮时须更换。每曲消耗体力与 60 ml 饮料；体力低于 55 逐渐减分，饮料耗尽额外减分。难度与物量越高消耗越快。等待每分钟恢复 0.35，吃饭恢复 30–60；小憩和主动休息已移除，普通娱乐不回体。非饭点且本次消耗较少可直接回家。状态每日结合心情随机决定，读谱力修正初见与复打表现。鬼歌以拟合定数计算表现、初见额外 -0.45%，成长 ×1.3；吃分预期 +0.16%，成长 ×0.7。刷视频可能学到鬼歌手元：大彻大悟降低该谱面计算难度，似懂非懂免除额外初见惩罚。词条依据本地 maimai-talent-tags.md。</p><h3>名牌与拟合</h3><p>版本名牌参考公开查分器规则：极为全 BASIC–MASTER FC，将为全 SSS，神为全 AP。曲目范围与难度要求按落雪收藏品 API 核验；舞系包含指定 Re:MASTER。真系没有“真将”。收录 71 块极 / 将 / 神名牌，另有签到、区域装饰和称号。区域装饰以选定区域累计 10 PC 解锁，每日首次上机后自动签到，增加 2 点进度；已移除要求觉醒的称号；移动距离称号按实际往返机厅的公里数累计。FULL SYNC 等未实现条件保持锁定。</p><p>拟合数据来自水鱼 chart_stats，落雪公开曲库用于交叉核对官方定数。样本至少 100、两站定数一致且拟合差值绝对值 ≥0.3 才打标签。未获得落雪公开拟合数据，因此不是两站拟合共识。数据快照 2026-09-14。</p><h3>素材与数据</h3><p>非官方同人游戏。${songs.length} 首曲目与定数来自 <a href="https://www.diving-fish.com/api/maimaidxprober/music_data" target="_blank" rel="noreferrer">水鱼公开曲库</a>（2026-09-14 快照）。版本按落雪国服曲库映射为舞萌DX 2020–2026，B50 按国服引入版本分组，与故事月份独立。</p><p>曲绘来自水鱼 covers 公开图片服务，名牌与分数框来自 <a href="https://github.com/Yuri-YuzuChaN/maimaiDX" target="_blank" rel="noreferrer">maimaiDX</a> 的 CN1.55 公开素材包，本作现用国服“舞萌 DX”标识适配框，非原始官方框截图；扩充的名牌图案与称号条件来自落雪公共服务；社区技术标签来源经 <a href="https://github.com/ChiffonOwO/ChiffonMai" target="_blank" rel="noreferrer">ChiffonMai</a> 核对。相关版权归原权利人。无官方音源。图标使用 Lucide。</p></div>`);
    if (modal?.startsWith('chart:')) {
      const c = catalog.get(modal.slice(6)),
        r = state.records[G.key(c)];
      content = frame(c.title, `${c.type === 'DX' ? 'DX' : '标准'} · ${c.version}`, html`${rows([c])}<div class="chart-details"><div><b>${names[c.index]} ${c.ds}</b>${badge(c)}</div><p>${esc(c.classification)} · 星星权重 ${Math.round(c.starWeight * 100)}% · 键盘权重 ${Math.round((1 - c.starWeight) * 100)}%</p><p>已游玩 ${state.practice[G.key(c)] || 0} 次 · ${r ? `${r.achievement.toFixed(4)}% ${G.rank(r.achievement)} ${r.combo || ''}` : '暂无成绩'}</p>${Number.isFinite(c.fit) ? html`<p>水鱼拟合 ${c.fit.toFixed(3)} · 官方 ${c.ds} · 差值 ${(c.fit - c.ds).toFixed(3)}<br>样本 ${c.samples} · 落雪定数 ${c.comparison ?? '未收录'}<br>样本 ≥100 且定数一致时，差值 ≥0.3 为鬼歌，≤-0.3 为吃分推荐；BASIC 和定数 <10 不标记，ADVANCED 不标吃分。</p>` : html`<p>暂无拟合数据，不添加难度推荐标签。</p>`}<p>TAP ${c.notes[0]} · HOLD ${c.notes[1]} · SLIDE ${c.notes[2]} · TOUCH ${c.notes[3]} · BREAK ${c.notes[4]}</p></div>`);
    }
    const activeElement = document.activeElement;
    mount(content, root);
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
  function recommend() {
    recommendations = G.recommend(state, pool);
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
    G.recalculate(state);
    G.check(state);
    modal = null;
    picked=(state.selectedCharts||[]).map(k=>catalog.get(k)).filter(Boolean);
    recommend();
    save();
  }
  function act(a, v) {
    switch (a) {
      case 'nav':
        view = v;
        modal = null;
        page = 0;
        break;
      case 'chat':
        G.chatOpen(state);
        modal = 'chat';
        break;
      case 'plates':
      case 'talents':
      case 'supplies':
      case 'avatar':
        modal = a;
        break;
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
        break;
      case 'chat-image':modal='b50chat:'+v;break;
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
        modal = 'trip';
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
        modal = modal?.startsWith('b50chat:')?'chat':modal === 'picker' || modal === 'supplies' && state.phase === 'play' ? 'trip' : null;
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
        picked = [];
        recommend();
        break;
      case 'reroll':
        picked = [];
        recommend();
        break;
      case 'picker':
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
        G.finishPlay(state);
        break;
      case 'answer':
        G.answer(state, Number(v));
        modal = 'trip';
        break;
      case 'meal':
        G.meal(state, v);
        modal = null;
        toast('已经到家，可以继续安排今天。');
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
          talent: ''
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
          offers
        });
      } else {
        G.chatSend(state, $('#chat-message').value);
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
    if (e.target.name === 'career' || e.target.name === 'talent') {
      draft[e.target.name === 'career' ? 'job' : 'talent'] = e.target.value;
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
    if (e.key === 'Escape' && modal && !['event', 'ending', 'teacher', 'video'].includes(modal)) {
      modal = modal === 'picker' ? 'trip' : null;
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
