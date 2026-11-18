/* =================================================================
   LEADERBOARDS + CATEGORY AVERAGES
   Shared scores live in the artifact's db under lb/<viewer id>, one
   small document per player, rebuilt from that player's local history
   (so a write is always the whole truth, never an increment).
   Rules (declared at publish): everyone reads lb, each player writes
   only lb/<their id>, the owner can moderate.
   ================================================================= */
// How each game ranks after "won": by score (low or high), then time.
const RANKS = {
  linkage:{dir:'low', unit:'extra letters'}, cipher:{dir:'low', unit:'hints'}, ballpark:{dir:'low', unit:'guesses'},
  target:{dir:'low', unit:'away'}, putt:{dir:'low', unit:'strokes'}, timeline:{dir:'low', unit:'checks'},
  switch:{dir:'low', unit:'presses'}, lockpick:{dir:'low', unit:'tries'}, queens:{dir:'low', unit:'moves'},
  circuit:{dir:'low', unit:'turns'}, spill:{dir:'low', unit:'moves'}, recall:{dir:'low', unit:'moves'},
  sprint:{dir:'high', unit:'correct'}, shade:{dir:'high', unit:'rounds'}, keys:{dir:'high', unit:'wpm'},
  slide:{dir:'low', unit:'moves'}, maze:{dir:'low', unit:'moves'}, capitals:{dir:'high', unit:'/10'},
  bigger:{dir:'high', unit:'/10'}, sequence:{dir:'high', unit:'/5'}, seek:{dir:'low', unit:'reveals'},
  'deep-kitchen':{dir:'high', unit:'pts'}, 'deep-screen':{dir:'high', unit:'pts'}, 'deep-games':{dir:'high', unit:'pts'},
  pantry:{dir:'low', unit:'clues'}, credits:{dir:'low', unit:'clues'}, cartridge:{dir:'low', unit:'checks'}
};
const SOCIAL = {db:null, user:null, uid:null, canWrite:null, docs:[], mine:null, ready:false, state:'loading', subs:new Set(), chain:Promise.resolve(), synced:false};
const lbOff = () => { try { return localStorage.getItem('daybook:lb-off') === '1'; } catch(e){ return false; } };
function onSocial(fn){ SOCIAL.subs.add(fn); return () => SOCIAL.subs.delete(fn); }
function emitSocial(){ SOCIAL.subs.forEach(f => { try { f(); } catch(e){ console.error(e); } }); }

// Two backends share everything below: claude.ai's db capability (artifact)
// and a small /api/lb endpoint (standalone site, e.g. on Vercel).
async function initSocial(){
  const c = window.claude;
  if (c && typeof c.use === 'function') return initClaudeSocial();
  if (/^https?:$/.test(location.protocol)) return initHttpSocial();
  SOCIAL.state = 'off'; emitSocial();
}
async function initClaudeSocial(){
  SOCIAL.kind = 'claude';
  const c = window.claude;
  let db = null, user = null;
  try { [db, user] = await Promise.all([c.use('db'), c.use('user')]); } catch(e){}
  if (!db){ SOCIAL.state = 'off'; emitSocial(); return; }
  SOCIAL.db = db; SOCIAL.user = user;
  SOCIAL.write = doc => db.collection('lb').doc(SOCIAL.uid).set(doc);
  SOCIAL.remove = () => db.collection('lb').doc(SOCIAL.uid).delete();
  if (user){
    try { SOCIAL.uid = await user.id(); } catch(e){}
    try { SOCIAL.canWrite = await user.can('data.write'); } catch(e){}
  }
  const slow = setTimeout(() => { if (!SOCIAL.ready){ SOCIAL.state = SOCIAL.docs.length ? 'stale' : 'slow'; emitSocial(); } }, 10000);
  db.collection('lb').limit(1000).onSnapshot(snap => {
    SOCIAL.docs = snap.docs.filter(d => d.exists).map(d => ({uid:d.id, ...d.data()}));
    SOCIAL.mine = SOCIAL.docs.find(d => d.uid === SOCIAL.uid) || null;
    if (!snap.metadata.fromCache){ SOCIAL.ready = true; clearTimeout(slow); if (!SOCIAL.synced){ SOCIAL.synced = true; syncBoard(); } }
    SOCIAL.state = 'live'; emitSocial();
  }, () => { clearTimeout(slow); SOCIAL.state = 'error'; emitSocial(); });
}

