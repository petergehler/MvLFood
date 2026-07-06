const state = {
  feed: null,
  todayDate: selectedDateFromUrl(),
  selectedDiets: new Set(),
  selectedSources: null,
  language: "en",
  hiddenAllergens: new Set(),
  hasDateOverride: hasDateOverrideFromUrl(),
};

const nodes = {
  appTitle: document.querySelector("#appTitle"),
  dateLabel: document.querySelector("#dateLabel"),
  menuList: document.querySelector("#menuList"),
  settingsButton: document.querySelector("#settingsButton"),
  settingsPanel: document.querySelector("#settingsPanel"),
  languageLabel: document.querySelector("#languageLabel"),
  languageGrid: document.querySelector("#languageGrid"),
  locationLabel: document.querySelector("#locationLabel"),
  locationGrid: document.querySelector("#locationGrid"),
  dietLabel: document.querySelector("#dietLabel"),
  dietGrid: document.querySelector("#dietGrid"),
  allergyLabel: document.querySelector("#allergyLabel"),
  allergyGrid: document.querySelector("#allergyGrid"),
  template: document.querySelector("#menuItemTemplate"),
};

const storageKey = "mvl-food-settings";
const languageOptions = [
  { value: "en", label: "English" },
  { value: "de", label: "Deutsch" },
  { value: "sw", label: "Schwäbisch" },
];
const dietOptions = ["vegan", "vegetarian", "fish", "meat"];
const translations = {
  en: {
    appTitle: "MvLFood",
    settings: "Settings",
    language: "Language",
    locations: "Locations",
    diet: "Diet",
    hideContaining: "Hide items containing",
    loading: "Loading...",
    loadError: "Could not load the menu feed.",
    noMatches: "No matching food options for today.",
    noMatchesForDate: "No matching food options for this date.",
    noMenu: "No menu listed for today.",
    noMenuForDate: "No menu listed for this date.",
    closedNow: "Closed",
    diets: {
      vegan: "vegan",
      vegetarian: "vegetarian",
      meat: "meat",
      fish: "fish",
    },
    categories: {
      "Vegan/Veggie": "Vegan/Veggie",
      "Food truck": "Food truck",
      "Add-on": "Add-on",
    },
    allergens: {
      "Wheat / gluten": "Wheat / gluten",
      "Oats / gluten": "Oats / gluten",
      "Rye / gluten": "Rye / gluten",
      "Milk / lactose": "Milk / lactose",
      Egg: "Egg",
      Mustard: "Mustard",
      Sesame: "Sesame",
      Soy: "Soy",
      Walnut: "Walnut",
      Hazelnut: "Hazelnut",
      Peanut: "Peanut",
      Fish: "Fish",
      "Milk / yogurt": "Milk / yogurt",
    },
  },
  de: {
    appTitle: "MvLFood",
    settings: "Einstellungen",
    language: "Sprache",
    locations: "Orte",
    diet: "Ernährung",
    hideContaining: "Ausblenden bei",
    loading: "Laden...",
    loadError: "Speiseplan konnte nicht geladen werden.",
    noMatches: "Heute keine passenden Angebote.",
    noMatchesForDate: "Keine passenden Angebote für dieses Datum.",
    noMenu: "Für heute ist kein Menü eingetragen.",
    noMenuForDate: "Für dieses Datum ist kein Menü eingetragen.",
    closedNow: "Geschlossen",
    diets: {
      vegan: "vegan",
      vegetarian: "vegetarisch",
      meat: "Fleisch",
      fish: "Fisch",
    },
    categories: {
      "Vegan/Veggie": "Vegan/Vegetarisch",
      "Food truck": "Foodtruck",
      "Add-on": "Extra",
    },
    allergens: {
      "Wheat / gluten": "Weizen / Gluten",
      "Oats / gluten": "Hafer / Gluten",
      "Rye / gluten": "Roggen / Gluten",
      "Milk / lactose": "Milch / Laktose",
      Egg: "Ei",
      Mustard: "Senf",
      Sesame: "Sesam",
      Soy: "Soja",
      Walnut: "Walnuss",
      Hazelnut: "Haselnuss",
      Peanut: "Erdnuss",
      Fish: "Fisch",
      "Milk / yogurt": "Milch / Joghurt",
    },
  },
  sw: {
    appTitle: "MvLEssa",
    settings: "Eischdellonga",
    language: "Sproch",
    locations: "Orte",
    diet: "Essa",
    hideContaining: "Ausblenda bei",
    loading: "Lädt...",
    loadError: "S' Menü hot sich et lada lassa.",
    noMatches: "Heit gibt's nix Passends.",
    noMatchesForDate: "Für des Datum gibt's nix Passends.",
    noMenu: "Für heit isch koi Menü drin.",
    noMenuForDate: "Für des Datum isch koi Menü drin.",
    closedNow: "Zua",
    diets: {
      vegan: "vegan",
      vegetarian: "vegetarisch",
      meat: "Fleisch",
      fish: "Fisch",
    },
    categories: {
      Salatbowl: "Salatschissl",
      "Pizza & Pasta": "Pizza & Nudla",
      Region: "Vo do",
      Main: "Hauptsach",
      "Vegan/Veggie": "Vegan/Vegetarisch",
      "Quick & Easy": "Schnell ond oifach",
      "Food truck": "Foodtruck",
      "Add-on": "Extra",
    },
    allergens: {
      "Wheat / gluten": "Weiza / Gluten",
      "Oats / gluten": "Hafer / Gluten",
      "Rye / gluten": "Rogga / Gluten",
      "Milk / lactose": "Milch / Laktose",
      Egg: "Ei",
      Mustard: "Senf",
      Sesame: "Sesam",
      Soy: "Soja",
      Walnut: "Walnuss",
      Hazelnut: "Haselnuss",
      Peanut: "Erdnuss",
      Fish: "Fisch",
      "Milk / yogurt": "Milch / Joghurt",
    },
  },
};
const englishDishes = {
  "Asiatische Nudelpfanne": {
    title: "Asian noodle pan",
    description: "Mie noodles with tofu, colorful wok vegetables, king oyster mushrooms, crispy chili oil and egg.",
  },
  "Hawaii Schnitzel": {
    title: "Hawaii schnitzel",
    description: "Breaded turkey schnitzel with coconut panko, pineapple, cheese, sweet-and-sour sauce and vegetable rice.",
  },
  "Tagliata di Manzo": {
    title: "Tagliata di Manzo",
    description: "Pink roast beef with arugula, tomato, onion, Grana Padano, potato and balsamic cream.",
  },
  "Saftiges Puten Gyros aus der Keule mit hausgemachtem Zaziki und Roten Zwiebeln": {
    title: "Juicy turkey gyros",
    description: "Turkey thigh gyros with homemade tzatziki and red onions.",
  },
  "Orientalisches Linsen Dal mit Roten Linsen in Kokosmilch": {
    title: "Oriental lentil dal",
    description: "Red lentils cooked in coconut milk.",
  },
  "Spaghetti aus dem Parmesanlaib": {
    title: "Spaghetti from the parmesan wheel",
    description: "Fresh spaghetti with truffle paste, Grana Padano and fried spinach leaves.",
  },
  "Japanische Ramen": {
    title: "Japanese ramen",
    description:
      "With duck strips, egg, udon noodles, lotus root, mung bean sprouts, snow peas, carrot, broccoli and bell pepper. Vegetarian option available.",
  },
  "Asia Bowl": {
    title: "Asia bowl",
    description:
      "Fried pak choi, glass noodles with vegetable strips, spring rolls, edamame, sesame oil, soy sauce and sweet chili sauce.",
  },
  "Ofenfrischer Schweinebraten mit Bier Soße": {
    title: "Oven-fresh roast pork",
    description: "Roast pork with beer sauce.",
  },
  "Hausgemachte Gemüselasagne mit mediterranem Gemüse in Tomaten-Béchamelsoße und Käse überbacken": {
    title: "Homemade vegetable lasagna",
    description: "Mediterranean vegetables in tomato bechamel sauce, baked with cheese.",
  },
  "Salat Nicoise": {
    title: "Salad Nicoise",
    description:
      "Potato, green beans, red onion, bell pepper, cucumber, tomato, mixed leaf salad, olives and marinated tuna.",
  },
  "Flammkuchen Pera é": {
    title: "Pear tarte flambee",
    description: "Gorgonzola creme fraiche with cheese, pear, gorgonzola, radicchio and walnuts.",
  },
  "Ofenfrischer Leberkäse": {
    title: "Oven-fresh Leberkaese",
    description: "With fried egg, melted onions, roast gravy and crispy potato slices.",
  },
  "Fly Away Chicken Burger": {
    title: "Fly Away chicken burger",
    description: "Crispy turkey breast filet with mango salsa, multigrain bun, frisee and rosemary fries.",
  },
  "Hähnchenbustfilet in knuspriger Panko Panade & Curry-Mango Dip": {
    title: "Crispy panko chicken breast",
    description: "Chicken breast filet in crispy panko breading with curry-mango dip.",
  },
  "Gebratene Asia Nudeln mit frischen Gemüsestreifen und Sojasoße": {
    title: "Fried Asian noodles",
    description: "Fried Asian noodles with fresh vegetable strips and soy sauce.",
  },
  "Pizza Diavolo": {
    title: "Pizza Diavolo",
    description: "Tomato sugo with spicy pepperoni salami, bell pepper strips, mushrooms and arugula. Vegetarian option available.",
  },
  "Paneer Butter Marsala": {
    title: "Paneer butter masala",
    description: "Paneer cheese with curry sauce, wild rice, vegetables and naan bread.",
  },
  "Rindergeschnetzeltes Stroganoff mit Sauerrahm, Essiggurken und Champignons": {
    title: "Beef Stroganoff",
    description: "Sliced beef Stroganoff with sour cream, pickles and mushrooms.",
  },
  "Hausgemachte gefüllte Zucchini mit Bulgur und mediterranem Gemüse überbacken mit Mozzarella Käse": {
    title: "Homemade stuffed zucchini",
    description: "Zucchini filled with bulgur and Mediterranean vegetables, baked with mozzarella.",
  },
  "Fischstäbchen-Wrap": {
    title: "Fish finger wrap",
    description: "Wheat wrap with fish fingers, red cabbage, bell pepper, sour cream, sriracha sauce and fries.",
  },
  "Vegetarischer Döner": {
    title: "Vegetarian doner",
    description:
      "Flatbread with iceberg lettuce, red cabbage, white cabbage, tomato, cucumber, onions, yogurt sauce, halloumi and fries.",
  },
  "Lachfilet im Spitzpaprika mit Kräutersoße": {
    title: "Salmon filet with pointed pepper",
    description: "Salmon filet with pointed pepper and herb sauce.",
  },
  "Kartoffeltaschen mit Frischkäsefüllung und Kräuterquark": {
    title: "Potato pockets with cream cheese",
    description: "Potato pockets with cream cheese filling and herb quark.",
  },
  "Italy Bowl": {
    title: "Italy bowl",
    description:
      "Leaf salad, arugula, burrata, cherry tomatoes, baguette, pesto, peach slices and Parma ham. Vegetarian option available.",
  },
  "Geschnetzeltes Züricher Art": {
    title: "Zurich-style sliced pork",
    description: "Sliced pork in a fine mushroom cream sauce.",
  },
  "Moussaka mit Kartoffeln": {
    title: "Moussaka with potatoes",
    description: "With eggplant and tomatoes.",
  },
  "Nacho bowl": {
    title: "Nacho bowl",
    description: "Mushrooms, peppers, zucchini, jalapeno, tortilla chips, rice, kidney beans and baby spinach with avocado dressing.",
  },
  "Rinder Frikadelle in feuriger": {
    title: "Beef patty in fiery paprika sauce",
    description: "Beef patty with spicy paprika sauce.",
  },
  "Asiatische Frühlingsrolle mit": {
    title: "Asian spring roll",
    description: "With sweet-and-sour sauce.",
  },
  "Bacon-Cheese-Burger": {
    title: "Bacon cheeseburger",
    description: "Brioche bun with beef patty, crispy bacon, jalapeños, cheese, burger sauce, truffle fries and sour cream dip.",
  },
  "Holzfällersteak von": {
    title: "Pork neck lumberjack steak",
    description: "With roast gravy and herb butter.",
  },
  "Bunte Schupfnudel Pfanne": {
    title: "Colorful schupfnudel pan",
    description: "With fresh vegetables and soy dip.",
  },
  "Bunte Gnocchi-Pfanne": {
    title: "Colorful gnocchi pan",
    description: "Fresh market vegetables with gnocchi, cress and herb quark.",
  },
  Streetfood: {
    title: "Pulled salmon burger",
    description:
      "Pulled salmon filet with wasabi horseradish cream, salad, marinated cucumber slices, sesame, cress and potato wedges.",
  },
  "Japanisches Putensteak": {
    title: "Japanese turkey steak tonkatsu",
    description: "With soy-honey glaze and black and white sesame.",
  },
  "Hausgemachte Gemüse": {
    title: "Homemade vegetable quiche",
    description: "With pesto dip.",
  },
  "Paniertes Seelachsfilet mit": {
    title: "Breaded pollock filet",
    description: "With homemade remoulade.",
  },
  "Grüner Udon Nudeltopf mit": {
    title: "Green udon noodle pot",
    description: "With Chinese cabbage, pak choi, spring onion and fried tofu.",
  },
  "Takara Surimi Bowl": {
    title: "Takara surimi bowl",
    description:
      "Jasmine rice with surimi, avocado, cucumber salad, mango, red onion, carrot, corn, roasted sesame and soy sauce.",
  },
  "Vegane Pilz Carbonara mit Spinat": {
    title: "Vegan mushroom carbonara with spinach",
    description: "Ribbon noodles with spinach, mushrooms, vegan mozzarella and cherry tomatoes.",
  },
  "Stollsteimer Currywurst": {
    title: "Stollsteimer currywurst",
    description: "Oberländer bratwurst with spicy curry sauce, colorful slaw and fries.",
  },
  "Oriental Wrap (vegan)": {
    title: "Oriental wrap (vegan)",
    description:
      "Braised pointed cabbage, yellow pepper, fried onions, radicchio, guacamole dip and salad greens with pomegranate dressing.",
  },
  "Ofenfrische Roastbeef Pizza": {
    title: "Oven-fresh roast beef pizza",
    description: "Roast beef slices with tomato sugo, fior di latte, red onions, arugula and parmesan.",
  },
  "Köfte-Sandwich": {
    title: "Kofte sandwich",
    description: "Beef kofte in flatbread with ajvar cream, cucumber yogurt, onion-parsley salad and baked potato wedges.",
  },
  "Cesar Bowl": {
    title: "Caesar bowl",
    description:
      "Romaine lettuce with chicken breast, herb croutons, cherry tomatoes, parmesan shavings and grilled vegetables. Vegetarian option available.",
  },
  "Vegane Vietnamesische": {
    title: "Vegan Vietnamese summer rolls",
    description: "Summer rolls with glass noodles, wok vegetables, spicy peanut-chili dip and a small mixed salad.",
  },
  "Piccata Milanese": {
    title: "Piccata Milanese",
    description: "Baked turkey schnitzel in a parmesan-egg crust with tomato spaghetti, wild garlic pesto and Grana Padano.",
  },
  "BBQ-Whiskey Burger": {
    title: "BBQ whiskey burger",
    description:
      "Brioche bun with beef patty, crispy bacon, jalapeños, cheese, BBQ whiskey sauce, baked onion rings and sour cream dip.",
  },
  "Ofenfrisches Pizza-Brot": {
    title: "Oven-fresh pizza bread",
    description: "Tomato sugo, red onions, balsamic tomatoes, mozzarella and baby leaf salad.",
  },
  "Bunte Schupfnudel-Pfanne": {
    title: "Colorful schupfnudel pan",
    description: "Fresh market vegetables with schupfnudeln, cress and herb quark.",
  },
  "Ofenfrisches Schweinefilet": {
    title: "Oven-fresh pork filet",
    description: "With pepper cream sauce, green beans, sour cream topping and fine ribbon noodles.",
  },
  "Original Fish and Chips": {
    title: "Original fish and chips",
    description: "Beer-battered fish filet with homemade tartar sauce, homestyle fries, lemon wedge and a small salad.",
  },
  "High Protein Bowl": {
    title: "High protein bowl",
    description:
      "Marinated chicken breast with bulgur, vegetable brunoise, skyr dip, roasted edamame, herb croutons, cherry tomatoes and egg.",
  },
  "Pasta al Arrabiata": {
    title: "Pasta all'arrabbiata",
    description: "With spicy tomato sauce, vegetable brunoise, parmesan and fried arugula.",
  },
  "Sheperds Pie": {
    title: "Shepherd's pie",
    description: "Seasoned beef mince baked under mashed potatoes, with rich gravy.",
  },
  "Vegane Paella": {
    title: "Vegan paella",
    description: "Yellow rice with peas, carrots, onions, peppers, broccoli and vegan sour cream dip.",
  },
  Thüringer: {
    title: "Thuringian bratwurst spiral",
    description: "With roast gravy.",
  },
  Vegane: {
    title: "Vegan crispy vegetable patty",
    description: "With carrot-orange sauce.",
  },
  "Pizza Nduja": {
    title: "Pizza 'nduja",
    description: "San Marzano tomato sauce, fior di latte, Italian sausage, peperoncino oil and fresh pecorino.",
  },
  "Asiatisches Blumenkohlcurry": {
    title: "Asian cauliflower curry",
    description: "With chickpeas, coconut milk, broccoli, carrots and cauliflower.",
  },
  "Summer Bowl: Bulgur, Wildkräuter": {
    title: "Summer bowl",
    description: "Bulgur, wild herbs, watermelon, cucumber, avocado, vegan feta, mint and lemon dressing.",
  },
  Ofenfrische: {
    title: "Oven-baked chicken thighs",
    description: "With BBQ dip.",
  },
  "Feuriges Chili sin Carne": {
    title: "Fiery chili sin carne",
    description: "With kidney beans, bell peppers and corn.",
  },
  "Spanische Bowl": {
    title: "Spanish bowl",
    description: "Gallo pinto, rice, red and black beans, Salsa Lizano and marinated chili-garlic shrimp.",
  },
  "Vegane Pasta ohne Ei": {
    title: "Vegan egg-free pasta",
    description: "With creamy coconut milk sauce, sweet potato cubes, baby spinach and braised cherry tomatoes.",
  },
  "Jägerschnitzel vom": {
    title: "Pork hunter schnitzel",
    description: "Pork loin with mushroom cream sauce, buttered noodles and almond broccoli.",
  },
  "Pulled Chicken Burger": {
    title: "Pulled chicken burger",
    description: "BBQ chicken in a sesame bun with fried onions, coleslaw and criss-cut fries.",
  },
  "Lasagne Bolognese": {
    title: "Lasagna Bolognese",
    description: "Beef Bolognese in tomato bechamel sauce, baked with mozzarella.",
  },
  "Süßkartoffelcurry mit": {
    title: "Sweet potato curry",
    description: "With fresh chard.",
  },
  "Pizza Rucola e Parma": {
    title: "Pizza arugula e Parma",
    description: "Pizza bread with San Marzano tomato sauce, fior di latte, Parma ham, arugula and Grana Padano.",
  },
  "Vegane Ofen-Backkartoffel": {
    title: "Vegan baked potato",
    description: "Crispy baked potato with fresh hummus, vegetables, lemon tahini, fresh herbs and roasted walnuts.",
  },
  "Streetfood: Ofenfrische Spare- Rips": {
    title: "Street food: oven-baked spare ribs",
    description: "Pork spare ribs with BBQ sauce, coleslaw and potato wedges.",
  },
  "Putengulasch in feiner": {
    title: "Turkey goulash",
    description: "In a fine paprika cream sauce.",
  },
  "Röstitaler mit Tomaten": {
    title: "Rosti rounds with tomato",
    description: "Baked with zucchini and mountain cheese.",
  },
  "Indisches Rotes Linsen-Dal": {
    title: "Indian red lentil dal",
    description:
      "Creamy red lentils in a spiced sauce with tomato, coconut milk, onions, garlic, ginger and Indian spices, served on basmati rice.",
  },
  "Vegane Falafel-Ebly-Pfanne": {
    title: "Vegan falafel and Ebly pan",
    description: "Crispy falafel on Mediterranean vegetables with a creamy vegan herb dip.",
  },
  Seelachsfilet: {
    title: "Pollock filet",
    description: "Mediterranean style with dried tomatoes, olives and tomato sauce.",
  },
  "Rührei mit Rahmspinat": {
    title: "Scrambled eggs with creamed spinach",
    description: "",
  },
  "Pita Gyros/Veggie/Halloumi/...": {
    title: "Pita Gyros/Veggie/Halloumi/...",
    description: "Pita sandwiches with gyros, souvlaki, bifteki, calamari, veggie, halloumi or meatless souvlaki.",
  },
  "Lunch Box Meat": {
    title: "Lunch Box Meat",
    description: "Choose a base of rice, couscous, salad, veggies or pita bread with souvlaki chicken, souvlaki pork, gyros or bifteki.",
  },
  "Lunch Box Veggie": {
    title: "Lunch Box Veggie",
    description: "Choose a base of rice, couscous, salad, veggies or pita bread with halloumi or grilled veggies.",
  },
  "Lunch Box Fish": {
    title: "Lunch Box Fish",
    description: "Choose a base of rice, couscous, salad, veggies or pita bread with calamari.",
  },
  Choriatiki: {
    title: "Choriatiki",
    description: "Greek farmer salad.",
  },
  "Cakes and Sweets": {
    title: "Cakes and Sweets",
    description: "A changing selection of cakes and sweet treats from Apoteka.",
  },
  "Lemon Poppy Pancakes": {
    title: "Lemon Poppy Pancakes",
    description: "Lemon poppy seed pancakes with homemade lemon curd, balsamic strawberries, maple syrup and lavender.",
  },
  "Chickpea Pancakes (gf)": {
    title: "Chickpea Pancakes (gf)",
    description:
      "Chickpea pancakes with lemon-herb hummus, grilled asparagus, fresh strawberries, microgreens and toasted almond flakes.",
  },
  "Crispy Miso-Lemon Polenta": {
    title: "Crispy Miso-Lemon Polenta",
    description: "Crispy miso-lemon polenta with roasted pointed cabbage, pickled radishes, pomegranate and chili oil.",
  },
  "Cardamom Porridge": {
    title: "Cardamom Porridge",
    description: "Cardamom porridge with rhubarb-strawberry compote and crunchy gluten-free granola.",
  },
  "Tortellini gefüllt mit Ricotta und Spinat": {
    title: "Ricotta and spinach tortellini",
    description: "Baked in tomato cream sauce with mozzarella, served with a small mixed salad.",
  },
  "Seelachsfilet in einer Ei-Parmesanhülle": {
    title: "Pollock filet in egg-parmesan crust",
    description: "With steakhouse fries, pickled vegetables, tartar sauce and fresh lemon.",
  },
  "Tagesgericht siehe Aushang": {
    title: "Daily dish",
    description: "Details are posted at the restaurant.",
  },
  Tagesessen: {
    title: "Daily dish",
    description: "Daily offer, details at the counter.",
  },
  "Rabas Empanadas": {
    title: "Rabas empanadas",
    description: "Squid strips in batter with aioli.",
  },
  "Alu Goobi: Indisches": {
    title: "Alu Goobi",
    description: "Indian potato and cauliflower curry.",
  },
};
const germanDishes = {
  "Asiatische Nudelpfanne": {
    title: "Asiatische Nudelpfanne",
    description: "Mie-Nudeln mit Tofu, buntem Wok-Gemüse, Kräutersaitlingen, Crispy-Chili-Öl und Ei.",
  },
  "Hawaii Schnitzel": {
    title: "Hawaii-Schnitzel",
    description: "Paniertes Putenschnitzel mit Kokospanko, Ananas, Käse, Süß-Sauer-Soße und Gemüsereis.",
  },
  "Tagliata di Manzo": {
    title: "Tagliata di Manzo",
    description: "Rosa Roastbeef mit Rucola, Tomate, Zwiebel, Grana Padano, Kartoffel und Balsamico-Creme.",
  },
  "Saftiges Puten Gyros aus der Keule mit hausgemachtem Zaziki und Roten Zwiebeln": {
    title: "Saftiges Puten-Gyros",
    description: "Aus der Keule mit hausgemachtem Zaziki und roten Zwiebeln.",
  },
  "Orientalisches Linsen Dal mit Roten Linsen in Kokosmilch": {
    title: "Orientalisches Linsen-Dal",
    description: "Rote Linsen in Kokosmilch.",
  },
  "Spaghetti aus dem Parmesanlaib": {
    title: "Spaghetti aus dem Parmesanlaib",
    description: "Frische Spaghetti mit Trüffelpaste, Grana Padano und frittiertem Blattspinat.",
  },
  "Japanische Ramen": {
    title: "Japanische Ramen",
    description:
      "Mit Entenstreifen, Ei, Udon-Nudeln, Lotuswurzel, Mungosprossen, Kaiserschoten, Karotte, Brokkoli und Paprika. Auch vegetarisch erhältlich.",
  },
  "Asia Bowl": {
    title: "Asia Bowl",
    description:
      "Gebratener Pak Choi, Glasnudeln mit Gemüsestreifen, Frühlingsröllchen, Edamame, Sesamöl, Sojasoße und Sweet-Chili-Soße.",
  },
  "Ofenfrischer Schweinebraten mit Bier Soße": {
    title: "Ofenfrischer Schweinebraten",
    description: "Mit Bier-Soße.",
  },
  "Hausgemachte Gemüselasagne mit mediterranem Gemüse in Tomaten-Béchamelsoße und Käse überbacken": {
    title: "Hausgemachte Gemüselasagne",
    description: "Mediterranes Gemüse in Tomaten-Béchamelsoße, mit Käse überbacken.",
  },
  "Salat Nicoise": {
    title: "Salat Nicoise",
    description:
      "Kartoffel, grüne Bohnen, rote Zwiebel, Paprika, Gurke, Tomate, bunter Blattsalat, Oliven und marinierter Thunfisch.",
  },
  "Flammkuchen Pera é": {
    title: "Flammkuchen Pera",
    description: "Gorgonzola-Creme-fraiche mit Käse, Birne, Gorgonzola, Radicchio und Walnüssen.",
  },
  "Ofenfrischer Leberkäse": {
    title: "Ofenfrischer Leberkäse",
    description: "Mit Spiegelei, Schmelzzwiebeln, Bratenjus und knusprigen Kartoffelscheiben.",
  },
  "Fly Away Chicken Burger": {
    title: "Fly Away Chicken Burger",
    description: "Knuspriges Putenbrustfilet mit Mango-Salsa, Mehrkorn-Bun, Frisee und Rosmarin-Pommes.",
  },
  "Hähnchenbustfilet in knuspriger Panko Panade & Curry-Mango Dip": {
    title: "Hähnchenbrustfilet in knuspriger Panko-Panade",
    description: "Mit Curry-Mango-Dip.",
  },
  "Gebratene Asia Nudeln mit frischen Gemüsestreifen und Sojasoße": {
    title: "Gebratene Asia-Nudeln",
    description: "Mit frischen Gemüsestreifen und Sojasoße.",
  },
  "Pizza Diavolo": {
    title: "Pizza Diavolo",
    description: "Tomatensugo mit scharfer Peperoni-Salami, Paprikastreifen, Champignons und Rucola. Auch vegetarisch erhältlich.",
  },
  "Paneer Butter Marsala": {
    title: "Paneer Butter Masala",
    description: "Paneer-Käse mit Currysoße, Wildreis, Gemüse und Naan-Brot.",
  },
  "Rindergeschnetzeltes Stroganoff mit Sauerrahm, Essiggurken und Champignons": {
    title: "Rindergeschnetzeltes Stroganoff",
    description: "Mit Sauerrahm, Essiggurken und Champignons.",
  },
  "Hausgemachte gefüllte Zucchini mit Bulgur und mediterranem Gemüse überbacken mit Mozzarella Käse": {
    title: "Hausgemachte gefüllte Zucchini",
    description: "Mit Bulgur und mediterranem Gemüse, überbacken mit Mozzarella.",
  },
  "Fischstäbchen-Wrap": {
    title: "Fischstäbchen-Wrap",
    description: "Weizen-Wrap mit Fischstäbchen, Rotkraut, Paprika, Schmand, Sriracha-Soße und Pommes frites.",
  },
  "Vegetarischer Döner": {
    title: "Vegetarischer Döner",
    description:
      "Fladenbrot mit Eisbergsalat, Rotkraut, Weißkraut, Tomate, Gurke, Zwiebeln, Joghurtsoße, Halloumi und Pommes frites.",
  },
  "Lachfilet im Spitzpaprika mit Kräutersoße": {
    title: "Lachsfilet mit Spitzpaprika",
    description: "Lachsfilet mit Spitzpaprika und Kräutersoße.",
  },
  "Kartoffeltaschen mit Frischkäsefüllung und Kräuterquark": {
    title: "Kartoffeltaschen mit Frischkäsefüllung",
    description: "Mit Kräuterquark.",
  },
  "Geschnetzeltes Züricher Art": {
    title: "Geschnetzeltes Züricher Art",
    description: "Vom Schwein in feiner Champignonrahmsoße.",
  },
  "Moussaka mit Kartoffeln": {
    title: "Moussaka mit Kartoffeln",
    description: "Mit Auberginen und Tomaten.",
  },
  "Nacho bowl": {
    title: "Nacho Bowl",
    description: "Champignons, Paprika, Zucchini, Jalapeno, Tortilla-Chips, Reis, Kidneybohnen und Babyspinat mit Avocado-Dressing.",
  },
  "Rinder Frikadelle in feuriger": {
    title: "Rinderfrikadelle in feuriger Paprikasoße",
    description: "Rinderfrikadelle mit feuriger Paprikasoße.",
  },
  "Asiatische Frühlingsrolle mit": {
    title: "Asiatische Frühlingsrolle",
    description: "Mit Süßsauer-Soße.",
  },
  "Bacon-Cheese-Burger": {
    title: "Bacon-Cheese-Burger",
    description: "Brioche-Bun mit Rinderpatty, knusprigem Bacon, Jalapeños, Käse, Burger-Soße, Trüffel-Pommes und Sour-Cream-Dip.",
  },
  "Holzfällersteak von": {
    title: "Holzfällersteak vom Schweinenacken",
    description: "Mit Bratenjus und Kräuterbutter.",
  },
  "Bunte Schupfnudel Pfanne": {
    title: "Bunte Schupfnudel-Pfanne",
    description: "Mit frischem Gemüse und Soja-Dip.",
  },
  "Bunte Gnocchi-Pfanne": {
    title: "Bunte Gnocchi-Pfanne",
    description: "Frisches Marktgemüse mit Gnocchi, Kresse und Kräuterquark.",
  },
  Streetfood: {
    title: "Pulled-Lachs-Burger",
    description:
      "Gezupftes Lachsfilet mit Wasabi-Meerrettichcreme, Salat, marinierten Gurkenscheiben, Sesam, Kresse und Wedges.",
  },
  "Japanisches Putensteak": {
    title: "Japanisches Putensteak Tonkatsu",
    description: "Mit Soja-Honigglasur und schwarzem und weißem Sesam.",
  },
  "Hausgemachte Gemüse": {
    title: "Hausgemachte Gemüse-Quiche",
    description: "Mit Pesto-Dip.",
  },
  "Paniertes Seelachsfilet mit": {
    title: "Paniertes Seelachsfilet",
    description: "Mit hausgemachter Remoulade.",
  },
  "Grüner Udon Nudeltopf mit": {
    title: "Grüner Udon-Nudeltopf",
    description: "Mit Chinakohl, Pak Choi, Frühlingslauch und gebratenem Tofu.",
  },
  "Takara Surimi Bowl": {
    title: "Takara Surimi Bowl",
    description:
      "Jasmin-Duftreis mit Surimi, Avocado, Gurkensalat, Mango, roter Zwiebel, Karotte, Mais, geröstetem Sesam und Sojasoße.",
  },
  "Vegane Pilz Carbonara mit Spinat": {
    title: "Vegane Pilz-Carbonara mit Spinat",
    description: "Wellenbandnudeln mit Blattspinat, Champignons, veganem Mozzarella und Cherrytomaten.",
  },
  "Stollsteimer Currywurst": {
    title: "Stollsteimer Currywurst",
    description: "Oberländer Bratwurst mit pikanter Currysoße, buntem Krautsalat und Pommes frites.",
  },
  "Oriental Wrap (vegan)": {
    title: "Oriental Wrap (vegan)",
    description:
      "Geschmorter Spitzkohl, gelbe Paprika, Röstzwiebeln, Radicchio, Guacamole-Dip und Pflücksalat mit Granatapfel-Dressing.",
  },
  "Ofenfrische Roastbeef Pizza": {
    title: "Ofenfrische Roastbeef-Pizza",
    description: "Roastbeef-Scheiben mit Tomatensugo, Fior di Latte, roten Zwiebeln, Rucola und Parmesan.",
  },
  "Köfte-Sandwich": {
    title: "Köfte-Sandwich",
    description: "Rinder-Köfte im Fladenbrot mit Ajvar-Creme, Gurken-Joghurt, Zwiebel-Petersilien-Salat und gebackenen Kartoffelecken.",
  },
  "Cesar Bowl": {
    title: "Caesar Bowl",
    description:
      "Romanasalat mit Hähnchenbrust, Kräutercroutons, Kirschtomaten, Parmesanspänen und Grillgemüse. Auch vegetarisch möglich.",
  },
  "Vegane Vietnamesische": {
    title: "Vegane vietnamesische Sommerrollen",
    description: "Sommerrollen mit Glasnudeln, Wok-Gemüse, scharfem Erdnuss-Chili-Dip und kleinem bunten Salat.",
  },
  "Piccata Milanese": {
    title: "Piccata Milanese",
    description: "Gebackenes Putenschnitzel in Parmesan-Ei-Hülle mit Tomaten-Spaghetti, Bärlauch-Pesto und Grana Padano.",
  },
  "BBQ-Whiskey Burger": {
    title: "BBQ-Whiskey-Burger",
    description:
      "Brioche-Bun mit Rinderpatty, knusprigem Bacon, Jalapeños, Käse, BBQ-Whiskey-Soße, gebackenen Zwiebelringen und Sour-Cream-Dip.",
  },
  "Ofenfrisches Pizza-Brot": {
    title: "Ofenfrisches Pizza-Brot",
    description: "Tomatensugo, rote Zwiebeln, Balsamico-Tomaten, Mozzarella und Baby-Leaf-Salat.",
  },
  "Bunte Schupfnudel-Pfanne": {
    title: "Bunte Schupfnudel-Pfanne",
    description: "Frisches Marktgemüse mit Schupfnudeln, Kresse und Kräuterquark.",
  },
  "Ofenfrisches Schweinefilet": {
    title: "Ofenfrisches Schweinefilet",
    description: "Mit Pfeffer-Rahmsoße, grünen Bohnen, Sauerrahm-Topping und feinen Bandnudeln.",
  },
  "Original Fish and Chips": {
    title: "Original Fish and Chips",
    description: "Fischfilet im Bierteig mit hausgemachter Tartarsoße, Homestyle-Pommes, Zitronenecke und kleinem Salat.",
  },
  "High Protein Bowl": {
    title: "High Protein Bowl",
    description:
      "Mariniertes Hähnchenbrustfilet mit Bulgur, Gemüsebrunoise, Skyrdip, gerösteten Edamame, Kräutercroutons, Kirschtomaten und Ei.",
  },
  "Pasta al Arrabiata": {
    title: "Pasta all'arrabbiata",
    description: "Mit scharfer Tomatensoße, Gemüsebrunoise, Parmesan und frittiertem Rucola.",
  },
  "Sheperds Pie": {
    title: "Shepherd's Pie",
    description: "Würziges Rinderhackfleisch mit Kartoffelpüree-Haube, überbacken mit kräftiger Bratensoße.",
  },
  "Vegane Paella": {
    title: "Vegane Paella",
    description: "Gelber Reis mit Erbsen, Karotten, Zwiebeln, Paprika, Brokkoli und veganem Sour-Cream-Dip.",
  },
  Thüringer: {
    title: "Thüringer Rostbratwurstschnecke",
    description: "Mit Bratenjus.",
  },
  Vegane: {
    title: "Vegane Gemüse-Knusperfrikadelle",
    description: "Mit Karotten-Orangensoße.",
  },
  "Pizza Nduja": {
    title: "Pizza 'nduja",
    description: "Mit San-Marzano-Tomatensugo, Fior di Latte, italienischer Bratwurst, Peperoncino-Öl und Pecorino.",
  },
  "Asiatisches Blumenkohlcurry": {
    title: "Asiatisches Blumenkohlcurry",
    description: "Mit Kichererbsen, Kokosmilch, Brokkoli, Karotten und Blumenkohl.",
  },
  "Summer Bowl: Bulgur, Wildkräuter": {
    title: "Summer Bowl",
    description: "Bulgur, Wildkräuter, Wassermelone, Gurke, Avocado, veganer Hirtenkäse, Minze und Zitronendressing.",
  },
  Ofenfrische: {
    title: "Ofenfrische Hähnchenschenkel",
    description: "Mit BBQ-Dip.",
  },
  "Feuriges Chili sin Carne": {
    title: "Feuriges Chili sin Carne",
    description: "Mit Kidneybohnen, Paprika und Mais.",
  },
  "Spanische Bowl": {
    title: "Spanische Bowl",
    description: "Gallo Pinto, Reis, rote und schwarze Bohnen, Salsa Lizano und marinierte Chili-Knoblauch-Garnelen.",
  },
  "Vegane Pasta ohne Ei": {
    title: "Vegane Pasta ohne Ei",
    description: "Mit cremiger Kokosmilchsoße, Süßkartoffelwürfeln, Babyspinat und geschmorten Kirschtomaten.",
  },
  "Jägerschnitzel vom": {
    title: "Jägerschnitzel vom Schweinerücken",
    description: "Mit Champignon-Rahmsoße, Butternudeln und Mandel-Brokkoli.",
  },
  "Pulled Chicken Burger": {
    title: "Pulled Chicken Burger",
    description: "BBQ-Chicken im Sesam-Bun mit Röstzwiebeln, Coleslaw und Criss-Cut-Fries.",
  },
  "Lasagne Bolognese": {
    title: "Lasagne Bolognese",
    description: "Vom Rind in Tomaten-Béchamelsoße, mit Mozzarella überbacken.",
  },
  "Süßkartoffelcurry mit": {
    title: "Süßkartoffelcurry",
    description: "Mit frischem Mangold.",
  },
  "Pizza Rucola e Parma": {
    title: "Pizza Rucola e Parma",
    description: "Pizzabrot mit San-Marzano-Tomatensoße, Fior di Latte, Parmaschinken, Rucola und Grana Padano.",
  },
  "Vegane Ofen-Backkartoffel": {
    title: "Vegane Ofen-Backkartoffel",
    description: "Knusprige Backkartoffel mit Hummus, Gemüse, Zitronen-Tahini, Kräutern und gerösteten Walnüssen.",
  },
  "Streetfood: Ofenfrische Spare- Rips": {
    title: "Streetfood: Ofenfrische Spareribs",
    description: "Vom Schwein mit BBQ-Soße, Coleslaw und Kartoffelwedges.",
  },
  "Putengulasch in feiner": {
    title: "Putengulasch",
    description: "In feiner Paprikarahmsoße.",
  },
  "Röstitaler mit Tomaten": {
    title: "Röstitaler mit Tomaten",
    description: "Mit Zucchini und Bergkäse überbacken.",
  },
  "Indisches Rotes Linsen-Dal": {
    title: "Indisches rotes Linsen-Dal",
    description:
      "Cremige rote Linsen mit Tomaten, Kokosmilch, Zwiebeln, Knoblauch, Ingwer und indischen Gewürzen, auf Basmatireis.",
  },
  "Vegane Falafel-Ebly-Pfanne": {
    title: "Vegane Falafel-Ebly-Pfanne",
    description: "Knusprige Falafel auf mediterranem Gemüse mit veganem Kräuterdip.",
  },
  Seelachsfilet: {
    title: "Seelachsfilet",
    description: "Mediterran mit getrockneten Tomaten, Oliven und Tomatensoße.",
  },
  "Rührei mit Rahmspinat": {
    title: "Rührei mit Rahmspinat",
    description: "",
  },
  "Italy Bowl": {
    title: "Italy Bowl",
    description:
      "Nudelsalat mit gegrilltem Gemüse, Mozzarella, Croutons, Hähnchenbrust, Rucola und italienischem Dressing.",
  },
  "Pasta Primavera": {
    title: "Pasta Primavera",
    description:
      "Frische Pasta mit Paprikapesto, Zucchini, Aubergine, Fenchel, getrockneten Tomaten und Panko-Crunch.",
  },
  "Green Thai Curry": {
    title: "Grünes Thai-Curry",
    description: "Wokgemüse in grüner Curry-Kokos-Soße mit Sesamreis und gerösteten Erdnüssen.",
  },
  "Putensteak with herb butter": {
    title: "Putensteak mit Kräuterbutter",
    description: "Gebratenes Putensteak mit Kräuterbutter.",
  },
  "Spinat-Dinkel Knuspermedaillon": {
    title: "Spinat-Dinkel-Knuspermedaillon",
    description: "Mit Gorgonzolasoße.",
  },
  Tagesessen: {
    title: "Tagesessen",
    description: "Tagesangebot, Details an der Ausgabe.",
  },
  "Spaghetti Aglio e Olio": {
    title: "Spaghetti Aglio e Olio",
    description: "Spaghetti in Kräuter-Knoblauch-Öl mit Grana Padano.",
  },
  "Bayrischer Biergarten Burger": {
    title: "Bayrischer Biergarten-Burger",
    description:
      "Fleischkäse im Laugenbrötchen mit Schmelzzwiebeln, süßer Senf-Mayonnaise und Bratkartoffeln.",
  },
  "Hackfleisch Bologneser Art": {
    title: "Hackfleisch Bologneser Art",
    description: "Mit Gemüsewürfeln, Tomatensoße und Grana Padano.",
  },
  "Couscous vegetable patty": {
    title: "Couscous-Gemüsebratling",
    description: "Hausgemachter Bratling mit Baba Ganoush.",
  },
  "Quinoa Thai Bowl": {
    title: "Quinoa-Thai-Bowl",
    description: "Quinoa, Gemüse, Edamame, Tofu und scharfes Limetten-Soja-Dressing.",
  },
  "Pasta Gorgonzola and pear": {
    title: "Pasta mit Gorgonzola und Birne",
    description: "Frische Pasta in cremiger Soße mit Gorgonzola, marinierter Birne und Walnüssen.",
  },
  "Spaghetti Bolognese": {
    title: "Spaghetti Bolognese",
    description: "Gemischtes Hackfleisch mit Tomatensugo, Gemüse und geriebenem Parmesan.",
  },
  "Japanese turkey schnitzel Tonkatsu": {
    title: "Japanisches Putenschnitzel Tonkatsu",
    description: "Mit Soja-Honig-Glasur, Sesam, Mie-Nudeln und asiatischem Krautsalat.",
  },
  "Pork medallions": {
    title: "Schweinemedaillons",
    description: "Schweinemedaillons in feiner Pfefferrahmsoße.",
  },
  "Vegan pasta with red lentils": {
    title: "Vegane Pasta mit roten Linsen",
    description: "Mit Kirschtomaten und Bärlauchpesto.",
  },
  "Schwaebische Bowl": {
    title: "Schwäbische Bowl",
    description:
      "Maultaschen auf hausgemachtem Kartoffelsalat mit Tomaten, Gurken und Röstzwiebeln.",
  },
  "Pizza Hawaii": {
    title: "Pizza Hawaii",
    description: "Pizzabrot mit San-Marzano-Tomatensoße, Fior di Latte, gekochtem Schinken und Ananas.",
  },
  "Baked Camembert": {
    title: "Gebackener Camembert",
    description: "Mit Wildpreiselbeeren, buntem Blattsalat und Baguettescheiben.",
  },
  "Braised chicken breast": {
    title: "Geschmorte Hähnchenbrust",
    description: "Geschmorte Hähnchenbrust in Orangensoße.",
  },
  "Cannelloni with spinach and ricotta": {
    title: "Cannelloni mit Spinat und Ricotta",
    description: "In Tomatensoße, mit Käse überbacken.",
  },
  "Pulled gyros wrap": {
    title: "Pulled-Gyros-Wrap",
    description: "Schweine-Wrap mit Eisbergsalat, Krautsalat und Zaziki, dazu Kartoffelwedges.",
  },
  "Ricotta and spinach tortellini": {
    title: "Tortellini mit Ricotta und Spinat",
    description: "In Tomaten-Sahne-Soße, mit Mozzarella überbacken, dazu ein kleiner gemischter Salat.",
  },
  "Tortellini gefüllt mit Ricotta und Spinat": {
    title: "Tortellini mit Ricotta und Spinat",
    description: "In Tomaten-Sahne-Soße, mit Mozzarella überbacken, dazu ein kleiner gemischter Salat.",
  },
  "Pollock filet in egg-parmesan crust": {
    title: "Seelachsfilet in Ei-Parmesan-Hülle",
    description: "Mit Steakhouse Fries, eingelegtem Gemüse, Tartarsoße und Zitrone.",
  },
  "Seelachsfilet in einer Ei-Parmesanhülle": {
    title: "Seelachsfilet in Ei-Parmesan-Hülle",
    description: "Mit Steakhouse Fries, eingelegtem Gemüse, Tartarsoße und Zitrone.",
  },
  "Daily dish": {
    title: "Tagesgericht",
    description: "Details hängen im Restaurant aus.",
  },
  "Tagesgericht siehe Aushang": {
    title: "Tagesgericht",
    description: "Details hängen im Restaurant aus.",
  },
  "Rabas empanadas": {
    title: "Rabas Empanadas",
    description: "Tintenfischstreifen im Backteig mit Aioli.",
  },
  "Rabas Empanadas": {
    title: "Rabas Empanadas",
    description: "Tintenfischstreifen im Backteig mit Aioli.",
  },
  "Alu Goobi": {
    title: "Alu Goobi",
    description: "Indisches Kartoffel-Blumenkohl-Curry.",
  },
  "Alu Goobi: Indisches": {
    title: "Alu Goobi",
    description: "Indisches Kartoffel-Blumenkohl-Curry.",
  },
  "Kadala Curry": {
    title: "Kadala Curry",
    description:
      "Traditionelles Kerala-Curry mit schwarzen Kichererbsen, hausgemachter Gewürzmischung, Zwiebeln, Mais, Ingwer, Knoblauch, Tomaten und Kokosmilch. Serviert mit Reis, Papadams, Kokos-Chutney, Rote-Bete-Joghurt-Salat und frittiertem Chili.",
  },
  "Chicken Masala": {
    title: "Chicken Masala",
    description:
      "Mariniertes Hähnchen mit hausgemachter Gewürzmischung, Zwiebeln, Tomaten, Ingwer, Knoblauch, Koriander und Kokosmilch. Serviert mit Reis, Papadams, Kokos-Chutney, Rote-Bete-Joghurt-Salat und frittiertem Chili.",
  },
  "Halloumi plate": {
    title: "Halloumi-Teller",
    description: "Griechischer Teller mit gegrilltem Halloumi, Salat, Pita und Dips.",
  },
  "Falafel pita": {
    title: "Falafel-Pita",
    description: "Falafel in Pita mit Salat, Kräutern und Tahini-Soße.",
  },
  "Gyros plate": {
    title: "Gyros-Teller",
    description: "Platzhalter bis das Yellow-Donkey-Menüfoto verfügbar ist.",
  },
  "Pita Gyros/Veggie/Halloumi/...": {
    title: "Pita Gyros/Veggie/Halloumi/...",
    description:
      "Pita-Sandwiches mit Gyros, Souvlaki, Bifteki, Calamari, Veggie, Halloumi oder meatless Souvlaki.",
  },
  "Lunch Box Meat": {
    title: "Lunch Box Fleisch",
    description:
      "Basis nach Wahl: Reis, Couscous, Salat, Gemüse oder Pitabrot mit Souvlaki Chicken, Souvlaki Pork, Gyros oder Bifteki.",
  },
  "Lunch Box Veggie": {
    title: "Lunch Box Veggie",
    description: "Basis nach Wahl: Reis, Couscous, Salat, Gemüse oder Pitabrot mit Halloumi oder Grillgemüse.",
  },
  "Lunch Box Fish": {
    title: "Lunch Box Fisch",
    description: "Basis nach Wahl: Reis, Couscous, Salat, Gemüse oder Pitabrot mit Calamari.",
  },
  Choriatiki: {
    title: "Choriatiki",
    description: "Griechischer Bauernsalat.",
  },
  "Lemon Poppy Pancakes": {
    title: "Zitronen-Mohn-Pancakes",
    description:
      "Zitronen-Mohn-Pancakes mit hausgemachtem Lemon Curd, Balsamico-Erdbeeren, Ahornsirup und Lavendel.",
  },
  "Chickpea Pancakes (gf)": {
    title: "Kichererbsen-Pancakes (glutenfrei)",
    description:
      "Kichererbsen-Pancakes mit Zitronen-Kräuter-Hummus, gegrilltem Spargel, frischen Erdbeeren, Microgreens und gerösteten Mandelblättchen.",
  },
  "Crispy Miso-Lemon Polenta": {
    title: "Knusprige Miso-Zitronen-Polenta",
    description:
      "Knusprige Miso-Zitronen-Polenta mit geröstetem Spitzkohl, eingelegten Radieschen, Granatapfel und Chili-Öl.",
  },
  "Cardamom Porridge": {
    title: "Kardamom-Porridge",
    description: "Kardamom-Porridge mit Rhabarber-Erdbeer-Kompott und knusprigem glutenfreiem Granola.",
  },
  "Cakes and Sweets": {
    title: "Kuchen und Süßes",
    description: "Wechselnde Auswahl an Kuchen und süßen Kleinigkeiten aus der Apoteka.",
  },
  "Thuringian bratwurst spiral": {
    title: "Thüringer Rostbratwurstschnecke",
    description: "Mit Bratenjus.",
  },
  "Vegan crispy patty": {
    title: "Vegane Knusperfrikadelle",
    description: "Mit Karotten-Orangen-Soße.",
  },
  "Summer bowl": {
    title: "Summer Bowl",
    description: "Bulgur, Wildkräuter, Wassermelone, Gurke, Avocado, veganer Hirtenkäse, Minze und Zitronendressing.",
  },
  "Oven-baked chicken thighs": {
    title: "Ofenfrische Hähnchenschenkel",
    description: "Mit BBQ-Dip.",
  },
  "Spicy chili sin carne": {
    title: "Feuriges Chili sin Carne",
    description: "Mit Kidneybohnen, Paprika und Mais.",
  },
  "Lasagna Bolognese": {
    title: "Lasagne Bolognese",
    description: "Vom Rind in Tomaten-Béchamelsoße, mit Mozzarella überbacken.",
  },
  "Sweet potato curry": {
    title: "Süßkartoffelcurry",
    description: "Mit frischem Mangold.",
  },
  "Street food: oven-fresh spare ribs": {
    title: "Streetfood: Ofenfrische Spare Ribs",
    description: "Vom Schwein mit BBQ-Soße, Coleslaw und Kartoffelwedges.",
  },
  "Turkey goulash": {
    title: "Putengulasch",
    description: "In feiner Paprikarahmsoße.",
  },
  "Roesti patties with tomato": {
    title: "Röstitaler mit Tomaten",
    description: "Mit Zucchini und Bergkäse überbacken.",
  },
  "Mediterranean pollock filet": {
    title: "Seelachsfilet mediterrane Art",
    description: "Mit getrockneten Tomaten, Oliven und Tomatensoße.",
  },
  "Scrambled eggs with creamed spinach": {
    title: "Rührei mit Rahmspinat",
    description: "Rührei mit Rahmspinat.",
  },
};
const swabianDishes = {
  "Asiatische Nudelpfanne": {
    title: "Asiatische Nudlpfann",
    description: "Mie-Nudla mit Tofu, buntem Wok-Gmias, Kräutersaitling, Crispy-Chili-Öl ond Ei.",
  },
  "Hawaii Schnitzel": {
    title: "Hawaii-Schnitzel",
    description: "Panierts Puta-Schnitzel mit Kokospanko, Ananas, Käs, Süß-Sauer-Soß ond Gmiasreis.",
  },
  "Tagliata di Manzo": {
    title: "Tagliata di Manzo",
    description: "Rosa Roastbeef mit Rucola, Tomata, Zwiebl, Grana Padano, Kartoffel ond Balsamico-Creme.",
  },
  "Saftiges Puten Gyros aus der Keule mit hausgemachtem Zaziki und Roten Zwiebeln": {
    title: "Saftigs Puta-Gyros",
    description: "Aus dr Keul mit hausgmachtem Zaziki ond rote Zwiebl.",
  },
  "Orientalisches Linsen Dal mit Roten Linsen in Kokosmilch": {
    title: "Orientalischs Linsa-Dal",
    description: "Rote Linsa in Kokosmilch.",
  },
  "Spaghetti aus dem Parmesanlaib": {
    title: "Spaghetti aus em Parmesanlaib",
    description: "Frische Spaghetti mit Trüffelpaste, Grana Padano ond frittiertem Blattspinat.",
  },
  "Japanische Ramen": {
    title: "Japanische Ramen",
    description:
      "Mit Entestreifa, Ei, Udon-Nudla, Lotuswurzel, Mungosprossa, Kaiserschota, Karotta, Brokkoli ond Paprika. Au vegetarisch erhältlich.",
  },
  "Asia Bowl": {
    title: "Asia Bowl",
    description:
      "Gebratener Pak Choi, Glasnudla mit Gmiasstreifa, Frühlingsröllla, Edamame, Sesamöl, Sojasoß ond Sweet-Chili-Soß.",
  },
  "Ofenfrischer Schweinebraten mit Bier Soße": {
    title: "Ofenfrischer Schweinsbrata",
    description: "Mit Bier-Soß.",
  },
  "Hausgemachte Gemüselasagne mit mediterranem Gemüse in Tomaten-Béchamelsoße und Käse überbacken": {
    title: "Hausgmachte Gmiaslasagne",
    description: "Mediterrans Gmias in Tomata-Béchamelsoß, mit Käs überbacka.",
  },
  "Salat Nicoise": {
    title: "Salat Nicoise",
    description:
      "Kartoffel, grüne Bohna, rote Zwiebl, Paprika, Gurka, Tomata, bunter Blattsalat, Oliva ond marinierter Thunfisch.",
  },
  "Flammkuchen Pera é": {
    title: "Flammkucha Pera",
    description: "Gorgonzola-Creme-fraiche mit Käs, Bira, Gorgonzola, Radicchio ond Walnüss.",
  },
  "Ofenfrischer Leberkäse": {
    title: "Ofenfrischer Leberkäs",
    description: "Mit Spiegelei, Schmelzzwiebl, Bratenjus ond knusprige Kartoffelscheiba.",
  },
  "Fly Away Chicken Burger": {
    title: "Fly Away Chicken Burger",
    description: "Knusprigs Putenbruschtfilet mit Mango-Salsa, Mehrkorn-Weckla, Frisee ond Rosmarin-Pommes.",
  },
  "Hähnchenbustfilet in knuspriger Panko Panade & Curry-Mango Dip": {
    title: "Hähnchenbruschtfilet in knuspriger Panko-Panad",
    description: "Mit Curry-Mango-Dip.",
  },
  "Gebratene Asia Nudeln mit frischen Gemüsestreifen und Sojasoße": {
    title: "Gebratene Asia-Nudla",
    description: "Mit frische Gmiasstreifa ond Sojasoß.",
  },
  "Pizza Diavolo": {
    title: "Pizza Diavolo",
    description: "Tomatesugo mit scharfer Peperoni-Salami, Paprikastreifa, Champignons ond Rucola. Au vegetarisch erhältlich.",
  },
  "Paneer Butter Marsala": {
    title: "Paneer Butter Masala",
    description: "Paneer-Käs mit Currysoß, Wildreis, Gmias ond Naan-Brot.",
  },
  "Rindergeschnetzeltes Stroganoff mit Sauerrahm, Essiggurken und Champignons": {
    title: "Rindergschnetzelts Stroganoff",
    description: "Mit Sauerrahm, Essiggurka ond Champignons.",
  },
  "Hausgemachte gefüllte Zucchini mit Bulgur und mediterranem Gemüse überbacken mit Mozzarella Käse": {
    title: "Hausgmachte gfüllte Zucchini",
    description: "Mit Bulgur ond mediterranem Gmias, mit Mozzarella überbacka.",
  },
  "Fischstäbchen-Wrap": {
    title: "Fischstäbchen-Wrap",
    description: "Weiza-Wrap mit Fischstäbchen, Rotkraut, Paprika, Schmand, Sriracha-Soß ond Pommes.",
  },
  "Vegetarischer Döner": {
    title: "Vegetarischer Döner",
    description:
      "Fladebrot mit Eisbergsalat, Rotkraut, Weißkraut, Tomata, Gurka, Zwiebl, Joghurtsoß, Halloumi ond Pommes.",
  },
  "Lachfilet im Spitzpaprika mit Kräutersoße": {
    title: "Lachsfilet mit Spitzpaprika",
    description: "Lachsfilet mit Spitzpaprika ond Kräutersoß.",
  },
  "Kartoffeltaschen mit Frischkäsefüllung und Kräuterquark": {
    title: "Kartoffeltascha mit Frischkäsfüllung",
    description: "Mit Kräuterquark.",
  },
  "Geschnetzeltes Züricher Art": {
    title: "Züricher Gschnetzelts",
    description: "Vom Schwein in feiner Champignonrahmsoß.",
  },
  "Moussaka mit Kartoffeln": {
    title: "Moussaka mit Kartoffla",
    description: "Mit Aubergina ond Tomata.",
  },
  "Nacho bowl": {
    title: "Nacho Bowl",
    description: "Champignons, Paprika, Zucchini, Jalapeno, Tortilla-Chips, Reis, Kidneybohna ond Babyspinat mit Avocado-Dressing.",
  },
  "Rinder Frikadelle in feuriger": {
    title: "Rinderfrikadell in feuriger Paprikasoß",
    description: "Rinderfrikadell mit feuriger Paprikasoß.",
  },
  "Asiatische Frühlingsrolle mit": {
    title: "Asiatische Frühlingsroll",
    description: "Mit Süßsauer-Soß.",
  },
  "Bacon-Cheese-Burger": {
    title: "Bacon-Cheese-Burger",
    description: "Brioche-Weckla mit Rindspatty, knusprigem Bacon, Jalapeños, Käs, Burgersoß, Trüffel-Pommes ond Sour-Cream-Dip.",
  },
  "Holzfällersteak von": {
    title: "Holzfällersteak vom Schweinenacka",
    description: "Mit Bratenjus ond Kräuterbutter.",
  },
  "Bunte Schupfnudel Pfanne": {
    title: "Bunte Schupfnudla-Pfann",
    description: "Mit frischem Gmias ond Soja-Dip.",
  },
  "Bunte Gnocchi-Pfanne": {
    title: "Bunte Gnocchi-Pfann",
    description: "Frischs Marktgmias mit Gnocchi, Kress ond Kräuterquark.",
  },
  Streetfood: {
    title: "Pulled-Lachs-Burger",
    description:
      "Zupfter Lachs mit Wasabi-Meerrettichcreme, Salat, marinierten Gurkascheiba, Sesam, Kress ond Wedges.",
  },
  "Japanisches Putensteak": {
    title: "Japanisches Puta-Schteak Tonkatsu",
    description: "Mit Soja-Honigglasur ond schwarzem ond weißem Sesam.",
  },
  "Hausgemachte Gemüse": {
    title: "Hausgmachte Gmias-Quiche",
    description: "Mit Pesto-Dip.",
  },
  "Paniertes Seelachsfilet mit": {
    title: "Panierts Seelachsfilet",
    description: "Mit hausgmachter Remoulade.",
  },
  "Grüner Udon Nudeltopf mit": {
    title: "Grüner Udon-Nudeltopf",
    description: "Mit Chinakohl, Pak Choi, Frühlingslauch ond bratenem Tofu.",
  },
  "Takara Surimi Bowl": {
    title: "Takara Surimi Bowl",
    description:
      "Jasminreis mit Surimi, Avocado, Gurkasalat, Mango, roter Zwiebl, Karotta, Mais, gröschtetem Sesam ond Sojasoß.",
  },
  "Vegane Pilz Carbonara mit Spinat": {
    title: "Vegane Pilz-Carbonara mit Schbinaat",
    description: "Wellenbandnudla mit Blattspinat, Champignons, veganem Mozzarella ond Kirschtomata.",
  },
  "Stollsteimer Currywurst": {
    title: "Stollsteimer Currywurscht",
    description: "Oberländer Bratwurscht mit pikanter Currysoß, buntem Krautsalat ond Pommes.",
  },
  "Oriental Wrap (vegan)": {
    title: "Oriental Wrap (vegan)",
    description:
      "Gschmorter Spitzkohl, gelbe Paprika, Röstzwiebl, Radicchio, Guacamole-Dip ond Pflücksalat mit Granatapfel-Dressing.",
  },
  "Ofenfrische Roastbeef Pizza": {
    title: "Ofenfrische Roastbeef-Pizza",
    description: "Roastbeef-Scheiba mit Tomatesugo, Fior di Latte, rote Zwiebl, Rucola ond Parmesan.",
  },
  "Köfte-Sandwich": {
    title: "Köfte-Sandwich",
    description: "Rinder-Köfte im Fladebrot mit Ajvar-Creme, Gurka-Joghurt, Zwiebl-Petersilie-Salat ond Backkartoffelecka.",
  },
  "Cesar Bowl": {
    title: "Caesar Bowl",
    description:
      "Romanasalat mit Hähnabruscht, Kräutercroutons, Kirschtomata, Parmesanspäna ond Grillgmias. Au vegetarisch möglich.",
  },
  "Vegane Vietnamesische": {
    title: "Vegane vietnamesische Sommerrolla",
    description: "Sommerrolla mit Glasnudla, Wok-Gmias, scharfem Erdnuss-Chili-Dip ond kloinem buntem Salat.",
  },
  "Piccata Milanese": {
    title: "Piccata Milanese",
    description: "Baggens Puta-Schnitzel in Parmesan-Ei-Hüll mit Tomata-Spaghetti, Bärlauch-Pesto ond Grana Padano.",
  },
  "BBQ-Whiskey Burger": {
    title: "BBQ-Whiskey-Burger",
    description:
      "Brioche-Weckla mit Rindspatty, knusprigem Bacon, Jalapeños, Käs, BBQ-Whiskey-Soß, baggene Zwiebelring ond Sour-Cream-Dip.",
  },
  "Ofenfrisches Pizza-Brot": {
    title: "Ofenfrischs Pizza-Brot",
    description: "Tomatesugo, rote Zwiebl, Balsamico-Tomata, Mozzarella ond Baby-Leaf-Salat.",
  },
  "Bunte Schupfnudel-Pfanne": {
    title: "Bunte Schupfnudla-Pfann",
    description: "Frischs Marktgmias mit Schupfnudla, Kress ond Kräuterquark.",
  },
  "Ofenfrisches Schweinefilet": {
    title: "Ofenfrischs Schweinefilet",
    description: "Mit Pfefferrahmsoß, grüne Bohna, Sauerrahm-Topping ond feine Bandnudla.",
  },
  "Original Fish and Chips": {
    title: "Original Fish and Chips",
    description: "Fischfilet im Bierteig mit hausgmachter Tartarsoß, Homestyle-Pommes, Zitronaeck ond kloinem Salat.",
  },
  "High Protein Bowl": {
    title: "High Protein Bowl",
    description:
      "Marinierts Hähnchenbruschtfilet mit Bulgur, Gmiasbrunoise, Skyrdip, gröschtete Edamame, Kräutercroutons, Kirschtomata ond Ei.",
  },
  "Pasta al Arrabiata": {
    title: "Pasta all'arrabbiata",
    description: "Mit scharfer Tomatesoß, Gmiasbrunoise, Parmesan ond frittiertem Rucola.",
  },
  "Sheperds Pie": {
    title: "Shepherd's Pie",
    description: "Würzigs Rinderhack mit Kartoffelpüree-Haub, überbacka mit kräftiger Bratensoß.",
  },
  "Vegane Paella": {
    title: "Vegane Paella",
    description: "Gelber Reis mit Erbsa, Karotta, Zwiebl, Paprika, Brokkoli ond veganem Sour-Cream-Dip.",
  },
  Thüringer: {
    title: "Thüringer Rostbratwurschtschnegg",
    description: "Mit Bratenjus.",
  },
  Vegane: {
    title: "Vegane Gmias-Knusperfrikadell",
    description: "Mit Karotta-Orangasoß.",
  },
  "Pizza Nduja": {
    title: "Pizza 'nduja",
    description:
      "Mit San-Marzano-Tomatesugo, Fior di Latte, italienischer Bratwurscht, Peperoncino-Öl ond Pecorino.",
  },
  "Asiatisches Blumenkohlcurry": {
    title: "Asiatisches Blumakohlcurry",
    description: "Mit Kichererbsa, Kokosmilch, Brokkoli, Karotta ond Blumakohl.",
  },
  "Summer Bowl: Bulgur, Wildkräuter": {
    title: "Summer Bowl",
    description: "Bulgur, Wildkräuter, Wassermelone, Gurka, Avocado, veganer Hirtenkäs, Minze ond Zitronedressing.",
  },
  Ofenfrische: {
    title: "Ofenfrische Hähnchenschenkl",
    description: "Mit BBQ-Dip.",
  },
  "Feuriges Chili sin Carne": {
    title: "Feurigs Chili sin Carne",
    description: "Mit Kidneybohna, Paprika ond Mais.",
  },
  "Spanische Bowl": {
    title: "Spanische Bowl",
    description: "Gallo Pinto, Reis, rote ond schwarze Bohna, Salsa Lizano ond marinierte Chili-Knoblauch-Garnela.",
  },
  "Vegane Pasta ohne Ei": {
    title: "Vegane Pasta ohne Ei",
    description: "Mit cremiger Kokosmilchsoß, Süßkartoffelwürfel, Babyspinat ond gschmorte Kirschtomata.",
  },
  "Jägerschnitzel vom": {
    title: "Jägerschnitzel vom Schweinerücka",
    description: "Mit Champignon-Rahmsoß, Butternudla ond Mandel-Brokkoli.",
  },
  "Pulled Chicken Burger": {
    title: "Pulled Chicken Burger",
    description: "BBQ-Chicken im Sesam-Bun mit Röstzwiebl, Coleslaw ond Criss-Cuts.",
  },
  "Lasagne Bolognese": {
    title: "Lasagne Bolognese",
    description: "Vom Rind in Tomata-Béchamelsoß, mit Mozzarella überbacka.",
  },
  "Süßkartoffelcurry mit": {
    title: "Süßkartoffelcurry",
    description: "Mit frischem Mangold.",
  },
  "Pizza Rucola e Parma": {
    title: "Pizza Rucola e Parma",
    description: "Pizzabrot mit San-Marzano-Tomatesoß, Fior di Latte, Parmaschinka, Rucola ond Grana Padano.",
  },
  "Vegane Ofen-Backkartoffel": {
    title: "Vegane Ofa-Backkartoffel",
    description: "Knusprige Backkartoffel mit Hummus, Gmias, Zitrona-Tahini, Kräuter ond gröschtete Walnüss.",
  },
  "Streetfood: Ofenfrische Spare- Rips": {
    title: "Streetfood: Ofenfrische Spareribs",
    description: "Vom Schwein mit BBQ-Soß, Coleslaw ond Kartoffelwedges.",
  },
  "Putengulasch in feiner": {
    title: "Putengulasch",
    description: "In feiner Paprikarahmsoß.",
  },
  "Röstitaler mit Tomaten": {
    title: "Röstitaler mit Tomata",
    description: "Mit Zucchini ond Bergkäs überbacka.",
  },
  "Indisches Rotes Linsen-Dal": {
    title: "Indisches rots Linsa-Dal",
    description:
      "Cremige rote Linsa mit Tomata, Kokosmilch, Zwiebl, Knoblauch, Ingwer ond indische Gwürz, auf Basmatireis.",
  },
  "Vegane Falafel-Ebly-Pfanne": {
    title: "Vegane Falafel-Ebly-Pfann",
    description: "Knusprige Falafel auf mediterranem Gmias mit veganem Kräuterdip.",
  },
  Seelachsfilet: {
    title: "Seelachsfilet",
    description: "Mediterran mit trocknete Tomata, Oliva ond Tomatesoß.",
  },
  "Rührei mit Rahmspinat": {
    title: "Rührei mit Rahmspinat",
    description: "",
  },
  "Italy Bowl": {
    title: "Italienische Schissl",
    description:
      "Nudlsalat mit Grillgmias, Mozzarella, Croutons, Hähnabruscht, Rucola ond italienischem Dressing.",
  },
  "Pasta Primavera": {
    title: "Pasta Primavera",
    description:
      "Frische Nudla mit Paprikapesto, Zucchini, Aubergine, Fenchel, trocknade Tomata ond knusprigem Panko.",
  },
  "Green Thai Curry": {
    title: "Grüas Thai-Curry",
    description: "Wokgmias in Curry-Kokos-Soß mit Sesamreis ond gröschtete Erdnüss.",
  },
  "Putensteak with herb butter": {
    title: "Puta-Schteak mit Kräuterbutter",
    description: "Gbratens Puta-Schteak mit Kräuterbutter.",
  },
  "Spinat-Dinkel Knuspermedaillon": {
    title: "Schbinaat-Dinkel-Knuspermedaillon",
    description: "Mit Gorgonzola-Soß.",
  },
  Tagesessen: {
    title: "Dagesessa",
    description: "Dagesangebot, Details am Tresen.",
  },
  "Spaghetti Aglio e Olio": {
    title: "Spaghetti Aglio e Olio",
    description: "Spaghetti in Kräuter-Knoblauch-Öl mit Grana Padano.",
  },
  "Bayrischer Biergarten Burger": {
    title: "Bayerischer Biergarta-Burger",
    description:
      "Fleischkäs im Laugabweggla mit gschmälzte Zwiebla, süßer Senf-Mayo ond Bratkartoffla.",
  },
  "Hackfleisch Bologneser Art": {
    title: "Hackfleisch Bologneser Art",
    description: "Mit Gmiaswürfla, Tomatensoß ond Grana Padano.",
  },
  "Couscous vegetable patty": {
    title: "Couscous-Gmiasbratling",
    description: "Hausgmachter Bratling mit Baba Ganoush.",
  },
  "Quinoa Thai Bowl": {
    title: "Quinoa-Thai-Schissl",
    description: "Quinoa, Gmias, Edamame, Tofu ond scharfes Limetta-Soja-Dressing.",
  },
  "Pasta Gorgonzola and pear": {
    title: "Pasta mit Gorgonzola ond Bira",
    description: "Frische Nudla in cremiger Soß mit Gorgonzola, Bira ond Walnüss.",
  },
  "Spaghetti Bolognese": {
    title: "Spaghetti Bolognese",
    description: "Hackfleisch mit Tomatasugo, Gmias ond Parmesan.",
  },
  "Japanese turkey schnitzel Tonkatsu": {
    title: "Japanisches Puta-Schnitzel Tonkatsu",
    description: "Mit Soja-Honig-Glasur, Sesam, Mie-Nudla ond asiatischem Krautsalat.",
  },
  "Pork medallions": {
    title: "Schweinemedaillons",
    description: "Schweinemedaillons in feiner Pfefferrahmsoß.",
  },
  "Vegan pasta with red lentils": {
    title: "Vegane Pasta mit rote Lensa",
    description: "Mit Kirschtomata ond Bärlauchpesto.",
  },
  "Schwaebische Bowl": {
    title: "Schwäbische Schissl",
    description:
      "Maultascha auf hausgmachtem Kartoffelsalat mit Tomata, Gurka ond Röstzwiebla.",
  },
  "Pizza Hawaii": {
    title: "Pizza Hawaii",
    description: "Pizzabrot mit Tomatasoß, Fior di Latte, Schinka ond Ananas.",
  },
  "Baked Camembert": {
    title: "Baggener Camembert",
    description: "Mit Wildpreiselbeera, buntem Blattsalat ond Baguettescheiba.",
  },
  "Braised chicken breast": {
    title: "Gschmorte Hähnabruscht",
    description: "Gschmorte Hähnabruscht in Orangasoß.",
  },
  "Cannelloni with spinach and ricotta": {
    title: "Cannelloni mit Schbinaat ond Ricotta",
    description: "In Tomatasoß, mit Käs überbacka.",
  },
  "Pulled gyros wrap": {
    title: "Pulled-Gyros-Wickel",
    description: "Schweine-Wrap mit Eisbergsalat, Krautsalat ond Zaziki, drzua Kartoffelwedges.",
  },
  "Ricotta and spinach tortellini": {
    title: "Tortellini mit Ricotta ond Schbinaat",
    description: "In Tomata-Sahne-Soß, mit Mozzarella überbacka, drzua a kloiner Salat.",
  },
  "Tortellini gefüllt mit Ricotta und Spinat": {
    title: "Tortellini mit Ricotta ond Schbinaat",
    description: "In Tomata-Sahne-Soß, mit Mozzarella überbacka, drzua a kloiner Salat.",
  },
  "Pollock filet in egg-parmesan crust": {
    title: "Seelachsfilet in Ei-Parmesan-Hüll",
    description: "Mit Steakhouse Fries, aiglegtem Gmias, Tartarsoß ond Zitrone.",
  },
  "Seelachsfilet in einer Ei-Parmesanhülle": {
    title: "Seelachsfilet in Ei-Parmesan-Hüll",
    description: "Mit Steakhouse Fries, aiglegtem Gmias, Tartarsoß ond Zitrone.",
  },
  "Daily dish": {
    title: "Dagesgricht",
    description: "Details hänget im Restaurant aus.",
  },
  "Tagesgericht siehe Aushang": {
    title: "Dagesgricht",
    description: "Details hänget im Restaurant aus.",
  },
  "Rabas empanadas": {
    title: "Rabas Empanadas",
    description: "Tintenfischstreifa im Backdaig mit Aioli.",
  },
  "Rabas Empanadas": {
    title: "Rabas Empanadas",
    description: "Tintenfischstreifa im Backdaig mit Aioli.",
  },
  "Alu Goobi": {
    title: "Alu Goobi",
    description: "Indisches Kartoffel-Blumakohl-Curry.",
  },
  "Alu Goobi: Indisches": {
    title: "Alu Goobi",
    description: "Indisches Kartoffel-Blumakohl-Curry.",
  },
  "Kadala Curry": {
    title: "Kadala Curry",
    description:
      "Kerala-Curry mit schwarze Kichererbsen, hausgmachter Gwürzmischung, Zwiebla, Mais, Ingwer, Knoblauch, Tomata ond Kokosmilch. Drzua Reis, Papadams, Kokos-Chutney, Rote-Bete-Joghurt-Salat ond frittierter Chili.",
  },
  "Chicken Masala": {
    title: "Hähna Masala",
    description:
      "Marinierts Hähna mit hausgmachter Gwürzmischung, Zwiebla, Tomata, Ingwer, Knoblauch, Koriander ond Kokosmilch. Drzua Reis, Papadams, Kokos-Chutney, Rote-Bete-Joghurt-Salat ond frittierter Chili.",
  },
  "Pita Gyros/Veggie/Halloumi/...": {
    title: "Pita Gyros/Veggie/Halloumi/...",
    description:
      "Pita-Weckla mit Gyros, Souvlaki, Bifteki, Calamari, Veggie, Halloumi oder meatless Souvlaki.",
  },
  "Lunch Box Meat": {
    title: "Lunch Box Fleisch",
    description:
      "Basis zom Aussuacha: Reis, Couscous, Salat, Gmias oder Pitabrot mit Souvlaki Chicken, Souvlaki Pork, Gyros oder Bifteki.",
  },
  "Lunch Box Veggie": {
    title: "Lunch Box Veggie",
    description: "Basis zom Aussuacha: Reis, Couscous, Salat, Gmias oder Pitabrot mit Halloumi oder Grillgmias.",
  },
  "Lunch Box Fish": {
    title: "Lunch Box Fisch",
    description: "Basis zom Aussuacha: Reis, Couscous, Salat, Gmias oder Pitabrot mit Calamari.",
  },
  Choriatiki: {
    title: "Choriatiki",
    description: "Griechischer Bauresalat.",
  },
  "Lemon Poppy Pancakes": {
    title: "Zitrone-Mohn-Pancakes",
    description:
      "Zitrone-Mohn-Pancakes mit hausgmachtem Lemon Curd, Balsamico-Erdbeera, Ahornsirup ond Lavendel.",
  },
  "Chickpea Pancakes (gf)": {
    title: "Kichererbsen-Pancakes (glutenfrei)",
    description:
      "Kichererbsen-Pancakes mit Zitrone-Kräuter-Hummus, grilltem Schpargl, frische Erdbeera, Microgreens ond gröschtete Mandelblättla.",
  },
  "Crispy Miso-Lemon Polenta": {
    title: "Knusprige Miso-Zitrone-Polenta",
    description:
      "Knusprige Miso-Zitrone-Polenta mit gröschtetem Spitzkohl, aiglegte Radiesle, Granatapfel ond Chili-Öl.",
  },
  "Cardamom Porridge": {
    title: "Kardamom-Porridge",
    description: "Kardamom-Porridge mit Rhabarber-Erdbeer-Kompott ond knusprigem glutenfreiem Granola.",
  },
  "Cakes and Sweets": {
    title: "Kucha ond Süßes",
    description: "Wechselnde Auswahl an Kucha ond süße Kleinigkeita aus dr Apoteka.",
  },
  "Thuringian bratwurst spiral": {
    title: "Thüringer Brotwurschtschneck",
    description: "Mit Bratejus.",
  },
  "Vegan crispy patty": {
    title: "Vegane Knusperfrikadell",
    description: "Mit Karotta-Oranga-Soß.",
  },
  "Summer bowl": {
    title: "Summer Bowl",
    description: "Bulgur, Wildkräuter, Wassermelone, Gurke, Avocado, veganer Hirtenkäs, Minze ond Zitronadressing.",
  },
  "Oven-baked chicken thighs": {
    title: "Ofenfrische Hähnaschenkel",
    description: "Mit BBQ-Dip.",
  },
  "Spicy chili sin carne": {
    title: "Feurigs Chili sin Carne",
    description: "Mit Kidneybohna, Paprika ond Mais.",
  },
  "Lasagna Bolognese": {
    title: "Lasagne Bolognese",
    description: "Vom Rind in Tomata-Béchamelsoß, mit Mozzarella überbacka.",
  },
  "Sweet potato curry": {
    title: "Süßkartoffelcurry",
    description: "Mit frischem Mangold.",
  },
  "Street food: oven-fresh spare ribs": {
    title: "Streetfood: Ofenfrische Spare Ribs",
    description: "Vom Schwein mit BBQ-Soß, Coleslaw ond Kartoffelwedges.",
  },
  "Turkey goulash": {
    title: "Putagulasch",
    description: "In feiner Paprikarahmsoß.",
  },
  "Roesti patties with tomato": {
    title: "Röstitaler mit Tomata",
    description: "Mit Zucchini ond Bergkäs überbacka.",
  },
  "Mediterranean pollock filet": {
    title: "Seelachsfilet mediterrane Art",
    description: "Mit trocknete Tomata, Oliva ond Tomatasoß.",
  },
  "Scrambled eggs with creamed spinach": {
    title: "Rührei mit Rahmspinat",
    description: "Rührei mit Rahmspinat.",
  },
};
const icons = {
  restaurant:
    '<svg class="badge-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M4 3v7a3 3 0 0 0 3 3h1v8"></path><path d="M4 7h8"></path><path d="M8 3v18"></path><path d="M18 3a4 4 0 0 0-4 4v6h4v8"></path></svg>',
  truck:
    '<svg class="badge-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M14 18V6a2 2 0 0 0-2-2H4v14"></path><path d="M14 9h4l3 4v5h-7"></path><circle cx="7" cy="18" r="2"></circle><circle cx="17" cy="18" r="2"></circle></svg>',
  pin:
    '<svg class="badge-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M12 21s7-5.2 7-11a7 7 0 0 0-14 0c0 5.8 7 11 7 11Z"></path><circle cx="12" cy="10" r="2.5"></circle></svg>',
};

