/* Knowledge and word games: Capitals, Bigger, Sequence, Seek */

css(`
.cap-prog,.big-prog,.seq-prog{display:flex;gap:5px;justify-content:center}
.cap-prog i,.big-prog i,.seq-prog i{width:22px;height:8px;border-radius:4px;background:var(--line);display:block}
.cap-prog i.ok,.big-prog i.ok,.seq-prog i.ok{background:var(--good)}
.cap-prog i.no,.big-prog i.no,.seq-prog i.no{background:var(--bad)}
.seq-prog i.half{background:var(--warn)}
.cap-prog i.cur,.big-prog i.cur,.seq-prog i.cur{background:var(--gc)}
.cap-q,.seq-card{background:var(--surface);border:1px solid var(--line);border-radius:var(--r);padding:20px 18px;display:grid;gap:8px}
.cap-q h2{font-size:clamp(24px,5.5vw,32px);line-height:1.12;letter-spacing:-.015em}
.cap-opts{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.cap-opt{min-height:56px;border-radius:12px;border:2px solid var(--line);background:var(--surface);font:700 16px/1.25 var(--f-body);cursor:pointer;padding:8px 12px;display:flex;align-items:center;gap:10px;text-align:left}
.cap-opt:hover:not(:disabled){border-color:var(--gc)}
.cap-opt kbd{font:500 12px var(--f-mono);color:var(--muted);border:1px solid var(--line);border-radius:5px;padding:2px 6px;flex:none}
.cap-opt.ok{border-color:var(--good);background:color-mix(in srgb,var(--good) 14%,var(--surface))}
.cap-opt.no{border-color:var(--bad);background:color-mix(in srgb,var(--bad) 12%,var(--surface))}
.cap-opt:disabled{cursor:default}
.cap-review{list-style:none;margin:0;padding:0;display:grid;gap:6px}
.cap-review li{display:grid;grid-template-columns:22px 1fr;gap:10px;background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:10px 12px;font-size:15px}
.cap-review b{font-weight:700}
.cap-review .m{font-weight:700}
.cap-review .m.ok{color:var(--good)}.cap-review .m.no{color:var(--bad)}
.cap-review small{color:var(--muted);display:block}
@media (max-width:420px){.cap-opts{grid-template-columns:1fr}}

.big-pair{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:stretch}
.big-vs{align-self:center;font:700 14px var(--f-mono);color:var(--muted)}
.big-opt{min-height:150px;border-radius:14px;border:2px solid var(--line);background:var(--surface);cursor:pointer;padding:16px 12px;display:grid;align-content:center;justify-items:center;gap:8px;text-align:center}
.big-opt:hover:not(:disabled){border-color:var(--gc)}
.big-opt b{font:800 clamp(20px,4.6vw,28px)/1.1 var(--f-display);letter-spacing:-.015em}
.big-opt span{font:500 14px var(--f-mono);color:var(--muted);min-height:20px}
.big-opt kbd{font:500 12px var(--f-mono);color:var(--muted);border:1px solid var(--line);border-radius:5px;padding:2px 6px}
.big-opt.win{border-color:var(--good);background:color-mix(in srgb,var(--good) 12%,var(--surface))}
.big-opt.win span{color:var(--good);font-weight:700}
.big-opt.picked.lose{border-color:var(--bad);background:color-mix(in srgb,var(--bad) 10%,var(--surface))}
.big-opt:disabled{cursor:default;color:var(--ink)}
.big-score{text-align:center;font:700 15px var(--f-mono)}
.big-log{list-style:none;margin:0;padding:0;display:grid;gap:5px;font-size:14px}
.big-log li{display:flex;justify-content:space-between;gap:10px;background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:8px 12px;flex-wrap:wrap}
.big-log .n{font-family:var(--f-mono);color:var(--muted)}
@media (max-width:420px){.big-pair{grid-template-columns:1fr;}.big-vs{justify-self:center}.big-opt{min-height:104px}}

.seq-terms{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.seq-t{min-width:52px;height:52px;padding:0 10px;display:grid;place-items:center;border-radius:10px;background:var(--sunk);font:700 20px var(--f-mono);font-variant-numeric:tabular-nums}
.seq-t.q{background:transparent;border:2px dashed var(--gc);color:var(--gc)}
.seq-t.a{background:var(--good);color:var(--surface)}
.seq-t.x{background:var(--bad);color:var(--surface)}
.seq-form{display:flex;gap:8px}
.seq-form input{flex:1;min-width:0;height:48px;border-radius:10px;border:1.5px solid var(--line);background:var(--surface);padding:0 14px;font:700 20px var(--f-mono);color:var(--ink)}
.seq-form input:focus{outline:none;border-color:var(--gc)}
.seq-rule{margin:0;color:var(--muted);font-size:15px}
.seq-list{display:grid;gap:10px}
.seq-list .seq-card{padding:14px}
.seq-list .seq-t{min-width:42px;height:40px;font-size:16px}

.seek-wrap{display:grid;gap:14px;justify-items:center}
.seek-theme{font:800 26px/1.1 var(--f-display);letter-spacing:-.015em;text-align:center}
.seek-grid{position:relative;width:100%;max-width:460px;aspect-ratio:1;background:var(--surface);border:1px solid var(--line);border-radius:var(--r);touch-action:none;user-select:none;-webkit-user-select:none;cursor:pointer}
.seek-grid svg{position:absolute;inset:4px;width:calc(100% - 8px);height:calc(100% - 8px);pointer-events:none}
.seek-cells{position:absolute;inset:4px;display:grid;grid-template-columns:repeat(11,1fr);grid-template-rows:repeat(11,1fr)}
.seek-c{display:grid;place-items:center;font:700 clamp(13px,4.3vw,21px)/1 var(--f-mono);color:var(--ink)}
.seek-c.anchor{color:var(--gc);text-decoration:underline;text-decoration-thickness:3px}
.seek-band{stroke:color-mix(in srgb,var(--gc) 32%,transparent);stroke-linecap:round;fill:none}
.seek-band.rev{stroke:color-mix(in srgb,var(--muted) 30%,transparent)}
.seek-band.sel{stroke:color-mix(in srgb,var(--gc) 55%,transparent)}
.seek-words{display:flex;flex-wrap:wrap;gap:6px 14px;justify-content:center;max-width:460px;margin:0;padding:0;list-style:none}
.seek-words li{font:700 15px var(--f-mono);letter-spacing:.04em}
.seek-words li.f{text-decoration:line-through;color:var(--muted)}
.seek-words li.r{text-decoration:line-through;color:var(--muted);font-style:italic}
`);

/* ------------------------------------------------------------------
   CAPITALS
   ------------------------------------------------------------------ */
