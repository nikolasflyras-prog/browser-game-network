/* Memory, speed and movement games: Recall, Sprint, Shade, Keys, Slide, Maze */

css(`
/* Recall */
.recall-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;max-width:400px;width:100%;margin:0 auto}
.recall-card{aspect-ratio:4/5;max-width:100%;border-radius:10px;border:2px solid var(--line);background:color-mix(in srgb,var(--gc) 14%,var(--surface));cursor:pointer;display:grid;place-items:center;padding:0;color:var(--gc);transition:transform .18s ease,background .18s ease}
.recall-card .recall-back{width:36%;height:36%;border-radius:50%;border:2.5px dashed color-mix(in srgb,var(--gc) 45%,var(--surface))}
.recall-card svg{width:58%;height:58%;display:none}
.recall-card.open,.recall-card.done{background:var(--surface);border-color:var(--gc);transform:rotateY(0)}
.recall-card.open svg,.recall-card.done svg{display:block}
.recall-card.open .recall-back,.recall-card.done .recall-back{display:none}
.recall-card.done{opacity:.45;border-color:var(--line);cursor:default}
.recall-card.miss{border-color:var(--bad)}
.recall-top{display:flex;justify-content:space-between;align-items:baseline;font:700 16px var(--f-mono);max-width:400px;margin:0 auto;width:100%}
.recall-top span{color:var(--muted);font-weight:500}
/* Sprint */
.sprint-wrap{display:grid;gap:14px;max-width:400px;margin:0 auto;width:100%}
.sprint-bar{height:10px;border-radius:5px;background:var(--line);overflow:hidden}
.sprint-bar i{display:block;height:100%;background:var(--gc);width:100%}
.sprint-q{background:var(--surface);border:1px solid var(--line);border-radius:var(--r);padding:22px 16px;text-align:center;display:grid;gap:8px}
.sprint-q b{font:700 clamp(40px,11vw,56px)/1 var(--f-mono);font-variant-numeric:tabular-nums}
.sprint-ans{font:700 34px/1.1 var(--f-mono);color:var(--gc);min-height:40px;font-variant-numeric:tabular-nums}
.sprint-meta{display:flex;justify-content:space-between;font:700 16px var(--f-mono)}
.sprint-meta span{color:var(--muted);font-weight:500}
.sprint-pad{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.sprint-pad button{height:54px;border-radius:10px;border:0;background:var(--sunk);font:700 22px var(--f-mono);cursor:pointer}
.sprint-pad button.sprint-skip{font:700 15px var(--f-body)}
.sprint-q.sprint-ok{border-color:var(--good)}
/* Shade */
.shade-top{display:flex;justify-content:space-between;align-items:center;font:700 16px var(--f-mono);max-width:400px;width:100%;margin:0 auto}
.shade-top span{color:var(--muted);font-weight:500}
.shade-lives{display:flex;gap:5px}
.shade-lives i{width:14px;height:14px;border-radius:50%;border:2px solid var(--gc);display:block}
.shade-lives i.on{background:var(--gc)}
.shade-grid{display:grid;gap:6px;max-width:400px;width:100%;margin:0 auto;aspect-ratio:1}
.shade-cell{border:0;border-radius:8px;cursor:pointer;padding:0;min-width:0;min-height:0}
.shade-cell.shade-wrong{outline:3px solid var(--bad);outline-offset:-3px}
.shade-cell.shade-hit{outline:3px solid var(--ink);outline-offset:-3px}
/* Keys */
.keys-box{position:relative;background:var(--surface);border:1px solid var(--line);border-radius:var(--r);padding:18px 16px;cursor:text}
.keys-box.keys-focus{border-color:var(--gc)}
.keys-text{font:500 19px/1.7 var(--f-mono);overflow-wrap:break-word;word-break:normal;margin:0;color:var(--muted)}
.keys-text .ok{color:var(--ink)}
.keys-text .no{color:var(--bad);background:color-mix(in srgb,var(--bad) 15%,var(--surface));border-radius:2px}
.keys-text .cur{box-shadow:inset 0 -3px 0 var(--gc);color:var(--ink)}
.keys-in{position:absolute;inset:0;opacity:0;font-size:16px;resize:none;border:0;background:transparent;color:transparent;caret-color:transparent;width:100%;height:100%}
.keys-stats{display:flex;gap:22px;flex-wrap:wrap;font:700 18px var(--f-mono);font-variant-numeric:tabular-nums}
.keys-stats span{display:grid;gap:2px}
@media (max-width:420px){.keys-text{font-size:16px}}
/* Slide */
.slide-board{position:relative;width:100%;max-width:400px;aspect-ratio:1;margin:0 auto;background:var(--sunk);border-radius:var(--r);padding:0;overflow:hidden}
.slide-tile{position:absolute;left:0;top:0;width:25%;height:25%;padding:4px;border:0;background:none;cursor:pointer;transition:transform .14s ease}
.slide-tile span{display:grid;place-items:center;width:100%;height:100%;border-radius:10px;background:var(--surface);border:2px solid var(--line);font:700 clamp(22px,6vw,30px) var(--f-mono);color:var(--ink)}
.slide-tile.home span{border-color:color-mix(in srgb,var(--gc) 60%,var(--line));color:var(--gc)}
.slide-board.slide-solved .slide-tile span{background:var(--gc);color:var(--on-gc);border-color:var(--gc)}
.slide-top{display:flex;justify-content:space-between;font:700 16px var(--f-mono);max-width:400px;width:100%;margin:0 auto}
.slide-top span{color:var(--muted);font-weight:500}
@media (prefers-reduced-motion:reduce){.slide-tile{transition:none}}
/* Maze */
.maze-wrap{display:grid;gap:12px;justify-items:center}
.maze-stage{width:100%;max-width:440px}
.maze-stage canvas{display:block;width:100%;height:auto;aspect-ratio:1;touch-action:none;border-radius:10px}
.maze-top{display:flex;justify-content:space-between;font:700 16px var(--f-mono);max-width:440px;width:100%}
.maze-top span{color:var(--muted);font-weight:500}
.maze-pad{display:grid;grid-template-columns:repeat(3,56px);grid-template-rows:repeat(2,48px);gap:6px}
.maze-pad button{border-radius:10px;border:0;background:var(--sunk);font-size:18px;cursor:pointer}
.maze-pad .u{grid-column:2;grid-row:1}.maze-pad .l{grid-column:1;grid-row:2}.maze-pad .d{grid-column:2;grid-row:2}.maze-pad .r{grid-column:3;grid-row:2}
`);

