/* Niche: Pantry (dish from ingredients), Credits (film from clues), Cartridge (order video games by year) */

/* ---------- data: dishes. [name, [aliases], [6 clues from least to most telling, last is where it's from]] ---------- */
const PANTRY_DISHES = [
  ['Spaghetti carbonara',['carbonara','spaghetti alla carbonara','pasta carbonara'],['Black pepper','Pecorino Romano','Egg yolks','Guanciale','Spaghetti','Italy (Rome)']],
  ['Pad thai',['phad thai'],['Tamarind','Fish sauce','Bean sprouts','Crushed peanuts','Stir-fried rice noodles','Thailand']],
  ['Guacamole',[],['Lime juice','Coriander leaves','Onion','Green chilli','Mashed avocado','Mexico']],
  ['Paella',['paella valenciana'],['Saffron','Green beans','Rosemary','Rabbit and chicken','Short-grain rice in a wide pan','Spain (Valencia)']],
  ['Ratatouille',[],['Thyme','Olive oil','Bell pepper','Courgette','Aubergine','France (Provence)']],
  ['Moussaka',[],['Cinnamon','Nutmeg','Béchamel topping','Minced lamb','Layered aubergine','Greece']],
  ['Shakshuka',['shakshouka'],['Cumin','Paprika','Onion','Tomato sauce','Eggs poached in the sauce','North Africa']],
  ['Pho',['pho bo','phở'],['Star anise','Charred ginger','Beef bone broth','Thin slices of raw beef','Flat rice noodles','Vietnam']],
  ['Tonkotsu ramen',['ramen','tonkotsu'],['Garlic','Spring onion','Chashu pork','Soft-boiled marinated egg','Creamy pork-bone broth with wheat noodles','Japan (Fukuoka)']],
  ['Risotto alla milanese',['risotto milanese','saffron risotto'],['Bone marrow','Butter','Parmesan','Saffron','Arborio or carnaroli rice','Italy (Milan)']],
  ['Pesto alla genovese',['pesto','basil pesto','pesto genovese'],['Garlic','Olive oil','Pecorino and Parmesan','Pine nuts','Fresh basil','Italy (Genoa)']],
  ['Hummus',['houmous','hummus bi tahini'],['Garlic','Lemon juice','Olive oil','Tahini','Blended chickpeas','The Levant']],
  ['Falafel',[],['Cumin','Parsley','Onion','Deep-fried balls','Ground chickpeas or fava beans','Middle East']],
  ['Tabbouleh',['tabouleh','tabouli'],['Lemon juice','Mint','Tomato','Bulgur wheat','A big pile of chopped parsley','Lebanon']],
  ['Biryani',['biriyani'],['Saffron','Fried onions','Yoghurt-marinated meat','Whole spices','Layered basmati rice','India']],
  ['Butter chicken',['murgh makhani','chicken makhani'],['Dried fenugreek leaves','Garam masala','Cream','Tomato','Tandoori chicken','India (Delhi)']],
  ['Palak paneer',['saag paneer'],['Ginger','Garlic','Garam masala','Paneer cheese','Spinach purée','India']],
  ['Nigiri sushi',['nigiri','sushi'],['Rice vinegar','Wasabi','Soy sauce','A slice of raw fish','Hand-pressed rice','Japan']],
  ['Tempura',[],['Ice-cold water','Light flour batter','Tentsuyu dipping sauce','Prawns','Deep-fried vegetables','Japan']],
  ['Okonomiyaki',[],['Dashi','Shredded cabbage','Pork belly','Mayonnaise','Sweet brown sauce on a griddled pancake','Japan (Osaka)']],
  ['Bibimbap',[],['Sesame oil','Gochujang','Fried egg','Seasoned vegetables','Rice in a hot stone bowl','Korea']],
  ['Kimchi',[],['Fish sauce','Garlic','Gochugaru chilli flakes','Napa cabbage','Fermented for days','Korea']],
  ['Peking duck',['beijing duck','roast duck'],['Maltose glaze','Hoisin sauce','Spring onion','Cucumber batons','Thin pancakes with crisp-skinned duck','China (Beijing)']],
  ['Mapo tofu',[],['Sichuan peppercorns','Doubanjiang bean paste','Minced pork','Chilli oil','Soft tofu','China (Sichuan)']],
  ['Kung pao chicken',['gong bao chicken','kung po chicken'],['Dried red chillies','Sichuan peppercorns','Spring onion','Peanuts','Diced chicken','China (Sichuan)']],
  ['Har gow',['shrimp dumplings','har gau'],['Bamboo shoots','Wheat starch','Translucent pleated wrapper','Prawns','Steamed in a bamboo basket','China (Guangdong)']],
  ['Jiaozi',['chinese dumplings','dumplings'],['Black vinegar dip','Ginger','Napa cabbage','Pork filling','Pleated wheat wrappers','Northern China']],
  ['Fish and chips',['fish n chips','fish & chips'],['Malt vinegar','Mushy peas','Beer batter','Cod or haddock','Thick-cut chips','United Kingdom']],
  ['Shepherd’s pie',['shepherds pie','cottage pie'],['Worcestershire sauce','Peas','Carrots','Minced lamb','Mashed potato topping','United Kingdom']],
  ['Beef Wellington',['wellington'],['Prosciutto','English mustard','Mushroom duxelles','Puff pastry','Whole beef fillet','United Kingdom']],
  ['Haggis',[],['Black pepper','Oatmeal','Suet','Onion','Sheep’s heart, liver and lungs','Scotland']],
  ['Irish stew',[],['Thyme','Carrots','Onions','Potatoes','Lamb or mutton','Ireland']],
  ['Coq au vin',[],['Lardons','Mushrooms','Pearl onions','Red wine','Chicken on the bone','France (Burgundy)']],
  ['Boeuf bourguignon',['beef bourguignon','bourguignon'],['Carrots','Mushrooms','Lardons','Burgundy red wine','Slow-braised beef','France']],
  ['Bouillabaisse',[],['Fennel','Orange zest','Saffron','Rouille on toast','Several kinds of Mediterranean fish','France (Marseille)']],
  ['Quiche Lorraine',['quiche'],['Nutmeg','Cream','Eggs','Bacon lardons','Shortcrust pastry case','France']],
  ['Croque monsieur',['croque-monsieur'],['Butter','Béchamel','Gruyère','Ham','Toasted bread','France']],
  ['Crêpes Suzette',['crepes suzette','crepe suzette'],['Sugar','Butter','Orange zest','Orange liqueur set alight','Thin pancakes','France']],
  ['Wiener schnitzel',['schnitzel','weiner schnitzel'],['Lemon wedge','Flour','Beaten egg','Breadcrumbs','Pounded-thin veal cutlet','Austria']],
  ['Goulash',['gulyas','gulyás'],['Caraway','Onions','Potatoes','Beef','Plenty of sweet paprika','Hungary']],
  ['Pierogi',['pierogies','perogies'],['Sour cream','Fried onion','Potato','Twaróg cheese','Boiled half-moon dumplings','Poland']],
  ['Borscht',['borshch','borsch'],['Dill','Sour cream','Cabbage','Potatoes','Beetroot','Ukraine']],
  ['Beef stroganoff',['stroganoff'],['Mustard','Onion','Mushrooms','Sour cream','Strips of beef','Russia']],
  ['Cheese fondue',['fondue'],['Kirsch','Garlic','White wine','Bread cubes on forks','Melted Gruyère in a shared pot','Switzerland']],
  ['Swedish meatballs',['kottbullar','köttbullar'],['Allspice','Lingonberry jam','Cream gravy','Minced beef and pork','Small round meatballs','Sweden']],
  ['Gazpacho',[],['Sherry vinegar','Olive oil','Bread','Cucumber','Cold blended tomatoes','Spain (Andalusia)']],
  ['Tortilla española',['spanish omelette','tortilla de patatas','spanish tortilla'],['Salt','Olive oil','Onion','Eggs','Thin-sliced potatoes','Spain']],
  ['Pastel de nata',['pasteis de nata','portuguese custard tart','custard tart'],['Cinnamon','Lemon zest','Egg yolks','Custard','Puff pastry cup','Portugal']],
  ['Feijoada',[],['Orange slices','Farofa','Collard greens','Smoked pork cuts','Black beans','Brazil']],
  ['Ceviche',['cebiche'],['Red onion','Ají chilli','Coriander','Lime juice','Raw white fish','Peru']],
  ['Empanadas',['empanada'],['Olives','Hard-boiled egg','Cumin','Minced beef','Folded pastry turnovers','Argentina']],
  ['Arepas',['arepa'],['Butter','Fresh cheese','Black beans','Shredded beef','Griddled corn-flour patties','Venezuela and Colombia']],
  ['Tacos al pastor',['al pastor','pastor tacos'],['Onion','Coriander','Pineapple','Achiote-marinated pork from a spit','Small corn tortillas','Mexico']],
  ['Mole poblano',['mole'],['Sesame seeds','Cinnamon','Several dried chillies','Chocolate','Turkey or chicken','Mexico (Puebla)']],
  ['Chili con carne',['chilli con carne','chili'],['Cumin','Onion','Tomato','Kidney beans','Minced beef','United States (Texas)']],
  ['Clam chowder',['new england clam chowder','chowder'],['Celery','Onion','Salt pork','Potatoes','Clams in a creamy soup','United States (New England)']],
  ['Gumbo',[],['Filé powder','Okra','Andouille sausage','Onion, celery and green pepper','Dark roux','United States (Louisiana)']],
  ['Jambalaya',[],['Cayenne pepper','Andouille sausage','Chicken','Onion, celery and green pepper','Rice cooked in the same pot','United States (Louisiana)']],
  ['Macaroni and cheese',['mac and cheese','mac n cheese','mac & cheese','macaroni cheese'],['Mustard powder','Breadcrumbs','Milk','Cheddar','Elbow macaroni','United States']],
  ['Buffalo wings',['hot wings','chicken wings','buffalo chicken wings'],['Celery sticks','Blue cheese dip','Butter','Vinegary hot sauce','Fried chicken wings','United States (Buffalo)']],
  ['Poutine',[],['Salt','Black pepper','Brown gravy','Squeaky cheese curds','French fries','Canada (Quebec)']],
  ['Pavlova',[],['Cornflour','Vinegar','Whipped cream','Passion fruit','Crisp meringue base','Australia and New Zealand']],
  ['Jollof rice',['jollof'],['Bay leaf','Scotch bonnet','Onion','Tomato and pepper base','Long-grain rice','West Africa']],
  ['Bobotie',[],['Bay leaves','Curry powder','Raisins','Egg custard topping','Spiced minced meat','South Africa']],
  ['Doro wat',['doro wot'],['Niter kibbeh spiced butter','Red onions','Hard-boiled eggs','Berbere spice','Chicken stew served on injera','Ethiopia']],
  ['Chicken tagine',['tagine','chicken tajine'],['Ginger','Saffron','Green olives','Preserved lemon','Chicken in a cone-lidded pot','Morocco']],
  ['Koshari',['kushari','koshary'],['Crispy fried onions','Spiced tomato sauce','Chickpeas','Lentils','Rice and macaroni together','Egypt']],
  ['Beef rendang',['rendang'],['Lemongrass','Galangal','Chilli','Coconut milk','Beef slow-cooked until dry','Indonesia (West Sumatra)']],
  ['Nasi goreng',[],['Kecap manis','Shrimp paste','Shallots','Fried egg on top','Fried rice','Indonesia']],
  ['Laksa',['curry laksa'],['Tofu puffs','Prawns','Lemongrass','Coconut curry broth','Rice noodles','Malaysia and Singapore']],
  ['Hainanese chicken rice',['chicken rice'],['Pandan leaf','Ginger paste','Chilli sauce','Poached chicken','Rice cooked in chicken stock','Singapore']],
  ['Thai green curry',['green curry','gaeng keow wan'],['Thai basil','Fish sauce','Coconut milk','Thai aubergine','Green chilli paste','Thailand']],
  ['Tom yum',['tom yum goong','tom yam'],['Galangal','Kaffir lime leaves','Lemongrass','Prawns','Hot and sour broth','Thailand']],
  ['Chicken adobo',['adobo','pork adobo'],['Bay leaves','Black peppercorns','Garlic','Soy sauce','Meat braised in vinegar','Philippines']],
  ['Lasagne',['lasagna'],['Nutmeg','Béchamel','Meat ragù','Parmesan','Layered pasta sheets','Italy']],
  ['Pizza Margherita',['margherita','margherita pizza','pizza'],['Olive oil','Fresh basil','Mozzarella','Tomato','Wood-fired dough','Italy (Naples)']],
  ['Osso buco',['ossobuco'],['Gremolata','White wine','Carrots','Saffron risotto on the side','Braised veal shanks','Italy (Milan)']],
  ['Tiramisu',['tiramisù'],['Cocoa powder','Marsala','Espresso','Mascarpone','Ladyfinger biscuits','Italy']],
  ['Caesar salad',['caesar'],['Parmesan','Anchovies','Egg-yolk dressing','Croutons','Romaine lettuce','Mexico (Tijuana)']],
  ['Greek salad',['horiatiki'],['Oregano','Kalamata olives','Cucumber','Red onion','A slab of feta','Greece']],
  ['Souvlaki',[],['Oregano','Lemon','Pita','Tzatziki','Grilled pork on skewers','Greece']],
  ['Baklava',[],['Cinnamon','Honey syrup','Butter','Walnuts or pistachios','Layers of filo pastry','Turkey and the Middle East']],
  ['Shawarma',['shwarma','chicken shawarma'],['Garlic sauce','Pickles','Turmeric and cumin','Flatbread wrap','Meat roasted on a vertical spit','The Levant']],
  ['Eggs Benedict',['eggs benny','egg benedict'],['Lemon','Butter','Poached eggs','Hollandaise sauce','English muffin with ham','United States (New York)']],
  ['Bánh mì',['banh mi'],['Coriander','Sliced chilli','Pickled carrot and daikon','Pâté','Crusty baguette','Vietnam']],
  ['Churros',['churro'],['Cinnamon sugar','Thick hot chocolate for dipping','Simple flour dough','Star-shaped piping','Deep-fried sticks','Spain']]
];