init();

async function init() {
  loadSettings();
  bindEvents();
  await loadFeed();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js");
  }
}

function bindEvents() {
  nodes.settingsButton.addEventListener("click", () => {
    const isOpen = !nodes.settingsPanel.hidden;
    nodes.settingsPanel.hidden = isOpen;
    nodes.settingsButton.setAttribute("aria-expanded", String(!isOpen));

    if (!isOpen) {
      requestAnimationFrame(() => {
        nodes.settingsPanel.scrollIntoView({ block: "start" });
      });
    }
  });
}

async function loadFeed() {
  try {
    const response = await fetch("data/menu.json", { cache: "no-cache" });

    if (!response.ok) {
      throw new Error(`Menu feed returned ${response.status}`);
    }

    state.feed = await response.json();
    ensureSelectedSources();
    render();
  } catch (error) {
    nodes.menuList.innerHTML = `<div class="empty-state">${t("loadError")} ${error.message}</div>`;
  }
}

function render() {
  renderChrome();
  renderSettings();
  renderMenu();
}

function renderChrome() {
  document.documentElement.lang = state.language;
  nodes.appTitle.textContent = t("appTitle");
  document.title = t("appTitle");
  nodes.dateLabel.textContent = formatDate(state.todayDate);
  nodes.settingsButton.ariaLabel = t("settings");
  nodes.settingsButton.title = t("settings");
}