const starStr = n => '★'.repeat(n) + '☆'.repeat(3-n);

/* =================================================================
   RECALL — memory pairs
   ================================================================= */
const RECALL_SYMS = [
  '<circle cx="20" cy="20" r="13"/>',
  '<rect x="8" y="8" width="24" height="24" rx="2"/>',
  '<path d="M20 5 35 32H5z"/>',
  '<path d="M20 3 37 20 20 37 3 20z"/>',
  '<path d="M20 3l4.9 10.6 11.6 1.2-8.7 7.8 2.6 11.4L20 28.1 9.6 34l2.6-11.4-8.7-7.8 11.6-1.2z"/>',
  '<path d="M12 6h16l8 14-8 14H12L4 20z"/>',
  '<path d="M15 5h10v10h10v10H25v10H15V25H5V15h10z"/>',
  '<circle cx="20" cy="20" r="11" fill="none" stroke="currentColor" stroke-width="6"/>',
  '<path d="M27 4a16 16 0 1 0 0 32 12.5 12.5 0 1 1 0-32z"/>',
  '<path d="M24 2 7 23h11l-3 15 18-22H22z"/>'
];
const RECALL_NAMES = ['circle','square','triangle','diamond','star','hexagon','plus','ring','moon','bolt'];
function mountRecall(el, api){
  const r = api.rng();
  const deck = shuffle([...Array(10).keys(), ...Array(10).keys()], r);
  let st = api.load(() => ({matched:Array(20).fill(false), moves:0, started:false}));
  let open = [], lock = false, miss = [], timer = 0;
  const fin = () => !!api.existing();
  const svg = i => `<svg viewBox="0 0 40 40" fill="currentColor" aria-hidden="true">${RECALL_SYMS[deck[i]]}</svg>`;
  function render(){
    const f = fin(); const pairs = st.matched.filter(Boolean).length/2;
    el.innerHTML = `
      <div class="recall-top"><b>${st.moves} <span>moves</span></b><b>${pairs}<span> of 10 pairs</span></b><b><span>par </span>16</b></div>
      <div class="recall-grid" id="recall-grid">${deck.map((_,i) => {
        const isOpen = open.includes(i) || f, done = st.matched[i];
        const cls = ['recall-card', done ? 'done' : '', isOpen && !done ? 'open' : '', miss.includes(i) ? 'miss' : ''].join(' ');
        return `<button class="${cls}" data-i="${i}" aria-label="${done || isOpen ? RECALL_NAMES[deck[i]] : 'Face-down card ' + (i+1)}" ${done || f ? 'disabled' : ''}><span class="recall-back"></span>${svg(i)}</button>`;
      }).join('')}</div>
      <p class="hint">Clear the board in 24 moves or fewer to keep your streak.</p>`;
    if (!f) el.querySelector('#recall-grid').onclick = e => { const b = e.target.closest('.recall-card'); if (b) flip(+b.dataset.i); };
  }
  function flip(i){
    if (lock || st.matched[i] || open.includes(i)) return;
    if (!st.started){ st.started = true; api.save(st); }
    open.push(i); miss = [];
    if (open.length === 2){
      st.moves++;
      const [a,b] = open;
      if (deck[a] === deck[b]){ st.matched[a] = st.matched[b] = true; open = []; api.save(st); check(); }
      else { lock = true; miss = [a,b]; api.save(st); timer = setTimeout(() => { open = []; miss = []; lock = false; render(); }, 800); }
    }
    render();
  }
  function check(){
    if (!st.matched.every(Boolean)) return;
    const m = st.moves, stars = m <= 16 ? 3 : m <= 20 ? 2 : m <= 24 ? 1 : 0;
    api.finish({score: m, won: m <= 24, title: m <= 12 ? 'Photographic' : m <= 16 ? 'Sharp memory' : m <= 24 ? 'Cleared' : 'Cleared, slowly',
      detail:`You matched all 10 pairs in ${m} moves. Par is 16.`, summary:`${m} moves`,
      share:`Daybook Recall No. ${DAY_NO}\n${starStr(stars)}  ${m} moves (par 16)`});
  }
  render();
  if (fin()) api.show(api.existing());
  return () => clearTimeout(timer);
}

/* =================================================================
   SPRINT — 60 seconds of mental arithmetic
   ================================================================= */