/* ---------- standalone backend: GET/POST/DELETE /api/lb ---------- */
// The standalone page can point at a different endpoint via window.DAYBOOK_API.
const LB_API = (typeof window !== 'undefined' && typeof window.DAYBOOK_API === 'string') ? window.DAYBOOK_API : '/api/lb';
const myNick = () => { const n = store.get('daybook:nick', ''); return (typeof n === 'string' && n.trim()) ? n.trim().slice(0, 24) : ('Player ' + (SOCIAL.uid || '').slice(2, 6).toUpperCase()); };
async function initHttpSocial(){
  SOCIAL.kind = 'http';
  let token = store.get('daybook:token', null);
  if (typeof token !== 'string' || !/^[0-9a-f]{48}$/.test(token)){
    const a = new Uint8Array(24); crypto.getRandomValues(a);
    token = [...a].map(b => b.toString(16).padStart(2,'0')).join(''); store.set('daybook:token', token);
  }
  try {
    const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
    SOCIAL.uid = 'p_' + [...new Uint8Array(h)].map(b => b.toString(16).padStart(2,'0')).join('').slice(0, 22);
  } catch(e){ SOCIAL.state = 'off'; emitSocial(); return; }
  SOCIAL.canWrite = true;
  const upsert = d => { SOCIAL.docs = SOCIAL.docs.filter(x => x.uid !== d.uid).concat([d]); SOCIAL.mine = d; emitSocial(); };
  const call = (method, body) => fetch(LB_API, {method, headers:{'content-type':'application/json'}, body:JSON.stringify(body)})
    .then(async r => { const j = await r.json().catch(() => ({})); if (!r.ok) throw {code: r.status === 400 ? 'invalid_argument' : 'unavailable', status:r.status}; return j; });
  SOCIAL.write = doc => call('POST', {token, doc}).then(j => { if (j.doc) upsert(j.doc); });
  SOCIAL.remove = () => call('DELETE', {token}).then(() => { SOCIAL.docs = SOCIAL.docs.filter(x => x.uid !== SOCIAL.uid); SOCIAL.mine = null; emitSocial(); });
  const slow = setTimeout(() => { if (!SOCIAL.ready){ SOCIAL.state = 'slow'; emitSocial(); } }, 10000);
  const poll = async () => {
    if (document.hidden && SOCIAL.ready) return;
    try {
      const r = await fetch(LB_API, {cache:'no-store'});
      if (r.status === 503){ clearTimeout(slow); SOCIAL.state = 'nostore'; emitSocial(); return; }
      if (!r.ok) throw new Error(String(r.status));
      const j = await r.json();
      SOCIAL.docs = Array.isArray(j.docs) ? j.docs.filter(d => d && typeof d.uid === 'string') : [];
      SOCIAL.mine = SOCIAL.docs.find(d => d.uid === SOCIAL.uid) || null;
      SOCIAL.state = 'live';
      if (!SOCIAL.ready){ SOCIAL.ready = true; clearTimeout(slow); syncBoard(); }
      emitSocial();
    } catch(e){ if (!SOCIAL.ready){ clearTimeout(slow); SOCIAL.state = 'error'; } else SOCIAL.state = 'stale'; emitSocial(); }
  };
  await poll();
  setInterval(poll, 30000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) poll(); });
}

