/**
 * Phase 5 — Download & optimize all 45 local game images.
 * Run: node scripts/migrate-images.mjs
 * Re-run safe: skips existing .webp files unless FORCE=1
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const PUBLIC_IMAGES = path.join(ROOT, 'public', 'images');
const FORCE = process.env.FORCE === '1';
const DELAY_MS = 2500;

/** @type {Record<string, { url: string, category: string, name: string, source: 'gemini'|'supplementary' }>} */
const ITEM_SOURCES = {
  c01: { url: 'https://upload.wikimedia.org/wikipedia/en/3/3b/SpongeBob_SquarePants_character.svg', category: 'cartoons', name: 'SpongeBob', source: 'gemini' },
  c02: { url: 'https://upload.wikimedia.org/wikipedia/en/f/f6/Tom_Tom_and_Jerry.org.png', category: 'cartoons', name: 'Tom', source: 'gemini' },
  c03: { url: 'https://upload.wikimedia.org/wikipedia/en/1/17/Bugs_Bunny.svg', category: 'cartoons', name: 'Bugs Bunny', source: 'supplementary' },
  c04: { url: 'https://upload.wikimedia.org/wikipedia/en/d/d4/Mickey_Mouse.png', category: 'cartoons', name: 'Mickey Mouse', source: 'gemini' },
  c05: { url: 'https://upload.wikimedia.org/wikipedia/en/0/02/Homer_Simpson_2006.png', category: 'cartoons', name: 'Homer Simpson', source: 'supplementary' },
  c06: { url: 'https://upload.wikimedia.org/wikipedia/en/4/4d/Shrek_%28character%29.png', category: 'cartoons', name: 'Shrek', source: 'gemini' },
  c07: { url: 'https://upload.wikimedia.org/wikipedia/en/5/53/Scooby-Doo.png', category: 'cartoons', name: 'Scooby-Doo', source: 'supplementary' },
  c08: { url: 'https://upload.wikimedia.org/wikipedia/en/a/a6/Pikachu_pokemon_in_anime.png', category: 'cartoons', name: 'Pikachu', source: 'gemini' },
  c09: { url: 'https://upload.wikimedia.org/wikipedia/en/a/aa/Bart_Simpson.svg', category: 'cartoons', name: 'Bart Simpson', source: 'supplementary' },
  c10: { url: 'https://upload.wikimedia.org/wikipedia/en/4/41/Goku_%28Dragon_Ball%29.png', category: 'cartoons', name: 'Goku', source: 'supplementary' },
  c11: { url: 'https://upload.wikimedia.org/wikipedia/en/9/94/Naruto_Uzumaki.png', category: 'cartoons', name: 'Naruto', source: 'supplementary' },
  c12: { url: 'https://upload.wikimedia.org/wikipedia/en/b/b5/Optimus_Prime_%28Transformers%29.png', category: 'cartoons', name: 'Optimus Prime', source: 'supplementary' },
  c13: { url: 'https://upload.wikimedia.org/wikipedia/en/5/5e/Elsa_from_Disney%27s_Frozen.png', category: 'cartoons', name: 'Elsa', source: 'gemini' },
  c14: { url: 'https://upload.wikimedia.org/wikipedia/en/b/b4/Buzz_Lightyear.png', category: 'cartoons', name: 'Buzz Lightyear', source: 'gemini' },
  c15: { url: 'https://upload.wikimedia.org/wikipedia/en/0/01/Woody_Toy_Story_3.png', category: 'cartoons', name: 'Woody', source: 'gemini' },

  f01: { url: 'https://upload.wikimedia.org/wikipedia/commons/b/b4/Lionel-Messi-Argentina-2022-FIFA-World-Cup_%28cropped%29.jpg', category: 'football', name: 'Messi', source: 'supplementary' },
  f02: { url: 'https://upload.wikimedia.org/wikipedia/commons/8/8c/Cristiano_Ronaldo_2018.jpg', category: 'football', name: 'Ronaldo', source: 'supplementary' },
  f03: { url: 'https://upload.wikimedia.org/wikipedia/commons/6/65/20180610_FIFA_Match_Cost_Rica_vs_Serbia_Neymar_850_0705.jpg', category: 'football', name: 'Neymar', source: 'supplementary' },
  f04: { url: 'https://upload.wikimedia.org/wikipedia/commons/9/9e/Kylian_Mbapp%C3%A9_2018.jpg', category: 'football', name: 'Mbappé', source: 'supplementary' },
  f05: { url: 'https://upload.wikimedia.org/wikipedia/commons/0/07/Erling_Haaland_2023.jpg', category: 'football', name: 'Haaland', source: 'supplementary' },
  f06: { url: 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Karim_Benzema_2018.jpg', category: 'football', name: 'Benzema', source: 'gemini' },
  f07: { url: 'https://upload.wikimedia.org/wikipedia/commons/4/40/Kevin_De_Bruyne_2018.jpg', category: 'football', name: 'De Bruyne', source: 'gemini' },
  f08: { url: 'https://upload.wikimedia.org/wikipedia/commons/7/7a/Mohamed_Salah_2018.jpg', category: 'football', name: 'Salah', source: 'supplementary' },
  f09: { url: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Vin%C3%ADcius_Jr._2018.jpg', category: 'football', name: 'Vinicius Jr', source: 'supplementary' },
  f10: { url: 'https://upload.wikimedia.org/wikipedia/commons/0/03/Robert_Lewandowski_2018.jpg', category: 'football', name: 'Lewandowski', source: 'gemini' },
  f11: { url: 'https://upload.wikimedia.org/wikipedia/commons/e/e9/Luka_Modri%C3%A7_2018.jpg', category: 'football', name: 'Modric', source: 'gemini' },
  f12: { url: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Kylian_Mbapp%C3%A9_World_Cup_2022.jpg', category: 'football', name: 'Mbappe Twin', source: 'supplementary' },
  f13: { url: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/Pedri_2021.jpg', category: 'football', name: 'Pedri', source: 'gemini' },
  f14: { url: 'https://upload.wikimedia.org/wikipedia/commons/d/d3/Jude_Bellingham_2023.jpg', category: 'football', name: 'Bellingham', source: 'gemini' },
  f15: { url: 'https://upload.wikimedia.org/wikipedia/commons/1/1e/Victor_Osimhen_2023.jpg', category: 'football', name: 'Osimhen', source: 'supplementary' },

  s01: { url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600', category: 'sports', name: 'Football', source: 'gemini' },
  s02: { url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600', category: 'sports', name: 'Basketball', source: 'gemini' },
  s03: { url: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=600', category: 'sports', name: 'Tennis', source: 'gemini' },
  s04: { url: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=600', category: 'sports', name: 'Swimming', source: 'gemini' },
  s05: { url: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=600', category: 'sports', name: 'Boxing', source: 'gemini' },
  s06: { url: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=600', category: 'sports', name: 'Golf', source: 'gemini' },
  s07: { url: 'https://images.unsplash.com/photo-1592656094267-764a45160876?w=600', category: 'sports', name: 'Volleyball', source: 'gemini' },
  s08: { url: 'https://images.unsplash.com/photo-1519861537184-64ff942f8474?w=600', category: 'sports', name: 'Baseball', source: 'supplementary' },
  s09: { url: 'https://images.unsplash.com/photo-1517649763962-0c6232661a0b?w=600', category: 'sports', name: 'Cycling', source: 'gemini' },
  s10: { url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600', category: 'sports', name: 'Gymnastics', source: 'supplementary' },
  s11: { url: 'https://images.unsplash.com/photo-1564769680524-3bf9f7685b2f?w=600', category: 'sports', name: 'Archery', source: 'supplementary' },
  s12: { url: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=600', category: 'sports', name: 'Skiing', source: 'gemini' },
  s13: { url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600', category: 'sports', name: 'Rowing', source: 'supplementary' },
  s14: { url: 'https://images.unsplash.com/photo-1502680390469-be688c047602?w=600', category: 'sports', name: 'Surfing', source: 'supplementary' },
  s15: { url: 'https://images.unsplash.com/photo-1593341646788-0bd3350540c3?w=600', category: 'sports', name: 'Fencing', source: 'supplementary' },
};

const MAX_DIMENSION = 512;
const WEBP_QUALITY = 82;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function downloadBuffer(url, retries = 4) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
  };

  let lastErr;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, { headers, redirect: 'follow' });
      if (res.status === 429) {
        await sleep(8000 * (attempt + 1));
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (err) {
      lastErr = err;
      await sleep(3000 * (attempt + 1));
    }
  }
  throw lastErr;
}

async function optimizeToWebp(inputBuffer, outPath) {
  await sharp(inputBuffer)
    .rotate()
    .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY, effort: 4 })
    .toFile(outPath);
}

async function main() {
  const results = { success: [], failed: [], skipped: [] };

  for (const [id, meta] of Object.entries(ITEM_SOURCES)) {
    const dir = path.join(PUBLIC_IMAGES, meta.category);
    fs.mkdirSync(dir, { recursive: true });
    const outPath = path.join(dir, `${id}.webp`);

    if (!FORCE && fs.existsSync(outPath)) {
      const stat = fs.statSync(outPath);
      results.skipped.push({ id, path: `/images/${meta.category}/${id}.webp`, bytes: stat.size });
      console.log(`SKIP ${id} (exists)`);
      continue;
    }

    try {
      await sleep(DELAY_MS);
      const buf = await downloadBuffer(meta.url);
      await optimizeToWebp(buf, outPath);
      const stat = fs.statSync(outPath);
      results.success.push({ id, ...meta, bytes: stat.size, path: `/images/${meta.category}/${id}.webp` });
      console.log(`OK  ${id} ${meta.name} (${(stat.size / 1024).toFixed(1)} KB)`);
    } catch (err) {
      results.failed.push({ id, ...meta, error: err.message });
      console.error(`FAIL ${id} ${meta.name}: ${err.message}`);
    }
  }

  fs.writeFileSync(path.join(__dirname, 'migration-results.json'), JSON.stringify(results, null, 2));
  const total = Object.keys(ITEM_SOURCES).length;
  const onDisk = results.skipped.length + results.success.length;
  console.log(`\nDone: ${onDisk}/${total} on disk (${results.success.length} new, ${results.skipped.length} skipped, ${results.failed.length} failed)`);
  process.exit(results.failed.length > 0 ? 1 : 0);
}

main();