/* ---------- data: films ---------- */
// {t, a, y, g, p (plot in our words), r (runtime band), c (country), d (director), s (star), ch (character)}
const F_U100 = 'Under 100 minutes', F_MID = '100–130 minutes', F_LONG = 'Over 130 minutes';
const CREDITS_FILMS = [
  {t:'The Wizard of Oz',a:['wizard of oz'],y:1939,g:'Musical fantasy',p:'A Kansas farm girl is swept by a tornado into a colourful land and must find a wizard to get home.',r:F_MID,c:'United States',d:'Victor Fleming',s:'Judy Garland',ch:'Dorothy Gale'},
  {t:'Gone with the Wind',a:[],y:1939,g:'Historical romance',p:'A headstrong plantation heiress survives the American Civil War and its aftermath while chasing the wrong man.',r:F_LONG,c:'United States',d:'Victor Fleming',s:'Vivien Leigh',ch:'Scarlett O’Hara'},
  {t:'Citizen Kane',a:[],y:1941,g:'Drama',p:'Reporters try to decode the last word spoken by a dying newspaper tycoon.',r:F_MID,c:'United States',d:'Orson Welles',s:'Orson Welles',ch:'Charles Foster Kane'},
  {t:'Casablanca',a:[],y:1942,g:'Romantic drama',p:'A cynical nightclub owner in wartime Morocco is torn when his former love walks in with her resistance-leader husband.',r:F_MID,c:'United States',d:'Michael Curtiz',s:'Humphrey Bogart',ch:'Rick Blaine'},
  {t:'It’s a Wonderful Life',a:['its a wonderful life'],y:1946,g:'Fantasy drama',p:'On Christmas Eve, a despairing small-town banker is shown what his town would be like if he had never lived.',r:F_MID,c:'United States',d:'Frank Capra',s:'James Stewart',ch:'George Bailey'},
  {t:'Singin’ in the Rain',a:['singing in the rain','singin in the rain'],y:1952,g:'Musical comedy',p:'A silent-film star and his friends scramble to survive Hollywood’s switch to talking pictures.',r:F_MID,c:'United States',d:'Gene Kelly and Stanley Donen',s:'Gene Kelly',ch:'Don Lockwood'},
  {t:'Seven Samurai',a:['shichinin no samurai'],y:1954,g:'Epic action',p:'A poor farming village hires a band of masterless swordsmen to defend it from bandits.',r:F_LONG,c:'Japan',d:'Akira Kurosawa',s:'Toshiro Mifune',ch:'Kikuchiyo'},
  {t:'Rear Window',a:[],y:1954,g:'Mystery thriller',p:'A photographer stuck in his apartment with a broken leg comes to believe a neighbour has committed murder.',r:F_MID,c:'United States',d:'Alfred Hitchcock',s:'James Stewart',ch:'L. B. “Jeff” Jefferies'},
  {t:'Vertigo',a:[],y:1958,g:'Psychological thriller',p:'A retired detective with a fear of heights is hired to follow a woman who seems possessed by the past.',r:F_MID,c:'United States',d:'Alfred Hitchcock',s:'James Stewart',ch:'John “Scottie” Ferguson'},
  {t:'Some Like It Hot',a:[],y:1959,g:'Comedy',p:'Two musicians who witness a gangland killing disguise themselves as women and join an all-female band.',r:F_MID,c:'United States',d:'Billy Wilder',s:'Marilyn Monroe',ch:'Sugar Kane'},
  {t:'Psycho',a:[],y:1960,g:'Horror thriller',p:'A secretary on the run with stolen cash checks into a remote motel run by a nervous young man.',r:F_MID,c:'United States',d:'Alfred Hitchcock',s:'Anthony Perkins',ch:'Norman Bates'},
  {t:'Breakfast at Tiffany’s',a:['breakfast at tiffanys'],y:1961,g:'Romantic comedy',p:'A charming Manhattan socialite with a hidden past befriends the struggling writer who moves in upstairs.',r:F_MID,c:'United States',d:'Blake Edwards',s:'Audrey Hepburn',ch:'Holly Golightly'},
  {t:'Lawrence of Arabia',a:[],y:1962,g:'Historical epic',p:'A British officer unites desert tribes against the Ottoman Empire during the First World War.',r:F_LONG,c:'United Kingdom',d:'David Lean',s:'Peter O’Toole',ch:'Sherif Ali'},
  {t:'Dr. Strangelove',a:['dr strangelove','doctor strangelove'],y:1964,g:'Satirical comedy',p:'A rogue general launches a nuclear strike, and the leaders in a war room bicker over how to stop it.',r:F_U100,c:'United Kingdom and United States',d:'Stanley Kubrick',s:'Peter Sellers',ch:'Major T. J. “King” Kong'},
  {t:'The Sound of Music',a:['sound of music'],y:1965,g:'Musical',p:'A trainee nun becomes governess to a widowed naval captain’s seven children in Austria on the eve of war.',r:F_LONG,c:'United States',d:'Robert Wise',s:'Julie Andrews',ch:'Captain Georg von Trapp'},
  {t:'2001: A Space Odyssey',a:['2001','2001 a space odyssey','space odyssey'],y:1968,g:'Science fiction',p:'A mysterious black monolith guides human evolution, and a mission to Jupiter is endangered by its own computer.',r:F_LONG,c:'United Kingdom and United States',d:'Stanley Kubrick',s:'Keir Dullea',ch:'HAL 9000'},
  {t:'The Godfather',a:['godfather'],y:1972,g:'Crime drama',p:'The reluctant youngest son of a New York crime family is drawn into running the family business.',r:F_LONG,c:'United States',d:'Francis Ford Coppola',s:'Marlon Brando',ch:'Michael Corleone'},
  {t:'Jaws',a:[],y:1975,g:'Thriller',p:'A police chief, a scientist and a grizzled fisherman hunt a great white shark terrorising a beach town.',r:F_MID,c:'United States',d:'Steven Spielberg',s:'Roy Scheider',ch:'Quint'},
  {t:'Taxi Driver',a:[],y:1976,g:'Psychological drama',p:'A lonely, sleepless Vietnam veteran working nights in New York spirals toward violence.',r:F_MID,c:'United States',d:'Martin Scorsese',s:'Robert De Niro',ch:'Travis Bickle'},
  {t:'Rocky',a:[],y:1976,g:'Sports drama',p:'A small-time Philadelphia boxer gets a once-in-a-lifetime shot at the heavyweight champion.',r:F_MID,c:'United States',d:'John G. Avildsen',s:'Sylvester Stallone',ch:'Apollo Creed'},
  {t:'Star Wars',a:['a new hope','star wars a new hope','star wars episode iv'],y:1977,g:'Space opera',p:'A farm boy on a desert planet joins a rebellion to rescue a princess and destroy a planet-killing battle station.',r:F_MID,c:'United States',d:'George Lucas',s:'Mark Hamill',ch:'Darth Vader'},
  {t:'Alien',a:[],y:1979,g:'Science-fiction horror',p:'The crew of a commercial space tug answers a distress call and brings back a deadly stowaway.',r:F_MID,c:'United Kingdom and United States',d:'Ridley Scott',s:'Sigourney Weaver',ch:'Ellen Ripley'},
  {t:'Apocalypse Now',a:[],y:1979,g:'War drama',p:'An army captain travels upriver through the Vietnam War to find and kill a renegade colonel.',r:F_LONG,c:'United States',d:'Francis Ford Coppola',s:'Martin Sheen',ch:'Colonel Walter E. Kurtz'},
  {t:'The Shining',a:['shining'],y:1980,g:'Horror',p:'A writer takes a winter caretaker job at an isolated mountain hotel and slowly loses his mind.',r:F_LONG,c:'United Kingdom and United States',d:'Stanley Kubrick',s:'Jack Nicholson',ch:'Jack Torrance'},
  {t:'Raiders of the Lost Ark',a:['raiders','indiana jones and the raiders of the lost ark'],y:1981,g:'Action adventure',p:'An archaeologist races Nazi agents to find a legendary biblical artefact.',r:F_MID,c:'United States',d:'Steven Spielberg',s:'Harrison Ford',ch:'Indiana Jones'},
  {t:'E.T. the Extra-Terrestrial',a:['et','e.t.','et the extra terrestrial'],y:1982,g:'Science-fiction family',p:'A lonely suburban boy hides a stranded alien and helps it contact home.',r:F_MID,c:'United States',d:'Steven Spielberg',s:'Henry Thomas',ch:'Elliott'},
  {t:'Blade Runner',a:[],y:1982,g:'Science-fiction noir',p:'In a rain-soaked future Los Angeles, a burned-out cop hunts escaped artificial humans.',r:F_MID,c:'United States',d:'Ridley Scott',s:'Harrison Ford',ch:'Rick Deckard'},
  {t:'Ghostbusters',a:[],y:1984,g:'Supernatural comedy',p:'Three sacked parapsychologists start a ghost-catching business in New York.',r:F_MID,c:'United States',d:'Ivan Reitman',s:'Bill Murray',ch:'Peter Venkman'},
  {t:'The Terminator',a:['terminator'],y:1984,g:'Science-fiction action',p:'A cyborg assassin is sent back in time to kill a waitress whose unborn son will lead a future resistance.',r:F_MID,c:'United States',d:'James Cameron',s:'Arnold Schwarzenegger',ch:'Sarah Connor'},
  {t:'Back to the Future',a:[],y:1985,g:'Science-fiction comedy',p:'A teenager accidentally travels thirty years into the past and must make sure his parents fall in love.',r:F_MID,c:'United States',d:'Robert Zemeckis',s:'Michael J. Fox',ch:'Marty McFly'},
  {t:'Ferris Bueller’s Day Off',a:['ferris buellers day off','ferris bueller'],y:1986,g:'Teen comedy',p:'A high-schooler fakes being sick and spends a perfect day loose in Chicago with his friends.',r:F_MID,c:'United States',d:'John Hughes',s:'Matthew Broderick',ch:'Cameron Frye'},
  {t:'Top Gun',a:[],y:1986,g:'Action drama',p:'A reckless young fighter pilot competes at an elite naval flight school.',r:F_MID,c:'United States',d:'Tony Scott',s:'Tom Cruise',ch:'Maverick'},
  {t:'The Princess Bride',a:['princess bride'],y:1987,g:'Fantasy adventure',p:'A grandfather reads his sick grandson a tale of a farmhand turned pirate rescuing his true love.',r:F_U100,c:'United States',d:'Rob Reiner',s:'Cary Elwes',ch:'Inigo Montoya'},
  {t:'Die Hard',a:[],y:1988,g:'Action thriller',p:'An off-duty cop is trapped in a Los Angeles skyscraper taken over by thieves on Christmas Eve.',r:F_LONG,c:'United States',d:'John McTiernan',s:'Bruce Willis',ch:'John McClane'},
  {t:'Goodfellas',a:['good fellas'],y:1990,g:'Crime drama',p:'A young man rises through the New York mob over three decades before it all falls apart.',r:F_LONG,c:'United States',d:'Martin Scorsese',s:'Ray Liotta',ch:'Henry Hill'},
  {t:'Home Alone',a:[],y:1990,g:'Family comedy',p:'An eight-year-old left behind when his family flies off for Christmas defends the house from two burglars.',r:F_MID,c:'United States',d:'Chris Columbus',s:'Macaulay Culkin',ch:'Kevin McCallister'},
  {t:'The Silence of the Lambs',a:['silence of the lambs'],y:1991,g:'Psychological thriller',p:'An FBI trainee seeks help from an imprisoned cannibal psychiatrist to catch a serial killer.',r:F_MID,c:'United States',d:'Jonathan Demme',s:'Jodie Foster',ch:'Hannibal Lecter'},
  {t:'Groundhog Day',a:[],y:1993,g:'Fantasy comedy',p:'A grumpy TV weatherman relives the same winter day in a small town over and over.',r:F_MID,c:'United States',d:'Harold Ramis',s:'Bill Murray',ch:'Phil Connors'},
  {t:'Jurassic Park',a:[],y:1993,g:'Science-fiction adventure',p:'Scientists touring an island theme park of cloned dinosaurs are stranded when the power fails.',r:F_MID,c:'United States',d:'Steven Spielberg',s:'Sam Neill',ch:'Dr. Ian Malcolm'},
  {t:'Schindler’s List',a:['schindlers list'],y:1993,g:'Historical drama',p:'A German industrialist saves more than a thousand Jewish workers during the Holocaust.',r:F_LONG,c:'United States',d:'Steven Spielberg',s:'Liam Neeson',ch:'Itzhak Stern'},
  {t:'The Lion King',a:['lion king'],y:1994,g:'Animated musical',p:'A young lion prince flees after his father’s death and must return to reclaim his kingdom.',r:F_U100,c:'United States',d:'Roger Allers and Rob Minkoff',s:'Matthew Broderick (voice)',ch:'Simba'},
  {t:'Pulp Fiction',a:[],y:1994,g:'Crime',p:'Hitmen, a boxer and a pair of diner robbers cross paths in interlocking Los Angeles stories.',r:F_LONG,c:'United States',d:'Quentin Tarantino',s:'John Travolta',ch:'Vincent Vega'},
  {t:'The Shawshank Redemption',a:['shawshank','shawshank redemption'],y:1994,g:'Prison drama',p:'A banker wrongly jailed for murder befriends a fellow inmate over two decades in a Maine prison.',r:F_LONG,c:'United States',d:'Frank Darabont',s:'Tim Robbins',ch:'Andy Dufresne'},
  {t:'Forrest Gump',a:[],y:1994,g:'Comedy drama',p:'A kind-hearted Alabama man of modest intellect drifts through decades of American history.',r:F_LONG,c:'United States',d:'Robert Zemeckis',s:'Tom Hanks',ch:'Lieutenant Dan Taylor'},
  {t:'Toy Story',a:[],y:1995,g:'Computer-animated comedy',p:'A cowboy doll feels threatened when a flashy space-ranger toy becomes his owner’s favourite.',r:F_U100,c:'United States',d:'John Lasseter',s:'Tom Hanks (voice)',ch:'Buzz Lightyear'},
  {t:'Fargo',a:[],y:1996,g:'Crime black comedy',p:'A desperate car salesman’s scheme to have his wife kidnapped goes horribly wrong in snowy Minnesota.',r:F_U100,c:'United States',d:'Joel Coen',s:'Frances McDormand',ch:'Marge Gunderson'},
  {t:'Titanic',a:[],y:1997,g:'Romantic disaster epic',p:'A penniless artist and an engaged aristocrat fall in love aboard a doomed ocean liner.',r:F_LONG,c:'United States',d:'James Cameron',s:'Leonardo DiCaprio',ch:'Rose DeWitt Bukater'},
  {t:'The Big Lebowski',a:['big lebowski'],y:1998,g:'Comedy',p:'A laid-back bowler is mistaken for a millionaire with the same name and dragged into a kidnapping plot.',r:F_MID,c:'United States',d:'Joel Coen',s:'Jeff Bridges',ch:'The Dude'},
  {t:'The Matrix',a:['matrix'],y:1999,g:'Science-fiction action',p:'A hacker learns that the world he knows is a simulation built by machines.',r:F_LONG,c:'United States',d:'The Wachowskis',s:'Keanu Reeves',ch:'Neo'},
  {t:'Fight Club',a:[],y:1999,g:'Psychological drama',p:'An insomniac office worker and a reckless soap salesman start an underground bare-knuckle club.',r:F_LONG,c:'United States',d:'David Fincher',s:'Brad Pitt',ch:'Tyler Durden'},
  {t:'Gladiator',a:[],y:2000,g:'Historical epic',p:'A betrayed Roman general is sold into slavery and fights his way back toward the emperor who ruined him.',r:F_LONG,c:'United States and United Kingdom',d:'Ridley Scott',s:'Russell Crowe',ch:'Maximus'},
  {t:'Spirited Away',a:['sen to chihiro no kamikakushi'],y:2001,g:'Animated fantasy',p:'A sullen ten-year-old must work in a bathhouse for spirits to free her parents, who have been turned into pigs.',r:F_MID,c:'Japan',d:'Hayao Miyazaki',s:'Rumi Hiiragi (voice)',ch:'Chihiro'},
  {t:'The Lord of the Rings: The Fellowship of the Ring',a:['fellowship of the ring','the fellowship of the ring','lord of the rings'],y:2001,g:'Fantasy epic',p:'A small, unassuming villager sets out with eight companions to destroy a ring of terrible power.',r:F_LONG,c:'New Zealand and United States',d:'Peter Jackson',s:'Elijah Wood',ch:'Gandalf'},
  {t:'Amélie',a:['amelie','le fabuleux destin d’amelie poulain'],y:2001,g:'Romantic comedy',p:'A shy Parisian waitress secretly meddles in strangers’ lives to make them happier.',r:F_MID,c:'France',d:'Jean-Pierre Jeunet',s:'Audrey Tautou',ch:'Nino Quincampoix'},
  {t:'Shrek',a:[],y:2001,g:'Animated comedy',p:'A grumpy swamp-dwelling ogre agrees to rescue a princess so a tiny lord will leave his home alone.',r:F_U100,c:'United States',d:'Andrew Adamson and Vicky Jenson',s:'Mike Myers (voice)',ch:'Donkey'},
  {t:'Harry Potter and the Philosopher’s Stone',a:['harry potter','harry potter and the sorcerers stone','philosophers stone','sorcerers stone'],y:2001,g:'Fantasy',p:'An orphan boy learns on his eleventh birthday that he is a wizard and is invited to a school of magic.',r:F_LONG,c:'United Kingdom and United States',d:'Chris Columbus',s:'Daniel Radcliffe',ch:'Hermione Granger'},
  {t:'Finding Nemo',a:[],y:2003,g:'Computer-animated adventure',p:'An overprotective clownfish crosses the ocean to rescue his son, taken by a diver.',r:F_MID,c:'United States',d:'Andrew Stanton',s:'Albert Brooks (voice)',ch:'Dory'},
  {t:'Kill Bill: Volume 1',a:['kill bill','kill bill vol 1','kill bill volume 1'],y:2003,g:'Martial-arts action',p:'A former assassin wakes from a coma and sets out for revenge on the squad that left her for dead.',r:F_MID,c:'United States',d:'Quentin Tarantino',s:'Uma Thurman',ch:'O-Ren Ishii'},
  {t:'Pan’s Labyrinth',a:['pans labyrinth','el laberinto del fauno'],y:2006,g:'Dark fantasy',p:'In 1944 Spain, a girl escapes her cruel stepfather into a mythical world of tasks set by a faun.',r:F_MID,c:'Spain and Mexico',d:'Guillermo del Toro',s:'Ivana Baquero',ch:'Ofelia'},
  {t:'No Country for Old Men',a:[],y:2007,g:'Crime thriller',p:'A hunter who finds drug money in the Texas desert is pursued by a relentless killer.',r:F_MID,c:'United States',d:'Joel and Ethan Coen',s:'Tommy Lee Jones',ch:'Anton Chigurh'},
  {t:'The Dark Knight',a:['dark knight'],y:2008,g:'Superhero crime',p:'A masked vigilante faces an anarchic criminal who wants to prove anyone can be corrupted.',r:F_LONG,c:'United States',d:'Christopher Nolan',s:'Christian Bale',ch:'The Joker'},
  {t:'WALL-E',a:['wall e','walle'],y:2008,g:'Computer-animated science fiction',p:'A lonely trash-compacting robot on an abandoned Earth falls for a sleek probe sent to search for plants.',r:F_U100,c:'United States',d:'Andrew Stanton',s:'Ben Burtt (voice)',ch:'EVE'},
  {t:'Up',a:[],y:2009,g:'Computer-animated adventure',p:'A grieving widower ties thousands of balloons to his house and floats off to South America with a stowaway scout.',r:F_U100,c:'United States',d:'Pete Docter',s:'Ed Asner (voice)',ch:'Carl Fredricksen'},
  {t:'Avatar',a:[],y:2009,g:'Science-fiction epic',p:'A paralysed marine controls a genetically engineered body on a distant moon and turns against the mining company.',r:F_LONG,c:'United States',d:'James Cameron',s:'Sam Worthington',ch:'Jake Sully'},
  {t:'Inception',a:[],y:2010,g:'Science-fiction heist',p:'A thief who steals secrets from dreams is hired to plant an idea in a target’s mind instead.',r:F_LONG,c:'United States and United Kingdom',d:'Christopher Nolan',s:'Leonardo DiCaprio',ch:'Dom Cobb'},
  {t:'The Social Network',a:['social network'],y:2010,g:'Biographical drama',p:'A Harvard student builds a social website and ends up facing lawsuits from his co-founders.',r:F_MID,c:'United States',d:'David Fincher',s:'Jesse Eisenberg',ch:'Eduardo Saverin'},
  {t:'Frozen',a:[],y:2013,g:'Animated musical',p:'A princess journeys into the mountains to find her sister, whose icy powers have plunged their kingdom into winter.',r:F_MID,c:'United States',d:'Chris Buck and Jennifer Lee',s:'Kristen Bell (voice)',ch:'Elsa'},
  {t:'Gravity',a:[],y:2013,g:'Science-fiction thriller',p:'Two astronauts are stranded in orbit after debris destroys their space shuttle.',r:F_U100,c:'United Kingdom and United States',d:'Alfonso Cuarón',s:'Sandra Bullock',ch:'Dr. Ryan Stone'},
  {t:'Interstellar',a:[],y:2014,g:'Science-fiction drama',p:'A former pilot leaves his children on a dying Earth to search for a new home through a wormhole.',r:F_LONG,c:'United States and United Kingdom',d:'Christopher Nolan',s:'Matthew McConaughey',ch:'Murph'},
  {t:'Mad Max: Fury Road',a:['fury road','mad max fury road','mad max'],y:2015,g:'Post-apocalyptic action',p:'A drifter and a rebel war-rig driver flee across the desert with a tyrant’s wives.',r:F_MID,c:'Australia and United States',d:'George Miller',s:'Tom Hardy',ch:'Imperator Furiosa'},
  {t:'La La Land',a:['lalaland'],y:2016,g:'Musical romance',p:'A jazz pianist and an aspiring actress fall in love while chasing their dreams in Los Angeles.',r:F_MID,c:'United States',d:'Damien Chazelle',s:'Ryan Gosling',ch:'Mia Dolan'},
  {t:'Get Out',a:[],y:2017,g:'Horror thriller',p:'A young Black photographer uncovers something sinister on a weekend visit to his white girlfriend’s parents.',r:F_MID,c:'United States',d:'Jordan Peele',s:'Daniel Kaluuya',ch:'Chris Washington'},
  {t:'Coco',a:[],y:2017,g:'Computer-animated fantasy',p:'A boy who dreams of music is transported to the Land of the Dead on the Day of the Dead.',r:F_MID,c:'United States',d:'Lee Unkrich',s:'Anthony Gonzalez (voice)',ch:'Miguel Rivera'},
  {t:'Black Panther',a:[],y:2018,g:'Superhero',p:'The new king of a hidden, technologically advanced African nation is challenged for the throne.',r:F_LONG,c:'United States',d:'Ryan Coogler',s:'Chadwick Boseman',ch:'Killmonger'},
  {t:'Parasite',a:['gisaengchung'],y:2019,g:'Black comedy thriller',p:'A poor family schemes its way into working for a wealthy household, one job at a time.',r:F_LONG,c:'South Korea',d:'Bong Joon-ho',s:'Song Kang-ho',ch:'Kim Ki-taek'},
  {t:'Everything Everywhere All at Once',a:['everything everywhere','eeaao'],y:2022,g:'Science-fiction comedy',p:'A laundromat owner being audited by the tax office discovers she can tap into versions of herself in other universes.',r:F_LONG,c:'United States',d:'Daniel Kwan and Daniel Scheinert',s:'Michelle Yeoh',ch:'Evelyn Quan Wang'},
  {t:'Barbie',a:[],y:2023,g:'Fantasy comedy',p:'A doll living in a perfect pink world begins to malfunction and travels to the real world for answers.',r:F_MID,c:'United States',d:'Greta Gerwig',s:'Margot Robbie',ch:'Ken'},
  {t:'Oppenheimer',a:[],y:2023,g:'Biographical drama',p:'A physicist leads the wartime race to build the atomic bomb and later faces a security hearing.',r:F_LONG,c:'United States and United Kingdom',d:'Christopher Nolan',s:'Cillian Murphy',ch:'Lewis Strauss'}
];

