import fs from 'node:fs';
import assert from 'node:assert/strict';

const hook = fs.readFileSync(new URL('../src/hooks/useVoiceRoom.js', import.meta.url), 'utf8');
const panel = fs.readFileSync(new URL('../src/components/game/VoiceRoomPanel.jsx', import.meta.url), 'utf8');
const adapter = fs.readFileSync(new URL('../src/firebase/voiceRoom.js', import.meta.url), 'utf8');

assert.match(hook, /iceServers:\s*\[\{\s*urls:\s*['"]stun:/, 'free STUN fallback remains configured');
assert.match(hook, /setLocalDescription\(\{ type: ['"]rollback['"] \}\)/, 'offer collision rollback is present');
assert.match(hook, /iceRestart:\s*true/, 'bounded ICE restart is present');
assert.match(hook, /peer\.connectionState === ['"]disconnected['"]/, 'disconnected recovery is handled');
assert.match(hook, /audioPlaybackBlocked/, 'autoplay failure state is exposed');
assert.match(hook, /ignoredOffersRef\.current\.delete\(senderId\)/, 'ignored-offer state is cleared after recovery');
assert.match(hook, /recoveryTimersRef\.current\.delete\(remoteId\)/, 'recovery timers are cleaned up');
assert.match(hook, /removeVoiceSignal\(\{/, 'processed signals are explicitly cleaned up');
assert.match(hook, /finally \{[\s\S]*removeVoiceSignal/, 'signal cleanup runs even after negotiation errors');
assert.match(hook, /receiverId: playerId/, 'signal cleanup remains receiver-scoped');
assert.match(panel, /reconnecting: ['"]Reconnecting voice call/, 'reconnecting state is visible');
assert.match(panel, /Tap the page to hear the voice call/, 'autoplay recovery guidance is visible');
assert.match(adapter, /export async function removeVoiceSignal/, 'signal deletion helper is exported');
assert.match(adapter, /signals\/\$\{senderId\}\/\$\{receiverId\}\/\$\{signalId\}/, 'signal deletion path is exact');
console.log('Voice reliability contract checks passed.');