const CAPITALS = [
  // Europe
  ['Albania','Tirana','EU'],['Andorra','Andorra la Vella','EU'],['Austria','Vienna','EU'],['Belarus','Minsk','EU'],['Belgium','Brussels','EU'],
  ['Bosnia and Herzegovina','Sarajevo','EU'],['Bulgaria','Sofia','EU'],['Croatia','Zagreb','EU'],['Cyprus','Nicosia','EU'],['Czechia','Prague','EU'],
  ['Denmark','Copenhagen','EU'],['Estonia','Tallinn','EU'],['Finland','Helsinki','EU'],['France','Paris','EU'],['Germany','Berlin','EU'],
  ['Greece','Athens','EU'],['Hungary','Budapest','EU'],['Iceland','Reykjavík','EU'],['Ireland','Dublin','EU'],['Italy','Rome','EU'],
  ['Latvia','Riga','EU'],['Liechtenstein','Vaduz','EU'],['Lithuania','Vilnius','EU'],['Malta','Valletta','EU'],['Moldova','Chișinău','EU'],
  ['Montenegro','Podgorica','EU'],['Netherlands','Amsterdam','EU'],['North Macedonia','Skopje','EU'],['Norway','Oslo','EU'],['Poland','Warsaw','EU'],
  ['Portugal','Lisbon','EU'],['Romania','Bucharest','EU'],['Russia','Moscow','EU'],['Serbia','Belgrade','EU'],['Slovakia','Bratislava','EU'],
  ['Slovenia','Ljubljana','EU'],['Spain','Madrid','EU'],['Sweden','Stockholm','EU'],['Switzerland','Bern','EU'],['Ukraine','Kyiv','EU'],
  ['United Kingdom','London','EU'],
  // Asia
  ['Afghanistan','Kabul','AS'],['Armenia','Yerevan','AS'],['Azerbaijan','Baku','AS'],['Bahrain','Manama','AS'],['Bangladesh','Dhaka','AS'],
  ['Bhutan','Thimphu','AS'],['Brunei','Bandar Seri Begawan','AS'],['Cambodia','Phnom Penh','AS'],['China','Beijing','AS'],['Georgia','Tbilisi','AS'],
  ['India','New Delhi','AS'],['Iran','Tehran','AS'],['Iraq','Baghdad','AS'],['Japan','Tokyo','AS'],['Jordan','Amman','AS'],
  ['Kazakhstan','Astana','AS'],['Kyrgyzstan','Bishkek','AS'],['Laos','Vientiane','AS'],['Lebanon','Beirut','AS'],['Malaysia','Kuala Lumpur','AS'],
  ['Maldives','Malé','AS'],['Mongolia','Ulaanbaatar','AS'],['Myanmar','Naypyidaw','AS'],['Nepal','Kathmandu','AS'],['North Korea','Pyongyang','AS'],
  ['Oman','Muscat','AS'],['Pakistan','Islamabad','AS'],['Philippines','Manila','AS'],['Qatar','Doha','AS'],['Saudi Arabia','Riyadh','AS'],
  ['South Korea','Seoul','AS'],['Syria','Damascus','AS'],['Tajikistan','Dushanbe','AS'],['Thailand','Bangkok','AS'],['Timor-Leste','Dili','AS'],
  ['Turkey','Ankara','AS'],['Turkmenistan','Ashgabat','AS'],['United Arab Emirates','Abu Dhabi','AS'],['Uzbekistan','Tashkent','AS'],['Vietnam','Hanoi','AS'],
  // Africa
  ['Algeria','Algiers','AF'],['Angola','Luanda','AF'],['Botswana','Gaborone','AF'],['Burkina Faso','Ouagadougou','AF'],['Burundi','Gitega','AF'],
  ['Cameroon','Yaoundé','AF'],['Chad','N’Djamena','AF'],['DR Congo','Kinshasa','AF'],['Republic of the Congo','Brazzaville','AF'],['Egypt','Cairo','AF'],
  ['Eritrea','Asmara','AF'],['Ethiopia','Addis Ababa','AF'],['Gabon','Libreville','AF'],['Ghana','Accra','AF'],['Guinea','Conakry','AF'],
  ['Kenya','Nairobi','AF'],['Liberia','Monrovia','AF'],['Libya','Tripoli','AF'],['Madagascar','Antananarivo','AF'],['Malawi','Lilongwe','AF'],
  ['Mali','Bamako','AF'],['Mauritania','Nouakchott','AF'],['Morocco','Rabat','AF'],['Mozambique','Maputo','AF'],['Namibia','Windhoek','AF'],
  ['Niger','Niamey','AF'],['Nigeria','Abuja','AF'],['Rwanda','Kigali','AF'],['Senegal','Dakar','AF'],['Sierra Leone','Freetown','AF'],
  ['Somalia','Mogadishu','AF'],['South Sudan','Juba','AF'],['Tanzania','Dodoma','AF'],['Togo','Lomé','AF'],['Tunisia','Tunis','AF'],
  ['Uganda','Kampala','AF'],['Zambia','Lusaka','AF'],['Zimbabwe','Harare','AF'],
  // Americas
  ['Argentina','Buenos Aires','AM'],['Bahamas','Nassau','AM'],['Barbados','Bridgetown','AM'],['Belize','Belmopan','AM'],['Brazil','Brasília','AM'],
  ['Canada','Ottawa','AM'],['Chile','Santiago','AM'],['Colombia','Bogotá','AM'],['Costa Rica','San José','AM'],['Cuba','Havana','AM'],
  ['Dominican Republic','Santo Domingo','AM'],['Ecuador','Quito','AM'],['Guyana','Georgetown','AM'],['Haiti','Port-au-Prince','AM'],['Honduras','Tegucigalpa','AM'],
  ['Jamaica','Kingston','AM'],['Nicaragua','Managua','AM'],['Paraguay','Asunción','AM'],['Peru','Lima','AM'],['Suriname','Paramaribo','AM'],
  ['Trinidad and Tobago','Port of Spain','AM'],['United States','Washington, D.C.','AM'],['Uruguay','Montevideo','AM'],['Venezuela','Caracas','AM'],
  // Oceania
  ['Australia','Canberra','OC'],['Fiji','Suva','OC'],['New Zealand','Wellington','OC'],['Palau','Ngerulmud','OC'],['Papua New Guinea','Port Moresby','OC'],
  ['Samoa','Apia','OC'],['Solomon Islands','Honiara','OC'],['Tonga','Nukuʻalofa','OC'],['Vanuatu','Port Vila','OC']
];

