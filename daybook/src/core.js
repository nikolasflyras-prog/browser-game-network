/* =================================================================
   DAYBOOK CORE
   Shared helpers, storage, daily seeding, time tracking, history,
   router, home page, history page and the game shell.
   Game modules (src/games/*.js) are concatenated after this file in
   the same scope and call register({...}).
   ================================================================= */
"use strict";
const app = document.getElementById('app');
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pad = n => String(n).padStart(2,'0');
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
const css = text => { const s = document.createElement('style'); s.textContent = text; document.head.appendChild(s); };
const fmtTime = ms => { const s = Math.max(0, Math.round((ms||0)/1000)); const h = Math.floor(s/3600), m = Math.floor(s/60)%60; return h ? `${h}:${pad(m)}:${pad(s%60)}` : `${m}:${pad(s%60)}`; };
const plural = (n, w, ws) => `${n} ${n===1 ? w : (ws || w + 's')}`;

/* ---------- storage (per browser, fails soft) ---------- */
const mem = {};
const store = {
  get(k, d){ try { const v = localStorage.getItem(k); if (v != null) return JSON.parse(v); } catch(e){} return (k in mem) ? mem[k] : d; },
  set(k, v){ mem[k] = v; try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} }
};

/* ---------- the day ---------- */
const DAY0 = new Date(2026, 10, 17);
let DATE_KEY, DAY_NO, TODAY;
const keyOf = d => d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate());
function setDay(){
  const n = new Date();
  TODAY = new Date(n.getFullYear(), n.getMonth(), n.getDate());
  DATE_KEY = keyOf(TODAY);
  DAY_NO = Math.round((TODAY - DAY0) / 864e5) + 1;
}
setDay();

/* ---------- seeded randomness: everyone gets the same puzzle each day ---------- */
function hashStr(s){ let h = 1779033703 ^ s.length; for (let i=0;i<s.length;i++){ h = Math.imul(h ^ s.charCodeAt(i), 3432918353); h = h<<13 | h>>>19; } h = Math.imul(h ^ h>>>16, 2246822507); h = Math.imul(h ^ h>>>13, 3266489909); return (h ^= h>>>16) >>> 0; }
function mulberry32(a){ return function(){ a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a>>>15, 1 | a); t = t + Math.imul(t ^ t>>>7, 61 | t) ^ t; return ((t ^ t>>>14) >>> 0) / 4294967296; }; }
const rngFor = name => mulberry32(hashStr(name + '|' + DATE_KEY));
function shuffle(a, r){ for (let i=a.length-1;i>0;i--){ const j = Math.floor(r()*(i+1)); [a[i],a[j]] = [a[j],a[i]]; } return a; }
function dailyPick(arr, name){
  const idx = shuffle(arr.map((_,i)=>i), mulberry32(hashStr('order|'+name)));
  const d = (((DAY_NO-1) % arr.length) + arr.length) % arr.length;
  return arr[idx[d]];
}

