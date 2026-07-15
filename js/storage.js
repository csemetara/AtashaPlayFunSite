/**
 * storage.js
 * -----------------------------------------------------------------------
 * Single Responsibility: all persistence for Luna's Learning Adventure.
 * Nothing else in the app calls localStorage directly — every read/write
 * goes through this module, so swapping LocalStorage for an API later
 * (per the "future ready" requirement) only means editing this one file.
 * -----------------------------------------------------------------------
 */
(function (Luna) {
  'use strict';

  const NAMESPACE = 'luna_learning_v1';

  const DEFAULT_STATE = {
    childName: null,
    calmMode: false,
    muted: false,
    volume: 0.8,
    stars: 0,
    badges: [],
    lastPlayedDate: null,
    streakDays: 0,
    gameStats: {
      // gameId: { timesCompleted: 0, lastCompletedAt: null }
    },
    cookbook: [],       // recipes "cooked" in Little Chef
    colorsMatched: [],  // colors mastered in Color Matching
  };

  function readAll() {
    try {
      const raw = window.localStorage.getItem(NAMESPACE);
      if (!raw) return { ...DEFAULT_STATE };
      const parsed = JSON.parse(raw);
      // Merge with defaults so new fields added later don't break old saves
      return { ...DEFAULT_STATE, ...parsed };
    } catch (err) {
      console.error('[storage] Failed to read state, resetting.', err);
      return { ...DEFAULT_STATE };
    }
  }

  function writeAll(state) {
    try {
      window.localStorage.setItem(NAMESPACE, JSON.stringify(state));
      return true;
    } catch (err) {
      console.error('[storage] Failed to write state.', err);
      return false;
    }
  }

  function get(key) {
    const state = readAll();
    return state[key];
  }

  function set(key, value) {
    const state = readAll();
    state[key] = value;
    return writeAll(state);
  }

  function update(mutatorFn) {
    const state = readAll();
    mutatorFn(state);
    return writeAll(state);
  }

  function recordGameCompletion(gameId) {
    update((state) => {
      const stats = state.gameStats[gameId] || { timesCompleted: 0, lastCompletedAt: null };
      stats.timesCompleted += 1;
      stats.lastCompletedAt = new Date().toISOString();
      state.gameStats[gameId] = stats;

      // Streak tracking — one play-day increments the streak once
      const today = new Date().toDateString();
      if (state.lastPlayedDate !== today) {
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        state.streakDays = state.lastPlayedDate === yesterday ? state.streakDays + 1 : 1;
        state.lastPlayedDate = today;
      }
    });
  }

  Luna.storage = {
    get,
    set,
    update,
    readAll,
    recordGameCompletion,
    DEFAULT_STATE,
  };
})(window.Luna = window.Luna || {});