/* ---------- data: video games. [year, title, hint] — year of first release anywhere ---------- */
const CART_GAMES = [
  [1972,'Pong','Atari, arcade'],[1978,'Space Invaders','Taito, arcade'],[1979,'Asteroids','Atari, arcade'],
  [1980,'Pac-Man','Namco, arcade'],[1981,'Donkey Kong','Nintendo, arcade'],[1981,'Frogger','Konami, arcade'],
  [1981,'Galaga','Namco, arcade'],[1982,'Ms. Pac-Man','Arcade'],[1982,'Pitfall!','Activision, Atari 2600'],
  [1982,'Q*bert','Gottlieb, arcade'],[1984,'Tetris','Original Soviet release, Elektronika 60'],[1985,'Super Mario Bros.','Nintendo, NES'],
  [1986,'The Legend of Zelda','Nintendo, Famicom Disk System'],[1986,'Metroid','Nintendo, Famicom Disk System'],[1986,'Dragon Quest','Enix, Famicom'],
  [1986,'Castlevania','Konami, Famicom Disk System'],[1987,'Final Fantasy','Square, Famicom'],[1987,'Mega Man','Capcom, NES'],
  [1987,'Contra','Konami, arcade'],[1989,'SimCity','Maxis, PC'],[1989,'Prince of Persia','Apple II'],
  [1991,'Street Fighter II','Capcom, arcade'],[1991,'Sonic the Hedgehog','Sega, Mega Drive'],[1991,'Lemmings','DMA Design, Amiga'],
  [1991,'Civilization','MicroProse, PC'],[1992,'Mortal Kombat','Midway, arcade'],[1992,'Super Mario Kart','Nintendo, SNES'],
  [1992,'Wolfenstein 3D','id Software, PC'],[1993,'Doom','id Software, PC'],[1993,'Myst','Cyan, Mac'],
  [1994,'Donkey Kong Country','Rare, SNES'],[1994,'Warcraft: Orcs & Humans','Blizzard, PC'],[1996,'Pokémon Red and Green','Game Freak, Game Boy (Japan)'],
  [1996,'Super Mario 64','Nintendo, Nintendo 64'],[1996,'Crash Bandicoot','Naughty Dog, PlayStation'],[1996,'Tomb Raider','Core Design'],
  [1996,'Quake','id Software, PC'],[1996,'Resident Evil','Capcom, PlayStation'],[1997,'GoldenEye 007','Rare, Nintendo 64'],
  [1997,'Final Fantasy VII','Square, PlayStation'],[1998,'Metal Gear Solid','Konami, PlayStation'],[1998,'The Legend of Zelda: Ocarina of Time','Nintendo, Nintendo 64'],
  [1998,'Half-Life','Valve, PC'],[1998,'StarCraft','Blizzard, PC'],[1998,'Banjo-Kazooie','Rare, Nintendo 64'],
  [1999,'Super Smash Bros.','HAL Laboratory, Nintendo 64'],[1999,'Tony Hawk’s Pro Skater','Neversoft, PlayStation'],[2000,'The Sims','Maxis, PC'],
  [2000,'Deus Ex','Ion Storm, PC'],[2001,'Halo: Combat Evolved','Bungie, Xbox'],[2001,'Grand Theft Auto III','Rockstar, PlayStation 2'],
  [2001,'RuneScape','Jagex, browser'],[2004,'World of Warcraft','Blizzard, PC'],[2004,'Half-Life 2','Valve, PC'],
  [2005,'Shadow of the Colossus','Team Ico, PlayStation 2'],[2005,'Guitar Hero','Harmonix, PlayStation 2'],[2006,'Wii Sports','Nintendo, Wii'],
  [2006,'Gears of War','Epic Games, Xbox 360'],[2007,'Portal','Valve, PC and consoles'],[2007,'BioShock','2K, PC and Xbox 360'],
  [2007,'Call of Duty 4: Modern Warfare','Infinity Ward'],[2007,'Mass Effect','BioWare, Xbox 360'],[2008,'Braid','Number None, Xbox Live Arcade'],
  [2008,'Spore','Maxis, PC'],[2009,'Angry Birds','Rovio, iPhone'],[2009,'League of Legends','Riot Games, PC'],
  [2009,'Plants vs. Zombies','PopCap, PC'],[2011,'Minecraft','Mojang, PC (full release)'],[2011,'The Elder Scrolls V: Skyrim','Bethesda'],
  [2011,'Dark Souls','FromSoftware'],[2011,'Portal 2','Valve'],[2012,'Journey','thatgamecompany, PlayStation 3'],
  [2013,'The Last of Us','Naughty Dog, PlayStation 3'],[2013,'Grand Theft Auto V','Rockstar'],[2013,'Flappy Bird','Dong Nguyen, mobile'],
  [2014,'Destiny','Bungie'],[2015,'The Witcher 3: Wild Hunt','CD Projekt Red'],[2015,'Undertale','Toby Fox, PC'],
  [2015,'Rocket League','Psyonix'],[2016,'Overwatch','Blizzard'],[2016,'Pokémon Go','Niantic, mobile'],
  [2016,'Stardew Valley','ConcernedApe, PC'],[2017,'The Legend of Zelda: Breath of the Wild','Nintendo, Switch and Wii U'],[2017,'Fortnite','Epic Games'],
  [2017,'Cuphead','Studio MDHR'],[2017,'Hollow Knight','Team Cherry'],[2018,'Celeste','Maddy Makes Games'],
  [2018,'Red Dead Redemption 2','Rockstar'],[2018,'Among Us','Innersloth'],[2020,'Animal Crossing: New Horizons','Nintendo, Switch'],
  [2020,'Hades','Supergiant Games (full release)'],[2020,'Fall Guys','Mediatonic'],[2020,'Genshin Impact','miHoYo'],
  [2022,'Elden Ring','FromSoftware'],[2023,'Baldur’s Gate 3','Larian Studios (full release)'],[2023,'The Legend of Zelda: Tears of the Kingdom','Nintendo, Switch']
];

