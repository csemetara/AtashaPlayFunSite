/**
 * gameRegistry.js
 * -----------------------------------------------------------------------
 * Open/Closed Principle in practice: this is the ONE list every game
 * appears in. Adding game #4 means creating js/games/new-game.js and
 * calling Atasha.gameRegistry.register({...}) at the bottom of it — nothing
 * in router.js, ui.js, or any existing game file needs to change.
 *
 * Every registered game must implement:
 *   {
 *     id: string,               // unique, matches filename
 *     title: string,            // shown on the home card
 *     emoji: string,            // shown on the home card
 *     colorTheme: string,       // CSS class suffix, e.g. 'theme-berry'
 *     description: string,      // one short line for the card
 *     init(container, api),     // mount the game into `container`
 *     destroy(),                // tear down listeners/timers
 *   }
 * `api` passed to init() gives games everything they need without letting
 * them reach into storage/audio/speech directly (Dependency Inversion):
 *   { speak, playSound, awardStars, calmMode, onExit }
 * -----------------------------------------------------------------------
 */
(function (Atasha) {
  'use strict';

  const games = [];

  function register(gameDefinition) {
    const required = ['id', 'title', 'emoji', 'init', 'destroy'];
    const missing = required.filter((key) => !(key in gameDefinition));
    if (missing.length) {
      console.error(`[gameRegistry] Game missing required fields: ${missing.join(', ')}`, gameDefinition);
      return;
    }
    games.push(gameDefinition);
  }

  function getAll() {
    return games.slice();
  }

  function getById(id) {
    return games.find((g) => g.id === id) || null;
  }

  Atasha.gameRegistry = { register, getAll, getById };
})(window.Atasha = window.Atasha || {});
