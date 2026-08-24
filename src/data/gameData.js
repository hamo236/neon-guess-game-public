/**
 * NEON GUESS — Game Dataset
 * 132 verified items across 4 categories: 68 football, 19 sports, 21 cartoons, 24 animals. Ice Hockey is intentionally excluded.
 * Local images served from /public/images/.
 */

export const CATEGORIES = {
  CARTOONS: 'cartoons',
  FOOTBALL: 'football',
  SPORTS: 'sports',
  ANIMALS: 'animals',
};

// Public assets must include Vite's configured base path on GitHub Pages.
const resolveImagePath = (path) => {
  if (!path || !path.startsWith('/')) return path;
  const base = (import.meta.env && import.meta.env.BASE_URL) || '/';
  return `${base.replace(/\/$/, '')}${path}`;
};

const resolveItemImages = (items) =>
  Object.fromEntries(
    Object.entries(items).map(([key, item]) => [key, { ...item, image: resolveImagePath(item.image) }]),
  );

const resolveImages = (items) =>
  items.map((item) => ({ ...item, image: resolveImagePath(item.image) }));

export const CATEGORY_META = resolveItemImages({
  [CATEGORIES.CARTOONS]: {
    id: CATEGORIES.CARTOONS,
    label: 'Cartoon Characters',
    icon: 'animation',
    image: '/images/cartoons/elsa.jpg',
  },
  [CATEGORIES.FOOTBALL]: {
    id: CATEGORIES.FOOTBALL,
    label: 'Football Players',
    icon: 'sports_soccer',
    image: '/images/football/antoine-griezmann.jpg',
  },
  [CATEGORIES.SPORTS]: {
    id: CATEGORIES.SPORTS,
    label: 'Types of Sports',
    icon: 'sports',
    image: '/images/sports/handball.jpg',
  },
  [CATEGORIES.ANIMALS]: {
    id: CATEGORIES.ANIMALS,
    label: 'Animals',
    icon: 'pets',
    image: '/images/animals/bear.jpg',
  },
});

