/**
 * rewards.js
 * -----------------------------------------------------------------------
 * Single Responsibility: the star/badge economy.
 * Games never manipulate stars/badges directly — they call
 * Atasha.rewards.awardStars(n, gameId) and this module decides what that
 * unlocks. Keeping this separate means the whole reward system (or its
 * difficulty curve) can change without touching a single game file.
 * -----------------------------------------------------------------------
 */
(function (Atasha) {
  'use strict';

  const BADGES = [
    { id: 'first_star', label: 'First Star!', threshold: 1 },
    { id: 'ten_stars', label: 'Star Collector', threshold: 10 },
    { id: 'fifty_stars', label: 'Super Star', threshold: 50 },
  ];

  function awardStars(amount, gameId) {
    let newlyUnlocked = [];
    let totalStars = 0;

    Atasha.storage.update((state) => {
      state.stars += amount;
      totalStars = state.stars;

      BADGES.forEach((badge) => {
        const alreadyHas = state.badges.includes(badge.id);
        if (!alreadyHas && totalStars >= badge.threshold) {
          state.badges.push(badge.id);
          newlyUnlocked.push(badge);
        }
      });
    });

    if (gameId) Atasha.storage.recordGameCompletion(gameId);

    Atasha.audio.play('starEarned');
    return { totalStars, newlyUnlocked };
  }

  function getStars() {
    return Atasha.storage.get('stars') || 0;
  }

  function getBadges() {
    const earnedIds = Atasha.storage.get('badges') || [];
    return BADGES.filter((b) => earnedIds.includes(b.id));
  }

  Atasha.rewards = { awardStars, getStars, getBadges, BADGES };
})(window.Atasha = window.Atasha || {});
