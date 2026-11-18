/* Original seven games: Linkage, Cipher, Ballpark, Target, Putt, Timeline, Switchboard */
/* ---------- content ---------- */
const CHAINS = [
  'RAIN BOW TIE BREAK FAST LANE','SUN FLOWER POT HOLE PUNCH LINE','FIRE WORK SHOP LIFT OFF SPRING',
  'HONEY MOON LIGHT HOUSE BOAT YARD','BOOK SHELF LIFE GUARD RAIL ROAD','HEAD BAND WAGON WHEEL CHAIR LIFT',
  'CUP CAKE WALK WAY SIDE KICK','BACK YARD STICK SHIFT WORK OUT','EAR RING SIDE WALK OVER TIME',
  'STAR FISH TANK TOP SECRET AGENT','CANDLE LIGHT YEAR BOOK MARK DOWN','BLUE PRINT OUT SIDE LINE UP',
  'WATER FALL OUT LAW SUIT CASE','TEA CUP BOARD ROOM SERVICE DOG','DOOR BELL BOY FRIEND SHIP WRECK',
  'FOOT BALL PARK WAY POINT BLANK','SEA HORSE SHOE BOX OFFICE HOURS','KEY NOTE BOOK CASE WORK SHOP',
  'PEA NUT SHELL SHOCK WAVE LENGTH','HOME WORK FORCE FIELD TRIP WIRE','SNOW MAN POWER HOUSE PLANT POT',
  'GOLD FISH NET WORK OUT BREAK','PASS WORD PLAY GROUND HOG WASH','MILK SHAKE DOWN TOWN HALL WAY',
  'NIGHT FALL BACK FIRE ARM CHAIR','SPEED BOAT HOUSE HOLD UP STAIRS','BUTTER CUP CAKE PAN HANDLE BAR',
  'DRAGON FLY PAPER BACK BONE DRY','ICE CREAM CHEESE CAKE WALK OUT','SUN SET BACK HAND SHAKE UP',
  'AIR BAG PIPE LINE DANCE FLOOR','BIRTH DAY DREAM BOAT RACE CAR','COFFEE TABLE TOP HAT TRICK SHOT',
  'JELLY FISH BONE YARD SALE PRICE','BACK HAND BOOK END ZONE OUT','SKY LIGHT HOUSE KEY CHAIN MAIL',
  'WIND MILL STONE AGE OLD SCHOOL','THUNDER STORM DRAIN PIPE DREAM TEAM','BEE LINE UP SET BACK BONE',
  'HOT DOG HOUSE FLY PAPER CLIP','GRAND STAND OUT DOOR STEP SISTER','SAND PAPER WEIGHT ROOM MATE',
  'FLASH BACK STAGE COACH CLASS ACT','RED WOOD WORK BENCH MARK UP','SNAP SHOT GUN FIRE FLY WHEEL',
  'LIFE TIME TABLE SPOON FED UP','BRAIN STORM FRONT DOOR BELL PEPPER','MOTOR CYCLE PATH WAY OUT LAST'
].map(s => s.split(' '));

const QUOTES = [
  ['A journey of a thousand miles begins with a single step.','Laozi'],
  ['Well done is better than well said.','Benjamin Franklin'],
  ['Lost time is never found again.','Benjamin Franklin'],
  ['The early bird catches the worm, but the second mouse gets the cheese.','Modern proverb'],
  ['Fortune favors the bold.','Latin proverb'],
  ['Brevity is the soul of wit.','William Shakespeare'],
  ['We know what we are, but know not what we may be.','William Shakespeare'],
  ['The course of true love never did run smooth.','William Shakespeare'],
  ['Hope is the thing with feathers that perches in the soul.','Emily Dickinson'],
  ['Every cloud has a silver lining.','Proverb'],
  ["Don't count your chickens before they hatch.",'Proverb'],
  ['Slow and steady wins the race.','Aesop'],
  ['Necessity is the mother of invention.','Proverb'],
  ['A watched pot never boils.','Proverb'],
  ['Rome was not built in a day.','Proverb'],
  ['Where there is a will, there is a way.','Proverb'],
  ['Two roads diverged in a wood, and I took the one less traveled by.','Robert Frost'],
  ['Tell me what you eat, and I will tell you what you are.','Jean Anthelme Brillat-Savarin'],
  ['The only thing we have to fear is fear itself.','Franklin D. Roosevelt'],
  ['Many hands make light work.','Proverb'],
  ['The pen is mightier than the sword.','Edward Bulwer-Lytton'],
  ['If you want something done right, do it yourself.','Proverb'],
  ['Curiosity killed the cat, but satisfaction brought it back.','Proverb'],
  ['Beauty is in the eye of the beholder.','Proverb'],
  ["Don't put all your eggs in one basket.",'Proverb'],
  ['Measure twice and cut once.','Proverb'],
  ['The best way out is always through.','Robert Frost'],
  ['I wandered lonely as a cloud that floats on high over vales and hills.','William Wordsworth'],
  ['To be, or not to be, that is the question.','William Shakespeare'],
  ['A friend in need is a friend indeed.','Proverb'],
  ['Time and tide wait for no man.','Proverb'],
  ['Hunger is the best sauce in the world.','Miguel de Cervantes'],
  ['When in Rome, do as the Romans do.','Proverb'],
  ['It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.','Jane Austen'],
  ['It was the best of times, it was the worst of times.','Charles Dickens'],
  ['All happy families are alike; each unhappy family is unhappy in its own way.','Leo Tolstoy'],
  ['Imagination is more important than knowledge.','Albert Einstein'],
  ["That's one small step for man, one giant leap for mankind.",'Neil Armstrong'],
  ['An ounce of prevention is worth a pound of cure.','Benjamin Franklin'],
  ['Actions speak louder than words.','Proverb'],
  ['Ask, and it shall be given you; seek, and ye shall find.','Matthew 7:7'],
  ['The unexamined life is not worth living.','Socrates'],
  ['I think, therefore I am.','René Descartes'],
  ['Genius is one percent inspiration and ninety-nine percent perspiration.','Thomas Edison'],
  ['Early to bed and early to rise makes a man healthy, wealthy, and wise.','Benjamin Franklin'],
  ['A penny saved is a penny earned.','Proverb'],
  ['Absence makes the heart grow fonder.','Proverb'],
  ['The squeaky wheel gets the grease.','Proverb'],
  ["Don't judge a book by its cover.",'Proverb'],
  ['Fools rush in where angels fear to tread.','Alexander Pope'],
  ['To err is human, to forgive divine.','Alexander Pope'],
  ['Hell is empty and all the devils are here.','William Shakespeare'],
  ['Some are born great, some achieve greatness, and some have greatness thrust upon them.','William Shakespeare'],
  ['A ship in harbor is safe, but that is not what ships are built for.','John A. Shedd'],
  ['Whatever is worth doing at all is worth doing well.','Lord Chesterfield'],
  ['Strike while the iron is hot.','Proverb'],
  ['The grass is always greener on the other side of the fence.','Proverb'],
  ['You can lead a horse to water, but you cannot make it drink.','Proverb']
];

