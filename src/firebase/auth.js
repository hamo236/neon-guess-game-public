/**
 * src/firebase/auth.js
 * Anonymous Firebase Authentication service.
 * Provides stable UID per player session without password/login UI.
 */

import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { auth, isFirebaseConfigured } from './config.js';

let cachedUser = null;
let authPromise = null;

/**
 * Initialize anonymous sign-in or return existing authenticated user.
 * @returns {Promise<{ uid: string, isAnonymous: boolean } | null>}
 */
export function initAuth() {
  if (!isFirebaseConfigured || !auth) {
    return Promise.resolve(null);
  }

  if (cachedUser) {
    return Promise.resolve(cachedUser);
  }

  if (authPromise) {
    return authPromise;
  }

  authPromise = new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        if (user) {
          cachedUser = user;
          unsubscribe();
          resolve(user);
        }
      },
      (error) => {
        console.error('[Firebase Auth] Auth state changed error:', error);
        reject(error);
      }
    );

    signInAnonymously(auth).catch((error) => {
      console.error('[Firebase Auth] Anonymous sign-in error:', error);
      reject(error);
    });
  });

  return authPromise;
}

/**
 * Get current player's Firebase UID.
 */
export function getCurrentUserId() {
  return cachedUser?.uid || auth?.currentUser?.uid || null;
}