/* ---------- results, stats, streaks, history ---------- */
const stateKey = g => 'daybook:' + g + ':' + DATE_KEY;
const resKey = g => 'daybook:result:' + g + ':' + DATE_KEY;
const statsKey = g => 'daybook:stats:' + g;
const timeKey = g => 'daybook:time:' + g + ':' + DATE_KEY;
const HKEY = 'daybook:history';
function getStats(g){ return store.get(statsKey(g), {played:0, won:0, streak:0, best:0, last:null, lastWin:null}); }
function liveStreak(s){ return (s.lastWin === DAY_NO || s.lastWin === DAY_NO-1) ? s.streak : 0; }
function recordResult(g, won){
  const s = getStats(g);
  if (s.last === DAY_NO) return s;
  s.played++; s.last = DAY_NO;
  if (won){ s.won++; s.streak = (s.lastWin === DAY_NO-1) ? s.streak+1 : 1; s.lastWin = DAY_NO; s.best = Math.max(s.best, s.streak); }
  else s.streak = 0;
  store.set(statsKey(g), s);
  const days = store.get('daybook:days', []);
  if (!days.includes(DAY_NO)) { days.push(DAY_NO); store.set('daybook:days', days.slice(-800)); }
  return s;
}
function dayStreak(){
  const days = new Set(store.get('daybook:days', []));
  let d = days.has(DAY_NO) ? DAY_NO : DAY_NO-1, n = 0;
  while (days.has(d)) { n++; d--; }
  return n;
}
function bestDayStreak(){
  const days = [...new Set(store.get('daybook:days', []))].sort((a,b)=>a-b);
  let best = 0, run = 0;
  days.forEach((d,i) => { run = (i && d === days[i-1]+1) ? run+1 : 1; best = Math.max(best, run); });
  return best;
}
const history = () => store.get(HKEY, {});
function addHistory(id, res){
  const h = history();
  (h[DATE_KEY] = h[DATE_KEY] || {})[id] = {won:!!res.won, title:res.title, summary:res.summary, time:res.time||0, day:DAY_NO};
  if (typeof res.score === 'number' && isFinite(res.score)) h[DATE_KEY][id].score = res.score;
  store.set(HKEY, h);
}
function gameRecord(id){
  const h = history(); const rows = [];
  Object.keys(h).forEach(d => { if (h[d][id]) rows.push({date:d, ...h[d][id]}); });
  rows.sort((a,b) => a.date < b.date ? -1 : 1);
  const timed = rows.filter(r => r.time > 0);
  const wonTimed = timed.filter(r => r.won);
  return {
    rows, played: rows.length, won: rows.filter(r => r.won).length,
    avg: timed.length ? timed.reduce((a,r)=>a+r.time,0)/timed.length : 0,
    best: wonTimed.length ? Math.min(...wonTimed.map(r=>r.time)) : 0,
    total: timed.reduce((a,r)=>a+r.time,0)
  };
}

/* ---------- time tracking ----------
   The clock starts on your first tap or key press inside a game,
   pauses when the tab is hidden or after 90 s with no input,
   and stops for good when the game finishes. */
const IDLE = 90000;
const T = {id:null, acc:0, since:null, last:0, frozen:true};
function tLoad(id, frozen){ T.id = id; T.acc = store.get(timeKey(id), 0); T.since = null; T.frozen = frozen; T.last = Date.now(); if (T.acc > 0 && !frozen && !document.hidden) T.since = Date.now(); }
function tRun(){ T.last = Date.now(); if (T.id && !T.frozen && T.since == null && !document.hidden) T.since = Date.now(); }
function tPause(at){ if (T.since != null){ T.acc += Math.max(0, (at || Date.now()) - T.since); T.since = null; if (T.id) store.set(timeKey(T.id), T.acc); } }
function tElapsed(){ return T.acc + (T.since != null ? Date.now() - T.since : 0); }
function tUnload(){ tPause(); T.id = null; T.frozen = true; }
document.addEventListener('visibilitychange', () => { if (!T.id) return; if (document.hidden) tPause(); else if (T.acc > 0) tRun(); });
['pointerdown','keydown'].forEach(ev => document.addEventListener(ev, e => {
  if (!T.id || T.frozen) return;
  const body = document.getElementById('gbody');
  if (ev === 'keydown' || (body && body.contains(e.target))) tRun();
}, true));

/* ---------- countdown + clock tick ---------- */
function untilTomorrow(){
  const n = new Date(); const t = new Date(n.getFullYear(), n.getMonth(), n.getDate()+1);
  const s = Math.max(0, Math.floor((t - n)/1000));
  return pad(Math.floor(s/3600)) + ':' + pad(Math.floor(s/60)%60) + ':' + pad(s%60);
}
setInterval(() => {
  const before = DATE_KEY; setDay();
  if (before !== DATE_KEY) { route(); return; }
  if (T.since != null && Date.now() - T.last > IDLE) tPause(T.last + IDLE);
  document.querySelectorAll('[data-cd]').forEach(el => el.textContent = untilTomorrow());
  document.querySelectorAll('[data-gtimer]').forEach(el => { el.textContent = fmtTime(tElapsed()); el.classList.toggle('paused', T.since == null && !T.frozen); });
}, 1000);

