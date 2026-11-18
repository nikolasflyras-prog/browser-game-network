/* Logic pack A: Sixes, Halves, Skyline, Eight Queens, Lockpick */

/* ================================================================
   Pure, seeded generators (no DOM). Each takes a PRNG r().
   ================================================================ */
const lgaPop = m => { let c = 0; while (m) { m &= m - 1; c++; } return c; };

/* ---- Sixes: 6x6, boxes of 2 rows x 3 cols ---- */
const SIX_BOX = i => Math.floor(Math.floor(i/6)/2)*2 + Math.floor((i%6)/3);
const SIX_PEERS = Array.from({length:36}, (_,i) => {
  const s = [];
  for (let k=0;k<36;k++) if (k!==i && (Math.floor(k/6)===Math.floor(i/6) || k%6===i%6 || SIX_BOX(k)===SIX_BOX(i))) s.push(k);
  return s;
});
function sixCands(g, i){ let m = 0b1111110; for (const k of SIX_PEERS[i]) if (g[k]) m &= ~(1 << g[k]); return m; }
function sixFill(g, r){
  const i = g.indexOf(0); if (i < 0) return true;
  const m = sixCands(g, i);
  for (const v of shuffle([1,2,3,4,5,6], r)) if (m & (1<<v)) { g[i] = v; if (sixFill(g, r)) return true; g[i] = 0; }
  return false;
}
function sixCount(g, limit){
  let best = -1, bm = 0, bc = 9;
  for (let i=0;i<36;i++) if (!g[i]) { const m = sixCands(g, i), c = lgaPop(m); if (!c) return 0; if (c < bc) { bc = c; best = i; bm = m; } }
  if (best < 0) return 1;
  let n = 0;
  for (let v=1; v<=6 && n<limit; v++) if (bm & (1<<v)) { g[best] = v; n += sixCount(g, limit - n); g[best] = 0; }
  return n;
}
function genSixes(r){
  const sol = new Array(36).fill(0); sixFill(sol, r);
  const puz = sol.slice(), target = 14 + Math.floor(r()*3);
  let givens = 36;
  for (const i of shuffle([...Array(36).keys()], r)){
    if (givens <= target) break;
    const v = puz[i]; puz[i] = 0;
    if (sixCount(puz.slice(), 2) !== 1) puz[i] = v; else givens--;
  }
  return {sol, puz, givens};
}

/* ---- Halves: 6x6 binary ---- */
const HALF_ROWS = (() => {
  const out = [];
  for (let m=0;m<64;m++){
    const a = [...Array(6)].map((_,i) => (m>>i)&1);
    if (a.reduce((x,y)=>x+y,0) !== 3) continue;
    let ok = true; for (let i=2;i<6;i++) if (a[i]===a[i-1] && a[i]===a[i-2]) ok = false;
    if (ok) out.push(a);
  }
  return out;
})();
function halfColsOk(rows, final){
  const n = rows.length;
  for (let c=0;c<6;c++){
    let ones = 0; for (let k=0;k<n;k++) ones += rows[k][c];
    if (ones > 3 || n - ones > 3) return false;
    if (n >= 3 && rows[n-1][c] === rows[n-2][c] && rows[n-1][c] === rows[n-3][c]) return false;
  }
  if (final){ const cols = [...Array(6)].map((_,c) => rows.map(x => x[c]).join('')); if (new Set(cols).size < 6) return false; }
  return true;
}
function halfFill(rows, r){
  if (rows.length === 6) return true;
  for (const cand of shuffle(HALF_ROWS.slice(), r)){
    if (rows.includes(cand)) continue;
    rows.push(cand);
    if (halfColsOk(rows, rows.length === 6) && halfFill(rows, r)) return true;
    rows.pop();
  }
  return false;
}
function halfCount(puz, limit){
  let n = 0; const rows = [];
  const cands = [...Array(6)].map((_,ri) => HALF_ROWS.filter(a => a.every((v,c) => puz[ri*6+c] < 0 || puz[ri*6+c] === v)));
  (function go(){
    if (n >= limit) return;
    const k = rows.length;
    if (k === 6){ n++; return; }
    for (const cand of cands[k]){
      if (rows.includes(cand)) continue;
      rows.push(cand);
      if (halfColsOk(rows, k === 5)) go();
      rows.pop();
      if (n >= limit) return;
    }
  })();
  return n;
}
function genHalves(r){
  const rows = []; if (!halfFill(rows, r)) { rows.length = 0; halfFill(rows, mulberry32(7)); }
  const sol = rows.flat(), puz = sol.slice(), target = 11 + Math.floor(r()*3);
  let givens = 36;
  for (const i of shuffle([...Array(36).keys()], r)){
    if (givens <= target) break;
    const v = puz[i]; puz[i] = -1;
    if (halfCount(puz, 2) !== 1) puz[i] = v; else givens--;
  }
  return {sol, puz, givens};
}