/* ---------- styles ---------- */
css(`
.gq{display:grid;gap:14px}
.gq-clues{list-style:none;margin:0;padding:0;display:grid;gap:6px}
.gq-clue{display:grid;grid-template-columns:28px minmax(0,1fr);gap:10px;align-items:start;background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:10px 12px}
.gq-clue .n{font:700 13px/22px var(--f-mono);color:var(--muted);text-align:right}
.gq-clue .k{display:block;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);font-weight:700}
.gq-clue .v{font-weight:700;font-size:16px;line-height:1.35;overflow-wrap:anywhere}
.gq-clue.hid{background:var(--sunk);border-style:dashed}
.gq-clue.hid .v{color:var(--muted);font-weight:500}
.gq-clue.new{border-color:var(--gc);box-shadow:0 0 0 1px var(--gc) inset}
.gq-box{position:relative}
.gq-form{display:flex;gap:8px}
.gq-input{flex:1;min-width:0;height:48px;border-radius:10px;border:1.5px solid var(--line);background:var(--surface);color:var(--ink);padding:0 14px;font:600 16px var(--f-body)}
.gq-input:focus{outline:none;border-color:var(--gc)}
.gq-list{position:absolute;left:0;right:0;top:52px;z-index:20;list-style:none;margin:0;padding:4px;background:var(--surface);border:1.5px solid var(--line);border-radius:10px;max-height:min(260px,45vh);overflow-y:auto;box-shadow:0 10px 24px color-mix(in srgb,var(--ink) 18%,transparent)}
.gq-list li{padding:10px 12px;border-radius:7px;cursor:pointer;font-size:15px;overflow-wrap:anywhere}
.gq-list li.on{background:color-mix(in srgb,var(--gc) 16%,var(--surface))}
.gq-list li.tried{color:var(--muted);text-decoration:line-through}
.gq-list li small{color:var(--muted);margin-left:6px}
.gq-tried{display:flex;flex-wrap:wrap;gap:6px}
.gq-tried span{font-size:13px;padding:5px 9px;border-radius:999px;background:color-mix(in srgb,var(--bad) 14%,var(--surface));color:var(--ink);text-decoration:line-through}
.gq-answer{background:color-mix(in srgb,var(--gc) 12%,var(--surface));border:1.5px solid var(--gc);border-radius:12px;padding:14px 16px;display:grid;gap:4px}
.gq-answer b{font:800 24px/1.15 var(--f-display);letter-spacing:-.01em}
.gq-meter{display:flex;gap:5px}
.gq-meter i{flex:1;height:6px;border-radius:3px;background:var(--line)}
.gq-meter i.u{background:var(--gc)}

.cart-end{display:flex;justify-content:space-between;align-items:center}
.cart-list{list-style:none;margin:0;padding:0;display:grid;gap:8px;counter-reset:cart}
.cart-it{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:10px;align-items:center;background:var(--surface);border:1.5px solid var(--line);border-radius:12px;padding:8px 12px 8px 8px}
.cart-it.sel{border-color:var(--gc);background:color-mix(in srgb,var(--gc) 10%,var(--surface))}
.cart-it.ok{border-color:var(--good);background:color-mix(in srgb,var(--good) 10%,var(--surface))}
.cart-it.no{border-color:var(--bad)}
.cart-mv{display:flex;flex-direction:column;gap:3px;min-width:36px}
.cart-mv button{width:36px;height:26px;border-radius:6px;border:0;background:var(--sunk);cursor:pointer;font-size:11px;padding:0;color:var(--ink)}
.cart-mv button:disabled{opacity:.3;cursor:default}
.cart-t{background:none;border:0;padding:4px 0;text-align:left;cursor:pointer;min-width:0;color:var(--ink);font:inherit}
.cart-t:disabled{cursor:default}
.cart-t b{display:block;font:700 16px/1.25 var(--f-body);overflow-wrap:anywhere}
.cart-t small{display:block;font-size:13px;color:var(--muted);margin-top:2px}
.cart-yr{font:700 15px var(--f-mono);color:var(--muted);font-variant-numeric:tabular-nums}
.cart-it.ok .cart-yr{color:var(--good)}
.cart-tries{display:flex;gap:6px}
.cart-tries i{width:28px;height:8px;border-radius:4px;background:var(--line);display:block}.cart-tries i.u{background:var(--gc)}
`);