/* ---------- registry ---------- */
const GAMES = [];
function register(g){ GAMES.push(g); }
const gameById = id => GAMES.find(g => g.id === id);
const CATS = [
  {id:'words', name:'Words'},
  {id:'numbers', name:'Numbers'},
  {id:'logic', name:'Logic'},
  {id:'speed', name:'Memory & speed'},
  {id:'know', name:'Knowledge'},
  {id:'skill', name:'Skill'},
  {id:'niche', name:'Niche'}
];
const catName = id => (CATS.find(c => c.id === id) || {name:id}).name;
const DEFAULT_ART = '<svg viewBox="0 0 120 80" aria-hidden="true"><rect x="30" y="10" width="60" height="60" rx="10" fill="none" stroke="currentColor" stroke-width="3"/></svg>';

/* ---------- router ---------- */
let cleanup = null, viewUnsub = null;
function route(){
  if (cleanup) { try { cleanup(); } catch(e){ console.error(e); } cleanup = null; }
  if (viewUnsub) { viewUnsub(); viewUnsub = null; }
  tUnload();
  const h = location.hash.slice(1);
  const g = gameById(h);
  if (g) renderGame(g); else if (h === 'history') renderHistory(); else if (h === 'leaders') viewUnsub = renderLeaders(); else renderHome();
  window.scrollTo(0, 0);
}
addEventListener('hashchange', route);

/* ---------- shared header ---------- */
function masthead(active){
  return `<div class="mast-top">
      ${typeof window.DAYBOOK_HOME === 'string' ? `<a class="homelink" href="${esc(window.DAYBOOK_HOME)}">← ${esc(window.DAYBOOK_HOME_NAME || 'Home')}</a>` : ''}
      <a class="brand" href="#today"><span class="logo" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span>Daybook</a>
      <nav class="tabs" aria-label="Sections"><a href="#today" class="${active==='today'?'on':''}">Today</a><a href="#leaders" class="${active==='leaders'?'on':''}">Leaderboards</a><a href="#history" class="${active==='history'?'on':''}">History</a><span class="issue">No. ${DAY_NO}</span></nav>
    </div>`;
}

