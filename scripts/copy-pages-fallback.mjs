import { copyFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';

const dist = resolve('dist');
const indexPath = resolve(dist, 'index.html');
const fallbackPath = resolve(dist, '404.html');

await access(indexPath);
await copyFile(indexPath, fallbackPath);
console.log('[Pages] Created dist/404.html fallback for BrowserRouter deep links.');