/* ---------- shared: guess-from-clues engine (Pantry and Credits) ---------- */
const gqNorm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/&/g,'and').replace(/[^a-z0-9]/g,'');
function mountClueGuess(el, api, cfg){
  // cfg: {name, items:[{t, a:[]}], answer, clues:[{k, v}], noun, emoji}
  const MAX = cfg.clues.length;
  const st = api.load(() => ({shown:1, tried:[], started:false}));
  const save = () => api.save(st);
  const index = cfg.items.map((it, i) => ({i, t:it.t, keys:[it.t, ...(it.a||[])].map(gqNorm)}));
  const ansIdx = cfg.items.indexOf(cfg.answer);
  let q = '', hits = [], active = -1, msg = '', msgCls = '', lastNew = -1;
  const fin = () => !!api.existing();

  function match(text){
    const n = gqNorm(text); if (!n) return [];
    const starts = [], has = [];
    index.forEach(e => { if (e.keys.some(k => k.startsWith(n))) starts.push(e); else if (e.keys.some(k => k.includes(n))) has.push(e); });
    return [...starts, ...has].slice(0, 8);
  }
  function exact(text){ const n = gqNorm(text); return n ? index.find(e => e.keys.includes(n)) : null; }

  function render(){
    const done = fin(), res = api.existing();
    const shown = done ? MAX : st.shown;
    el.innerHTML = `<div class="gq">
      <div class="gq-meter" aria-label="${st.shown} of ${MAX} clues shown">${Array.from({length:MAX},(_,i)=>`<i class="${i < st.shown ? 'u' : ''}"></i>`).join('')}</div>
      ${done ? `<div class="gq-answer"><span class="label">${res && res.won ? 'You got it' : 'The answer'}</span><b>${esc(cfg.answer.t)}</b></div>` : ''}
      <ol class="gq-clues">${cfg.clues.map((c, i) => i < shown
        ? `<li class="gq-clue ${i === lastNew ? 'new' : ''}"><span class="n">${i+1}</span><span><span class="k">${esc(c.k)}</span><span class="v">${esc(c.v)}</span></span></li>`
        : `<li class="gq-clue hid"><span class="n">${i+1}</span><span><span class="k">${esc(c.k)}</span><span class="v">Hidden</span></span></li>`).join('')}</ol>
      ${st.tried.length ? `<div class="gq-tried" aria-label="Wrong guesses">${st.tried.map(i => `<span>${esc(cfg.items[i].t)}</span>`).join('')}</div>` : ''}
      ${done ? '' : `<div class="gq-box">
        <form class="gq-form" id="gq-form" autocomplete="off">
          <input class="gq-input" id="gq-in" type="text" role="combobox" aria-expanded="false" aria-controls="gq-list" aria-autocomplete="list" aria-label="Your guess: type a ${esc(cfg.noun)}" placeholder="Type a ${esc(cfg.noun)}…" spellcheck="false" autocapitalize="off">
          <button class="btn primary" type="submit">Guess</button>
        </form>
        <ul class="gq-list" id="gq-list" role="listbox" hidden></ul>
      </div>
      <div class="row" style="justify-content:center"><button class="btn" id="gq-next" type="button">${st.shown >= MAX ? 'Give up' : 'Next clue'}</button></div>`}
      <p class="msg ${msgCls}" aria-live="polite">${esc(msg)}</p>
    </div>`;
    if (done) return;
    const input = el.querySelector('#gq-in'), list = el.querySelector('#gq-list');
    input.value = q;
    const paintList = () => {
      if (!hits.length || !q){ list.hidden = true; input.setAttribute('aria-expanded','false'); return; }
      list.hidden = false; input.setAttribute('aria-expanded','true');
      list.innerHTML = hits.map((h, k) => `<li role="option" id="gq-o${k}" data-i="${h.i}" class="${k === active ? 'on' : ''} ${st.tried.includes(h.i) ? 'tried' : ''}" aria-selected="${k === active}">${esc(h.t)}${cfg.sub ? `<small>${esc(cfg.sub(cfg.items[h.i]))}</small>` : ''}</li>`).join('');
      if (active >= 0){ input.setAttribute('aria-activedescendant', 'gq-o' + active); const a = list.children[active]; if (a) a.scrollIntoView({block:'nearest'}); }
      else input.removeAttribute('aria-activedescendant');
    };
    input.oninput = () => { q = input.value; hits = match(q); active = hits.length ? 0 : -1; paintList(); };
    input.onkeydown = e => {
      if (e.key === 'ArrowDown' && hits.length){ e.preventDefault(); active = (active + 1) % hits.length; paintList(); }
      else if (e.key === 'ArrowUp' && hits.length){ e.preventDefault(); active = (active - 1 + hits.length) % hits.length; paintList(); }
      else if (e.key === 'Escape'){ hits = []; active = -1; paintList(); }
    };
    list.onmousedown = e => e.preventDefault();
    list.onclick = e => { const li = e.target.closest('li[data-i]'); if (li) guess(+li.dataset.i); };
    el.querySelector('#gq-form').onsubmit = e => {
      e.preventDefault();
      const ex = exact(q);
      if (ex) return guess(ex.i);
      if (active >= 0 && hits[active]) return guess(hits[active].i);
      msg = `Pick a ${cfg.noun} from the list as you type.`; msgCls = 'bad'; render(); el.querySelector('#gq-in').focus();
    };
    el.querySelector('#gq-next').onclick = () => reveal(true);
    paintList();
  }
  function begin(){ if (!st.started){ st.started = true; api.start(); } }
  function reveal(skip){
    begin();
    if (st.shown >= MAX){ save(); return end(false); }
    st.shown++; lastNew = st.shown - 1; if (skip){ msg = ''; msgCls = ''; }
    save(); render(); focusIn();
  }
  function guess(i){
    begin();
    q = ''; hits = []; active = -1;
    if (i === ansIdx){ save(); return end(true); }
    if (st.tried.includes(i)){ msg = `You already tried ${cfg.items[i].t}.`; msgCls = 'bad'; render(); focusIn(); return; }
    st.tried.push(i);
    msg = `Not ${cfg.items[i].t}.` + (st.shown < MAX ? ' Here’s another clue.' : ''); msgCls = 'bad';
    if (st.shown >= MAX){ save(); return end(false); }
    reveal(false);
  }
  function focusIn(){ const i = el.querySelector('#gq-in'); if (i) i.focus({preventScroll:true}); }
  function end(won){
    const n = st.shown;
    st.won = won; save();
    const row = won ? '🟨'.repeat(n-1) + '🟩' + '⬜'.repeat(MAX-n) : '🟥'.repeat(MAX);
    msg = ''; msgCls = '';
    api.finish({won, score: won ? n : MAX + 1,
      title: won ? (n === 1 ? 'First clue!' : n <= 3 ? 'Sharp' : 'Got it') : 'Not today',
      detail: `It was ${cfg.answer.t}. ` + (won ? `You needed ${plural(n,'clue')}.` : `${plural(st.tried.length,'wrong guess','wrong guesses')}.`),
      summary: won ? `${n}/${MAX}` : `X/${MAX}`,
      share: `Daybook ${cfg.name} No. ${DAY_NO}  ${won ? n : 'X'}/${MAX}\n${cfg.emoji} ${row}`});
    render();
  }
  render();
  const prev = api.existing(); if (prev) api.show(prev);
  return () => {};
}

