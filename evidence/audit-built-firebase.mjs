import fs from 'node:fs';
import path from 'node:path';

const assetDir = path.resolve('dist/assets');
const files = fs.readdirSync(assetDir).filter((file) => file.endsWith('.js'));
const text = files.map((file) => fs.readFileSync(path.join(assetDir, file), 'utf8')).join('\n');
const databaseUrls = [...text.matchAll(/https:\/\/[^"'\\s]+firebaseio\.com[^"'\\s]*/g)].map((match) => match[0]);
const result = {
  jsFiles: files.length,
  containsRuntimeEnvName: text.includes('VITE_FIREBASE_API_KEY'),
  containsPlaceholderComparison: text.includes('your_project_id-default-rtdb.firebaseio.com'),
  hasNonPlaceholderDatabaseUrl: databaseUrls.some((url) => !url.includes('your_project_id')),
  databaseUrlCount: databaseUrls.length,
  containsFirebaseSdkInitializer: text.includes('initializeApp'),
};
console.log(JSON.stringify(result, null, 2));