function renderSettings() {
  nodes.languageLabel.textContent = t("language");
  nodes.locationLabel.textContent = t("locations");
  nodes.dietLabel.textContent = t("diet");
  nodes.allergyLabel.textContent = t("hideContaining");
  renderLanguageChoices();
  renderLocationChoices();
  renderDietChoices();
  renderAllergyChoices();
}

function renderLanguageChoices() {
  nodes.languageGrid.innerHTML = "";

  for (const option of languageOptions) {
    const button = document.createElement("button");
    const selected = state.language === option.value;
    button.className = "choice-chip";
    button.type = "button";
    button.setAttribute("aria-pressed", String(selected));
    button.textContent = option.label;
    button.addEventListener("click", () => {
      if (state.language === option.value) return;

      state.language = option.value;
      saveSettings();
      render();
    });

    nodes.languageGrid.append(button);
  }
}

function renderLocationChoices() {
  ensureSelectedSources();
  nodes.locationGrid.innerHTML = "";

  for (const [sourceId, source] of Object.entries(state.feed.sources)) {
    const button = document.createElement("button");
    const selected = state.selectedSources.has(sourceId);
    button.className = "choice-chip";
    button.classList.add("location-choice", sourceId);
    button.type = "button";
    button.ariaLabel = source.name || sourceId;
    button.setAttribute("aria-pressed", String(selected));
    button.append(sourceMark(source));
    button.addEventListener("click", () => {
      if (state.selectedSources.has(sourceId)) {
        state.selectedSources.delete(sourceId);
      } else {
        state.selectedSources.add(sourceId);
      }
      saveSettings();
      renderSettings();
      renderMenu();
    });

    nodes.locationGrid.append(button);
  }
}