/* ---------- Pantry ---------- */
const PANTRY_ITEMS = PANTRY_DISHES.map(([t, a, clues]) => ({t, a, clues}));
function mountPantry(el, api){
  const answer = api.pick(PANTRY_ITEMS);
  const clues = answer.clues.map((v, i) => ({k: i === 5 ? 'Where it’s from' : 'Ingredient ' + (i+1), v}));
  return mountClueGuess(el, api, {name:'Pantry', items:PANTRY_ITEMS, answer, clues, noun:'dish', emoji:'🥘'});
}

/* ---------- Credits ---------- */
function mountCredits(el, api){
  const f = api.pick(CREDITS_FILMS);
  const clues = [
    {k:'Year and genre', v:`${f.y} · ${f.g}`},
    {k:'Plot', v:f.p},
    {k:'Runtime and country', v:`${f.r} · ${f.c}`},
    {k:'Director', v:f.d},
    {k:'Starring', v:f.s},
    {k:'A famous character', v:f.ch}
  ];
  return mountClueGuess(el, api, {name:'Credits', items:CREDITS_FILMS, answer:f, clues, noun:'film', emoji:'🎬', sub: it => String(it.y)});
}

/* ---------- Cartridge ---------- */
function cartPick(r){
  for (let t = 0; t < 400; t++){
    const c = shuffle(CART_GAMES.slice(), r).slice(0, 5);
    const ys = c.map(e => e[0]).sort((a,b) => a-b);
    if (ys.every((y,i) => i === 0 || y - ys[i-1] >= 3)) return c;
  }
  return [CART_GAMES[0], CART_GAMES[11], CART_GAMES[33], CART_GAMES[53], CART_GAMES[80]];
}
function mountCartridge(el, api){
  const r = api.rng();
  const picks = cartPick(r);
  const sorted = picks.slice().sort((a,b) => a[0] - b[0]);
  const MAXT = 3;
  const st = api.load(() => {
    let order; do { order = shuffle([0,1,2,3,4], r); } while (order.every((v,i) => picks[v] === sorted[i]));
    return {order, locked:[false,false,false,false,false], attempts:[], started:false};
  });
  let sel = null, msg = '';
  const save = () => api.save(st);
  const fin = () => !!api.existing();
  function render(){
    const done = fin();
    const view = done ? sorted.map((e,pos) => ({e, lock:true, cls: picks[st.order[pos]] === e ? 'ok' : 'no'}))
                      : st.order.map((pi,pos) => ({e:picks[pi], lock:st.locked[pos], cls: st.locked[pos] ? 'ok' : (sel === pos ? 'sel' : '')}));
    el.innerHTML = `
      <div class="cart-end"><span class="label">Earliest</span><span class="cart-tries" aria-label="${st.attempts.length} of ${MAXT} checks used">${Array.from({length:MAXT},(_,i)=>`<i class="${i < st.attempts.length ? 'u' : ''}"></i>`).join('')}</span></div>
      <ol class="cart-list" id="cart-list">${view.map((v,pos) => `<li class="cart-it ${v.cls}">
        <div class="cart-mv">${v.lock ? '' : `<button data-up="${pos}" aria-label="Move ${esc(v.e[1])} up" ${nb(pos,-1) < 0 ? 'disabled' : ''}>▲</button><button data-dn="${pos}" aria-label="Move ${esc(v.e[1])} down" ${nb(pos,1) < 0 ? 'disabled' : ''}>▼</button>`}</div>
        <button class="cart-t" data-pos="${pos}" ${v.lock ? 'disabled' : ''} aria-pressed="${sel === pos}"><b>${esc(v.e[1])}</b><small>${esc(v.e[2])}</small></button>
        <span class="cart-yr">${v.lock ? v.e[0] : ''}</span></li>`).join('')}</ol>
      <div class="cart-end"><span class="label">Latest</span><span></span></div>
      <p class="msg" aria-live="polite">${esc(msg)}</p>
      ${done ? (api.existing().won ? '' : `<p class="hint">This is the right order. Red rows were out of place on your last check.</p>`)
             : `<div class="row" style="justify-content:center"><button class="btn primary" id="cart-check">Check order</button></div>`}`;
    if (done) return;
    el.querySelector('#cart-list').onclick = e => {
      const up = e.target.closest('[data-up]'), dn = e.target.closest('[data-dn]'), t = e.target.closest('.cart-t');
      if (up) shift(+up.dataset.up, -1); else if (dn) shift(+dn.dataset.dn, 1); else if (t && !t.disabled) tap(+t.dataset.pos);
    };
    el.querySelector('#cart-check').onclick = check;
  }
  function nb(pos, dir){ for (let j = pos + dir; j >= 0 && j < 5; j += dir) if (!st.locked[j]) return j; return -1; }
  function swap(a, b){ [st.order[a], st.order[b]] = [st.order[b], st.order[a]]; if (!st.started){ st.started = true; api.start(); } save(); }
  function shift(pos, dir){ const j = nb(pos, dir); if (j < 0) return; swap(pos, j); sel = null; msg = ''; render(); }
  function tap(pos){ if (sel === null) sel = pos; else if (sel === pos) sel = null; else { swap(sel, pos); sel = null; } msg = ''; render(); }
  function check(){
    if (!st.started){ st.started = true; api.start(); }
    const res = st.order.map((pi,pos) => picks[pi] === sorted[pos]);
    st.attempts.push(res); st.locked = res.slice(); sel = null; save();
    const n = res.filter(Boolean).length, used = st.attempts.length;
    if (n === 5 || used >= MAXT){
      const won = n === 5;
      const grid = st.attempts.map(a => a.map(x => x ? '🟩' : '⬜').join('')).join('\n');
      msg = '';
      api.finish({won, score: won ? used : MAXT + 1,
        title: won ? (used === 1 ? 'Flawless boot-up' : 'In order') : 'Out of checks',
        detail: sorted.map(e => `${e[0]}: ${e[1]}`).join(' · '),
        summary: won ? `${used}/${MAXT}` : `X/${MAXT}`,
        share: `Daybook Cartridge No. ${DAY_NO}  ${won ? used : 'X'}/${MAXT}\n${grid}`});
      render(); return;
    }
    msg = `${n} of 5 in the right place. ${plural(MAXT - used, 'check')} left.`;
    render();
  }
  render();
  const prev = api.existing(); if (prev) api.show(prev);
  return () => {};
}

