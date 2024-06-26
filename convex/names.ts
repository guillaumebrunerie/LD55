const adjectives = [
	"Great",
	"Wise",
	"Noble",
	"Courageous",
	"Stupendous",
	"Stupid",
	"Crazy",
	"Irrational",
	"Attractive",
	"Bald",
	"Bold",
	"Beautiful",
	"Handsome",
	"Kind",
	"Clumsy",
	"Flabby",
	"Glamourous",
	"Unsightly",
	"Ambitious",
	"Faithful",
	"Graceful",
	"Meek",
	"Gentle",
	"Jolly",
	"Fervent",
	"Brave",
	"Bewildered",
	"Faultless",
	"Fierce",
	"Mysterious",
	"Puny",
	"Jealous",
	"Depressed",
	"Annoying",
	"Strange",
	"Bloody",
	"Magnificent",
	"Tired",
	"Fragile",
	"Frail",
	"Feeble",
	"Colorful",
	"Adventurous",
	"Exuberant",
	"Philosophical",
	"Sensible",
	"Sympathetic",
	"Humble",
	"Strong",
	"Calamitous",
	"Feckless",
	"Naïve",
	"Youthful",
	"Guileless",
	"Irksome",
	"Nefarious",
	"Obtuse",
	"Tremulous",
	"Turbulent",
	"Voracious",
	"Zealous",
	"Greasy",
	"Salty",
	"Terrible",
	"Fierce",
	"Creepy",
	"Friendly",
	"Humorous",
	"Lucky",
	"Flamboyant",
	"Gaudy",
	"Despicable",
	"Brackish",
	"Gullible",
	"Flaccid",
	"Spirited",
	"Docile",
	"Pretentious",
	"Eccentric",
	"Towering",
	"Lanky",
	"Curvaceous",
	"Desperate",
	"Diabolical",
	"Pitiful",
	"Proud",
	"Petty",
	"Enthusiastic",
	"Entertaining",
	"Radiant",
	"Scrawny",
	"Reluctant",
	"Revered",
	"Famous",
	"Illustrious",
	"Celebrated",
	"Zany",
	"Imposing",
	"Flirtatious",
	"Formidable",
];

const names = [
	"Abaris",
	"Abraham",
	"Adalard",
	"Adelita",
	"Adnos",
	"Albertus",
	"Antero",
	"Arnas",
	"Artemis",
	"Athan",
	"Augustus",
	"Axar",
	"Balin",
	"Bane",
	"Baran",
	"Bartley",
	"Bella",
	"Bradford",
	"Bryce",
	"Cadmus",
	"Callum",
	"Cassius",
	"Cleets",
	"Conrad",
	"Cormac",
	"Cornelius",
	"Damazo",
	"Darby",
	"Delina",
	"Dirk",
	"Dominic",
	"Dorim",
	"Doyle",
	"Drest",
	"Dusan",
	"Dutch",
	"Eidos",
	"Eldrith",
	"Elim",
	"Ellie",
	"Enaro",
	"Estorus",
	"Faris",
	"Felix",
	"Firenze",
	"Franz",
	"Friedrich",
	"Gaius",
	"Galadriel",
	"Galea",
	"Galen",
	"Gareth",
	"Gerald",
	"Gunther",
	"Hama",
	"Heinrich",
	"Hellmut",
	"Hoyt",
	"Hurin",
	"Hurley",
	"Iro",
	"Jamis",
	"Jareth",
	"Josiah",
	"Julian",
	"Kara",
	"Karsa",
	"Kastor",
	"Keaton",
	"Kelkor",
	"Kenneth",
	"Kerr",
	"Krugis",
	"Laraib",
	"Lee",
	"Lessthel",
	"Leto",
	"Lobo",
	"Londo",
	"Lux",
	"Lyta",
	"Magnus",
	"Manly",
	"Manus",
	"Marcus",
	"Matthias",
	"Max",
	"Merrick",
	"Mira",
	"Mitra",
	"Morden",
	"Morgan",
	"Narkissos",
	"Nebbish",
	"Neos",
	"Neroon",
	"Neville",
	"Nigel",
	"Nigella",
	"Numa",
	"Ojamar",
	"Omar",
	"Oswald",
	"Phineas",
	"Podar",
	"Ramsey",
	"Robert",
	"Roddy",
	"Rubeus",
	"Saliar",
	"Salvatore",
	"Samuel",
	"Sasha",
	"Saul",
	"Scorpius",
	"Seamus",
	"Senan",
	"Shaka",
	"Sherman",
	"Siegfried",
	"Sinclair",
	"Sindarin",
	"Sirius",
	"Skyler",
	"Sowar",
	"Stism",
	"Strahd",
	"Talisma",
	"Taramis",
	"Tavon",
	"Thorin",
	"Tobias",
	"Tory",
	"Ulric",
	"Vatoris",
	"Velius",
	"Vince",
	"Vir",
	"Vorn",
	"Walden",
	"Walter",
	"Xarann",
	"Zathar",
	"Ziro",
];

export const pickName = () => {
	const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
	const baseName = names[Math.floor(Math.random() * names.length)];
	return `${adjective} ${baseName}`;
};