function renderDietChoices() {
  nodes.dietGrid.innerHTML = "";

  for (const diet of dietOptions) {
    const button = document.createElement("button");
    const selected = state.selectedDiets.has(diet);
    button.className = "choice-chip";
    button.type = "button";
    button.setAttribute("aria-pressed", String(selected));
    button.textContent = dietLabel(diet);
    button.addEventListener("click", () => {
      if (state.selectedDiets.has(diet)) {
        state.selectedDiets.delete(diet);
      } else {
        state.selectedDiets.add(diet);
      }
      saveSettings();
      renderSettings();
      renderMenu();
    });

    nodes.dietGrid.append(button);
  }
}

function renderAllergyChoices() {
  nodes.allergyGrid.innerHTML = "";

  for (const allergen of allergenGroups()) {
    const button = document.createElement("button");
    const selected = allergen.codes.some((code) => state.hiddenAllergens.has(code));
    const label = allergenLabel(allergen.label);
    button.className = "choice-chip";
    button.classList.add("allergy-choice");
    button.type = "button";
    button.title = `${label} (${allergen.codes.join(", ")})`;
    button.ariaLabel = label;
    button.setAttribute("aria-pressed", String(selected));
    button.textContent = label;
    button.addEventListener("click", () => {
      if (allergen.codes.some((code) => state.hiddenAllergens.has(code))) {
        allergen.codes.forEach((code) => state.hiddenAllergens.delete(code));
      } else {
        allergen.codes.forEach((code) => state.hiddenAllergens.add(code));
      }
      saveSettings();
      renderSettings();
      renderMenu();
    });

    nodes.allergyGrid.append(button);
  }
}

