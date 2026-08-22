/**
 * NEON GUESS — Game Dataset
 * 69 verified items across 3 categories: 29 football, 19 sports, 21 cartoons. Ice Hockey is intentionally excluded.
 * Local images served from /public/images/.
 */

export const CATEGORIES = {
  CARTOONS: 'cartoons',
  FOOTBALL: 'football',
  SPORTS: 'sports',
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
});

/** All 69 verified game items — local JPG assets in /public/images/. */
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

  // ── FOOTBALL PLAYERS (29) ────────────────────────────────────────────────────
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
  { id: 'f27', name: 'Nico Schlotterbeck', category: CATEGORIES.FOOTBALL, image: '/images/football/nico-schlotterbeck.jpg' },
  { id: 'f28', name: 'Bryan Mbeumo', category: CATEGORIES.FOOTBALL, image: '/images/football/bryan-mbeumo.jpg' },
  { id: 'f29', name: 'Morgan Gibbs-White', category: CATEGORIES.FOOTBALL, image: '/images/football/morgan-gibbs-white.jpg' },

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
]);

/** Get all items for a given category */
export const getItemsByCategory = (category) =>
  ALL_ITEMS.filter((item) => item.category === category);

/** Get an item by its ID */
export const getItemById = (id) => ALL_ITEMS.find((item) => item.id === id);
