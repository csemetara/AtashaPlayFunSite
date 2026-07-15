/**
 * color-matching.js
 * -----------------------------------------------------------------------
 * Drag colored objects into the bowl of the same color.
 * Interaction pattern proved here: DRAG-AND-DROP.
 * Design choices for a calm, predictable, non-punishing experience:
 *   - Wrong drops never fail the game — the item gently returns and a
 *     warm "try again" cue plays, nothing red, no X marks, no timers.
 *   - Round composition is fixed-but-shuffled (not random every replay),
 *     so repeated play feels familiar rather than chaotic.
 * -----------------------------------------------------------------------
 */
(function (Luna) {
  'use strict';

  const ITEM_BANK = [
    { emoji: '🍎', color: 'red', name: 'apple' },
    { emoji: '🍌', color: 'yellow', name: 'banana' },
    { emoji: '🍇', color: 'purple', name: 'grapes' },
    { emoji: '🐸', color: 'green', name: 'frog' },
    { emoji: '🍊', color: 'orange', name: 'orange' },
    { emoji: '🫐', color: 'blue', name: 'blueberry' },
  ];

  const COLOR_HEX = {
    red: '#E85D5D', yellow: '#F4C94F', purple: '#A374D6',
    green: '#5FBF7A', orange: '#F0965C', blue: '#5C9FE0',
  };

  let cleanupFns = [];
  let matchedCount = 0;
  let roundItems = [];
  let api = null;

  function buildBowl(color, container) {
    const bowl = Luna.helpers.el('div', 'cm-bowl', { 'data-color': color });
    bowl.style.setProperty('--bowl-color', COLOR_HEX[color]);
    bowl.innerHTML = `<div class="cm-bowl-inner"></div>`;
    container.appendChild(bowl);
    return bowl;
  }

  function buildItem(itemData, container) {
    const item = Luna.helpers.el('div', 'cm-item', { 'data-color': itemData.color });
    item.textContent = itemData.emoji;
    container.appendChild(item);
    return item;
  }

  function attachDrag(itemEl, itemData, bowls, onMatched) {
    const cleanup = Luna.helpers.makeDraggable(itemEl, (x, y) => {
      const targetBowl = bowls.find((b) => Luna.helpers.isPointInside(x, y, b));
      if (targetBowl && targetBowl.dataset.color === itemData.color) {
        // Correct match
        itemEl.classList.add('cm-item-matched');
        itemEl.style.pointerEvents = 'none';
        api.playSound('success');
        api.speak(`Yes! The ${itemData.name} is ${itemData.color}!`);
        onMatched();
      } else if (targetBowl) {
        // Wrong bowl — gentle bounce back, no penalty
        api.playSound('tryAgain');
        if (!api.calmMode) api.speak('Try again!');
        resetPosition(itemEl);
      } else {
        // Dropped outside any bowl — just reset, no feedback needed
        resetPosition(itemEl);
      }
    });
    cleanupFns.push(cleanup);
  }

  function resetPosition(itemEl) {
    itemEl.style.position = '';
    itemEl.style.left = '';
    itemEl.style.top = '';
    itemEl.style.zIndex = '';
  }

  function init(container, gameApi) {
    api = gameApi;
    matchedCount = 0;
    cleanupFns = [];

    const chosen = Luna.helpers.shuffle(ITEM_BANK).slice(0, 4);
    roundItems = chosen;

    container.innerHTML = `
      <div class="game-header">
        <h2>🎨 Color Match</h2>
        <p class="game-instructions">Drag each one to its color!</p>
      </div>
      <div class="cm-items-row"></div>
      <div class="cm-bowls-row"></div>
    `;

    const itemsRow = container.querySelector('.cm-items-row');
    const bowlsRow = container.querySelector('.cm-bowls-row');

    const bowls = Luna.helpers.shuffle(chosen).map((it) => buildBowl(it.color, bowlsRow));
    chosen.forEach((itemData) => {
      const itemEl = buildItem(itemData, itemsRow);
      attachDrag(itemEl, itemData, bowls, () => {
        matchedCount += 1;
        if (matchedCount === chosen.length) {
          setTimeout(() => finishRound(container), 600);
        }
      });
    });

    api.speak('Drag each fruit to the bowl with the same color!');
  }

  function finishRound(container) {
    api.playSound('complete');
    api.speak('Wonderful color matching!');
    const result = api.awardStars(3);
    container.querySelector('.game-instructions').textContent = 'All matched! Great job! ⭐⭐⭐';
    setTimeout(() => api.onComplete(result), 1800);
  }

  function destroy() {
    cleanupFns.forEach((fn) => fn());
    cleanupFns = [];
  }

  Luna.gameRegistry.register({
    id: 'color-matching',
    title: 'Color Match',
    emoji: '🎨',
    colorTheme: 'theme-berry',
    description: 'Match colors together',
    init,
    destroy,
  });
})(window.Luna = window.Luna || {});