function buildCapitals(r){
  const pool = shuffle(CAPITALS.slice(), r).slice(0, 10);
  const rev = new Set(shuffle([0,1,2,3,4,5,6,7,8,9], r).slice(0, 3));
  return pool.map((c, i) => {
    const isRev = rev.has(i);
    let ds = shuffle(CAPITALS.filter(x => x !== c && x[2] === c[2]), r).slice(0, 3);
    if (ds.length < 3) ds = ds.concat(shuffle(CAPITALS.filter(x => x !== c && !ds.includes(x)), r).slice(0, 3 - ds.length));
    const opts = shuffle([c, ...ds], r);
    return {
      rev: isRev,
      text: isRev ? `${c[1]} is the capital of which country?` : `What is the capital of ${c[0]}?`,
      opts: opts.map(o => isRev ? o[0] : o[1]),
      ans: opts.indexOf(c), c
    };
  });
}

function mountCapitals(el, api){
  const Q = buildCapitals(api.rng());
  let st = api.load({answers:[], started:false});
  const fin = () => !!api.existing();
  const score = () => st.answers.filter((a,i) => a === Q[i].ans).length;
  function prog(){
    return `<div class="cap-prog" aria-label="Question ${Math.min(st.answers.length+1,10)} of 10">${Q.map((q,i) => {
      const a = st.answers[i]; const cls = a === undefined ? (i === st.answers.length ? 'cur' : '') : (a === q.ans ? 'ok' : 'no');
      return `<i class="${cls}"></i>`; }).join('')}</div>`;
  }
  function render(){
    if (fin()){
      el.innerHTML = `${prog()}<ol class="cap-review">${Q.map((q,i) => { const ok = st.answers[i] === q.ans; return `<li><span class="m ${ok?'ok':'no'}">${ok?'✓':'✗'}</span><span><b>${esc(q.c[0])}</b> · ${esc(q.c[1])}${ok ? '' : `<small>You picked ${esc(st.answers[i] === undefined ? 'nothing' : q.opts[st.answers[i]])}</small>`}</span></li>`; }).join('')}</ol>`;
      return;
    }
    // index of question shown: the last answered one stays on screen until "Next"
    const showing = st.pending ? st.answers.length - 1 : st.answers.length;
    const q = Q[showing], a = st.answers[showing];
    const answered = a !== undefined;
    el.innerHTML = `${prog()}
      <div class="cap-q"><span class="label">Question ${showing+1} of 10 · ${score()} right so far</span><h2>${esc(q.text)}</h2></div>
      <div class="cap-opts" id="capopts">${q.opts.map((o,j) => {
        const cls = answered ? (j === q.ans ? 'ok' : (j === a ? 'no' : '')) : '';
        return `<button class="cap-opt ${cls}" data-j="${j}" ${answered?'disabled':''} aria-label="${esc(o)}"><kbd>${j+1}</kbd>${esc(o)}</button>`; }).join('')}</div>
      <p class="msg ${answered ? (a === q.ans ? 'good' : 'bad') : ''}" aria-live="polite">${answered ? (a === q.ans ? 'Correct.' : `It’s ${esc(q.opts[q.ans])}.`) : ''}</p>
      ${answered && showing < 9 ? `<div class="row" style="justify-content:center"><button class="btn primary" id="capnext">Next question</button></div>` : ''}`;
    el.querySelector('#capopts').onclick = e => { const b = e.target.closest('.cap-opt'); if (b && !b.disabled) answer(+b.dataset.j); };
    const nx = el.querySelector('#capnext'); if (nx){ nx.onclick = next; nx.focus({preventScroll:true}); }
  }
  function answer(j){
    if (fin() || st.pending) return;
    st.started = true; st.answers.push(j); st.pending = true; api.save(st);
    if (st.answers.length === 10){
      const n = score();
      const row = Q.map((q,i) => st.answers[i] === q.ans ? '🟩' : '🟥').join('');
      st.pending = false; api.save(st);
      api.finish({score: n, won: n >= 7, title: n === 10 ? 'Globetrotter' : n >= 7 ? 'Well travelled' : 'Back to the atlas',
        detail: `${n} of 10 capitals right.`, summary: `${n}/10`,
        share: `Daybook Capitals No. ${DAY_NO}  ${n}/10\n${row}`});
      render();
      return;
    }
    render();
  }
  function next(){ st.pending = false; api.save(st); render(); }
  const onKey = e => {
    if (fin() || e.metaKey || e.ctrlKey || e.altKey) return;
    if (/^[1-4]$/.test(e.key) && !st.pending){ e.preventDefault(); answer(+e.key - 1); }
    else if ((e.key === 'Enter' || e.key === ' ') && st.pending && document.activeElement?.id !== 'capnext'){ e.preventDefault(); next(); }
  };
  document.addEventListener('keydown', onKey);
  render();
  const prev = api.existing(); if (prev) api.show(prev);
  return () => document.removeEventListener('keydown', onKey);
}

/* ------------------------------------------------------------------
   BIGGER  (populations in millions, rounded 2024 estimates)
   ------------------------------------------------------------------ */
const POPS = [
  ['India',1451],['China',1419],['United States',345],['Indonesia',283],['Pakistan',251],['Nigeria',233],['Brazil',212],
  ['Bangladesh',174],['Russia',144],['Ethiopia',132],['Mexico',131],['Japan',124],['Egypt',116],['Philippines',116],
  ['DR Congo',109],['Vietnam',101],['Iran',91],['Turkey',87],['Germany',84],['Thailand',72],['United Kingdom',69],
  ['Tanzania',69],['France',66],['South Africa',64],['Italy',59],['Kenya',56],['Myanmar',54],['Colombia',53],
  ['South Korea',52],['Sudan',51],['Uganda',50],['Spain',48],['Algeria',47],['Iraq',46],['Argentina',45],
  ['Afghanistan',43],['Canada',40],['Poland',38],['Morocco',38],['Angola',38],['Uzbekistan',36],['Malaysia',35],
  ['Ghana',35],['Mozambique',35],['Saudi Arabia',34],['Peru',34],['Nepal',31],['Cameroon',29],['Venezuela',28],
  ['Australia',27],['Niger',27],['North Korea',26],['Sri Lanka',23],['Kazakhstan',21],['Chile',20],['Romania',19],
  ['Netherlands',18],['Ecuador',18],['Cambodia',17],['Zimbabwe',17],['Belgium',12],['Sweden',11],['Czechia',11],
  ['Cuba',11],['Portugal',10],['Greece',10],['Hungary',10],['Austria',9.1],['Switzerland',8.9],['Bulgaria',6.8],
  ['Singapore',5.9],['Denmark',6.0],['Finland',5.6],['Norway',5.6],['Ireland',5.3],['New Zealand',5.2],['Costa Rica',5.1],
  ['Mongolia',3.5],['Uruguay',3.4],['Qatar',3.0],['Jamaica',2.8],['Estonia',1.4],['Fiji',0.93],['Luxembourg',0.67],
  ['Malta',0.54],['Iceland',0.39]
];
function popFmt(m){ if (m >= 10) return `about ${Math.round(m).toLocaleString()} million`; if (m >= 1) return `about ${m.toFixed(1)} million`; return `about ${(Math.round(m*100)*10000).toLocaleString()}`; }

