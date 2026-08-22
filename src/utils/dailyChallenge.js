import { ALL_ITEMS } from '../data/gameData';

const STORAGE_KEY = 'neon_guess_daily_drop_v1';
const CHALLENGE_LENGTH = 5;

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededOrder(items, seed) {
  return [...items]
    .map((item, index) => ({
      item,
      score: hashString(`${seed}:${item.id}:${index}`),
    }))
    .sort((left, right) => left.score - right.score)
    .map(({ item }) => item);
}

export function getDailyChallengeId(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function getDailyChallenge(date = new Date()) {
  const challengeId = getDailyChallengeId(date);
  const orderedItems = seededOrder(ALL_ITEMS, `daily:${challengeId}`);
  const questions = orderedItems.slice(0, CHALLENGE_LENGTH).map((answer, index) => {
    const distractors = orderedItems
      .filter((item) => item.id !== answer.id && item.category === answer.category)
      .slice(index, index + 3);
    const options = seededOrder([answer, ...distractors], `${challengeId}:${answer.id}`);
    return {
      id: `${challengeId}-${index + 1}`,
      answerId: answer.id,
      answerName: answer.name,
      category: answer.category,
      image: answer.image,
      options,
    };
  });

  return {
    id: challengeId,
    label: 'Daily Guess Drop',
    questions,
    total: questions.length,
  };
}

export function loadDailyCompletion(challengeId) {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const completion = JSON.parse(stored);
    return completion?.challengeId === challengeId ? completion : null;
  } catch {
    return null;
  }
}

export function saveDailyCompletion(completion) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(completion));
    return true;
  } catch {
    // Device-only storage is an enhancement; the completed result remains visible in memory.
    return false;
  }
}

export { CHALLENGE_LENGTH };