function sprintProblems(r){
  const ri = (a,b) => a + Math.floor(r()*(b-a+1));
  const out = [];
  for (let i=0; i<60; i++){
    const d = Math.min(4, Math.floor(i/8));
    const op = ['+','−','×','÷'][ri(0,3)];
    let a, b, ans;
    if (op === '+'){ const R = [[1,9,1,9],[5,30,2,9],[10,60,10,40],[20,99,11,99],[100,500,20,99]][d]; a = ri(R[0],R[1]); b = ri(R[2],R[3]); ans = a+b; }
    else if (op === '−'){ const R = [[2,18],[10,50],[20,99],[50,150],[100,500]][d]; a = ri(R[0],R[1]); b = ri(1, a-1); ans = a-b; }
    else if (op === '×'){ const R = [[2,5,2,6],[2,9,2,9],[3,12,3,12],[6,15,4,12],[11,25,3,9]][d]; a = ri(R[0],R[1]); b = ri(R[2],R[3]); ans = a*b; }
    else { const R = [[2,5,1,5],[2,9,2,9],[3,12,3,12],[4,15,5,12],[6,20,6,15]][d]; b = ri(R[0],R[1]); ans = ri(R[2],R[3]); a = b*ans; }
    out.push({text:`${a} ${op} ${b}`, ans});
  }
  return out;
}
function mountSprint(el, api){
  const LEN = 60000;
  const probs = sprintProblems(api.rng());
  let st = api.load(() => ({startedAt:null, idx:0, score:0, skipped:0, started:false}));
  let typed = '', tick = 0, flash = false;
  const fin = () => !!api.existing();
  const left = () => st.startedAt ? Math.max(0, LEN - (Date.now() - st.startedAt)) : LEN;
  function end(early){
    if (fin()) return;
    clearInterval(tick);
    const s = st.score;
    api.finish({score: s, won: s >= 15, title: s >= 30 ? 'Lightning' : s >= 22 ? 'Quick thinker' : s >= 15 ? 'Solid sprint' : early ? 'Run cut short' : 'Time’s up',
      detail: early ? `The page reloaded mid-run, so the sprint ended at ${s} correct.` : `${plural(s,'correct answer')} and ${st.skipped} skipped in 60 seconds. 15 keeps your streak.`,
      summary:`${s} correct`, share:`Daybook Sprint No. ${DAY_NO}\n⚡ ${s} correct in 60 s · ${st.skipped} skipped`});
    render();
  }
  function render(){
    const f = fin();
    if (!st.startedAt && !f){
      el.innerHTML = `<div class="sprint-wrap">
        <div class="sprint-q"><span class="label">60 seconds</span><b>Ready?</b><p class="hint" style="margin:0">Type each answer. It moves on by itself when you’re right. You get one run, so don’t reload mid-sprint.</p></div>
        <button class="btn primary" id="sprint-go" style="min-height:56px;font-size:18px">Start the clock</button></div>`;
      el.querySelector('#sprint-go').onclick = begin;
      return;
    }
    const p = probs[Math.min(st.idx, probs.length-1)];
    el.innerHTML = `<div class="sprint-wrap">
      <div class="sprint-bar" aria-hidden="true"><i id="sprint-bar" style="width:${100*left()/LEN}%"></i></div>
      <div class="sprint-meta"><b id="sprint-left">${Math.ceil(left()/1000)}<span> s</span></b><b>${st.score}<span> correct</span></b></div>
      <div class="sprint-q ${flash?'sprint-ok':''}" aria-live="polite">${f ? `<span class="label">Final score</span><b>${st.score}</b>` : `<b>${esc(p.text)}</b><div class="sprint-ans" id="sprint-ans">${esc(typed) || '&nbsp;'}</div>`}</div>
      ${f ? '' : `<div class="sprint-pad" id="sprint-pad">${[1,2,3,4,5,6,7,8,9].map(n=>`<button data-k="${n}">${n}</button>`).join('')}<button class="sprint-skip" data-k="skip">Skip</button><button data-k="0">0</button><button data-k="del" aria-label="Delete">⌫</button></div>`}
    </div>`;
    if (!f) el.querySelector('#sprint-pad').onclick = e => { const b = e.target.closest('button'); if (b) key(b.dataset.k); };
  }
  function begin(){
    st.startedAt = Date.now(); st.started = true; api.save(st); api.start();
    tick = setInterval(update, 100);
    render();
  }
  function update(){
    const l = left();
    const bar = el.querySelector('#sprint-bar'), lt = el.querySelector('#sprint-left');
    if (bar) bar.style.width = (100*l/LEN) + '%';
    if (lt) lt.innerHTML = `${Math.ceil(l/1000)}<span> s</span>`;
    if (l <= 0) end(false);
  }
  function key(k){
    if (fin() || !st.startedAt || left() <= 0) return;
    const p = probs[st.idx];
    if (k === 'skip'){ st.idx++; st.skipped++; typed = ''; flash = false; }
    else if (k === 'del'){ typed = typed.slice(0,-1); }
    else if (/^\d$/.test(k) && typed.length < 6){
      typed += k;
      if (parseInt(typed,10) === p.ans){ st.score++; st.idx++; typed = ''; flash = true; setTimeout(() => { flash = false; const q = el.querySelector('.sprint-q'); if (q) q.classList.remove('sprint-ok'); }, 250); }
    }
    if (st.idx >= probs.length){ api.save(st); end(false); return; }
    api.save(st); render();
  }
  const onKey = e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (/^\d$/.test(e.key)){ e.preventDefault(); key(e.key); }
    else if (e.key === 'Backspace'){ e.preventDefault(); key('del'); }
    else if (e.key === 'Enter' && !st.startedAt && !fin()){ e.preventDefault(); begin(); }
    else if (e.key === ' ' && st.startedAt){ e.preventDefault(); key('skip'); }
  };
  document.addEventListener('keydown', onKey);
  render();
  if (fin()) api.show(api.existing());
  else if (st.startedAt) end(left() > 0);
  return () => { document.removeEventListener('keydown', onKey); clearInterval(tick); };
}

