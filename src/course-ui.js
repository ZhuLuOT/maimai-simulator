import {html} from 'lit';
const G=window.Game;
const difficulties=['BASIC','ADVANCED','EXPERT','MASTER','Re:MASTER'];
export function courseRules(def){return `初始 LIFE ${def.life} · GREAT −${def.great} / GOOD −${def.good} / MISS −${def.miss} · 每曲完成回复 ${def.recovery}`;}
export function courseResult(s,pool){
  const r=s.competition.lastCourse,def=G.courseDefinition(r.level),charts=G.courseCharts(r.level,pool);
  const played=s.last?.courseLevel===r.level?s.last.results:[],total=played.reduce((n,c)=>n+c.achievement,0);
  const dx=c=>(c.judgements?.critical||0)*3+(c.judgements?.perfect||0)*2+(c.judgements?.great||0);
  return html`<section class="dan-result ${r.passed?'dan-pass':'dan-fail'}" aria-label="段位认证成绩">
    <header class="dan-result-heading"><h3>段位認定 <small>RESULT</small></h3></header>
    <div class="dan-tracks">${charts.map((c,i)=>{const score=played[i],life=r.tracks?.[i];return html`
      <article class="dan-track dan-diff-${c.index} ${score?'':'dan-unplayed'}">
        <div class="dan-track-mark"><small>TRACK ${String(i+1).padStart(2,'0')}</small><b class=${score&&life?.passed===false?'dan-track-failed':''} aria-label=${!score?'未到达此曲':life?.passed===false?'此曲挑战失败':'此曲完成'}>${!score?'—':life?.passed===false?'不可':'完'}</b></div>
        <img class="dan-jacket" src="assets/covers/${c.id}.webp" data-cover=${c.id} alt="${c.title} 曲绘">
        <div class="dan-track-body"><div class="dan-song-title"><span>${difficulties[c.index]} · ${c.type}</span><b>${c.title}</b></div>
          <div class="dan-song-score"><strong>${score?score.achievement.toFixed(4):'—'}<small>${score?'%':''}</small></strong><span class="dan-level">Lv.<b>${G.displayLevel(c)}</b></span></div>
          <div class="dan-song-detail">${score?html`<span>${G.rank(score.achievement)} · ${window.Judgement.clearLabel(score)}</span><span>DX 分数 ${dx(score)}</span>`:html`<span>未到达此曲</span>`}</div>
          ${life?html`<div class="dan-track-life">LIFE ${life.before} → ${life.afterLoss}${life.recovery?` +${life.recovery} → ${life.life}`:''}${life.passed?'':' · 挑战结束'}</div>`:''}
        </div>
      </article>`;})}</div>
    <div class="dan-summary"><div class="dan-certification"><img src="assets/course_rank/${def.asset}.webp" alt=${def.name}></div>
      <div class="dan-life-medal"><div><small>剩余 LIFE</small><b>${r.life}</b><small>/ ${r.maxLife||300}</small></div></div>
      <div class="dan-totals"><span>合计达成率</span><strong>${total.toFixed(4)}<small>%</small></strong><p>DX 分数 <b>${played.reduce((n,c)=>n+dx(c),0)}</b></p></div>
    </div><footer role="status">${r.passed?'认证成功，你的段位记录已保存。':'LIFE 耗尽，认证未通过。休息一下，下次再挑战。'}</footer>
  </section>`;
}