/* ---------- home ---------- */
function cardStatus(g){
  const res = store.get(resKey(g.id), null);
  if (res) return {cls:'done', text:'Done · ' + res.summary, done:true};
  const st = store.get(stateKey(g.id), null);
  if ((st && st.started) || store.get(timeKey(g.id), 0) > 0) return {cls:'mid', text:'Resume'};
  return {cls:'go', text:'Play'};
}
const FILTERS = [
  {id:'all', name:'All', test:() => true},
  {id:'todo', name:'Not done', test:g => !store.get(resKey(g.id), null)},
  {id:'quick', name:'Under 3 min', test:g => g.mins <= 3},
  {id:'mid', name:'3–5 min', test:g => g.mins > 3 && g.mins <= 5},
  {id:'long', name:'5–10 min', test:g => g.mins > 5}
];
function renderHome(){
  document.documentElement.style.removeProperty('--gc');
  const done = GAMES.filter(g => store.get(resKey(g.id), null));
  const todayH = history()[DATE_KEY] || {};
  const timeToday = Object.values(todayH).reduce((a,r) => a + (r.time||0), 0);
  const wd = TODAY.toLocaleDateString(undefined, {weekday:'long'});
  const md = TODAY.toLocaleDateString(undefined, {month:'long', day:'numeric'});
  let filter = 'all'; try { filter = localStorage.getItem('daybook:filter') || 'all'; } catch(e){}
  if (!FILTERS.find(f => f.id === filter)) filter = 'all';
  const pct = GAMES.length ? Math.round(100*done.length/GAMES.length) : 0;
  app.innerHTML = `
  <header class="mast">
    ${masthead('today')}
    <h1 class="date">${esc(wd)}<br><span>${esc(md)}</span></h1>
    <div class="mast-row">
      <p class="lede">${GAMES.length} small puzzles, new every midnight. Each takes two to ten minutes, and everyone gets the same set.</p>
      <div class="meta">
        <div><span class="label">Finished</span><strong>${done.length}<small>/${GAMES.length}</small></strong><span class="bar" style="--p:${pct}%"><i></i></span></div>
        <div><span class="label">Time today</span><strong>${fmtTime(timeToday)}</strong></div>
        <div><span class="label">Day streak</span><strong>${dayStreak()}</strong></div>
        <div><span class="label">Next set in</span><strong data-cd>${untilTomorrow()}</strong></div>
      </div>
    </div>
  </header>
  <div class="filters" role="group" aria-label="Filter games">${FILTERS.map(f => `<button class="fchip ${f.id===filter?'on':''}" data-f="${f.id}" aria-pressed="${f.id===filter}">${f.name}</button>`).join('')}</div>
  <main id="sections"></main>
  <footer class="foot"><span>Progress, times and history are saved in this browser. Back them up from the History tab.</span><span>Puzzle No. ${DAY_NO} · ${DATE_KEY}</span></footer>`;
  const catLocal = localCategoryStats();
  const paint = () => {
    const f = FILTERS.find(x => x.id === filter);
    const html = CATS.map(c => {
      const all = GAMES.filter(g => g.cat === c.id);
      const list = all.filter(f.test);
      if (!list.length) return '';
      const d = all.filter(g => store.get(resKey(g.id), null)).length;
      const cs = catLocal[c.id];
      return `<section class="cat" style="--gc:var(--c-${c.id})">
        <div class="cat-head"><h2>${c.name}</h2><span class="label">${d} of ${all.length} done${cs.tn ? ' · your avg ' + fmtTime(cs.ts/cs.tn) : ''}${cs.n ? ' · ' + Math.round(100*cs.w/cs.n) + '% won' : ''}</span></div>
        <div class="grid">${list.map(card).join('')}</div></section>`;
    }).join('');
    document.getElementById('sections').innerHTML = html || `<p class="empty">Nothing left under this filter. Nice work.</p>`;
  };
  app.querySelector('.filters').onclick = e => {
    const b = e.target.closest('[data-f]'); if (!b) return;
    filter = b.dataset.f; try { localStorage.setItem('daybook:filter', filter); } catch(e){}
    app.querySelectorAll('.fchip').forEach(x => { x.classList.toggle('on', x.dataset.f === filter); x.setAttribute('aria-pressed', String(x.dataset.f === filter)); });
    paint();
  };
  paint();
}
function card(g){
  const s = cardStatus(g); const st = liveStreak(getStats(g.id)); const rec = gameRecord(g.id);
  const bits = [];
  if (rec.avg) bits.push('avg ' + fmtTime(rec.avg));
  if (st) bits.push('streak ' + st);
  return `<a class="card ${s.done?'is-done':''}" href="#${g.id}">
    <div class="card-art">${g.art || DEFAULT_ART}</div>
    <div class="card-body">
      <div class="card-top"><h3>${esc(g.name)}</h3><span class="mins">~${g.mins} min</span></div>
      <p>${esc(g.blurb)}</p>
      <div class="card-foot"><span class="chip ${s.cls}">${esc(s.text)}</span><span class="streak">${esc(bits.join(' · '))}</span></div>
    </div>
  </a>`;
}