/* ---- Skyline: 5x5 skyscrapers ---- */
const skyVis = a => { let m = 0, c = 0; for (const v of a) if (v > m) { m = v; c++; } return c; };
function skyLines(g, N){
  const row = k => g.slice(k*N, k*N+N), col = k => [...Array(N)].map((_,j) => g[j*N+k]);
  return {
    top: [...Array(N)].map((_,k) => col(k)), bottom: [...Array(N)].map((_,k) => col(k).reverse()),
    left: [...Array(N)].map((_,k) => row(k)), right: [...Array(N)].map((_,k) => row(k).reverse())
  };
}
function skyFillLatin(g, N, r){
  const i = g.indexOf(0); if (i < 0) return true;
  const rr = Math.floor(i/N), cc = i%N;
  for (const v of shuffle([...Array(N)].map((_,k)=>k+1), r)){
    let ok = true;
    for (let k=0;k<N;k++) if (g[rr*N+k] === v || g[k*N+cc] === v) { ok = false; break; }
    if (ok){ g[i] = v; if (skyFillLatin(g, N, r)) return true; g[i] = 0; }
  }
  return false;
}
function skyCount(cl, giv, N, limit){
  const g = new Array(N*N).fill(0), ru = new Array(N).fill(0), cu = new Array(N).fill(0);
  let n = 0;
  const prefOk = (get, len, clue) => {
    if (clue == null) return true;
    let m = 0, c = 0; for (let k=0;k<len;k++){ const v = get(k); if (v > m) { m = v; c++; } }
    if (c > clue) return false;
    if (m === N && c !== clue) return false;
    return true;
  };
  (function go(i){
    if (n >= limit) return;
    if (i === N*N){ n++; return; }
    const rr = Math.floor(i/N), cc = i%N;
    for (let v=1; v<=N; v++){
      if (giv[i] && giv[i] !== v) continue;
      const bit = 1<<v; if ((ru[rr] & bit) || (cu[cc] & bit)) continue;
      g[i] = v;
      let ok = prefOk(k => g[rr*N+k], cc+1, cl.left[rr]) && prefOk(k => g[k*N+cc], rr+1, cl.top[cc]);
      if (ok && cc === N-1 && cl.right[rr] != null){ let m=0,c=0; for (let k=N-1;k>=0;k--){ const x = g[rr*N+k]; if (x>m){m=x;c++;} } ok = c === cl.right[rr]; }
      if (ok && rr === N-1 && cl.bottom[cc] != null){ let m=0,c=0; for (let k=N-1;k>=0;k--){ const x = g[k*N+cc]; if (x>m){m=x;c++;} } ok = c === cl.bottom[cc]; }
      if (ok){ ru[rr] |= bit; cu[cc] |= bit; go(i+1); ru[rr] &= ~bit; cu[cc] &= ~bit; }
      g[i] = 0;
      if (n >= limit) return;
    }
  })(0);
  return n;
}
function genSkyline(r){
  const N = 5, sol = new Array(N*N).fill(0); skyFillLatin(sol, N, r);
  const L = skyLines(sol, N);
  const clues = {top:L.top.map(skyVis), bottom:L.bottom.map(skyVis), left:L.left.map(skyVis), right:L.right.map(skyVis)};
  const giv = new Array(N*N).fill(0);
  // Rarely the full clue set is ambiguous: add given cells until unique.
  const order = shuffle([...Array(N*N).keys()], r);
  for (let k=0; skyCount(clues, giv, N, 2) !== 1 && k < order.length; k++) giv[order[k]] = sol[order[k]];
  for (const i of order) if (giv[i]) { giv[i] = 0; if (skyCount(clues, giv, N, 2) !== 1) giv[i] = sol[i]; }
  // Then hide clues while the answer stays unique.
  const slots = shuffle(['top','bottom','left','right'].flatMap(s => [...Array(N)].map((_,k) => [s,k])), r);
  const minClues = 12 + Math.floor(r()*3);
  let shown = 20;
  for (const [s,k] of slots){
    if (shown <= minClues) break;
    const v = clues[s][k]; clues[s][k] = null;
    if (skyCount(clues, giv, N, 2) !== 1) clues[s][k] = v; else shown--;
  }
  return {sol, clues, giv, shown};
}

/* ---- Eight Queens ---- */
const QUEEN_SOLS = (() => {
  const out = [], cols = [];
  (function go(r){
    if (r === 8){ out.push(cols.slice()); return; }
    for (let c=0;c<8;c++){
      if (cols.some((cc,rr) => cc === c || Math.abs(cc - c) === r - rr)) continue;
      cols.push(c); go(r+1); cols.pop();
    }
  })(0);
  return out;
})();
function genQueens(r){
  const sol = QUEEN_SOLS[Math.floor(r()*QUEEN_SOLS.length)];
  const rows = shuffle([0,1,2,3,4,5,6,7], r).slice(0,2);
  return {sol: sol.map((c,row) => row*8+c), locked: rows.map(row => row*8 + sol[row])};
}
const queensAttack = (a, b) => { const ra = a>>3, ca = a&7, rb = b>>3, cb = b&7; return a !== b && (ra === rb || ca === cb || Math.abs(ra-rb) === Math.abs(ca-cb)); };

/* ---- Lockpick ---- */
const LOCK_COLORS = [
  {k:'R', name:'Red',    bg:'#E5484D', fg:'#FFFFFF'},
  {k:'O', name:'Orange', bg:'#F2903A', fg:'#1B1B1B'},
  {k:'Y', name:'Yellow', bg:'#F2D03B', fg:'#1B1B1B'},
  {k:'G', name:'Green',  bg:'#2F9E57', fg:'#FFFFFF'},
  {k:'B', name:'Blue',   bg:'#3B7BEA', fg:'#FFFFFF'},
  {k:'P', name:'Purple', bg:'#9B5DE5', fg:'#FFFFFF'}
];
function lockScore(code, guess){
  let x = 0; const a = [0,0,0,0,0,0], b = [0,0,0,0,0,0];
  for (let i=0;i<4;i++){ if (code[i] === guess[i]) x++; else { a[code[i]]++; b[guess[i]]++; } }
  let o = 0; for (let k=0;k<6;k++) o += Math.min(a[k], b[k]);
  return {x, o};
}
const genLock = r => [0,1,2,3].map(() => Math.floor(r()*6));

/* ================================================================
   Styles
   ================================================================ */
