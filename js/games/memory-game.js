/**
 * memory-game.js
 * -----------------------------------------------------------------------
 * Classic flip-and-match. Interaction pattern proved here: STATE MATCHING
 * (as opposed to drag-and-drop or sequential reveal).
 * No timer, no move counter, no penalty for mismatches — pure untimed
 * pattern recognition, replayable endlessly.
 * -----------------------------------------------------------------------
 */
(function (Luna) {
  'use strict';

  const CARD_BANK = [
    { emoji: '🍎', name: 'apple' },
    { emoji: '🍌', name: 'banana' },
    { emoji: '🍇', name: 'grapes' },
    { emoji: '🍓', name: 'strawberry' },
  ];

  let flippedCards = [];
  let matchedPairs = 0;
  let lockBoard = false;
  let api = null;
  let clickHandlers = [];

  function buildDeck() {
    const pairs = CARD_BANK.flatMap((item) => [item, item]);
    return Luna.helpers.shuffle(pairs);
  }

  function init(container, gameApi) {
    api = gameApi;
    flippedCards = [];
    matchedPairs = 0;
    lockBoard = false;
    clickHandlers = [];

    container.innerHTML = `
      <div class="game-header">
        <h2>🧠 Memory Match</h2>
        <p class="game-instructions">Flip two cards to find a match!</p>
      </div>
      <div class="mg-grid"></div>
    `;

    const grid = container.querySelector('.mg-grid');
    const deck = buildDeck();

    deck.forEach((cardData, index) => {
      const card = Luna.helpers.el('div', 'mg-card', { 'data-name': cardData.name });
      card.innerHTML = `
        <div class="mg-card-inner">
          <div class="mg-card-back">?</div>
          <div class="mg-card-front">${cardData.emoji}</div>
        </div>
      `;
      grid.appendChild(card);

      const handler = () => handleFlip(card, cardData);
      card.addEventListener('click', handler);
      clickHandlers.push({ card, handler });
    });

    api.speak('Flip two cards to find a matching pair!');
  }

  function handleFlip(card, cardData) {
    if (lockBoard || card.classList.contains('mg-flipped') || card.classList.contains('mg-matched')) return;

    card.classList.add('mg-flipped');
    api.playSound('tap');
    flippedCards.push({ card, cardData });

    if (flippedCards.length === 2) {
      lockBoard = true;
      const [first, second] = flippedCards;
      if (first.cardData.name === second.cardData.name) {
        setTimeout(() => {
          first.card.classList.add('mg-matched');
          second.card.classList.add('mg-matched');
          api.playSound('success');
          api.speak(`You found the ${first.cardData.name}s!`);
          matchedPairs += 1;
          flippedCards = [];
          lockBoard = false;
          if (matchedPairs === CARD_BANK.length) {
            setTimeout(finishGame, 500);
          }
        }, 500);
      } else {
        setTimeout(() => {
          // Gentle, encouraging — never negative
          if (!api.calmMode) api.playSound('tryAgain');
          first.card.classList.remove('mg-flipped');
          second.card.classList.remove('mg-flipped');
          flippedCards = [];
          lockBoard = false;
        }, 900);
      }
    }
  }

  function finishGame() {
    api.playSound('complete');
    api.speak('You matched them all! Amazing memory!');
    const result = api.awardStars(3);
    setTimeout(() => api.onComplete(result), 1500);
  }

  function destroy() {
    clickHandlers.forEach(({ card, handler }) => card.removeEventListener('click', handler));
    clickHandlers = [];
  }

  Luna.gameRegistry.register({
    id: 'memory-game',
    title: 'Memory Match',
    emoji: '🧠',
    colorTheme: 'theme-sky',
    description: 'Find matching pairs',
    init,
    destroy,
  });
})(window.Luna = window.Luna || {});