/* ---------- history ---------- */
function renderHistory(){
  document.documentElement.style.removeProperty('--gc');
  const h = history();
  const dates = Object.keys(h).sort();
  const allRows = [];
  dates.forEach(d => Object.keys(h[d]).forEach(id => allRows.push({date:d, id, ...h[d][id]})));
  const totalTime = allRows.reduce((a,r)=>a+(r.time||0),0);
  const daysPlayed = dates.filter(d => Object.keys(h[d]).length).length;
  // heat map: 12 weeks ending this week (Mon–Sun columns)
  const WEEKS = 12;
  const end = new Date(TODAY); const dow = (end.getDay()+6)%7; end.setDate(end.getDate() + (6-dow));
  const startD = new Date(end); startD.setDate(startD.getDate() - WEEKS*7 + 1);
  const cells = [];
  for (let i=0; i<WEEKS*7; i++){
    const d = new Date(startD); d.setDate(d.getDate()+i);
    const k = keyOf(d); const n = h[k] ? Object.keys(h[k]).length : 0;
    const future = d > TODAY;
    const lvl = n === 0 ? 0 : n < 4 ? 1 : n < 9 ? 2 : n < 16 ? 3 : 4;
    cells.push(`<i class="hm l${lvl} ${future?'fut':''} ${k===DATE_KEY?'now':''}" title="${esc(d.toLocaleDateString(undefined,{month:'short',day:'numeric'}))}: ${n} finished"></i>`);
  }
  const months = [];
  for (let w=0; w<WEEKS; w++){ const d = new Date(startD); d.setDate(d.getDate()+w*7); months.push(d.getDate() <= 7 || w===0 ? d.toLocaleDateString(undefined,{month:'short'}) : ''); }
  const rows = GAMES.map(g => ({g, r:gameRecord(g.id), s:getStats(g.id)}));
  app.innerHTML = `
  <header class="mast compact">
    ${masthead('history')}
    <h1 class="date sm">Your history</h1>
  </header>
  <section class="kpis">
    <div><span class="label">Days played</span><strong>${daysPlayed}</strong></div>
    <div><span class="label">Games finished</span><strong>${allRows.length}</strong></div>
    <div><span class="label">Time played</span><strong>${fmtTime(totalTime)}</strong></div>
    <div><span class="label">Day streak</span><strong>${dayStreak()}<small> best ${bestDayStreak()}</small></strong></div>
  </section>
  ${localCatSection()}
  <section class="hsec">
    <div class="cat-head"><h2>Last 12 weeks</h2><span class="legend"><span>Fewer</span><i class="hm l0"></i><i class="hm l1"></i><i class="hm l2"></i><i class="hm l3"></i><i class="hm l4"></i><span>More</span></span></div>
    <div class="hm-wrap"><div class="hm-months">${months.map(m=>`<span>${esc(m)}</span>`).join('')}</div><div class="hm-grid">${cells.join('')}</div></div>
  </section>
  <section class="hsec">
    <div class="cat-head"><h2>By game</h2><span class="label">Times are for finished games</span></div>
    <div class="tbl-wrap"><table class="htbl">
      <thead><tr><th>Game</th><th>Played</th><th>Won</th><th>Streak</th><th>Best streak</th><th>Avg time</th><th>Best time</th><th>Total time</th></tr></thead>
      <tbody>${rows.map(({g,r,s}) => `<tr style="--gc:var(--c-${g.cat})"><td><a href="#${g.id}"><i class="dot"></i>${esc(g.name)}</a></td><td>${r.played}</td><td>${r.played?Math.round(100*r.won/r.played)+'%':'·'}</td><td>${liveStreak(s)}</td><td>${s.best}</td><td>${r.avg?fmtTime(r.avg):'·'}</td><td>${r.best?fmtTime(r.best):'·'}</td><td>${r.total?fmtTime(r.total):'·'}</td></tr>`).join('')}</tbody>
    </table></div>
  </section>
  <section class="hsec">
    <div class="cat-head"><h2>Recent results</h2><span class="label">${allRows.length ? 'Last ' + Math.min(40, allRows.length) : ''}</span></div>
    ${allRows.length ? `<ol class="log">${allRows.slice(-40).reverse().map(r => { const g = gameById(r.id); return `<li style="--gc:var(--c-${g?g.cat:'logic'})"><span class="ld">${esc(new Date(r.date+'T12:00').toLocaleDateString(undefined,{month:'short',day:'numeric'}))}</span><span class="lg"><i class="dot"></i>${esc(g?g.name:r.id)}</span><span class="ls">${esc(r.title)} · ${esc(r.summary)}</span><span class="lt2">${r.time?fmtTime(r.time):''}</span><span class="lw ${r.won?'ok':''}">${r.won?'Kept':'Missed'}</span></li>`; }).join('')}</ol>`
      : `<p class="empty">Finish a game and it shows up here with its time and score.</p>`}
  </section>
  <section class="hsec">
    <div class="cat-head"><h2>Backup</h2><span class="label">History lives in this browser only</span></div>
    <p class="hint left">Copy a backup to keep your history safe or move it to another browser. Paste one below to restore it.</p>
    <div class="row"><button class="btn" id="bk-copy">Copy backup</button></div>
    <textarea id="bk-in" class="bk" rows="3" placeholder="Paste a backup here" aria-label="Backup to restore"></textarea>
    <div class="row"><button class="btn" id="bk-restore">Restore backup</button><span class="msg" id="bk-msg" aria-live="polite"></span></div>
  </section>`;
  const msg = document.getElementById('bk-msg');
  document.getElementById('bk-copy').onclick = () => {
    const data = {};
    try { for (let i=0;i<localStorage.length;i++){ const k = localStorage.key(i); if (k.startsWith('daybook:')) data[k] = localStorage.getItem(k); } } catch(e){}
    Object.keys(mem).forEach(k => { if (!(k in data)) data[k] = JSON.stringify(mem[k]); });
    const text = JSON.stringify({daybook:1, data});
    const ta = document.getElementById('bk-in');
    const fallback = () => { ta.value = text; ta.select(); msg.textContent = 'Backup is in the box. Press Ctrl+C or ⌘C to copy it.'; };
    try { navigator.clipboard.writeText(text).then(() => { msg.textContent = 'Backup copied.'; }, fallback); } catch(e){ fallback(); }
  };
  document.getElementById('bk-restore').onclick = () => {
    try {
      const obj = JSON.parse(document.getElementById('bk-in').value);
      if (!obj || obj.daybook !== 1 || typeof obj.data !== 'object') throw new Error('bad');
      Object.keys(obj.data).forEach(k => { if (k.startsWith('daybook:')) store.set(k, JSON.parse(obj.data[k])); });
      msg.textContent = 'Restored.'; setTimeout(renderHistory, 400);
    } catch(e){ msg.textContent = 'That doesn’t look like a Daybook backup. Copy one with the button above.'; }
  };
}

