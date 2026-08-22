import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const expectedBase = process.env.EXPECTED_IMAGE_BASE || '/neon-guess-game-public/';
const jsFiles = readdirSync('dist/assets').filter((file) => file.endsWith('.js'));
const bundle = jsFiles.map((file) => readFileSync(join('dist/assets', file), 'utf8')).join('\n');
const baseLiteral = JSON.stringify(expectedBase);
const hasBaseLiteral = bundle.includes(baseLiteral);
const hasBaseResolver = bundle.includes('startsWith("/")') && bundle.includes('replace(/\\/$/,"")');
const hasCategoryResolver = bundle.includes('Object.entries') && bundle.includes('image:c_(n.image)');
const hasItemsResolver = bundle.includes('image:c_(e.image)');

if (!hasBaseLiteral) {
  throw new Error(`Built bundle is missing Vite base literal: ${expectedBase}`);
}
if (!hasBaseResolver || !hasCategoryResolver || !hasItemsResolver) {
  throw new Error('Built bundle is missing the compiled image base resolver wiring');
}

console.log(`Built image path regression passed: ${expectedBase} resolver is compiled for category and item images`);