function buildBigger(r){
  const used = new Set(); const pairs = [];
  const range = k => k < 3 ? [2, 1e9] : k < 7 ? [1.4, 3] : [1.25, 1.7];
  for (let k=0; k<10; k++){
    const [lo, hi] = range(k); let got = null;
    for (let t=0; t<600 && !got; t++){
      const a = POPS[Math.floor(r()*POPS.length)], b = POPS[Math.floor(r()*POPS.length)];
      if (a === b || used.has(a[0]) || used.has(b[0])) continue;
      const ratio = Math.max(a[1],b[1]) / Math.min(a[1],b[1]);
      const ok = t < 500 ? (ratio >= lo && ratio <= hi) : ratio >= 1.25;
      if (ok) got = [a, b];
    }
    if (!got){ // deterministic fallback: first unused pair at least 25% apart
      outer: for (const a of POPS) for (const b of POPS){ if (a!==b && !used.has(a[0]) && !used.has(b[0]) && Math.max(a[1],b[1])/Math.min(a[1],b[1]) >= 1.25){ got = [a,b]; break outer; } }
    }
    used.add(got[0][0]); used.add(got[1][0]);
    pairs.push(got);
  }
  return pairs;
}

function mountBigger(el, api){
  const pairs = buildBigger(api.rng());
  let st = api.load({picks:[], started:false});   // picks[i] = 0|1 (side chosen)
  const fin = () => !!api.existing();
  const winner = p => p[0][1] > p[1][1] ? 0 : 1;
  const correct = () => st.picks.filter((s,i) => s === winner(pairs[i])).length;
  const over = () => st.picks.length >= 10 || st.picks.some((s,i) => s !== winner(pairs[i]));
  function prog(){
    return `<div class="big-prog" aria-hidden="true">${pairs.map((p,i) => { const s = st.picks[i]; const cls = s === undefined ? (i === st.picks.length && !over() ? 'cur' : '') : (s === winner(p) ? 'ok' : 'no'); return `<i class="${cls}"></i>`; }).join('')}</div>`;
  }
  function render(){
    if (fin() || over()){
      el.innerHTML = `${prog()}<div class="big-score">${correct()} of 10 in a row</div>
        <ol class="big-log">${st.picks.map((s,i) => { const p = pairs[i], w = winner(p); return `<li><span>${s===w?'✓':'✗'} <b>${esc(p[w][0])}</b> over ${esc(p[1-w][0])}</span><span class="n">${popFmt(p[w][1])} vs ${popFmt(p[1-w][1])}</span></li>`; }).join('')}</ol>`;
      return;
    }
    const showing = st.pending ? st.picks.length - 1 : st.picks.length;
    const p = pairs[showing], s = st.picks[showing], done = s !== undefined, w = winner(p);
    el.innerHTML = `${prog()}
      <div class="big-score">Round ${showing+1} of 10 · Which has more people?</div>
      <div class="big-pair" id="bigpair">
        ${[0,1].map(j => `<button class="big-opt ${done && j===w ? 'win' : ''} ${done && j===s ? 'picked' : ''} ${done && j===s && s!==w ? 'lose' : ''}" data-j="${j}" ${done?'disabled':''} aria-label="${esc(p[j][0])}"><kbd>${j+1}</kbd><b>${esc(p[j][0])}</b><span>${done ? popFmt(p[j][1]) : ''}</span></button>`).join('<span class="big-vs">or</span>')}
      </div>
      <p class="msg ${done ? (s===w?'good':'bad') : ''}" aria-live="polite">${done ? (s===w ? `Right. ${esc(p[w][0])} is bigger.` : '') : ''}</p>
      ${done && s === w && showing < 9 ? `<div class="row" style="justify-content:center"><button class="btn primary" id="bignext">Next pair</button></div>` : ''}`;
    el.querySelector('#bigpair').onclick = e => { const b = e.target.closest('.big-opt'); if (b && !b.disabled) pick(+b.dataset.j); };
    const nx = el.querySelector('#bignext'); if (nx){ nx.onclick = next; nx.focus({preventScroll:true}); }
  }
  function pick(j){
    if (fin() || st.pending) return;
    st.started = true; st.picks.push(j); st.pending = true; api.save(st);
    render();
    if (over()){
      const n = correct(); const missed = st.picks.length < 10 || st.picks[9] !== winner(pairs[9]);
      const row = '🟩'.repeat(n) + (n < 10 ? '🟥' : '');
      st.pending = false; api.save(st);
      setTimeout(() => {
        api.finish({score: n, won: n >= 7, title: n === 10 ? 'Census-perfect' : n >= 7 ? 'Good instincts' : missed ? 'Run over' : 'Run over',
          detail: `${n} correct in a row.` + (n < 10 ? (() => { const i = st.picks.length-1, p = pairs[i], w = winner(p); return ` ${p[w][0]} has ${popFmt(p[w][1])} people; ${p[1-w][0]} has ${popFmt(p[1-w][1])}.`; })() : ''),
          summary: `${n}/10`, share: `Daybook Bigger No. ${DAY_NO}  ${n}/10\n${row}`});
        render();
      }, 900);
    }
  }
  function next(){ st.pending = false; api.save(st); render(); }
  const onKey = e => {
    if (fin() || over() || e.metaKey || e.ctrlKey || e.altKey) return;
    if ((e.key === '1' || e.key === 'ArrowLeft') && !st.pending){ e.preventDefault(); pick(0); }
    else if ((e.key === '2' || e.key === 'ArrowRight') && !st.pending){ e.preventDefault(); pick(1); }
    else if (e.key === 'Enter' && st.pending && document.activeElement?.id !== 'bignext'){ e.preventDefault(); next(); }
  };
  document.addEventListener('keydown', onKey);
  if (st.pending && over()) { st.pending = false; }
  render();
  const prev = api.existing(); if (prev) api.show(prev);
  else if (over()) { // finished run but result not recorded (e.g. closed during the pause)
    const n = correct();
    api.finish({score: n, won: n >= 7, title: n >= 7 ? 'Good instincts' : 'Run over', detail: `${n} correct in a row.`, summary: `${n}/10`, share: `Daybook Bigger No. ${DAY_NO}  ${n}/10\n${'🟩'.repeat(n)}${n<10?'🟥':''}`});
    render();
  }
  return () => document.removeEventListener('keydown', onKey);
}

/* ------------------------------------------------------------------
   SEQUENCE
   ------------------------------------------------------------------ */
