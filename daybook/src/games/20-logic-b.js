/* Logic B: Pixel (nonogram), Sweep (mine logic), Circuit (rotate tiles), Spill (colour flood) */

css(`
/* ---------- Pixel ---------- */
.pixel-wrap{display:grid;gap:12px;justify-items:center}
.pixel-tools{display:flex;justify-content:space-between;align-items:center;gap:10px;width:100%;max-width:460px;flex-wrap:wrap}
.pixel-seg{display:inline-flex;border:1.5px solid var(--line);border-radius:10px;overflow:hidden;background:var(--surface)}
.pixel-seg button{border:0;background:none;padding:0 14px;min-height:40px;font:700 14px var(--f-body);cursor:pointer;color:var(--muted)}
.pixel-seg button[aria-pressed="true"]{background:var(--gc);color:var(--on-gc)}
.pixel-board{display:grid;grid-template-columns:auto repeat(10,minmax(0,1fr));width:100%;max-width:460px;user-select:none;-webkit-user-select:none;touch-action:none}
.pixel-cc{display:flex;flex-direction:column;justify-content:flex-end;align-items:center;font:700 12px/1.2 var(--f-mono);color:var(--ink);padding-bottom:5px;min-width:0}
.pixel-rc{display:flex;justify-content:flex-end;align-items:center;gap:5px;font:700 12px var(--f-mono);color:var(--ink);padding-right:7px;white-space:nowrap}
.pixel-cc.ok,.pixel-rc.ok{color:var(--muted);opacity:.45}
.pixel-cell{aspect-ratio:1;min-width:0;border:0;border-right:1px solid var(--line);border-bottom:1px solid var(--line);background:var(--surface);padding:0;cursor:pointer;position:relative;border-radius:0}
.pixel-cell.c0{border-left:2px solid var(--ink)}.pixel-cell.c4{border-right:2px solid var(--muted)}.pixel-cell.c9{border-right:2px solid var(--ink)}
.pixel-cell.r0{border-top:2px solid var(--ink)}.pixel-cell.r4{border-bottom:2px solid var(--muted)}.pixel-cell.r9{border-bottom:2px solid var(--ink)}
.pixel-cell.f{background:var(--ink)}
.pixel-cell.x::after{content:"×";position:absolute;inset:0;display:grid;place-items:center;color:var(--muted);font:700 15px/1 var(--f-mono)}
.pixel-board.done .pixel-cell{cursor:default}
.pixel-board.done .pixel-cell.f{background:var(--gc)}
@media (max-width:420px){.pixel-cc,.pixel-rc{font-size:11px}.pixel-rc{gap:3px;padding-right:5px}}

/* ---------- Sweep ---------- */
.sweep-wrap{display:grid;gap:12px;justify-items:center}
.sweep-top{display:flex;justify-content:space-between;align-items:center;gap:10px;width:100%;max-width:420px;flex-wrap:wrap}
.sweep-count{font:700 20px var(--f-mono);font-variant-numeric:tabular-nums}
.sweep-mode[aria-pressed="true"]{background:var(--gc);border-color:var(--gc);color:var(--on-gc)}
.sweep-board{display:grid;grid-template-columns:repeat(9,minmax(0,1fr));gap:3px;width:100%;max-width:420px;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;touch-action:manipulation}
.sweep-cell{aspect-ratio:1;min-width:0;border-radius:6px;border:0;background:color-mix(in srgb,var(--gc) 24%,var(--sunk));font:700 18px/1 var(--f-mono);cursor:pointer;padding:0;color:var(--ink);-webkit-touch-callout:none}
.sweep-cell:hover:not(.open){background:color-mix(in srgb,var(--gc) 34%,var(--sunk))}
.sweep-cell.open{background:var(--surface);box-shadow:inset 0 0 0 1px var(--line);cursor:default}
.sweep-cell.open.n1{color:var(--gc)}.sweep-cell.open.n2{color:var(--good)}.sweep-cell.open.n3{color:var(--bad)}
.sweep-cell.open.n4,.sweep-cell.open.n5,.sweep-cell.open.n6,.sweep-cell.open.n7,.sweep-cell.open.n8{color:var(--warn)}
.sweep-cell.flag{color:var(--bad)}
.sweep-cell.mine{background:color-mix(in srgb,var(--bad) 22%,var(--surface));color:var(--ink)}
.sweep-cell.boom{background:var(--bad);color:var(--surface)}
.sweep-cell.wrong{text-decoration:line-through}
@media (max-width:420px){.sweep-cell{font-size:16px;border-radius:5px}.sweep-board{gap:2px}}

/* ---------- Circuit ---------- */
.circuit-wrap{display:grid;gap:12px;justify-items:center}
.circuit-top{display:flex;justify-content:space-between;align-items:center;gap:10px;width:100%;max-width:420px;flex-wrap:wrap}
.circuit-stat{font:700 18px var(--f-mono);font-variant-numeric:tabular-nums}
.circuit-stat span{color:var(--muted);font-weight:500;font-size:14px}
.circuit-board{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:4px;width:100%;max-width:420px;padding:8px;background:var(--surface);border:1px solid var(--line);border-radius:12px;touch-action:manipulation}
.circuit-cell{aspect-ratio:1;min-width:0;border:0;border-radius:8px;background:var(--sunk);padding:0;cursor:pointer;color:var(--muted);overflow:hidden}
.circuit-cell.on{color:var(--gc);background:color-mix(in srgb,var(--gc) 13%,var(--sunk))}
.circuit-cell svg{width:100%;height:100%;display:block;transition:transform .14s ease}
.circuit-cell:disabled{cursor:default}
.circuit-board.done .circuit-cell{background:color-mix(in srgb,var(--gc) 20%,var(--sunk))}

/* ---------- Spill ---------- */
:root{
  --spill-c0:#D23F37; --spill-c1:#EE8A22; --spill-c2:#E4C21A; --spill-c3:#3A9550; --spill-c4:#2E74CC; --spill-c5:#8A4FC8;
  --spill-f0:#FFFFFF; --spill-f1:#1B1B1B; --spill-f2:#1B1B1B; --spill-f3:#FFFFFF; --spill-f4:#FFFFFF; --spill-f5:#FFFFFF;
}
@media (prefers-color-scheme: dark){
  :root:not([data-theme="light"]){
    --spill-c0:#FF6B60; --spill-c1:#FFA24C; --spill-c2:#F3D447; --spill-c3:#5CCB72; --spill-c4:#5CA2FF; --spill-c5:#B98CF7;
    --spill-f0:#10131A; --spill-f1:#10131A; --spill-f2:#10131A; --spill-f3:#10131A; --spill-f4:#10131A; --spill-f5:#10131A;
  }
}
:root[data-theme="dark"]{
  --spill-c0:#FF6B60; --spill-c1:#FFA24C; --spill-c2:#F3D447; --spill-c3:#5CCB72; --spill-c4:#5CA2FF; --spill-c5:#B98CF7;
  --spill-f0:#10131A; --spill-f1:#10131A; --spill-f2:#10131A; --spill-f3:#10131A; --spill-f4:#10131A; --spill-f5:#10131A;
}
.spill-wrap{display:grid;gap:12px;justify-items:center}
.spill-top{display:flex;justify-content:space-between;align-items:center;gap:10px;width:100%;max-width:420px;flex-wrap:wrap}
.spill-stat{font:700 18px var(--f-mono);font-variant-numeric:tabular-nums}
.spill-stat span{color:var(--muted);font-weight:500;font-size:14px}
.spill-board{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));width:100%;max-width:420px;border-radius:10px;overflow:hidden;border:1px solid var(--line)}
.spill-cell{aspect-ratio:1;min-width:0;transition:background-color .18s ease}
.spill-k0{background:var(--spill-c0)}.spill-k1{background:var(--spill-c1)}.spill-k2{background:var(--spill-c2)}
.spill-k3{background:var(--spill-c3)}.spill-k4{background:var(--spill-c4)}.spill-k5{background:var(--spill-c5)}
.spill-pal{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;width:100%;max-width:420px}
.spill-btn{height:54px;min-width:0;border-radius:12px;border:0;font:700 22px/1 var(--f-body);cursor:pointer;padding:0}
.spill-btn:nth-child(1){color:var(--spill-f0)}.spill-btn:nth-child(2){color:var(--spill-f1)}.spill-btn:nth-child(3){color:var(--spill-f2)}
.spill-btn:nth-child(4){color:var(--spill-f3)}.spill-btn:nth-child(5){color:var(--spill-f4)}.spill-btn:nth-child(6){color:var(--spill-f5)}
.spill-btn.cur{outline:3px solid var(--ink);outline-offset:2px}
.spill-btn:disabled{cursor:default}
.spill-pal.done .spill-btn{opacity:.4}
`);

