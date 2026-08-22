/**
 * src/firebase/database.js
 * Low-level Firebase Realtime Database utilities and references.
 */

import {
  ref,
  get,
  set,
  update,
  remove,
  onValue,
  off,
  onDisconnect,
  serverTimestamp,
  push,
  runTransaction,
} from 'firebase/database';
import { db } from './config.js';

export {
  ref,
  get,
  set,
  update,
  remove,
  onValue,
  off,
  onDisconnect,
  serverTimestamp,
  push,
  runTransaction,
  db,
};

/**
 * Get reference to a specific room in RTDB.
 * @param {string} roomCode
 * @param {string} [subpath]
 */
export function getRoomRef(roomCode, subpath = '') {
  if (!db) return null;
  const path = subpath ? `rooms/${roomCode}/${subpath}` : `rooms/${roomCode}`;
  return ref(db, path);
}