// Ballpark facts. tol = accepted error, band = "hot" distance. Warm is within 4 bands.
const P = (q,v,u,note) => ({q,v,u,tol:v*0.03,band:v*0.1,note});
const X = (q,v,u,band,note) => ({q,v,u,tol:0,band,note});
const FACTS = [
  P('How tall is the Eiffel Tower, antennas included?',330,'m','It grew to 330 m when a new antenna went up in 2022.'),
  P('How high is the summit of Mount Everest above sea level?',8849,'m','The 2020 China–Nepal survey set it at 8,848.86 m.'),
  X('How many Earth days long is one year on Mars?',687,'days',30,'Mars takes 687 Earth days to circle the Sun.'),
  X('How many bones are in an adult human body?',206,'bones',10,'Babies start with around 300; many fuse as they grow.'),
  P('How tall is the Burj Khalifa?',828,'m','It has been the world’s tallest building since 2010.'),
  X('How many member states does the United Nations have?',193,'states',8,'South Sudan became the 193rd in 2011.'),
  X('How many elements are on the periodic table?',118,'elements',5,'Oganesson, number 118, was named in 2016.'),
  P('What is the average distance from Earth to the Moon?',384400,'km','Light covers it in about 1.3 seconds.'),
  P('How fast does sound travel through air at 20 °C?',343,'m/s','That is roughly a kilometre every three seconds.'),
  X('In what year was Magna Carta sealed?',1215,'',15,'King John sealed it at Runnymede in June 1215.'),
  P('How tall was the Great Pyramid of Giza when it was finished?',146.6,'m','Erosion and lost casing stones have brought it down to about 138.5 m.'),
  X('How many countries are in Africa?',54,'countries',4,'Counting UN members; South Sudan is the newest.'),
  X('How many squares of every size are on a chessboard?',204,'squares',20,'64 one-by-one, 49 two-by-two, and so on down to a single 8×8.'),
  X('How many seconds are in one day?',86400,'s',3000,'24 × 60 × 60.'),
  X('How many feet are in a mile?',5280,'ft',200,'Set by an English statute of 1593.'),
  P('What is the Earth’s mean diameter?',12742,'km','It bulges about 43 km wider at the equator than pole to pole.'),
  P('How long is the Panama Canal?',82,'km','Ships climb 26 m through locks to cross it.'),
  P('How long is the Nile, by the most-cited measurement?',6650,'km','The Amazon’s length is disputed and may be longer.'),
  P('How deep is the Challenger Deep in the Mariana Trench?',10935,'m','Everest would fit inside with about 2 km to spare.'),
  P('How fast does light travel in a vacuum?',299792,'km/s','Exactly 299,792,458 m/s, by definition.'),
  X('In what year did the Titanic sink?',1912,'',5,'It struck an iceberg on the night of 14 April 1912.'),
  P('How tall is Hyperion, the tallest known living tree?',116,'m','A coast redwood in California, measured near 116 m.'),
  X('How many cards are in a standard tarot deck?',78,'cards',6,'22 major arcana plus 56 minor arcana.'),
  X('How many minutes are in a week?',10080,'min',400,'7 × 24 × 60.'),
  P('About how hot is the visible surface of the Sun?',5500,'°C','The corona above it reaches millions of degrees.'),
  P('How long is the main span of the Golden Gate Bridge?',1280,'m','It was the world’s longest suspension span from 1937 to 1964.'),
  X('In what year did the Berlin Wall fall?',1989,'',4,'The border opened on the night of 9 November 1989.'),
  X('How many US states share a land border with Canada?',13,'states',2,'Alaska plus twelve states along the northern border.'),
  X('How many strings does a standard concert pedal harp have?',47,'strings',5,'Seven pedals shift each string’s pitch.'),
  P('How high is Mount Kilimanjaro?',5895,'m','Africa’s highest peak and a dormant volcano.'),
  P('How long is the Great Wall of China, counting all its branches?',21196,'km','From a 2012 Chinese government survey.'),
  X('In what year were the first modern Olympic Games held?',1896,'',8,'Athens hosted 241 athletes from 14 nations.'),
  X('How many time zones does Russia span?',11,'zones',2,'From Kaliningrad to Kamchatka.'),
  P('How tall is the Statue of Liberty from the ground to the tip of the torch?',93,'m','The copper statue alone is about 46 m.'),
  X('How many hearts does an octopus have?',3,'hearts',1,'Two pump blood through the gills, one through the body.'),
  X('How many feet is it from a bowling lane’s foul line to the head pin?',60,'ft',6,'The full lane, including the pin deck, is longer.'),
  P('How deep is Lake Baikal at its deepest?',1642,'m','It holds about a fifth of the world’s unfrozen fresh water.'),
  X('In what year was William Shakespeare baptised?',1564,'',10,'His baptism is recorded in Stratford on 26 April 1564.'),
  P('How long does sunlight take to reach Earth?',499,'s','Just over 8 minutes and 19 seconds.'),
  X('How many keys does a standard modern piano have?',88,'keys',6,'52 white and 36 black.'),
  X('What is the boiling point of water at sea level, in Fahrenheit?',212,'°F',10,'Daniel Fahrenheit proposed his scale in 1724.'),
  P('How long is an official marathon?',42.195,'km','The odd 195 m dates from the 1908 London Olympics route.'),
  P('How long is the Amazon River, by the commonly cited figure?',6400,'km','Some surveys put it slightly longer than the Nile.'),
  X('How many teeth does an adult usually have, wisdom teeth included?',32,'teeth',3,'Many people have fewer because wisdom teeth never arrive.'),
  P('How tall is the Elizabeth Tower, home of Big Ben?',96,'m','Big Ben is the name of the great bell, not the tower.'),
  P('How far is the Sun from Earth on average?',149.6,'million km','That distance is one astronomical unit.'),
  X('How many moons does Mars have?',2,'moons',1,'Phobos and Deimos, both small and potato-shaped.'),
  X('In what year was Everest first summited?',1953,'',5,'Tenzing Norgay and Edmund Hillary, on 29 May 1953.'),
  X('How many countries border Germany?',9,'countries',2,'More than any other European country except Russia.'),
  X('How many symphonies did Beethoven complete?',9,'symphonies',2,'The Ninth ends with the “Ode to Joy”.'),
  X('How many coloured stickers are on a classic 3×3 Rubik’s Cube?',54,'stickers',6,'Nine on each of six faces.'),
  X('How many lines are in a sonnet?',14,'lines',2,'Shakespeare wrote 154 of them.'),
  P('At what temperature does pure iron melt?',1538,'°C','Lava is often cooler than that.'),
  P('How tall is the Leaning Tower of Pisa?',56,'m','It leans about 4 degrees after stabilisation work.'),
  P('How fast does the International Space Station travel?',27600,'km/h','It circles Earth about every 90 minutes.'),
  X('How many pips are on a pair of standard dice, in total?',42,'pips',4,'Each die has 1+2+3+4+5+6 = 21.'),
  X('How many weeks is a full-term pregnancy, counted from the last period?',40,'weeks',3,'About 280 days.')
];

// Timeline events: [year, event]. Negative years are BC.
const EVENTS = [
  [-776,'The first recorded Olympic Games in Greece'],[-44,'Julius Caesar is assassinated'],[79,'Vesuvius buries Pompeii'],
  [1066,'The Battle of Hastings'],[1088,'The University of Bologna is founded'],[1206,'Genghis Khan is proclaimed ruler of the Mongols'],
  [1215,'Magna Carta is sealed'],[1271,'Marco Polo sets out for Asia'],[1347,'The Black Death reaches Europe'],
  [1368,'The Ming dynasty is founded'],[1453,'Constantinople falls to the Ottomans'],[1492,'Columbus reaches the Americas'],
  [1503,'Leonardo begins painting the Mona Lisa'],[1517,'Luther posts his Ninety-five Theses'],[1519,'Magellan’s fleet sets sail'],
  [1564,'Shakespeare is born'],[1588,'The Spanish Armada is defeated'],[1609,'Galileo turns a telescope to the sky'],
  [1620,'The Mayflower reaches Plymouth'],[1643,'Louis XIV becomes king of France'],[1666,'The Great Fire of London'],
  [1687,'Newton publishes the Principia'],[1707,'England and Scotland unite as Great Britain'],[1752,'Franklin flies his kite in a storm'],
  [1769,'James Watt patents his steam engine improvement'],[1776,'The US Declaration of Independence'],[1789,'The storming of the Bastille'],
  [1804,'Napoleon crowns himself emperor'],[1815,'The Battle of Waterloo'],[1825,'The first public steam railway opens in England'],
  [1837,'Victoria becomes queen'],[1848,'The California Gold Rush begins'],[1859,'Darwin publishes On the Origin of Species'],
  [1863,'The London Underground opens'],[1869,'The Suez Canal opens'],[1876,'Bell patents the telephone'],
  [1879,'Edison demonstrates a long-lasting light bulb'],[1886,'The Statue of Liberty is dedicated'],[1889,'The Eiffel Tower opens'],
  [1896,'The first modern Olympic Games in Athens'],[1903,'The Wright brothers’ first powered flight'],[1908,'The Ford Model T goes on sale'],
  [1912,'The Titanic sinks'],[1914,'The First World War begins'],[1920,'US women win the right to vote'],
  [1927,'Lindbergh flies solo across the Atlantic'],[1928,'Fleming discovers penicillin'],[1929,'The Wall Street Crash'],
  [1937,'The Golden Gate Bridge opens'],[1939,'The Second World War begins'],[1947,'The transistor is invented at Bell Labs'],
  [1953,'Watson and Crick describe DNA’s double helix'],[1957,'Sputnik becomes the first artificial satellite'],[1961,'Yuri Gagarin orbits the Earth'],
  [1963,'Martin Luther King Jr. gives the “I Have a Dream” speech'],[1969,'Apollo 11 lands on the Moon'],[1971,'Intel releases the 4004 microprocessor'],
  [1973,'The first handheld mobile phone call'],[1977,'Voyager 1 is launched'],[1981,'The first Space Shuttle flight'],
  [1986,'The Chernobyl disaster'],[1989,'The Berlin Wall falls'],[1990,'The Hubble Space Telescope is launched'],
  [1991,'The first website goes online'],[1994,'The Channel Tunnel opens'],[1997,'Deep Blue beats Kasparov at chess'],
  [1998,'The first piece of the International Space Station is launched'],[2003,'The Human Genome Project is completed'],[2007,'The first iPhone goes on sale'],
  [2008,'The Large Hadron Collider circulates its first beam'],[2012,'The Curiosity rover lands on Mars'],[2015,'Gravitational waves are detected for the first time'],
  [2019,'The first image of a black hole is released'],[2021,'The James Webb Space Telescope is launched']
];




