import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const failures = [];
const read = (relativePath) => {
  const path = resolve(root, relativePath);
  if (!existsSync(path)) {
    failures.push(`Missing file: ${relativePath}`);
    return '';
  }
  return readFileSync(path, 'utf8');
};
const assert = (condition, message) => { if (!condition) failures.push(message); };

const adapter = read('src/firebase/competitiveFirebase.js');
const context = read('src/context/CompetitiveModeContext.jsx');
const page = read('src/pages/CompetitiveModePage.jsx');

assert(adapter.includes('subscribeCompetitiveConnection'), 'Connection subscription helper is missing.');
assert(adapter.includes("ref(db, '.info/connected')"), 'Connection helper must subscribe to Firebase .info/connected.');
assert(adapter.includes('onConnection?.(snapshot.val() === true)'), 'Connection helper must project the Firebase boolean truthfully.');
assert(adapter.includes('return () => {};'), 'Connection helper must provide a safe local-mode cleanup.');
assert(context.includes('connectionState'), 'Competitive provider does not expose connection state.');
assert(context.includes('subscribeCompetitiveConnection'), 'Competitive provider does not subscribe to connection metadata.');
assert(context.includes("'reconnecting'"), 'Provider is missing reconnecting state.');
assert(context.includes("'recovered'"), 'Provider is missing recovered state.');
assert(context.includes("'offline-local'"), 'Provider is missing explicit local fallback state.');
assert(context.includes('awaitingFreshSnapshotRef'), 'Provider does not require a fresh room snapshot after reconnect.');
assert(context.includes('canMutateCompetitive'), 'Provider does not expose mutation readiness.');
assert(context.includes('setConnectionState(isFirebaseConfigured ? \'error\' : \'offline-local\')'), 'Terminal room closure does not clear connection state safely.');
assert(page.includes('ConnectionStatus'), 'Competitive page is missing the connection status projection.');
assert(page.includes('role="status" aria-live="polite"'), 'Connection status is missing an accessible live region.');
assert(page.includes('Reconnecting - actions paused until the room is current'), 'Reconnect UX does not explain why actions are paused.');
assert(page.includes('Connection recovered - room state refreshed'), 'Recovery success feedback is missing.');
assert(page.includes('!actions.canMutateCompetitive'), 'Competitive mutation controls are not gated during recovery.');
assert(page.includes('Restoring room <strong>{recovery.roomId}</strong>...'), 'Restoring-room status markup is malformed or missing.');

if (failures.length) {
  console.error('Connection/recovery QA checks failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log('Connection/recovery QA checks passed: Firebase metadata subscription, cleanup, recovery gating, fresh snapshot, local fallback, and accessible status contracts are present.');
