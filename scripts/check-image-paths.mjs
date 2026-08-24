import { readFileSync } from 'node:fs';

const source = readFileSync('src/data/gameData.js', 'utf8');
const imagePaths = source.match(/image:\s*['"]\/images\/[^'"]+['"]/g) || [];
const expectedCount = 96;

if (imagePaths.length !== expectedCount) {
  throw new Error(`Image data regression: expected ${expectedCount} source paths, found ${imagePaths.length}`);
}
if (!source.includes('import.meta.env.BASE_URL')) {
  throw new Error('Image data regression: Vite BASE_URL resolver is missing');
}
if (!source.includes('export const ALL_ITEMS = resolveImages([')) {
  throw new Error('Image data regression: ALL_ITEMS is not passed through the resolver');
}
if (!source.includes('export const CATEGORY_META = resolveItemImages({')) {
  throw new Error('Image data regression: CATEGORY_META is not passed through the resolver');
}

console.log(`Image path source regression passed: ${imagePaths.length} paths use the shared Vite base resolver`);