const packRes = r => { const o = {w: r.won ? 1 : 0, t: Math.round(r.time || 0)}; if (typeof r.score === 'number' && isFinite(r.score)) o.s = r.score; return o; };
function buildBoardDoc(){
  const h = history();
  const today = {}; Object.entries(h[DATE_KEY] || {}).forEach(([g,r]) => today[g] = packRes(r));
  const week = {};
  for (let i=0; i<7; i++){ const d = new Date(TODAY); d.setDate(d.getDate()-i); const k = keyOf(d); if (h[k]){ week[k] = {}; Object.entries(h[k]).forEach(([g,r]) => week[k][g] = packRes(r)); } }
  const totals = {};
  Object.keys(h).forEach(d => Object.entries(h[d]).forEach(([g,r]) => {
    const t = totals[g] || (totals[g] = {p:0, w:0, ts:0, tn:0, tb:0});
    t.p++; if (r.won) t.w++;
    if (r.time){ t.ts += Math.round(r.time); t.tn++; if (r.won && (!t.tb || r.time < t.tb)) t.tb = Math.round(r.time); }
  }));
  const doc = {v:1, date:DATE_KEY, today, week, totals, streak:dayStreak(), best:bestDayStreak(), ans:store.get(ansKey(), {})};
  if (SOCIAL.kind === 'http') doc.name = myNick();
  return doc;
}
// Write my document only when it differs from what the store holds.
function syncBoard(){
  if (!SOCIAL.write || !SOCIAL.uid || lbOff() || SOCIAL.canWrite === false || !SOCIAL.ready) return;
  const doc = buildBoardDoc();
  if (!Object.keys(doc.totals).length) return;
  const cur = SOCIAL.mine ? JSON.stringify({v:SOCIAL.mine.v, date:SOCIAL.mine.date, today:SOCIAL.mine.today, week:SOCIAL.mine.week, totals:SOCIAL.mine.totals, streak:SOCIAL.mine.streak, best:SOCIAL.mine.best, ans:SOCIAL.mine.ans || {}, name:SOCIAL.mine.name}) : '';
  if (cur === JSON.stringify(doc)) return;
  SOCIAL.chain = SOCIAL.chain.then(() => SOCIAL.write(doc)).catch(e => {
    if (e && e.code === 'invalid_argument'){ SOCIAL.canWrite = false; emitSocial(); }
  });
}
function leaveBoard(){
  if (!SOCIAL.remove || !SOCIAL.uid) return Promise.resolve();
  return SOCIAL.chain = SOCIAL.chain.then(() => SOCIAL.remove()).catch(() => {});
}

/* ---------- pooled answers (for rarity games) ----------
   A rarity game stores today's accepted answers with postAnswers(gid, ['0:basil', '1:penne', ...])
   before calling api.finish(); they ride along in the player's lb document.
   crowd(gid) counts other players' answers for today. */
const ansKey = () => 'daybook:answers:' + DATE_KEY;
function postAnswers(gid, list){ const a = store.get(ansKey(), {}); a[gid] = list.filter(x => typeof x === 'string').slice(0, 40).map(x => x.slice(0, 60)); store.set(ansKey(), a); }
function crowd(gid){
  const counts = new Map(); let players = 0;
  SOCIAL.docs.filter(d => d.date === DATE_KEY && d.uid !== SOCIAL.uid).forEach(d => {
    const l = d.ans && d.ans[gid]; if (!Array.isArray(l)) return; players++;
    new Set(l).forEach(x => { if (typeof x === 'string') counts.set(x, (counts.get(x) || 0) + 1); });
  });
  return {players, counts, live: SOCIAL.state === 'live'};
}