/** All 132 verified game items — local JPG assets in /public/images/. */
export const ALL_ITEMS = resolveImages([
  // ── CARTOON CHARACTERS (15) ─────────────────────────────────────────────────
  { id: 'c01', name: 'Elsa', category: CATEGORIES.CARTOONS, image: '/images/cartoons/elsa.jpg' },
  { id: 'c02', name: 'Anna', category: CATEGORIES.CARTOONS, image: '/images/cartoons/anna.jpg' },
  { id: 'c03', name: 'Olaf', category: CATEGORIES.CARTOONS, image: '/images/cartoons/olaf.jpg' },
  { id: 'c04', name: 'Simba', category: CATEGORIES.CARTOONS, image: '/images/cartoons/simba.jpg' },
  { id: 'c05', name: 'Woody', category: CATEGORIES.CARTOONS, image: '/images/cartoons/woody.jpg' },
  { id: 'c06', name: 'Buzz Lightyear', category: CATEGORIES.CARTOONS, image: '/images/cartoons/buzz-lightyear.jpg' },
  { id: 'c07', name: 'Shrek', category: CATEGORIES.CARTOONS, image: '/images/cartoons/shrek.jpg' },
  { id: 'c08', name: 'Minion Bob', category: CATEGORIES.CARTOONS, image: '/images/cartoons/minion-bob.jpg' },
  { id: 'c09', name: 'Po', category: CATEGORIES.CARTOONS, image: '/images/cartoons/po.jpg' },
  { id: 'c10', name: 'SpongeBob', category: CATEGORIES.CARTOONS, image: '/images/cartoons/spongebob.jpg' },
  { id: 'c11', name: 'Mickey Mouse', category: CATEGORIES.CARTOONS, image: '/images/cartoons/mickey-mouse.jpg' },
  { id: 'c12', name: 'Tom', category: CATEGORIES.CARTOONS, image: '/images/cartoons/tom.jpg' },
  { id: 'c13', name: 'Jerry', category: CATEGORIES.CARTOONS, image: '/images/cartoons/jerry.jpg' },
  { id: 'c14', name: 'Spider-Man', category: CATEGORIES.CARTOONS, image: '/images/cartoons/spider-man.jpg' },
  { id: 'c15', name: 'Pikachu', category: CATEGORIES.CARTOONS, image: '/images/cartoons/pikachu.jpg' },
  { id: 'c16', name: 'Ben 10', category: CATEGORIES.CARTOONS, image: '/images/cartoons/ben-10.jpg' },
  { id: 'c17', name: 'Scooby-Doo', category: CATEGORIES.CARTOONS, image: '/images/cartoons/scooby-doo.jpg' },
  { id: 'c18', name: 'Mario', category: CATEGORIES.CARTOONS, image: '/images/cartoons/mario.jpg' },
  { id: 'c19', name: 'Sonic the Hedgehog', category: CATEGORIES.CARTOONS, image: '/images/cartoons/sonic-the-hedgehog.jpg' },
  { id: 'c20', name: 'Darwin Watterson', category: CATEGORIES.CARTOONS, image: '/images/cartoons/darwin-watterson.jpg' },
  { id: 'c21', name: 'Robin', category: CATEGORIES.CARTOONS, image: '/images/cartoons/robin-teen-titans.jpg' },

  // ── FOOTBALL PLAYERS (68) ────────────────────────────────────────────────────
  { id: 'f01', name: 'Antoine Griezmann', category: CATEGORIES.FOOTBALL, image: '/images/football/antoine-griezmann.jpg' },
  { id: 'f02', name: 'Bruno Fernandes', category: CATEGORIES.FOOTBALL, image: '/images/football/bruno-fernandes.jpg' },
  { id: 'f03', name: 'Bukayo Saka', category: CATEGORIES.FOOTBALL, image: '/images/football/bukayo-saka.jpg' },
  { id: 'f04', name: 'Rodri', category: CATEGORIES.FOOTBALL, image: '/images/football/rodri.jpg' },
  { id: 'f05', name: 'Lautaro Martínez', category: CATEGORIES.FOOTBALL, image: '/images/football/lautaro-martinez.jpg' },
  { id: 'f06', name: 'Kevin De Bruyne', category: CATEGORIES.FOOTBALL, image: '/images/football/kevin-de-bruyne.jpg' },
  { id: 'f07', name: 'Jude Bellingham', category: CATEGORIES.FOOTBALL, image: '/images/football/jude-bellingham.jpg' },
  { id: 'f08', name: 'Luka Modrić', category: CATEGORIES.FOOTBALL, image: '/images/football/luka-modric.jpg' },
  { id: 'f09', name: 'Thibaut Courtois', category: CATEGORIES.FOOTBALL, image: '/images/football/thibaut-courtois.jpg' },
  { id: 'f10', name: 'Robert Lewandowski', category: CATEGORIES.FOOTBALL, image: '/images/football/robert-lewandowski.jpg' },
  { id: 'f11', name: 'Pedri', category: CATEGORIES.FOOTBALL, image: '/images/football/pedri.jpg' },
  { id: 'f12', name: 'Karim Benzema', category: CATEGORIES.FOOTBALL, image: '/images/football/karim-benzema.jpg' },
  { id: 'f13', name: 'Harry Kane', category: CATEGORIES.FOOTBALL, image: '/images/football/harry-kane.jpg' },
  { id: 'f14', name: 'Virgil van Dijk', category: CATEGORIES.FOOTBALL, image: '/images/football/virgil-van-dijk.jpg' },
  { id: 'f15', name: 'Son Heung-min', category: CATEGORIES.FOOTBALL, image: '/images/football/son-heung-min.jpg' },
  { id: 'f16', name: 'Alisson Becker', category: CATEGORIES.FOOTBALL, image: '/images/football/alisson-becker.jpg' },
  { id: 'f17', name: 'Ederson', category: CATEGORIES.FOOTBALL, image: '/images/football/ederson.jpg' },
  { id: 'f18', name: 'Emiliano Martínez', category: CATEGORIES.FOOTBALL, image: '/images/football/emiliano-martinez.jpg' },
  { id: 'f19', name: 'Kylian Mbappé', category: CATEGORIES.FOOTBALL, image: '/images/football/kylian-mbappe.jpg' },
  { id: 'f20', name: 'Chris Wood', category: CATEGORIES.FOOTBALL, image: '/images/football/chris-wood.jpg' },
  { id: 'f21', name: 'Jean-Philippe Mateta', category: CATEGORIES.FOOTBALL, image: '/images/football/jean-philippe-mateta.jpg' },
  { id: 'f22', name: 'Bernardo Silva', category: CATEGORIES.FOOTBALL, image: '/images/football/bernardo-silva.jpg' },
  { id: 'f23', name: 'Jamal Musiala', category: CATEGORIES.FOOTBALL, image: '/images/football/jamal-musiala.jpg' },
  { id: 'f24', name: 'Phil Foden', category: CATEGORIES.FOOTBALL, image: '/images/football/phil-foden.jpg' },
  { id: 'f25', name: 'Viktor Gyökeres', category: CATEGORIES.FOOTBALL, image: '/images/football/viktor-gyokeres.jpg' },
  { id: 'f26', name: 'Jeremie Frimpong', category: CATEGORIES.FOOTBALL, image: '/images/football/jeremie-frimpong.jpg' },
  { id: 'f28', name: 'Bryan Mbeumo', category: CATEGORIES.FOOTBALL, image: '/images/football/bryan-mbeumo.jpg' },
  { id: 'f29', name: 'Morgan Gibbs-White', category: CATEGORIES.FOOTBALL, image: '/images/football/morgan-gibbs-white.jpg' },

  { id: 'f30', name: 'Alexis Sánchez', category: CATEGORIES.FOOTBALL, image: '/images/football/alexis-sanchez.jpg' },
  { id: 'f31', name: 'Andrea Pirlo', category: CATEGORIES.FOOTBALL, image: '/images/football/andrea-pirlo.jpg' },
  { id: 'f32', name: 'Andrés Iniesta', category: CATEGORIES.FOOTBALL, image: '/images/football/andres-iniesta.jpg' },
  { id: 'f33', name: 'Ángel Di María', category: CATEGORIES.FOOTBALL, image: '/images/football/angel-di-maria.jpg' },
  { id: 'f34', name: 'Arjen Robben', category: CATEGORIES.FOOTBALL, image: '/images/football/arjen-robben.jpg' },
  { id: 'f35', name: 'Dani Alves', category: CATEGORIES.FOOTBALL, image: '/images/football/dani-alves.jpg' },
  { id: 'f36', name: 'David Silva', category: CATEGORIES.FOOTBALL, image: '/images/football/david-silva.jpg' },
  { id: 'f37', name: 'David Villa', category: CATEGORIES.FOOTBALL, image: '/images/football/david-villa.jpg' },
  { id: 'f38', name: 'Eden Hazard', category: CATEGORIES.FOOTBALL, image: '/images/football/eden-hazard.jpg' },
  { id: 'f39', name: 'Fernando Torres', category: CATEGORIES.FOOTBALL, image: '/images/football/fernando-torres.jpg' },
  { id: 'f40', name: 'Franck Ribéry', category: CATEGORIES.FOOTBALL, image: '/images/football/franck-ribery.jpg' },
  { id: 'f41', name: 'Gareth Bale', category: CATEGORIES.FOOTBALL, image: '/images/football/gareth-bale.jpg' },
  { id: 'f42', name: 'Gerard Piqué', category: CATEGORIES.FOOTBALL, image: '/images/football/gerard-pique.jpg' },
  { id: 'f43', name: 'Giorgio Chiellini', category: CATEGORIES.FOOTBALL, image: '/images/football/giorgio-chiellini.jpg' },
  { id: 'f44', name: 'Hugo Lloris', category: CATEGORIES.FOOTBALL, image: '/images/football/hugo-lloris.jpg' },
  { id: 'f45', name: 'Isco', category: CATEGORIES.FOOTBALL, image: '/images/football/isco.jpg' },
  { id: 'f46', name: 'James Rodríguez', category: CATEGORIES.FOOTBALL, image: '/images/football/james-rodriguez.jpg' },
  { id: 'f47', name: 'John Terry', category: CATEGORIES.FOOTBALL, image: '/images/football/john-terry.jpg' },
  { id: 'f48', name: 'Kaká', category: CATEGORIES.FOOTBALL, image: '/images/football/kaka.jpg' },
  { id: 'f49', name: 'Keylor Navas', category: CATEGORIES.FOOTBALL, image: '/images/football/keylor-navas.jpg' },
  { id: 'f50', name: 'Luís Figo', category: CATEGORIES.FOOTBALL, image: '/images/football/luis-figo.jpg' },
  { id: 'f51', name: 'Luis Suárez', category: CATEGORIES.FOOTBALL, image: '/images/football/luis-suarez.jpg' },
  { id: 'f52', name: 'Marcelo', category: CATEGORIES.FOOTBALL, image: '/images/football/marcelo.jpg' },
  { id: 'f53', name: 'Marco Reus', category: CATEGORIES.FOOTBALL, image: '/images/football/marco-reus.jpg' },
  { id: 'f54', name: 'Mario Götze', category: CATEGORIES.FOOTBALL, image: '/images/football/mario-gotze.jpg' },
  { id: 'f55', name: 'Mesut Özil', category: CATEGORIES.FOOTBALL, image: '/images/football/mesut-ozil.jpg' },
  { id: 'f56', name: 'Philipp Lahm', category: CATEGORIES.FOOTBALL, image: '/images/football/philipp-lahm.jpg' },
  { id: 'f57', name: 'Raphaël Varane', category: CATEGORIES.FOOTBALL, image: '/images/football/raphael-varane.jpg' },
  { id: 'f58', name: 'Raphinha', category: CATEGORIES.FOOTBALL, image: '/images/football/raphinha.jpg' },
  { id: 'f59', name: 'Rayan Cherki', category: CATEGORIES.FOOTBALL, image: '/images/football/rayan-cherki.jpg' },
  { id: 'f60', name: 'Roberto Firmino', category: CATEGORIES.FOOTBALL, image: '/images/football/roberto-firmino.jpg' },
  { id: 'f61', name: 'Sadio Mané', category: CATEGORIES.FOOTBALL, image: '/images/football/sadio-mane.jpg' },
  { id: 'f62', name: 'Sergio Agüero', category: CATEGORIES.FOOTBALL, image: '/images/football/sergio-aguero.jpg' },
  { id: 'f63', name: 'Sergio Ramos', category: CATEGORIES.FOOTBALL, image: '/images/football/sergio-ramos.jpg' },
  { id: 'f64', name: 'Thiago Alcântara', category: CATEGORIES.FOOTBALL, image: '/images/football/thiago-alcantara.jpg' },
  { id: 'f65', name: 'Toni Kroos', category: CATEGORIES.FOOTBALL, image: '/images/football/toni-kroos.jpg' },
  { id: 'f66', name: 'Vincent Kompany', category: CATEGORIES.FOOTBALL, image: '/images/football/vincent-kompany.jpg' },
  { id: 'f67', name: 'Xabi Alonso', category: CATEGORIES.FOOTBALL, image: '/images/football/xabi-alonso.jpg' },
  { id: 'f68', name: 'Zlatan Ibrahimović', category: CATEGORIES.FOOTBALL, image: '/images/football/zlatan-ibrahimovic.jpg' },
  { id: 'f69', name: 'Ademola Lookman', category: CATEGORIES.FOOTBALL, image: '/images/football/ademola-lookman.jpg' },

  // ── TYPES OF SPORTS (19) ─────────────────────────────────────────────────────
  { id: 's01', name: 'Handball', category: CATEGORIES.SPORTS, image: '/images/sports/handball.jpg' },
  { id: 's02', name: 'Basketball', category: CATEGORIES.SPORTS, image: '/images/sports/basketball.jpg' },
  { id: 's03', name: 'Tennis', category: CATEGORIES.SPORTS, image: '/images/sports/tennis.jpg' },
  { id: 's04', name: 'Volleyball', category: CATEGORIES.SPORTS, image: '/images/sports/volleyball.jpg' },
  { id: 's05', name: 'Swimming', category: CATEGORIES.SPORTS, image: '/images/sports/swimming.jpg' },
  { id: 's06', name: 'Boxing', category: CATEGORIES.SPORTS, image: '/images/sports/boxing.jpg' },
  { id: 's07', name: 'Baseball', category: CATEGORIES.SPORTS, image: '/images/sports/baseball.jpg' },
  { id: 's08', name: 'Golf', category: CATEGORIES.SPORTS, image: '/images/sports/golf.jpg' },
  { id: 's09', name: 'Table Tennis', category: CATEGORIES.SPORTS, image: '/images/sports/table-tennis.jpg' },
  { id: 's10', name: 'American Football', category: CATEGORIES.SPORTS, image: '/images/sports/american-football.jpg' },
  { id: 's11', name: 'Cycling', category: CATEGORIES.SPORTS, image: '/images/sports/cycling.jpg' },
  { id: 's12', name: 'Skiing', category: CATEGORIES.SPORTS, image: '/images/sports/skiing.jpg' },
  { id: 's13', name: 'Cricket', category: CATEGORIES.SPORTS, image: '/images/sports/cricket.jpg' },
  { id: 's14', name: 'Badminton', category: CATEGORIES.SPORTS, image: '/images/sports/badminton.jpg' },
  { id: 's15', name: 'Formula 1', category: CATEGORIES.SPORTS, image: '/images/sports/formula-1.jpg' },
  { id: 's16', name: 'Rugby', category: CATEGORIES.SPORTS, image: '/images/sports/rugby.jpg' },
  { id: 's17', name: 'Hockey', category: CATEGORIES.SPORTS, image: '/images/sports/hockey.jpg' },
  { id: 's18', name: 'Water Polo', category: CATEGORIES.SPORTS, image: '/images/sports/water-polo.jpg' },
  { id: 's19', name: 'Karate', category: CATEGORIES.SPORTS, image: '/images/sports/karate.jpg' },

  // ── ANIMALS (25) ─────────────────────────────────────────────────────────────
  { id: 'a01', name: 'Bear', category: CATEGORIES.ANIMALS, image: '/images/animals/bear.jpg' },
  { id: 'a02', name: 'Camel', category: CATEGORIES.ANIMALS, image: '/images/animals/camel-wild.jpg' },
  { id: 'a03', name: 'Cheetah', category: CATEGORIES.ANIMALS, image: '/images/animals/cheetah-meadow.jpg' },
  { id: 'a04', name: 'Chimpanzee', category: CATEGORIES.ANIMALS, image: '/images/animals/chimpanzee.jpg' },
  { id: 'a05', name: 'Dolphin', category: CATEGORIES.ANIMALS, image: '/images/animals/water-dolphin.jpg' },
  { id: 'a06', name: 'Elephant', category: CATEGORIES.ANIMALS, image: '/images/animals/elephant.jpg' },
  { id: 'a07', name: 'Fox', category: CATEGORIES.ANIMALS, image: '/images/animals/fox-snow.jpg' },
  { id: 'a08', name: 'Giraffe', category: CATEGORIES.ANIMALS, image: '/images/animals/giraffe.jpg' },
  { id: 'a09', name: 'Hummingbird', category: CATEGORIES.ANIMALS, image: '/images/animals/hummingbird.jpg' },
  { id: 'a10', name: 'Horse', category: CATEGORIES.ANIMALS, image: '/images/animals/horse.jpg' },
  { id: 'a11', name: 'Jellyfish', category: CATEGORIES.ANIMALS, image: '/images/animals/jellyfish.jpg' },
  { id: 'a12', name: 'Kangaroo', category: CATEGORIES.ANIMALS, image: '/images/animals/kangaroo.jpg' },
  { id: 'a14', name: 'Lioness', category: CATEGORIES.ANIMALS, image: '/images/animals/lioness.jpg' },
  { id: 'a15', name: 'Manatee', category: CATEGORIES.ANIMALS, image: '/images/animals/water-manatee.jpg' },
  { id: 'a16', name: 'Monkey', category: CATEGORIES.ANIMALS, image: '/images/animals/monkey.jpg' },
  { id: 'a19', name: 'Parrot', category: CATEGORIES.ANIMALS, image: '/images/animals/parrot.jpg' },
  { id: 'a20', name: 'Penguin', category: CATEGORIES.ANIMALS, image: '/images/animals/penguin.jpg' },
  { id: 'a22', name: 'Seal', category: CATEGORIES.ANIMALS, image: '/images/animals/water-seal.jpg' },
  { id: 'a23', name: 'Shark', category: CATEGORIES.ANIMALS, image: '/images/animals/water-shark.jpg' },
  { id: 'a24', name: 'Tiger', category: CATEGORIES.ANIMALS, image: '/images/animals/tiger-wild.jpg' },
  { id: 'a25', name: 'Turtle', category: CATEGORIES.ANIMALS, image: '/images/animals/water-turtle.jpg' },
  { id: 'a26', name: 'Whale', category: CATEGORIES.ANIMALS, image: '/images/animals/water-whale.jpg' },
  { id: 'a27', name: 'Wolf', category: CATEGORIES.ANIMALS, image: '/images/animals/wolf.jpg' },
  { id: 'a28', name: 'Zebra', category: CATEGORIES.ANIMALS, image: '/images/animals/zebra.jpg' },
]);

/** Get all items for a given category */
export const getItemsByCategory = (category) =>
  ALL_ITEMS.filter((item) => item.category === category);

/** Get an item by its ID */
export const getItemById = (id) => ALL_ITEMS.find((item) => item.id === id);
