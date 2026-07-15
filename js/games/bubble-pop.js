/**
 * bubble-pop.js
 * -----------------------------------------------------------------------
 * Free-play: bubbles float up carrying letters/numbers/shapes/animals,
 * tapping pops one and announces its content. No target, no wrong
 * answer — completion is simply popping a satisfying number of bubbles.
 * This is the calmest, most repeatable game in the app by design, which
 * makes it a good fit alongside Color Match for low-pressure play.
 * -----------------------------------------------------------------------
 */
(function (Luna) {
  'use strict';

  const CONTENT_BANK = [
    { emoji: '🅰️', label: 'A' }, { emoji: '🅱️', label: 'B' }, { emoji: '3️⃣', label: 'three' },
    { emoji: '5️⃣', label: 'five' }, { emoji: '🔵', label: 'blue' }, { emoji: '🟡', label: 'yellow' },
    { emoji: '🐶', label: 'dog' }, { emoji: '🐱', label: 'cat' }, { emoji: '⭐', label: 'star' },
    { emoji: '❤️', label: 'heart' },
  ];

  const POP_GOAL = 8;
  let engine = null;
  let popCount = 0;
  let api = null;
  let finished = false;

  function buildBubble(data) {
    const el = Luna.helpers.el('div', 'bp-bubble');
    el.innerHTML = `<span>${data.emoji}</span>`;
    return el;
  }

  function init(container, gameApi) {
    api = gameApi;
    popCount = 0;
    finished = false;

    container.innerHTML = `
      <div class="game-header">
        <h2>🫧 Bubble Pop</h2>
        <p class="game-instructions">Pop the bubbles!</p>
      </div>
      <div class="bp-progress">Popped: <span class="bp-count">0</span> / ${POP_GOAL}</div>
      <div class="bp-play-area"></div>
    `;

    const playArea = container.querySelector('.bp-play-area');
    playArea.style.position = 'relative';

    engine = Luna.floatingObjects.create(playArea, {
      items: CONTENT_BANK,
      renderItem: buildBubble,
      speed: 45,
      spawnIntervalMs: 1100,
      maxOnScreen: 5,
      onTap: (data) => {
        if (finished) return;
        api.playSound('tap');
        api.speak(data.label);
        popCount += 1;
        const countEl = container.querySelector('.bp-count');
        if (countEl) countEl.textContent = String(popCount);
        if (popCount >= POP_GOAL) {
          finishRound(container);
        }
      },
    });
    engine.start();

    api.speak('Pop the bubbles!');
  }

  function finishRound(container) {
    if (finished) return;
    finished = true;
    if (engine) engine.stop();
    api.playSound('complete');
    api.speak('Yay! You popped all the bubbles!');
    const result = api.awardStars(3);
    const instructions = container.querySelector('.game-instructions');
    if (instructions) instructions.textContent = 'All popped! Great job! ⭐⭐⭐';
    setTimeout(() => api.onComplete(result), 1600);
  }

  function destroy() {
    if (engine) engine.destroy();
    engine = null;
  }

  Luna.gameRegistry.register({
    id: 'bubble-pop',
    title: 'Bubble Pop',
    emoji: '🫧',
    colorTheme: 'theme-sky',
    description: 'Pop floating bubbles',
    init,
    destroy,
  });
})(window.Luna = window.Luna || {});