/* ---------- game shell ---------- */
function renderGame(g){
  document.documentElement.style.setProperty('--gc', `var(--c-${g.cat})`);
  const finished = !!store.get(resKey(g.id), null);
  app.innerHTML = `
  <div class="game">
    <div class="gbar">
      <a class="back" href="#today">← All games</a>
      <div class="gtitle"><h1>${esc(g.name)}</h1><span>No. ${DAY_NO}</span></div>
      <div class="gright"><span class="gtimer tnum" data-gtimer title="Time on this puzzle. Starts on your first move and pauses when you step away.">${fmtTime(store.get(timeKey(g.id),0))}</span><button class="howbtn" id="howbtn" aria-expanded="false" aria-controls="how">Rules</button></div>
    </div>
    <section class="how" id="how" hidden><ul>${g.how.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>
    <div id="gbody"></div>
    <section id="result" class="result" hidden></section>
  </div>`;
  const howbtn = document.getElementById('howbtn'), how = document.getElementById('how');
  if (!store.get('daybook:seen:' + g.id, false)) { how.hidden = false; howbtn.setAttribute('aria-expanded','true'); store.set('daybook:seen:' + g.id, true); }
  howbtn.onclick = () => { how.hidden = !how.hidden; howbtn.setAttribute('aria-expanded', String(!how.hidden)); };
  tLoad(g.id, finished);
  const resultEl = document.getElementById('result');
  const api = {
    id: g.id, day: DAY_NO, date: DATE_KEY,
    rng: (salt) => rngFor(g.id + (salt ? ':' + salt : '')),
    pick: arr => dailyPick(arr, g.id),
    load(def){ const v = store.get(stateKey(g.id), null); return v != null ? v : (typeof def === 'function' ? def() : def); },
    save(st){ store.set(stateKey(g.id), st); },
    start(){ tRun(); },
    elapsed: () => tElapsed(),
    existing(){ return store.get(resKey(g.id), null); },
    finish(res){
      if (store.get(resKey(g.id), null)) return;
      tPause(); T.frozen = true;
      res.time = Math.round(tElapsed());
      res.share = (res.share || `Daybook ${g.name} No. ${DAY_NO}`) + `\n⏱ ${fmtTime(res.time)}`;
      store.set(resKey(g.id), res); recordResult(g.id, res.won); addHistory(g.id, res);
      try { syncBoard(); } catch(e){ console.error(e); }
      showResult(g, res, resultEl);
    },
    show(res){ showResult(g, res, resultEl); }
  };
  try { cleanup = g.mount(document.getElementById('gbody'), api) || null; }
  catch(e){ console.error(e); document.getElementById('gbody').innerHTML = `<p class="msg bad">This puzzle failed to load. Try reloading the page.</p>`; }
}

