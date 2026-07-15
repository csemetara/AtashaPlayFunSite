/**
 * farm-adventure.js
 * -----------------------------------------------------------------------
 * Drag each food to the animal that eats it. Structurally the same game
 * as Color Match (drag N items to N matching targets) — proof that the
 * drag-and-drop engine generalizes cleanly across themes.
 * -----------------------------------------------------------------------
 */
(function (Luna) {
  'use strict';

  const PAIRS = [
    { animal: '🐄', animalName: 'cow', food: '🌾', foodName: 'hay' },
    { animal: '🐷', animalName: 'pig', food: '🌽', foodName: 'corn' },
    { animal: '🐰', animalName: 'rabbit', food: '🥕', foodName: 'carrot' },
    { animal: '🐴', animalName: 'horse', food: '🍎', foodName: 'apple' },
    { animal: '🐔', animalName: 'chicken', food: '🌰', foodName: 'seeds' },
  ];

  let cleanupFns = [];
  let matchedCount = 0;
  let api = null;

  function buildAnimal(pair, container) {
    const pen = Luna.helpers.el('div', 'fa-pen', { 'data-food': pair.food });
    pen.innerHTML = `<div class="fa-animal">${pair.animal}</div>`;
    container.appendChild(pen);
    return pen;
  }

  function buildFood(pair, container) {
    const item = Luna.helpers.el('div', 'fa-food', { 'data-food': pair.food });
    item.textContent = pair.food;
    container.appendChild(item);
    return item;
  }

  function attachDrag(itemEl, pair, pens, onMatched) {
    const cleanup = Luna.helpers.makeDraggable(itemEl, (x, y) => {
      const targetPen = pens.find((p) => Luna.helpers.isPointInside(x, y, p));
      if (targetPen && targetPen.dataset.food === pair.food) {
        itemEl.classList.add('fa-food-fed');
        itemEl.style.pointerEvents = 'none';
        targetPen.classList.add('fa-pen-fed');
        api.playSound('success');
        api.speak(`Yum! The ${pair.animalName} loves ${pair.foodName}!`);
        onMatched();
      } else {
        api.playSound(targetPen ? 'tryAgain' : 'tap');
        if (targetPen && !api.calmMode) api.speak('Try another snack!');
        itemEl.style.position = '';
        itemEl.style.left = '';
        itemEl.style.top = '';
        itemEl.style.zIndex = '';
      }
    });
    cleanupFns.push(cleanup);
  }

  function init(container, gameApi) {
    api = gameApi;
    matchedCount = 0;
    cleanupFns = [];

    const chosen = Luna.helpers.shuffle(PAIRS).slice(0, 4);

    container.innerHTML = `
      <div class="game-header">
        <h2>🚜 Farm Adventure</h2>
        <p class="game-instructions">Drag the food to the hungry animal!</p>
      </div>
      <div class="fa-pens-row"></div>
      <div class="fa-food-row"></div>
    `;

    const pensRow = container.querySelector('.fa-pens-row');
    const foodRow = container.querySelector('.fa-food-row');

    const pens = Luna.helpers.shuffle(chosen).map((pair) => buildAnimal(pair, pensRow));
    chosen.forEach((pair) => {
      const itemEl = buildFood(pair, foodRow);
      attachDrag(itemEl, pair, pens, () => {
        matchedCount += 1;
        if (matchedCount === chosen.length) {
          setTimeout(() => finishRound(container), 600);
        }
      });
    });

    api.speak('Feed each animal its favorite food!');
  }

  function finishRound(container) {
    api.playSound('complete');
    api.speak('All the animals are happy and fed!');
    const result = api.awardStars(3);
    container.querySelector('.game-instructions').textContent = 'Everyone is fed! Great job! ⭐⭐⭐';
    setTimeout(() => api.onComplete(result), 1800);
  }

  function destroy() {
    cleanupFns.forEach((fn) => fn());
    cleanupFns = [];
  }

  Luna.gameRegistry.register({
    id: 'farm-adventure',
    title: 'Farm Adventure',
    emoji: '🚜',
    colorTheme: 'theme-lavender',
    description: 'Feed the farm animals',
    init,
    destroy,
  });
})(window.Luna = window.Luna || {});