function allergenGroups() {
  const groups = new Map();

  for (const allergen of state.feed.allergens) {
    const key = allergen.label.toLowerCase();
    const group = groups.get(key) || { label: allergen.label, codes: [] };
    if (!group.codes.includes(allergen.code)) {
      group.codes.push(allergen.code);
    }
    groups.set(key, group);
  }

  return [...groups.values()];
}

function renderMenu() {
  const selectedDay = state.feed.days.find((day) => day.date === state.todayDate);
  const items = selectedDay ? selectedDay.items.filter(keepItem) : [];
  nodes.menuList.innerHTML = "";

  if (!items.length) {
    nodes.menuList.innerHTML = selectedDay
      ? `<div class="empty-state">${t(state.hasDateOverride ? "noMatchesForDate" : "noMatches")}</div>`
      : `<div class="empty-state">${t(state.hasDateOverride ? "noMenuForDate" : "noMenu")}</div>`;
    return;
  }

  for (const item of items) {
    nodes.menuList.append(renderItem(item));
  }
}

function keepItem(item) {
  ensureSelectedSources();

  if (!state.selectedSources.has(item.source)) {
    return false;
  }

  if (state.selectedDiets.size && !dietMatches(item)) {
    return false;
  }

  return !item.allergens.some((code) => state.hiddenAllergens.has(code));
}

