import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDailyChallenge, loadDailyCompletion, saveDailyCompletion } from '../utils/dailyChallenge';

const DailyGuessPage = () => {
  const navigate = useNavigate();
  const challenge = useMemo(() => getDailyChallenge(), []);
  const existingCompletion = useMemo(() => loadDailyCompletion(challenge.id), [challenge.id]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [completed, setCompleted] = useState(Boolean(existingCompletion));
  const [completion, setCompletion] = useState(existingCompletion);
  const [isPersisted, setIsPersisted] = useState(Boolean(existingCompletion));
  const [shareStatus, setShareStatus] = useState('');

  const question = challenge.questions[questionIndex];
  const answered = selectedId !== null;

  const handleSelect = (optionId) => {
    if (answered || completed) return;
    setSelectedId(optionId);
    if (optionId === question.answerId) setScore((current) => current + 1);
  };

  const finishChallenge = (finalScore) => {
    const result = {
      challengeId: challenge.id,
      score: finalScore,
      total: challenge.total,
      completedAt: new Date().toISOString(),
    };
    const persisted = saveDailyCompletion(result);
    setIsPersisted(persisted);
    setCompletion(result);
    setCompleted(true);
  };

  const handleNext = () => {
    const finalScore = score + (selectedId === question.answerId ? 1 : 0);
    if (questionIndex >= challenge.questions.length - 1) {
      finishChallenge(finalScore);
      return;
    }
    setQuestionIndex((current) => current + 1);
    setSelectedId(null);
  };

  const handleShare = async () => {
    if (!completion) return;
    const text = `NEON GUESS Daily Guess Drop — ${completion.score}/${completion.total}`;
    setShareStatus('');
    try {
      if (navigator.share) {
        await navigator.share({ title: 'NEON GUESS Daily Guess Drop', text });
        setShareStatus('Ready to share.');
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        const copied = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (!copied) throw new Error('Clipboard unavailable');
      }
      setShareStatus('Result copied.');
    } catch (error) {
      if (error?.name !== 'AbortError') setShareStatus('Sharing is unavailable on this device.');
    }
  };

  if (completed) {
    return (
      <main className="ng-page-shell ng-page-shell--narrow flex-1 w-full max-w-3xl mx-auto px-container-margin pt-24 pb-32 md:pt-32 relative z-10">
        <section className="glass-panel-2 rounded-2xl p-6 md:p-10 border border-primary-fixed/30 text-center" aria-labelledby="daily-complete-title">
          <div className="mb-6 flex flex-wrap items-center justify-center gap-2" aria-label="Daily result status">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-fixed/30 bg-primary-fixed/10 px-3 py-1 font-label-caps text-label-caps text-primary-fixed">
              <span className="material-symbols-outlined text-[15px]" aria-hidden="true">task_alt</span>
              RESULT LOCKED
            </span>
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-label-caps text-label-caps text-on-surface-variant">LOCAL SCORE</span>
          </div>
          <span className="material-symbols-outlined text-5xl text-primary-fixed mb-4">emoji_events</span>
          <span className="inline-flex items-center rounded-full border border-primary-fixed/25 bg-primary-fixed/5 px-2.5 py-1 font-label-caps text-[9px] tracking-[0.14em] text-primary-fixed">LOCAL RESULT</span>
          <p className="font-label-caps text-label-caps text-primary-fixed mt-3">COMPLETED TODAY</p>
          <h1 id="daily-complete-title" className="font-headline-lg text-headline-lg text-white mt-2">Daily Guess Drop</h1>
          <p className="text-on-surface-variant mt-3">{isPersisted ? 'Your result is saved on this device. Come back tomorrow for a new drop.' : 'Your result is available for this session, but this browser could not save it. Come back tomorrow for a new drop.'}</p>
          <div className="my-6 sm:my-8 rounded-xl bg-white/5 border border-white/10 p-4 sm:p-6" aria-label="Today's Daily Guess score">
            <div className="font-stats-num text-5xl text-primary-fixed">{completion?.score}/{completion?.total}</div>
            <p className="font-label-caps text-label-caps text-on-surface-variant mt-2">TODAY'S SCORE</p>
          </div>
          <p className="text-xs text-on-surface-variant mb-5">Local result only — it does not affect multiplayer rooms or rankings.</p>
          <div className="ng-action-rail mt-4 sm:mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center items-stretch sm:items-center" aria-label="Daily result actions">
            <p className="sr-only">Choose whether to share the local result or return to the lobby.</p>
            <button type="button" onClick={handleShare} className="ng-interactive min-h-11 w-full sm:w-auto px-3 sm:px-5 py-3 rounded-lg text-sm sm:text-base bg-primary-fixed/15 border border-primary-fixed/40 text-primary-fixed hover:bg-primary-fixed/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed/80 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-dim">SHARE RESULT</button>
            <button type="button" onClick={() => navigate('/')} className="ng-interactive min-h-11 w-full sm:w-auto px-3 sm:px-5 py-3 rounded-lg text-sm sm:text-base border border-white/20 text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-dim">BACK TO LOBBY</button>
          </div>
          {shareStatus && <p role="status" className="text-sm text-primary-fixed mt-4">{shareStatus}</p>}
        </section>
      </main>
    );
  }

  return (
    <main className="ng-page-shell ng-page-shell--narrow flex-1 w-full max-w-3xl mx-auto px-container-margin pt-24 pb-32 md:pt-32 relative z-10">
      <section className="glass-panel-2 rounded-2xl p-5 md:p-8 border border-primary-fixed/20" aria-labelledby="daily-active-title">
        <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-primary-fixed/20 bg-primary-fixed/5 px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <span className="material-symbols-outlined shrink-0 text-[18px] text-primary-fixed" aria-hidden="true">today</span>
            <div className="min-w-0">
              <p className="font-label-caps text-[9px] tracking-[0.14em] text-primary-fixed">DAILY GUESS</p>
              <p className="truncate text-xs text-on-surface-variant">LOCAL CHALLENGE · ACTIVE</p>
            </div>
          </div>
          <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 font-label-caps text-[9px] tracking-wider text-on-surface-variant">{questionIndex + 1}/{challenge.total}</span>
        </div>
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <span className="inline-flex items-center rounded-full border border-primary-fixed/25 bg-primary-fixed/5 px-2.5 py-1 font-label-caps text-[9px] tracking-[0.14em] text-primary-fixed">
              DAILY MODE · LOCAL DROP
            </span>
            <h1 id="daily-active-title" className="font-headline-lg text-headline-lg text-white mt-3">One drop. Five guesses.</h1>
            <p className="text-sm text-on-surface-variant mt-2">A local daily challenge. It never changes multiplayer state.</p>
          </div>
          <button type="button" onClick={() => navigate('/')} aria-label="Back to lobby" className="ng-interactive rounded-lg border border-white/15 p-2 text-on-surface-variant hover:text-white hover:bg-white/10">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 mb-4 rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2.5 text-sm">
          <span className="font-label-caps text-[10px] tracking-wider text-on-surface-variant">GUESS {questionIndex + 1} OF {challenge.total}</span>
          <span className="font-label-caps text-[10px] tracking-wider text-primary-fixed">SCORE {score}</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/10 mb-6 overflow-hidden">
          <div className="h-full bg-primary-fixed transition-all" style={{ width: `${((questionIndex + (answered ? 1 : 0)) / challenge.total) * 100}%` }} />
        </div>

        <div className="rounded-xl overflow-hidden border border-white/10 bg-black/20">
          <img src={question.image} alt="Identify this daily challenge image" className="w-full h-56 md:h-72 object-cover" />
        </div>
        <p className="text-center text-on-surface-variant text-sm mt-4">Which {question.category} item is this?</p>

        <div className="ng-choice-grid grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
          {question.options.map((option) => {
            const isCorrect = option.id === question.answerId;
            const isSelected = selectedId === option.id;
            const stateClass = !answered
              ? 'border-white/15 text-white hover:border-primary-fixed/60 hover:bg-primary-fixed/10'
              : isCorrect
                ? 'border-primary-fixed bg-primary-fixed/15 text-primary-fixed'
                : isSelected
                  ? 'border-error bg-error/10 text-error'
                  : 'border-white/10 text-on-surface-variant opacity-60';
            return (
              <button key={option.id} type="button" disabled={answered} onClick={() => handleSelect(option.id)} className={`ng-interactive rounded-lg border p-4 text-left transition-colors ${stateClass}`}>
                <span className="flex items-center justify-between gap-3">
                  <span>{option.name}</span>
                  {answered && isCorrect && <span className="material-symbols-outlined text-[18px]">check_circle</span>}
                  {answered && isSelected && !isCorrect && <span className="material-symbols-outlined text-[18px]">cancel</span>}
                </span>
              </button>
            );
          })}
        </div>

        {answered && (
          <div role="status" aria-live="polite" className="ng-action-rail mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-lg bg-white/5 border border-white/10 p-4">
            <span className={selectedId === question.answerId ? 'text-primary-fixed' : 'text-error'}>
              {selectedId === question.answerId ? 'Correct guess.' : `Answer: ${question.answerName}`}
            </span>
            <button type="button" onClick={handleNext} className="ng-interactive w-full sm:w-auto px-5 py-2.5 rounded-lg bg-primary-fixed text-on-primary-fixed font-semibold hover:brightness-110">
              {questionIndex >= challenge.questions.length - 1 ? 'SEE RESULT' : 'NEXT GUESS'}
            </button>
          </div>
        )}
      </section>
    </main>
  );
};

export default DailyGuessPage;
