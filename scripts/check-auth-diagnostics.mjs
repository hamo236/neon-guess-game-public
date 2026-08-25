import { classifyAuthError, getAuthFailureMessage } from '../src/firebase/auth.js';

const error = { code: 'auth/network-request-failed' };
if (classifyAuthError(error) !== 'network') {
  throw new Error('Auth network classification failed');
}
if (!getAuthFailureMessage(error).toLowerCase().includes('network')) {
  throw new Error('Auth network message failed');
}
console.log('Auth diagnostic helper QA passed');
