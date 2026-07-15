/**
 * space-adventure.js
 * -----------------------------------------------------------------------
 * Collect stars, tap planets for a fun fact, asteroids are neutral.
 * Direct reuse of floatingObjects.js — same engine as Bubble Pop and
 * Balloon Game, third configuration proving the split was worth it.
 *
 * "Avoid asteroids" from the spec is reinterpreted as "tapping an
 * asteroid does nothing" rather than requiring active dodging — real
 * avoidance mechanics would need fast reflexes/failure states, which
 * conflicts with the whole app's no-punishment design.
 * -----------------------------------------------------------------------
 */
(function (Luna) {
  'use strict';

  const STAR_GOAL = 6;

  const PLANET_FACTS = [
    { name: 'the Sun', emoji: '☀️', fact: 'The Sun is actually a star, not a planet!' },
    { name: 'Earth', emoji: '🌍', fact: 'Earth is our home, and it has lots of water!' },
    { name: 'Mars', emoji: '🔴', fact: 'Mars is called the Red Planet!' },
    { name: 'Saturn', emoji: '🪐', fact: 'Saturn has big beautiful rings around it!' },
    { name: 'the Moon', emoji: '🌙', fact: 'The Moon travels around the Earth every night!' },
  ];

  const ITEM_POOL = [
    ...Array.from({ length: 5 }, () => ({ kind: 'star' })),
    ...PLANET_FACTS.map((p) => ({ kind: 'planet', data: p })),
    { kind: 'asteroid' }, { kind: 'asteroid' },
  ];

  let engine = null;
  let starCount = 0;
  let api = null;
  let finished = false;

  function renderItem(item) {
    if (item.kind === 'star') {
      const el = Luna.helpers.el('div', 'sa2-item sa2-star');
      el.textContent = '⭐';
      return el;
    }
    if (item.kind === 'planet') {
      const el = Luna.helpers.el('div', 'sa2-item sa2-planet');
      el.textContent = item.data.emoji;
      return el;
    }
    const el = Luna.helpers.el('div', 'sa2-item sa2-asteroid');
    el.textContent = '🪨';
    return el;
  }

  function init(container, gameApi) {
    api = gameApi;
    starCount = 0;
    finished = false;

    container.innerHTML = `
      <div class="game-header">
        <h2>🚀 Space Adventure</h2>
        <p class="game-instructions">Collect the stars! Tap planets to learn about them!</p>
      </div>
      <div class="bp-progress">Stars: <span class="sa2-count">0</span> / ${STAR_GOAL}</div>
      <div class="bp-play-area sa2-play-area"></div>
    `;

    const playArea = container.querySelector('.sa2-play-area');
    playArea.style.position = 'relative';

    engine = Luna.floatingObjects.create(playArea, {
      items: ITEM_POOL,
      renderItem,
      speed: 48,
      spawnIntervalMs: 1000,
      maxOnScreen: 5,
      onTap: (item) => {
        if (finished) return;
        if (item.kind === 'star') {
          api.playSound('success');
          starCount += 1;
          const countEl = container.querySelector('.sa2-count');
          if (countEl) countEl.textContent = String(starCount);
          if (starCount >= STAR_GOAL) finishRound(container);
        } else if (item.kind === 'planet') {
          api.playSound('tap');
          api.speak(item.data.fact);
        } else {
          api.playSound('tap'); // neutral — asteroids never punish
        }
      },
    });
    engine.start();

    api.speak('Blast off! Collect the stars floating by!');
  }

  function finishRound(container) {
    if (finished) return;
    finished = true;
    if (engine) engine.stop();
    api.playSound('complete');
    api.speak('You collected all the stars! Amazing astronaut!');
    const result = api.awardStars(3);
    const instructions = container.querySelector('.game-instructions');
    if (instructions) instructions.textContent = 'Mission complete! Great job! ⭐⭐⭐';
    setTimeout(() => api.onComplete(result), 1600);
  }

  function destroy() {
    if (engine) engine.destroy();
    engine = null;
  }

  Luna.gameRegistry.register({
    id: 'space-adventure',
    title: 'Space Adventure',
    emoji: '🚀',
    colorTheme: 'theme-lavender',
    description: 'Collect stars in space',
    init,
    destroy,
  });
})(window.Luna = window.Luna || {});