/* =================================================================
   SHADE — find the odd shade
   ================================================================= */
const SHADE_SIZES = [2,2,3,3,4,4,5,5,5,6,6,6,7,7,7];
function shadeRounds(r){
  return SHADE_SIZES.map((n,i) => {
    const h = Math.floor(r()*360), s = 50 + Math.floor(r()*25), l = 44 + Math.floor(r()*14);
    const delta = 16 - i*(12.5/14);
    const sign = r() < .5 ? -1 : 1;
    const l2 = clamp(l + sign*delta, 22, 80);
    return {n, odd: Math.floor(r()*n*n), base:`hsl(${h} ${s}% ${l}%)`, diff:`hsl(${h} ${s}% ${l2.toFixed(1)}%)`};
  });
}
function mountShade(el, api){
  const rounds = shadeRounds(api.rng());
  const TOTAL = rounds.length, LIVES = 3;
  let st = api.load(() => ({round:0, lives:LIVES, started:false}));
  let wrongAt = -1;
  const fin = () => !!api.existing();
  function render(){
    const f = fin();
    const R = rounds[Math.min(st.round, TOTAL-1)];
    el.innerHTML = `
      <div class="shade-top"><b>Round ${Math.min(st.round+1, TOTAL)}<span> of ${TOTAL}</span></b><span class="shade-lives" aria-label="${st.lives} lives left">${Array.from({length:LIVES},(_,i)=>`<i class="${i<st.lives?'on':''}"></i>`).join('')}</span></div>
      <div class="shade-grid" id="shade-grid" style="grid-template-columns:repeat(${R.n},1fr);grid-template-rows:repeat(${R.n},1fr)">${Array.from({length:R.n*R.n},(_,i) => `<button class="shade-cell ${i===wrongAt?'shade-wrong':''} ${f && i===R.odd?'shade-hit':''}" data-i="${i}" style="background:${i===R.odd?R.diff:R.base}" aria-label="Square ${i+1}" ${f?'disabled':''}></button>`).join('')}</div>
      <p class="hint">${f ? 'The outlined square was the odd one.' : 'One square is a slightly different shade. Tap it.'}</p>`;
    if (!f) el.querySelector('#shade-grid').onclick = e => { const b = e.target.closest('.shade-cell'); if (b) tap(+b.dataset.i); };
  }
  function tap(i){
    if (!st.started) st.started = true;
    const R = rounds[st.round];
    if (i === R.odd){ st.round++; wrongAt = -1; api.save(st); if (st.round >= TOTAL) return done(); render(); return; }
    st.lives--; wrongAt = i; api.save(st);
    if (st.lives <= 0) return done();
    render();
    const g = el.querySelector('#shade-grid'); if (g) g.classList.add('shake');
  }
  function done(){
    const s = st.round;
    if (s >= TOTAL) st.round = TOTAL - 1; // keep the last board on screen
    api.save(st);
    api.finish({score: s, won: s >= 10, title: s >= TOTAL ? 'Eagle eye' : s >= 10 ? 'Keen eye' : 'Colours blurred',
      detail:`You cleared ${s} of ${TOTAL} rounds with ${plural(LIVES - Math.max(0,st.lives),'miss','misses')}. Ten keeps your streak.`,
      summary:`${s}/${TOTAL}`,
      share:`Daybook Shade No. ${DAY_NO}\n🎨 ${s}/${TOTAL} rounds · ${'●'.repeat(Math.max(0,st.lives))}${'○'.repeat(LIVES-Math.max(0,st.lives))}`});
    render();
  }
  render();
  if (fin()) api.show(api.existing());
}

/* =================================================================
   KEYS — typing
   ================================================================= */
