/**
 * app.js
 * -----------------------------------------------------------------------
 * Entry point. Waits for all modules (loaded as plain scripts, in order,
 * in index.html) to have registered themselves, then boots the router
 * at the home screen.
 * -----------------------------------------------------------------------
 */
(function (Atasha) {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('app-root');
    Atasha.router.init(root);
    Atasha.router.goHome();
  });
})(window.Atasha = window.Atasha || {});