/* =================================================================
   PIXEL
   ================================================================= */
const PIXEL_N = 10;
function pixelRuns(line){ const out = []; let c = 0; for (const v of line){ if (v === 1) c++; else if (c){ out.push(c); c = 0; } } if (c) out.push(c); return out.length ? out : [0]; }
function genPixel(r){
  const N = PIXEL_N;
  for (let t = 0; t < 80; t++){
    let g = new Array(N*N).fill(0);
    const p = 0.5 + r()*0.12;
    for (let i = 0; i < N*N; i++) g[i] = r() < p ? 1 : 0;
    for (let it = 0; it < 2; it++){
      const ng = g.slice();
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++){
        let s = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++){ const yy = y+dy, xx = x+dx; if (yy >= 0 && yy < N && xx >= 0 && xx < N) s += g[yy*N+xx]; }
        ng[y*N+x] = s >= 5 ? 1 : s <= 3 ? 0 : g[y*N+x];
      }
      g = ng;
    }
    if (r() < 0.65){ for (let y = 0; y < N; y++) for (let x = 0; x < N/2; x++) g[y*N + (N-1-x)] = g[y*N+x]; }
    else { for (let y = 0; y < N/2; y++) for (let x = 0; x < N; x++) g[(N-1-y)*N + x] = g[y*N+x]; }
    const fill = g.reduce((a,b) => a+b, 0) / (N*N);
    if (fill < 0.45 || fill > 0.65) continue;
    let ok = true;
    for (let k = 0; k < N && ok; k++){
      let row = 0, col = 0;
      for (let j = 0; j < N; j++){ row += g[k*N+j]; col += g[j*N+k]; }
      if (!row || !col) ok = false;
    }
    if (ok) return g;
  }
  const heart = ['0110000110','1111001111','1111111111','1111111111','1111111111','0111111110','0011111100','0001111000','0000110000','0000110000'];
  return heart.join('').split('').map(Number);
}
function mountPixel(el, api){
  const N = PIXEL_N;
  const sol = genPixel(api.rng());
  const rowClues = Array.from({length:N}, (_,y) => pixelRuns(sol.slice(y*N, y*N+N)));
  const colClues = Array.from({length:N}, (_,x) => pixelRuns(Array.from({length:N}, (_,y) => sol[y*N+x])));
  const st = api.load(() => ({g:new Array(N*N).fill(0), mode:'fill', started:false, gaveUp:false}));
  const fin = () => !!api.existing();
  let armGive = false, armClear = false;
  const cells = [];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) cells.push(`<button class="pixel-cell c${x} r${y}" data-i="${y*N+x}" aria-label="Row ${y+1}, column ${x+1}"></button>`);
  let boardHtml = '<div></div>' + colClues.map((c,x) => `<div class="pixel-cc" id="pixel-cc${x}" aria-label="Column ${x+1} clue ${c.join(' ')}">${c.map(n => `<span>${n}</span>`).join('')}</div>`).join('');
  for (let y = 0; y < N; y++) boardHtml += `<div class="pixel-rc" id="pixel-rc${y}" aria-label="Row ${y+1} clue ${rowClues[y].join(' ')}">${rowClues[y].map(n => `<span>${n}</span>`).join('')}</div>` + cells.slice(y*N, y*N+N).join('');
  el.innerHTML = `
    <div class="pixel-wrap">
      <div class="pixel-tools" id="pixel-tools">
        <div class="pixel-seg" role="group" aria-label="Brush"><button data-mode="fill">■ Fill</button><button data-mode="mark">× Mark</button></div>
        <span class="label">Paint the picture the numbers describe</span>
      </div>
      <div class="pixel-board" id="pixel-board">${boardHtml}</div>
      <p class="msg" id="pixel-msg" aria-live="polite"></p>
      <div class="row" id="pixel-acts" style="justify-content:center"><button class="btn" id="pixel-clear">Clear board</button><button class="btn" id="pixel-give">Show solution</button></div>
      <p class="hint" id="pixel-hint">Drag across squares to paint several at once. Numbers turn grey when their line matches.</p>
    </div>`;
  const board = el.querySelector('#pixel-board');
  const cellEls = [...board.querySelectorAll('.pixel-cell')];
  const msgEl = el.querySelector('#pixel-msg');
  function paintCell(i){ const v = st.g[i], c = cellEls[i]; c.classList.toggle('f', v === 1); c.classList.toggle('x', v === 2); c.setAttribute('aria-label', `Row ${Math.floor(i/N)+1}, column ${i%N+1}, ${v===1?'filled':v===2?'marked empty':'blank'}`); }
  const lineOk = (vals, clue) => { const runs = pixelRuns(vals.map(v => v === 1 ? 1 : 0)); return runs.length === clue.length && runs.every((n,k) => n === clue[k]); };
  function checkLines(){
    let all = true;
    for (let k = 0; k < N; k++){
      const ro = lineOk(st.g.slice(k*N, k*N+N), rowClues[k]);
      const co = lineOk(Array.from({length:N}, (_,y) => st.g[y*N+k]), colClues[k]);
      el.querySelector('#pixel-rc'+k).classList.toggle('ok', ro);
      el.querySelector('#pixel-cc'+k).classList.toggle('ok', co);
      if (!ro || !co) all = false;
    }
    return all;
  }
  function setMode(m){ st.mode = m; el.querySelectorAll('.pixel-seg button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === m))); }
  function renderAll(){ cellEls.forEach((_,i) => paintCell(i)); checkLines(); setMode(st.mode || 'fill'); }
  function lock(){
    board.classList.add('done');
    cellEls.forEach(c => c.disabled = true);
    el.querySelector('#pixel-tools').hidden = true; el.querySelector('#pixel-acts').hidden = true; el.querySelector('#pixel-hint').hidden = true;
  }
  function commit(){
    if (fin()) return;
    st.started = true; api.save(st);
    if (checkLines()){
      st.g = st.g.map(v => v === 1 ? 1 : 0); api.save(st); renderAll(); lock();
      api.finish({won:true, title:'Picture painted', detail:`All ${N*2} clues line up. Nothing was penalised along the way.`, summary:'Solved',
        share:`Daybook Pixel No. ${DAY_NO}\n🎨 Painted the 10×10 picture`});
    }
  }
  let drag = null;
  function apply(i){
    if (!drag || drag.seen.has(i)) return;
    drag.seen.add(i);
    const cur = st.g[i];
    if (drag.want === 0 && cur !== drag.from) return;
    if (drag.want !== 0 && cur !== 0 && cur !== drag.from) return;
    st.g[i] = drag.want; paintCell(i);
  }
  board.addEventListener('pointerdown', e => {
    const c = e.target.closest('.pixel-cell'); if (!c || fin() || e.button > 0) return;
    e.preventDefault();
    const i = +c.dataset.i, cur = st.g[i];
    const want = st.mode === 'mark' ? (cur === 2 ? 0 : 2) : (cur === 1 ? 0 : 1);
    drag = {want, from:cur, seen:new Set()};
    apply(i);
    try { board.setPointerCapture(e.pointerId); } catch(err){}
  });
  board.addEventListener('pointermove', e => {
    if (!drag) return;
    const t = document.elementFromPoint(e.clientX, e.clientY);
    const c = t && t.closest ? t.closest('.pixel-cell') : null;
    if (c && board.contains(c)) apply(+c.dataset.i);
  });
  const endDrag = () => { if (drag){ drag = null; commit(); } };
  board.addEventListener('pointerup', endDrag);
  board.addEventListener('pointercancel', endDrag);
  board.addEventListener('click', e => {
    if (e.detail !== 0 || fin()) return; // keyboard activation only; pointer handled above
    const c = e.target.closest('.pixel-cell'); if (!c) return;
    const i = +c.dataset.i, cur = st.g[i];
    st.g[i] = st.mode === 'mark' ? (cur === 2 ? 0 : 2) : (cur === 1 ? 0 : 1);
    paintCell(i); commit();
  });
  board.addEventListener('keydown', e => {
    const c = e.target.closest('.pixel-cell'); if (!c) return;
    const i = +c.dataset.i; let j = -1;
    if (e.key === 'ArrowRight') j = i % N < N-1 ? i+1 : i; else if (e.key === 'ArrowLeft') j = i % N ? i-1 : i;
    else if (e.key === 'ArrowDown') j = i + N < N*N ? i+N : i; else if (e.key === 'ArrowUp') j = i - N >= 0 ? i-N : i;
    else if (e.key === 'x' || e.key === 'X'){ e.preventDefault(); st.g[i] = st.g[i] === 2 ? 0 : 2; paintCell(i); commit(); return; }
    if (j >= 0){ e.preventDefault(); cellEls[j].focus(); }
  });
  el.querySelector('.pixel-seg').onclick = e => { const b = e.target.closest('[data-mode]'); if (b){ setMode(b.dataset.mode); api.save(st); } };
  const giveBtn = el.querySelector('#pixel-give'), clearBtn = el.querySelector('#pixel-clear');
  clearBtn.onclick = () => {
    if (!armClear){ armClear = true; clearBtn.textContent = 'Tap again to clear'; return; }
    armClear = false; clearBtn.textContent = 'Clear board';
    st.g = new Array(N*N).fill(0); api.save(st); renderAll();
  };
  giveBtn.onclick = () => {
    if (!armGive){ armGive = true; giveBtn.textContent = 'Tap again to give up'; return; }
    st.gaveUp = true; st.started = true; st.g = sol.slice(); api.save(st); renderAll(); lock();
    api.finish({won:false, title:'Solution shown', detail:'Here is the picture the clues describe.', summary:'Gave up',
      share:`Daybook Pixel No. ${DAY_NO}\n🖼️ Peeked at the picture`});
  };
  renderAll();
  if (fin()){ if (st.gaveUp) st.g = sol.slice(); renderAll(); lock(); api.show(api.existing()); }
  return () => { drag = null; };
}

/* =================================================================
   SWEEP
   ================================================================= */
const SW_W = 9, SW_N = 81, SW_M = 12;
function sweepNb(i){ const x = i % SW_W, y = Math.floor(i / SW_W), out = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++){ if (!dx && !dy) continue; const xx = x+dx, yy = y+dy; if (xx >= 0 && xx < SW_W && yy >= 0 && yy < SW_W) out.push(yy*SW_W+xx); } return out; }
function sweepFlood(start, mine, count, open){
  const q = [start]; open[start] = true;
  while (q.length){ const i = q.pop(); if (count[i] === 0) for (const j of sweepNb(i)) if (!open[j] && !mine[j]){ open[j] = true; q.push(j); } }
}
function genSweep(r){
  let best = null;
  for (let t = 0; t < 40; t++){
    const s = Math.floor(r()*SW_N);
    const banned = new Set([s, ...sweepNb(s)]);
    const cand = shuffle([...Array(SW_N).keys()].filter(i => !banned.has(i)), r);
    const mine = new Array(SW_N).fill(false); cand.slice(0, SW_M).forEach(i => mine[i] = true);
    const count = Array.from({length:SW_N}, (_,i) => sweepNb(i).filter(j => mine[j]).length);
    const open = new Array(SW_N).fill(false); sweepFlood(s, mine, count, open);
    const size = open.filter(Boolean).length;
    if (!best || size > best.size) best = {mine, count, start:s, open, size};
    if (size >= 14) break;
  }
  return best;
}
function mountSweep(el, api){
  const B = genSweep(api.rng());
  const SAFE = SW_N - SW_M;
  const st = api.load(() => ({open:B.open.slice(), flag:new Array(SW_N).fill(false), boom:-1, flagMode:false, started:false}));
  const fin = () => !!api.existing();
  let lpTimer = 0, lpFired = false, lpStart = null;
  el.innerHTML = `
    <div class="sweep-wrap">
      <div class="sweep-top"><div><span class="label">Mines left</span><br><span class="sweep-count" id="sweep-count"></span></div>
        <button class="btn sweep-mode" id="sweep-mode" aria-pressed="false">⚑ Flag mode</button></div>
      <div class="sweep-board" id="sweep-board" role="grid" aria-label="Minefield, 9 by 9"></div>
      <p class="msg" id="sweep-msg" aria-live="polite"></p>
      <p class="hint" id="sweep-hint">Tap to dig. Long-press, right-click or press F to flag. Tap a number whose flags are all placed to clear around it.</p>
    </div>`;
  const board = el.querySelector('#sweep-board');
  const opened = () => st.open.filter(Boolean).length;
  function render(){
    const over = fin();
    const focused = document.activeElement && board.contains(document.activeElement) ? +document.activeElement.dataset.i : -1;
    board.innerHTML = Array.from({length:SW_N}, (_,i) => {
      const x = i % SW_W, y = Math.floor(i / SW_W);
      let cls = 'sweep-cell', txt = '', label;
      if (st.open[i]){ cls += ' open n' + B.count[i]; txt = B.count[i] || ''; label = B.count[i] ? `${B.count[i]} nearby` : 'clear'; }
      else if (over && B.mine[i]){ cls += i === st.boom ? ' boom' : ' mine'; txt = st.flag[i] ? '⚑' : '✸'; label = 'mine'; }
      else if (st.flag[i]){ cls += ' flag' + (over && !B.mine[i] ? ' wrong' : ''); txt = '⚑'; label = 'flagged'; }
      else label = 'hidden';
      return `<button class="${cls}" data-i="${i}" aria-label="Row ${y+1}, column ${x+1}, ${label}" ${over?'disabled':''}>${txt}</button>`;
    }).join('');
    el.querySelector('#sweep-count').textContent = SW_M - st.flag.filter(Boolean).length;
    const mb = el.querySelector('#sweep-mode'); mb.setAttribute('aria-pressed', String(!!st.flagMode)); mb.hidden = over;
    el.querySelector('#sweep-hint').hidden = over;
    if (focused >= 0 && !over) board.children[focused].focus();
  }
  function lose(i){
    st.boom = i; st.started = true; api.save(st);
    const left = SAFE - opened();
    api.finish({won:false, title:'Boom', detail:`That square hid a mine. You had ${plural(left,'safe square')} left to clear.`, summary:'Boom',
      share:`Daybook Sweep No. ${DAY_NO}\n💥 Hit a mine · ${left} safe left of ${SAFE}`});
    render();
  }
  function after(){
    st.started = true; api.save(st);
    if (opened() === SAFE){
      for (let i = 0; i < SW_N; i++) if (B.mine[i]) st.flag[i] = true;
      api.save(st);
      api.finish({won:true, title:'Field cleared', detail:`All ${SAFE} safe squares dug without touching a mine.`, summary:'Cleared',
        share:`Daybook Sweep No. ${DAY_NO}\n🚩 Cleared all ${SAFE} safe squares`});
    }
    render();
  }
  function dig(i){
    if (st.open[i] || st.flag[i]) return;
    if (B.mine[i]) return lose(i);
    sweepFlood(i, B.mine, B.count, st.open);
  }
  function toggleFlag(i){ if (fin() || st.open[i]) return; st.flag[i] = !st.flag[i]; after(); }
  function tap(i){
    if (fin()) return;
    if (st.flagMode && !st.open[i]) return toggleFlag(i);
    if (st.open[i]){
      if (!B.count[i]) return;
      const nb = sweepNb(i);
      if (nb.filter(j => st.flag[j]).length !== B.count[i]) { el.querySelector('#sweep-msg').textContent = `Place ${B.count[i]} flag${B.count[i]===1?'':'s'} around that number first.`; return; }
      for (const j of nb){ if (!st.open[j] && !st.flag[j]){ if (B.mine[j]) return lose(j); dig(j); } }
    } else {
      if (st.flag[i]) return;
      if (B.mine[i]) return lose(i);
      dig(i);
    }
    el.querySelector('#sweep-msg').textContent = '';
    after();
  }
  board.addEventListener('pointerdown', e => {
    lpFired = false; clearTimeout(lpTimer);
    const c = e.target.closest('.sweep-cell'); if (!c || e.button > 0 || fin()) return;
    const i = +c.dataset.i; lpStart = {x:e.clientX, y:e.clientY};
    lpTimer = setTimeout(() => { lpFired = true; toggleFlag(i); try { navigator.vibrate && navigator.vibrate(15); } catch(err){} }, 400);
  });
  board.addEventListener('pointermove', e => { if (lpStart && Math.hypot(e.clientX-lpStart.x, e.clientY-lpStart.y) > 10) clearTimeout(lpTimer); });
  ['pointerup','pointercancel','pointerleave'].forEach(ev => board.addEventListener(ev, () => { clearTimeout(lpTimer); lpStart = null; }));
  board.addEventListener('click', e => {
    const c = e.target.closest('.sweep-cell'); if (!c) return;
    if (lpFired){ lpFired = false; return; }
    tap(+c.dataset.i);
  });
  board.addEventListener('contextmenu', e => {
    e.preventDefault();
    if (lpFired) return;
    const c = e.target.closest('.sweep-cell'); if (c) toggleFlag(+c.dataset.i);
  });
  board.addEventListener('keydown', e => {
    const c = e.target.closest('.sweep-cell'); if (!c) return;
    const i = +c.dataset.i; let j = -1;
    if (e.key === 'f' || e.key === 'F'){ e.preventDefault(); toggleFlag(i); return; }
    if (e.key === 'ArrowRight') j = i % SW_W < SW_W-1 ? i+1 : i; else if (e.key === 'ArrowLeft') j = i % SW_W ? i-1 : i;
    else if (e.key === 'ArrowDown') j = i + SW_W < SW_N ? i+SW_W : i; else if (e.key === 'ArrowUp') j = i >= SW_W ? i-SW_W : i;
    if (j >= 0){ e.preventDefault(); board.children[j].focus(); }
  });
  el.querySelector('#sweep-mode').onclick = () => { st.flagMode = !st.flagMode; api.save(st); render(); };
  render();
  if (fin()) api.show(api.existing());
  return () => clearTimeout(lpTimer);
}