const KEYS_LINES = [
  'A stitch in time saves nine.','Still waters run deep.','The early bird catches the worm.','Look before you leap.',
  'Practice makes perfect.','Haste makes waste.','A rolling stone gathers no moss.','Every dog has its day.',
  'Birds of a feather flock together.','Make hay while the sun shines.','Out of sight, out of mind.','No news is good news.',
  'All roads lead to Rome.','Honesty is the best policy.','Knowledge is power.','The pen is mightier than the sword.',
  'Brevity is the soul of wit.','Well begun is half done.','Necessity is the mother of invention.','Many hands make light work.',
  'An apple a day keeps the doctor away.','Better late than never.','Two heads are better than one.','Easy come, easy go.',
  'Fortune favors the bold.','A picture is worth a thousand words.','Great minds think alike.','Time is money.',
  'Hope springs eternal in the human breast.','The quality of mercy is not strained.','All the world is a stage.','Lost time is never found again.',
  'Well done is better than well said.','He that lies down with dogs shall rise up with fleas.','Little strokes fell great oaks.',
  'There is nothing new under the sun.','The squeaky wheel gets the grease.','When the cat is away, the mice will play.',
  'You cannot judge a book by its cover.','Where there is smoke, there is fire.','Slow and steady wins the race.','Patience is a virtue.'
];
function mountKeys(el, api){
  const r = api.rng();
  const order = shuffle(KEYS_LINES.slice(), r);
  const parts = []; let words = 0;
  for (const line of order){ const w = line.split(' ').length; if (words >= 25) break; if (words + w > 35) continue; parts.push(line); words += w; }
  const text = parts.join(' ');
  let st = api.load(() => ({typed:'', keys:0, errors:0, started:false}));
  const fin = () => !!api.existing();
  const stats = () => {
    const ms = Math.max(1000, api.elapsed());
    let correct = 0; for (let i=0;i<st.typed.length;i++) if (st.typed[i] === text[i]) correct++;
    const wpm = Math.round((correct/5) / (ms/60000));
    const acc = st.keys ? Math.round(100*(st.keys - st.errors)/st.keys) : 100;
    return {wpm, acc, correct};
  };
  el.innerHTML = `
    <div class="keys-stats"><span><span class="label">Progress</span><b id="keys-prog">0%</b></span><span><span class="label">Speed</span><b id="keys-wpm">0 wpm</b></span><span><span class="label">Accuracy</span><b id="keys-acc">100%</b></span></div>
    <div class="keys-box" id="keys-box">
      <p class="keys-text" id="keys-text"></p>
      <textarea class="keys-in" id="keys-in" aria-label="Type the passage here" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"></textarea>
    </div>
    <p class="hint" id="keys-hint">Tap the passage and start typing. The clock starts with your first key. 90% accuracy keeps your streak.</p>`;
  const box = el.querySelector('#keys-box'), ta = el.querySelector('#keys-in'), out = el.querySelector('#keys-text');
  ta.value = st.typed;
  function paint(){
    const t = st.typed;
    let html = '';
    for (let i=0;i<text.length;i++){
      const c = esc(text[i]);
      if (i < t.length) html += `<span class="${t[i] === text[i] ? 'ok' : 'no'}">${c}</span>`;
      else if (i === t.length && !fin()) html += `<span class="cur">${c}</span>`;
      else html += c;
    }
    out.innerHTML = html;
    const s = stats();
    el.querySelector('#keys-prog').textContent = Math.round(100*t.length/text.length) + '%';
    el.querySelector('#keys-wpm').textContent = (t.length ? s.wpm : 0) + ' wpm';
    el.querySelector('#keys-acc').textContent = s.acc + '%';
  }
  function onInput(){
    if (fin()){ ta.value = st.typed; return; }
    let v = ta.value.replace(/\n/g,' ').slice(0, text.length);
    if (v.length > st.typed.length){
      for (let p = st.typed.length; p < v.length; p++){ st.keys++; if (v[p] !== text[p]) st.errors++; }
    }
    st.typed = v; ta.value = v;
    if (!st.started){ st.started = true; api.start(); }
    api.save(st); paint();
    if (v.length >= text.length) finish();
  }
  function finish(){
    const s = stats();
    ta.blur(); ta.disabled = true;
    api.finish({score: s.wpm, won: s.acc >= 90, title: s.wpm >= 70 ? 'Blazing keys' : s.wpm >= 45 ? 'Smooth typing' : 'Typed out',
      detail:`${s.wpm} words per minute at ${s.acc}% accuracy over ${text.split(' ').length} words.`,
      summary:`${s.wpm} wpm`, share:`Daybook Keys No. ${DAY_NO}\n⌨ ${s.wpm} wpm · ${s.acc}% accuracy`});
    paint();
  }
  ta.addEventListener('input', onInput);
  ta.addEventListener('focus', () => box.classList.add('keys-focus'));
  ta.addEventListener('blur', () => box.classList.remove('keys-focus'));
  ta.addEventListener('keydown', e => { if (e.key === 'Enter') e.preventDefault(); });
  paint();
  if (fin()){ ta.disabled = true; el.querySelector('#keys-hint').hidden = true; api.show(api.existing()); }
  else setTimeout(() => ta.focus({preventScroll:true}), 50);
}

/* =================================================================
   SLIDE — 15 puzzle
   ================================================================= */
