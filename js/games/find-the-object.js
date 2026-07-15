/**
 * find-the-object.js
 * -----------------------------------------------------------------------
 * A canvas-drawn scene with a handful of target objects placed at fixed
 * relative positions. Tapping a target reveals/confirms it; tapping
 * anywhere else is a no-op (not a penalty — just nothing happens, keeping
 * exploration pressure-free). A Hint button pulses the next unfound
 * target and can be used as often as needed.
 *
 * New engine: scene + percentage-anchored hotspots. Percentages (not
 * pixels) keep hotspots aligned with the background image at any
 * container size, which is what makes this responsive-safe.
 * -----------------------------------------------------------------------
 */
(function (Atasha) {
  'use strict';

  const SCENE_W = 500, SCENE_H = 360;

  const SCENES = [
    {
      id: 'beach',
      label: 'Beach',
      draw: (ctx) => {
        ctx.fillStyle = '#BFE3F7';
        ctx.fillRect(0, 0, SCENE_W, 220);
        ctx.fillStyle = '#5C9FE0';
        ctx.fillRect(0, 180, SCENE_W, 60);
        ctx.fillStyle = '#F4E4BC';
        ctx.fillRect(0, 220, SCENE_W, SCENE_H - 220);
        ctx.fillStyle = '#F4C94F';
        ctx.beginPath(); ctx.arc(440, 50, 30, 0, Math.PI * 2); ctx.fill();
        // Simple clouds
        ctx.fillStyle = '#fff';
        [[80, 50], [220, 70]].forEach(([x, y]) => {
          ctx.beginPath();
          ctx.arc(x, y, 16, 0, Math.PI * 2);
          ctx.arc(x + 18, y + 2, 13, 0, Math.PI * 2);
          ctx.fill();
        });
      },
      targets: [
        { emoji: '🐚', name: 'seashell', xPct: 22, yPct: 78 },
        { emoji: '🦀', name: 'crab', xPct: 68, yPct: 88 },
        { emoji: '⛱️', name: 'umbrella', xPct: 82, yPct: 62 },
        { emoji: '🩴', name: 'sandal', xPct: 40, yPct: 92 },
      ],
    },
    {
      id: 'bedroom',
      label: 'Bedroom',
      draw: (ctx) => {
        ctx.fillStyle = '#E9E1FB';
        ctx.fillRect(0, 0, SCENE_W, SCENE_H);
        ctx.fillStyle = '#DDF5E8';
        ctx.fillRect(0, 280, SCENE_W, SCENE_H - 280);
        ctx.fillStyle = '#B9A9F5';
        ctx.fillRect(30, 150, 140, 130); // bed
        ctx.fillStyle = '#fff';
        ctx.fillRect(30, 150, 140, 30); // pillow area
      },
      targets: [
        { emoji: '🧸', name: 'teddy bear', xPct: 30, yPct: 55 },
        { emoji: '📚', name: 'book', xPct: 75, yPct: 80 },
        { emoji: '🎈', name: 'balloon', xPct: 60, yPct: 20 },
        { emoji: '⭐', name: 'star', xPct: 88, yPct: 30 },
      ],
    },
  ];

  let api = null;
  let scene = null;
  let foundIds = new Set();
  let hintTimer = null;

  function renderScene() {
    const canvas = document.createElement('canvas');
    canvas.width = SCENE_W;
    canvas.height = SCENE_H;
    scene.draw(canvas.getContext('2d'));
    return canvas.toDataURL('image/png');
  }

  function checkComplete(container) {
    if (foundIds.size === scene.targets.length) {
      setTimeout(() => finishRound(container), 700);
    }
  }

  function init(container, gameApi) {
    api = gameApi;
    scene = Atasha.helpers.shuffle(SCENES)[0];
    foundIds = new Set();
    if (hintTimer) clearTimeout(hintTimer);

    const dataUrl = renderScene();

    container.innerHTML = `
      <div class="game-header">
        <h2>🔍 Find the Object</h2>
        <p class="game-instructions">Find: ${scene.targets.map((t) => t.emoji).join(' ')}</p>
      </div>
      <div class="fo-scene-wrap">
        <div class="fo-scene" style="background-image:url(${dataUrl})"></div>
      </div>
      <button class="fo-hint-button">💡 Hint</button>
    `;

    const sceneEl = container.querySelector('.fo-scene');

    scene.targets.forEach((target, i) => {
      const hotspot = Atasha.helpers.el('button', 'fo-hotspot', {
        'data-index': String(i),
        'aria-label': `Find the ${target.name}`,
      });
      hotspot.style.left = `${target.xPct}%`;
      hotspot.style.top = `${target.yPct}%`;
      hotspot.innerHTML = `<span class="fo-hotspot-emoji">${target.emoji}</span>`;
      hotspot.addEventListener('click', () => {
        if (foundIds.has(i)) return;
        foundIds.add(i);
        hotspot.classList.add('fo-hotspot-found');
        api.playSound('success');
        api.speak(`You found the ${target.name}!`);
        checkComplete(container);
      });
      sceneEl.appendChild(hotspot);
    });

    container.querySelector('.fo-hint-button').addEventListener('click', () => {
      const nextUnfound = scene.targets.findIndex((_, i) => !foundIds.has(i));
      if (nextUnfound === -1) return;
      const hotspot = sceneEl.querySelector(`.fo-hotspot[data-index="${nextUnfound}"]`);
      if (hotspot) {
        hotspot.classList.add('fo-hotspot-hint');
        if (hintTimer) clearTimeout(hintTimer);
        hintTimer = setTimeout(() => hotspot.classList.remove('fo-hotspot-hint'), 1500);
      }
      api.speak(`Look for the ${scene.targets[nextUnfound].name}!`);
    });

    api.speak(`Let's find some hidden things! Look for the ${scene.targets[0].name} and more!`);
  }

  function finishRound(container) {
    api.playSound('complete');
    api.speak('You found everything! Great searching!');
    const result = api.awardStars(3);
    const instructions = container.querySelector('.game-instructions');
    if (instructions) instructions.textContent = 'All found! Great job! ⭐⭐⭐';
    setTimeout(() => api.onComplete(result), 1600);
  }

  function destroy() {
    if (hintTimer) clearTimeout(hintTimer);
    hintTimer = null;
  }

  Atasha.gameRegistry.register({
    id: 'find-the-object',
    title: 'Find the Object',
    emoji: '🔍',
    colorTheme: 'theme-mint',
    description: 'Hunt for hidden things',
    init,
    destroy,
  });
})(window.Atasha = window.Atasha || {});
