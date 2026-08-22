/**
 * src/firebase/config.js
 * Firebase initialization & environment check.
 *
 * Firebase Web configuration is public client configuration. The production
 * fallback keeps static deployments functional when a CI provider does not
 * expose VITE_* variables; authorization remains enforced by Firebase Auth
 * and Realtime Database Rules.
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { firebasePublicConfig } from './firebasePublicConfig.js';

const env = import.meta.env || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || firebasePublicConfig.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || firebasePublicConfig.authDomain,
  databaseURL: env.VITE_FIREBASE_DATABASE_URL || firebasePublicConfig.databaseURL,
  projectId: env.VITE_FIREBASE_PROJECT_ID || firebasePublicConfig.projectId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || firebasePublicConfig.storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebasePublicConfig.messagingSenderId,
  appId: env.VITE_FIREBASE_APP_ID || firebasePublicConfig.appId,
};

// Check if Firebase is properly configured with real values.
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== 'your_api_key_here' &&
  firebaseConfig.databaseURL &&
  firebaseConfig.databaseURL !== 'https://your_project_id-default-rtdb.firebaseio.com'
);

let app = null;
let auth = null;
let db = null;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getDatabase(app);
  } catch (err) {
    console.warn('[Firebase Config] Firebase initialization failed:', err);
  }
} else {
  console.info('[Firebase Config] Missing/placeholder env variables — running in local engine mode.');
}

export { app, auth, db };