/* =================================================================
   CIRCUIT
   ================================================================= */
const CI_W = 6, CI_N = 36;
const CI_DIRS = [[1,0,-1,4],[2,1,0,8],[4,0,1,1],[8,-1,0,2]]; // bit, dx, dy, opposite bit
const ciRot = (m, t) => { t = ((t % 4) + 4) % 4; for (let k = 0; k < t; k++) m = ((m << 1) | (m >> 3)) & 15; return m; };
const ciDeg = m => (m & 1) + ((m >> 1) & 1) + ((m >> 2) & 1) + ((m >> 3) & 1);
function ciNb(i, d){ const x = i % CI_W + CI_DIRS[d][1], y = Math.floor(i / CI_W) + CI_DIRS[d][2]; return (x >= 0 && x < CI_W && y >= 0 && y < CI_W) ? y*CI_W + x : -1; }
function ciMinTurns(cur, sol){ for (let t = 0; t < 4; t++) if (ciRot(cur, t) === sol) return t; return 0; }
function genCircuit(r){
  let mask = null;
  for (let t = 0; t < 60 && !mask; t++){
    const m = new Array(CI_N).fill(0), inT = new Array(CI_N).fill(false);
    const s = Math.floor(r()*CI_N); inT[s] = true;
    let edges = [], count = 1, ok = true;
    const add = a => { for (let d = 0; d < 4; d++){ const b = ciNb(a, d); if (b >= 0 && !inT[b]) edges.push([a, b, d]); } };
    add(s);
    while (count < CI_N){
      edges = edges.filter(([a,b]) => !inT[b] && ciDeg(m[a]) < 3);
      if (!edges.length){ ok = false; break; }
      const [a, b, d] = edges[Math.floor(r()*edges.length)];
      m[a] |= CI_DIRS[d][0]; m[b] |= CI_DIRS[d][3]; inT[b] = true; count++; add(b);
    }
    if (ok) mask = m;
  }
  if (!mask){ // safe fallback: a snake through every row
    mask = new Array(CI_N).fill(0);
    const order = []; for (let y = 0; y < CI_W; y++) for (let k = 0; k < CI_W; k++) order.push(y*CI_W + (y % 2 ? CI_W-1-k : k));
    for (let k = 0; k < order.length-1; k++){ const a = order[k], b = order[k+1]; const d = CI_DIRS.findIndex((_,dd) => ciNb(a, dd) === b); mask[a] |= CI_DIRS[d][0]; mask[b] |= CI_DIRS[d][3]; }
  }
  const source = Math.floor(r()*CI_N);
  let scr = null, par = 0;
  for (let t = 0; t < 30; t++){
    scr = Array.from({length:CI_N}, () => Math.floor(r()*4));
    par = mask.reduce((a, m, i) => a + ciMinTurns(ciRot(m, scr[i]), m), 0);
    if (par >= 30) break;
  }
  return {mask, source, scr, par};
}
function ciPowered(cur, source){
  const on = new Array(CI_N).fill(false); on[source] = true; const q = [source];
  while (q.length){ const a = q.pop(); for (let d = 0; d < 4; d++){ if (!(cur[a] & CI_DIRS[d][0])) continue; const b = ciNb(a, d); if (b >= 0 && !on[b] && (cur[b] & CI_DIRS[d][3])){ on[b] = true; q.push(b); } } }
  return on;
}
function ciSolved(cur, source){
  const on = ciPowered(cur, source);
  for (let a = 0; a < CI_N; a++){
    if (!on[a]) return false;
    for (let d = 0; d < 4; d++){ if (!(cur[a] & CI_DIRS[d][0])) continue; const b = ciNb(a, d); if (b < 0 || !(cur[b] & CI_DIRS[d][3])) return false; }
  }
  return true;
}
function ciSvg(m, isSource){
  const ends = {1:[50,0], 2:[100,50], 4:[50,100], 8:[0,50]};
  let s = '<svg viewBox="0 0 100 100" aria-hidden="true">';
  [1,2,4,8].forEach(b => { if (m & b) s += `<line x1="50" y1="50" x2="${ends[b][0]}" y2="${ends[b][1]}" stroke="currentColor" stroke-width="18"/>`; });
  s += `<circle cx="50" cy="50" r="9" fill="currentColor"/>`;
  if (isSource) s += `<rect x="25" y="25" width="50" height="50" rx="10" fill="currentColor"/><path d="M54 32 40 53h10l-4 15 14-22H50z" fill="var(--surface)"/>`;
  else if (ciDeg(m) === 1) s += `<circle cx="50" cy="50" r="19" fill="currentColor"/><circle cx="50" cy="50" r="8" fill="var(--surface)"/>`;
  return s + '</svg>';
}
function mountCircuit(el, api){
  const G = genCircuit(api.rng());
  const st = api.load(() => ({turns:new Array(CI_N).fill(0), moves:0, started:false}));
  const fin = () => !!api.existing();
  const cur = () => G.mask.map((m, i) => ciRot(m, G.scr[i] + st.turns[i]));
  el.innerHTML = `
    <div class="circuit-wrap">
      <div class="circuit-top">
        <div class="circuit-stat"><span class="label">Turns</span><br><b id="circuit-moves">0</b><span> / par ${G.par}</span></div>
        <div class="circuit-stat" style="text-align:right"><span class="label">Powered</span><br><b id="circuit-on">0</b><span> / ${CI_N}</span></div>
      </div>
      <div class="circuit-board" id="circuit-board">${G.mask.map((m, i) => `<button class="circuit-cell" data-i="${i}" aria-label="Tile row ${Math.floor(i/CI_W)+1}, column ${i%CI_W+1}${i===G.source?', power source':''}">${ciSvg(m, i === G.source)}</button>`).join('')}</div>
      <p class="msg" id="circuit-msg" aria-live="polite"></p>
      <p class="hint" id="circuit-hint">Tap a tile to turn it a quarter clockwise. Light up every tile with no loose wires.</p>
    </div>`;
  const board = el.querySelector('#circuit-board');
  const btns = [...board.children];
  function update(){
    const c = cur(), on = ciPowered(c, G.source);
    btns.forEach((b, i) => { b.querySelector('svg').style.transform = `rotate(${(G.scr[i] + st.turns[i]) * 90}deg)`; b.classList.toggle('on', on[i]); });
    el.querySelector('#circuit-moves').textContent = st.moves;
    el.querySelector('#circuit-on').textContent = on.filter(Boolean).length;
  }
  function lock(){ board.classList.add('done'); btns.forEach(b => b.disabled = true); el.querySelector('#circuit-hint').hidden = true; }
  board.addEventListener('click', e => {
    const b = e.target.closest('.circuit-cell'); if (!b || fin()) return;
    const i = +b.dataset.i;
    st.turns[i]++; st.moves++; st.started = true; api.save(st); update();
    if (ciSolved(cur(), G.source)){
      const n = st.moves, stars = n <= G.par ? 3 : n <= G.par + 8 ? 2 : 1;
      lock();
      api.finish({score: n, won:true, title: n <= G.par ? 'Perfect wiring' : 'All lit up', detail:`Every tile is powered with no loose ends. ${plural(n,'turn')} against a par of ${G.par}.`,
        summary:'★'.repeat(stars) + '☆'.repeat(3-stars),
        share:`Daybook Circuit No. ${DAY_NO}\n⚡ ${'★'.repeat(stars)}${'☆'.repeat(3-stars)} ${n} turns (par ${G.par})`});
    }
  });
  update();
  if (fin()){ lock(); api.show(api.existing()); }
  return null;
}

