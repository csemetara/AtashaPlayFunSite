/**
 * shape-matching.js
 * -----------------------------------------------------------------------
 * Drag each shape into the hole of the same shape.
 * Pure reuse of the drag-and-drop pattern proved by Color Match — no new
 * architecture, which is exactly what the registry pattern is for.
 * -----------------------------------------------------------------------
 */
(function (Luna) {
  'use strict';

  const SHAPE_BANK = [
    { id: 'circle', label: 'circle', svg: '<circle cx="45" cy="45" r="40"/>' },
    { id: 'square', label: 'square', svg: '<rect x="8" y="8" width="74" height="74" rx="6"/>' },
    { id: 'triangle', label: 'triangle', svg: '<polygon points="45,6 88,84 2,84"/>' },
    { id: 'star', label: 'star', svg: '<polygon points="45,4 55,32 85,32 60,50 70,80 45,62 20,80 30,50 5,32 35,32"/>' },
    { id: 'heart', label: 'heart', svg: '<path d="M45 82 C10 55 5 30 25 18 C38 10 45 22 45 22 C45 22 52 10 65 18 C85 30 80 55 45 82 Z"/>' },
  ];

  let cleanupFns = [];
  let matchedCount = 0;
  let api = null;

  function buildHole(shape, container) {
    const hole = Luna.helpers.el('div', 'sh-hole', { 'data-shape': shape.id });
    hole.innerHTML = `<svg viewBox="0 0 90 90" class="sh-hole-svg">${shape.svg}</svg>`;
    container.appendChild(hole);
    return hole;
  }

  function buildShape(shape, container) {
    const item = Luna.helpers.el('div', 'sh-item', { 'data-shape': shape.id });
    item.innerHTML = `<svg viewBox="0 0 90 90" class="sh-item-svg">${shape.svg}</svg>`;
    container.appendChild(item);
    return item;
  }

  function attachDrag(itemEl, shape, holes, onMatched) {
    const cleanup = Luna.helpers.makeDraggable(itemEl, (x, y) => {
      const targetHole = holes.find((h) => Luna.helpers.isPointInside(x, y, h));
      if (targetHole && targetHole.dataset.shape === shape.id) {
        itemEl.classList.add('sh-item-matched');
        itemEl.style.pointerEvents = 'none';
        targetHole.classList.add('sh-hole-filled');
        api.playSound('success');
        api.speak(`Yes! That's a ${shape.label}!`);
        onMatched();
      } else {
        api.playSound(targetHole ? 'tryAgain' : 'tap');
        if (targetHole && !api.calmMode) api.speak('Try again!');
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

    const chosen = Luna.helpers.shuffle(SHAPE_BANK).slice(0, 4);

    container.innerHTML = `
      <div class="game-header">
        <h2>🔺 Shape Match</h2>
        <p class="game-instructions">Drag each shape into its hole!</p>
      </div>
      <div class="sh-holes-row"></div>
      <div class="sh-items-row"></div>
    `;

    const holesRow = container.querySelector('.sh-holes-row');
    const itemsRow = container.querySelector('.sh-items-row');

    const holes = Luna.helpers.shuffle(chosen).map((s) => buildHole(s, holesRow));
    chosen.forEach((shape) => {
      const itemEl = buildShape(shape, itemsRow);
      attachDrag(itemEl, shape, holes, () => {
        matchedCount += 1;
        if (matchedCount === chosen.length) {
          setTimeout(() => finishRound(container), 600);
        }
      });
    });

    api.speak('Drag each shape into the matching hole!');
  }

  function finishRound(container) {
    api.playSound('complete');
    api.speak('Fantastic shape matching!');
    const result = api.awardStars(3);
    container.querySelector('.game-instructions').textContent = 'All matched! Great job! ⭐⭐⭐';
    setTimeout(() => api.onComplete(result), 1800);
  }

  function destroy() {
    cleanupFns.forEach((fn) => fn());
    cleanupFns = [];
  }

  Luna.gameRegistry.register({
    id: 'shape-matching',
    title: 'Shape Match',
    emoji: '🔺',
    colorTheme: 'theme-mint',
    description: 'Match shapes to holes',
    init,
    destroy,
  });
})(window.Luna = window.Luna || {});