const SEQ_GEN = {
  arith(ri){ const a = ri(2,40), d = ri(3,17); return {t: [0,1,2,3,4,5,6].map(i => a + d*i), rule:`Add ${d} each time.`}; },
  arithDown(ri){ const d = ri(3,14), a = d*7 + ri(1,40); return {t: [0,1,2,3,4,5,6].map(i => a - d*i), rule:`Subtract ${d} each time.`}; },
  geom(ri, r){ const m = r() < .6 ? 2 : 3, a = m === 2 ? ri(1,9) : ri(1,4); return {t: [0,1,2,3,4,5,6].map(i => a * m**i), rule: m === 2 ? 'Each term doubles.' : 'Each term is multiplied by 3.'}; },
  squares(ri){ const s = ri(1,6), k = ri(-2,6); return {t: [0,1,2,3,4,5,6].map(i => (s+i)**2 + k), rule:`Square numbers (${s}², ${s+1}², ${s+2}², …)${k > 0 ? ` plus ${k}` : k < 0 ? ` minus ${-k}` : ''}.`}; },
  cubes(ri){ const s = ri(1,3), k = ri(-1,4); return {t: [0,1,2,3,4,5,6].map(i => (s+i)**3 + k), rule:`Cube numbers (${s}³, ${s+1}³, ${s+2}³, …)${k > 0 ? ` plus ${k}` : k < 0 ? ` minus ${-k}` : ''}.`}; },
  incdiff(ri){ const a = ri(1,20), d0 = ri(1,6), e = ri(1,3); const t = [a]; for (let i=0;i<6;i++) t.push(t[i] + d0 + e*i); return {t, rule:`The gap grows by ${e} each time (+${d0}, +${d0+e}, +${d0+2*e}, …).`}; },
  fib(ri){ const a = ri(1,6), b = ri(a,9); const t = [a,b]; while (t.length < 7) t.push(t[t.length-1] + t[t.length-2]); return {t, rule:'Each term is the sum of the two before it.'}; },
  alternate(ri, r){ const a1 = ri(1,20), d1 = ri(2,9), a2 = ri(30,80); let d2 = r() < .5 ? -ri(2,6) : ri(2,9); if (d2 === d1) d2 = d1 + 3; const t = [0,1,2,3,4,5,6].map(i => i % 2 === 0 ? a1 + d1*(i/2) : a2 + d2*((i-1)/2)); return {t, rule:`Two sequences take turns: one adds ${d1}, the other ${d2 < 0 ? 'subtracts ' + (-d2) : 'adds ' + d2}.`}; },
  multAdd(ri, r){ const m = r() < .65 ? 2 : 3, a = ri(1,4), c = ri(1,3) * (r() < .25 ? -1 : 1); const t = [a]; for (let i=0;i<6;i++) t.push(t[i]*m + c); return {t, rule:`Multiply by ${m}, then ${c > 0 ? 'add ' + c : 'subtract ' + (-c)}.`}; },
  altOps(ri){ const m = ri(2,3), c = ri(1,9), a = ri(1,6); const t = [a]; for (let i=0;i<6;i++) t.push(i % 2 === 0 ? t[i]*m : t[i] + c); return {t, rule:`Alternately multiply by ${m} and add ${c}.`}; }
};
const SEQ_TIERS = [['arith','geom'], ['squares','incdiff','arithDown'], ['fib','cubes','incdiff'], ['alternate','squares','incdiff'], ['multAdd','altOps']];
function seqValid(t){
  if (!t.every(v => Number.isInteger(v) && v > 0 && v < 10000)) return false;
  if (new Set(t).size < 6) return false;
  return true;
}
function buildSequence(r){
  const ri = (a,b) => a + Math.floor(r()*(b-a+1));
  return SEQ_TIERS.map(tier => {
    for (let t=0; t<60; t++){
      const fam = tier[Math.floor(r()*tier.length)];
      const s = SEQ_GEN[fam](ri, r);
      if (seqValid(s.t)) return {fam, show: s.t.slice(0,6), ans: s.t[6], rule: s.rule};
    }
    const a = ri(2,20), d = ri(3,9);
    return {fam:'arith', show:[0,1,2,3,4,5].map(i => a+d*i), ans: a+d*6, rule:`Add ${d} each time.`};
  });
}

function mountSequence(el, api){
  const S = buildSequence(api.rng());
  let st = api.load({res:[], cur:[], started:false});   // res[i]: 2 first try, 1 second try, 0 missed
  const fin = () => !!api.existing();
  let msg = '', msgCls = '';
  const total = () => st.res.filter(x => x > 0).length;
  function prog(){ return `<div class="seq-prog" aria-hidden="true">${S.map((_,i) => { const v = st.res[i]; return `<i class="${v === undefined ? (i === st.res.length ? 'cur' : '') : v === 2 ? 'ok' : v === 1 ? 'half' : 'no'}"></i>`; }).join('')}</div>`; }
  const terms = (s, last) => `<div class="seq-terms">${s.show.map(v => `<span class="seq-t">${v}</span>`).join('')}${last}</div>`;
  function render(){
    if (fin()){
      el.innerHTML = `${prog()}<div class="seq-list">${S.map((s,i) => { const v = st.res[i]; return `<div class="seq-card"><span class="label">Series ${i+1} · ${v === 2 ? 'first try' : v === 1 ? 'second try' : 'missed'}</span>${terms(s, `<span class="seq-t ${v ? 'a' : 'x'}">${s.ans}</span>`)}<p class="seq-rule">${esc(s.rule)}</p></div>`; }).join('')}</div>`;
      return;
    }
    const showing = st.pending ? st.res.length - 1 : st.res.length;
    const s = S[showing], v = st.res[showing], done = v !== undefined;
    el.innerHTML = `${prog()}
      <div class="seq-card"><span class="label">Series ${showing+1} of 5 · ${total()} solved · ${done ? '' : (2 - st.cur.length) + (2 - st.cur.length === 1 ? ' try' : ' tries') + ' left'}</span>
        ${terms(s, done ? `<span class="seq-t ${v ? 'a' : 'x'}">${s.ans}</span>` : `<span class="seq-t q">?</span>`)}
        ${done ? `<p class="seq-rule">${esc(s.rule)}</p>` : ''}
      </div>
      ${done ? '' : `<form class="seq-form" id="seqform" autocomplete="off"><input id="seqin" name="seqin" inputmode="numeric" aria-label="Next number in the series" placeholder="Next number"><button class="btn primary" type="submit">Check</button></form>`}
      <p class="msg ${msgCls}" aria-live="polite">${esc(msg)}</p>
      ${done && showing < 4 ? `<div class="row" style="justify-content:center"><button class="btn primary" id="seqnext">Next series</button></div>` : ''}`;
    const form = el.querySelector('#seqform');
    if (form){ const inp = el.querySelector('#seqin'); inp.focus({preventScroll:true}); form.onsubmit = e => { e.preventDefault(); guess(inp.value); }; }
    const nx = el.querySelector('#seqnext'); if (nx){ nx.onclick = next; nx.focus({preventScroll:true}); }
  }
  function guess(raw){
    const g = parseInt(String(raw).replace(/[,\s]/g, ''), 10);
    if (!Number.isFinite(g)) { msg = 'Type a whole number.'; msgCls = 'bad'; render(); return; }
    const s = S[st.res.length];
    st.started = true; st.cur.push(g);
    if (g === s.ans){ st.res.push(st.cur.length === 1 ? 2 : 1); st.cur = []; st.pending = true; msg = 'Correct.'; msgCls = 'good'; }
    else if (st.cur.length >= 2){ st.res.push(0); st.cur = []; st.pending = true; msg = `It was ${s.ans}.`; msgCls = 'bad'; }
    else { msg = `${g} isn’t it. One more try.`; msgCls = 'bad'; }
    api.save(st);
    if (st.res.length === 5){
      st.pending = false; api.save(st);
      const n = total();
      const row = st.res.map(v => v === 2 ? '🟩' : v === 1 ? '🟨' : '🟥').join('');
      api.finish({score: n, won: n >= 3, title: n === 5 && st.res.every(v => v === 2) ? 'Pattern master' : n >= 3 ? 'Sharp eye' : 'Tricky set',
        detail: `${n} of 5 series solved, ${st.res.filter(v => v === 2).length} on the first try.`, summary: `${n}/5`,
        share: `Daybook Sequence No. ${DAY_NO}  ${n}/5\n${row}`});
    }
    render();
    if (msgCls === 'bad' && st.cur.length) { const c = el.querySelector('.seq-card'); if (c) c.classList.add('shake'); }
  }
  function next(){ st.pending = false; msg = ''; msgCls = ''; api.save(st); render(); }
  render();
  const prev = api.existing(); if (prev) api.show(prev);
}