/* ---------- register ---------- */
register({id:'pantry', name:'Pantry', cat:'niche', mins:3, blurb:'Guess the dish from its ingredients, revealed one at a time.', mount:mountPantry,
  art:'<svg viewBox="0 0 120 80" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="3"><path d="M22 40h76a38 30 0 0 1-76 0z"/><path d="M14 40h92"/><path d="M46 28c0-6 6-6 6-12M62 28c0-6 6-6 6-12"/></g><circle cx="50" cy="48" r="4" fill="currentColor"/><circle cx="64" cy="52" r="4" fill="currentColor" fill-opacity=".45"/><circle cx="74" cy="46" r="3" fill="currentColor"/></svg>',
  how:['Each clue is an ingredient, from the least to the most telling. The last clue says where the dish comes from.','Type a dish and pick it from the list.','A wrong guess reveals the next clue. You can also take the next clue without guessing.','Name it within six clues to win. Fewer clues ranks higher.']});
register({id:'credits', name:'Credits', cat:'niche', mins:3, blurb:'Name the film from six clues: year, plot, runtime, director, star and a character.', mount:mountCredits,
  art:'<svg viewBox="0 0 120 80" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="3"><rect x="14" y="24" width="92" height="48" rx="4"/><path d="M14 24l10-16 14 4-8 12M38 12l16 4-8 8M54 16l16 4-8 4"/></g><g fill="currentColor"><rect x="26" y="38" width="44" height="5" rx="2.5"/><rect x="26" y="50" width="64" height="5" rx="2.5" fill-opacity=".45"/><rect x="26" y="62" width="30" height="5" rx="2.5" fill-opacity=".45"/></g></svg>',
  how:['Clues arrive one at a time: year and genre, a plot summary, runtime and country, director, a star, then a character.','Type a film and pick it from the list.','A wrong guess reveals the next clue. You can also take the next clue without guessing.','Name it within six clues to win. Fewer clues ranks higher.']});
register({id:'cartridge', name:'Cartridge', cat:'niche', mins:2, blurb:'Five landmark video games. Put them in order of release.', mount:mountCartridge,
  art:'<svg viewBox="0 0 120 80" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="3"><path d="M30 8h60v52l-6 6H36l-6-6z"/><rect x="40" y="18" width="40" height="26" rx="3"/></g><g fill="currentColor"><rect x="40" y="18" width="40" height="26" rx="3" fill-opacity=".2"/><rect x="38" y="54" width="6" height="12"/><rect x="50" y="54" width="6" height="12"/><rect x="62" y="54" width="6" height="12"/><rect x="74" y="54" width="6" height="12"/></g></svg>',
  how:['Put the five games in order of first release, earliest at the top.','Use the arrows, or tap two games to swap them.','You have three checks. Games in the right place turn green and lock.','Get all five right within three checks to win.']});