function slideScramble(r){
  const b = [...Array(15).keys()].map(i => i+1).concat(0);
  let gap = 15, prev = -1;
  const n = 44 + Math.floor(r()*21);
  for (let k=0; k<n; k++){
    const gx = gap % 4, gy = Math.floor(gap/4), opts = [];
    if (gx > 0) opts.push(gap-1); if (gx < 3) opts.push(gap+1); if (gy > 0) opts.push(gap-4); if (gy < 3) opts.push(gap+4);
    const c = opts.filter(o => o !== prev);
    const t = c[Math.floor(r()*c.length)];
    b[gap] = b[t]; b[t] = 0; prev = gap; gap = t;
  }
  if (b.every((v,i) => v === (i === 15 ? 0 : i+1))){ const t = 14; b[15] = b[t]; b[t] = 0; } // never start solved
  return b;
}
function mountSlide(el, api){
  const start = slideScramble(api.rng());
  const manhattan = b => b.reduce((a,v,i) => v ? a + Math.abs(i%4 - (v-1)%4) + Math.abs(Math.floor(i/4) - Math.floor((v-1)/4)) : a, 0);
  const M = manhattan(start);
  let st = api.load(() => ({board:start.slice(), moves:0, started:false}));
  const fin = () => !!api.existing();
  el.innerHTML = `
    <div class="slide-top"><b>${'<span>Moves </span>'}<span id="slide-moves" style="color:var(--ink);font-weight:700">${st.moves}</span></b><b><span>Order 1 to 15</span></b></div>
    <div class="slide-board" id="slide-board" role="grid" aria-label="Sliding puzzle">${[...Array(15).keys()].map(i => `<button class="slide-tile" data-v="${i+1}" aria-label="Tile ${i+1}"><span>${i+1}</span></button>`).join('')}</div>
    <p class="hint">Tap a tile in line with the gap to slide it. Arrow keys work too.</p>`;
  const boardEl = el.querySelector('#slide-board');
  const tiles = {}; boardEl.querySelectorAll('.slide-tile').forEach(t => tiles[t.dataset.v] = t);
  const solved = () => st.board.every((v,i) => v === (i === 15 ? 0 : i+1));
  function paint(){
    st.board.forEach((v,i) => { if (!v) return; const t = tiles[v]; t.style.transform = `translate(${(i%4)*100}%, ${Math.floor(i/4)*100}%)`; t.classList.toggle('home', v === i+1); t.disabled = fin(); });
    el.querySelector('#slide-moves').textContent = st.moves;
    boardEl.classList.toggle('slide-solved', solved());
  }
  function slideAt(i){
    if (fin()) return;
    const g = st.board.indexOf(0), gx = g%4, gy = Math.floor(g/4), x = i%4, y = Math.floor(i/4);
    if (i === g || (x !== gx && y !== gy)) return;
    const step = x === gx ? (y > gy ? 4 : -4) : (x > gx ? 1 : -1);
    for (let p = g; p !== i; p += step){ st.board[p] = st.board[p+step]; st.board[p+step] = 0; st.moves++; }
    if (!st.started) st.started = true;
    api.save(st); paint();
    if (solved()){
      const m = st.moves, stars = m <= 2*M ? 3 : m <= 4*M ? 2 : 1;
      api.finish({score: m, won:true, title: stars === 3 ? 'Slick sliding' : stars === 2 ? 'Back in order' : 'Sorted',
        detail:`Solved in ${m} moves. The tiles started ${M} steps from home in total.`, summary:`${m} moves`,
        share:`Daybook Slide No. ${DAY_NO}\n${starStr(stars)}  ${m} moves`});
      paint();
    }
  }
  boardEl.onclick = e => { const t = e.target.closest('.slide-tile'); if (t) slideAt(st.board.indexOf(+t.dataset.v)); };
  const onKey = e => {
    if (fin() || e.metaKey || e.ctrlKey || e.altKey) return;
    const g = st.board.indexOf(0), gx = g%4, gy = Math.floor(g/4);
    const map = {ArrowUp:[0,1], ArrowDown:[0,-1], ArrowLeft:[1,0], ArrowRight:[-1,0]}; // tile moves in arrow direction
    const d = map[e.key]; if (!d) return;
    e.preventDefault();
    const x = gx + d[0], y = gy + d[1];
    if (x >= 0 && x < 4 && y >= 0 && y < 4) slideAt(y*4 + x);
  };
  document.addEventListener('keydown', onKey);
  paint();
  if (fin()) api.show(api.existing());
  return () => document.removeEventListener('keydown', onKey);
}

/* =================================================================
   MAZE
   ================================================================= */
