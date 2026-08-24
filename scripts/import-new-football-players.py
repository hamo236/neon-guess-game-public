from pathlib import Path
import re
import shutil

repo = Path('/home/ubuntu/neon_guess_publish')
source = repo / '.football_source' / 'extracted'
target = repo / 'public' / 'images' / 'football'
data_file = repo / 'src' / 'data' / 'gameData.js'

new_stems = [
    'Alexis_Sanchez', 'Andrea_Pirlo', 'Andres_Iniesta', 'Angel_Di_Maria', 'Arjen_Robben',
    'Dani_Alves', 'David_Silva', 'David_Villa', 'Eden_Hazard', 'Fernando_Torres',
    'Franck_Ribery', 'Gareth_Bale', 'Gerard_Pique', 'Giorgio_Chiellini', 'Hugo_Lloris',
    'Isco', 'James_Rodriguez', 'John_Terry', 'Kaka', 'Keylor_Navas', 'Luis_Figo',
    'Luis_Suarez', 'Marcelo', 'Marco_Reus', 'Mario_Gotze', 'Mesut_Ozil', 'Philipp_Lahm',
    'Raphael_Varane', 'Raphinha', 'Rayan_Cherki', 'Roberto_Firmino', 'Sadio_Mane',
    'Sergio_Aguero', 'Sergio_Ramos', 'Thiago_Alcantara', 'Toni_Kroos', 'Vincent_Kompany',
    'Xabi_Alonso', 'Zlatan_Ibrahimovic', 'ademola-lookman',
]

display = {
    'Alexis_Sanchez': 'Alexis Sánchez', 'Andrea_Pirlo': 'Andrea Pirlo', 'Andres_Iniesta': 'Andrés Iniesta',
    'Angel_Di_Maria': 'Ángel Di María', 'Arjen_Robben': 'Arjen Robben', 'Dani_Alves': 'Dani Alves',
    'David_Silva': 'David Silva', 'David_Villa': 'David Villa', 'Eden_Hazard': 'Eden Hazard',
    'Fernando_Torres': 'Fernando Torres', 'Franck_Ribery': 'Franck Ribéry', 'Gareth_Bale': 'Gareth Bale',
    'Gerard_Pique': 'Gerard Piqué', 'Giorgio_Chiellini': 'Giorgio Chiellini', 'Hugo_Lloris': 'Hugo Lloris',
    'Isco': 'Isco', 'James_Rodriguez': 'James Rodríguez', 'John_Terry': 'John Terry', 'Kaka': 'Kaká',
    'Keylor_Navas': 'Keylor Navas', 'Luis_Figo': 'Luís Figo', 'Luis_Suarez': 'Luis Suárez',
    'Marcelo': 'Marcelo', 'Marco_Reus': 'Marco Reus', 'Mario_Gotze': 'Mario Götze', 'Mesut_Ozil': 'Mesut Özil',
    'Philipp_Lahm': 'Philipp Lahm', 'Raphael_Varane': 'Raphaël Varane', 'Raphinha': 'Raphinha',
    'Rayan_Cherki': 'Rayan Cherki', 'Roberto_Firmino': 'Roberto Firmino', 'Sadio_Mane': 'Sadio Mané',
    'Sergio_Aguero': 'Sergio Agüero', 'Sergio_Ramos': 'Sergio Ramos', 'Thiago_Alcantara': 'Thiago Alcântara',
    'Toni_Kroos': 'Toni Kroos', 'Vincent_Kompany': 'Vincent Kompany', 'Xabi_Alonso': 'Xabi Alonso',
    'Zlatan_Ibrahimovic': 'Zlatan Ibrahimović', 'ademola-lookman': 'Ademola Lookman',
}

def slug(stem: str) -> str:
    return re.sub(r'[^a-z0-9]+', '-', stem.lower()).strip('-')

assert len(new_stems) == 40
assert set(display) == set(new_stems)
for stem in new_stems:
    src = source / f'{stem}.jpg'
    assert src.exists(), f'missing source: {src}'
    dest = target / f'{slug(stem)}.jpg'
    shutil.copy2(src, dest)

content = data_file.read_text()
old_marker = "  // ── TYPES OF SPORTS (19) ─────────────────────────────────────────────────────"
assert old_marker in content
entries = []
for offset, stem in enumerate(new_stems, start=30):
    filename = f'{slug(stem)}.jpg'
    entries.append(f"  {{ id: 'f{offset:02d}', name: '{display[stem]}', category: CATEGORIES.FOOTBALL, image: '/images/football/{filename}' }},")
block = "\n".join(entries) + "\n\n"
content = content.replace(old_marker, block + old_marker, 1)
content = content.replace('93 verified items across 4 categories: 28 football, 19 sports, 21 cartoons, 25 animals.', '132 verified items across 4 categories: 68 football, 19 sports, 21 cartoons, 24 animals.')
content = content.replace('/** All 93 verified game items — local JPG assets in /public/images/. */', '/** All 132 verified game items — local JPG assets in /public/images/. */')
content = content.replace('// ── FOOTBALL PLAYERS (29)', '// ── FOOTBALL PLAYERS (68)')
data_file.write_text(content)
print(f'copied={len(new_stems)} added_ids=f30-f69')
print('\n'.join(f'{stem} -> {slug(stem)}.jpg' for stem in new_stems))
