/* =================================================================
   DEEP CUT — open-answer rarity trivia (Kitchen, Screen, Games)
   Five prompts a day, 25 seconds each. Any accepted answer scores;
   rarer answers score more. Rarity comes from a curated tier until
   8+ other players have posted today's answers, then from the crowd.
   Answer data format: entries split by "|", aliases by "=", tier "#n"
   (1 obvious … 5 deep cut, default 3).
   ================================================================= */
const DEEP_TIERS = [
  {n:'No score', p:0,   sq:'⬛'},
  {n:'Obvious',  p:10,  sq:'⬜'},
  {n:'Familiar', p:30,  sq:'🟨'},
  {n:'Uncommon', p:60,  sq:'🟧'},
  {n:'Rare',     p:85,  sq:'🟥'},
  {n:'Deep cut', p:100, sq:'🟪'}
];
const DEEP_SECS = 25;
const DEEP_NUM = {one:'1',two:'2',three:'3',four:'4',five:'5',six:'6',seven:'7',eight:'8',nine:'9',ten:'10',eleven:'11',twelve:'12'};
function deepNorm(s, strip){
  s = String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  s = s.replace(/&/g, ' and ').replace(/['’‘`´]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  let w = s.split(' ').filter(Boolean).map(x => x === 'defense' ? 'defence' : (DEEP_NUM[x] || x));
  if (w.length > 1 && w[0] === 'the') w = w.slice(1);
  if (strip){ const k = w.filter(x => !strip.includes(x)); if (k.length) w = k; }
  return w.join('');
}
function deepParse(str){
  return str.split('|').map(e => e.trim()).filter(Boolean).map(e => {
    let t = 3; const h = e.lastIndexOf('#');
    if (h > 0){ t = parseInt(e.slice(h+1), 10) || 3; e = e.slice(0, h); }
    const names = e.split('=').map(x => x.trim()).filter(Boolean);
    return {name:names[0], alias:names.slice(1), tier:clamp(t, 1, 5)};
  });
}
function deepIndex(p, pool){
  if (p._idx) return p._idx;
  let list = deepParse(p.a);
  if (p.plus){
    const other = pool.find(x => x.id === p.plus);
    if (other){
      const have = new Set(list.map(e => deepNorm(e.name, p.strip)));
      deepParse(other.a).forEach(e => { const k = deepNorm(e.name, p.strip); if (!have.has(k)){ have.add(k); list.push(e); } });
    }
  }
  const map = new Map(), soft = new Map();
  list.forEach((e, i) => [e.name, ...e.alias].forEach(n => {
    const k = deepNorm(n, p.strip); if (!k) return;
    if (!map.has(k)) map.set(k, i);
    [k.replace(/es$/, ''), k.replace(/s$/, '')].forEach(v => { if (v.length > 2 && v !== k && !soft.has(v)) soft.set(v, i); });
  }));
  p._idx = {list, map, soft};
  return p._idx;
}
function deepMatch(p, pool, raw){
  const {list, map, soft} = deepIndex(p, pool);
  const k = deepNorm(raw, p.strip); if (!k) return null;
  const c = [k, k.replace(/ies$/, 'y'), k.replace(/es$/, ''), k.replace(/s$/, '')];
  for (const x of c) if (map.has(x)) return list[map.get(x)];
  for (const x of c) if (soft.has(x)) return list[soft.get(x)];
  return null;
}
function deepTier(gid, pid, entry){
  let c = {players:0, counts:new Map()};
  try { c = crowd(gid); } catch(e){}
  if (c.players >= 8){
    const share = (c.counts.get(pid + ':' + entry.name) || 0) / c.players;
    return {tier: share >= .4 ? 1 : share >= .2 ? 2 : share >= .08 ? 3 : share >= .03 ? 4 : 5, src:'crowd', players:c.players};
  }
  return {tier:entry.tier, src:'list', players:c.players};
}

/* ---------------- KITCHEN ---------------- */
const DEEP_KITCHEN = [
{id:'spice', q:'Name a herb or spice', a:`Basil#1|Oregano#1|Thyme#1|Rosemary#1|Parsley#1|Mint#1|Cinnamon#1|Black Pepper=Pepper=Peppercorn#1|Ginger#1|Garlic#1|Cumin#2|Paprika#2|Turmeric#2|Nutmeg#2|Cloves=Clove#2|Cardamom=Cardamon#2|Coriander=Cilantro#2|Dill#2|Sage#2|Chives#2|Bay Leaf=Bay Leaves=Bay#2|Saffron#2|Vanilla#2|Chili Powder=Chilli Powder#2|Cayenne Pepper=Cayenne#2|Curry Powder#2|Garlic Powder#2|Onion Powder#2|Tarragon|Marjoram|Allspice|Star Anise|Anise=Aniseed|Fennel Seed=Fennel|Mustard Seed=Mustard|Caraway|Lemongrass|Lavender|White Pepper|Garam Masala|Five Spice=Chinese Five Spice|Herbes de Provence|Smoked Paprika|Chipotle|Sesame Seed=Sesame|Poppy Seed|Horseradish|Wasabi|Fenugreek#4|Sumac#4|Za'atar=Zaatar#4|Celery Seed#4|Mace#4|Juniper Berry=Juniper#4|Galangal#4|Sichuan Pepper=Szechuan Pepper#4|Pink Peppercorn#4|Chervil#4|Savory=Summer Savory=Winter Savory#4|Sorrel#4|Shiso=Perilla#4|Curry Leaf=Curry Leaves#4|Makrut Lime Leaf=Kaffir Lime Leaf=Lime Leaf#4|Annatto=Achiote#4|Nigella Seed=Nigella=Kalonji#4|Black Cardamom#4|Ras el Hanout#4|Berbere#4|Old Bay#4|Ancho#4|Aleppo Pepper#4|Gochugaru#4|Lemon Balm#4|Wild Garlic=Ramsons#4|Cassia#4|Tamarind#4|Asafoetida=Hing#5|Grains of Paradise#5|Long Pepper#5|Lovage#5|Borage#5|Epazote#5|Culantro#5|Ajwain=Carom Seed#5|Amchur=Amchoor=Mango Powder#5|Mahlab=Mahleb#5|Baharat#5|Dukkah#5|Urfa Biber#5|Shichimi Togarashi=Togarashi#5|Licorice Root=Liquorice Root#5|Orris Root#5|Fennel Pollen#5|Cubeb#5|Hyssop#5|Rue#5|Angelica#5`},
{id:'pasta', q:'Name a pasta shape', a:`Spaghetti#1|Penne#1|Macaroni=Elbow Macaroni#1|Lasagne=Lasagna#1|Ravioli#1|Fusilli#2|Farfalle=Bow Tie=Bowtie#2|Linguine#2|Fettuccine=Fettucine#2|Tortellini#2|Rigatoni#2|Gnocchi#2|Angel Hair=Capellini#2|Orzo|Tagliatelle|Pappardelle|Orecchiette|Cannelloni|Conchiglie=Shells=Shell Pasta|Ziti|Vermicelli|Bucatini|Rotini|Cavatappi|Manicotti|Ditalini#4|Campanelle#4|Gemelli#4|Radiatori#4|Paccheri#4|Mafaldine=Mafalde=Reginette#4|Strozzapreti#4|Trofie#4|Casarecce#4|Cavatelli#4|Tortelloni#4|Agnolotti#4|Cappelletti#4|Anelli#4|Stelline#4|Acini di Pepe#4|Alfabeto=Alphabet Pasta#4|Pastina#4|Tubetti#4|Mostaccioli#4|Tagliolini#4|Spaghettini#4|Ruote=Wagon Wheels#4|Fregola#5|Garganelli#5|Lumache#5|Mezzelune#5|Bigoli#5|Pici#5|Corzetti#5|Busiate#5|Calamarata#5|Candele#5|Maltagliati#5|Pizzoccheri#5|Sedanini#5|Tajarin#5|Bavette#5|Cascatelli#5`},
{id:'cheese', q:'Name a cheese', a:`Cheddar#1|Mozzarella#1|Parmesan=Parmigiano Reggiano=Parmigiano#1|Brie#1|Feta#1|Gouda#1|Swiss#2|Camembert#2|Blue Cheese#2|Gorgonzola#2|Roquefort#2|Stilton#2|Ricotta#2|Cream Cheese#2|Cottage Cheese#2|Monterey Jack=Jack#2|Provolone#2|Gruyère=Gruyere#2|Halloumi#2|Mascarpone#2|Goat Cheese=Chevre#2|American#2|Pepper Jack|Colby|Emmental=Emmentaler=Emmenthal|Manchego|Paneer|Pecorino Romano=Pecorino|Asiago|Fontina|Havarti|Edam|Muenster=Munster|Burrata|Raclette|Queso Fresco|Grana Padano|String Cheese|Boursin#4|Comté=Comte#4|Reblochon#4|Taleggio#4|Limburger#4|Jarlsberg#4|Wensleydale#4|Red Leicester#4|Double Gloucester#4|Caerphilly#4|Lancashire#4|Cheshire#4|Danish Blue#4|Cambozola#4|Port Salut#4|Leerdammer#4|Queso Blanco#4|Cotija#4|Oaxaca#4|Scamorza#4|Stracciatella#4|Labneh#4|Quark#4|Cheese Curds#4|Velveeta#4|Colby Jack#4|Buffalo Mozzarella=Mozzarella di Bufala#4|Stinking Bishop#5|Shropshire Blue#5|Cornish Yarg#5|Saint Agur#5|Pont-l'Évêque#5|Époisses#5|Morbier#5|Beaufort#5|Mimolette#5|Cantal#5|Saint-Nectaire#5|Tomme de Savoie=Tomme#5|Valençay#5|Crottin de Chavignol=Crottin#5|Neufchâtel#5|Brillat-Savarin#5|Langres#5|Vacherin#5|Appenzeller#5|Tête de Moine#5|Sbrinz#5|Brunost=Gjetost#5|Maasdam#5|Chihuahua#5|Idiazábal#5|Mahón#5|Cabrales#5|Torta del Casar#5|Tetilla#5|Caciocavallo#5|Stracchino#5|Robiola#5|Castelmagno#5|Montasio#5|Bel Paese#5|Fiore Sardo#5|Kefalotyri#5|Graviera#5|Kasseri#5|Mizithra=Myzithra#5|Akkawi#5|Kashkaval#5|Sulguni#5|Tilsit#5|Butterkäse#5|Bergkäse#5|Brick#5|Teleme#5|Humboldt Fog#5|Chhena#5`},
{id:'fruit', q:'Name a fruit', a:`Apple#1|Banana#1|Orange#1|Grape#1|Strawberry#1|Watermelon#1|Pineapple#1|Mango#1|Peach#1|Pear#1|Cherry#1|Lemon#1|Blueberry#1|Lime#2|Raspberry#2|Blackberry#2|Kiwi=Kiwifruit#2|Plum#2|Apricot#2|Coconut#2|Papaya#2|Pomegranate#2|Grapefruit#2|Cantaloupe#2|Avocado#2|Melon#2|Honeydew|Tomato|Fig|Date|Nectarine|Tangerine|Clementine|Mandarin|Cranberry|Gooseberry|Lychee=Litchi|Passion Fruit|Dragon Fruit=Pitaya|Guava|Persimmon|Star Fruit=Carambola|Jackfruit|Durian|Mulberry|Currant=Blackcurrant=Redcurrant|Plantain|Blood Orange|Quince#4|Kumquat#4|Rambutan#4|Mangosteen#4|Longan#4|Lingonberry#4|Elderberry#4|Boysenberry#4|Huckleberry#4|Olive#4|Breadfruit#4|Cherimoya=Custard Apple#4|Soursop=Guanabana#4|Physalis=Cape Gooseberry=Ground Cherry#4|Yuzu#4|Pomelo#4|Acai#4|Goji Berry=Wolfberry#4|Prickly Pear=Cactus Pear#4|Satsuma#4|Loganberry#5|Cloudberry#5|Feijoa#5|Tamarillo#5|Sapodilla#5|Ackee#5|Salak=Snake Fruit#5|Ugli Fruit#5|Medlar#5|Loquat#5|Jabuticaba#5|Kiwano=Horned Melon#5|Miracle Fruit#5|Buddha's Hand#5|Finger Lime#5|Marionberry#5|Sloe#5|Damson#5|Greengage#5|Pawpaw#5|Lucuma#5|Mamey#5|Jujube#5|Calamansi#5|Bilberry#5`},
{id:'veg', q:'Name a vegetable', a:`Carrot#1|Broccoli#1|Potato#1|Onion#1|Lettuce#1|Spinach#1|Cucumber#1|Bell Pepper=Pepper#1|Corn=Sweetcorn#1|Pea#1|Cabbage#2|Cauliflower#2|Celery#2|Garlic#2|Green Bean=String Bean#2|Zucchini=Courgette#2|Eggplant=Aubergine#2|Asparagus#2|Kale#2|Mushroom#2|Sweet Potato#2|Pumpkin#2|Radish#2|Beetroot=Beet#2|Brussels Sprout#2|Leek|Artichoke|Butternut Squash=Squash|Turnip|Parsnip|Okra|Bok Choy=Pak Choi|Arugula=Rocket|Watercress|Swiss Chard=Chard|Collard Greens=Collards|Fennel|Shallot|Scallion=Spring Onion=Green Onion|Yam|Edamame|Chili Pepper=Chilli|Jalapeño|Rutabaga=Swede#4|Kohlrabi#4|Celeriac#4|Jicama#4|Daikon#4|Endive#4|Radicchio#4|Chicory#4|Cassava=Yuca=Manioc#4|Taro#4|Bamboo Shoot#4|Bean Sprout#4|Water Chestnut#4|Jerusalem Artichoke=Sunchoke#4|Romanesco#4|Broccolini#4|Rapini=Broccoli Rabe#4|Napa Cabbage=Chinese Cabbage#4|Mustard Greens#4|Tomatillo#4|Lima Bean#4|Fava Bean=Broad Bean#4|Snow Pea=Mangetout#4|Sugar Snap Pea#4|Horseradish#4|Spaghetti Squash#4|Acorn Squash#4|Escarole#5|Frisée#5|Lotus Root#5|Salsify#5|Gai Lan=Chinese Broccoli#5|Dandelion Greens#5|Purslane#5|Samphire#5|Fiddlehead#5|Ramp#5|Chayote#5|Bitter Melon=Bitter Gourd#5|Lamb's Lettuce=Mâche#5|Delicata#5|Kabocha#5|Pattypan#5|Cardoon#5|Burdock#5|Yardlong Bean#5|Winged Bean#5|Celtuce#5|Tatsoi#5|Mizuna#5`},
{id:'cocktail', q:'Name a cocktail', a:`Margarita#1|Mojito#1|Martini#1|Old Fashioned#1|Piña Colada=Pina Colada#1|Bloody Mary#1|Gin and Tonic=G&T#1|Manhattan#2|Cosmopolitan=Cosmo#2|Daiquiri#2|Negroni#2|Mai Tai#2|Moscow Mule#2|Whiskey Sour=Whisky Sour#2|Long Island Iced Tea#2|Sex on the Beach#2|Tequila Sunrise#2|Mimosa#2|Aperol Spritz=Spritz#2|Espresso Martini#2|White Russian#2|Screwdriver#2|Tom Collins|Bellini|Caipirinha|Paloma|Sidecar|French 75|Gimlet|Mint Julep|Dark 'n' Stormy=Dark and Stormy|Black Russian|Cuba Libre=Rum and Coke|Irish Coffee|Hot Toddy|Sangria|Appletini|Lemon Drop|Pornstar Martini|Sazerac#4|Pisco Sour#4|Boulevardier#4|Aviation#4|Last Word#4|Sea Breeze#4|Grasshopper#4|Brandy Alexander#4|Rob Roy#4|Rusty Nail#4|Hurricane#4|Zombie#4|Singapore Sling#4|Vesper#4|Kir Royale=Kir#4|Americano#4|Eggnog#4|Michelada#4|Mudslide#4|Kamikaze#4|Fuzzy Navel#4|Blue Lagoon#4|Gin Fizz#4|Corpse Reviver#5|Ramos Gin Fizz#5|Bay Breeze#5|Cape Codder#5|Godfather#5|Painkiller#5|Jungle Bird#5|Paper Plane#5|Penicillin#5|Bramble#5|Hanky Panky#5|Harvey Wallbanger#5|Tom and Jerry#5|Clover Club#5|Bee's Knees#5|Southside#5|Gibson#5|Hemingway Daiquiri#5|El Diablo#5|Tommy's Margarita#5|Sherry Cobbler#5|Vieux Carré#5|Planter's Punch#5`},
{id:'bread', q:'Name a type of bread', a:`Baguette#1|Sourdough#1|Bagel#1|Pita#1|Naan#1|White Bread#1|Ciabatta#2|Focaccia#2|Brioche#2|Croissant#2|Tortilla#2|Rye Bread=Rye#2|Cornbread#2|Banana Bread#2|Whole Wheat=Wholemeal#2|English Muffin#2|Roti#2|Pretzel#2|Pumpernickel|Challah|Soda Bread|Multigrain|Crumpet|Biscuit|Scone|Chapati|Paratha|Matzo=Matzah|Panettone|Bao=Steamed Bun|Pain au Chocolat|Flatbread|Grissini=Breadsticks|Hot Cross Bun|Puri=Poori#4|Lavash#4|Injera#4|Arepa#4|Pão de Queijo#4|Pan Dulce#4|Pandoro#4|Stollen#4|Milk Bread=Shokupan#4|Khachapuri#4|Pide#4|Kaiser Roll#4|Crispbread=Knäckebröd#4|Piadina#4|Hushpuppy#4|Monkey Bread#4|Zucchini Bread#4|Babka#4|Potato Bread#4|Bhatura#5|Kulcha#5|Bolillo#5|Concha#5|Melon Pan#5|Simit#5|Lepinja#5|Barmbrack#5|Bannock#5|Fougasse#5|Pain de Campagne#5|Pain de Mie#5|Hoagie Roll#5|Brötchen#5|Vollkornbrot#5|Zopf#5|Kalach#5|Borodinsky#5|Rugbrød#5|Michetta#5|Pane Carasau#5|Sangak#5|Barbari#5|Taftan#5|Johnnycake#5|Kugelhopf#5|Teacake#5|Bara Brith#5|Cottage Loaf#5|Bloomer#5|Tiger Bread=Dutch Crunch#5|Farl#5`},
{id:'utensil', q:'Name a piece of kitchen equipment', a:`Spatula#1|Whisk#1|Ladle#1|Knife#1|Frying Pan=Skillet=Pan#1|Oven#1|Tongs#2|Cutting Board=Chopping Board#2|Peeler=Vegetable Peeler#2|Grater#2|Colander#2|Sieve=Strainer#2|Rolling Pin#2|Measuring Cup#2|Can Opener=Tin Opener#2|Wooden Spoon#2|Saucepan#2|Wok#2|Kettle#2|Toaster#2|Blender#2|Microwave#2|Air Fryer#2|Measuring Spoon|Corkscrew|Bottle Opener|Garlic Press|Mortar and Pestle=Mortar=Pestle|Potato Masher=Masher|Slotted Spoon|Cookie Cutter|Stockpot|Dutch Oven|Baking Sheet=Baking Tray=Sheet Pan|Muffin Tin|Cake Tin=Cake Pan|Casserole Dish|Food Processor|Stand Mixer=Mixer|Hand Mixer|Slow Cooker=Crock Pot|Pressure Cooker=Instant Pot|Rice Cooker|Thermometer=Meat Thermometer|Kitchen Timer=Timer|Kitchen Scale=Scale|Oven Mitt=Oven Glove|Apron|Ice Cream Scoop|Pizza Cutter|Kitchen Shears=Scissors|Cleaver|Bread Knife|Butter Knife|Chopsticks|Juicer=Lemon Squeezer|Pepper Mill=Pepper Grinder|Mandoline#4|Zester=Microplane#4|Skimmer=Spider#4|Pastry Brush#4|Pastry Cutter=Pastry Blender#4|Piping Bag#4|Pie Dish#4|Ramekin#4|Roasting Pan=Roasting Tin#4|Griddle#4|Grill Pan#4|Funnel#4|Salad Spinner#4|Pizza Stone#4|Paring Knife#4|Honing Steel=Sharpening Steel#4|Whetstone#4|Baster=Turkey Baster#4|Fish Slice#4|Tagine#4|Steamer=Bamboo Steamer#4|Double Boiler=Bain-Marie#4|Sifter=Flour Sifter#4|Nutcracker#4|Potato Ricer=Ricer#4|Spiralizer#4|Cooling Rack=Wire Rack#4|Melon Baller#5|Egg Slicer#5|Bench Scraper=Dough Scraper#5|Splatter Guard#5|Spoon Rest#5|Trivet#5|Cherry Pitter#5|Apple Corer#5|Molcajete#5|Chinois#5|Tamis#5|Kitchen Torch=Blowtorch#5|Citrus Reamer#5|Silicone Mat=Silpat#5|Salt Pig#5`},
{id:'french', q:'Name a French cooking term', a:`Sauté=Saute#1|Flambé=Flambe#2|Julienne#2|Purée=Puree#2|Roux#2|Mise en Place#2|Sous Vide#2|Béchamel=Bechamel#2|Hollandaise#2|Gratin=Au Gratin#2|Mousse#2|Vinaigrette#2|Soufflé=Souffle#2|Crème Brûlée=Brulee#2|Confit|Brunoise|Chiffonade|Mirepoix|Bain-Marie|Velouté|Beurre Blanc|Consommé|Coulis|Amuse-Bouche|Bouquet Garni|Crème Anglaise|Croûton|Ragoût|Terrine|Pâté|Bourguignon|Parfait|Sous Chef|Espagnole#4|Beurre Noisette#4|Chantilly#4|Duxelles#4|Demi-Glace#4|Quenelle#4|Rillettes#4|Roulade#4|En Papillote#4|Meunière#4|Bordelaise#4|Provençale#4|Concassé#4|Déglacer=Deglaze#4|Mignonette#4|Court-Bouillon#4|Lardons#4|Mousseline#4|Pot-au-Feu#4|Rémoulade#4|Brigade=Brigade de Cuisine#4|Chef de Cuisine#4|Saucier#4|Pâtissier#4|Glacé#4|Batonnet#4|Beurre Manié#5|Fond#5|Liaison#5|Macédoine#5|Nappe#5|Tourner=Tourné#5|Paysanne#5|Monter au Beurre#5|Chaud-Froid#5|Fumet#5|Dégorger#5|Persillade#5|Garde Manger#5|Commis#5|Aboyeur#5|Émincer=Émincé#5|Paupiette#5`},
{id:'nut', q:'Name a nut', a:`Almond#1|Peanut#1|Walnut#1|Cashew#1|Pecan#2|Pistachio#2|Hazelnut=Filbert#2|Macadamia#2|Brazil Nut#2|Chestnut#2|Coconut#3|Pine Nut=Pignoli#3|Acorn#4|Hickory Nut=Hickory#4|Butternut#4|Beechnut#5|Candlenut#5|Tiger Nut#5|Kola Nut#5|Pili Nut#5|Ginkgo Nut#5|Baru Nut#5|Mongongo#5`},
{id:'rice', q:'Name a rice dish', a:`Fried Rice#1|Risotto#1|Paella#1|Sushi#1|Biryani#2|Pilaf=Pilau=Pulao#2|Jambalaya#2|Rice Pudding#2|Congee=Jook#3|Bibimbap#3|Jollof Rice=Jollof#3|Nasi Goreng#3|Arroz con Pollo#3|Onigiri#3|Arancini#3|Kheer#3|Red Beans and Rice#3|Kedgeree#4|Dirty Rice#4|Nasi Lemak#4|Khao Pad#4|Donburi#4|Gimbap=Kimbap#4|Mango Sticky Rice#4|Hainanese Chicken Rice=Chicken Rice#4|Arroz con Leche#4|Katsudon#4|Oyakodon#4|Gyudon#4|Omurice#4|Khichdi#4|Plov#4|Hoppin' John#4|Risi e Bisi#5|Mujaddara#5|Tahdig#5|Chelow#5|Arroz Negro#5|Arroz al Horno#5|Zongzi#5|Lu Rou Fan#5|Khao Man Gai#5|Bisi Bele Bath#5|Lemon Rice#5|Curd Rice#5|Chirashi#5|Tamago Kake Gohan#5|Nasi Campur#5|Com Tam#5`},
{id:'sauce', q:'Name a sauce or condiment', a:`Ketchup#1|Mayonnaise=Mayo#1|Mustard#1|Barbecue Sauce=BBQ Sauce#1|Soy Sauce#1|Hot Sauce#1|Salsa#2|Pesto#2|Marinara#2|Alfredo#2|Gravy#2|Hollandaise#2|Tartar Sauce#2|Teriyaki#2|Sriracha#2|Ranch#2|Sweet and Sour#2|Béchamel=White Sauce|Worcestershire Sauce=Worcestershire|Tabasco|Aioli|Tahini|Tzatziki|Guacamole|Chimichurri|Hoisin|Oyster Sauce|Fish Sauce|Buffalo Sauce|Gochujang|Bolognese=Ragù|Carbonara|Arrabbiata|Béarnaise|Cocktail Sauce|Thousand Island|Satay=Peanut Sauce|Chutney|Cranberry Sauce|Apple Sauce|Sweet Chili Sauce|Caramel|Chocolate Sauce|Custard|Harissa#4|Romesco#4|Salsa Verde#4|Mole#4|Ponzu#4|Tonkatsu Sauce#4|Puttanesca#4|Velouté#4|Beurre Blanc#4|Rémoulade#4|Peri-Peri=Piri Piri#4|Raita#4|Mint Sauce#4|Brown Sauce=HP Sauce#4|Black Bean Sauce#4|Chili Oil=Chili Crisp#4|Sambal#4|Enchilada Sauce#4|Coulis#4|Nuoc Cham#5|Espagnole#5|Bordelaise#5|Mornay#5|Soubise#5|Bread Sauce#5|XO Sauce#5|Mojo#5|Ssamjang#5|Tkemali#5|Zhug=Skhug#5|Toum#5|Muhammara#5|Gribiche#5|Ravigote#5|Salmoriglio#5|Bagna Cauda#5|Agrodolce#5`},
{id:'coffee', q:'Name a coffee drink', a:`Espresso#1|Latte#1|Cappuccino#1|Americano#1|Mocha#2|Macchiato#2|Flat White#2|Iced Coffee#2|Cold Brew#2|Irish Coffee#2|Frappé=Frappe#2|Cortado|Ristretto|Lungo|Affogato|Turkish Coffee|Café au Lait|Café con Leche|Doppio|Long Black|Red Eye|Vietnamese Iced Coffee=Ca Phe Sua Da#4|Cuban Coffee=Cafecito=Café Cubano#4|Piccolo#4|Gibraltar#4|Dalgona#4|Breve#4|Nitro Cold Brew#4|Pour Over#4|Bulletproof Coffee#4|Vienna Coffee=Einspänner#5|Café Bombón#5|Galão#5|Espresso Romano#5|Mazagran#5|Marocchino#5|Caffè Corretto#5|Shakerato#5`},
{id:'mushroom', q:'Name an edible mushroom', a:`Button#1|Portobello#1|Shiitake#1|Oyster#2|Cremini=Chestnut Mushroom#2|Truffle#2|Chanterelle#2|Enoki#3|Porcini=Cep=Penny Bun#3|Morel#3|Maitake=Hen of the Woods#4|Lion's Mane#4|King Trumpet=King Oyster#4|Shimeji=Beech Mushroom#4|Wood Ear#4|Chicken of the Woods=Sulphur Shelf#4|Puffball#4|Black Trumpet#5|Hedgehog#5|Matsutake#5|Nameko#5|Blewit#5|Cauliflower Mushroom#5|Honey Fungus=Honey Mushroom#5|Lobster Mushroom#5|Shaggy Mane=Shaggy Ink Cap#5|Straw Mushroom#5|Saffron Milk Cap#5|Parasol#5|Field Mushroom#5|Horse Mushroom#5|St George's Mushroom#5`},
{id:'beef', q:'Name a cut of beef', a:`Sirloin#1|Ribeye#1|Filet Mignon#1|T-Bone#1|Tenderloin#2|Brisket#2|Porterhouse#2|Flank#2|Skirt#2|Prime Rib#2|Chuck#2|Short Rib#2|New York Strip=Strip Steak=Strip#2|Rump#3|Round#3|Top Sirloin#3|Hanger#3|Flat Iron#3|Tri-Tip#3|Oxtail#3|Shank#3|Tomahawk#3|Picanha=Coulotte#4|Denver Steak#4|Bavette#4|Chuck Eye#4|Eye of Round#4|Sirloin Tip#4|Cheek#4|Flap=Flap Meat#5|Plate#5|Spinalis=Rib Cap#5|London Broil#5|Clod#5|Petite Tender=Teres Major#5`},
{id:'apple', q:'Name a variety of apple', a:`Granny Smith#1|Gala#1|Fuji#1|Honeycrisp#1|Red Delicious#2|Golden Delicious#2|Pink Lady=Cripps Pink#2|Braeburn#2|McIntosh#2|Jazz#3|Ambrosia#3|Envy#3|Cosmic Crisp#3|Jonagold#3|Empire#3|Cortland#3|Bramley#3|Rome#4|Jonathan#4|Newtown Pippin=Pippin#4|Cox's Orange Pippin=Cox#4|Russet=Egremont Russet#4|Gravenstein#4|Northern Spy#4|Winesap#4|Macoun#4|Opal#4|SweeTango#4|Mutsu=Crispin#4|Idared#4|Kanzi#4|Pacific Rose#4|Spartan#4|Elstar#4|Discovery#5|Zestar#5|Paula Red#5|Arkansas Black#5|Baldwin#5|Snapdragon#5|EverCrisp#5|Liberty#5|Ginger Gold#5|Lady Apple#5|Stayman#5`}
];

/* ---------------- SCREEN ---------------- */
const DEEP_SCREEN = [
{id:'bestpic', q:'Name a Best Picture Oscar winner (through the 2025 ceremony)', a:`Titanic#1|The Godfather#1|Forrest Gump#1|Gladiator#1|Casablanca#2|Gone with the Wind#2|Schindler's List#2|The Lord of the Rings: The Return of the King=Return of the King#2|Oppenheimer#2|Parasite#2|The Silence of the Lambs#2|Rocky#2|Braveheart#2|The Sound of Music#2|Everything Everywhere All at Once#2|The Departed#2|Slumdog Millionaire|The Godfather Part II=Godfather Part 2=Godfather II|One Flew Over the Cuckoo's Nest|Ben-Hur|Lawrence of Arabia|West Side Story|My Fair Lady|Annie Hall|Amadeus|Rain Man|Dances with Wolves|Unforgiven|American Beauty|A Beautiful Mind|Chicago|Million Dollar Baby|No Country for Old Men|The King's Speech|Argo|12 Years a Slave|Birdman|Spotlight|Moonlight|The Shape of Water|Green Book|Nomadland|CODA|Anora|The Hurt Locker|Shakespeare in Love|The English Patient|Platoon|Gandhi|Out of Africa|The Deer Hunter|The Sting|The French Connection|Patton|Midnight Cowboy|All About Eve|On the Waterfront|The Bridge on the River Kwai|The Apartment|The Artist|Crash|Driving Miss Daisy|Kramer vs. Kramer|Ordinary People|Chariots of Fire|Terms of Endearment|The Last Emperor|Wings#4|The Broadway Melody#4|All Quiet on the Western Front#4|Cimarron#4|Grand Hotel#4|Cavalcade#4|It Happened One Night#4|Mutiny on the Bounty#4|The Great Ziegfeld#4|The Life of Emile Zola#4|You Can't Take It with You#4|Rebecca#4|How Green Was My Valley#4|Mrs. Miniver#4|Going My Way#4|The Lost Weekend#4|The Best Years of Our Lives#4|Gentleman's Agreement#4|Hamlet#4|All the King's Men#4|An American in Paris#4|The Greatest Show on Earth#4|From Here to Eternity#4|Marty#4|Around the World in 80 Days#4|Gigi#4|Tom Jones#4|A Man for All Seasons#4|In the Heat of the Night#4|Oliver!#4`},
{id:'pixar', q:'Name a Pixar feature film (through 2025)', a:`Toy Story#1|Finding Nemo#1|The Incredibles#1|Cars#1|Up#1|Monsters, Inc.=Monsters Inc#1|Inside Out#1|WALL-E=Wall E#2|Ratatouille#2|Coco#2|Toy Story 2#2|Toy Story 3#2|Toy Story 4#2|Finding Dory#2|Brave#2|A Bug's Life#2|Incredibles 2#2|Monsters University#3|Cars 2#3|Cars 3#3|Soul#3|Luca#3|Turning Red#3|Inside Out 2#3|Elemental#3|Lightyear#3|The Good Dinosaur#4|Onward#4|Elio#4`},
{id:'bond', q:'Name a James Bond film', a:`Goldfinger#1|Skyfall#1|Casino Royale#1|Dr. No=Doctor No#2|GoldenEye#2|No Time to Die#2|Spectre#2|From Russia with Love#2|Quantum of Solace#3|Thunderball#3|You Only Live Twice#3|Live and Let Die#3|The Spy Who Loved Me#3|Moonraker#3|Die Another Day#3|Tomorrow Never Dies#3|The World Is Not Enough#3|Diamonds Are Forever#3|The Man with the Golden Gun#3|For Your Eyes Only#4|Octopussy#4|A View to a Kill#4|The Living Daylights#4|Licence to Kill=License to Kill#4|On Her Majesty's Secret Service#4|Never Say Never Again#5`},
{id:'bondactor', q:'Name an actor who played James Bond in a film', a:`Sean Connery=Connery#1|Daniel Craig=Craig#1|Roger Moore=Moore#2|Pierce Brosnan=Brosnan#2|Timothy Dalton=Dalton#4|George Lazenby=Lazenby#4|David Niven=Niven#5`},
{id:'ghibli', q:'Name a Studio Ghibli film', a:`Spirited Away#1|My Neighbor Totoro=Totoro=My Neighbour Totoro#1|Princess Mononoke#2|Howl's Moving Castle#2|Kiki's Delivery Service#2|Ponyo#2|Castle in the Sky=Laputa#3|Grave of the Fireflies#3|The Wind Rises#3|The Boy and the Heron#3|Porco Rosso#3|Nausicaä of the Valley of the Wind=Nausicaa#4|Whisper of the Heart#4|Arrietty=The Secret World of Arrietty#4|The Cat Returns#4|The Tale of the Princess Kaguya=Princess Kaguya#4|When Marnie Was There#4|Pom Poko#4|Tales from Earthsea#4|From Up on Poppy Hill#5|Only Yesterday#5|Ocean Waves#5|My Neighbors the Yamadas#5|The Red Turtle#5|Earwig and the Witch#5`},
{id:'starwars', q:'Name a live-action Star Wars film', a:`A New Hope=Star Wars=Episode IV=Episode 4#1|The Empire Strikes Back=Empire Strikes Back=Episode V=Episode 5#1|Return of the Jedi=Episode VI=Episode 6#1|The Phantom Menace=Episode I=Episode 1#2|Revenge of the Sith=Episode III=Episode 3#2|Attack of the Clones=Episode II=Episode 2#2|The Force Awakens=Episode VII=Episode 7#2|The Last Jedi=Episode VIII=Episode 8#3|The Rise of Skywalker=Episode IX=Episode 9#4|Rogue One#4|Solo=Solo: A Star Wars Story#5`},
{id:'disney', q:'Name a Walt Disney Animation Studios feature (not Pixar)', a:`The Lion King#1|Frozen#1|Aladdin#1|Beauty and the Beast#1|The Little Mermaid#1|Snow White and the Seven Dwarfs=Snow White#1|Cinderella#2|Moana#2|Tangled#2|Mulan#2|Bambi#2|Dumbo#2|Pinocchio#2|Peter Pan#2|Sleeping Beauty#2|Zootopia=Zootropolis#2|Encanto#2|Frozen II=Frozen 2#2|Lilo & Stitch#2|The Jungle Book#2|Alice in Wonderland#2|Lady and the Tramp#2|Pocahontas#3|Hercules#3|Tarzan#3|The Hunchback of Notre Dame#3|One Hundred and One Dalmatians=101 Dalmatians#3|Fantasia#3|The Princess and the Frog#3|Big Hero 6#3|Wreck-It Ralph#3|Ralph Breaks the Internet#3|Raya and the Last Dragon#3|Moana 2#3|Wish#3|The Emperor's New Groove#3|Robin Hood#3|The Aristocats#3|The Sword in the Stone#3|Zootopia 2#3|Bolt#4|Meet the Robinsons#4|Chicken Little#4|Treasure Planet#4|Atlantis: The Lost Empire=Atlantis#4|Brother Bear#4|Home on the Range#4|Strange World#4|Dinosaur#4|Fantasia 2000#4|The Rescuers#4|The Rescuers Down Under#4|The Fox and the Hound#4|The Great Mouse Detective#4|Oliver & Company#4|The Black Cauldron#4|The Many Adventures of Winnie the Pooh#4|Winnie the Pooh#4|Saludos Amigos#5|The Three Caballeros#5|Make Mine Music#5|Fun and Fancy Free#5|Melody Time#5|The Adventures of Ichabod and Mr. Toad#5`},
{id:'hitchcock', q:'Name an Alfred Hitchcock film', a:`Psycho#1|Vertigo#1|The Birds#1|Rear Window#1|North by Northwest#2|Rebecca#2|Dial M for Murder#2|Rope#3|Notorious#3|Strangers on a Train#3|The 39 Steps=The Thirty-Nine Steps#3|The Man Who Knew Too Much#3|To Catch a Thief#3|Marnie#3|Spellbound#3|The Lady Vanishes#3|Shadow of a Doubt#4|Lifeboat#4|Saboteur#4|Suspicion#4|Foreign Correspondent#4|Frenzy#4|Family Plot#4|Torn Curtain#4|Topaz#4|The Trouble with Harry#4|The Wrong Man#4|Stage Fright#4|I Confess#4|The Paradine Case#5|Mr. & Mrs. Smith#5|Jamaica Inn#5|Young and Innocent#5|Sabotage#5|Secret Agent#5|Blackmail#5|The Lodger#5|The Ring#5|Murder!#5|Rich and Strange#5|Number Seventeen#5|Under Capricorn#5|The Skin Game#5|Juno and the Paycock#5|Champagne#5|The Manxman#5|Easy Virtue#5|Downhill#5|The Farmer's Wife#5|The Pleasure Garden#5|Waltzes from Vienna#5|The Mountain Eagle#5`},
{id:'doctor', q:'Name an actor who has played the Doctor in Doctor Who', a:`David Tennant=Tennant#1|Matt Smith#1|Tom Baker#2|Peter Capaldi=Capaldi#2|Jodie Whittaker=Whittaker#2|Christopher Eccleston=Eccleston#2|Ncuti Gatwa=Gatwa#3|Jon Pertwee=Pertwee#3|William Hartnell=Hartnell#3|Peter Davison=Davison#3|Patrick Troughton=Troughton#4|Sylvester McCoy=McCoy#4|Colin Baker#4|Paul McGann=McGann#4|John Hurt#4|Jo Martin#5|Peter Cushing=Cushing#5`},
{id:'friends', q:'Name a character from Friends', a:`Rachel=Rachel Green#1|Ross=Ross Geller#1|Monica=Monica Geller#1|Chandler=Chandler Bing#1|Joey=Joey Tribbiani#1|Phoebe=Phoebe Buffay#1|Gunther#2|Janice#2|Mike=Mike Hannigan#3|Richard=Richard Burke#3|Emily=Emily Waltham#3|Carol=Carol Willick#3|Ben=Ben Geller#3|Emma#3|Ursula=Ursula Buffay#3|Marcel#3|Ugly Naked Guy#3|Susan=Susan Bunch#4|Frank Jr.=Frank Buffay Jr.#4|Jack Geller#4|Judy Geller#4|Estelle=Estelle Leonard#4|Mr. Heckles=Heckles#4|Tag=Tag Jones#4|Paolo#4|Julie#4|Kathy#4|Charlie=Charlie Wheeler#4|Mona#4|Janine#4|David#4|Pete=Pete Becker#4|Barry#4|Mr. Treeger=Treeger#4|Jill=Jill Green#4|Amy=Amy Green#4|Fun Bobby#5|Mindy#5|Eddie#5|Joshua#5|Gavin#5|Mark#5|Leonard Green#5|Sandra Green#5|Erica#5|Elizabeth#5|Paul Stevens#5|Alice#5|Hugsy#5|Dr. Drake Ramoray=Drake Ramoray#5`},
{id:'mcu', q:'Name a Marvel Cinematic Universe film (through 2025)', a:`Iron Man#1|The Avengers=Avengers#1|Avengers: Endgame=Endgame#1|Avengers: Infinity War=Infinity War#1|Black Panther#1|Guardians of the Galaxy#1|Thor#2|Captain America: The First Avenger=The First Avenger#2|Captain America: Civil War=Civil War#2|Captain America: The Winter Soldier=The Winter Soldier#2|Thor: Ragnarok=Ragnarok#2|Spider-Man: Homecoming=Homecoming#2|Spider-Man: No Way Home=No Way Home#2|Doctor Strange#2|Ant-Man#2|Captain Marvel#2|Deadpool & Wolverine#2|Iron Man 2|Iron Man 3|Avengers: Age of Ultron=Age of Ultron|Guardians of the Galaxy Vol. 2=Guardians of the Galaxy 2|Guardians of the Galaxy Vol. 3=Guardians of the Galaxy 3|Spider-Man: Far From Home=Far From Home|Black Widow|Shang-Chi and the Legend of the Ten Rings=Shang-Chi|Thor: The Dark World=The Dark World|Thor: Love and Thunder=Love and Thunder|Doctor Strange in the Multiverse of Madness=Multiverse of Madness|Black Panther: Wakanda Forever=Wakanda Forever|The Fantastic Four: First Steps=Fantastic Four: First Steps|Thunderbolts*=Thunderbolts|The Incredible Hulk#4|Ant-Man and the Wasp#4|Ant-Man and the Wasp: Quantumania=Quantumania#4|Eternals#4|The Marvels#4|Captain America: Brave New World=Brave New World#4`},
{id:'hogwarts', q:'Name a Hogwarts teacher or headmaster', a:`Dumbledore=Albus Dumbledore#1|Snape=Severus Snape#1|McGonagall=Minerva McGonagall#1|Hagrid=Rubeus Hagrid#2|Lupin=Remus Lupin#2|Umbridge=Dolores Umbridge#2|Lockhart=Gilderoy Lockhart#2|Flitwick=Filius Flitwick#2|Quirrell=Quirinus Quirrell#3|Trelawney=Sybill Trelawney#3|Sprout=Pomona Sprout#3|Slughorn=Horace Slughorn#3|Moody=Mad-Eye Moody=Alastor Moody#3|Madam Hooch=Hooch#4|Binns=Cuthbert Binns#4|Firenze#4|Grubbly-Plank=Wilhelmina Grubbly-Plank#4|Sinistra=Aurora Sinistra#5|Vector=Septima Vector#5|Burbage=Charity Burbage#5|Kettleburn=Silvanus Kettleburn#5|Alecto Carrow#5|Amycus Carrow#5|Dippet=Armando Dippet#5|Phineas Nigellus Black#5|Bathsheda Babbling#5`},
{id:'tarantino', q:'Name a film directed by Quentin Tarantino', a:`Pulp Fiction#1|Kill Bill: Volume 1=Kill Bill Vol. 1=Kill Bill#1|Django Unchained#1|Inglourious Basterds=Inglorious Bastards#1|Reservoir Dogs#2|Once Upon a Time in Hollywood#2|Kill Bill: Volume 2=Kill Bill Vol. 2#3|The Hateful Eight=Hateful 8#4|Jackie Brown#4|Death Proof#5`},
{id:'nolan', q:'Name a film directed by Christopher Nolan', a:`Inception#1|Interstellar#1|The Dark Knight#1|Oppenheimer#1|Memento#2|The Prestige#2|Dunkirk#2|Tenet#4|Batman Begins#2|The Dark Knight Rises#2|Insomnia#4|Following#5`},
{id:'spielberg', q:'Name a film directed by Steven Spielberg', a:`Jaws#1|E.T. the Extra-Terrestrial=ET#1|Jurassic Park#1|Raiders of the Lost Ark#1|Schindler's List#2|Saving Private Ryan#2|Close Encounters of the Third Kind=Close Encounters#2|Indiana Jones and the Last Crusade=The Last Crusade#2|Indiana Jones and the Temple of Doom=Temple of Doom#2|Catch Me If You Can#2|Minority Report#3|War of the Worlds#3|Hook#3|Lincoln#3|The Lost World: Jurassic Park=The Lost World#3|Ready Player One#3|War Horse#3|Bridge of Spies#3|The Terminal#3|West Side Story#3|The Fabelmans#3|Munich#3|A.I. Artificial Intelligence=AI#3|The Color Purple#3|Indiana Jones and the Kingdom of the Crystal Skull=Kingdom of the Crystal Skull#3|The Adventures of Tintin=Tintin#4|The BFG#4|The Post#4|Amistad#4|Empire of the Sun#4|Duel#4|Always#5|1941#5|The Sugarland Express#5`}
];

/* ---------------- GAMES ---------------- */
const MC_MATS = [['Wooden',2],['Stone',2],['Iron',2],['Golden',3],['Diamond',1],['Netherite',2]];
const MC_TOOLS = ['Sword','Pickaxe','Axe','Shovel','Hoe'];
const MC_ARMOR_MATS = [['Leather',3],['Chainmail',3],['Iron',2],['Golden',3],['Diamond',2],['Netherite',3]];
const MC_ARMOR = ['Helmet','Chestplate','Leggings','Boots'];
const MC_DYES = ['White','Orange','Magenta','Light Blue','Yellow','Lime','Pink','Gray','Light Gray','Cyan','Purple','Blue','Brown','Green','Red','Black'];
const MC_GEN = [
  ...MC_MATS.flatMap(([m,t]) => MC_TOOLS.map(x => `${m} ${x}${m==='Wooden'?'=Wood '+x:''}${m==='Golden'?'=Gold '+x:''}#${(m==='Diamond'&&(x==='Sword'||x==='Pickaxe'))?1:(x==='Hoe'?Math.min(5,t+1):t)}`)),
  ...MC_ARMOR_MATS.flatMap(([m,t]) => MC_ARMOR.map(x => `${m} ${x}${m==='Golden'?'=Gold '+x:''}${m==='Chainmail'?'=Chain '+x:''}#${t}`)),
  ...MC_DYES.map(c => `${c} Dye#${['Red','Blue','Black','White','Green','Yellow'].includes(c)?3:4}`)
].join('|');
const DEEP_GAMES = [
{id:'mcitem', plus:'mcblock', q:'Name a Minecraft item (blocks count too)', a:`Diamond#1|Iron Ingot#1|Stick#1|Coal#1|Emerald#2|Gold Ingot#2|Ender Pearl#2|Redstone Dust=Redstone#2|Bow#2|Arrow#2|Bucket#2|Water Bucket#2|Lava Bucket#2|Elytra#2|Trident#2|Shield#2|Totem of Undying#2|Flint and Steel#2|Bread#2|Apple#2|Golden Apple#2|Cake#2|Steak=Cooked Beef#2|Saddle#2|Compass#2|Map#2|Book#2|Netherite Ingot#2|String#2|Bone#2|Gunpowder#2|Rotten Flesh#2|Lapis Lazuli=Lapis#2|Copper Ingot|Netherite Scrap|Charcoal|Feather|Flint|Bone Meal|Leather|Slimeball=Slime Ball|Eye of Ender|Blaze Rod|Blaze Powder|Ghast Tear|Magma Cream|Nether Star|Nether Wart|Glowstone Dust|Nether Quartz=Quartz|Prismarine Shard|Nautilus Shell|Heart of the Sea|Phantom Membrane|Shulker Shell|Amethyst Shard|Raw Iron|Raw Gold|Raw Copper|Iron Nugget|Gold Nugget|Clay Ball|Brick|Nether Brick|Paper|Book and Quill|Written Book|Enchanted Book|Clock|Spyglass|Shears|Fishing Rod|Carrot on a Stick|Lead|Name Tag|Milk Bucket|Bucket of Cod|Bucket of Salmon|Bucket of Axolotl|Bucket of Pufferfish|Bucket of Tropical Fish|Crossbow|Spectral Arrow|Tipped Arrow|Mace|Firework Rocket|Firework Star|Fire Charge|Snowball|Egg|Wind Charge|Breeze Rod|Enchanted Golden Apple=Notch Apple|Cookie|Pumpkin Pie|Melon Slice|Glistering Melon Slice|Carrot|Golden Carrot|Potato|Baked Potato|Beetroot|Beetroot Soup|Wheat|Wheat Seeds=Seeds|Melon Seeds|Pumpkin Seeds|Sweet Berries|Glow Berries|Chorus Fruit|Mushroom Stew|Rabbit Stew|Raw Beef|Raw Porkchop|Cooked Porkchop|Raw Chicken|Cooked Chicken|Raw Mutton|Cooked Mutton|Raw Rabbit|Cooked Rabbit|Raw Cod|Cooked Cod|Raw Salmon|Cooked Salmon|Tropical Fish|Pufferfish|Spider Eye|Fermented Spider Eye|Honey Bottle|Honeycomb|Dried Kelp|Sugar|Sugar Cane|Cocoa Beans|Ink Sac|Potion|Splash Potion|Glass Bottle|Bottle o' Enchanting=Experience Bottle|Minecart|Chest Minecart|Hopper Minecart|TNT Minecart|Boat=Oak Boat|Armor Stand|Item Frame|Painting|Banner|Music Disc|Bundle|Rabbit's Foot|Bowl|Spawn Egg|Turtle Shell=Turtle Helmet|Leather Horse Armor|Iron Horse Armor|Golden Horse Armor|Diamond Horse Armor|Wolf Armor#4|Glow Ink Sac#4|Glow Item Frame#4|Prismarine Crystals#4|Turtle Scute=Scute#4|Armadillo Scute#4|Dragon's Breath#4|Echo Shard#4|Recovery Compass#4|Lingering Potion#4|Popped Chorus Fruit#4|Suspicious Stew#4|Poisonous Potato#4|Furnace Minecart#4|Bamboo Raft#4|Goat Horn#4|Brush#4|Pottery Sherd#4|Smithing Template#4|Netherite Upgrade#4|Warped Fungus on a Stick#4|Powder Snow Bucket#4|Bucket of Tadpole#4|Banner Pattern#4|Heavy Core#4|Trial Key#4|Ominous Trial Key#5|Ominous Bottle#5|Disc Fragment#5|Resin Clump#5|Knowledge Book#5|Debug Stick#5|${MC_GEN}`},
{id:'mcblock', q:'Name a Minecraft block', a:`Dirt#1|Grass Block=Grass#1|Stone#1|Cobblestone#1|Oak Planks=Planks=Wood Planks#1|Crafting Table=Workbench#1|TNT#1|Obsidian#1|Bedrock#1|Furnace#2|Chest#2|Sand#2|Gravel#2|Glass#2|Oak Log=Log=Wood#2|Torch#2|Bed#2|Bookshelf#2|Netherrack#2|Glowstone#2|Diamond Ore#2|Iron Ore#2|Gold Ore#2|Coal Ore#2|Diamond Block=Block of Diamond#2|Ender Chest#2|Enchanting Table#2|Anvil#2|Beacon#2|Hopper#2|Piston#2|Wool#2|Ice#2|Ladder#2|Door=Oak Door#2|Soul Sand|Soul Soil|End Stone|Purpur Block|Sponge|Wet Sponge|Packed Ice|Blue Ice|Snow Block|Clay|Terracotta|Glazed Terracotta|Concrete|Concrete Powder|Carpet|Granite|Diorite|Andesite|Deepslate|Cobbled Deepslate|Tuff|Calcite|Dripstone Block|Amethyst Block|Budding Amethyst|Copper Block=Block of Copper|Oxidized Copper|Iron Block=Block of Iron|Gold Block=Block of Gold|Emerald Block=Block of Emerald|Lapis Lazuli Block=Lapis Block|Redstone Block=Block of Redstone|Coal Block=Block of Coal|Netherite Block=Block of Netherite|Copper Ore|Emerald Ore|Lapis Lazuli Ore=Lapis Ore|Redstone Ore|Nether Gold Ore|Nether Quartz Ore|Ancient Debris|Dropper|Dispenser|Observer|Sticky Piston|Redstone Lamp|Lever|Button|Pressure Plate|Tripwire Hook|Target|Daylight Detector|Note Block|Jukebox|Conduit|Grindstone|Smithing Table|Stonecutter|Loom|Cartography Table|Fletching Table|Composter|Barrel|Smoker|Blast Furnace|Lectern|Bell|Campfire|Soul Campfire|Lantern|Soul Lantern|Redstone Torch|Soul Torch|Chain|Scaffolding|Honey Block|Slime Block|Hay Bale|Melon|Pumpkin|Carved Pumpkin|Jack o'Lantern|Cactus|Bamboo|Kelp|Sea Lantern|Prismarine|Dark Prismarine|Magma Block|Bone Block|Mycelium|Podzol|Coarse Dirt|Rooted Dirt|Mud|Packed Mud|Mud Bricks|Moss Block|Sculk|Sculk Sensor|Sculk Shrieker|Sculk Catalyst|Spawner=Monster Spawner|Brewing Stand|Cauldron|Cobweb|Shroomlight|Crying Obsidian|Respawn Anchor|Lodestone|Blackstone|Gilded Blackstone|Basalt|Smooth Basalt|Nether Bricks|Red Nether Bricks|Quartz Block=Block of Quartz|Stone Bricks|Mossy Stone Bricks|Cracked Stone Bricks|Chiseled Stone Bricks|Bricks|Sandstone|Red Sand|Red Sandstone|Mossy Cobblestone|Cherry Planks|Bamboo Planks|Mangrove Planks|Crimson Planks|Warped Planks|Birch Planks|Spruce Planks|Jungle Planks|Acacia Planks|Dark Oak Planks|Pointed Dripstone|Turtle Egg|Sniffer Egg|Trial Spawner#4|Vault#4|Crafter#4|Copper Bulb#4|Chiseled Bookshelf#4|Decorated Pot#4|Suspicious Sand#4|Suspicious Gravel#4|Ochre Froglight=Froglight#4|Verdant Froglight#4|Pearlescent Froglight#4|Dragon Egg#4|End Portal Frame#4|Infested Stone#4|Pale Oak Planks#4|Pale Moss Block#4|Creaking Heart#4|Resin Block#4|Command Block#5|Structure Block#5|Barrier#5|Jigsaw Block#5|Light Block#5|Petrified Oak Slab#5|Reinforced Deepslate#5|Spore Blossom#4|Sculk Vein#5|Calibrated Sculk Sensor#5`},
{id:'mcmob', q:'Name a Minecraft mob', a:`Creeper#1|Zombie#1|Skeleton#1|Enderman#1|Spider#1|Pig#1|Cow#1|Sheep#1|Chicken#1|Villager#2|Ender Dragon#2|Wither#2|Witch#2|Slime#2|Ghast#2|Blaze#2|Iron Golem#2|Wolf#2|Cat#2|Horse#2|Warden#2|Piglin#2|Axolotl#2|Bee#2|Cave Spider|Magma Cube|Wither Skeleton|Guardian|Elder Guardian|Shulker|Endermite|Silverfish|Phantom|Drowned|Husk|Stray|Pillager|Vindicator|Evoker|Vex|Ravager|Piglin Brute|Zombified Piglin=Zombie Pigman|Hoglin|Zoglin|Strider|Allay|Frog|Tadpole|Goat|Glow Squid|Squid|Dolphin|Turtle|Cod|Salmon|Pufferfish|Tropical Fish|Donkey|Mule|Llama|Trader Llama|Wandering Trader|Snow Golem=Snowman|Ocelot|Parrot|Rabbit|Fox|Panda|Polar Bear|Mooshroom|Bat|Camel|Sniffer|Armadillo|Zombie Villager|Skeleton Horse|Zombie Horse|Bogged#4|Breeze#4|Creaking#4|Happy Ghast#4|Ghastling#4|Copper Golem#4|Chicken Jockey#5|Illusioner#5|Giant#5|Killer Bunny=Killer Rabbit#5|Spider Jockey#5`},
{id:'mcbiome', q:'Name a Minecraft biome', a:`Plains#1|Desert#1|Forest#1|Jungle#1|Ocean#1|Taiga#2|Savanna#2|Swamp#2|Badlands=Mesa#2|Mushroom Fields=Mushroom Island#2|Nether Wastes=Nether#2|The End=End#2|Deep Dark#2|Cherry Grove#2|Snowy Plains=Snowy Tundra=Tundra#2|Beach#2|River#2|Birch Forest|Dark Forest=Roofed Forest|Flower Forest|Sunflower Plains|Ice Spikes|Snowy Taiga|Old Growth Pine Taiga=Mega Taiga|Old Growth Spruce Taiga|Old Growth Birch Forest|Savanna Plateau|Windswept Savanna|Eroded Badlands|Wooded Badlands|Bamboo Jungle|Sparse Jungle|Mangrove Swamp|Snowy Beach|Stony Shore|Frozen River|Deep Ocean|Warm Ocean|Lukewarm Ocean|Cold Ocean|Frozen Ocean|Meadow|Grove|Snowy Slopes|Jagged Peaks|Frozen Peaks|Stony Peaks|Windswept Hills=Extreme Hills|Windswept Gravelly Hills|Windswept Forest|Dripstone Caves|Lush Caves|Soul Sand Valley|Crimson Forest|Warped Forest|Basalt Deltas|Pale Garden#4|Deep Lukewarm Ocean#4|Deep Cold Ocean#4|Deep Frozen Ocean#4|End Highlands#4|End Midlands#5|Small End Islands#5|End Barrens#5|The Void=Void#5`},
{id:'mcench', q:'Name a Minecraft enchantment', a:`Sharpness#1|Efficiency#1|Unbreaking#1|Fortune#1|Mending#1|Silk Touch#1|Protection#1|Looting#2|Fire Aspect#2|Infinity#2|Power#2|Feather Falling#2|Knockback#2|Thorns#2|Smite#2|Flame#2|Riptide#3|Loyalty#3|Channeling#3|Respiration#3|Aqua Affinity#3|Depth Strider#3|Frost Walker#3|Bane of Arthropods#3|Punch#3|Fire Protection#3|Blast Protection#3|Projectile Protection#3|Sweeping Edge#3|Luck of the Sea#3|Lure#3|Multishot#3|Piercing#3|Quick Charge#3|Impaling#4|Soul Speed#4|Swift Sneak#4|Curse of Binding#4|Curse of Vanishing#4|Density#4|Breach#4|Wind Burst#5`},
{id:'mcstruct', q:'Name a Minecraft structure', a:`Village#1|Stronghold#1|Nether Fortress=Fortress#2|Mineshaft=Abandoned Mineshaft#2|Ocean Monument#2|Woodland Mansion=Mansion#2|Ancient City#2|End City#2|Desert Pyramid=Desert Temple#2|Jungle Pyramid=Jungle Temple#3|Witch Hut=Swamp Hut#3|Igloo#3|Pillager Outpost#3|Dungeon=Monster Room#3|Bastion Remnant=Bastion#3|Ruined Portal#3|Shipwreck#3|Ocean Ruins#3|Buried Treasure#3|Trial Chambers#3|End Ship#4|Trail Ruins#4|Desert Well#4|Fossil#4|Amethyst Geode=Geode#4|Nether Fossil#5|End Gateway#5|Obsidian Pillar=End Spike#5`},
{id:'starter', q:'Name a starter Pokémon from a main-series game', a:`Pikachu#1|Charmander#1|Bulbasaur#1|Squirtle#1|Eevee#3|Chikorita#3|Cyndaquil#3|Totodile#3|Treecko#3|Torchic#3|Mudkip#2|Turtwig#3|Chimchar#3|Piplup#3|Snivy#4|Tepig#4|Oshawott#4|Chespin#4|Fennekin#4|Froakie#3|Rowlet#3|Litten#3|Popplio#4|Grookey#4|Scorbunny#4|Sobble#4|Sprigatito#4|Fuecoco#4|Quaxly#4`},
{id:'ptype', q:'Name a Pokémon type', a:`Fire#1|Water#1|Grass#1|Electric#1|Psychic#2|Normal#2|Flying#2|Ice#2|Dragon#2|Ghost#2|Fighting#3|Poison#3|Ground#3|Rock#3|Bug#3|Dark#3|Steel#4|Fairy#4|Stellar#5`},
{id:'nintendo', q:'Name a piece of Nintendo hardware', a:`Nintendo Switch=Switch#1|Game Boy#1|Wii#1|Nintendo 64=N64#1|Nintendo DS=DS#2|Nintendo Entertainment System=NES=Famicom#2|Super Nintendo=SNES=Super Nintendo Entertainment System=Super Famicom#2|GameCube=Nintendo GameCube#2|Wii U#2|Nintendo 3DS=3DS#2|Game Boy Advance=GBA#2|Game Boy Color=GBC#2|Nintendo Switch 2=Switch 2#2|Switch Lite=Nintendo Switch Lite#3|Switch OLED#3|Virtual Boy#3|DS Lite#3|Nintendo DSi=DSi#3|Nintendo 2DS=2DS#3|Game Boy Advance SP=GBA SP#3|Game & Watch=Game and Watch#3|New Nintendo 3DS#4|Game Boy Pocket#4|Game Boy Micro#4|Wii Mini#4|Color TV-Game#5|Famicom Disk System#5|64DD#5|Satellaview#5|Pokémon Mini#5|Game Boy Light#5`},
{id:'sonyms', q:'Name a PlayStation or Xbox console', a:`PlayStation=PS1=PSX=PSone#1|PlayStation 2=PS2#1|PlayStation 3=PS3#1|PlayStation 4=PS4#1|PlayStation 5=PS5#1|Xbox#1|Xbox 360#1|Xbox One#2|Xbox Series X#2|Xbox Series S#3|PlayStation Portable=PSP#2|PlayStation Vita=PS Vita=Vita#3|PS4 Pro#3|PS5 Pro#3|Xbox One S#4|Xbox One X#4|PlayStation Portal#4|PocketStation#5|PSX DVR#5`},
{id:'zelda', q:'Name a game in The Legend of Zelda series', a:`Breath of the Wild#1|Ocarina of Time#1|Tears of the Kingdom#1|Twilight Princess#2|The Wind Waker=Wind Waker#2|Majora's Mask#2|A Link to the Past#2|Skyward Sword#2|Link's Awakening#2|The Legend of Zelda#2|Zelda II: The Adventure of Link=The Adventure of Link=Zelda II#3|The Minish Cap=Minish Cap#3|Phantom Hourglass#3|Spirit Tracks#3|A Link Between Worlds#3|Echoes of Wisdom#3|Oracle of Seasons#4|Oracle of Ages#4|Four Swords#4|Four Swords Adventures#4|Tri Force Heroes#4|Hyrule Warriors#4|Hyrule Warriors: Age of Calamity=Age of Calamity#4|Cadence of Hyrule#5|Link's Crossbow Training#5`},
{id:'chess', q:'Name a chess opening', strip:['opening','game','defence','system','variation'], a:`Sicilian Defence#1|Queen's Gambit#1|Ruy Lopez=Spanish#2|Italian Game=Giuoco Piano#2|French Defence#2|Caro-Kann Defence#2|King's Gambit#2|London System#2|English Opening#3|King's Indian Defence#3|Scandinavian Defence=Center Counter#3|Fried Liver Attack#3|Nimzo-Indian Defence#4|Grünfeld Defence=Grunfeld#4|Slav Defence#3|Dutch Defence#4|Pirc Defence#4|Alekhine's Defence#4|Catalan Opening#4|Réti Opening=Reti#4|Benoni Defence#4|Benko Gambit#4|Evans Gambit#4|Scotch Game#4|Petrov's Defence=Russian Game=Petroff#4|Four Knights Game#4|Vienna Game#4|Two Knights Defence#4|Najdorf Variation=Najdorf#4|Dragon Variation#4|Berlin Defence#4|Queen's Indian Defence#4|King's Indian Attack#4|Smith-Morra Gambit#4|Danish Gambit#4|Bird's Opening#5|Bogo-Indian Defence#5|Modern Defence#5|Philidor Defence#5|Budapest Gambit#5|Colle System#5|Trompowsky Attack#5|Marshall Attack#5|Stonewall Attack#5|Englund Gambit#5|Grob's Attack=Grob#5|Larsen's Opening=Nimzo-Larsen Attack#5|Polish Opening=Sokolsky#5|Owen's Defence#5|Latvian Gambit#5|Elephant Gambit#5|Albin Countergambit#5|Halloween Gambit#5|Jobava London#5|Tarrasch Defence#5|Semi-Slav Defence#5|Hungarian Defence#5|Center Game#5|Ponziani Opening#5`},
{id:'board', q:'Name a board game', a:`Monopoly#1|Chess#1|Scrabble#1|Checkers=Draughts#1|Clue=Cluedo#1|Risk#2|Battleship#2|Connect Four=Connect 4#2|Candy Land#2|Chutes and Ladders=Snakes and Ladders#2|Sorry!#2|The Game of Life=Life#2|Operation#2|Guess Who?#2|Trivial Pursuit#2|Pictionary#2|Catan=Settlers of Catan#2|Backgammon#2|Ticket to Ride#3|Carcassonne#3|Pandemic#3|Codenames#3|Go#3|Mahjong#3|Mancala#3|Othello=Reversi#3|Stratego#3|Trouble#3|Parcheesi=Ludo#3|Mouse Trap#3|Boggle#3|Scattergories#3|Taboo#3|Chinese Checkers#3|Hungry Hungry Hippos#3|Cranium#3|Balderdash#4|Dominion#4|Azul#4|Splendor#4|Wingspan#4|7 Wonders#4|Agricola#4|Puerto Rico#4|Terraforming Mars#4|Gloomhaven#4|Diplomacy#4|Axis & Allies#4|Kingdomino#4|King of Tokyo#4|Dixit#4|Mastermind#4|Blokus#4|Shogi#4|Xiangqi=Chinese Chess#4|Nine Men's Morris#4|Rummikub#4|Sequence#4|Qwirkle#4|Twilight Imperium#5|Hex#5|Pente#5|Quarto#5|Santorini#5|Patchwork#5|Root#5|Scythe#5|Brass#5|Everdell#5|Cascadia#5|Hive#5|Onitama#5|Tsuro#5`},
{id:'mario', q:'Name a character from the Super Mario games', a:`Mario#1|Luigi#1|Princess Peach=Peach#1|Bowser#1|Yoshi#1|Toad#1|Wario#2|Waluigi#2|Princess Daisy=Daisy#2|Donkey Kong#2|Bowser Jr.#2|Rosalina#2|Goomba#2|Koopa Troopa#2|Boo#2|Toadette#3|Diddy Kong#3|King Boo#3|Shy Guy#3|Lakitu#3|Birdo#3|Kamek#3|Dry Bones#3|Hammer Bro#3|Piranha Plant#3|Chain Chomp#3|Bullet Bill#3|Bob-omb#3|Blooper#3|Cheep Cheep#3|Thwomp#3|Wiggler#3|Petey Piranha#3|Cappy#3|Pauline#3|Captain Toad#3|Larry Koopa=Larry#4|Morton Koopa=Morton#4|Wendy O. Koopa=Wendy#4|Iggy Koopa=Iggy#4|Roy Koopa=Roy#4|Lemmy Koopa=Lemmy#4|Ludwig von Koopa=Ludwig#4|Whomp#4|Pokey#4|Monty Mole#4|Buzzy Beetle#4|Spiny#4|Toadsworth#4|Nabbit#4|Funky Kong#4|Cranky Kong#4|Dixie Kong#4|Baby Mario#4|Baby Luigi#4|Baby Peach#4|Metal Mario#4|Paratroopa#4|Magikoopa#4|Professor E. Gadd=E. Gadd#4|King Bob-omb#4|Boom Boom#4|Pom Pom#5|Pink Gold Peach#5|Fawful#5|Lubba#5|Tatanga#5|Geno#5|Mallow#5|Count Bleck#5|Chargin' Chuck#5|Mechakoopa#5|Fire Bro#5|Goombario#5`},
{id:'nfranchise', q:'Name a Nintendo-owned game series', a:`Super Mario=Mario#1|The Legend of Zelda=Zelda#1|Pokémon=Pokemon#1|Mario Kart#1|Super Smash Bros.=Smash Bros#2|Animal Crossing#2|Kirby#2|Metroid#2|Donkey Kong#2|Splatoon#2|Fire Emblem#3|Star Fox#3|Pikmin#3|Xenoblade Chronicles=Xenoblade#3|Mario Party#3|Luigi's Mansion#3|Paper Mario#3|Wii Sports#3|Yoshi#3|F-Zero#3|EarthBound=Mother#4|Kid Icarus#4|Punch-Out!!=Punch-Out#4|WarioWare#4|Brain Age#4|Nintendogs#4|Advance Wars#4|Mario Golf#4|Mario Tennis#4|Dr. Mario#4|Ice Climber#4|Excitebike#4|Duck Hunt#4|Arms#4|Ring Fit Adventure#4|Tomodachi Life#4|Rhythm Heaven#5|Custom Robo#5|Wave Race#5|1080° Snowboarding=1080#5|Pilotwings#5|Chibi-Robo#5|Picross#5|Balloon Fight#5|StarTropics#5|Golden Sun#5|Wario Land#5`},
{id:'arcade', q:'Name a classic arcade game', a:`Pac-Man#1|Space Invaders#1|Donkey Kong#1|Galaga#1|Pong#1|Asteroids#2|Street Fighter II=Street Fighter#2|Mortal Kombat#2|Frogger#2|Centipede#2|Ms. Pac-Man#2|Tetris#3|Dig Dug#3|Q*bert#3|Defender#3|Missile Command#3|Galaxian#3|Tempest#3|Joust#3|Breakout#3|Double Dragon#3|Gauntlet#3|Paperboy#3|Rampage#3|Bubble Bobble#3|Arkanoid#3|Pole Position#3|Out Run#3|Spy Hunter#3|NBA Jam#3|Time Crisis#3|Dance Dance Revolution#3|Teenage Mutant Ninja Turtles#3|Metal Slug#3|Golden Axe#3|Final Fight#3|Tekken#3|Burger Time=BurgerTime#4|Robotron: 2084=Robotron#4|Berzerk#4|Tron#4|Dragon's Lair#4|Battlezone#4|Xevious#4|Mr. Do!#4|1942#4|Ghosts 'n Goblins#4|Contra#4|Marble Madness#4|Kung-Fu Master#4|Bomb Jack#4|Elevator Action#4|Zaxxon#4|Tapper#4|Track & Field#4|R-Type#4|Gradius#4|Altered Beast#4|Shinobi#4|Puzzle Bobble=Bust-a-Move#4|Daytona USA#4|Virtua Fighter#4|The House of the Dead#4|Cruis'n USA#4|Hydro Thunder#4|The Simpsons#4|Pengo#5|Rally-X#5|Moon Patrol#5|Scramble#5|Sinistar#5|Crazy Climber#5|Bosconian#5|Mappy#5|Gyruss#5|Commando#5|Rygar#5|Bad Dudes#5|Snow Bros.#5|Point Blank#5`}
];

const DEEP_SETS = {
  'deep-kitchen': {name:'Deep Cut: Kitchen', pool:DEEP_KITCHEN},
  'deep-screen': {name:'Deep Cut: Screen', pool:DEEP_SCREEN},
  'deep-games': {name:'Deep Cut: Games', pool:DEEP_GAMES}
};

css(`
.deep{display:grid;grid-template-columns:minmax(0,1fr);gap:14px}
.deep-card{background:var(--surface);border:1px solid var(--line);border-radius:var(--r);padding:18px;display:grid;gap:12px}
.deep-top{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}
.deep-steps{display:flex;gap:5px}
.deep-steps i{width:26px;height:8px;border-radius:4px;background:var(--line);display:block}
.deep-steps i.on{background:var(--gc)}
.deep-steps i.done{background:color-mix(in srgb,var(--gc) 45%,var(--line))}
.deep-pts{font:700 18px var(--f-mono);font-variant-numeric:tabular-nums}
.deep-q{font:800 clamp(24px,5.5vw,32px)/1.12 var(--f-display);letter-spacing:-.015em;margin:0;text-wrap:balance}
.deep-bar{height:10px;border-radius:5px;background:var(--sunk);overflow:hidden}
.deep-bar i{display:block;height:100%;background:var(--gc);transform-origin:left center;width:100%}
.deep-bar.low i{background:var(--bad)}
.deep-secs{font:700 14px var(--f-mono);color:var(--muted);font-variant-numeric:tabular-nums}
.deep-form{display:flex;gap:8px}
.deep-form input{flex:1;min-width:0;height:50px;border-radius:10px;border:1.5px solid var(--line);background:var(--bg);padding:0 14px;font:700 18px var(--f-body);color:var(--ink)}
.deep-form input:focus{outline:none;border-color:var(--gc)}
.deep-tier{display:inline-flex;align-items:center;gap:6px;font:700 13px/1 var(--f-body);letter-spacing:.04em;text-transform:uppercase;padding:7px 10px;border-radius:999px;background:var(--sunk);color:var(--ink)}
.deep-tier.t1{background:color-mix(in srgb,var(--gc) 10%,var(--surface))}
.deep-tier.t2{background:color-mix(in srgb,var(--gc) 25%,var(--surface))}
.deep-tier.t3{background:color-mix(in srgb,var(--gc) 45%,var(--surface))}
.deep-tier.t4{background:color-mix(in srgb,var(--gc) 70%,var(--surface))}
.deep-tier.t5{background:var(--gc);color:var(--on-gc)}
.deep-tier.t0{background:var(--sunk);color:var(--muted)}
.deep-fb{display:grid;gap:8px;justify-items:start}
.deep-ans{font:700 22px var(--f-body);overflow-wrap:anywhere}
.deep-ans.miss{color:var(--muted);text-decoration:line-through}
.deep-big{font:800 40px/1 var(--f-mono);font-variant-numeric:tabular-nums}
.deep-src{font-size:13px;color:var(--muted)}
.deep-ladder{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;margin:0;padding:0;list-style:none}
.deep-ladder li{display:grid;gap:4px;text-align:center;font-size:12px;color:var(--muted);min-width:0}
.deep-ladder .deep-tier{white-space:normal;padding-inline:4px;font-size:11px;line-height:1.15}
.deep-ladder b{font:700 15px var(--f-mono);color:var(--ink)}
.deep-review{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.deep-review li{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:12px 14px;display:grid;gap:6px}
.deep-review .rq{font-weight:700}
.deep-review .rr{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.deep-review .rp{margin-left:auto;font:700 15px var(--f-mono)}
.deep-review .ex{font-size:14px;color:var(--muted)}
.deep-review .ex b{color:var(--ink);font-weight:700}
@media (max-width:420px){.deep-form{flex-direction:column}.deep-form input{flex:none;width:100%}.deep-form .btn{width:100%}.deep-ladder li{font-size:11px}}
`);

function deepMount(gid){
  return function(el, api){
    const G = DEEP_SETS[gid];
    const prompts = shuffle(G.pool.slice(), api.rng('prompts')).slice(0, 5);
    let st = api.load(() => ({phase:'intro', i:0, deadline:0, ans:[], started:false}));
    if (!Array.isArray(st.ans)) st.ans = [];
    const fin = () => !!api.existing();
    let tick = null;
    const save = () => api.save(st);
    const total = () => st.ans.reduce((a,x) => a + (x ? x.pts : 0), 0);
    const stopTick = () => { if (tick){ clearInterval(tick); tick = null; } };
    function examples(p){
      const {list} = deepIndex(p, G.pool);
      let pool = list.filter(e => e.tier === 5 && !/^zzz/.test(e.name));
      if (pool.length < 3) pool = pool.concat(list.filter(e => e.tier === 4));
      return shuffle(pool.slice(), api.rng('ex:' + p.id)).slice(0, 3).map(e => e.name);
    }
    function srcNote(rec){
      if (!rec || !rec.name) return '';
      return rec.src === 'crowd' ? `Rarity from ${plural(rec.players, 'player')} today` : 'Rarity from our list until more people play';
    }
    function lock(raw, timedOut){
      if (st.phase !== 'ask') return;
      const p = prompts[st.i];
      const rec = {raw: String(raw || '').slice(0, 60), name:null, tier:0, pts:0, src:'', players:0, timeout:!!timedOut, skip:!raw && !timedOut};
      if (raw && !timedOut){
        const m = deepMatch(p, G.pool, raw);
        if (m && !/^zzz/.test(m.name)){ const t = deepTier(api.id, p.id, m); rec.name = m.name; rec.tier = t.tier; rec.pts = DEEP_TIERS[t.tier].p; rec.src = t.src; rec.players = t.players; }
      }
      st.ans[st.i] = rec; st.phase = 'fb'; st.started = true;
      stopTick(); save(); render();
    }
    function begin(){ st.phase = 'ask'; st.i = 0; st.deadline = Date.now() + DEEP_SECS*1000; st.started = true; api.start(); save(); render(); }
    function next(){
      if (st.i >= prompts.length - 1){ done(); return; }
      st.i++; st.phase = 'ask'; st.deadline = Date.now() + DEEP_SECS*1000; save(); render();
    }
    function done(){
      st.phase = 'done'; save();
      if (fin()){ render(); return; }
      const t = total();
      const list = st.ans.map((x, i) => x && x.name ? `${prompts[i].id}:${x.name}` : null).filter(Boolean);
      try { postAnswers(api.id, list); } catch(e){}
      const sq = prompts.map((_, i) => DEEP_TIERS[st.ans[i] ? st.ans[i].tier : 0].sq).join('');
      const deep = st.ans.filter(x => x && x.tier === 5).length;
      const title = t >= 400 ? 'Crate digger' : t >= 250 ? 'Off the beaten path' : t >= 150 ? 'Good instincts' : t > 0 ? 'Played it safe' : 'Nothing landed';
      api.finish({score:t, won: t >= 150, title,
        detail: `${t} of 500 points from ${plural(st.ans.filter(x => x && x.name).length, 'accepted answer')}${deep ? `, including ${plural(deep, 'deep cut')}` : ''}. 150 keeps your streak.`,
        summary: `${t} pts`,
        share: `Daybook ${G.name} No. ${DAY_NO}  ${t}/500\n${sq}`});
      render();
    }
    function startTick(){
      stopTick();
      const paint = () => {
        const left = Math.max(0, st.deadline - Date.now());
        const bar = el.querySelector('#deep-bar'), secs = el.querySelector('#deep-secs');
        if (bar){ bar.firstElementChild.style.transform = `scaleX(${left/(DEEP_SECS*1000)})`; bar.classList.toggle('low', left < 6000); }
        if (secs) secs.textContent = Math.ceil(left/1000) + 's';
        if (left <= 0) lock('', true);
      };
      paint(); tick = setInterval(paint, 100);
    }
    function steps(){
      return `<div class="deep-steps" aria-label="Prompt ${st.i+1} of ${prompts.length}">${prompts.map((_, i) => `<i class="${i === st.i && st.phase !== 'done' ? 'on' : st.ans[i] ? 'done' : ''}"></i>`).join('')}</div>`;
    }
    function badge(rec){
      if (!rec) return `<span class="deep-tier t0">No answer</span>`;
      if (rec.name) return `<span class="deep-tier t${rec.tier}">${DEEP_TIERS[rec.tier].n}</span>`;
      return `<span class="deep-tier t0">${rec.timeout ? 'Time’s up' : rec.skip ? 'Skipped' : 'Not on our list'}</span>`;
    }
    function review(){
      return `<ol class="deep-review">${prompts.map((p, i) => { const rec = st.ans[i];
        return `<li><span class="rq">${esc(p.q)}</span>
          <span class="rr">${rec && rec.raw ? `<span class="${rec.name ? '' : 'deep-ans miss'}" style="font-weight:700">${esc(rec.name || rec.raw)}</span>` : ''}${badge(rec)}<span class="rp">${rec ? rec.pts : 0}</span></span>
          <span class="ex">Deep cuts you could have tried: <b>${examples(p).map(esc).join('</b>, <b>')}</b></span></li>`; }).join('')}</ol>`;
    }
    function render(){
      stopTick();
      if (st.phase === 'intro'){
        el.innerHTML = `<div class="deep"><div class="deep-card">
          <span class="label">Today’s round</span>
          <p class="deep-q">Five prompts. Twenty-five seconds each. The rarer the answer, the more it’s worth.</p>
          <ul class="deep-ladder">${DEEP_TIERS.slice(1).map((t, i) => `<li><span class="deep-tier t${i+1}" style="justify-content:center">${t.n}</span><b>${t.p}</b></li>`).join('')}</ul>
          <p class="deep-src">Any correct answer scores. Once 8 or more people have played today, rarity comes from what everyone answered.</p>
          <div class="row"><button class="btn primary" id="deep-go">Start round</button></div>
        </div></div>`;
        el.querySelector('#deep-go').onclick = begin;
        return;
      }
      if (st.phase === 'ask'){
        const p = prompts[st.i];
        el.innerHTML = `<div class="deep"><div class="deep-card">
          <div class="deep-top">${steps()}<span class="deep-pts">${total()} pts</span></div>
          <p class="deep-q">${esc(p.q)}</p>
          <div class="deep-top"><div class="deep-bar" id="deep-bar" style="flex:1"><i></i></div><span class="deep-secs" id="deep-secs">${DEEP_SECS}s</span></div>
          <form class="deep-form" id="deep-form" autocomplete="off">
            <input id="deep-in" name="deep-in" maxlength="60" placeholder="Your answer" aria-label="Your answer" autocapitalize="words" spellcheck="false" enterkeyhint="done">
            <button class="btn primary" type="submit">Submit</button>
          </form>
          <div class="row"><button class="btn" id="deep-skip" type="button">Skip</button></div>
        </div></div>`;
        const input = el.querySelector('#deep-in');
        el.querySelector('#deep-form').onsubmit = e => { e.preventDefault(); const v = input.value.trim(); if (v) lock(v, false); else input.focus(); };
        el.querySelector('#deep-skip').onclick = () => lock('', false);
        input.focus({preventScroll:true});
        if (Date.now() >= st.deadline) { lock('', true); return; }
        startTick();
        return;
      }
      if (st.phase === 'fb'){
        const p = prompts[st.i], rec = st.ans[st.i];
        el.innerHTML = `<div class="deep"><div class="deep-card">
          <div class="deep-top">${steps()}<span class="deep-pts">${total()} pts</span></div>
          <span class="label">${esc(p.q)}</span>
          <div class="deep-fb">
            ${rec && rec.raw ? `<span class="deep-ans ${rec.name ? '' : 'miss'}">${esc(rec.name || rec.raw)}</span>` : ''}
            ${badge(rec)}
            <span class="deep-big">+${rec ? rec.pts : 0}</span>
            ${rec && rec.name ? `<span class="deep-src">${esc(srcNote(rec))}</span>` : rec && rec.raw ? `<span class="deep-src">That answer isn’t on our list for this prompt.</span>` : ''}
          </div>
          <div class="row"><button class="btn primary" id="deep-next">${st.i >= prompts.length - 1 ? 'See results' : 'Next prompt'}</button></div>
        </div></div>`;
        const b = el.querySelector('#deep-next'); b.onclick = next; b.focus({preventScroll:true});
        return;
      }
      // done
      el.innerHTML = `<div class="deep"><div class="deep-card">
          <div class="deep-top">${steps()}<span class="deep-pts">${total()} / 500</span></div>
          ${review()}
        </div></div>`;
    }
    render();
    const prev = api.existing();
    if (prev){ if (st.phase !== 'done'){ st.phase = 'done'; } render(); api.show(prev); }
    else if (st.phase === 'done') done();
    return () => { stopTick(); };
  };
}

const DEEP_HOW = ['Five prompts, 25 seconds each. Type one answer per prompt and press Enter.', 'Any correct answer scores, and rarer answers score more: 10 for the obvious, up to 100 for a deep cut.', 'Once 8 or more people have played today, rarity comes from what everyone answered. Until then it comes from our list.', 'Score 150 or more to keep your streak.'];
register({id:'deep-kitchen', name:'Deep Cut: Kitchen', cat:'niche', mins:3, mount:deepMount('deep-kitchen'),
  blurb:'Name a cheese, a pasta shape, a cocktail. Obvious answers score 10. Deep cuts score 100.', how:DEEP_HOW,
  art:'<svg viewBox="0 0 120 80" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M14 40h56a28 28 0 0 1-56 0z"/><path d="M84 12l-18 30"/><path d="M90 14c6 4 6 14-2 20"/></g><g fill="currentColor"><rect x="80" y="54" width="8" height="18" rx="2" fill-opacity=".25"/><rect x="92" y="46" width="8" height="26" rx="2" fill-opacity=".5"/><rect x="104" y="34" width="8" height="38" rx="2"/></g></svg>'});
register({id:'deep-screen', name:'Deep Cut: Screen', cat:'niche', mins:3, mount:deepMount('deep-screen'),
  blurb:'Name a Pixar film, a Bond movie, a Hitchcock thriller. The rarer your pick, the bigger the score.', how:DEEP_HOW,
  art:'<svg viewBox="0 0 120 80" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="3"><rect x="8" y="22" width="64" height="44" rx="4"/><path d="M8 22l10-14h54l-10 14"/><path d="M28 8l-10 14M48 8l-10 14"/></g><g fill="currentColor"><rect x="80" y="54" width="8" height="18" rx="2" fill-opacity=".25"/><rect x="92" y="46" width="8" height="26" rx="2" fill-opacity=".5"/><rect x="104" y="34" width="8" height="38" rx="2"/></g></svg>'});
register({id:'deep-games', name:'Deep Cut: Games', cat:'niche', mins:3, mount:deepMount('deep-games'),
  blurb:'Minecraft items, Zelda titles, chess openings. Skip the obvious answer and dig deeper.', how:[...DEEP_HOW.slice(0,3), 'Minecraft prompts are fan-made, not affiliated with Mojang or Microsoft. Score 150 or more to keep your streak.'],
  art:'<svg viewBox="0 0 120 80" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="3"><path d="M40 10l26 13v28L40 64 14 51V23z"/><path d="M14 23l26 13 26-13M40 36v28"/></g><path d="M40 36L14 23 40 10l26 13z" fill="currentColor" fill-opacity=".3"/><g fill="currentColor"><rect x="80" y="54" width="8" height="18" rx="2" fill-opacity=".25"/><rect x="92" y="46" width="8" height="26" rx="2" fill-opacity=".5"/><rect x="104" y="34" width="8" height="38" rx="2"/></g></svg>'});
