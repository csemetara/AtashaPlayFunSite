/**
 * number-world.js
 * -----------------------------------------------------------------------
 * Three stage types, reusing patterns already proven elsewhere:
 *  1) "count"  — same shape as Ocean World's counting stage
 *  2) "match"  — drag the numeral onto the matching quantity of dots
 *                (same engine as Color Match)
 *  3) "order"  — tap three shuffled numbers in ascending order
 *                (new but tiny: just a tap-sequence check)
 *
 * ASSUMPTION: range is 1-10, not the spec's 1-20 — more appropriate for
 * where most 4-year-olds actually are; easy to widen later by changing
 * one constant (MAX_NUMBER) if that turns out to be too easy for her.
 * -----------------------------------------------------------------------
 */
(function (Luna) {
  'use strict';

  const MAX_NUMBER = 10;

  let api = null;
  let stages = [];
  let currentIndex = 0;
  let cleanupFns = [];

  function randInt(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  function buildCountStage() {
    const count = randInt(2, 8);
    const wrong = Luna.helpers.shuffle(
      [count - 1, count + 1, count + 2].filter((n) => n > 0 && n <= MAX_NUMBER && n !== count)
    ).slice(0, 2);
    return { type: 'count', count, choices: Luna.helpers.shuffle([count, ...wrong]) };
  }

  function buildMatchStage() {
    const chosen = Luna.helpers.shuffle(
      Array.from({ length: MAX_NUMBER }, (_, i) => i + 1)
    ).slice(0, 3);
    return { type: 'match', numbers: chosen };
  }

  function buildOrderStage() {
    const nums = Luna.helpers.shuffle(
      Luna.helpers.shuffle(Array.from({ length: MAX_NUMBER }, (_, i) => i + 1)).slice(0, 3).sort((a, b) => a - b)
    );
    return { type: 'order', numbers: nums, sorted: [...nums].sort((a, b) => a - b) };
  }

  // --- Count stage ---
  function renderCount(container, stage) {
    const dots = Array.from({ length: stage.count }, () => '⭐').join(' ');
    container.innerHTML = `
      <div class="game-header">
        <h2>🔢 Number World</h2>
        <p class="game-instructions">How many stars?</p>
      </div>
      <div class="ow-fish-display">${dots}</div>
      <div class="as-choices-row ow-number-row"></div>
    `;
    const row = container.querySelector('.ow-number-row');
    stage.choices.forEach((num) => {
      const btn = Luna.helpers.el('button', 'as-choice ow-number-choice', { 'aria-label': String(num) });
      btn.textContent = String(num);
      row.appendChild(btn);
      btn.addEventListener('click', () => {
        if (num === stage.count) {
          api.playSound('success');
          api.speak(`Yes! ${num}!`);
          row.querySelectorAll('.as-choice').forEach((b) => (b.style.pointerEvents = 'none'));
          setTimeout(() => advance(container), 900);
        } else {
          api.playSound('tryAgain');
          if (!api.calmMode) api.speak('Count again!');
          btn.classList.add('as-choice-shake');
          setTimeout(() => btn.classList.remove('as-choice-shake'), 400);
        }
      });
    });
    api.speak('Count the stars, then tap the number!');
  }

  // --- Match stage (numeral -> matching dot quantity, drag-and-drop) ---
  function renderMatch(container, stage) {
    container.innerHTML = `
      <div class="game-header">
        <h2>🔢 Number World</h2>
        <p class="game-instructions">Drag each number to its matching dots!</p>
      </div>
      <div class="nw-targets-row"></div>
      <div class="nw-numerals-row"></div>
    `;
    const targetsRow = container.querySelector('.nw-targets-row');
    const numeralsRow = container.querySelector('.nw-numerals-row');

    const targets = Luna.helpers.shuffle(stage.numbers).map((n) => {
      const target = Luna.helpers.el('div', 'nw-target', { 'data-number': String(n) });
      target.innerHTML = `<span class="nw-dots">${'●'.repeat(n)}</span>`;
      targetsRow.appendChild(target);
      return target;
    });

    let matchedCount = 0;
    cleanupFns = [];
    stage.numbers.forEach((n) => {
      const numeral = Luna.helpers.el('div', 'nw-numeral', { 'data-number': String(n) });
      numeral.textContent = String(n);
      numeralsRow.appendChild(numeral);

      const cleanup = Luna.helpers.makeDraggable(numeral, (x, y) => {
        const targetEl = targets.find((t) => Luna.helpers.isPointInside(x, y, t));
        if (targetEl && Number(targetEl.dataset.number) === n) {
          numeral.classList.add('nw-numeral-matched');
          numeral.style.pointerEvents = 'none';
          targetEl.classList.add('nw-target-filled');
          api.playSound('success');
          api.speak(`${n}!`);
          matchedCount += 1;
          if (matchedCount === stage.numbers.length) setTimeout(() => advance(container), 600);
        } else {
          api.playSound(targetEl ? 'tryAgain' : 'tap');
          numeral.style.position = '';
          numeral.style.left = '';
          numeral.style.top = '';
          numeral.style.zIndex = '';
        }
      });
      cleanupFns.push(cleanup);
    });

    api.speak('Drag each number to the matching dots!');
  }

  // --- Order stage (tap numbers smallest-to-largest) ---
  function renderOrder(container, stage) {
    container.innerHTML = `
      <div class="game-header">
        <h2>🔢 Number World</h2>
        <p class="game-instructions">Tap the numbers from smallest to biggest!</p>
      </div>
      <div class="as-choices-row nw-order-row"></div>
    `;
    let nextIndex = 0;
    const row = container.querySelector('.nw-order-row');
    stage.numbers.forEach((num) => {
      const btn = Luna.helpers.el('button', 'as-choice ow-number-choice', { 'aria-label': String(num) });
      btn.textContent = String(num);
      row.appendChild(btn);
      btn.addEventListener('click', () => {
        if (num === stage.sorted[nextIndex]) {
          btn.classList.add('as-choice-correct');
          btn.style.pointerEvents = 'none';
          api.playSound('success');
          api.speak(String(num));
          nextIndex += 1;
          if (nextIndex === stage.sorted.length) {
            setTimeout(() => advance(container), 700);
          }
        } else {
          api.playSound('tryAgain');
          if (!api.calmMode) api.speak('Find the smallest one!');
          btn.classList.add('as-choice-shake');
          setTimeout(() => btn.classList.remove('as-choice-shake'), 400);
        }
      });
    });
    api.speak('Tap the smallest number first!');
  }

  function renderStage(container) {
    const stage = stages[currentIndex];
    cleanupFns.forEach((fn) => fn());
    cleanupFns = [];
    if (stage.type === 'count') renderCount(container, stage);
    else if (stage.type === 'match') renderMatch(container, stage);
    else renderOrder(container, stage);
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
    cleanupFns = [];
    stages = [buildCountStage(), buildMatchStage(), buildOrderStage()];
    renderStage(container);
  }

  function finishRound(container) {
    api.playSound('complete');
    api.speak('Wonderful counting!');
    const result = api.awardStars(3);
    container.innerHTML = `
      <div class="game-header">
        <h2>🔢 Number World</h2>
        <p class="game-instructions">All done! Great job! ⭐⭐⭐</p>
      </div>
    `;
    setTimeout(() => api.onComplete(result), 1600);
  }

  function destroy() {
    cleanupFns.forEach((fn) => fn());
    cleanupFns = [];
  }

  Luna.gameRegistry.register({
    id: 'number-world',
    title: 'Number World',
    emoji: '🔢',
    colorTheme: 'theme-mint',
    description: 'Count, match, and order',
    init,
    destroy,
  });
})(window.Luna = window.Luna || {});