const MZ = 15, MD = {N:[0,-1,1], E:[1,0,2], S:[0,1,4], W:[-1,0,8]}, MOPP = {N:'S', S:'N', E:'W', W:'E'};
function mazeGen(r){
  const cells = new Array(MZ*MZ).fill(0), seen = new Array(MZ*MZ).fill(false);
  const stack = [0]; seen[0] = true;
  while (stack.length){
    const c = stack[stack.length-1], x = c % MZ, y = Math.floor(c / MZ);
    const opts = Object.keys(MD).filter(d => { const nx = x+MD[d][0], ny = y+MD[d][1]; return nx>=0 && nx<MZ && ny>=0 && ny<MZ && !seen[ny*MZ+nx]; });
    if (!opts.length){ stack.pop(); continue; }
    const d = opts[Math.floor(r()*opts.length)], n = (y+MD[d][1])*MZ + x+MD[d][0];
    cells[c] |= MD[d][2]; cells[n] |= MD[MOPP[d]][2]; seen[n] = true; stack.push(n);
  }
  return cells;
}
function mazeRun(cells, c, d){
  // move in direction d, then keep following the corridor until a junction, dead end or the exit
  const path = []; const exit = MZ*MZ-1;
  if (!(cells[c] & MD[d][2])) return path;
  let cur = c, dir = d;
  for (let guard = 0; guard < MZ*MZ; guard++){
    const x = cur % MZ, y = Math.floor(cur / MZ);
    cur = (y+MD[dir][1])*MZ + x+MD[dir][0]; path.push(cur);
    if (cur === exit) break;
    const outs = Object.keys(MD).filter(k => k !== MOPP[dir] && (cells[cur] & MD[k][2]));
    if (outs.length !== 1) break;
    dir = outs[0];
  }
  return path;
}
function mountMaze(el, api){
  const cells = mazeGen(api.rng());
  const EXIT = MZ*MZ-1;
  // fewest possible moves (BFS over corridor runs)
  const dist = new Array(MZ*MZ).fill(-1); dist[0] = 0; const q = [0];
  while (q.length){ const c = q.shift(); for (const d of Object.keys(MD)){ const p = mazeRun(cells, c, d); if (!p.length) continue; const n = p[p.length-1]; if (dist[n] < 0){ dist[n] = dist[c]+1; q.push(n); } } }
  const best = dist[EXIT];
  let st = api.load(() => ({pos:0, path:[0], moves:0, started:false}));
  const fin = () => !!api.existing();
  el.innerHTML = `
    <div class="maze-wrap">
      <div class="maze-top"><b><span>Moves </span><span id="maze-moves" style="color:var(--ink);font-weight:700">${st.moves}</span></b><b><span>Fewest possible </span>${best}</b></div>
      <div class="maze-stage"><canvas id="maze-c" aria-label="Maze. Use arrow keys, swipe, or the buttons to move."></canvas></div>
      <div class="maze-pad" id="maze-pad"><button class="u" data-d="N" aria-label="Up">▲</button><button class="l" data-d="W" aria-label="Left">◀</button><button class="d" data-d="S" aria-label="Down">▼</button><button class="r" data-d="E" aria-label="Right">▶</button></div>
      <p class="hint">Each move runs along the corridor until the next fork. Reach the bottom-right corner.</p>
    </div>`;
  const cv = el.querySelector('#maze-c'), ctx = cv.getContext('2d'), stage = el.querySelector('.maze-stage');
  function draw(){
    const w = stage.clientWidth || 360, dpr = Math.min(window.devicePixelRatio || 1, 3);
    if (cv.width !== Math.round(w*dpr)){ cv.width = Math.round(w*dpr); cv.height = Math.round(w*dpr); }
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const cs = getComputedStyle(document.documentElement);
    const tok = n => cs.getPropertyValue(n).trim() || '#888';
    const pad = 6, s = (w - pad*2) / MZ;
    ctx.fillStyle = tok('--surface'); ctx.fillRect(0,0,w,w);
    // exit
    ctx.fillStyle = tok('--good'); ctx.globalAlpha = .25; ctx.fillRect(pad + (MZ-1)*s, pad + (MZ-1)*s, s, s); ctx.globalAlpha = 1;
    // trail
    const ctr = c => [pad + (c%MZ + .5)*s, pad + (Math.floor(c/MZ) + .5)*s];
    ctx.strokeStyle = tok('--gc'); ctx.globalAlpha = .45; ctx.lineWidth = Math.max(2, s*.32); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); st.path.forEach((c,i) => { const [x,y] = ctr(c); i ? ctx.lineTo(x,y) : ctx.moveTo(x,y); }); ctx.stroke(); ctx.globalAlpha = 1;
    // walls
    ctx.strokeStyle = tok('--ink'); ctx.lineWidth = Math.max(1.5, s*.12); ctx.lineCap = 'square';
    ctx.beginPath();
    for (let c=0; c<MZ*MZ; c++){
      const x = pad + (c%MZ)*s, y = pad + Math.floor(c/MZ)*s, v = cells[c];
      if (!(v & 1)){ ctx.moveTo(x,y); ctx.lineTo(x+s,y); }
      if (!(v & 8)){ ctx.moveTo(x,y); ctx.lineTo(x,y+s); }
      if (c % MZ === MZ-1 && !(v & 2)){ ctx.moveTo(x+s,y); ctx.lineTo(x+s,y+s); }
      if (Math.floor(c/MZ) === MZ-1 && !(v & 4)){ ctx.moveTo(x,y+s); ctx.lineTo(x+s,y+s); }
    }
    ctx.stroke();
    // player
    const [px,py] = ctr(st.pos);
    ctx.fillStyle = tok('--gc'); ctx.beginPath(); ctx.arc(px, py, s*.32, 0, Math.PI*2); ctx.fill();
  }
  function move(d){
    if (fin()) return;
    const p = mazeRun(cells, st.pos, d);
    if (!p.length) return;
    st.path.push(...p); st.pos = p[p.length-1]; st.moves++;
    if (st.path.length > 4000) st.path = st.path.slice(-4000);
    if (!st.started) st.started = true;
    api.save(st);
    el.querySelector('#maze-moves').textContent = st.moves;
    draw();
    if (st.pos === EXIT){
      const m = st.moves, stars = m <= best ? 3 : m <= best*1.6 ? 2 : 1;
      api.finish({score: m, won:true, title: m <= best ? 'Perfect route' : stars === 2 ? 'Found the way' : 'Made it out',
        detail:`You escaped in ${m} moves. The fewest possible was ${best}.`, summary:`${m} moves`,
        share:`Daybook Maze No. ${DAY_NO}\n${starStr(stars)}  ${m} moves (best ${best})`});
    }
  }
  el.querySelector('#maze-pad').onclick = e => { const b = e.target.closest('[data-d]'); if (b) move(b.dataset.d); };
  const onKey = e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const d = {ArrowUp:'N', ArrowDown:'S', ArrowLeft:'W', ArrowRight:'E', w:'N', s:'S', a:'W', d:'E', W:'N', S:'S', A:'W', D:'E'}[e.key];
    if (d){ e.preventDefault(); move(d); }
  };
  document.addEventListener('keydown', onKey);
  let sw = null;
  cv.addEventListener('pointerdown', e => { sw = {x:e.clientX, y:e.clientY}; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointerup', e => {
    if (!sw) return; const dx = e.clientX - sw.x, dy = e.clientY - sw.y; sw = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
    move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'E' : 'W') : (dy > 0 ? 'S' : 'N'));
  });
  cv.addEventListener('pointercancel', () => sw = null);
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(draw) : null;
  if (ro) ro.observe(stage);
  const mq = matchMedia('(prefers-color-scheme: dark)'); const onScheme = () => draw();
  mq.addEventListener && mq.addEventListener('change', onScheme);
  draw();
  if (fin()) api.show(api.existing());
  return () => { document.removeEventListener('keydown', onKey); if (ro) ro.disconnect(); mq.removeEventListener && mq.removeEventListener('change', onScheme); };
}

/* ---------- register ---------- */
register({id:'recall', name:'Recall', cat:'speed', mins:2, blurb:'Twenty face-down cards hide ten pairs. Find them in as few moves as you can.', mount:mountRecall,
  art:'<svg viewBox="0 0 120 80" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="3"><rect x="8" y="12" width="28" height="36" rx="5"/><rect x="46" y="12" width="28" height="36" rx="5" fill="currentColor" fill-opacity=".2"/><rect x="84" y="12" width="28" height="36" rx="5" fill="currentColor" fill-opacity=".2"/></g><g fill="currentColor"><path d="M60 22l7 12H53z"/><path d="M98 22l7 12H91z"/></g><path d="M22 58v14M60 58v14M98 58v14" stroke="currentColor" stroke-width="3" stroke-dasharray="3 4"/></svg>',
  how:['Tap two cards to turn them over. A matching pair stays face up.','If they don’t match, they flip back after a moment. Two cards is one move.','Par is 16 moves. Clear the board in 24 moves or fewer to keep your streak.']});