function showResult(g, res, el){
  const s = getStats(g.id), rec = gameRecord(g.id);
  const next = GAMES.find(x => x.id !== g.id && x.cat === g.cat && !store.get(resKey(x.id), null)) || GAMES.find(x => x.id !== g.id && !store.get(resKey(x.id), null));
  el.hidden = false;
  el.innerHTML = `
    <div><h2>${esc(res.title)}</h2><p>${esc(res.detail)}</p></div>
    <pre class="share" id="sharetext">${esc(res.share)}</pre>
    <div class="row">
      <button class="btn primary" id="copybtn">Copy result</button>
      ${next ? `<a class="btn" href="#${next.id}">Next: ${esc(next.name)} →</a>` : `<a class="btn" href="#today">All done · back to today</a>`}
    </div>
    <dl class="stats">
      <div><dt>Time</dt><dd>${res.time ? fmtTime(res.time) : '·'}</dd></div>
      <div><dt>Avg time</dt><dd>${rec.avg ? fmtTime(rec.avg) : '·'}</dd></div>
      <div><dt>Best time</dt><dd>${rec.best ? fmtTime(rec.best) : '·'}</dd></div>
      <div><dt>Played</dt><dd>${s.played}</dd></div>
      <div><dt>Kept</dt><dd>${s.played ? Math.round(100*s.won/s.played) : 0}%</dd></div>
      <div><dt>Streak</dt><dd>${liveStreak(s)}</dd></div>
      <div><dt>Best streak</dt><dd>${s.best}</dd></div>
      <div><dt>Next in</dt><dd data-cd>${untilTomorrow()}</dd></div>
    </dl>
    <div class="lbmini" id="lbmini"></div>`;
  if (viewUnsub) viewUnsub();
  viewUnsub = mountMiniBoard(g, el.querySelector('#lbmini'));
  const btn = el.querySelector('#copybtn');
  btn.onclick = () => {
    const done = () => { btn.textContent = 'Copied'; setTimeout(() => btn.textContent = 'Copy result', 1800); };
    const fallback = () => { const r = document.createRange(); r.selectNodeContents(el.querySelector('#sharetext')); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); btn.textContent = 'Selected · press Ctrl+C or ⌘C'; };
    try { navigator.clipboard.writeText(res.share).then(done, fallback); } catch(e) { fallback(); }
  };
  setTimeout(() => el.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block:'nearest'}), 60);
}

function boot(){
  // carry today's results from older versions into the history log
  const h = history(); let changed = false;
  GAMES.forEach(g => { const r = store.get(resKey(g.id), null); if (r && !(h[DATE_KEY] && h[DATE_KEY][g.id])) { (h[DATE_KEY] = h[DATE_KEY] || {})[g.id] = {won:!!r.won, title:r.title, summary:r.summary, time:r.time||0, day:DAY_NO}; changed = true; } });
  if (changed) store.set(HKEY, h);
  route();
  initSocial();
}