function dietMatches(item) {
  const diets = Array.isArray(item.diets) ? item.diets : [item.diet];
  if (diets.some((diet) => state.selectedDiets.has(diet))) return true;
  return diets.includes("vegan") && state.selectedDiets.has("vegetarian");
}

function renderItem(item) {
  const source = state.feed.sources[item.source] || {};
  const element = nodes.template.content.firstElementChild.cloneNode(true);
  const watermark = element.querySelector(".source-watermark");

  const text = itemText(item);
  element.querySelector("h2").textContent = text.title;
  element.querySelector(".description").textContent = text.description || "";
  renderAvailability(element, item, source);

  if (source.logo) {
    watermark.src = source.logo;
    watermark.alt = "";
    watermark.classList.add(item.source);
  } else {
    watermark.remove();
  }

  return element;
}

function renderAvailability(element, item, source) {
  const availability = element.querySelector(".availability");
  const status = availabilityStatus(item, source);

  if (status !== "closed") {
    availability.hidden = true;
    return;
  }

  element.classList.add("is-closed");
  availability.hidden = false;
  availability.textContent = t("closedNow");
}

function availabilityStatus(item, source) {
  if (new URLSearchParams(window.location.search).has("mockClosed")) {
    return "closed";
  }

  const now = new Date();
  const today = localDateString(now);

  if (today !== state.todayDate) {
    return "unknown";
  }

  const intervals = openingIntervalsFor(item, source, today);
  if (!intervals.length) {
    return "unknown";
  }

  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const isOpen = intervals.some((interval) => {
    const start = timeToMinutes(interval.start);
    const end = timeToMinutes(interval.end);
    return start !== null && end !== null && minutesNow >= start && minutesNow < end;
  });

  return isOpen ? "open" : "closed";
}