/* ---------- ranking helpers ---------- */
const todayDocs = () => SOCIAL.docs.filter(d => d.date === DATE_KEY && d.today);
function gameBoard(gid){
  const r = RANKS[gid];
  const rows = todayDocs().filter(d => d.today[gid]).map(d => ({uid:d.uid, ...d.today[gid]}));
  rows.sort((a,b) => (b.w - a.w)
    || (r && a.s != null && b.s != null ? (r.dir === 'low' ? a.s - b.s : b.s - a.s) : 0)
    || ((a.t || 9e15) - (b.t || 9e15)));
  return rows;
}
function fmtEntry(gid, e){
  const r = RANKS[gid], bits = [];
  if (r && e.s != null) bits.push(r.unit.startsWith('/') ? `${e.s}${r.unit}` : `${e.s} ${r.unit}`);
  if (e.t) bits.push(fmtTime(e.t));
  if (!e.w) bits.push('missed');
  return bits.join(' · ');
}
const ord = n => n + (['th','st','nd','rd'][(n%100-20)%10] || ['th','st','nd','rd'][n%100] || 'th');
function weekRows(){
  const keys = new Set(); for (let i=0;i<7;i++){ const d = new Date(TODAY); d.setDate(d.getDate()-i); keys.add(keyOf(d)); }
  return SOCIAL.docs.map(d => {
    let n = 0, w = 0, t = 0, days = 0;
    Object.entries(d.week || {}).forEach(([k, games]) => { if (!keys.has(k)) return; days++; Object.values(games).forEach(e => { n++; w += e.w; t += e.t || 0; }); });
    return {uid:d.uid, n, w, t, days};
  }).filter(r => r.n).sort((a,b) => b.w - a.w || b.n - a.n || a.t - b.t);
}
function allTimeRows(){
  return SOCIAL.docs.map(d => {
    let p = 0, w = 0; Object.values(d.totals || {}).forEach(t => { p += t.p; w += t.w; });
    return {uid:d.uid, p, w, best:d.best || 0, streak:(d.date === DATE_KEY || d.date === keyOf(new Date(TODAY.getTime()-864e5))) ? (d.streak || 0) : 0};
  }).filter(r => r.p).sort((a,b) => b.w - a.w || b.p - a.p);
}
// Category averages. Local: every finished game in your history. Everyone: today's finished games.
function localCategoryStats(){
  const h = history(), out = {};
  CATS.forEach(c => out[c.id] = {n:0, w:0, ts:0, tn:0});
  Object.values(h).forEach(day => Object.entries(day).forEach(([g, r]) => {
    const game = gameById(g); if (!game) return; const o = out[game.cat];
    o.n++; if (r.won) o.w++; if (r.time){ o.ts += r.time; o.tn++; }
  }));
  return out;
}
function everyoneCategoryToday(){
  const out = {};
  CATS.forEach(c => out[c.id] = {players:new Set(), n:0, w:0, ts:0, tn:0, mine:{n:0, ts:0, tn:0}});
  todayDocs().forEach(d => Object.entries(d.today).forEach(([g, e]) => {
    const game = gameById(g); if (!game) return; const o = out[game.cat];
    o.players.add(d.uid); o.n++; o.w += e.w; if (e.t){ o.ts += e.t; o.tn++; }
  }));
  const mineToday = history()[DATE_KEY] || {};
  Object.entries(mineToday).forEach(([g, r]) => { const game = gameById(g); if (!game) return; const m = out[game.cat].mine; m.n++; if (r.time){ m.ts += r.time; m.tn++; } });
  return out;
}
function everyoneCategoryAllTime(){
  const out = {}; CATS.forEach(c => out[c.id] = {ts:0, tn:0, p:0, w:0, players:new Set()});
  SOCIAL.docs.forEach(d => Object.entries(d.totals || {}).forEach(([g, t]) => {
    const game = gameById(g); if (!game) return; const o = out[game.cat];
    o.ts += t.ts || 0; o.tn += t.tn || 0; o.p += t.p || 0; o.w += t.w || 0; o.players.add(d.uid);
  }));
  return out;
}

/* ---------- names (resolved at render, never stored) ---------- */
async function fillNames(root){
  const els = [...root.querySelectorAll('[data-uid]')]; if (!els.length) return;
  const ids = [...new Set(els.map(e => e.dataset.uid))];
  let ps = {};
  if (SOCIAL.kind === 'http') SOCIAL.docs.forEach(d => { if (ids.includes(d.uid)) ps[d.uid] = {name: typeof d.name === 'string' ? d.name : ''}; });
  else try { if (SOCIAL.user) ps = await SOCIAL.user.profiles(ids); } catch(e){}
  els.forEach(e => {
    const id = e.dataset.uid;
    if (id === SOCIAL.uid){ e.textContent = 'You'; e.classList.add('me'); return; }
    e.textContent = (ps[id] && ps[id].name) || 'A player';
    const img = e.parentElement && e.parentElement.querySelector('img.av');
    if (img && ps[id] && ps[id].avatarUrl) img.src = ps[id].avatarUrl;
  });
}
function socialNote(){
  if (SOCIAL.state === 'off') return SOCIAL.kind === 'http' ? 'Leaderboards need a secure (https) connection.' : 'Leaderboards appear when this page is opened on claude.ai while signed in, or on the hosted site.';
  if (SOCIAL.state === 'nostore') return 'Leaderboards aren’t switched on for this site yet. The site owner needs to connect a database.';
  if (SOCIAL.state === 'loading') return 'Loading scores…';
  if (SOCIAL.state === 'slow') return 'Scores can’t be reached yet. They’ll appear when the connection catches up.';
  if (SOCIAL.state === 'stale') return 'Showing saved scores. They may be out of date.';
  if (SOCIAL.state === 'error') return 'Scores couldn’t load in this view.';
  if (lbOff()) return 'You’ve hidden yourself from the boards. Your scores stay in this browser.';
  if (SOCIAL.canWrite === false) return 'You can see the boards. To post your own scores, ask the page’s owner for Contributor access.';
  return '';
}
const avRow = (uid) => `<img class="av" alt="" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="><span class="nm" data-uid="${esc(uid)}">…</span>`;