css(`
.lga-wrap{display:grid;gap:14px}
.lga-board{display:grid;grid-template-columns:repeat(var(--n),minmax(0,1fr));width:100%;max-width:400px;margin:0 auto;user-select:none;-webkit-user-select:none}
.lga-board.boxed{border:3px solid var(--ink);border-radius:10px;overflow:hidden;background:var(--surface)}
.lga-board.open{gap:5px}
.lga-c{aspect-ratio:1;min-width:0;border:0;border-right:1px solid var(--line);border-bottom:1px solid var(--line);background:var(--surface);font:700 clamp(20px,6.4vw,28px)/1 var(--f-mono);color:var(--gc);cursor:pointer;padding:0;position:relative;display:grid;place-items:center}
.lga-board.open .lga-c{border:1.5px solid var(--line);border-radius:8px}
.lga-c.g{color:var(--ink)}
.lga-board.open .lga-c.g{background:var(--sunk)}
.lga-c.bR{border-right:3px solid var(--ink)}.lga-c.bB{border-bottom:3px solid var(--ink)}
.lga-c.eR{border-right:0}.lga-c.eB{border-bottom:0}
.lga-c.hl{background:color-mix(in srgb,var(--gc) 8%,var(--surface))}
.lga-c.same{background:color-mix(in srgb,var(--gc) 22%,var(--surface))}
.lga-c.sel{background:color-mix(in srgb,var(--gc) 34%,var(--surface))}
.lga-c.bad{color:var(--bad)}
.lga-c:disabled{cursor:default}
.lga-notes{position:absolute;inset:3px;display:grid;grid-template-columns:repeat(3,1fr);font:500 clamp(8px,2.4vw,11px)/1 var(--f-mono);color:var(--muted);place-items:center}
.lga-clue{aspect-ratio:1;min-width:0;display:grid;place-items:center;font:700 clamp(15px,4.6vw,20px) var(--f-mono);color:var(--muted)}
.lga-clue.ok{color:var(--good)}.lga-clue.no{color:var(--bad)}
.lga-pad{display:grid;grid-template-columns:repeat(var(--k),minmax(0,1fr));gap:8px;max-width:400px;margin:0 auto;width:100%}
.lga-pad button{height:50px;border-radius:10px;border:0;background:var(--sunk);font:700 22px var(--f-mono);cursor:pointer;padding:0;min-width:0}
.lga-pad .lga-tool{font:700 14px var(--f-body)}
.lga-pad .on{background:var(--gc);color:var(--on-gc)}

.halves-board{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:6px;max-width:380px;margin:0 auto;width:100%}
.halves-c{aspect-ratio:1;min-width:0;border-radius:10px;border:1.5px solid var(--line);background:var(--surface);display:grid;place-items:center;cursor:pointer;padding:0}
.halves-c.g{background:var(--sunk);cursor:default}
.halves-c.bad{border-color:var(--bad);box-shadow:inset 0 0 0 2px var(--bad)}
.halves-c.sel{outline:3px solid var(--gc);outline-offset:1px}
.halves-c:disabled{cursor:default}
.halves-sun{width:56%;aspect-ratio:1;border-radius:50%;background:var(--gc);display:block}
.halves-moon{width:56%;aspect-ratio:1;border-radius:50%;border:3.5px solid var(--ink);display:block;box-sizing:border-box}
.halves-key{display:flex;gap:16px;justify-content:center;align-items:center;font-size:14px;color:var(--muted);flex-wrap:wrap}
.halves-key span{display:inline-flex;align-items:center;gap:6px}
.halves-key i{width:16px;height:16px;display:inline-block}

.queens-board{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));max-width:400px;width:100%;margin:0 auto;border:3px solid var(--ink);border-radius:8px;overflow:hidden}
.queens-c{aspect-ratio:1;min-width:0;border:0;padding:0;background:var(--surface);cursor:pointer;display:grid;place-items:center;color:var(--ink);position:relative}
.queens-c.dk{background:color-mix(in srgb,var(--gc) 16%,var(--sunk))}
.queens-c.att::after{content:"";width:18%;aspect-ratio:1;border-radius:50%;background:color-mix(in srgb,var(--bad) 55%,transparent)}
.queens-c svg{width:68%;height:68%}
.queens-c.lock{color:var(--gc)}
.queens-c.bad{color:var(--bad)}
.queens-c.bad svg{animation:queens-pulse 1s ease-in-out infinite alternate}
@keyframes queens-pulse{to{transform:scale(.86)}}
.queens-c:disabled{cursor:default}
.queens-status{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;max-width:400px;width:100%;margin:0 auto}
.queens-status b{font:700 18px var(--f-mono)}
.queens-tog{display:inline-flex;align-items:center;gap:8px;font-size:14px;color:var(--muted);cursor:pointer}
.queens-tog input{width:18px;height:18px;accent-color:var(--gc)}

.lock-rows{display:grid;gap:4px;max-width:400px;margin:0 auto;width:100%}
.lock-row{display:grid;grid-template-columns:20px repeat(4,minmax(0,1fr)) 40px;gap:8px;align-items:center;padding:5px 8px;border-radius:12px;border:1.5px solid transparent}
.lock-row.cur{border-color:var(--gc);background:color-mix(in srgb,var(--gc) 8%,var(--bg))}
.lock-row.code{border-color:var(--line);background:var(--surface)}
.lock-n{font:500 12px var(--f-mono);color:var(--muted)}
.lock-slot{width:100%;max-width:44px;aspect-ratio:1;justify-self:center;border-radius:50%;border:2px dashed var(--line);background:transparent;display:grid;place-items:center;padding:0;cursor:default}
.lock-row.cur .lock-slot{cursor:pointer}
.lock-slot.sel{outline:3px solid var(--gc);outline-offset:2px}
.lock-peg{width:100%;height:100%;border-radius:50%;display:grid;place-items:center;font:700 clamp(13px,4vw,17px)/1 var(--f-mono);box-shadow:inset 0 -3px 0 rgba(0,0,0,.18)}
.lock-slot.f{border:0}
.lock-pins{display:grid;grid-template-columns:repeat(2,12px);gap:5px;justify-content:center}
.lock-pin{width:12px;height:12px;border-radius:50%;border:2px solid var(--line);display:block}
.lock-pin.x{background:var(--ink);border-color:var(--ink)}
.lock-pin.o{border-color:var(--ink)}
.lock-pal{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;max-width:400px;margin:0 auto;width:100%}
.lock-pal button{aspect-ratio:1;max-height:56px;border-radius:50%;border:0;padding:0;cursor:pointer;background:none;display:grid;place-items:center}
.lock-pal .lock-peg{width:100%;max-width:56px;aspect-ratio:1;height:auto;font-size:19px}
.lock-legend{display:flex;gap:14px;justify-content:center;font-size:13px;color:var(--muted);flex-wrap:wrap}
.lock-legend span{display:inline-flex;align-items:center;gap:6px}
`);

/* ================================================================
   Shared number-grid board (Sixes, Skyline)
   ================================================================ */