function openingIntervalsFor(item, source, dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  const weekday = new Date(year, month - 1, day).getDay();
  const itemHours = item.openingHours;

  if (itemHours?.date === dateString) {
    return itemHours.intervals || [];
  }

  if (itemHours?.days?.includes(weekday)) {
    return itemHours.intervals || [];
  }

  const sourceHours = source.openingHours;
  const sourceRule = sourceHours?.rules?.find((rule) => rule.days?.includes(weekday));
  if (sourceRule) {
    return sourceRule.intervals || [];
  }

  if (sourceHours?.days?.includes(weekday)) {
    return sourceHours.intervals || [];
  }

  return [];
}

function timeToMinutes(time) {
  if (!time) return null;
  const [hours, minutes] = time.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
}

function dietLabel(diet) {
  return t("diets")[diet] || diet;
}

function categoryLabel(category) {
  return t("categories")[category] || category;
}

function allergenLabel(label) {
  return t("allergens")[label] || label;
}

function itemText(item) {
  if (state.language === "en" && englishDishes[item.title]) {
    return englishDishes[item.title];
  }

  if (state.language === "de" && germanDishes[item.title]) {
    return germanDishes[item.title];
  }

  if (state.language === "sw" && swabianDishes[item.title]) {
    return swabianDishes[item.title];
  }

  return {
    title: item.title,
    description: item.description,
  };
}