/* ---------- mini board on a game's result panel ---------- */
function mountMiniBoard(g, el){
  const paint = () => {
    if (!el.isConnected) return;
    const rows = gameBoard(g.id);
    const note = socialNote();
    if (SOCIAL.state !== 'live' && SOCIAL.state !== 'stale'){ el.innerHTML = `<div class="lb-head"><h3>Today’s leaderboard</h3></div><p class="hint left">${esc(note)}</p>`; return; }
    const meIdx = rows.findIndex(r => r.uid === SOCIAL.uid);
    const top = rows.slice(0, 5);
    el.innerHTML = `<div class="lb-head"><h3>Today’s leaderboard</h3><span class="label">${rows.length ? (meIdx >= 0 ? `You’re ${ord(meIdx+1)} of ${rows.length}` : plural(rows.length,'player')) : ''}</span></div>
      ${rows.length ? `<ol class="lb">${top.map((r,i) => `<li class="${r.uid===SOCIAL.uid?'mine':''}"><span class="rk">${i+1}</span>${avRow(r.uid)}<span class="sc">${esc(fmtEntry(g.id, r))}</span></li>`).join('')}
        ${meIdx >= 5 ? `<li class="mine gap"><span class="rk">${meIdx+1}</span>${avRow(rows[meIdx].uid)}<span class="sc">${esc(fmtEntry(g.id, rows[meIdx]))}</span></li>` : ''}</ol>`
        : `<p class="hint left">No one has posted a score yet today.</p>`}
      ${note ? `<p class="hint left">${esc(note)}</p>` : ''}
      <a class="lb-more" href="#leaders">All leaderboards →</a>`;
    fillNames(el);
  };
  paint();
  return onSocial(paint);
}