/* ------------------------------------------------------------------
   SEEK
   ------------------------------------------------------------------ */
const SEEK_THEMES = [
  ['Planets',['MERCURY','VENUS','EARTH','MARS','JUPITER','SATURN','URANUS','NEPTUNE']],
  ['Trees',['MAPLE','BIRCH','WILLOW','CEDAR','SPRUCE','ASPEN','CHESTNUT','SYCAMORE']],
  ['Weather',['THUNDER','DRIZZLE','BREEZE','SLEET','FROST','CYCLONE','RAINBOW','HUMIDITY']],
  ['In the kitchen',['SPATULA','WHISK','LADLE','COLANDER','SKILLET','KETTLE','TOASTER','GRATER']],
  ['Instruments',['VIOLIN','CELLO','TRUMPET','FLUTE','PIANO','GUITAR','CLARINET','TUBA']],
  ['Birds',['ROBIN','SPARROW','FALCON','PELICAN','HERON','PARROT','PENGUIN','OSPREY']],
  ['Gemstones',['RUBY','EMERALD','SAPPHIRE','DIAMOND','OPAL','TOPAZ','GARNET','AMETHYST']],
  ['Fabrics',['COTTON','SILK','LINEN','WOOL','VELVET','DENIM','SATIN','TWEED']],
  ['Spices',['CUMIN','PAPRIKA','NUTMEG','CLOVE','GINGER','SAFFRON','CINNAMON','TURMERIC']],
  ['Dances',['TANGO','WALTZ','SALSA','RUMBA','BALLET','POLKA','FOXTROT','SAMBA']],
  ['Outer space',['COMET','GALAXY','NEBULA','ORBIT','METEOR','QUASAR','PULSAR','ECLIPSE']],
  ['Fruit',['MANGO','PAPAYA','CHERRY','BANANA','APRICOT','LEMON','GRAPE','PEACH']],
  ['Vegetables',['CARROT','CELERY','SPINACH','TURNIP','RADISH','POTATO','PARSNIP','CABBAGE']],
  ['The ocean',['CORAL','SHARK','WHALE','OYSTER','SQUID','KELP','DOLPHIN','TIDE']],
  ['Sports',['TENNIS','HOCKEY','RUGBY','CRICKET','SOCCER','GOLF','BOXING','ROWING']],
  ['The body',['ELBOW','KNEE','SHOULDER','ANKLE','WRIST','SPINE','THUMB','SKULL']],
  ['Colours',['CRIMSON','AZURE','IVORY','AMBER','INDIGO','SCARLET','MAGENTA','OLIVE']],
  ['Tools',['HAMMER','WRENCH','CHISEL','PLIERS','DRILL','MALLET','SANDER','SPANNER']],
  ['Desserts',['CUSTARD','PUDDING','BROWNIE','MOUSSE','SORBET','TRIFLE','COOKIE','ECLAIR']],
  ['Rivers',['NILE','AMAZON','DANUBE','THAMES','VOLGA','GANGES','RHINE','YANGTZE']],
  ['Insects',['BEETLE','HORNET','MANTIS','CICADA','MOTH','FIREFLY','LADYBUG','TERMITE']],
  ['On the farm',['TRACTOR','BARN','STABLE','HAYSTACK','PADDOCK','SILO','ORCHARD','PLOUGH']],
  ['Furniture',['SOFA','TABLE','CHAIR','DRESSER','BOOKCASE','STOOL','CABINET','OTTOMAN']],
  ['Chess',['KNIGHT','BISHOP','QUEEN','KING','PAWN','ROOK','CHECKMATE','GAMBIT']],
  ['Camping',['TENT','LANTERN','COMPASS','CANOE','CAMPFIRE','HAMMOCK','BACKPACK','TRAIL']],
  ['Shapes',['CIRCLE','SQUARE','TRIANGLE','OVAL','HEXAGON','PENTAGON','RHOMBUS','CUBE']],
  ['Metals',['IRON','COPPER','SILVER','GOLD','COBALT','NICKEL','ZINC','TITANIUM']],
  ['Cheese',['CHEDDAR','BRIE','GOUDA','FETA','STILTON','RICOTTA','PARMESAN','CAMEMBERT']],
  ['Jobs',['DOCTOR','TEACHER','BAKER','PILOT','FARMER','NURSE','PLUMBER','LAWYER']],
  ['Mythical creatures',['DRAGON','UNICORN','PHOENIX','GRIFFIN','MERMAID','GOBLIN','TROLL','CENTAUR']],
  ['Chipmaking',['WAFER','SILICON','DIODE','CIRCUIT','FOUNDRY','DOPANT','CLEANROOM','GALLIUM']]
];
const SEEK_N = 11;
const SEEK_DIRS = [[1,0],[0,1],[1,1],[1,-1],[-1,0],[0,-1],[-1,-1],[-1,1]];
function seekCount(grid, w){
  let n = 0;
  for (let y=0; y<SEEK_N; y++) for (let x=0; x<SEEK_N; x++) for (const [dx,dy] of SEEK_DIRS){
    let ok = true;
    for (let i=0; i<w.length; i++){ const cx = x+dx*i, cy = y+dy*i; if (cx<0||cy<0||cx>=SEEK_N||cy>=SEEK_N||grid[cy*SEEK_N+cx] !== w[i]){ ok = false; break; } }
    if (ok) n++;
  }
  return n;
}
function buildSeek(r, theme){
  const words = theme[1].slice().sort((a,b) => b.length - a.length);
  const AB = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let attempt=0; attempt<60; attempt++){
    const grid = new Array(SEEK_N*SEEK_N).fill(null);
    const place = {};
    let ok = true;
    for (const w of words){
      let done = false;
      for (let t=0; t<400 && !done; t++){
        const [dx,dy] = SEEK_DIRS[Math.floor(r()*8)];
        const x = Math.floor(r()*SEEK_N), y = Math.floor(r()*SEEK_N);
        const ex = x + dx*(w.length-1), ey = y + dy*(w.length-1);
        if (ex<0||ey<0||ex>=SEEK_N||ey>=SEEK_N) continue;
        let fits = true;
        for (let i=0;i<w.length;i++){ const c = grid[(y+dy*i)*SEEK_N + x+dx*i]; if (c !== null && c !== w[i]) { fits = false; break; } }
        if (!fits) continue;
        for (let i=0;i<w.length;i++) grid[(y+dy*i)*SEEK_N + x+dx*i] = w[i];
        place[w] = {x, y, dx, dy}; done = true;
      }
      if (!done){ ok = false; break; }
    }
    if (!ok) continue;
    const free = grid.map((c,i) => c === null ? i : -1).filter(i => i >= 0);
    for (let f=0; f<40; f++){
      free.forEach(i => grid[i] = AB[Math.floor(r()*26)]);
      if (words.every(w => seekCount(grid, w) === 1)) return {grid, place, words: theme[1]};
    }
  }
  return null;
}

