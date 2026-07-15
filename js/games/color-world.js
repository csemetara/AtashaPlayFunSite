/**
 * color-world.js
 * -----------------------------------------------------------------------
 * Freeform coloring book. Interaction pattern proved here: CANVAS PAINTING
 * (brush + paint bucket), built entirely on canvasEngine.js.
 *
 * Deliberately has no win condition to detect — per the "no incorrect
 * answers" requirement, completion is the CHILD's call via an "All Done!"
 * button, not something the game decides for them.
 * -----------------------------------------------------------------------
 */
(function (Atasha) {
  'use strict';

  const PALETTE = ['#E85D5D', '#F4C94F', '#5FBF7A', '#5C9FE0', '#A374D6', '#F0965C', '#E88BC6', '#7A5C3E'];

  const PICTURES = [
    {
      id: 'flower',
      label: 'Flower',
      draw: (ctx, w, h) => {
        const cx = w / 2, cy = h / 2;
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#333';
        // Stem
        ctx.beginPath();
        ctx.moveTo(cx, cy + 40);
        ctx.lineTo(cx, cy + 150);
        ctx.stroke();
        // Leaves
        ctx.beginPath();
        ctx.ellipse(cx - 35, cy + 110, 28, 14, Math.PI / 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(cx + 35, cy + 130, 28, 14, -Math.PI / 4, 0, Math.PI * 2);
        ctx.stroke();
        // Petals
        const petalCount = 6;
        for (let i = 0; i < petalCount; i++) {
          const angle = (i / petalCount) * Math.PI * 2;
          const px = cx + Math.cos(angle) * 55;
          const py = cy + Math.sin(angle) * 55;
          ctx.beginPath();
          ctx.ellipse(px, py, 32, 22, angle, 0, Math.PI * 2);
          ctx.stroke();
        }
        // Center
        ctx.beginPath();
        ctx.arc(cx, cy, 30, 0, Math.PI * 2);
        ctx.stroke();
      },
    },
    {
      id: 'sun',
      label: 'Happy Sun',
      draw: (ctx, w, h) => {
        const cx = w / 2, cy = h / 2;
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#333';
        // Rays
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const x1 = cx + Math.cos(angle) * 65;
          const y1 = cy + Math.sin(angle) * 65;
          const x2 = cx + Math.cos(angle) * 100;
          const y2 = cy + Math.sin(angle) * 100;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
        // Face circle
        ctx.beginPath();
        ctx.arc(cx, cy, 60, 0, Math.PI * 2);
        ctx.stroke();
        // Eyes
        ctx.beginPath();
        ctx.arc(cx - 20, cy - 10, 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx + 20, cy - 10, 6, 0, Math.PI * 2);
        ctx.stroke();
        // Smile
        ctx.beginPath();
        ctx.arc(cx, cy + 5, 25, 0.2 * Math.PI, 0.8 * Math.PI);
        ctx.stroke();
      },
    },
  ];

  let cleanupBrush = null;
  let currentPicture = null;
  let currentTool = 'brush';
  let api = null;
  let canvasEl = null;

  function redrawOutline() {
    const ctx = canvasEl.getContext('2d');
    Atasha.canvasEngine.clearCanvas(canvasEl, '#ffffff');
    currentPicture.draw(ctx, canvasEl.width, canvasEl.height);
  }

  function buildPalette(container, brushControl) {
    const row = Atasha.helpers.el('div', 'cw-palette-row');
    PALETTE.forEach((color) => {
      const swatch = Atasha.helpers.el('button', 'cw-swatch', { 'aria-label': `Color ${color}` });
      swatch.style.background = color;
      swatch.addEventListener('click', () => {
        brushControl.setColor(color);
        api.playSound('tap');
      });
      row.appendChild(swatch);
    });
    container.appendChild(row);
  }

  function init(container, gameApi) {
    api = gameApi;
    currentPicture = Atasha.helpers.shuffle(PICTURES)[0];
    currentTool = 'brush';

    container.innerHTML = `
      <div class="game-header">
        <h2>🎨 Color World</h2>
        <p class="game-instructions">Color the ${currentPicture.label.toLowerCase()} any way you like!</p>
      </div>
      <div class="cw-toolbar">
        <button class="cw-tool active" data-tool="brush">🖌️ Brush</button>
        <button class="cw-tool" data-tool="bucket">🪣 Fill</button>
        <button class="cw-tool" data-action="clear">🧽 Clear</button>
      </div>
      <div class="cw-canvas-wrap">
        <canvas class="cw-canvas" width="500" height="400"></canvas>
      </div>
      <div class="cw-palette-wrap"></div>
      <button class="cw-done-button">✅ All Done!</button>
    `;

    canvasEl = container.querySelector('.cw-canvas');
    redrawOutline();

    const brushControl = Atasha.canvasEngine.attachBrush(canvasEl, { color: PALETTE[0], lineWidth: 16 });
    cleanupBrush = brushControl.cleanup;

    // Paint bucket: single click/tap fills the region, doesn't need drag tracking
    function bucketHandler(e) {
      if (currentTool !== 'bucket') return;
      const rect = canvasEl.getBoundingClientRect();
      const point = e.touches ? e.touches[0] : e;
      const scaleX = canvasEl.width / rect.width;
      const scaleY = canvasEl.height / rect.height;
      const x = (point.clientX - rect.left) * scaleX;
      const y = (point.clientY - rect.top) * scaleY;
      Atasha.canvasEngine.floodFill(canvasEl, x, y, activeColor);
      api.playSound('tap');
    }
    let activeColor = PALETTE[0];
    canvasEl.addEventListener('click', bucketHandler);

    buildPalette(container.querySelector('.cw-palette-wrap'), {
      setColor: (c) => {
        activeColor = c;
        brushControl.setColor(c);
      },
    });

    container.querySelectorAll('.cw-tool[data-tool]').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentTool = btn.dataset.tool;
        container.querySelectorAll('.cw-tool[data-tool]').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        api.playSound('tap');
      });
    });

    container.querySelector('[data-action="clear"]').addEventListener('click', () => {
      redrawOutline();
      api.playSound('tap');
      api.speak('All clean! Start again.');
    });

    container.querySelector('.cw-done-button').addEventListener('click', () => {
      canvasEl.removeEventListener('click', bucketHandler);
      api.playSound('complete');
      api.speak('What a beautiful picture!');
      const result = api.awardStars(3);
      setTimeout(() => api.onComplete(result), 1200);
    });

    api.speak(`Let's color a ${currentPicture.label}! Pick a color and paint, or tap Fill to color a whole space at once.`);
  }

  function destroy() {
    if (cleanupBrush) cleanupBrush();
    cleanupBrush = null;
  }

  Atasha.gameRegistry.register({
    id: 'color-world',
    title: 'Color World',
    emoji: '🖍️',
    colorTheme: 'theme-peach',
    description: 'Paint a picture',
    init,
    destroy,
  });
})(window.Atasha = window.Atasha || {});