const LEGACY_ART = {
  linkage:'<svg viewBox="0 0 120 80" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="3"><rect x="28" y="4" width="64" height="16" rx="4"/><rect x="28" y="32" width="64" height="16" rx="4" fill="currentColor" fill-opacity=".22"/><rect x="28" y="60" width="64" height="16" rx="4"/><path d="M60 20v12M60 48v12"/></g></svg>',
  cipher:'<svg viewBox="0 0 120 80" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="3"><rect x="10" y="14" width="34" height="40" rx="5"/><rect x="76" y="14" width="34" height="40" rx="5" fill="currentColor" fill-opacity=".22"/><path d="M50 34h18m-6-6 6 6-6 6"/></g><g fill="currentColor" font-family="JetBrains Mono,monospace" font-weight="700" font-size="24" text-anchor="middle"><text x="27" y="43">Q</text><text x="93" y="43">E</text><text x="27" y="74" font-size="11" font-weight="500">CODE</text><text x="93" y="74" font-size="11" font-weight="500">PLAIN</text></g></svg>',
  ballpark:'<svg viewBox="0 0 120 80" aria-hidden="true"><g stroke="currentColor" stroke-width="3" fill="none"><path d="M6 54h108"/><path d="M14 48v12M38 50v8M62 48v12M86 50v8M108 48v12"/></g><path d="M74 20l10 0-5 14z" fill="currentColor"/><rect x="38" y="40" width="48" height="6" rx="3" fill="currentColor" fill-opacity=".3"/></svg>',
  target:'<svg viewBox="0 0 120 80" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="3"><circle cx="60" cy="40" r="34"/><circle cx="60" cy="40" r="22"/><circle cx="60" cy="40" r="10" fill="currentColor" fill-opacity=".25"/></g><g fill="currentColor" font-family="JetBrains Mono,monospace" font-weight="700" font-size="14"><text x="2" y="16">+</text><text x="106" y="16">×</text><text x="2" y="76">−</text><text x="106" y="76">÷</text></g></svg>',
  putt:'<svg viewBox="0 0 120 80" aria-hidden="true"><ellipse cx="86" cy="64" rx="12" ry="5" fill="currentColor"/><path d="M86 64V8" stroke="currentColor" stroke-width="3"/><path d="M86 8l24 8-24 8z" fill="currentColor" fill-opacity=".35" stroke="currentColor" stroke-width="2"/><circle cx="18" cy="62" r="6" fill="none" stroke="currentColor" stroke-width="3"/><path d="M28 60q22-18 46 0" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="3 5"/></svg>',
  timeline:'<svg viewBox="0 0 120 80" aria-hidden="true"><path d="M8 40h104" stroke="currentColor" stroke-width="3"/><g fill="currentColor"><circle cx="18" cy="40" r="6"/><circle cx="48" cy="40" r="6" fill-opacity=".35"/><circle cx="76" cy="40" r="6"/><circle cx="104" cy="40" r="6" fill-opacity=".35"/></g><g fill="none" stroke="currentColor" stroke-width="2.5"><rect x="6" y="6" width="26" height="16" rx="3"/><rect x="62" y="6" width="28" height="16" rx="3"/><rect x="34" y="58" width="28" height="16" rx="3"/><rect x="90" y="58" width="26" height="16" rx="3"/><path d="M18 22v12M76 22v12M48 46v12M104 46v12"/></g></svg>',
  switch:'<svg viewBox="0 0 120 80" aria-hidden="true"><g stroke="currentColor" stroke-width="2.5"><rect x="22" y="4" width="20" height="20" rx="4" fill="none"/><rect x="50" y="4" width="20" height="20" rx="4" fill="currentColor"/><rect x="78" y="4" width="20" height="20" rx="4" fill="none"/><rect x="22" y="30" width="20" height="20" rx="4" fill="currentColor"/><rect x="50" y="30" width="20" height="20" rx="4" fill="currentColor"/><rect x="78" y="30" width="20" height="20" rx="4" fill="currentColor"/><rect x="22" y="56" width="20" height="20" rx="4" fill="none"/><rect x="50" y="56" width="20" height="20" rx="4" fill="currentColor"/><rect x="78" y="56" width="20" height="20" rx="4" fill="none"/></g></svg>'
};



/* =================================================================
   LINKAGE
   ================================================================= */
function mountLinkage(el, api){
  const chain = dailyPick(CHAINS, 'linkage');
  const last = chain.length - 1;
  const key = stateKey('linkage');
  let st = store.get(key, null) || {
    shown: chain.map((w,i) => (i===0 || i===last) ? w.length : 1),
    solved: chain.map((_,i) => i===0 || i===last),
    gave: chain.map(() => false), extra: chain.map(() => 0), started:false
  };
  const save = () => store.set(key, st);
  const active = () => st.solved.findIndex(x => !x);
  let msg = '', msgCls = '';

  function render(){
    const a = active();
    const rows = chain.map((w,i) => {
      const cls = ['lrow', (i===0||i===last)?'end':'', i===a?'active':'', st.gave[i]?'given':''].join(' ');
      const tiles = [...w].map((ch,j) => j < st.shown[i] || st.solved[i] ? `<span class="lt f">${ch}</span>` : `<span class="lt"></span>`).join('');
      const label = st.solved[i] ? w : `Word ${i+1}, ${w.length} letters, starts with ${w[0]}`;
      let link = '';
      if (i < last) link = `<div class="link">${st.solved[i] && st.solved[i+1] ? esc((w + ' ' + chain[i+1]).toLowerCase()) : ''}</div>`;
      return `<div class="${cls}" role="group" aria-label="${esc(label)}">${tiles}</div>${link}`;
    }).join('');
    const done = a === -1;
    el.innerHTML = `
      <div class="chain" id="chain">${rows}</div>
      ${done ? '' : `
      <form class="lform" id="lform" autocomplete="off">
        <input id="lguess" name="lguess" aria-label="Guess the highlighted word" maxlength="${chain[a].length}" placeholder="${chain[a][0]}${'·'.repeat(chain[a].length-1)}" autocapitalize="characters" spellcheck="false">
        <button class="btn primary" type="submit">Guess</button>
      </form>
      <div class="row" style="justify-content:center"><button class="btn" id="lreveal" type="button">Reveal a letter</button></div>`}
      <p class="msg ${msgCls}" id="lmsg" aria-live="polite">${esc(msg)}</p>`;
    if (!done){
      const input = el.querySelector('#lguess');
      el.querySelector('#lform').onsubmit = e => { e.preventDefault(); guess(input.value); };
      el.querySelector('#lreveal').onclick = () => reveal(false);
      input.focus({preventScroll:true});
    }
  }
  function reveal(keep){
    const a = active(); if (a < 0) return;
    st.started = true; st.shown[a]++; st.extra[a]++;
    if (st.shown[a] >= chain[a].length){ st.solved[a] = true; st.gave[a] = true; msg = `It was ${chain[a]}.`; msgCls = ''; }
    else if (!keep) { msg = ''; }
    save(); render(); check();
  }
  function guess(raw){
    const a = active(); if (a < 0) return;
    const g = raw.toUpperCase().replace(/[^A-Z]/g,'');
    if (!g) return;
    st.started = true;
    if (g === chain[a]){ st.solved[a] = true; msg = pick(['Linked.','Nice.','That’s it.','Clean.']); msgCls='good'; save(); render(); check(); return; }
    msg = `${g} doesn’t fit. Here’s another letter.`; msgCls='bad';
    reveal(true);
    const row = el.querySelectorAll('.lrow')[a]; if (row){ row.classList.add('shake'); }
  }
  function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
  function check(){
    if (active() !== -1 || api.existing()) return;
    const extra = st.extra.reduce((x,y)=>x+y,0);
    const gave = st.gave.some(Boolean);
    const sq = chain.slice(1,last).map((_,k) => { const i = k+1; return st.gave[i] ? '🟥' : st.extra[i] === 0 ? '🟩' : st.extra[i] <= 2 ? '🟨' : '🟧'; }).join('');
    const title = gave ? 'Chain complete' : extra === 0 ? 'Flawless' : extra <= 2 ? 'Sharp' : extra <= 5 ? 'Solid' : 'Got there';
    api.finish({score: extra,  won: !gave, title,
      detail: `${chain.join(' → ')}. You revealed ${extra} extra letter${extra===1?'':'s'}.`,
      summary: `${extra} letter${extra===1?'':'s'}`,
      share: `Daybook Linkage No. ${DAY_NO}\n${chain[0]} ${sq} ${chain[last]}\n${extra} extra letter${extra===1?'':'s'} revealed` });
  }
  render();
  const prev = api.existing(); if (prev) api.show(prev);
}

/* =================================================================
   CIPHER
   ================================================================= */