function mountSeek(el, api){
  const r = api.rng();
  let theme = api.pick(SEEK_THEMES), P = buildSeek(r, theme);
  for (let k=0; !P && k<SEEK_THEMES.length; k++){ theme = SEEK_THEMES[k]; P = buildSeek(r, theme); }
  const {grid, place, words} = P;
  let st = api.load({found:[], revealed:[], started:false});
  const fin = () => !!api.existing();
  let anchor = null, drag = null, arm = false, msg = '';
  el.innerHTML = `
    <div class="seek-wrap">
      <div class="seek-theme">${esc(theme[0])}</div>
      <div class="seek-grid" id="seekgrid" role="application" aria-label="Word search grid, ${SEEK_N} by ${SEEK_N}. Drag from the first letter of a word to its last, or tap the first letter then the last.">
        <svg viewBox="0 0 ${SEEK_N} ${SEEK_N}" id="seeksvg"></svg>
        <div class="seek-cells" id="seekcells">${grid.map((c,i) => `<span class="seek-c" data-i="${i}">${c}</span>`).join('')}</div>
      </div>
      <ul class="seek-words" id="seekwords"></ul>
      <p class="msg" id="seekmsg" aria-live="polite"></p>
      <div class="row" id="seekctl"></div>
    </div>`;
  const gEl = el.querySelector('#seekgrid'), svg = el.querySelector('#seeksvg'), cellsEl = el.querySelector('#seekcells');
  const line = (x1,y1,x2,y2,cls) => `<line class="seek-band ${cls}" x1="${x1+.5}" y1="${y1+.5}" x2="${x2+.5}" y2="${y2+.5}" stroke-width=".78"/>`;
  function paint(){
    let s = '';
    for (const w of words){ if (!st.found.includes(w) && !st.revealed.includes(w)) continue; const p = place[w]; s += line(p.x, p.y, p.x+p.dx*(w.length-1), p.y+p.dy*(w.length-1), st.revealed.includes(w) ? 'rev' : ''); }
    if (drag && drag.end) s += line(drag.sx, drag.sy, drag.end[0], drag.end[1], 'sel');
    svg.innerHTML = s;
    cellsEl.querySelectorAll('.anchor').forEach(c => c.classList.remove('anchor'));
    if (anchor) cellsEl.children[anchor[1]*SEEK_N + anchor[0]].classList.add('anchor');
    el.querySelector('#seekwords').innerHTML = words.map(w => `<li class="${st.found.includes(w) ? 'f' : st.revealed.includes(w) ? 'r' : ''}">${w}</li>`).join('');
    el.querySelector('#seekmsg').textContent = msg || `${st.found.length + st.revealed.length} of ${words.length} found`;
    const ctl = el.querySelector('#seekctl');
    if (fin()) { ctl.innerHTML = ''; return; }
    ctl.style.justifyContent = 'center';
    ctl.innerHTML = `<button class="btn" id="seekrev">${arm ? 'Tap again to reveal a word' : 'Reveal a word'}</button>`;
    ctl.querySelector('#seekrev').onclick = reveal;
  }
  function cellAt(e){
    const b = cellsEl.getBoundingClientRect();
    const x = Math.floor((e.clientX - b.left) / b.width * SEEK_N), y = Math.floor((e.clientY - b.top) / b.height * SEEK_N);
    return [clamp(x,0,SEEK_N-1), clamp(y,0,SEEK_N-1)];
  }
  function snapEnd(sx, sy, x, y){
    const dx = x - sx, dy = y - sy;
    if (!dx && !dy) return [sx, sy];
    const oct = Math.round(Math.atan2(dy, dx) / (Math.PI/4));
    const ux = Math.round(Math.cos(oct*Math.PI/4)), uy = Math.round(Math.sin(oct*Math.PI/4));
    let len = Math.max(Math.abs(dx), Math.abs(dy));
    while (len > 0 && (sx+ux*len < 0 || sy+uy*len < 0 || sx+ux*len >= SEEK_N || sy+uy*len >= SEEK_N)) len--;
    return [sx+ux*len, sy+uy*len];
  }
  function tryLine(sx, sy, ex, ey){
    const dx = Math.sign(ex-sx), dy = Math.sign(ey-sy), len = Math.max(Math.abs(ex-sx), Math.abs(ey-sy)) + 1;
    if (len < 2 || !(ex === sx || ey === sy || Math.abs(ex-sx) === Math.abs(ey-sy))) return false;
    let s = ''; for (let i=0;i<len;i++) s += grid[(sy+dy*i)*SEEK_N + sx+dx*i];
    const rev = s.split('').reverse().join('');
    const w = words.find(w => !st.found.includes(w) && !st.revealed.includes(w) && (w === s || w === rev));
    if (!w) return false;
    st.started = true; st.found.push(w); arm = false; msg = `Found ${w}.`; api.save(st); check();
    return true;
  }
  function check(){
    if (st.found.length + st.revealed.length < words.length || fin()) return;
    const rv = st.revealed.length;
    api.finish({score: rv, won: rv < 3, title: rv === 0 ? 'Eagle-eyed' : 'All found',
      detail: `${theme[0]}: ${words.join(', ')}.` + (rv ? ` You revealed ${plural(rv,'word')}.` : ''),
      summary: rv ? `${words.length - rv}/${words.length} found` : `${words.length}/${words.length}`,
      share: `Daybook Seek No. ${DAY_NO}\n🔎 ${theme[0]}: ${words.length - rv}/${words.length} found${rv ? ' · ' + rv + ' revealed' : ''}`});
  }
  function reveal(){
    if (fin()) return;
    if (!arm){ arm = true; msg = ''; paint(); return; }
    const w = words.find(w => !st.found.includes(w) && !st.revealed.includes(w));
    if (!w) return;
    st.started = true; st.revealed.push(w); arm = false; msg = `Revealed ${w}.`; api.save(st); paint(); check(); paint();
  }
  const onDown = e => {
    if (fin()) return;
    const [x,y] = cellAt(e);
    drag = {sx:x, sy:y, end:null, moved:false, id:e.pointerId};
    try { gEl.setPointerCapture(e.pointerId); } catch(_){}
    e.preventDefault();
  };
  const onMove = e => {
    if (!drag) return;
    const [x,y] = cellAt(e);
    if (x !== drag.sx || y !== drag.sy) drag.moved = true;
    if (drag.moved){ drag.end = snapEnd(drag.sx, drag.sy, x, y); paint(); }
  };
  const onUp = e => {
    if (!drag) return;
    const d = drag; drag = null;
    if (d.moved && d.end){
      anchor = null;
      if (!tryLine(d.sx, d.sy, d.end[0], d.end[1])) msg = '';
      paint(); return;
    }
    // tap mode
    if (!anchor){ anchor = [d.sx, d.sy]; msg = 'Now tap the last letter.'; }
    else if (anchor[0] === d.sx && anchor[1] === d.sy){ anchor = null; msg = ''; }
    else { const a = anchor; anchor = null; if (!tryLine(a[0], a[1], d.sx, d.sy)) msg = 'No word there. Try again.'; }
    paint();
  };
  gEl.addEventListener('pointerdown', onDown);
  gEl.addEventListener('pointermove', onMove);
  gEl.addEventListener('pointerup', onUp);
  gEl.addEventListener('pointercancel', () => { drag = null; paint(); });
  paint();
  const prev = api.existing(); if (prev) api.show(prev);
}