/* =================================================================
   SPILL
   ================================================================= */
const SP_N = 12, SP_K = 6, SP_SYM = ['●','▲','■','◆','★','✚'], SP_NAMES = ['red','orange','yellow','green','blue','purple'];
function spRegion(g){
  const own = new Array(g.length).fill(false), c = g[0], q = [0]; own[0] = true;
  while (q.length){ const i = q.pop(), x = i % SP_N, y = Math.floor(i / SP_N);
    for (const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const xx = x+dx, yy = y+dy; if (xx < 0 || xx >= SP_N || yy < 0 || yy >= SP_N) continue; const j = yy*SP_N+xx; if (!own[j] && g[j] === c){ own[j] = true; q.push(j); } } }
  return own;
}
function spMove(g, k){ const own = spRegion(g); const out = g.slice(); for (let i = 0; i < out.length; i++) if (own[i]) out[i] = k; return out; }
const spSize = g => spRegion(g).filter(Boolean).length;
const spDone = g => g.every(v => v === g[0]);
function spSolve(g0, look){
  let g = g0.slice(), moves = 0;
  while (!spDone(g) && moves < 80){
    let best = -1, bestK = -1;
    for (let k = 0; k < SP_K; k++){
      if (k === g[0]) continue;
      const g1 = spMove(g, k);
      let score = spSize(g1);
      if (look > 1 && !spDone(g1)){ let b2 = 0; for (let k2 = 0; k2 < SP_K; k2++){ if (k2 === g1[0]) continue; b2 = Math.max(b2, spSize(spMove(g1, k2))); } score = score + b2 * 1.01; }
      else if (spDone(g1)) score = 1e9;
      if (score > best){ best = score; bestK = k; }
    }
    g = spMove(g, bestK); moves++;
  }
  return moves;
}
function genSpill(r){
  const g = Array.from({length:SP_N*SP_N}, () => Math.floor(r()*SP_K));
  const limit = Math.min(spSolve(g, 1), spSolve(g, 2)) + 1;
  return {g, limit};
}
function mountSpill(el, api){
  const G = genSpill(api.rng());
  const st = api.load(() => ({moves:[], started:false}));
  const fin = () => !!api.existing();
  const board = () => st.moves.reduce((g, k) => spMove(g, k), G.g.slice());
  el.innerHTML = `
    <div class="spill-wrap">
      <div class="spill-top">
        <div class="spill-stat"><span class="label">Moves</span><br><b id="spill-moves">0</b><span> / ${G.limit}</span></div>
        <div class="spill-stat" style="text-align:right"><span class="label">Yours</span><br><b id="spill-own">0</b><span> / ${SP_N*SP_N}</span></div>
      </div>
      <div class="spill-board" id="spill-board" role="img" aria-label="12 by 12 board of coloured squares">${G.g.map(() => '<div class="spill-cell"></div>').join('')}</div>
      <div class="spill-pal" id="spill-pal" role="group" aria-label="Choose a colour">${SP_SYM.map((s,k) => `<button class="spill-btn spill-k${k}" data-k="${k}" aria-label="${SP_NAMES[k]} (key ${k+1})">${s}</button>`).join('')}</div>
      <p class="msg" id="spill-msg" aria-live="polite"></p>
      <p class="hint" id="spill-hint">Your patch starts in the top-left corner. Pick a colour to pour it outward. Keys 1–6 work too.</p>
    </div>`;
  const cells = [...el.querySelector('#spill-board').children];
  const pal = el.querySelector('#spill-pal');
  function render(){
    const g = board(), own = spRegion(g), over = fin();
    cells.forEach((c, i) => { c.className = 'spill-cell spill-k' + g[i]; });
    el.querySelector('#spill-moves').textContent = st.moves.length;
    el.querySelector('#spill-own').textContent = own.filter(Boolean).length;
    [...pal.children].forEach((b, k) => { b.classList.toggle('cur', k === g[0]); b.disabled = over || k === g[0]; });
    pal.classList.toggle('done', over);
    el.querySelector('#spill-hint').hidden = over;
  }
  function choose(k){
    if (fin()) return;
    const g = board(); if (k === g[0]) return;
    st.moves.push(k); st.started = true; api.save(st);
    const g2 = board(), n = st.moves.length;
    render();
    if (spDone(g2)){
      api.finish({score: n, won:true, title: n < G.limit ? 'Flooded with moves to spare' : 'Flooded', detail:`The whole board is one colour after ${plural(n,'move')}. The limit was ${G.limit}.`,
        summary:`${n}/${G.limit}`, share:`Daybook Spill No. ${DAY_NO}\n🌊 Flooded in ${n}/${G.limit} moves`});
      render();
    } else if (n >= G.limit){
      const left = SP_N*SP_N - spSize(g2);
      api.finish({won:false, title:'Ran dry', detail:`${plural(left,'square')} still to cover when the ${G.limit} moves ran out.`,
        summary:`X/${G.limit}`, share:`Daybook Spill No. ${DAY_NO}\n🏜️ Ran dry · ${left} squares left`});
      render();
    }
  }
  pal.onclick = e => { const b = e.target.closest('[data-k]'); if (b) choose(+b.dataset.k); };
  const onKey = e => { if (e.metaKey || e.ctrlKey || e.altKey) return; const k = parseInt(e.key, 10); if (k >= 1 && k <= SP_K){ e.preventDefault(); choose(k-1); } };
  document.addEventListener('keydown', onKey);
  render();
  if (fin()) api.show(api.existing());
  return () => document.removeEventListener('keydown', onKey);
}

