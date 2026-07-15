/**
 * ocean-world.js
 * -----------------------------------------------------------------------
 * Two stage types in one round:
 *  1) "identify" stages — tap to hear a creature, then pick it among 3
 *     choices (same shape as Animal Sounds' loop).
 *  2) "count" stages — count the fish shown and tap the matching number.
 * No new architecture; reuses the tap-to-choose pattern twice with
 * different content, proving that pattern generalizes past letters/animals.
 * -----------------------------------------------------------------------
 */
(function (Luna) {
  'use strict';

  const CREATURE_BANK = [
    { name: 'Dolphin', emoji: '🐬' },
    { name: 'Octopus', emoji: '🐙' },
    { name: 'Crab', emoji: '🦀' },
    { name: 'Whale', emoji: '🐳' },
    { name: 'Turtle', emoji: '🐢' },
    { name: 'Fish', emoji: '🐠' },
  ];

  let api = null;
  let stages = [];
  let currentIndex = 0;
  let clickHandlers = [];

  function buildIdentifyStage() {
    const decoyPool = Luna.helpers.shuffle(CREATURE_BANK);
    const correct = decoyPool[0];
    const decoys = decoyPool.slice(1, 3);
    return { type: 'identify', correct, choices: Luna.helpers.shuffle([correct, ...decoys]) };
  }

  function buildCountStage() {
    const count = 2 + Math.floor(Math.random() * 4); // 2-5 fish, gentle range
    const wrongOptions = Luna.helpers.shuffle(
      [count - 1, count + 1, count + 2].filter((n) => n > 0 && n !== count)
    ).slice(0, 2);
    return { type: 'count', count, choices: Luna.helpers.shuffle([count, ...wrongOptions]) };
  }

  function renderIdentify(container, stage) {
    container.innerHTML = `
      <div class="game-header">
        <h2>🌊 Ocean World</h2>
        <p class="game-instructions">Tap the speaker, then find the creature!</p>
      </div>
      <button class="as-speaker-button" aria-label="Play creature sound">🔊</button>
      <div class="as-choices-row"></div>
    `;
    const play = () => {
      api.playSound('tap');
      api.speak(`I'm a ${stage.correct.name}!`);
    };
    container.querySelector('.as-speaker-button').addEventListener('click', play);

    const row = container.querySelector('.as-choices-row');
    clickHandlers = [];
    stage.choices.forEach((choice) => {
      const btn = Luna.helpers.el('button', 'as-choice', { 'aria-label': choice.name });
      btn.innerHTML = `<span class="as-choice-emoji">${choice.emoji}</span>`;
      row.appendChild(btn);
      const handler = () => {
        if (choice.name === stage.correct.name) {
          api.playSound('success');
          api.speak(`Yes! That's a ${choice.name}!`);
          row.querySelectorAll('.as-choice').forEach((b) => (b.style.pointerEvents = 'none'));
          setTimeout(() => advance(container), 900);
        } else {
          api.playSound('tryAgain');
          if (!api.calmMode) api.speak('Try again!');
          btn.classList.add('as-choice-shake');
          setTimeout(() => btn.classList.remove('as-choice-shake'), 400);
        }
      };
      btn.addEventListener('click', handler);
      clickHandlers.push({ btn, handler });
    });
    play();
  }

  function renderCount(container, stage) {
    const fishRow = Array.from({ length: stage.count }, () => '🐟').join(' ');
    container.innerHTML = `
      <div class="game-header">
        <h2>🌊 Ocean World</h2>
        <p class="game-instructions">How many fish do you see?</p>
      </div>
      <div class="ow-fish-display">${fishRow}</div>
      <div class="as-choices-row ow-number-row"></div>
    `;
    const row = container.querySelector('.ow-number-row');
    clickHandlers = [];
    stage.choices.forEach((num) => {
      const btn = Luna.helpers.el('button', 'as-choice ow-number-choice', { 'aria-label': String(num) });
      btn.textContent = String(num);
      row.appendChild(btn);
      const handler = () => {
        if (num === stage.count) {
          api.playSound('success');
          api.speak(`Yes! ${num} fish!`);
          row.querySelectorAll('.as-choice').forEach((b) => (b.style.pointerEvents = 'none'));
          setTimeout(() => advance(container), 900);
        } else {
          api.playSound('tryAgain');
          if (!api.calmMode) api.speak('Count again!');
          btn.classList.add('as-choice-shake');
          setTimeout(() => btn.classList.remove('as-choice-shake'), 400);
        }
      };
      btn.addEventListener('click', handler);
      clickHandlers.push({ btn, handler });
    });
    api.speak(`Let's count the fish! How many do you see?`);
  }

  function renderStage(container) {
    const stage = stages[currentIndex];
    if (stage.type === 'identify') renderIdentify(container, stage);
    else renderCount(container, stage);
  }

  function advance(container) {
    currentIndex += 1;
    if (currentIndex >= stages.length) {
      finishRound(container);
    } else {
      renderStage(container);
    }
  }

  function init(container, gameApi) {
    api = gameApi;
    currentIndex = 0;
    stages = [buildIdentifyStage(), buildIdentifyStage(), buildCountStage()];
    renderStage(container);
  }

  function finishRound(container) {
    api.playSound('complete');
    api.speak('Wonderful ocean adventure!');
    const result = api.awardStars(3);
    container.innerHTML = `
      <div class="game-header">
        <h2>🌊 Ocean World</h2>
        <p class="game-instructions">All done! Great job! ⭐⭐⭐</p>
      </div>
    `;
    setTimeout(() => api.onComplete(result), 1600);
  }

  function destroy() {
    clickHandlers.forEach(({ btn, handler }) => btn.removeEventListener('click', handler));
    clickHandlers = [];
  }

  Luna.gameRegistry.register({
    id: 'ocean-world',
    title: 'Ocean World',
    emoji: '🌊',
    colorTheme: 'theme-sky',
    description: 'Explore the ocean',
    init,
    destroy,
  });
})(window.Luna = window.Luna || {});
