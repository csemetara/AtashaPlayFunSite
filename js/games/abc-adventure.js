/**
 * abc-adventure.js
 * -----------------------------------------------------------------------
 * For each letter: show it big, let the child tap to hear it, then drag
 * the object that starts with that letter into the basket.
 * Interaction pattern: reuses TAP-TO-HEAR (new, small) + DRAG-AND-DROP
 * (proven in Phase 1). Decoy objects are chosen from other letters to
 * keep the round short and never punishing — a wrong drag just bounces
 * back with encouragement, same as every other game.
 * -----------------------------------------------------------------------
 */
(function (Atasha) {
  'use strict';

  const LETTER_BANK = [
    { letter: 'A', emoji: '🍎', word: 'Apple' },
    { letter: 'B', emoji: '🎈', word: 'Balloon' },
    { letter: 'C', emoji: '🐱', word: 'Cat' },
    { letter: 'D', emoji: '🐶', word: 'Dog' },
    { letter: 'F', emoji: '🐟', word: 'Fish' },
    { letter: 'M', emoji: '🌙', word: 'Moon' },
    { letter: 'S', emoji: '⭐', word: 'Star' },
    { letter: 'T', emoji: '🐢', word: 'Turtle' },
  ];

  let cleanupFns = [];
  let api = null;
  let roundLetters = [];
  let currentIndex = 0;

  function pickDecoys(currentEntry, count) {
    const pool = LETTER_BANK.filter((e) => e.letter !== currentEntry.letter);
    return Atasha.helpers.shuffle(pool).slice(0, count);
  }

  function renderLetterStage(container) {
    const entry = roundLetters[currentIndex];
    const decoys = pickDecoys(entry, 2);
    const choices = Atasha.helpers.shuffle([entry, ...decoys]);

    container.innerHTML = `
      <div class="game-header">
        <h2>🔤 ABC Adventure</h2>
        <p class="game-instructions">Tap the letter, then drag ${entry.word}'s friend into the basket!</p>
      </div>
      <button class="abc-big-letter" aria-label="Hear the letter ${entry.letter}">${entry.letter}</button>
      <div class="abc-basket-row">
        <div class="abc-basket" data-letter="${entry.letter}">
          <div class="abc-basket-emoji">🧺</div>
        </div>
      </div>
      <div class="abc-choices-row"></div>
    `;

    const bigLetter = container.querySelector('.abc-big-letter');
    bigLetter.addEventListener('click', () => {
      api.playSound('tap');
      api.speak(`${entry.letter}. ${entry.word} starts with ${entry.letter}.`);
    });

    const basket = container.querySelector('.abc-basket');
    const choicesRow = container.querySelector('.abc-choices-row');

    choices.forEach((choiceEntry) => {
      const item = Atasha.helpers.el('div', 'abc-choice-item', { 'data-letter': choiceEntry.letter });
      item.textContent = choiceEntry.emoji;
      choicesRow.appendChild(item);

      const cleanup = Atasha.helpers.makeDraggable(item, (x, y) => {
        const inBasket = Atasha.helpers.isPointInside(x, y, basket);
        if (inBasket && choiceEntry.letter === entry.letter) {
          item.classList.add('abc-choice-matched');
          item.style.pointerEvents = 'none';
          api.playSound('success');
          api.speak(`Yes! ${choiceEntry.word} starts with ${entry.letter}!`);
          setTimeout(() => advance(container), 700);
        } else {
          api.playSound(inBasket ? 'tryAgain' : 'tap');
          if (inBasket && !api.calmMode) api.speak('Try again!');
          item.style.position = '';
          item.style.left = '';
          item.style.top = '';
          item.style.zIndex = '';
        }
      });
      cleanupFns.push(cleanup);
    });

    api.speak(`This is the letter ${entry.letter}. Tap it to hear it!`);
  }

  function advance(container) {
    currentIndex += 1;
    cleanupFns.forEach((fn) => fn());
    cleanupFns = [];
    if (currentIndex >= roundLetters.length) {
      finishRound(container);
    } else {
      renderLetterStage(container);
    }
  }

  function init(container, gameApi) {
    api = gameApi;
    currentIndex = 0;
    cleanupFns = [];
    roundLetters = Atasha.helpers.shuffle(LETTER_BANK).slice(0, 3);
    renderLetterStage(container);
  }

  function finishRound(container) {
    api.playSound('complete');
    api.speak('Wonderful! You learned three letters!');
    const result = api.awardStars(3);
    container.innerHTML = `
      <div class="game-header">
        <h2>🔤 ABC Adventure</h2>
        <p class="game-instructions">All done! Great job! ⭐⭐⭐</p>
      </div>
    `;
    setTimeout(() => api.onComplete(result), 1800);
  }

  function destroy() {
    cleanupFns.forEach((fn) => fn());
    cleanupFns = [];
  }

  Atasha.gameRegistry.register({
    id: 'abc-adventure',
    title: 'ABC Adventure',
    emoji: '🔤',
    colorTheme: 'theme-lavender',
    description: 'Learn letters and sounds',
    init,
    destroy,
  });
})(window.Atasha = window.Atasha || {});