/* ---------- register ---------- */
register({id:'pixel', name:'Pixel', cat:'logic', mins:7, mount:mountPixel,
  blurb:'Paint a hidden 10×10 picture using only the number clues around the grid.',
  how:['Each number is a run of filled squares in that row or column, in order, with at least one gap between runs.','Tap or drag to fill squares. Switch to Mark to note squares you know are empty.','A clue turns grey when its line matches. Fill every line correctly to finish.','Mistakes cost nothing. Showing the solution ends your streak.'],
  art:'<svg viewBox="0 0 120 80" aria-hidden="true"><g fill="currentColor" font-family="JetBrains Mono,monospace" font-weight="700" font-size="11"><text x="12" y="30">2</text><text x="12" y="46">1 1</text><text x="12" y="62">3</text><text x="50" y="14">1</text><text x="66" y="14">2</text><text x="82" y="14">1</text></g><g stroke="currentColor" stroke-width="2"><rect x="44" y="20" width="48" height="48" fill="none"/></g><g fill="currentColor"><rect x="44" y="20" width="16" height="16"/><rect x="60" y="20" width="16" height="16"/><rect x="44" y="36" width="16" height="16" fill-opacity=".2"/><rect x="76" y="36" width="16" height="16"/><rect x="44" y="52" width="16" height="16"/><rect x="60" y="52" width="16" height="16"/><rect x="76" y="52" width="16" height="16"/></g></svg>'});