function mountCipher(el, api){
  const [text, author] = dailyPick(QUOTES, 'cipher');
  const r = rngFor('cipher');
  const AB = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  let perm; do { perm = shuffle(AB.slice(), r); } while (perm.some((c,i) => c === AB[i]));
  const enc = {}, dec = {};
  AB.forEach((p,i) => { enc[p] = perm[i]; dec[perm[i]] = p; });
  const plain = text.toUpperCase();
  const code = [...plain].map(ch => enc[ch] || ch);
  const used = [...new Set(code.filter(c => dec[c]))];
  const key = stateKey('cipher');
  let st = store.get(key, null);
  if (!st){
    const given = shuffle(used.slice(), r).slice(0, 2);
    st = {guess:{}, lock:given, hints:0, elapsed:0, started:false};
    given.forEach(c => st.guess[c] = dec[c]);
  }
  const save = () => { if (st.started && !finished()) st.elapsed = Date.now() - startAt; store.set(key, st); };
  let startAt = Date.now() - st.elapsed;
  let sel = code.findIndex(c => dec[c] && !st.guess[c]); if (sel < 0) sel = 0;
  let msg = '', msgCls = '';
  const finished = () => !!api.existing();
  const fmt = ms => { const s = Math.floor(ms/1000); return Math.floor(s/60) + ':' + pad(s%60); };

  // Split into words while keeping indices.
  const words = []; let cur = [];
  code.forEach((c,i) => { if (c === ' ') { if (cur.length) words.push(cur); cur = []; } else cur.push(i); });
  if (cur.length) words.push(cur);

  function render(){
    const selC = code[sel];
    const wrong = new Set(used.filter(c => st.guess[c] && st.guess[c] !== dec[c]));
    const full = used.every(c => st.guess[c]);
    const fin = finished();
    const q = words.map(w => `<span class="cw">${w.map(i => {
      const c = code[i];
      if (!dec[c]) return `<span class="cp">${esc(c)}</span>`;
      const cls = ['cc', c===selC && !fin ? 'same':'', i===sel && !fin ? 'sel':'', st.lock.includes(c)?'lock':'', (full && wrong.has(c))?'bad':''].join(' ');
      return `<button class="${cls}" data-i="${i}" aria-label="Code letter ${c}${st.guess[c] ? ', decoded as ' + st.guess[c] : ''}"><span class="g">${st.guess[c] || ''}</span><span class="k">${c}</span></button>`;
    }).join('')}</span>`).join('') + `<span class="cauth">${fin ? '— ' + esc(author) : '— ' + esc(author.replace(/[A-Za-z]/g, ch => { const u = enc[ch.toUpperCase()]; return ch === ch.toUpperCase() ? u : u.toLowerCase(); }))}</span>`;
    const usedPlain = new Set(Object.values(st.guess));
    const rows = ['QWERTYUIOP','ASDFGHJKL','ZXCVBNM'];
    el.innerHTML = `
      <div class="ctop"><span class="label">${used.length} code letters · ${st.hints} hint${st.hints===1?'':'s'}</span></div>
      <div class="cq" id="cq">${q}</div>
      <p class="msg ${msgCls}" aria-live="polite">${esc(msg)}</p>
      ${fin ? '' : `<div class="kb" id="kb">
        ${rows.map((row,ri) => `<div>${ri===2?'<button class="wide" data-k="HINT">Hint</button>':''}${[...row].map(k => `<button data-k="${k}" class="${usedPlain.has(k)?'used':''}">${k}</button>`).join('')}${ri===2?'<button class="wide" data-k="DEL" aria-label="Clear letter">⌫</button>':''}</div>`).join('')}
      </div>`}`;
    el.querySelector('#cq').onclick = e => { const b = e.target.closest('.cc'); if (b && !fin){ sel = +b.dataset.i; render(); } };
    const kb = el.querySelector('#kb');
    if (kb) kb.onclick = e => { const b = e.target.closest('button'); if (!b) return; const k = b.dataset.k; if (k==='HINT') hint(); else if (k==='DEL') clear(); else assign(k); };
  }
  function nextOpen(from){
    for (let s=1; s<=code.length; s++){ const i = (from + s) % code.length; const c = code[i]; if (dec[c] && !st.guess[c]) return i; }
    return from;
  }
  function move(dir){
    for (let s=1; s<=code.length; s++){ const i = (sel + dir*s + code.length*4) % code.length; if (dec[code[i]]) { sel = i; break; } }
    render();
  }
  function begin(){ if (!st.started){ st.started = true; startAt = Date.now(); } }
  function assign(p){
    const c = code[sel]; if (!dec[c] || finished()) return;
    if (st.lock.includes(c)) { msg = 'That letter is already decoded.'; msgCls=''; render(); return; }
    begin();
    const owner = Object.keys(st.guess).find(k => st.guess[k] === p && k !== c);
    if (owner && st.lock.includes(owner)) { msg = `${p} is already decoded elsewhere.`; msgCls='bad'; render(); return; }
    if (owner) delete st.guess[owner];
    st.guess[c] = p; msg = ''; msgCls = '';
    sel = nextOpen(sel);
    after();
  }
  function clear(){ const c = code[sel]; if (st.lock.includes(c) || finished()) return; delete st.guess[c]; msg=''; save(); render(); }
  function hint(){
    if (finished()) return; begin();
    let c = code[sel];
    if (!dec[c] || st.guess[c] === dec[c]) c = used.find(x => st.guess[x] !== dec[x]);
    if (!c) return;
    const owner = Object.keys(st.guess).find(k => st.guess[k] === dec[c] && k !== c);
    if (owner) delete st.guess[owner];
    st.guess[c] = dec[c]; st.lock.push(c); st.hints++;
    msg = `Hint: ${c} stands for ${dec[c]}.`; msgCls='';
    sel = nextOpen(sel);
    after();
  }
  function after(){
    const full = used.every(c => st.guess[c]);
    const right = used.every(c => st.guess[c] === dec[c]);
    if (full && right){
      st.elapsed = Date.now() - startAt; store.set(key, st);
      const t = fmt(st.elapsed);
      api.finish({score: st.hints, won:true, title: st.hints === 0 ? 'Cracked it clean' : 'Cracked it',
        detail:`“${text}” — ${author}. ${st.hints} hint${st.hints===1?'':'s'} used.`,
        summary: st.hints ? st.hints + ' hint' + (st.hints===1?'':'s') : 'No hints',
        share:`Daybook Cipher No. ${DAY_NO}\nSolved · ${st.hints} hint${st.hints===1?'':'s'}`});
      msg = ''; render(); return;
    }
    if (full){ msg = 'Every letter is filled, but some are wrong. They are marked in red.'; msgCls='bad'; }
    save(); render();
  }
  const onKey = e => {
    if (e.metaKey || e.ctrlKey || e.altKey || finished()) return;
    if (/^[a-z]$/i.test(e.key)) { e.preventDefault(); assign(e.key.toUpperCase()); }
    else if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); clear(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); move(-1); }
  };
  document.addEventListener('keydown', onKey);
  const tick = setInterval(() => { const t = el.querySelector('#ctimer'); if (t && st.started && !finished()) t.textContent = fmt(Date.now() - startAt); }, 500);
  render();
  const prev = api.existing(); if (prev) { st.guess = {...dec}; Object.keys(st.guess).forEach(k => { if (!used.includes(k)) delete st.guess[k]; }); render(); api.show(prev); }
  return () => { document.removeEventListener('keydown', onKey); clearInterval(tick); if (!finished()) save(); };
}

/* =================================================================
   BALLPARK
   ================================================================= */
function mountBallpark(el, api){
  const f = dailyPick(FACTS, 'ballpark');
  const MAX = 6;
  const key = stateKey('ballpark');
  let st = store.get(key, null) || {guesses:[], started:false};
  const nf = n => n.toLocaleString(undefined, {maximumFractionDigits:3});
  const heat = g => { const d = Math.abs(g - f.v); if (d <= f.tol + 1e-9) return 'win'; if (d <= f.band) return 'hot'; if (d <= f.band*4) return 'warm'; return 'cold'; };
  const HEAT = {win:'Got it', hot:'Hot', warm:'Warm', cold:'Cold'};
  let msg = '';

  function render(){
    const fin = !!api.existing();
    const lows = st.guesses.filter(g => g < f.v && heat(g) !== 'win'), highs = st.guesses.filter(g => g > f.v && heat(g) !== 'win');
    const lo = lows.length ? Math.max(...lows) : null, hi = highs.length ? Math.min(...highs) : null;
    const range = (lo!=null || hi!=null) ? `<div class="range"><span class="label">Answer is</span>${lo!=null?`above <b>${nf(lo)}</b>`:''}${lo!=null&&hi!=null?' and ':''}${hi!=null?`below <b>${nf(hi)}</b>`:''}</div>` : `<div class="range"><span class="label">Unit</span><b>${esc(f.u || 'year')}</b></div>`;
    el.innerHTML = `
      <div class="bq">
        <span class="label">Today’s question</span>
        <h2>${esc(f.q)}</h2>
        ${fin ? `<div class="range"><span class="label">Answer</span><b>${nf(f.v)} ${esc(f.u)}</b></div><p style="margin:0;color:var(--muted)">${esc(f.note)}</p>` : range}
      </div>
      <div class="slots" aria-label="${st.guesses.length} of ${MAX} guesses used">${Array.from({length:MAX},(_,i)=>`<i class="${i<st.guesses.length?'u':''}"></i>`).join('')}</div>
      ${fin ? '' : `<form class="bform" id="bform" autocomplete="off">
        <label class="bin"><input id="bguess" name="bguess" inputmode="decimal" aria-label="Your guess" placeholder="Your guess"><span>${esc(f.u)}</span></label>
        <button class="btn primary" type="submit">Guess</button>
      </form>`}
      <p class="msg bad" aria-live="polite">${esc(msg)}</p>
      <ol class="guesses">${st.guesses.map((g,i) => { const h = heat(g); return `<li><span class="n">${i+1}</span><span class="v">${nf(g)} <small style="color:var(--muted);font-weight:500">${esc(f.u)}</small></span><span class="dir">${h==='win'?'':g<f.v?'↑ Go higher':'↓ Go lower'}</span><span class="heat ${h}">${HEAT[h]}</span></li>`; }).join('')}</ol>`;
    const form = el.querySelector('#bform');
    if (form){ const input = el.querySelector('#bguess'); input.focus({preventScroll:true}); form.onsubmit = e => { e.preventDefault(); submit(input.value); }; }
  }
  function submit(raw){
    const v = parseFloat(String(raw).replace(/[,\s_]/g,''));
    if (!isFinite(v) || v < 0) { msg = 'Enter a number, like 1250 or 42.5.'; render(); return; }
    msg = ''; st.started = true; st.guesses.push(v); store.set(key, st);
    const won = heat(v) === 'win';
    if (won || st.guesses.length >= MAX){
      const sq = st.guesses.map(g => ({win:'✅',hot:'🟥',warm:'🟧',cold:'🟦'})[heat(g)]).join('');
      const n = st.guesses.length;
      api.finish({score: n, won, title: won ? (n===1?'First try':'In the ballpark') : 'Out of guesses',
        detail: `The answer is ${nf(f.v)} ${f.u}. ${f.note}`,
        summary: won ? `${n}/${MAX}` : `X/${MAX}`,
        share: `Daybook Ballpark No. ${DAY_NO}  ${won?n:'X'}/${MAX}\n${sq}`});
    }
    render();
  }
  render();
  const prev = api.existing(); if (prev) api.show(prev);
}

/* =================================================================
   TARGET
   ================================================================= */
