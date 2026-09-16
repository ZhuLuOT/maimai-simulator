import {html} from 'lit';
import {icon} from './ui.js';
const G=window.Game;
const dayAt=(month,date)=>Math.round((Date.UTC(2026,month-1,date)-G.START)/86400000)+1;

export function calendar(s,month,selectedDay){
 const offset=(new Date(Date.UTC(2026,month-1,1)).getUTCDay()+6)%7,last=new Date(Date.UTC(2026,month,0)).getUTCDate();
 const selected={...s,day:selectedDay},info=G.dayInfo(selected),schedule=G.schedule(selected),job=G.JOBS[s.job],date=G.date(selected).getUTCDate();
 return html`<div class="calendar-toolbar"><button class="icon-btn" data-action="calendar-month" data-value="-1" aria-label="上个月" title="上个月" ?disabled=${month===3}>${icon('chevron-left')}</button><h3>2026 年 ${month} 月</h3><button class="icon-btn" data-action="calendar-month" data-value="1" aria-label="下个月" title="下个月" ?disabled=${month===6}>${icon('chevron-right')}</button><button class="icon-btn" data-action="calendar-today" aria-label="回到游戏今天" title="回到游戏今天">${icon('calendar-check')}</button></div>
 <div class="calendar-weekdays">${['一','二','三','四','五','六','日'].map(d=>html`<span>${d}</span>`)}</div>
 <div class="calendar-grid">${Array.from({length:42},(_,index)=>{const date=index-offset+1;if(date<1||date>last)return html`<span class="calendar-blank"></span>`;const day=dayAt(month,date),value=G.dayInfo({day});return html`<button class="calendar-cell ${value.holiday?'holiday':value.makeup?'makeup':value.rest?'weekend':''} ${day===s.day?'today':''}" data-action="calendar-day" data-value=${day} aria-pressed=${day===selectedDay} aria-current=${day===s.day?'date':'false'} aria-label=${`${value.iso} ${value.holiday?value.holiday+'放假':value.makeup?value.makeup+'补班':value.rest?'休息日':'工作日'}`}><b>${date}</b><small>${value.holiday?value.holiday.replace('节',''):value.makeup?'补班':day===s.day?'今天':date===1&&job.monthly?'到账':date===25&&job.rent?'交租':''}</small></button>`;})}</div>
 <div class="calendar-day-detail"><h3>${G.dateLabel(selected)}</h3><p class=${info.holiday?'holiday-label':''}>${info.holiday?info.holiday+' · 放假':info.makeup?info.makeup+(s.job==='student'?` · 按周${'日一二三四五六'[info.scheduleWeekday]}课表`:' · 补班'):info.rest?'周末':'工作日'}</p>${schedule.length?html`<ul>${schedule.map(c=>html`<li><time>${G.time(c.start)}–${G.time(c.end)}</time><b>${c.name}</b>${selectedDay===s.day&&s.completed.includes(c.id)?html`<span>${s.absences.includes(c.id)?'缺席':'已完成'}</span>`:''}</li>`)}</ul>`:html`<p>${s.job==='student'?'没有课程':'没有固定日程'}</p>`}${date===1&&job.monthly?html`<p>${icon('wallet')}${s.job==='student'?'生活费':'工资'} ¥${job.monthly}${selectedDay===1?' · 已含在开局余额':''}</p>`:''}${date===25&&job.rent?html`<p>${icon('house')}房租 ¥${job.rent}</p>`:''}</div>
 <p class="asset-credit"><a href=${G.HOLIDAYS.source} target="_blank" rel="noreferrer">国务院 2026 年节假日安排</a></p>`;
}

export function timetable(s){
 const monday=s.day-(G.date(s).getUTCDay()+6)%7;
 return html`<div class="week-schedule">${Array.from({length:7},(_,i)=>monday+i).filter(day=>day>=1&&day<=G.DAYS).map(day=>{const value={...s,day},info=G.dayInfo(value),classes=G.schedule(value);return html`<div><b>${G.date(value).getUTCMonth()+1}/${G.date(value).getUTCDate()} 周${'日一二三四五六'[info.weekday]}</b><small>${info.holiday||info.makeup||''}</small>${classes.length?classes.map(c=>html`<p><span>${G.time(c.start)}–${G.time(c.end)}</span><b>${c.name}</b><small>${c.kind==='major'?'专业课':c.kind==='shift'?'上班':'水课'}</small></p>`):html`<p>休息</p>`}</div>`;})}</div>`;
}