register({id:'sweep', name:'Sweep', cat:'logic', mins:4, mount:mountSweep,
  blurb:'Twelve mines hide in a 9×9 field. Read the numbers and dig every safe square.',
  how:['Each number tells you how many mines touch that square, including diagonals.','Tap to dig. Long-press, right-click or press F to plant a flag.','Tap a number that already has its flags placed to dig all around it.','Dig a mine and the round ends. Clear every safe square to win.'],
  art:'<svg viewBox="0 0 120 80" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2.5"><rect x="22" y="6" width="22" height="22" rx="4"/><rect x="49" y="6" width="22" height="22" rx="4"/><rect x="76" y="6" width="22" height="22" rx="4" fill="currentColor" fill-opacity=".25"/><rect x="22" y="33" width="22" height="22" rx="4"/><rect x="49" y="33" width="22" height="22" rx="4" fill="currentColor" fill-opacity=".25"/><rect x="76" y="33" width="22" height="22" rx="4" fill="currentColor" fill-opacity=".25"/></g><g fill="currentColor" font-family="JetBrains Mono,monospace" font-weight="700" font-size="15" text-anchor="middle"><text x="33" y="22">1</text><text x="60" y="22">2</text><text x="33" y="49">1</text></g><path d="M86 12v12M86 12l9 4-9 4" stroke="currentColor" stroke-width="2.5" fill="currentColor"/><circle cx="60" cy="68" r="7" fill="currentColor"/><path d="M60 57v22M49 68h22" stroke="currentColor" stroke-width="2.5"/></svg>'});