/* ---------- leaderboards page ---------- */
let lbTab = 'today', lbGame = null;
function renderLeaders(){
  document.documentElement.style.removeProperty('--gc');
  try { lbTab = localStorage.getItem('daybook:lb-tab') || 'today'; } catch(e){}
  app.innerHTML = `
  <header class="mast compact">
    ${masthead('leaders')}
    <h1 class="date sm">Leaderboards</h1>
    <div class="mast-row"><p class="lede" id="lb-note">Everyone plays the same puzzles, so scores line up. Ranked by result first, then score, then time.</p>
      <div class="lb-me">${SOCIAL.kind === 'http' ? `<form class="lb-nick" id="lb-nick"><label for="lb-nick-in" class="label">Your name on the boards</label><div class="row"><input id="lb-nick-in" maxlength="24" autocomplete="nickname" value="${esc(myNick())}"><button class="btn" type="submit">Save</button></div></form>` : ''}
      <label class="lb-opt"><input type="checkbox" id="lb-show" ${lbOff()?'':'checked'}> Show me on the boards</label></div></div>
  </header>
  <div class="filters" role="tablist" aria-label="Period">${[['today','Today'],['week','This week'],['all','All time']].map(([id,n]) => `<button class="fchip ${lbTab===id?'on':''}" data-t="${id}" role="tab" aria-selected="${lbTab===id}">${n}</button>`).join('')}</div>
  <div id="lb-body"></div>`;
  app.querySelector('.filters').onclick = e => {
    const b = e.target.closest('[data-t]'); if (!b) return; lbTab = b.dataset.t;
    try { localStorage.setItem('daybook:lb-tab', lbTab); } catch(e){}
    app.querySelectorAll('[data-t]').forEach(x => { x.classList.toggle('on', x.dataset.t === lbTab); x.setAttribute('aria-selected', String(x.dataset.t === lbTab)); });
    paint();
  };
  document.getElementById('lb-show').onchange = async e => {
    try { localStorage.setItem('daybook:lb-off', e.target.checked ? '0' : '1'); } catch(err){}
    if (e.target.checked) syncBoard(); else await leaveBoard();
    paint();
  };
  const nick = document.getElementById('lb-nick');
  if (nick) nick.onsubmit = e => {
    e.preventDefault();
    const v = document.getElementById('lb-nick-in').value.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 24);
    store.set('daybook:nick', v); document.getElementById('lb-nick-in').value = myNick();
    syncBoard(); const b = nick.querySelector('button'); b.textContent = 'Saved'; setTimeout(() => b.textContent = 'Save', 1500);
  };
  const body = document.getElementById('lb-body');
  function paint(){
    if (!body.isConnected) return;
    const note = socialNote();
    if (SOCIAL.state !== 'live' && SOCIAL.state !== 'stale'){ body.innerHTML = `<p class="empty">${esc(note)}</p>` + localCatSection(); return; }
    let html = note ? `<p class="hint left lb-warn">${esc(note)}</p>` : '';
    if (lbTab === 'today'){
      const tr = todayDocs().map(d => { const es = Object.values(d.today); return {uid:d.uid, n:es.length, w:es.reduce((a,e)=>a+e.w,0), t:es.reduce((a,e)=>a+(e.t||0),0)}; }).filter(r => r.n).sort((a,b) => b.w - a.w || b.n - a.n || a.t - b.t);
      html += board('Most puzzles won today', tr, r => `${r.w} won · ${r.n} played`, r => fmtTime(r.t));
      html += everyoneCatSection();
      const played = GAMES.filter(g => gameBoard(g.id).length);
      if (!lbGame || !gameById(lbGame)) lbGame = (played.find(g => store.get(resKey(g.id), null)) || played[0] || GAMES[0]).id;
      const rows = gameBoard(lbGame);
      html += `<section class="hsec"><div class="cat-head"><h2>By game</h2><label class="lb-sel"><span class="label">Game</span>
        <select id="lb-game">${CATS.map(c => `<optgroup label="${esc(c.name)}">${GAMES.filter(g => g.cat === c.id).map(g => `<option value="${g.id}" ${g.id===lbGame?'selected':''}>${esc(g.name)} (${gameBoard(g.id).length})</option>`).join('')}</optgroup>`).join('')}</select></label></div>
        ${rows.length ? `<ol class="lb big">${rows.slice(0,25).map((r,i) => `<li class="${r.uid===SOCIAL.uid?'mine':''}"><span class="rk">${i+1}</span>${avRow(r.uid)}<span class="sc">${esc(fmtEntry(lbGame, r))}</span></li>`).join('')}</ol>` : `<p class="empty">No scores for ${esc(gameById(lbGame).name)} yet today.</p>`}
      </section>`;
    } else if (lbTab === 'week'){
      html += board('Most puzzles won in the last 7 days', weekRows(), r => `${r.w} won · ${r.n} played · ${plural(r.days,'day')}`, r => fmtTime(r.t));
      html += everyoneCatAllSection();
    } else {
      const rows = allTimeRows();
      html += board('Most puzzles won, all time', rows, r => `${r.w} won · ${r.p} played`, r => `${r.p ? Math.round(100*r.w/r.p) : 0}%`);
      html += board('Longest day streak', rows.filter(r => r.best).sort((a,b) => b.best - a.best || b.streak - a.streak), r => `best ${plural(r.best,'day')}`, r => r.streak ? `now ${r.streak}` : '');
      html += everyoneCatAllSection();
    }
    body.innerHTML = html;
    const sel = document.getElementById('lb-game'); if (sel) sel.onchange = () => { lbGame = sel.value; paint(); };
    fillNames(body);
  }
  function board(title, rows, mid, right){
    return `<section class="hsec"><div class="cat-head"><h2>${esc(title)}</h2><span class="label">${plural(rows.length,'player')}</span></div>
      ${rows.length ? `<ol class="lb big">${rows.slice(0,25).map((r,i) => `<li class="${r.uid===SOCIAL.uid?'mine':''}"><span class="rk">${i+1}</span>${avRow(r.uid)}<span class="sc">${esc(mid(r))}</span><span class="tm">${esc(right(r))}</span></li>`).join('')}</ol>` : `<p class="empty">No scores yet. Finish a puzzle to get on the board.</p>`}</section>`;
  }
  paint();
  return onSocial(paint);
}
function everyoneCatSection(){
  const o = everyoneCategoryToday();
  return `<section class="hsec"><div class="cat-head"><h2>Category averages today</h2><span class="label">Everyone vs you</span></div>
    <div class="tbl-wrap"><table class="htbl"><thead><tr><th>Category</th><th>Players</th><th>Finished</th><th>Won</th><th>Avg time</th><th>Your avg</th></tr></thead><tbody>
    ${CATS.map(c => { const x = o[c.id]; const mine = x.mine.tn ? x.mine.ts/x.mine.tn : 0, all = x.tn ? x.ts/x.tn : 0;
      return `<tr style="--gc:var(--c-${c.id})"><td><span class="cn"><i class="dot"></i>${esc(c.name)}</span></td><td>${x.players.size}</td><td>${x.n}</td><td>${x.n ? Math.round(100*x.w/x.n)+'%' : '·'}</td><td>${all ? fmtTime(all) : '·'}</td><td class="${mine && all ? (mine <= all ? 'fast' : 'slow') : ''}">${mine ? fmtTime(mine) : '·'}</td></tr>`; }).join('')}
    </tbody></table></div></section>`;
}
function everyoneCatAllSection(){
  const o = everyoneCategoryAllTime(), me = localCategoryStats();
  return `<section class="hsec"><div class="cat-head"><h2>Category averages, all time</h2><span class="label">Everyone vs you</span></div>
    <div class="tbl-wrap"><table class="htbl"><thead><tr><th>Category</th><th>Players</th><th>Games</th><th>Won</th><th>Avg time</th><th>Your avg</th><th>Your win rate</th></tr></thead><tbody>
    ${CATS.map(c => { const x = o[c.id], m = me[c.id]; const all = x.tn ? x.ts/x.tn : 0, mine = m.tn ? m.ts/m.tn : 0;
      return `<tr style="--gc:var(--c-${c.id})"><td><span class="cn"><i class="dot"></i>${esc(c.name)}</span></td><td>${x.players.size}</td><td>${x.p}</td><td>${x.p ? Math.round(100*x.w/x.p)+'%' : '·'}</td><td>${all ? fmtTime(all) : '·'}</td><td class="${mine && all ? (mine <= all ? 'fast' : 'slow') : ''}">${mine ? fmtTime(mine) : '·'}</td><td>${m.n ? Math.round(100*m.w/m.n)+'%' : '·'}</td></tr>`; }).join('')}
    </tbody></table></div></section>`;
}
function localCatSection(){
  const me = localCategoryStats();
  return `<section class="hsec"><div class="cat-head"><h2>Your category averages</h2><span class="label">From this browser</span></div>
    <div class="tbl-wrap"><table class="htbl"><thead><tr><th>Category</th><th>Games</th><th>Won</th><th>Avg time</th><th>Total time</th></tr></thead><tbody>
    ${CATS.map(c => { const m = me[c.id]; return `<tr style="--gc:var(--c-${c.id})"><td><span class="cn"><i class="dot"></i>${esc(c.name)}</span></td><td>${m.n}</td><td>${m.n ? Math.round(100*m.w/m.n)+'%' : '·'}</td><td>${m.tn ? fmtTime(m.ts/m.tn) : '·'}</td><td>${m.ts ? fmtTime(m.ts) : '·'}</td></tr>`; }).join('')}
    </tbody></table></div></section>`;
}
