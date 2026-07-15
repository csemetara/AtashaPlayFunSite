/**
 * balloon-game.js
 * -----------------------------------------------------------------------
 * Pop balloons matching a stated objective (a color, or a number).
 * Same floatingObjects engine as Bubble Pop, configured differently —
 * this is exactly the reuse the engine split was designed for.
 *
 * Wrong pops still pop (satisfying, consistent with the rest of the app)
 * but simply don't count toward the goal — no negative sound, no scolding
 * voice line, just a neutral tap. Gentle reminders are rate-limited so
 * they never nag.
 * -----------------------------------------------------------------------
 */
(function (Luna) {
  'use strict';

  const COLOR_HEX = {
    red: '#E85D5D', yellow: '#F4C94F', green: '#5FBF7A', blue: '#5C9FE0', purple: '#A374D6',
  };
  const COLORS = Object.keys(COLOR_HEX);
  const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const GOAL = 4;

  let engine = null;
  let matchedCount = 0;
  let wrongTapsSinceHint = 0;
  let api = null;
  let objective = null;
  let finished = false;

  function pickObjective() {
    const type = Math.random() < 0.5 ? 'color' : 'number';
    if (type === 'color') {
      const target = COLORS[Math.floor(Math.random() * COLORS.length)];
      const distractors = Luna.helpers.shuffle(COLORS.filter((c) => c !== target)).slice(0, 2);
      // Target appears 3x among 5 pool entries (60%) so the goal is reachable
      // at a comfortable pace for a young child, while distractors still
      // require her to actually look before tapping.
      return {
        type,
        target,
        label: `Pop the ${target} balloons!`,
        items: [target, target, target, ...distractors].map((c) => ({ color: c })),
      };
    }
    const target = NUMBERS[Math.floor(Math.random() * NUMBERS.length)];
    const distractors = Luna.helpers.shuffle(NUMBERS.filter((n) => n !== target)).slice(0, 2);
    return {
      type,
      target,
      label: `Pop the balloons with the number ${target}!`,
      items: [target, target, target, ...distractors].map((n) => ({ number: n })),
    };
  }

  function isMatch(data) {
    if (objective.type === 'color') return data.color === objective.target;
    return data.number === objective.target;
  }

  function buildBalloon(data) {
    const el = Luna.helpers.el('div', 'bg-balloon');
    if (objective.type === 'color') {
      el.style.background = COLOR_HEX[data.color];
    } else {
      el.style.background = '#B9A9F5';
      el.innerHTML = `<span class="bg-balloon-number">${data.number}</span>`;
    }
    return el;
  }

  function init(container, gameApi) {
    api = gameApi;
    matchedCount = 0;
    wrongTapsSinceHint = 0;
    finished = false;
    objective = pickObjective();

    container.innerHTML = `
      <div class="game-header">
        <h2>🎈 Balloon Game</h2>
        <p class="game-instructions">${objective.label}</p>
      </div>
      <div class="bp-progress">Found: <span class="bg-count">0</span> / ${GOAL}</div>
      <div class="bp-play-area bg-play-area"></div>
    `;

    const playArea = container.querySelector('.bp-play-area');
    playArea.style.position = 'relative';

    engine = Luna.floatingObjects.create(playArea, {
      items: objective.items,
      renderItem: buildBalloon,
      speed: 42,
      spawnIntervalMs: 950,
      maxOnScreen: 5,
      onTap: (data) => {
        if (finished) return;
        if (isMatch(data)) {
          api.playSound('success');
          matchedCount += 1;
          wrongTapsSinceHint = 0;
          const countEl = container.querySelector('.bg-count');
          if (countEl) countEl.textContent = String(matchedCount);
          if (matchedCount >= GOAL) {
            finishRound(container);
          }
        } else {
          api.playSound('tap'); // neutral, not a "wrong" sound
          wrongTapsSinceHint += 1;
          if (wrongTapsSinceHint >= 3 && !api.calmMode) {
            wrongTapsSinceHint = 0;
            api.speak(objective.label);
          }
        }
      },
    });
    engine.start();

    api.speak(objective.label);
  }

  function finishRound(container) {
    if (finished) return;
    finished = true;
    if (engine) engine.stop();
    api.playSound('complete');
    api.speak('You found them all! Wonderful!');
    const result = api.awardStars(3);
    const instructions = container.querySelector('.game-instructions');
    if (instructions) instructions.textContent = 'All found! Great job! ⭐⭐⭐';
    setTimeout(() => api.onComplete(result), 1600);
  }

  function destroy() {
    if (engine) engine.destroy();
    engine = null;
  }

  Luna.gameRegistry.register({
    id: 'balloon-game',
    title: 'Balloon Game',
    emoji: '🎈',
    colorTheme: 'theme-berry',
    description: 'Pop the matching balloons',
    init,
    destroy,
  });
})(window.Luna = window.Luna || {});
