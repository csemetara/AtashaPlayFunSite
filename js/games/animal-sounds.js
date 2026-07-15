/**
 * animal-sounds.js
 * -----------------------------------------------------------------------
 * Hear an animal's sound (spoken as onomatopoeia via TTS — see assumption
 * note below), then tap the matching animal among 3 choices.
 * Interaction pattern: TAP-TO-CHOOSE, a simpler sibling of ABC Adventure's
 * letter stage (same round-loop shape, no drag needed here).
 *
 * ASSUMPTION: true recorded animal sounds aren't available offline without
 * licensed audio assets, so the "sound" is spoken text (e.g. "Moo!") via
 * the same Web Speech narration used everywhere else. Flagging in case
 * real sound clips are wanted later — that would be a drop-in swap in
 * this one function (playCurrentSound), nothing else would change.
 * -----------------------------------------------------------------------
 */
(function (Luna) {
  'use strict';

  const ANIMAL_BANK = [
    { name: 'Cow', emoji: '🐄', sound: 'Mooo!' },
    { name: 'Dog', emoji: '🐶', sound: 'Woof woof!' },
    { name: 'Cat', emoji: '🐱', sound: 'Meow!' },
    { name: 'Duck', emoji: '🦆', sound: 'Quack quack!' },
    { name: 'Sheep', emoji: '🐑', sound: 'Baa baa!' },
    { name: 'Pig', emoji: '🐷', sound: 'Oink oink!' },
    { name: 'Lion', emoji: '🦁', sound: 'Roar!' },
    { name: 'Horse', emoji: '🐴', sound: 'Neigh!' },
  ];

  let api = null;
  let roundAnimals = [];
  let currentIndex = 0;
  let clickHandlers = [];

  function pickChoices(correctEntry) {
    const decoys = Luna.helpers.shuffle(ANIMAL_BANK.filter((a) => a.name !== correctEntry.name)).slice(0, 2);
    return Luna.helpers.shuffle([correctEntry, ...decoys]);
  }

  function playCurrentSound(entry) {
    api.playSound('tap');
    api.speak(entry.sound);
  }

  function renderStage(container) {
    const entry = roundAnimals[currentIndex];
    const choices = pickChoices(entry);

    container.innerHTML = `
      <div class="game-header">
        <h2>🐾 Animal Sounds</h2>
        <p class="game-instructions">Tap the speaker, then find the animal!</p>
      </div>
      <button class="as-speaker-button" aria-label="Play animal sound">🔊</button>
      <div class="as-choices-row"></div>
    `;

    container.querySelector('.as-speaker-button').addEventListener('click', () => playCurrentSound(entry));

    const choicesRow = container.querySelector('.as-choices-row');
    clickHandlers = [];
    choices.forEach((choiceEntry) => {
      const btn = Luna.helpers.el('button', 'as-choice', { 'aria-label': choiceEntry.name });
      btn.innerHTML = `<span class="as-choice-emoji">${choiceEntry.emoji}</span>`;
      choicesRow.appendChild(btn);

      const handler = () => {
        if (choiceEntry.name === entry.name) {
          btn.classList.add('as-choice-correct');
          api.playSound('success');
          api.speak(`That's right! It's a ${choiceEntry.name}!`);
          choicesRow.querySelectorAll('.as-choice').forEach((b) => (b.style.pointerEvents = 'none'));
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

    // Auto-play the sound once when the stage first appears
    playCurrentSound(entry);
  }

  function advance(container) {
    currentIndex += 1;
    if (currentIndex >= roundAnimals.length) {
      finishRound(container);
    } else {
      renderStage(container);
    }
  }

  function init(container, gameApi) {
    api = gameApi;
    currentIndex = 0;
    roundAnimals = Luna.helpers.shuffle(ANIMAL_BANK).slice(0, 3);
    renderStage(container);
  }

  function finishRound(container) {
    api.playSound('complete');
    api.speak('Wonderful! You know your animal sounds!');
    const result = api.awardStars(3);
    container.innerHTML = `
      <div class="game-header">
        <h2>🐾 Animal Sounds</h2>
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
    id: 'animal-sounds',
    title: 'Animal Sounds',
    emoji: '🐾',
    colorTheme: 'theme-mint',
    description: 'Match sounds to animals',
    init,
    destroy,
  });
})(window.Luna = window.Luna || {});