register({id:'sprint', name:'Sprint', cat:'numbers', mins:2, blurb:'Sixty seconds of mental arithmetic that gets harder as you go.', mount:mountSprint,
  art:'<svg viewBox="0 0 120 80" aria-hidden="true"><rect x="8" y="10" width="104" height="10" rx="5" fill="currentColor" fill-opacity=".25"/><rect x="8" y="10" width="62" height="10" rx="5" fill="currentColor"/><g fill="currentColor" font-family="JetBrains Mono,monospace" font-weight="700" font-size="24" text-anchor="middle"><text x="60" y="54">7×8</text><text x="60" y="76" font-size="14">= 56</text></g></svg>',
  how:['Press start and you have 60 seconds. You only get one run a day.','Type each answer. It moves on by itself as soon as you’re right.','Skip any problem you’d rather not do. Problems get harder as you go.','Score 15 or more to keep your streak.']});
register({id:'shade', name:'Shade', cat:'speed', mins:2, blurb:'Spot the one square that’s a slightly different colour, round after round.', mount:mountShade,
  art:'<svg viewBox="0 0 120 80" aria-hidden="true"><g fill="currentColor"><rect x="30" y="6" width="18" height="18" rx="3"/><rect x="51" y="6" width="18" height="18" rx="3"/><rect x="72" y="6" width="18" height="18" rx="3"/><rect x="30" y="31" width="18" height="18" rx="3"/><rect x="51" y="31" width="18" height="18" rx="3" fill-opacity=".55"/><rect x="72" y="31" width="18" height="18" rx="3"/><rect x="30" y="56" width="18" height="18" rx="3"/><rect x="51" y="56" width="18" height="18" rx="3"/><rect x="72" y="56" width="18" height="18" rx="3"/></g></svg>',
  how:['One square in each grid is a slightly different shade. Tap it.','The grids get bigger and the difference gets smaller over 15 rounds.','A wrong tap costs one of your three lives.','Clear 10 rounds to keep your streak.']});
register({id:'keys', name:'Keys', cat:'speed', mins:2, blurb:'Type a short run of old proverbs as fast and cleanly as you can.', mount:mountKeys,
  art:'<svg viewBox="0 0 120 80" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2.5"><rect x="6" y="30" width="108" height="44" rx="6"/></g><g fill="currentColor"><rect x="14" y="38" width="12" height="10" rx="2"/><rect x="30" y="38" width="12" height="10" rx="2"/><rect x="46" y="38" width="12" height="10" rx="2" fill-opacity=".4"/><rect x="62" y="38" width="12" height="10" rx="2"/><rect x="78" y="38" width="12" height="10" rx="2"/><rect x="94" y="38" width="12" height="10" rx="2"/><rect x="30" y="56" width="60" height="10" rx="2"/><rect x="10" y="8" width="58" height="6" rx="3"/><rect x="72" y="8" width="38" height="6" rx="3" fill-opacity=".35"/><rect x="10" y="18" width="40" height="6" rx="3" fill-opacity=".35"/></g></svg>',
  how:['Tap the passage and type it exactly, spaces and punctuation included.','The clock starts with your first key. Mistakes show in red; you can backspace.','Your speed counts only correct characters. 90% accuracy keeps your streak.']});
register({id:'slide', name:'Slide', cat:'logic', mins:5, blurb:'Slide fifteen numbered tiles back into order on a four-by-four board.', mount:mountSlide,
  art:'<svg viewBox="0 0 120 80" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2.5"><rect x="26" y="4" width="68" height="72" rx="6"/></g><g fill="currentColor"><rect x="31" y="9" width="18" height="18" rx="3"/><rect x="51" y="9" width="18" height="18" rx="3"/><rect x="71" y="9" width="18" height="18" rx="3"/><rect x="31" y="31" width="18" height="18" rx="3"/><rect x="51" y="31" width="18" height="18" rx="3" fill-opacity=".35"/><rect x="31" y="53" width="18" height="18" rx="3"/><rect x="51" y="53" width="18" height="18" rx="3"/><rect x="71" y="53" width="18" height="18" rx="3"/></g><path d="M80 34v10m-4-4 4 4 4-4" stroke="currentColor" stroke-width="2.5" fill="none"/></svg>',
  how:['Put the tiles in order from 1 to 15, reading left to right, with the gap bottom right.','Tap any tile in the same row or column as the gap to slide it, and any tiles between, into the gap.','Arrow keys slide the neighbouring tile into the gap.','Every puzzle is solvable. Fewer moves earns more stars.']});
register({id:'maze', name:'Maze', cat:'skill', mins:2, blurb:'A new fifteen-by-fifteen maze each day. Find your way to the far corner.', mount:mountMaze,
  art:'<svg viewBox="0 0 120 80" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="square"><path d="M26 6h68v68H26zM40 6v28h14M40 48h28V20M82 6v42M54 62h40M26 48h0M40 74V62h0"/></g><circle cx="33" cy="13" r="4" fill="currentColor"/><rect x="82" y="62" width="10" height="10" fill="currentColor" fill-opacity=".35"/></svg>',
  how:['Start top left and reach the shaded corner at the bottom right.','Use the arrow keys, WASD, the buttons, or swipe across the maze.','Each move runs along the corridor until the next fork, so long passages take one move.','Fewer moves earns more stars. The fewest possible is shown at the top.']});