function genTarget(r){
  const large = shuffle([25,50,75,100], r).slice(0,2);
  const smallPool = shuffle([1,2,3,4,5,6,7,8,9,10,1,2,3,4,5,6,7,8,9,10], r).slice(0,4);
  const nums = [...large, ...smallPool];
  const cands = [];
  for (let t=0; t<500; t++){
    let pool = nums.map(v => ({v, e:String(v), c:1}));
    shuffle(pool, r);
    while (pool.length > 1){
      const a = pool.pop(), b = pool.pop();
      const [x,y] = a.v >= b.v ? [a,b] : [b,a];
      const opts = [];
      opts.push({v:x.v+y.v, s:'+'});
      if (y.v > 1) opts.push({v:x.v*y.v, s:'×'});
      if (x.v - y.v > 0) opts.push({v:x.v-y.v, s:'−'});
      if (y.v > 1 && x.v % y.v === 0) opts.push({v:x.v/y.v, s:'÷'});
      const o = opts[Math.floor(r()*opts.length)];
      const node = {v:o.v, e:`(${x.e} ${o.s} ${y.e})`, c:x.c+y.c};
      if (node.v >= 101 && node.v <= 999 && node.c >= 3) cands.push(node);
      pool.splice(Math.floor(r()*(pool.length+1)), 0, node);
      if (r() < 0.12) break;
    }
  }
  let best = cands.filter(c => c.c >= 4);
  if (!best.length) best = cands;
  const pick = best.length ? best[Math.floor(r()*best.length)] : {v: large[0]*smallPool[0] + smallPool[1], e:`(${large[0]} × ${smallPool[0]}) + ${smallPool[1]}`};
  return {nums, target:pick.v, solution: pick.e.replace(/^\((.*)\)$/, '$1')};
}
function mountTarget(el, api){
  const {nums, target, solution} = genTarget(rngFor('target'));
  const key = stateKey('target');
  let st = store.get(key, null) || {steps:[], started:false};
  let selA = null, op = null, msg = '', msgCls = '';
  const SYM = {'+':'+','-':'−','*':'×','/':'÷'};
  function replay(){
    const slots = nums.map(v => ({v, made:false}));
    const log = []; const seen = [...nums];
    for (const s of st.steps){
      const a = slots[s.a].v, b = slots[s.b].v;
      const res = calc(a, b, s.op);
      log.push(res.text); seen.push(res.v);
      slots[s.b] = {v:res.v, made:true}; slots[s.a] = null;
    }
    return {slots, log, seen};
  }
  function calc(a, b, o){
    if (o==='+') return {v:a+b, text:`${a} + ${b} = ${a+b}`};
    if (o==='*') return {v:a*b, text:`${a} × ${b} = ${a*b}`};
    if (o==='-'){ const [x,y] = a>=b?[a,b]:[b,a]; return x-y>0 ? {v:x-y, text:`${x} − ${y} = ${x-y}`} : null; }
    if (o==='/'){ if (b && a % b === 0 && b !== 1) return {v:a/b, text:`${a} ÷ ${b} = ${a/b}`}; if (a && b % a === 0 && a !== 1) return {v:b/a, text:`${b} ÷ ${a} = ${b/a}`}; if (b===1) return {v:a, text:`${a} ÷ 1 = ${a}`}; if (a===1) return {v:b, text:`${b} ÷ 1 = ${b}`}; return null; }
  }
  const closest = seen => seen.reduce((best,v) => Math.abs(v-target) < Math.abs(best-target) ? v : best, seen[0]);
  function render(){
    const {slots, log, seen} = replay();
    const fin = !!api.existing();
    const c = closest(seen);
    el.innerHTML = `
      <div class="tgt"><div><span class="label">Target</span><br><strong>${target}</strong></div><div class="best"><span class="label">Closest so far</span><b>${c}</b><span style="color:var(--muted);font-size:14px">${c===target?'Exact':Math.abs(c-target)+' away'}</span></div></div>
      <div class="tiles" id="tiles">${slots.map((s,i) => s ? `<button class="tile ${s.made?'made':''} ${selA===i?'sel':''}" data-i="${i}" ${fin?'disabled':''}>${s.v}</button>` : `<button class="tile gone" tabindex="-1" aria-hidden="true"></button>`).join('')}</div>
      <div class="ops" id="ops">${Object.keys(SYM).map(o => `<button class="op ${op===o?'sel':''}" data-o="${o}" aria-label="${({'+':'plus','-':'minus','*':'times','/':'divided by'})[o]}" ${fin?'disabled':''}>${SYM[o]}</button>`).join('')}</div>
      <p class="msg ${msgCls}" aria-live="polite">${esc(msg)}</p>
      ${fin ? `<p class="hint">One way to make ${target}: <b class="tnum">${esc(solution)}</b></p>` : `<div class="row" style="justify-content:center">
        <button class="btn" id="tundo" ${st.steps.length?'':'disabled'}>Undo</button>
        <button class="btn" id="treset" ${st.steps.length?'':'disabled'}>Start over</button>
        <button class="btn primary" id="tlock">Lock in ${c}</button>
      </div>`}
      ${log.length ? `<ol class="steps">${log.map(l => `<li>${esc(l).replace(/= (\d+)$/, '= <b>$1</b>')}</li>`).join('')}</ol>` : ''}`;
    if (fin) return;
    el.querySelector('#tiles').onclick = e => { const b = e.target.closest('.tile:not(.gone)'); if (b) tapTile(+b.dataset.i); };
    el.querySelector('#ops').onclick = e => { const b = e.target.closest('.op'); if (!b) return; if (selA === null){ msg = 'Pick a number first.'; msgCls=''; } else { op = op === b.dataset.o ? null : b.dataset.o; msg=''; } render(); };
    el.querySelector('#tundo').onclick = () => { st.steps.pop(); selA = null; op = null; msg=''; store.set(key, st); render(); };
    el.querySelector('#treset').onclick = () => { st.steps = []; selA = null; op = null; msg=''; store.set(key, st); render(); };
    el.querySelector('#tlock').onclick = () => finish(c, seen);
  }
  function tapTile(i){
    if (selA === null || op === null){ selA = selA === i ? null : i; op = null; msg=''; render(); return; }
    if (i === selA){ selA = null; op = null; render(); return; }
    const {slots} = replay();
    const res = calc(slots[selA].v, slots[i].v, op);
    if (!res){ msg = op==='-' ? 'That would make zero. Results must be positive.' : 'That doesn’t divide evenly. Results must be whole numbers.'; msgCls='bad'; render(); return; }
    st.started = true; st.steps.push({a:selA, b:i, op}); store.set(key, st);
    selA = i; op = null; msg = ''; msgCls = '';
    if (res.v === target){ render(); finish(target, replay().seen); return; }
    selA = null;
    render();
  }
  function finish(c){
    const d = Math.abs(c - target);
    const stars = d === 0 ? 3 : d <= 5 ? 2 : d <= 10 ? 1 : 0;
    store.set(key, st);
    api.finish({score: d, won: stars >= 2, title: d===0 ? 'Bullseye' : stars ? `${d} away` : 'Not this time',
      detail: d===0 ? `You made ${target} in ${st.steps.length} steps.` : `Your closest was ${c}, ${d} from ${target}.`,
      summary: '★'.repeat(stars) + '☆'.repeat(3-stars),
      share: `Daybook Target No. ${DAY_NO}\n🎯 ${target} · ${d===0?'exact':'off by '+d}\n${'★'.repeat(stars)}${'☆'.repeat(3-stars)} in ${st.steps.length} step${st.steps.length===1?'':'s'}`});
    render();
  }
  render();
  const prev = api.existing(); if (prev) api.show(prev);
}

/* =================================================================
   PUTT
   ================================================================= */
