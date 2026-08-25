/**
 * src/firebase/auth.js
 * Firebase anonymous authentication service.
 * Provides a stable UID per player session without password/login UI.
 *
 * The retry path is intentionally bounded and only addresses transient Auth
 * transport failures. It does not bypass Firebase Auth or change room authority.
 */

import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { auth, isFirebaseConfigured } from './config.js';

const AUTH_RETRY_LIMIT = 3;
const AUTH_RETRY_BASE_DELAY_MS = 700;

let cachedUser = null;
let authPromise = null;

const NETWORK_AUTH_CODES = new Set([
  'auth/network-request-failed',
  'auth/timeout',
  'auth/internal-error',
]);

/**
 * Return a stable, non-sensitive classification for UI and telemetry.
 */
export function classifyAuthError(error) {
  const code = String(error?.code || '').toLowerCase();
  if (NETWORK_AUTH_CODES.has(code)) return 'network';
  if (code === 'auth/too-many-requests') return 'rate_limited';
  if (code === 'auth/operation-not-allowed') return 'anonymous_auth_disabled';
  return 'unknown';
}

/**
 * Convert Firebase Auth failures into actionable text without exposing config,
 * tokens, URLs, or raw provider payloads to the user interface.
 */
export function getAuthFailureMessage(error) {
  const classification = classifyAuthError(error);
  if (classification === 'network') {
    return 'Firebase cannot be reached from this network. Check the connection or try another network, then retry.';
  }
  if (classification === 'rate_limited') {
    return 'Firebase temporarily limited authentication attempts. Wait a moment, then retry.';
  }
  if (classification === 'anonymous_auth_disabled') {
    return 'Anonymous authentication is unavailable for this deployment. Please contact the game owner.';
  }
  return 'Firebase authentication failed. Please retry.';
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryDelay(attempt) {
  const jitter = Math.floor(Math.random() * 200);
  return AUTH_RETRY_BASE_DELAY_MS * (2 ** attempt) + jitter;
}

function shouldRetryAuth(error, attempt) {
  return classifyAuthError(error) === 'network' && attempt < AUTH_RETRY_LIMIT - 1;
}

/**
 * Initialize anonymous sign-in or return the existing authenticated user.
 * @param {{ forceRetry?: boolean }} options
 * @returns {Promise<{ uid: string, isAnonymous: boolean } | null>}
 */
export function initAuth({ forceRetry = false } = {}) {
  if (!isFirebaseConfigured || !auth) {
    return Promise.resolve(null);
  }

  if (cachedUser) {
    return Promise.resolve(cachedUser);
  }

  if (forceRetry) {
    authPromise = null;
  }

  if (authPromise) {
    return authPromise;
  }

  let unsubscribe = () => {};
  const pending = new Promise((resolve, reject) => {
    let settled = false;
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      unsubscribe();
      callback(value);
    };

    unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        if (!user) return;
        cachedUser = user;
        finish(resolve, user);
      },
      (error) => {
        console.error('[Firebase Auth] Auth state changed error:', error);
        finish(reject, error);
      }
    );

    const attemptSignIn = async (attempt = 0) => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error('[Firebase Auth] Anonymous sign-in error:', {
          code: error?.code || 'unknown',
          classification: classifyAuthError(error),
          attempt: attempt + 1,
        });
        if (shouldRetryAuth(error, attempt)) {
          await wait(retryDelay(attempt));
          if (!settled) await attemptSignIn(attempt + 1);
          return;
        }
        finish(reject, error);
      }
    };

    attemptSignIn().catch((error) => finish(reject, error));
  });

  const wrapped = pending.catch((error) => {
    if (authPromise === wrapped) authPromise = null;
    throw error;
  });
  authPromise = wrapped;
  return wrapped;
}

/**
 * Clear a failed initialization promise so a user-triggered retry can start.
 * Existing authenticated users are intentionally preserved.
 */
export function resetAuthInitialization() {
  if (!cachedUser) authPromise = null;
}

/**
 * Get current player's Firebase UID.
 */
export function getCurrentUserId() {
  return cachedUser?.uid || auth?.currentUser?.uid || null;
}
