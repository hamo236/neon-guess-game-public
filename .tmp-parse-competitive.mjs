import fs from 'node:fs';
import { parse } from '@babel/parser';
const path = new URL('./src/pages/CompetitiveModePage.jsx', import.meta.url);
const code = fs.readFileSync(path, 'utf8');
try {
  parse(code, { sourceType: 'module', plugins: ['jsx'] });
  console.log('PARSE_OK');
} catch (error) {
  console.log('PARSE_ERROR');
  console.log(error.message);
  console.log(JSON.stringify({ line: error.loc?.line, column: error.loc?.column, index: error.pos }, null, 2));
  process.exitCode = 1;
}