function iconForSource(source) {
  if (source.kind === "truck") return icons.truck;
  if (source.kind === "restaurant") return icons.restaurant;
  return icons.pin;
}

function sourceMark(source) {
  if (source.logo) {
    const image = document.createElement("img");
    image.className = "source-logo";
    image.src = source.logo;
    image.alt = "";
    image.loading = "lazy";
    return image;
  }

  const wrapper = document.createElement("span");
  wrapper.innerHTML = iconForSource(source);
  return wrapper.firstElementChild;
}

function localDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function selectedDateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const explicitDate = params.get("date");
  if (/^\d{4}-\d{2}-\d{2}$/.test(explicitDate || "")) return explicitDate;

  if (params.get("date") === "tomorrow") {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return localDateString(tomorrow);
  }

  return localDateString(new Date());
}

function hasDateOverrideFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.has("date");
}

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
    state.language = saved.language || detectLanguage();
    state.selectedDiets = new Set((saved.selectedDiets || []).filter((diet) => dietOptions.includes(diet)));
    state.selectedSources = Array.isArray(saved.selectedSources) ? new Set(saved.selectedSources) : null;
    if (saved.veggieOnly && !saved.selectedDiets) {
      state.selectedDiets = new Set(["vegan", "vegetarian"]);
    }
    state.hiddenAllergens = new Set(saved.hiddenAllergens || []);
  } catch {
    state.language = detectLanguage();
    state.selectedDiets = new Set();
    state.selectedSources = null;
    state.hiddenAllergens = new Set();
  }
}

function saveSettings() {
  localStorage.setItem(
    storageKey,
    JSON.stringify({
      language: state.language,
      selectedDiets: [...state.selectedDiets],
      selectedSources: state.selectedSources ? [...state.selectedSources] : null,
      hiddenAllergens: [...state.hiddenAllergens],
    }),
  );
}

function ensureSelectedSources() {
  if (!state.feed) return;

  const allSources = Object.keys(state.feed.sources);
  if (!state.selectedSources) {
    state.selectedSources = new Set(allSources);
    return;
  }

  state.selectedSources = new Set([...state.selectedSources].filter((sourceId) => allSources.includes(sourceId)));
}

function formatDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  const locale = ["de", "sw"].includes(state.language) ? "de-DE" : "en-US";
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(year, month - 1, day));
}

function t(key) {
  return translations[state.language]?.[key] || translations.en[key];
}

function detectLanguage() {
  return navigator.language?.toLowerCase().startsWith("de") ? "de" : "en";
}