function lgaGrid(el, api, cfg){
  const N = cfg.N, NN = N*N, clues = cfg.clues;
  const fin = () => !!api.existing();
  let st = api.load(null);
  if (!st || !Array.isArray(st.grid) || st.grid.length !== NN){
    st = {grid: cfg.givens.slice(), notes: new Array(NN).fill(0), sel: Math.max(0, cfg.givens.indexOf(0)), notesMode: false, started: false};
  }
  let msg = '', msgCls = '', arm = false;
  const R = i => Math.floor(i/N), C = i => i%N;
  const box = i => cfg.box ? Math.floor(R(i)/cfg.box[0])*(N/cfg.box[1]) + Math.floor(C(i)/cfg.box[1]) : -1;
  const peer = (a, b) => a !== b && (R(a) === R(b) || C(a) === C(b) || (!!cfg.box && box(a) === box(b)));
  function conflicts(g){
    const bad = new Set();
    for (let a=0;a<NN;a++) if (g[a]) for (let b=a+1;b<NN;b++) if (g[b] === g[a] && peer(a,b)) { bad.add(a); bad.add(b); }
    return bad;
  }
  function lineOf(side, k, g){
    if (side === 'left') return g.slice(k*N, k*N+N);
    if (side === 'right') return g.slice(k*N, k*N+N).reverse();
    const col = [...Array(N)].map((_,j) => g[j*N+k]);
    return side === 'top' ? col : col.reverse();
  }
  function clueState(side, k, g){
    const c = clues[side][k]; if (c == null) return '';
    const line = lineOf(side, k, g);
    if (line.some(v => !v)) return '';
    return skyVis(line) === c ? 'ok' : 'no';
  }
  const save = () => api.save(st);
  const touch = () => { if (!st.started){ st.started = true; api.start(); } };

  function cellHtml(i, bad, f){
    const v = st.grid[i], given = !!cfg.givens[i], s = st.sel;
    const cls = ['lga-c', given ? 'g' : '',
      !f && i === s ? 'sel' : '',
      !f && s != null && peer(i, s) ? 'hl' : '',
      !f && v && s != null && st.grid[s] === v && i !== s ? 'same' : '',
      bad.has(i) ? 'bad' : '',
      cfg.box && C(i)%cfg.box[1] === cfg.box[1]-1 && C(i) < N-1 ? 'bR' : '',
      cfg.box && R(i)%cfg.box[0] === cfg.box[0]-1 && R(i) < N-1 ? 'bB' : '',
      C(i) === N-1 ? 'eR' : '', R(i) === N-1 ? 'eB' : ''].join(' ');
    const notes = st.notes[i];
    const inner = v ? v : (notes ? `<span class="lga-notes">${[...Array(N)].map((_,d) => `<span>${notes & (1<<(d+1)) ? d+1 : ''}</span>`).join('')}</span>` : '');
    return `<button class="${cls}" data-i="${i}" aria-label="Row ${R(i)+1}, column ${C(i)+1}, ${v || 'empty'}${given ? ', given' : ''}" ${f ? 'disabled' : ''}>${inner}</button>`;
  }
  function render(){
    const f = fin(), bad = conflicts(st.grid);
    const hadFocus = el.contains(document.activeElement) && document.activeElement.classList.contains('lga-c');
    let board;
    if (clues){
      const cl = (side, k) => `<span class="lga-clue ${clueState(side, k, st.grid)}" aria-label="${side} clue ${clues[side][k] ?? 'none'}">${clues[side][k] ?? ''}</span>`;
      const parts = ['<span></span>', ...[...Array(N)].map((_,k) => cl('top',k)), '<span></span>'];
      for (let rr=0; rr<N; rr++){ parts.push(cl('left', rr)); for (let cc=0; cc<N; cc++) parts.push(cellHtml(rr*N+cc, bad, f)); parts.push(cl('right', rr)); }
      parts.push('<span></span>', ...[...Array(N)].map((_,k) => cl('bottom',k)), '<span></span>');
      board = `<div class="lga-board open" id="lgab" style="--n:${N+2}">${parts.join('')}</div>`;
    } else {
      board = `<div class="lga-board boxed" id="lgab" style="--n:${N}">${[...Array(NN)].map((_,i) => cellHtml(i, bad, f)).join('')}</div>`;
    }
    el.innerHTML = `<div class="lga-wrap">
      ${board}
      ${f ? '' : `<div class="lga-pad" id="lgap" style="--k:${N}">${[...Array(N)].map((_,d) => `<button data-d="${d+1}" aria-label="Enter ${d+1}">${d+1}</button>`).join('')}</div>
      <div class="lga-pad" id="lgat" style="--k:2"><button class="lga-tool ${st.notesMode ? 'on' : ''}" data-t="notes" aria-pressed="${st.notesMode}">Notes ${st.notesMode ? 'on' : 'off'}</button><button class="lga-tool" data-t="erase">Erase</button></div>`}
      <p class="msg ${msgCls}" aria-live="polite">${esc(msg)}</p>
      ${f ? '' : `<div class="row" style="justify-content:center"><button class="btn" id="lgag">${arm ? 'Tap again to give up' : 'Show solution'}</button></div>`}
    </div>`;
    if (f) return;
    el.querySelector('#lgab').onclick = e => { const b = e.target.closest('.lga-c'); if (!b) return; st.sel = +b.dataset.i; arm = false; render(); };
    el.querySelector('#lgap').onclick = e => { const b = e.target.closest('[data-d]'); if (b) setDigit(+b.dataset.d); };
    el.querySelector('#lgat').onclick = e => { const b = e.target.closest('[data-t]'); if (!b) return; if (b.dataset.t === 'notes'){ st.notesMode = !st.notesMode; save(); render(); } else erase(); };
    el.querySelector('#lgag').onclick = giveUp;
    if (hadFocus){ const c = el.querySelector(`.lga-c[data-i="${st.sel}"]`); if (c) c.focus({preventScroll:true}); }
  }
  function setDigit(d){
    if (fin()) return;
    const i = st.sel; if (i == null || cfg.givens[i]) return;
    touch(); arm = false; msg = ''; msgCls = '';
    if (st.notesMode && !st.grid[i]) st.notes[i] ^= (1<<d);
    else {
      st.grid[i] = st.grid[i] === d ? 0 : d; st.notes[i] = 0;
      if (st.grid[i]) for (let k=0;k<NN;k++) if (peer(i,k)) st.notes[k] &= ~(1<<d);
    }
    save(); check(); render();
  }
  function erase(){
    if (fin()) return;
    const i = st.sel; if (i == null || cfg.givens[i]) return;
    touch(); st.grid[i] = 0; st.notes[i] = 0; msg = ''; save(); render();
  }
  function move(dr, dc){
    const i = st.sel == null ? 0 : st.sel;
    st.sel = ((R(i)+dr+N)%N)*N + (C(i)+dc+N)%N; render();
  }
  function check(){
    if (st.grid.some(v => !v)) return;
    if (conflicts(st.grid).size === 0 && cfg.accept(st.grid)){
      save();
      api.finish({won: true, title: 'Solved', detail: cfg.detail, summary: 'Solved',
        share: `Daybook ${cfg.name} No. ${DAY_NO}\n${cfg.shareLine}`});
      return;
    }
    msg = cfg.clues ? 'Every square is filled, but a row, column or clue doesn’t add up.' : 'Every square is filled, but something breaks a rule.';
    msgCls = 'bad';
  }
  function giveUp(){
    if (!arm){ arm = true; render(); return; }
    st.grid = cfg.solution.slice(); st.notes = new Array(NN).fill(0); st.gaveUp = true; st.started = true; save();
    api.finish({won: false, title: 'Solution shown', detail: 'Here is the full grid. A fresh one arrives tomorrow.', summary: 'Gave up',
      share: `Daybook ${cfg.name} No. ${DAY_NO}\nGave up`});
    render();
  }
  const onKey = e => {
    if (fin() || e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    if (/^[1-9]$/.test(e.key) && +e.key <= N){ e.preventDefault(); setDigit(+e.key); }
    else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0'){ e.preventDefault(); erase(); }
    else if (e.key === 'ArrowUp'){ e.preventDefault(); move(-1,0); }
    else if (e.key === 'ArrowDown'){ e.preventDefault(); move(1,0); }
    else if (e.key === 'ArrowLeft'){ e.preventDefault(); move(0,-1); }
    else if (e.key === 'ArrowRight'){ e.preventDefault(); move(0,1); }
    else if (e.key === 'n' || e.key === 'N'){ e.preventDefault(); st.notesMode = !st.notesMode; save(); render(); }
  };
  document.addEventListener('keydown', onKey);
  render();
  const prev = api.existing(); if (prev) api.show(prev);
  return () => document.removeEventListener('keydown', onKey);
}

function mountSixes(el, api){
  const {sol, puz, givens} = genSixes(api.rng());
  return lgaGrid(el, api, {N:6, box:[2,3], givens:puz, solution:sol, name:'Sixes',
    accept: g => g.every((v,i) => v === sol[i]),
    detail: `Every row, column and box holds 1 to 6. You started from ${givens} given numbers.`,
    shareLine: `▦ 6×6 solved from ${givens} givens`});
}
function mountSkyline(el, api){
  const {sol, clues, giv, shown} = genSkyline(api.rng());
  const N = 5;
  return lgaGrid(el, api, {N, box:null, givens:giv, solution:sol, clues, name:'Skyline',
    accept: g => { const L = skyLines(g, N); return ['top','bottom','left','right'].every(s => clues[s].every((c,k) => c == null || skyVis(L[s][k]) === c)); },
    detail: `Every street lined up with its ${shown} clues.`,
    shareLine: `🏙 5×5 skyline from ${shown} clues`});
}

/* ================================================================
   Halves
   ================================================================ */
function mountHalves(el, api){
  const {sol, puz, givens} = genHalves(api.rng());
  const fin = () => !!api.existing();
  let st = api.load(null);
  if (!st || !Array.isArray(st.grid) || st.grid.length !== 36) st = {grid: puz.slice(), sel: null, started: false};
  let msg = '', msgCls = '', arm = false;
  const LINES = [];
  for (let k=0;k<6;k++){ LINES.push([...Array(6)].map((_,j) => k*6+j)); LINES.push([...Array(6)].map((_,j) => j*6+k)); }
  function violations(g){
    const bad = new Set();
    for (const L of LINES){
      for (let j=2;j<6;j++){ const a = g[L[j]]; if (a >= 0 && a === g[L[j-1]] && a === g[L[j-2]]) { bad.add(L[j]); bad.add(L[j-1]); bad.add(L[j-2]); } }
      for (const v of [0,1]){ const cells = L.filter(i => g[i] === v); if (cells.length > 3) cells.forEach(i => bad.add(i)); }
    }
    for (let t=0;t<2;t++){
      const ls = LINES.filter((_,idx) => idx%2 === t);
      for (let a=0;a<6;a++) for (let b=a+1;b<6;b++){
        const A = ls[a].map(i => g[i]), B = ls[b].map(i => g[i]);
        if (A.every(x => x >= 0) && A.join() === B.join()){ ls[a].forEach(i => bad.add(i)); ls[b].forEach(i => bad.add(i)); }
      }
    }
    return bad;
  }
  const sym = v => v === 1 ? '<span class="halves-sun"></span>' : v === 0 ? '<span class="halves-moon"></span>' : '';
  const NAME = v => v === 1 ? 'filled' : v === 0 ? 'hollow' : 'empty';
  function render(){
    const f = fin(), bad = violations(st.grid);
    el.innerHTML = `<div class="lga-wrap">
      <div class="halves-board" id="hb">${st.grid.map((v,i) => `<button class="halves-c ${puz[i] >= 0 ? 'g' : ''} ${bad.has(i) ? 'bad' : ''} ${!f && st.sel === i ? 'sel' : ''}" data-i="${i}" aria-label="Row ${Math.floor(i/6)+1}, column ${i%6+1}, ${NAME(v)}${puz[i] >= 0 ? ', given' : ''}" ${f ? 'disabled' : ''}>${sym(v)}</button>`).join('')}</div>
      <div class="halves-key"><span><i class="halves-sun"></i> Filled: 3 per line</span><span><i class="halves-moon"></i> Hollow: 3 per line</span></div>
      <p class="msg ${msgCls}" aria-live="polite">${esc(msg)}</p>
      ${f ? '' : `<div class="row" style="justify-content:center"><button class="btn" id="hgive">${arm ? 'Tap again to give up' : 'Show solution'}</button></div>`}
    </div>`;
    if (f) return;
    el.querySelector('#hb').onclick = e => { const b = e.target.closest('.halves-c'); if (b) tap(+b.dataset.i, null); };
    el.querySelector('#hgive').onclick = () => {
      if (!arm){ arm = true; render(); return; }
      st.grid = sol.slice(); st.started = true; api.save(st);
      api.finish({won:false, title:'Solution shown', detail:'Here is the full grid. A fresh one arrives tomorrow.', summary:'Gave up', share:`Daybook Halves No. ${DAY_NO}\nGave up`});
      render();
    };
  }
  function tap(i, val){
    if (fin() || puz[i] >= 0) return;
    if (!st.started){ st.started = true; api.start(); }
    arm = false; msg = ''; msgCls = '';
    const g = st.grid[i];
    st.grid[i] = val !== null ? val : (g < 0 ? 1 : g === 1 ? 0 : -1);
    st.sel = i; api.save(st);
    if (st.grid.every(v => v >= 0)){
      if (violations(st.grid).size === 0){
        api.finish({won:true, title:'Balanced', detail:`Every row and column splits three and three, with no runs of three. You started from ${givens} givens.`,
          summary:'Solved', share:`Daybook Halves No. ${DAY_NO}\n◐ 6×6 balanced from ${givens} givens`});
      } else { msg = 'The board is full, but the red squares break a rule.'; msgCls = 'bad'; }
    }
    render();
  }
  const onKey = e => {
    if (fin() || e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    const s = st.sel == null ? 0 : st.sel;
    const mv = {ArrowUp:-6, ArrowDown:6, ArrowLeft:-1, ArrowRight:1}[e.key];
    if (mv){ e.preventDefault(); let n = s + mv; if (e.key === 'ArrowLeft' && s%6 === 0) n = s+5; if (e.key === 'ArrowRight' && s%6 === 5) n = s-5; st.sel = (n+36)%36; render(); return; }
    if (st.sel == null) return;
    if (e.key === '1' || e.key === 'z'){ e.preventDefault(); tap(st.sel, 1); }
    else if (e.key === '2' || e.key === 'x'){ e.preventDefault(); tap(st.sel, 0); }
    else if (e.key === ' '){ e.preventDefault(); tap(st.sel, null); }
    else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0'){ e.preventDefault(); tap(st.sel, -1); }
  };
  document.addEventListener('keydown', onKey);
  render();
  const prev = api.existing(); if (prev) api.show(prev);
  return () => document.removeEventListener('keydown', onKey);
}

/* ================================================================
   Eight Queens
   ================================================================ */
const QUEEN_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 7.5l4.6 4.2L12 4l4.4 7.7L21 7.5 19 18H5z"/><rect x="5" y="19.2" width="14" height="2.6" rx="1.2" fill="currentColor"/></svg>';
function mountQueens(el, api){
  const {sol, locked} = genQueens(api.rng());
  const fin = () => !!api.existing();
  let st = api.load(null);
  if (!st || !Array.isArray(st.queens)) st = {queens: locked.slice(), moves: 0, shade: false, started: false};
  let msg = '', msgCls = '', arm = false;
  function bad(){ const s = new Set(); st.queens.forEach(a => st.queens.forEach(b => { if (queensAttack(a,b)) { s.add(a); s.add(b); } })); return s; }
  function render(){
    const f = fin(), b = bad(), q = new Set(st.queens);
    const att = new Set(); if (st.shade && !f) for (let i=0;i<64;i++) if (!q.has(i) && st.queens.some(a => queensAttack(a, i))) att.add(i);
    el.innerHTML = `<div class="lga-wrap">
      <div class="queens-status"><b>${st.queens.length}<span style="color:var(--muted);font-weight:500"> of 8 queens</span></b>
        ${f ? '' : `<label class="queens-tog"><input type="checkbox" id="qshade" ${st.shade ? 'checked' : ''}> Shade attacked squares</label>`}</div>
      <div class="queens-board" id="qb">${[...Array(64)].map((_,i) => {
        const r = i>>3, c = i&7, has = q.has(i), lk = locked.includes(i);
        const cls = ['queens-c', (r+c)%2 ? 'dk' : '', has && lk ? 'lock' : '', has && b.has(i) ? 'bad' : '', att.has(i) ? 'att' : ''].join(' ');
        return `<button class="${cls}" data-i="${i}" aria-label="${'ABCDEFGH'[c]}${8-r}${has ? (lk ? ', fixed queen' : ', queen') : ''}${has && b.has(i) ? ', under attack' : ''}" ${f || lk ? 'disabled' : ''}>${has ? QUEEN_SVG : ''}</button>`;
      }).join('')}</div>
      <p class="msg ${msgCls}" aria-live="polite">${esc(msg)}</p>
      ${f ? '' : `<div class="row" style="justify-content:center"><button class="btn" id="qclear" ${st.queens.length > locked.length ? '' : 'disabled'}>Clear my queens</button><button class="btn" id="qgive">${arm ? 'Tap again to give up' : 'Show a solution'}</button></div>`}
    </div>`;
    if (f) return;
    el.querySelector('#qb').onclick = e => { const x = e.target.closest('.queens-c'); if (x) tap(+x.dataset.i); };
    el.querySelector('#qshade').onchange = e => { st.shade = e.target.checked; api.save(st); render(); };
    el.querySelector('#qclear').onclick = () => { st.queens = locked.slice(); arm = false; msg = ''; api.save(st); render(); };
    el.querySelector('#qgive').onclick = () => {
      if (!arm){ arm = true; render(); return; }
      st.queens = sol.slice(); st.started = true; api.save(st);
      api.finish({won:false, title:'Solution shown', detail:'Here is one way to place all eight. There are 92 in total.', summary:'Gave up', share:`Daybook Eight Queens No. ${DAY_NO}\nGave up`});
      render();
    };
  }
  function tap(i){
    if (fin() || locked.includes(i)) return;
    if (!st.started){ st.started = true; api.start(); }
    arm = false; msg = ''; msgCls = '';
    const at = st.queens.indexOf(i);
    if (at >= 0) st.queens.splice(at, 1);
    else if (st.queens.length >= 8){ msg = 'All eight queens are out. Remove one first.'; msgCls = 'bad'; render(); return; }
    else st.queens.push(i);
    st.moves++; api.save(st);
    if (st.queens.length === 8){
      if (bad().size === 0){
        api.finish({score: st.moves, won:true, title:'Eight safe queens', detail:`No queen attacks another. You made ${plural(st.moves,'move')}.`, summary:'Solved',
          share:`Daybook Eight Queens No. ${DAY_NO}\n♛ all eight safe in ${plural(st.moves,'move')}`});
      } else { msg = 'Eight queens, but the red ones can attack each other.'; msgCls = 'bad'; }
    }
    render();
  }
  render();
  const prev = api.existing(); if (prev) api.show(prev);
}

/* ================================================================
   Lockpick
   ================================================================ */
function mountLockpick(el, api){
  const code = genLock(api.rng());
  const MAX = 8;
  const fin = () => !!api.existing();
  let st = api.load(null);
  if (!st || !Array.isArray(st.guesses)) st = {guesses: [], cur: [-1,-1,-1,-1], sel: 0, started: false};
  let msg = '', msgCls = '';
  const peg = c => { const k = LOCK_COLORS[c]; return `<span class="lock-peg" style="background:${k.bg};color:${k.fg}">${k.k}</span>`; };
  const pins = s => `<span class="lock-pins" aria-label="${s.x} right place, ${s.o} wrong place">${[...Array(4)].map((_,k) => `<i class="lock-pin ${k < s.x ? 'x' : k < s.x+s.o ? 'o' : ''}"></i>`).join('')}</span>`;
  function render(){
    const f = fin(), n = st.guesses.length;
    const rows = [];
    if (f) rows.push(`<div class="lock-row code"><span class="lock-n">★</span>${code.map(c => `<span class="lock-slot f">${peg(c)}</span>`).join('')}<span class="label" style="text-align:center">Code</span></div>`);
    for (let i=0;i<MAX;i++){
      if (i < n){
        const g = st.guesses[i];
        rows.push(`<div class="lock-row"><span class="lock-n">${i+1}</span>${g.map(c => `<span class="lock-slot f">${peg(c)}</span>`).join('')}${pins(lockScore(code, g))}</div>`);
      } else if (i === n && !f){
        rows.push(`<div class="lock-row cur" id="lcur"><span class="lock-n">${i+1}</span>${st.cur.map((c,k) => `<button class="lock-slot ${c >= 0 ? 'f' : ''} ${st.sel === k ? 'sel' : ''}" data-s="${k}" aria-label="Slot ${k+1}${c >= 0 ? ', ' + LOCK_COLORS[c].name : ', empty'}">${c >= 0 ? peg(c) : ''}</button>`).join('')}<span></span></div>`);
      } else {
        rows.push(`<div class="lock-row"><span class="lock-n">${i+1}</span>${'<span class="lock-slot"></span>'.repeat(4)}<span></span></div>`);
      }
    }
    el.innerHTML = `<div class="lga-wrap">
      <div class="lock-rows">${rows.join('')}</div>
      <div class="lock-legend"><span><i class="lock-pin x"></i> right colour, right place</span><span><i class="lock-pin o"></i> right colour, wrong place</span></div>
      ${f ? '' : `<div class="lock-pal" id="lpal">${LOCK_COLORS.map((c,k) => `<button data-c="${k}" aria-label="${c.name} (${c.k})">${peg(k)}</button>`).join('')}</div>
      <div class="row" style="justify-content:center"><button class="btn" id="ldel">Delete</button><button class="btn primary" id="lgo" ${st.cur.every(c => c >= 0) ? '' : 'disabled'}>Try code</button></div>`}
      <p class="msg ${msgCls}" aria-live="polite">${esc(msg)}</p>
    </div>`;
    if (f) return;
    el.querySelector('#lcur').onclick = e => { const b = e.target.closest('[data-s]'); if (b){ st.sel = +b.dataset.s; render(); } };
    el.querySelector('#lpal').onclick = e => { const b = e.target.closest('[data-c]'); if (b) place(+b.dataset.c); };
    el.querySelector('#ldel').onclick = del;
    el.querySelector('#lgo').onclick = submit;
  }
  function place(c){
    if (fin()) return;
    if (!st.started){ st.started = true; api.start(); }
    msg = ''; st.cur[st.sel] = c;
    let nx = -1; for (let k=1;k<=4;k++){ const j = (st.sel + k) % 4; if (st.cur[j] < 0){ nx = j; break; } }
    if (nx >= 0) st.sel = nx; else if (st.sel < 3) st.sel++;
    api.save(st); render();
  }
  function del(){
    if (fin()) return;
    if (st.cur[st.sel] < 0 && st.sel > 0) st.sel--;
    st.cur[st.sel] = -1; api.save(st); render();
  }
  function submit(){
    if (fin()) return;
    if (st.cur.some(c => c < 0)){ msg = 'Fill all four slots first.'; msgCls = 'bad'; render(); return; }
    if (!st.started){ st.started = true; api.start(); }
    const g = st.cur.slice(); st.guesses.push(g); st.cur = [-1,-1,-1,-1]; st.sel = 0; api.save(st);
    const s = lockScore(code, g), n = st.guesses.length;
    if (s.x === 4 || n >= MAX){
      const won = s.x === 4;
      const lines = st.guesses.map(x => { const q = lockScore(code, x); return '●'.repeat(q.x) + '○'.repeat(q.o) + '·'.repeat(4 - q.x - q.o); }).join('\n');
      const codeTxt = code.map(c => LOCK_COLORS[c].name).join(', ');
      api.finish({score: n, won, title: won ? (n <= 3 ? 'Picked clean' : 'Unlocked') : 'Still locked',
        detail: won ? `You opened it in ${plural(n,'try','tries')}. The code was ${codeTxt}.` : `The code was ${codeTxt}.`,
        summary: won ? `${n}/${MAX}` : `X/${MAX}`,
        share: `Daybook Lockpick No. ${DAY_NO}  ${won ? n : 'X'}/${MAX}\n${lines}`});
    } else { msg = `${plural(s.x,'peg')} in the right place, ${s.o} more of the right colour. ${plural(MAX - n,'try','tries')} left.`; msgCls = ''; }
    render();
  }
  const onKey = e => {
    if (fin() || e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    const k = LOCK_COLORS.findIndex(c => c.k === e.key.toUpperCase());
    if (k >= 0){ e.preventDefault(); place(k); }
    else if (e.key === 'Backspace' || e.key === 'Delete'){ e.preventDefault(); del(); }
    else if (e.key === 'Enter'){ e.preventDefault(); submit(); }
    else if (e.key === 'ArrowLeft'){ e.preventDefault(); st.sel = (st.sel+3)%4; render(); }
    else if (e.key === 'ArrowRight'){ e.preventDefault(); st.sel = (st.sel+1)%4; render(); }
  };
  document.addEventListener('keydown', onKey);
  render();
  const prev = api.existing(); if (prev) api.show(prev);
  return () => document.removeEventListener('keydown', onKey);
}

/* ================================================================
   Card art + registration
   ================================================================ */
const LGA_ART = {
  sixes: '<svg viewBox="0 0 120 80" aria-hidden="true"><g fill="none" stroke="currentColor"><rect x="24" y="4" width="72" height="72" rx="6" stroke-width="3"/><path d="M60 4v72M24 28h72M24 52h72" stroke-width="3"/><path d="M36 4v72M48 4v72M72 4v72M84 4v72M24 16h72M24 40h72M24 64h72" stroke-width="1" stroke-opacity=".45"/></g><g fill="currentColor" font-family="JetBrains Mono,monospace" font-weight="700" font-size="10" text-anchor="middle"><text x="30" y="14">3</text><text x="66" y="38">6</text><text x="42" y="62">1</text><text x="90" y="74">4</text><text x="78" y="26">2</text><text x="54" y="50">5</text></g></svg>',
  halves: '<svg viewBox="0 0 120 80" aria-hidden="true"><g stroke="currentColor" stroke-width="3"><circle cx="18" cy="24" r="10" fill="currentColor"/><circle cx="46" cy="24" r="10" fill="none"/><circle cx="74" cy="24" r="10" fill="currentColor"/><circle cx="102" cy="24" r="10" fill="none"/><circle cx="18" cy="56" r="10" fill="none"/><circle cx="46" cy="56" r="10" fill="currentColor"/><circle cx="74" cy="56" r="10" fill="none"/><circle cx="102" cy="56" r="10" fill="currentColor"/></g></svg>',
  skyline: '<svg viewBox="0 0 120 80" aria-hidden="true"><g fill="currentColor"><rect x="24" y="46" width="14" height="26" fill-opacity=".35"/><rect x="42" y="22" width="14" height="50"/><rect x="60" y="34" width="14" height="38" fill-opacity=".35"/><rect x="78" y="10" width="14" height="62"/><rect x="96" y="40" width="14" height="32" fill-opacity=".35"/></g><path d="M20 72h94" stroke="currentColor" stroke-width="3"/><text x="6" y="66" fill="currentColor" font-family="JetBrains Mono,monospace" font-weight="700" font-size="15">3</text></svg>',
  queens: (() => {
    let s = '<svg viewBox="0 0 120 80" aria-hidden="true"><rect x="24" y="4" width="72" height="72" rx="4" fill="none" stroke="currentColor" stroke-width="3"/><g fill="currentColor" fill-opacity=".22">';
    for (let r=0;r<4;r++) for (let c=0;c<4;c++) if ((r+c)%2) s += `<rect x="${24+c*18}" y="${4+r*18}" width="18" height="18"/>`;
    s += '</g><g fill="currentColor"><path transform="translate(42 22) scale(.75)" d="M3 7.5l4.6 4.2L12 4l4.4 7.7L21 7.5 19 18H5z"/><path transform="translate(78 40) scale(.75)" d="M3 7.5l4.6 4.2L12 4l4.4 7.7L21 7.5 19 18H5z"/><path transform="translate(24 58) scale(.75)" d="M3 7.5l4.6 4.2L12 4l4.4 7.7L21 7.5 19 18H5z"/></g></svg>';
    return s;
  })(),
  lockpick: '<svg viewBox="0 0 120 80" aria-hidden="true"><g stroke="currentColor" stroke-width="3"><circle cx="14" cy="40" r="10" fill="currentColor"/><circle cx="38" cy="40" r="10" fill="currentColor" fill-opacity=".35"/><circle cx="62" cy="40" r="10" fill="currentColor"/><circle cx="86" cy="40" r="10" fill="none"/></g><g fill="currentColor"><circle cx="106" cy="33" r="3.5"/><circle cx="115" cy="33" r="3.5"/></g><g fill="none" stroke="currentColor" stroke-width="2"><circle cx="106" cy="47" r="3"/><circle cx="115" cy="47" r="3"/></g></svg>'
};

register({id:'sixes', name:'Sixes', cat:'logic', mins:5, art:LGA_ART.sixes, mount:mountSixes,
  blurb:'A 6×6 number grid with one answer. Fill each row, column and box with 1 to 6.',
  how:['Fill every square with a number from 1 to 6.','Each row, each column and each 2×3 box uses every number once.','Tap a square, then a number. Turn on Notes to pencil in candidates.','Clashing numbers turn red. There is exactly one solution.']});
register({id:'halves', name:'Halves', cat:'logic', mins:4, art:LGA_ART.halves, mount:mountHalves,
  blurb:'Fill a 6×6 grid with filled and hollow dots, three of each in every line.',
  how:['Tap a square to cycle: filled dot, hollow dot, empty.','Every row and column has three of each.','No three of the same in a row, across or down.','No two rows match, and no two columns match. Rule breakers turn red.']});
register({id:'skyline', name:'Skyline', cat:'logic', mins:6, art:LGA_ART.skyline, mount:mountSkyline,
  blurb:'Build a 5×5 city of towers so each edge clue sees the right number of rooftops.',
  how:['Each row and column holds towers of height 1 to 5, once each.','A clue says how many towers you can see from that edge. Taller towers hide shorter ones behind them.','Clues turn green when their line is complete and correct.','Tap a square, then a height. Notes help track candidates.']});
register({id:'queens', name:'Eight Queens', cat:'logic', mins:3, art:LGA_ART.queens, mount:mountQueens,
  blurb:'Place eight chess queens so that none can attack another. Two are already fixed.',
  how:['Tap a square to place or remove a queen.','No two queens may share a row, column or diagonal.','Two queens are fixed for today and can’t move.','Queens that clash turn red. Any safe arrangement of eight wins.']});
register({id:'lockpick', name:'Lockpick', cat:'logic', mins:3, art:LGA_ART.lockpick, mount:mountLockpick,
  blurb:'Crack a four-colour code in eight tries using filled and hollow pin clues.',
  how:['The code is four colours from six. Colours can repeat.','After each try, a filled pin means right colour in the right place. A hollow pin means right colour, wrong place.','Pins don’t say which peg they belong to.','Open the lock within eight tries. Keys R O Y G B P, Enter and Backspace work too.']});
