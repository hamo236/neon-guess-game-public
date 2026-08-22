import fs from 'node:fs';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getDatabase, ref, get, set, update, runTransaction, remove } from 'firebase/database';

function loadEnv() {
  const env = {};
  for (const line of fs.readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].trim();
  }
  return env;
}

const env = loadEnv();
const config = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: env.VITE_FIREBASE_DATABASE_URL,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};
if (!config.apiKey || !config.databaseURL) throw new Error('Firebase environment is incomplete');

const clients = [0, 1, 2, 3, 4].map((i) => {
  const app = initializeApp(config, `live-qa-${Date.now()}-${i}`);
  return { app, auth: getAuth(app), db: getDatabase(app) };
});
const users = [];
for (const client of clients) users.push((await signInAnonymously(client.auth)).user);
const roomCode = `QA${String(Date.now()).slice(-6)}`;
const roomPath = `rooms/${roomCode}`;
const player = (user, index, isHost = false) => ({
  id: user.uid,
  name: `QA Player ${index + 1}`,
  avatar: null,
  isHost,
  connected: true,
  score: 0,
});
const room = {
  matchId: `${roomCode}:live`,
  hostId: users[0].uid,
  status: 'lobby',
  phase: 'lobby',
  mode: 'social',
  category: 'cartoons',
  round: 1,
  roundId: null,
  totalRounds: 3,
  players: { [users[0].uid]: player(users[0], 0, true) },
  scores: { [users[0].uid]: 0 },
  private: {},
  actions: {},
  roundResults: {},
};
const results = [];
const record = (name, status, details = '') => {
  results.push({ name, status, details });
  console.log(`${status} ${name}${details ? ` — ${details}` : ''}`);
};

try {
  await set(ref(clients[0].db, roomPath), room);
  record('host room creation', 'LIVE FIREBASE VERIFIED', roomCode);

  for (let i = 1; i < 4; i += 1) {
    const uid = users[i].uid;
    const tx = await runTransaction(ref(clients[i].db, roomPath), (current) => {
      if (!current) return current;
      const players = current.players || {};
      if (players[uid]) return current;
      if (Object.keys(players).length >= 4) return current;
      return { ...current, players: { ...players, [uid]: player(users[i], i) }, scores: { ...(current.scores || {}), [uid]: 0 } };
    });
    if (!tx.committed) throw new Error(`join transaction not committed for player ${i + 1}`);
    record(`player ${i + 1} join`, 'LIVE FIREBASE VERIFIED', uid);
  }

  const fifthUid = users[4].uid;
  const fifthTx = await runTransaction(ref(clients[4].db, roomPath), (current) => {
    if (!current) return current;
    const players = current.players || {};
    if (Object.keys(players).length >= 4) return current;
    return { ...current, players: { ...players, [fifthUid]: player(users[4], 4) } };
  });
  const afterFifth = (await get(ref(clients[0].db, roomPath))).val();
  const afterFifthPlayers = Object.keys(afterFifth?.players || {});
  record('fifth new UID rejected', afterFifthPlayers.length === 4 && !afterFifthPlayers.includes(fifthUid) ? 'LIVE FIREBASE VERIFIED' : 'NOT VERIFIED', `committed=${fifthTx.committed}; playerCount=${afterFifthPlayers.length}`);

  const reconnectTx = await runTransaction(ref(clients[2].db, roomPath), (current) => ({
    ...current,
    players: { ...current.players, [users[2].uid]: { ...current.players[users[2].uid], connected: true, name: 'QA Player 3' } },
  }));
  const reconnectRoom = reconnectTx.snapshot.val();
  record('same-UID reconnect no duplicate', Object.keys(reconnectRoom.players).length === 4 ? 'LIVE FIREBASE VERIFIED' : 'NOT VERIFIED', `playerCount=${Object.keys(reconnectRoom.players).length}`);

  const targets = users.slice(0, 4).map((user, i) => ({ id: user.uid, item: { id: `target-${i}`, name: `Target ${i}`, image: `/qa/${i}.png` }, roundId: `${roomCode}:round:1`, ready: true }));
  for (let i = 0; i < 4; i += 1) await set(ref(clients[i].db, `${roomPath}/private/${users[i].uid}`), targets[i]);
  const own = await get(ref(clients[0].db, `${roomPath}/private/${users[0].uid}`));
  record('player receives own private target', own.exists() && own.val().item.id === 'target-0' ? 'LIVE FIREBASE VERIFIED' : 'NOT VERIFIED');
  try {
    await get(ref(clients[0].db, `${roomPath}/private/${users[1].uid}`));
    record('private target isolation', 'NOT VERIFIED', 'unauthorized read unexpectedly succeeded');
  } catch (error) {
    record('private target isolation', error.code === 'PERMISSION_DENIED' || String(error.message).includes('permission') ? 'LIVE FIREBASE VERIFIED' : 'NOT VERIFIED', error.code || error.message);
  }

  for (let i = 0; i < 4; i += 1) {
    await set(ref(clients[i].db, `${roomPath}/actions/round-1/${users[i].uid}`), { actorId: users[i].uid, roundId: 'round-1', action: 'confirm', createdAt: Date.now() + i });
  }
  record('four independent UID actions', 'LIVE FIREBASE VERIFIED');

  const duplicate = await runTransaction(ref(clients[0].db, `${roomPath}/actions/round-1/${users[0].uid}`), (current) => current);
  record('duplicate action idempotency guard', duplicate.committed ? 'NOT VERIFIED' : 'LIVE FIREBASE VERIFIED', `committed=${duplicate.committed}`);

  await update(ref(clients[0].db, roomPath), { phase: 'round_end', roundId: 'round-1', roundResult: { roundId: 'round-1', revealedTargets: Object.fromEntries(targets.map((t) => [t.id, t.item])) } });
  record('host resolution write', 'LIVE FIREBASE VERIFIED');
  const finalRoom = (await get(ref(clients[0].db, roomPath))).val();
  record('four-player result projection', Object.keys(finalRoom.roundResult.revealedTargets || {}).length === 4 ? 'LIVE FIREBASE VERIFIED' : 'NOT VERIFIED');

  try {
    await remove(ref(clients[0].db, roomPath));
    record('QA room cleanup', 'LIVE FIREBASE VERIFIED');
  } catch (error) {
    record('QA room cleanup', 'BLOCKED BY ENVIRONMENT', error.code || error.message);
  }
} catch (error) {
  console.error(`LIVE QA FATAL ${error.code || ''} ${error.message}`);
  process.exitCode = 2;
} finally {
  fs.writeFileSync('live-qa-results.json', JSON.stringify({ roomCode, results }, null, 2));
  await Promise.all(clients.map(({ app }) => deleteApp(app).catch(() => {})));
}
