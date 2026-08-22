import { build } from 'vite';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

try {
  const result = await build({ root: __dirname });
  console.log('BUILD SUCCESS');
} catch (err) {
  console.error('BUILD FAILED:', err.message);
  if (err.frame) console.error(err.frame);
  console.error(err.stack?.slice(0, 2000));
  process.exit(1);
}
