// Correct-answer streak tracking for LEGAL BY MISTAKE.
// Uses its own storage namespace so the streak is independent of
// businessbymistake and econbymistake.
// Also tracks which questions were answered in the last 24 hours so the
// same question is not shown again until either 24h pass or every question
// has been done in that window.

const STREAK_STORAGE_KEY = 'legalbymistakeStreakV1';
const BEST_STREAK_STORAGE_KEY = 'legalbymistakeBestStreakV1';
const QUESTIONS_24H_KEY = 'legalbymistakeQuestions24hV2';

let correctStreak = Number(localStorage.getItem(STREAK_STORAGE_KEY)) || 0;
let bestCorrectStreak = Number(localStorage.getItem(BEST_STREAK_STORAGE_KEY)) || 0;

function loadRecentEntries() {
  let entries = [];
  try {
    entries = JSON.parse(localStorage.getItem(QUESTIONS_24H_KEY) || '[]');
  } catch (e) {
    entries = [];
  }
  if (!Array.isArray(entries)) entries = [];

  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  entries = entries.filter(e => e && typeof e.t === 'number' && e.t > cutoff && typeof e.q === 'string');
  localStorage.setItem(QUESTIONS_24H_KEY, JSON.stringify(entries));
  return entries;
}

function getQuestionsInLast24h() {
  return loadRecentEntries().length;
}

/** Returns a Set of question filenames answered in the last 24 hours. */
function getRecentQuestionIds() {
  return new Set(loadRecentEntries().map(e => e.q));
}

/**
 * Pick a random question from `answers`, preferring ones not seen in the
 * last 24 hours. Falls back to the full list only when every question has
 * already been answered in that window.
 */
function pickQuestion(allAnswers) {
  if (!allAnswers || allAnswers.length === 0) return null;

  const recent = getRecentQuestionIds();
  const unseen = allAnswers.filter(a => !recent.has(a.question));
  const pool = unseen.length > 0 ? unseen : allAnswers;
  return pool[Math.floor(Math.random() * pool.length)];
}

function updateStreakDisplay() {
  let streak = document.getElementById('streak');
  if (!streak) {
    streak = document.createElement('div');
    streak.id = 'streak';
    streak.style.fontSize = '2.3rem';
    streak.style.fontWeight = 'bold';
    streak.style.marginTop = '12px';
    document.getElementById('result').insertAdjacentElement('afterend', streak);
  }

  const questions24h = getQuestionsInLast24h();
  streak.textContent = `LAST 24H: ${questions24h} | CURRENT STREAK: ${correctStreak} | PB: ${bestCorrectStreak}`;
}

function recordAnswer(isCorrect, questionId) {
  // Track every answered question (with id) in the rolling 24h window
  const entries = loadRecentEntries();
  if (questionId) {
    entries.push({ q: questionId, t: Date.now() });
    localStorage.setItem(QUESTIONS_24H_KEY, JSON.stringify(entries));
  }

  if (isCorrect) {
    correctStreak++;
    if (correctStreak > bestCorrectStreak) {
      bestCorrectStreak = correctStreak;
      localStorage.setItem(BEST_STREAK_STORAGE_KEY, bestCorrectStreak);
    }
  } else {
    correctStreak = 0;
  }

  localStorage.setItem(STREAK_STORAGE_KEY, correctStreak);
  updateStreakDisplay();
}

document.addEventListener('DOMContentLoaded', updateStreakDisplay);
