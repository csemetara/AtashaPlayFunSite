/**
 * tracing.js
 * -----------------------------------------------------------------------
 * Trace over a dashed guide shape/letter. Reuses canvasEngine's brush,
 * adding only "how much of the guide did the child cover" logic on top.
 *
 * Forgiving by design: coverage auto-completes at a generous 55%
 * threshold, AND a manual "Done!" button always works regardless of
 * coverage — tracing can never be "failed", only finished.
 * -----------------------------------------------------------------------
 */
(function (Luna) {
  'use strict';

  const CANVAS_W = 500, CANVAS_H = 350;
  const COVERAGE_TOLERANCE = 26; // px radius around a guide point counted as "traced"
  const COVERAGE_THRESHOLD = 0.55;

  function circlePoints(cx, cy, r, steps) {
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
    }
    return pts;
  }

  function linePoints(x1, y1, x2, y2, steps) {
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      pts.push({ x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t });
    }
    return pts;
  }

  const cx = CANVAS_W / 2, cy = CANVAS_H / 2;

  const TRACE_BANK = [
    { id: 'circle', label: 'Circle', points: circlePoints(cx, cy, 90, 40) },
    {
      id: 'star',
      label: 'Star',
      points: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].flatMap((i, idx, arr) => {
        if (idx === arr.length - 1) return [];
        const angleFor = (k) => (k / 10) * Math.PI * 2 - Math.PI / 2;
        const radiusFor = (k) => (k % 2 === 0 ? 100 : 42);
        const a1 = angleFor(arr[idx]), r1 = radiusFor(arr[idx]);
        const a2 = angleFor(arr[idx + 1]), r2 = radiusFor(arr[idx + 1]);
        return linePoints(cx + Math.cos(a1) * r1, cy + Math.sin(a1) * r1, cx + Math.cos(a2) * r2, cy + Math.sin(a2) * r2, 6);
      }),
    },
    {
      id: 'letter-t',
      label: 'Letter T',
      points: [
        ...linePoints(cx - 70, cy - 90, cx + 70, cy - 90, 20),
        ...linePoints(cx, cy - 90, cx, cy + 90, 20),
      ],
    },
  ];

  let brushControl = null;
  let api = null;
  let canvasEl = null;
  let covered = null;
  let shape = null;

  function drawGuide(ctx) {
    ctx.save();
    ctx.setLineDash([10, 8]);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#C9C4E8';
    ctx.beginPath();
    shape.points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.stroke();
    ctx.restore();
  }

  function checkCoverage(pos) {
    let changed = false;
    shape.points.forEach((p, i) => {
      if (covered[i]) return;
      const dx = p.x - pos.x, dy = p.y - pos.y;
      if (dx * dx + dy * dy <= COVERAGE_TOLERANCE * COVERAGE_TOLERANCE) {
        covered[i] = true;
        changed = true;
      }
    });
    if (changed) {
      const ratio = covered.filter(Boolean).length / covered.length;
      updateProgress(ratio);
      if (ratio >= COVERAGE_THRESHOLD) {
        finishTracing();
      }
    }
  }

  function updateProgress(ratio) {
    const bar = document.querySelector('.tr-progress-fill');
    if (bar) bar.style.width = `${Math.min(100, Math.round(ratio * 100))}%`;
  }

  let finished = false;

  function finishTracing() {
    if (finished) return;
    finished = true;
    api.playSound('complete');
    api.speak('Beautiful tracing!');
    const result = api.awardStars(3);
    setTimeout(() => api.onComplete(result), 1400);
  }

  function init(container, gameApi) {
    api = gameApi;
    finished = false;
    shape = Luna.helpers.shuffle(TRACE_BANK)[0];
    covered = shape.points.map(() => false);

    container.innerHTML = `
      <div class="game-header">
        <h2>✏️ Tracing</h2>
        <p class="game-instructions">Trace the ${shape.label.toLowerCase()} with your finger!</p>
      </div>
      <div class="tr-progress-track"><div class="tr-progress-fill"></div></div>
      <div class="cw-canvas-wrap">
        <canvas class="tr-canvas" width="${CANVAS_W}" height="${CANVAS_H}"></canvas>
      </div>
      <button class="tr-done-button">✅ I'm Done!</button>
    `;

    canvasEl = container.querySelector('.tr-canvas');
    const ctx = canvasEl.getContext('2d');
    Luna.canvasEngine.clearCanvas(canvasEl, '#ffffff');
    drawGuide(ctx);

    brushControl = Luna.canvasEngine.attachBrush(canvasEl, {
      color: '#FF8B6B',
      lineWidth: 10,
      onStroke: checkCoverage,
    });

    container.querySelector('.tr-done-button').addEventListener('click', finishTracing);

    api.speak(`Let's trace the ${shape.label}! Follow the dotted line.`);
  }

  function destroy() {
    if (brushControl) brushControl.cleanup();
    brushControl = null;
  }

  Luna.gameRegistry.register({
    id: 'tracing',
    title: 'Tracing',
    emoji: '✏️',
    colorTheme: 'theme-sky',
    description: 'Trace letters and shapes',
    init,
    destroy,
  });
})(window.Luna = window.Luna || {});