/* ---------- register ---------- */
register({id:'capitals', name:'Capitals', cat:'know', mins:2, blurb:'Ten capital cities, four choices each.', mount:mountCapitals,
  art:'<svg viewBox="0 0 120 80" aria-hidden="true"><path d="M60 6c-13 0-23 10-23 22 0 16 23 44 23 44s23-28 23-44C83 16 73 6 60 6z" fill="none" stroke="currentColor" stroke-width="3"/><path d="M60 17l3.5 7.2 7.9 1.1-5.7 5.6 1.3 7.9L60 35l-7 3.8 1.3-7.9-5.7-5.6 7.9-1.1z" fill="currentColor"/><path d="M14 74h92" stroke="currentColor" stroke-width="3" stroke-dasharray="2 6" stroke-linecap="round"/></svg>',
  how:['Answer ten questions about capital cities. Each has four choices.','A few questions run backwards: you get the city and pick the country.','You see the right answer straight away. Use keys 1 to 4 if you like.','Seven or more right keeps your streak.']});
register({id:'bigger', name:'Bigger', cat:'know', mins:2, blurb:'Two countries. Tap the one with more people. One miss ends the run.', mount:mountBigger,
  art:'<svg viewBox="0 0 120 80" aria-hidden="true"><rect x="18" y="38" width="28" height="36" rx="3" fill="currentColor" fill-opacity=".3" stroke="currentColor" stroke-width="3"/><rect x="74" y="10" width="28" height="64" rx="3" fill="currentColor" stroke="currentColor" stroke-width="3"/><path d="M52 50l14-8-14-8" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  how:['Pick the country with the larger population.','Ten pairs, getting closer as you go. A wrong pick ends the run.','Figures are rounded 2024 estimates, and every pair differs by at least 25%.','Seven or more in a row keeps your streak.']});
register({id:'sequence', name:'Sequence', cat:'numbers', mins:4, blurb:'Five number series, each harder than the last. What comes next?', mount:mountSequence,
  art:'<svg viewBox="0 0 120 80" aria-hidden="true"><g font-family="JetBrains Mono,monospace" font-weight="700" font-size="20" fill="currentColor" text-anchor="middle"><text x="16" y="47">2</text><text x="40" y="47">4</text><text x="64" y="47">8</text></g><rect x="82" y="24" width="30" height="32" rx="6" fill="none" stroke="currentColor" stroke-width="3" stroke-dasharray="5 4"/><text x="97" y="47" font-family="JetBrains Mono,monospace" font-weight="700" font-size="20" fill="currentColor" text-anchor="middle">?</text></svg>',
  how:['Each series shows six numbers. Type the one that comes next.','The series get harder as you go: steps, squares, sums and mixed rules.','You get two tries per series. After a miss you see the rule.','Three or more solved keeps your streak.']});
register({id:'seek', name:'Seek', cat:'words', mins:5, blurb:'A themed word search. Eight words hide in every direction.', mount:mountSeek,
  art:'<svg viewBox="0 0 120 80" aria-hidden="true"><path d="M30 14L90 66" stroke="currentColor" stroke-opacity=".3" stroke-width="16" stroke-linecap="round"/><g font-family="JetBrains Mono,monospace" font-weight="700" font-size="14" fill="currentColor" text-anchor="middle"><text x="30" y="19">S</text><text x="50" y="19">K</text><text x="70" y="19">A</text><text x="90" y="19">R</text><text x="30" y="37">L</text><text x="50" y="37">E</text><text x="70" y="37">T</text><text x="90" y="37">O</text><text x="30" y="55">M</text><text x="50" y="55">U</text><text x="70" y="55">E</text><text x="90" y="55">N</text><text x="30" y="73">P</text><text x="50" y="73">I</text><text x="70" y="73">D</text><text x="90" y="73">K</text></g></svg>',
  how:['Find the eight theme words hidden in the grid. They run in any of eight directions, forwards or backwards.','Drag from a word’s first letter to its last, or tap the first letter and then the last.','Stuck? Reveal a word (tap twice). Revealing three or more ends your streak.']});
