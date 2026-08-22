import fs from 'node:fs';
import path from 'node:path';

const inputPath = process.argv[2] || path.resolve('.env');
const outputPath = process.argv[3] || path.resolve('src/firebase/firebasePublicConfig.js');
const required = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_DATABASE_URL',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

const source = fs.readFileSync(inputPath, 'utf8');
const values = {};
for (const line of source.split(/\r?\n/)) {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (!match) continue;
  const [, key, rawValue] = match;
  const value = rawValue.trim().replace(/^(['"])(.*)\1$/, '$2');
  values[key] = value;
}

const missing = required.filter((key) => !values[key]);
if (missing.length) {
  throw new Error(`Missing Firebase config keys: ${missing.join(', ')}`);
}

const config = {
  apiKey: values.VITE_FIREBASE_API_KEY,
  authDomain: values.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: values.VITE_FIREBASE_DATABASE_URL,
  projectId: values.VITE_FIREBASE_PROJECT_ID,
  storageBucket: values.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: values.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: values.VITE_FIREBASE_APP_ID,
};

const output = `// Firebase Web config is public client configuration by design.\n// Authorization remains enforced by Firebase Authentication and Realtime Database Rules.\n// Do not place server credentials, service-account keys, or private API keys here.\nexport const firebasePublicConfig = ${JSON.stringify(config, null, 2)};\n`;
fs.writeFileSync(outputPath, output, 'utf8');