register({id:'circuit', name:'Circuit', cat:'logic', mins:5, mount:mountCircuit,
  blurb:'Turn the tiles until every wire connects back to the power source.',
  how:['Tap a tile to turn it a quarter clockwise.','Tiles joined to the power source light up.','Win when every tile is lit and no wire ends in empty space.','Par is the fewest turns that solve it. Match it for three stars.'],
  art:'<svg viewBox="0 0 120 80" aria-hidden="true"><g stroke="currentColor" stroke-width="7" fill="none" stroke-linecap="round"><path d="M18 20h28v40h28V20h28"/><path d="M46 40H30"/></g><rect x="8" y="10" width="20" height="20" rx="5" fill="currentColor"/><circle cx="102" cy="20" r="8" fill="currentColor"/><circle cx="26" cy="40" r="7" fill="currentColor" fill-opacity=".4"/></svg>'});
register({id:'spill', name:'Spill', cat:'logic', mins:3, mount:mountSpill,
  blurb:'Pour colour from one corner until the whole board is a single shade.',
  how:['You own the patch of colour in the top-left corner.','Pick a colour and your patch turns that colour, swallowing every touching square of it.','Cover the whole board within the move limit to win.'],
  art:'<svg viewBox="0 0 120 80" aria-hidden="true"><g fill="currentColor"><rect x="20" y="8" width="16" height="16"/><rect x="36" y="8" width="16" height="16"/><rect x="52" y="8" width="16" height="16"/><rect x="20" y="24" width="16" height="16"/><rect x="36" y="24" width="16" height="16"/><rect x="20" y="40" width="16" height="16"/><g fill-opacity=".35"><rect x="68" y="8" width="16" height="16"/><rect x="52" y="24" width="16" height="16"/><rect x="36" y="40" width="16" height="16"/><rect x="20" y="56" width="16" height="16"/></g><g fill-opacity=".15"><rect x="84" y="8" width="16" height="16"/><rect x="68" y="24" width="16" height="16"/><rect x="84" y="24" width="16" height="16"/><rect x="52" y="40" width="16" height="16"/><rect x="68" y="40" width="16" height="16"/><rect x="84" y="40" width="16" height="16"/><rect x="36" y="56" width="16" height="16"/><rect x="52" y="56" width="16" height="16"/><rect x="68" y="56" width="16" height="16"/><rect x="84" y="56" width="16" height="16"/></g></g></svg>'});
