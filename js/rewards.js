/**
 * rewards.js
 * -----------------------------------------------------------------------
 * Single Responsibility: the star/badge economy.
 * Games never manipulate stars/badges directly — they call
 * Luna.rewards.awardStars(n, gameId) and this module decides what that
 * unlocks. Keeping this separate means the whole reward system (or its
 * difficulty curve) can change without touching a single game file.
 * -----------------------------------------------------------------------
 */
(function (Luna) {
  'use strict';

  const BADGES = [
    { id: 'first_star', label: 'First Star!', threshold: 1 },
    { id: 'ten_stars', label: 'Star Collector', threshold: 10 },
    { id: 'fifty_stars', label: 'Super Star', threshold: 50 },
  ];

  function awardStars(amount, gameId) {
    let newlyUnlocked = [];
    let totalStars = 0;

    Luna.storage.update((state) => {
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

    if (gameId) Luna.storage.recordGameCompletion(gameId);

    Luna.audio.play('starEarned');
    return { totalStars, newlyUnlocked };
  }

  function getStars() {
    return Luna.storage.get('stars') || 0;
  }

  function getBadges() {
    const earnedIds = Luna.storage.get('badges') || [];
    return BADGES.filter((b) => earnedIds.includes(b.id));
  }

  Luna.rewards = { awardStars, getStars, getBadges, BADGES };
})(window.Luna = window.Luna || {});
