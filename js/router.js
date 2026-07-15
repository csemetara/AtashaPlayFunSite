/**
 * router.js
 * -----------------------------------------------------------------------
 * Single Responsibility: switching what's on screen.
 * Knows about #app-root and the game registry's standard interface —
 * knows NOTHING about any individual game's internals (Liskov: every
 * game is interchangeable from the router's point of view).
 * -----------------------------------------------------------------------
 */
(function (Luna) {
  'use strict';

  let rootEl = null;
  let currentGame = null;
  let currentView = 'home';

  function init(root) {
    rootEl = root;
  }

  function goHome() {
    teardownCurrentGame();
    currentView = 'home';
    Luna.ui.renderHome(rootEl, { onSelectGame: goToGame, onOpenDashboard: goToDashboard });
  }

  function goToDashboard() {
    teardownCurrentGame();
    currentView = 'dashboard';
    Luna.ui.renderDashboard(rootEl, { onBack: goHome });
  }

  function goToGame(gameId) {
    const game = Luna.gameRegistry.getById(gameId);
    if (!game) {
      console.error(`[router] Unknown game id: ${gameId}`);
      return goHome();
    }
    teardownCurrentGame();
    currentView = 'game';

    rootEl.innerHTML = `
      <div class="game-screen ${game.colorTheme || ''}">
        <button class="back-button" aria-label="Back to home">⬅ Back</button>
        <div class="game-container"></div>
      </div>
    `;
    rootEl.querySelector('.back-button').addEventListener('click', goHome);
    const gameContainer = rootEl.querySelector('.game-container');

    const api = {
      speak: Luna.speech.speak,
      playSound: Luna.audio.play,
      awardStars: (amount) => Luna.rewards.awardStars(amount, game.id),
      calmMode: !!Luna.storage.get('calmMode'),
      onComplete: () => goHome(),
    };

    game.init(gameContainer, api);
    currentGame = game;
  }

  function teardownCurrentGame() {
    if (currentGame && typeof currentGame.destroy === 'function') {
      currentGame.destroy();
    }
    currentGame = null;
    Luna.speech.stop();
  }

  Luna.router = { init, goHome, goToGame, goToDashboard };
})(window.Luna = window.Luna || {});
