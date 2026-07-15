/**
 * router.js
 * -----------------------------------------------------------------------
 * Single Responsibility: switching what's on screen.
 * Knows about #app-root and the game registry's standard interface —
 * knows NOTHING about any individual game's internals (Liskov: every
 * game is interchangeable from the router's point of view).
 * -----------------------------------------------------------------------
 */
(function (Atasha) {
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
    Atasha.ui.renderHome(rootEl, { onSelectGame: goToGame, onOpenDashboard: goToDashboard });
  }

  function goToDashboard() {
    teardownCurrentGame();
    currentView = 'dashboard';
    Atasha.ui.renderDashboard(rootEl, { onBack: goHome });
  }

  function goToGame(gameId) {
    const game = Atasha.gameRegistry.getById(gameId);
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
      speak: Atasha.speech.speak,
      playSound: Atasha.audio.play,
      awardStars: (amount) => Atasha.rewards.awardStars(amount, game.id),
      calmMode: !!Atasha.storage.get('calmMode'),
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
    Atasha.speech.stop();
  }

  Atasha.router = { init, goHome, goToGame, goToDashboard };
})(window.Atasha = window.Atasha || {});