const PW = 360, PH = 560, PB = {x:16, y:16, w:328, h:528}, BALL = 6, CUP = 10;
function rectCircleDist(rc, x, y){ const cx = clamp(x, rc.x, rc.x+rc.w), cy = clamp(y, rc.y, rc.y+rc.h); return Math.hypot(x-cx, y-cy); }
function makeHole(type, r){
  const L = PB.x, R = PB.x+PB.w, T = PB.y, BOT = PB.y+PB.h;
  const rand = (a,b) => a + (b-a)*r();
  const h = {type, walls:[], bumpers:[], sand:[], water:[], par:3};
  const TH = 14;
  if (type === 'dogleg'){
    const left = r() < .5, y = rand(250,310), len = PB.w*rand(.62,.7);
    h.walls.push({x:left?L:R-len, y, w:len, h:TH});
    const xs = left ? [L+40, L+len-40] : [R-len+40, R-40];
    h.tee = {x:rand(...xs), y:BOT-48}; h.cup = {x:rand(...xs), y:T+64}; h.par = 3;
  } else if (type === 'switch'){
    const aLeft = r() < .5, y1 = rand(180,210), y2 = rand(350,385), l1 = PB.w*rand(.6,.67), l2 = PB.w*rand(.6,.67);
    h.walls.push({x:aLeft?L:R-l2, y:y2, w:l2, h:TH});
    h.walls.push({x:aLeft?R-l1:L, y:y1, w:l1, h:TH});
    h.tee = {x: aLeft ? rand(L+40, L+l2-40) : rand(R-l2+40, R-40), y:BOT-48};
    h.cup = {x: aLeft ? rand(R-l1+40, R-40) : rand(L+40, L+l1-40), y:T+60};
    h.par = 4;
  } else if (type === 'river'){
    const y = rand(240,300), hh = rand(52,68), gap = rand(72,92), gx = rand(L+40, R-40-gap);
    h.water.push({x:L, y, w:gx-L, h:hh}, {x:gx+gap, y, w:R-gx-gap, h:hh});
    h.walls.push({x:gx-5, y:y-4, w:5, h:hh+8}, {x:gx+gap, y:y-4, w:5, h:hh+8});
    h.tee = {x:rand(L+50,R-50), y:BOT-48}; h.cup = {x:rand(L+50,R-50), y:T+64}; h.par = 3;
  } else {
    h.tee = {x:rand(L+70,R-70), y:BOT-48}; h.cup = {x:rand(L+70,R-70), y:T+64}; h.par = 3;
    const mx = (h.tee.x+h.cup.x)/2 + rand(-8,8), my = (h.tee.y+h.cup.y)/2;
    h.walls.push({x:mx-34, y:my-9, w:68, h:18});
  }
  // bumpers
  const nb = type === 'bumpers' ? 4 : (r() < .6 ? 1 : 0);
  for (let k=0, tries=0; k<nb && tries<200; tries++){
    const b = {x:rand(L+34,R-34), y:rand(T+120, BOT-120), r:rand(13,19)};
    if (Math.hypot(b.x-h.tee.x, b.y-h.tee.y) < 60 || Math.hypot(b.x-h.cup.x, b.y-h.cup.y) < 60) continue;
    if ([...h.walls, ...h.water].some(w => rectCircleDist(w, b.x, b.y) < b.r + 26)) continue;
    if (h.bumpers.some(o => Math.hypot(o.x-b.x, o.y-b.y) < o.r + b.r + 36)) continue;
    if (b.x - b.r < L + 22 || b.x + b.r > R - 22) continue;
    h.bumpers.push(b); k++;
  }
  // sand
  if (r() < .7){
    for (let tries=0; tries<60; tries++){
      const s = {w:rand(60,110), h:rand(36,64)}; s.x = rand(L, R - s.w); s.y = rand(T+20, BOT-80 - s.h);
      const grow = {x:s.x-8, y:s.y-8, w:s.w+16, h:s.h+16};
      const hit = o => !(o.x > grow.x+grow.w || o.x+o.w < grow.x || o.y > grow.y+grow.h || o.y+o.h < grow.y);
      if ([...h.walls, ...h.water].some(hit)) continue;
      if (rectCircleDist(s, h.tee.x, h.tee.y) < 34 || rectCircleDist(s, h.cup.x, h.cup.y) < 24) continue;
      if (h.bumpers.some(b => rectCircleDist(s, b.x, b.y) < b.r + 6)) continue;
      h.sand.push(s); break;
    }
  }
  return h;
}
function mountPutt(el, api){
  const r = rngFor('putt');
  const holes = shuffle(['bumpers','dogleg','switch','river'], r).slice(0,3).map(t => makeHole(t, r));
  const parTotal = holes.reduce((a,h) => a+h.par, 0);
  const key = stateKey('putt');
  let st = store.get(key, null) || {hole:0, strokes:[0,0,0], ball:null, started:false};
  const MAXS = 8;
  const NAMES = {'-3':'Albatross','-2':'Eagle','-1':'Birdie','0':'Par','1':'Bogey','2':'Double bogey','3':'Triple bogey'};
  const toPar = n => n === 0 ? 'E' : (n > 0 ? '+' + n : String(n));
  const fin = () => !!api.existing();

  el.innerHTML = `
    <div class="putt">
      <div class="hud" id="hud"></div>
      <div class="stage" id="stage">
        <canvas id="pc" width="${PW}" height="${PH}" aria-label="Mini golf green. Press, drag back and release to putt."></canvas>
        <div class="toast" id="toast" hidden></div>
      </div>
      <p class="hint">Press anywhere, drag back, release. The farther you pull, the harder the putt.</p>
      <table class="sc" id="sc"></table>
    </div>`;
  const cv = el.querySelector('#pc'), ctx = cv.getContext('2d');
  const toast = el.querySelector('#toast');
  const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  cv.width = PW*dpr; cv.height = PH*dpr; ctx.setTransform(dpr,0,0,dpr,0,0);

  let hole = holes[Math.min(st.hole, 2)];
  let ball = st.ball ? {...st.ball} : {...hole.tee};
  let vel = {x:0, y:0}, moving = false, lastPos = {...ball}, aim = null, sink = 0, sunk = false, splash = 0, raf = 0, lastT = 0;

  function hud(){
    el.querySelector('#hud').innerHTML = `<b>Hole ${Math.min(st.hole,2)+1}<span> of 3</span></b><b><span>Par </span>${hole.par}</b><b><span>Strokes </span>${st.strokes[Math.min(st.hole,2)]}</b>`;
    const tot = st.strokes.reduce((a,b)=>a+b,0);
    el.querySelector('#sc').innerHTML = `<tr><th>Hole</th>${holes.map((_,i)=>`<th>${i+1}</th>`).join('')}<th>Total</th></tr>
      <tr><th>Par</th>${holes.map(h=>`<td>${h.par}</td>`).join('')}<td>${parTotal}</td></tr>
      <tr><th>You</th>${holes.map((h,i)=>`<td class="${i===st.hole && !fin()?'cur':''}">${i < st.hole || fin() ? st.strokes[i] : (i===st.hole && st.strokes[i] ? st.strokes[i] : '·')}</td>`).join('')}<td>${tot || '·'}</td></tr>`;
  }
  function save(){ st.ball = {...ball}; store.set(key, st); }

  function toCanvas(e){ const b = cv.getBoundingClientRect(); return {x:(e.clientX-b.left)*PW/b.width, y:(e.clientY-b.top)*PH/b.height}; }
  const onDown = e => { if (moving || sunk || fin() || !toast.hidden) return; const p = toCanvas(e); aim = {sx:p.x, sy:p.y, x:p.x, y:p.y}; cv.setPointerCapture(e.pointerId); e.preventDefault(); };
  const onMove = e => { if (!aim) return; const p = toCanvas(e); aim.x = p.x; aim.y = p.y; };
  const onUp = e => {
    if (!aim) return;
    const dx = aim.sx - aim.x, dy = aim.sy - aim.y, len = Math.hypot(dx,dy);
    aim = null;
    if (len < 8) return;
    const power = Math.min(len, 150) / 150;
    const sp = 70 + power * 900;
    vel = {x:dx/len*sp, y:dy/len*sp}; moving = true; lastPos = {...ball};
    st.started = true; st.strokes[st.hole]++; hud(); save();
  };
  cv.addEventListener('pointerdown', onDown);
  cv.addEventListener('pointermove', onMove);
  cv.addEventListener('pointerup', onUp);
  cv.addEventListener('pointercancel', () => aim = null);

  function physics(dt){
    const inSand = hole.sand.some(s => ball.x > s.x && ball.x < s.x+s.w && ball.y > s.y && ball.y < s.y+s.h);
    const k = inSand ? 4.2 : 1.05, dec = inSand ? 140 : 42;
    const cdx = hole.cup.x - ball.x, cdy = hole.cup.y - ball.y, cd = Math.hypot(cdx, cdy);
    let sp = Math.hypot(vel.x, vel.y);
    if (cd < CUP + 5 && sp < 480 && cd > 0.01){ vel.x += cdx/cd*1500*dt; vel.y += cdy/cd*1500*dt; }
    sp = Math.hypot(vel.x, vel.y);
    if (sp > 0){ const ns = Math.max(0, sp*Math.exp(-k*dt) - dec*dt); vel.x *= ns/sp; vel.y *= ns/sp; sp = ns; }
    ball.x += vel.x*dt; ball.y += vel.y*dt;
    const RE = 0.78;
    if (ball.x < PB.x+BALL){ ball.x = PB.x+BALL; vel.x = Math.abs(vel.x)*RE; }
    if (ball.x > PB.x+PB.w-BALL){ ball.x = PB.x+PB.w-BALL; vel.x = -Math.abs(vel.x)*RE; }
    if (ball.y < PB.y+BALL){ ball.y = PB.y+BALL; vel.y = Math.abs(vel.y)*RE; }
    if (ball.y > PB.y+PB.h-BALL){ ball.y = PB.y+PB.h-BALL; vel.y = -Math.abs(vel.y)*RE; }
    for (const w of hole.walls){
      const cx = clamp(ball.x, w.x, w.x+w.w), cy = clamp(ball.y, w.y, w.y+w.h);
      let dx = ball.x - cx, dy = ball.y - cy, d = Math.hypot(dx, dy);
      if (d < BALL){
        let nx, ny;
        if (d < 1e-6){ // centre inside: push out along the shallowest side
          const opts = [[ball.x-w.x,-1,0],[w.x+w.w-ball.x,1,0],[ball.y-w.y,0,-1],[w.y+w.h-ball.y,0,1]].sort((a,b)=>a[0]-b[0])[0];
          nx = opts[1]; ny = opts[2];
          ball.x = nx ? (nx<0 ? w.x-BALL : w.x+w.w+BALL) : ball.x; ball.y = ny ? (ny<0 ? w.y-BALL : w.y+w.h+BALL) : ball.y;
        } else { nx = dx/d; ny = dy/d; ball.x = cx + nx*BALL; ball.y = cy + ny*BALL; }
        const vn = vel.x*nx + vel.y*ny;
        if (vn < 0){ vel.x -= (1+RE)*vn*nx; vel.y -= (1+RE)*vn*ny; }
      }
    }
    for (const b of hole.bumpers){
      const dx = ball.x - b.x, dy = ball.y - b.y, d = Math.hypot(dx, dy), m = BALL + b.r;
      if (d < m && d > 0){ const nx = dx/d, ny = dy/d; ball.x = b.x + nx*m; ball.y = b.y + ny*m; const vn = vel.x*nx + vel.y*ny; if (vn < 0){ vel.x -= 1.9*vn*nx; vel.y -= 1.9*vn*ny; } }
    }
    const cd2 = Math.hypot(hole.cup.x-ball.x, hole.cup.y-ball.y);
    if (cd2 < CUP - 3 && sp < 430){ moving = false; sunk = true; sink = 0; vel = {x:0,y:0}; return; }
    if (hole.water.some(w => ball.x > w.x && ball.x < w.x+w.w && ball.y > w.y && ball.y < w.y+w.h)){
      moving = false; vel = {x:0,y:0}; splash = 0.6; st.strokes[st.hole]++; ball = {...lastPos}; hud(); save(); showToast('Splash', 'One penalty stroke. Back to your last spot.', 'OK', ()=>{}); return;
    }
    if (sp < 7 && cd2 > CUP + 5){ moving = false; vel = {x:0,y:0}; save(); if (st.strokes[st.hole] >= MAXS) holeDone(true); }
  }
  function showToast(title, body, btn, cb){
    toast.innerHTML = `<b>${esc(title)}</b><span>${esc(body)}</span><button class="btn primary" id="tbtn">${esc(btn)}</button>`;
    toast.hidden = false;
    const b = toast.querySelector('#tbtn'); b.focus({preventScroll:true});
    b.onclick = () => { toast.hidden = true; cb(); };
  }
  function holeDone(pickedUp){
    const n = st.strokes[st.hole], d = n - hole.par;
    const name = pickedUp ? 'Picked up' : n === 1 ? 'Hole in one!' : (NAMES[String(d)] || `${toPar(d)} on the hole`);
    const lastHole = st.hole === 2;
    showToast(name, `${n} stroke${n===1?'':'s'} on a par ${hole.par}.`, lastHole ? 'See scorecard' : 'Next hole', () => {
      if (lastHole){ st.hole = 3; st.ball = null; store.set(key, st); hud(); finishRound(); return; }
      st.hole++; hole = holes[st.hole]; ball = {...hole.tee}; lastPos = {...ball}; sunk = false; save(); hud();
    });
  }
  function finishRound(){
    const tot = st.strokes.reduce((a,b)=>a+b,0), d = tot - parTotal;
    const sq = st.strokes.map((n,i) => { const x = n - holes[i].par; return n===1 ? '⭐' : x < 0 ? '🟩' : x === 0 ? '⬜' : x === 1 ? '🟨' : '🟥'; }).join('');
    api.finish({score: tot, won: d <= 2, title: d < 0 ? 'Under par' : d === 0 ? 'Even par' : d <= 2 ? 'Nicely played' : 'Tough greens',
      detail: `${tot} strokes on a par ${parTotal} (${toPar(d)}). Holes: ${st.strokes.join(', ')}.`,
      summary: `${tot} (${toPar(d)})`,
      share: `Daybook Putt No. ${DAY_NO}  ${tot} (${toPar(d)})\n${sq}  ${st.strokes.join(' · ')}`});
  }

  /* drawing */
  function rr(x,y,w,h,rad){ ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x,y,w,h,rad) : ctx.rect(x,y,w,h); }
  function draw(){
    ctx.clearRect(0,0,PW,PH);
    ctx.fillStyle = '#6E5236'; ctx.fillRect(0,0,PW,PH);
    ctx.fillStyle = '#87663F'; rr(6,6,PW-12,PH-12,10); ctx.fill();
    for (let y = PB.y, i = 0; y < PB.y+PB.h; y += 44, i++){ ctx.fillStyle = i%2 ? '#4E9F45' : '#57A94D'; ctx.fillRect(PB.x, y, PB.w, Math.min(44, PB.y+PB.h-y)); }
    for (const s of hole.sand){ ctx.fillStyle = '#E3CF9C'; rr(s.x,s.y,s.w,s.h,18); ctx.fill(); ctx.fillStyle = 'rgba(150,120,60,.35)'; for (let i=0;i<14;i++){ const px = s.x + 10 + ((i*37)%(s.w-20)), py = s.y + 8 + ((i*23)%(s.h-16)); ctx.fillRect(px,py,2,2); } }
    for (const w of hole.water){ ctx.fillStyle = '#2F7FC1'; ctx.fillRect(w.x,w.y,w.w,w.h); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2; const t = performance.now()/600; for (let yy = w.y+12; yy < w.y+w.h-6; yy += 16){ ctx.beginPath(); for (let xx = w.x; xx <= w.x+w.w; xx += 6){ const yv = yy + Math.sin(xx/14 + t)*2.5; xx===w.x ? ctx.moveTo(xx,yv) : ctx.lineTo(xx,yv); } ctx.stroke(); } }
    ctx.fillStyle = 'rgba(0,0,0,.08)'; rr(hole.tee.x-16, hole.tee.y-10, 32, 20, 5); ctx.fill();
    for (const w of hole.walls){ ctx.fillStyle = '#7A5A36'; rr(w.x, w.y, w.w, w.h, 3); ctx.fill(); ctx.fillStyle = '#9C7849'; ctx.fillRect(w.x+2, w.y+2, Math.max(0,w.w-4), Math.min(4, w.h-4)); }
    for (const b of hole.bumpers){ ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.arc(b.x+2,b.y+3,b.r,0,7); ctx.fill(); ctx.fillStyle = '#E9E3D3'; ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,7); ctx.fill(); ctx.strokeStyle = '#C8402F'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(b.x,b.y,b.r-5,0,7); ctx.stroke(); }
    // cup + flag
    ctx.fillStyle = '#1B2A18'; ctx.beginPath(); ctx.arc(hole.cup.x, hole.cup.y, CUP, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1.5; ctx.stroke();
    if (!sunk){ ctx.strokeStyle = '#F2F2EE'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(hole.cup.x, hole.cup.y); ctx.lineTo(hole.cup.x, hole.cup.y-44); ctx.stroke(); ctx.fillStyle = '#E2483C'; ctx.beginPath(); ctx.moveTo(hole.cup.x, hole.cup.y-44); ctx.lineTo(hole.cup.x+22, hole.cup.y-37); ctx.lineTo(hole.cup.x, hole.cup.y-30); ctx.fill(); }
    // aim
    if (aim){
      const dx = aim.sx - aim.x, dy = aim.sy - aim.y, len = Math.hypot(dx,dy);
      if (len > 4){
        const p = Math.min(len,150)/150, ux = dx/len, uy = dy/len, L = 26 + p*120;
        ctx.setLineDash([5,6]); ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(ball.x, ball.y); ctx.lineTo(ball.x+ux*L, ball.y+uy*L); ctx.stroke(); ctx.setLineDash([]);
        ctx.strokeStyle = `hsl(${120-120*p} 85% 50%)`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(ball.x, ball.y, BALL+7, -Math.PI/2, -Math.PI/2 + p*Math.PI*2); ctx.stroke();
      }
    }
    // ball
    let br = BALL, bx = ball.x, by = ball.y;
    if (sunk){ br = BALL * Math.max(0, 1 - sink/0.35); bx = ball.x + (hole.cup.x-ball.x)*Math.min(1,sink/0.2); by = ball.y + (hole.cup.y-ball.y)*Math.min(1,sink/0.2); }
    if (br > 0.3){ ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.arc(bx+1.5, by+2, br, 0, 7); ctx.fill(); ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(bx, by, br, 0, 7); ctx.fill(); }
    if (splash > 0){ ctx.strokeStyle = `rgba(255,255,255,${splash})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ball.x, ball.y, 10 + (0.6-splash)*40, 0, 7); ctx.stroke(); }
  }
  function loop(t){
    const dt = Math.min(0.05, (t - (lastT || t))/1000); lastT = t;
    if (moving){ const n = 6; for (let i=0;i<n && moving;i++) physics(dt/n); }
    if (sunk && sink < 0.5){ sink += dt; if (sink >= 0.5){ save(); holeDone(false); } }
    if (splash > 0) splash = Math.max(0, splash - dt);
    draw();
    raf = requestAnimationFrame(loop);
  }
  hud();
  if (st.hole >= 3 || fin()){
    el.querySelector('#stage').hidden = true; el.querySelector('.hint').hidden = true; el.querySelector('#hud').hidden = true;
    const prev = api.existing(); if (prev) api.show(prev); else finishRound();
  } else raf = requestAnimationFrame(loop);
  return () => { cancelAnimationFrame(raf); if (!fin() && st.hole < 3 && !moving) save(); };
}

/* =================================================================
   TIMELINE
   ================================================================= */
function mountTimeline(el, api){
  const r = rngFor('timeline');
  let picks = null;
  for (let t=0; t<300 && !picks; t++){
    const c = shuffle(EVENTS.slice(), r).slice(0,5);
    const ys = c.map(e => e[0]).sort((a,b) => a-b);
    if (ys.every((y,i) => i===0 || y - ys[i-1] >= 8)) picks = c;
  }
  if (!picks) picks = EVENTS.slice(0,5);
  const sorted = picks.slice().sort((a,b) => a[0]-b[0]);
  const MAXT = 3, key = stateKey('timeline');
  let st = store.get(key, null);
  if (!st){
    let order; do { order = shuffle([0,1,2,3,4], r); } while (order.every((v,i) => picks[v] === sorted[i]));
    st = {order, locked:[false,false,false,false,false], attempts:[], started:false};
  }
  let sel = null, msg = '', msgCls = '';
  const yr = y => y < 0 ? (-y) + ' BC' : String(y);
  const save = () => store.set(key, st);
  function render(){
    const fin = !!api.existing();
    const view = fin ? sorted.map((e,pos) => ({e, ok: true, right: picks[st.order[pos]] === e}))
                     : st.order.map((pi,pos) => ({e: picks[pi], ok: st.locked[pos]}));
    el.innerHTML = `
      <div class="tlend"><span class="label">Earliest</span><span class="tries" aria-label="${st.attempts.length} of ${MAXT} checks used">${Array.from({length:MAXT},(_,i)=>`<i class="${i<st.attempts.length?'u':''}"></i>`).join('')}</span></div>
      <ol class="tl" id="tl">${view.map((v,pos) => {
        const lock = fin || v.ok;
        const cls = fin ? (v.right ? 'ok' : 'no') : (v.ok ? 'ok' : (sel===pos ? 'sel' : ''));
        return `<li class="tli ${cls}">
          <div class="mv">${lock ? '' : `<button data-up="${pos}" aria-label="Move up" ${canMove(pos,-1)?'':'disabled'}>▲</button><button data-dn="${pos}" aria-label="Move down" ${canMove(pos,1)?'':'disabled'}>▼</button>`}</div>
          <button class="tlt" data-pos="${pos}" ${lock?'disabled':''}>${esc(v.e[1])}</button>
          <span class="yr">${lock ? yr(v.e[0]) : ''}</span></li>`; }).join('')}</ol>
      <div class="tlend"><span class="label">Latest</span><span></span></div>
      <p class="msg ${msgCls}" aria-live="polite">${esc(msg)}</p>
      ${fin ? (api.existing().won ? '' : `<p class="hint">This is the correct order. Red rows were out of place on your last check.</p>`) : `<div class="row" style="justify-content:center"><button class="btn primary" id="tlcheck">Check order</button></div>`}`;
    if (fin) return;
    el.querySelector('#tl').onclick = e => {
      const up = e.target.closest('[data-up]'), dn = e.target.closest('[data-dn]'), t = e.target.closest('.tlt');
      if (up) shift(+up.dataset.up, -1); else if (dn) shift(+dn.dataset.dn, 1); else if (t) tap(+t.dataset.pos);
    };
    el.querySelector('#tlcheck').onclick = check;
  }
  function neighbour(pos, dir){ for (let j = pos+dir; j >= 0 && j < 5; j += dir) if (!st.locked[j]) return j; return -1; }
  function canMove(pos, dir){ return neighbour(pos, dir) !== -1; }
  function swap(a, b){ [st.order[a], st.order[b]] = [st.order[b], st.order[a]]; st.started = true; save(); }
  function shift(pos, dir){ const j = neighbour(pos, dir); if (j < 0) return; swap(pos, j); sel = null; msg=''; render(); }
  function tap(pos){ if (sel === null) sel = pos; else if (sel === pos) sel = null; else { swap(sel, pos); sel = null; } msg=''; render(); }
  function check(){
    st.started = true;
    const res = st.order.map((pi,pos) => picks[pi] === sorted[pos]);
    st.attempts.push(res); st.locked = res.slice(); sel = null; save();
    const n = res.filter(Boolean).length, used = st.attempts.length;
    const grid = st.attempts.map(a => a.map(x => x ? '🟩' : '⬜').join('')).join('\n');
    if (n === 5 || used >= MAXT){
      const won = n === 5;
      api.finish({score: used, won, title: won ? (used===1 ? 'Perfect recall' : 'In order') : 'Out of checks',
        detail: sorted.map(e => `${yr(e[0])}: ${e[1]}`).join(' · '),
        summary: won ? `${used}/${MAXT}` : `X/${MAXT}`,
        share: `Daybook Timeline No. ${DAY_NO}  ${won?used:'X'}/${MAXT}\n${grid}`});
      msg = ''; render(); return;
    }
    msg = `${n} of 5 in the right place. ${MAXT-used} check${MAXT-used===1?'':'s'} left.`; msgCls = '';
    render();
  }
  render();
  const prev = api.existing(); if (prev) api.show(prev);
}

/* =================================================================
   SWITCHBOARD
   ================================================================= */
function mountSwitch(el, api){
  const N = 5, r = rngFor('switch');
  let target;
  do { target = Array.from({length:N*N}, () => r() < 0.4 ? 1 : 0); } while (target.reduce((a,b)=>a+b,0) < 6);
  const par = 5 + Math.floor(r()*4);
  const presses = shuffle([...Array(N*N).keys()], r).slice(0, par);
  const flip = (b, i) => { const x = i % N, y = Math.floor(i / N); [[0,0],[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dy]) => { const nx = x+dx, ny = y+dy; if (nx>=0 && nx<N && ny>=0 && ny<N) b[ny*N+nx] ^= 1; }); };
  const start = target.slice(); presses.forEach(i => flip(start, i));
  const key = stateKey('switch');
  let st = store.get(key, null) || {moves:[], started:false, gaveUp:false};
  let arm = false, msg = '';
  const board = () => { const b = start.slice(); st.moves.forEach(i => flip(b, i)); return b; };
  function render(){
    const b = board(), fin = !!api.existing();
    const wrong = b.reduce((a,v,i) => a + (v !== target[i] ? 1 : 0), 0);
    const showSol = fin && st.gaveUp;
    el.innerHTML = `
      <div class="sw">
        <div class="swb" id="swb" role="grid" aria-label="Switchboard">${b.map((v,i) => `<button class="swc ${v?'on':''} ${!fin && v!==target[i]?'x':''} ${showSol && presses.includes(i)?'sol':''}" data-i="${i}" aria-label="Row ${Math.floor(i/N)+1}, column ${i%N+1}, ${v?'on':'off'}${v!==target[i]?', does not match':''}" ${fin?'disabled':''}></button>`).join('')}</div>
        <div class="swside">
          <div><span class="label">Match this</span><div class="swt" aria-hidden="true">${target.map(v => `<i class="${v?'on':''}"></i>`).join('')}</div></div>
          <div class="swstat"><span class="label">Presses</span><b>${st.moves.length}<span style="color:var(--muted);font-weight:500"> / par ${par}</span></b></div>
          <div class="swstat"><span class="label">Unmatched</span><b>${wrong}</b></div>
        </div>
      </div>
      <p class="msg" aria-live="polite">${esc(msg)}</p>
      ${fin ? (showSol ? `<p class="hint">Ringed switches are one solution: press each once, in any order.</p>` : '') : `<div class="row" style="justify-content:center">
        <button class="btn" id="swundo" ${st.moves.length?'':'disabled'}>Undo</button>
        <button class="btn" id="swreset" ${st.moves.length?'':'disabled'}>Start over</button>
        <button class="btn" id="swgive">${arm ? 'Tap again to give up' : 'Show solution'}</button>
      </div>`}`;
    if (fin) return;
    el.querySelector('#swb').onclick = e => { const c = e.target.closest('.swc'); if (!c) return; press(+c.dataset.i); };
    el.querySelector('#swundo').onclick = () => { st.moves.pop(); arm = false; msg=''; store.set(key, st); render(); };
    el.querySelector('#swreset').onclick = () => { st.moves = []; arm = false; msg=''; store.set(key, st); render(); };
    el.querySelector('#swgive').onclick = () => {
      if (!arm){ arm = true; render(); return; }
      st.gaveUp = true; store.set(key, st);
      api.finish({won:false, title:'Solution shown', detail:`It takes ${par} presses. The ringed switches show where.`, summary:'Gave up',
        share:`Daybook Switchboard No. ${DAY_NO}\nGave up after ${st.moves.length} press${st.moves.length===1?'':'es'} (par ${par})`});
      render();
    };
  }
  function press(i){
    arm = false; msg = '';
    if (st.moves.length && st.moves[st.moves.length-1] === i) st.moves.pop(); else st.moves.push(i);
    st.started = true; store.set(key, st);
    const b = board();
    if (b.every((v,k) => v === target[k])){
      const n = st.moves.length, stars = n <= par ? 3 : n <= par+4 ? 2 : 1;
      api.finish({score: n, won:true, title: n < par ? 'Under par' : n === par ? 'Wired right' : 'Matched',
        detail:`Matched in ${n} press${n===1?'':'es'}. Par was ${par}.`, summary:'★'.repeat(stars)+'☆'.repeat(3-stars),
        share:`Daybook Switchboard No. ${DAY_NO}\n${'★'.repeat(stars)}${'☆'.repeat(3-stars)}  ${n} press${n===1?'':'es'} (par ${par})`});
    }
    render();
  }
  render();
  const prev = api.existing(); if (prev) api.show(prev);
}


/* ---------- register the original seven ---------- */
register({id:'linkage', name:'Linkage', cat:'words', mins:3, blurb:'Climb a ladder of compound words. Every neighbouring pair joins up: rain, bow, tie…', art:LEGACY_ART.linkage, mount:mountLinkage,
  how:['The top and bottom words are given. Fill the four in between, from the top down.','Each word joins the one above it and the one below it to make a compound word or phrase (RAIN + BOW = RAINBOW, BOW + TIE = BOW TIE).','The first letter of the current word is free. A wrong guess reveals the next letter.','Fewer revealed letters is better. Giving away a whole word ends your streak.']});
register({id:'cipher', name:'Cipher', cat:'words', mins:5, blurb:'A famous line in a letter-swap code. Crack the key and read it.', art:LEGACY_ART.cipher, mount:mountCipher,
  how:['Every letter in the line has been swapped for another. The small letters are the code.','Tap a code letter and type what you think it stands for. Every matching letter fills at once.','Two letters start out decoded. A hint decodes one more.','Solve it to keep your streak.']});
register({id:'ballpark', name:'Ballpark', cat:'know', mins:2, blurb:'One real-world number. Six guesses. Higher, lower, warmer.', art:LEGACY_ART.ballpark, mount:mountBallpark,
  how:['Guess the number in six tries. After each guess you learn whether to go higher or lower.','Hot means you are within about 10%, warm within 40%. Exact counts and years use tighter bands.','Land within 3% (or exactly, for counts and years) to win.']});
register({id:'target', name:'Target', cat:'numbers', mins:4, blurb:'Six numbers, four operations, one three-digit target.', art:LEGACY_ART.target, mount:mountTarget,
  how:['Tap a number, an operation, then another number. They combine into one new number.','Each number can be used once. Results must be whole and positive.','Hit the target exactly for three stars. Within 5 earns two, within 10 earns one.','Stuck? Lock in your closest number. Two stars or better keeps your streak.']});
register({id:'putt', name:'Putt', cat:'skill', mins:3, blurb:'Three fresh mini-golf holes, the same for everyone today.', art:LEGACY_ART.putt, mount:mountPutt,
  how:['Press anywhere on the green, drag back like a slingshot, and let go to putt.','Sand slows the ball. Water costs a stroke and sends you back.','Eight strokes on a hole and you pick up.','Finish within two over par to keep your streak.']});
register({id:'timeline', name:'Timeline', cat:'know', mins:2, blurb:'Five moments from history, shuffled. Put them in order.', art:LEGACY_ART.timeline, mount:mountTimeline,
  how:['Put the five events in order, earliest at the top.','Use the arrows, or tap two events to swap them.','Check your order up to three times. Events in the right place turn green and lock.','Get all five in place within three checks to win.']});
register({id:'switch', name:'Switchboard', cat:'logic', mins:4, blurb:'Flip switches until the board matches the pattern. Every switch flips its neighbours too.', art:LEGACY_ART.switch, mount:mountSwitch,
  how:['Make the big board match the small pattern.','Each press flips that switch and the ones directly above, below, left and right of it.','A red dot marks a switch that doesn’t match yet.','Par is the number of presses it took to scramble the board. Solve it at par for three stars.']});
