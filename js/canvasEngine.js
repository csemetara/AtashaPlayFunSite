/**
 * canvasEngine.js
 * -----------------------------------------------------------------------
 * Single Responsibility: raw canvas drawing operations.
 * Both Color World (freehand + paint bucket) and Tracing (guided stroke)
 * depend on this one module instead of each re-implementing pointer
 * capture and pixel manipulation (Dependency Inversion + no duplication).
 *
 * This module knows nothing about game rules, scoring, or UI chrome —
 * it only knows how to put pixels on a canvas from pointer input.
 * -----------------------------------------------------------------------
 */
(function (Luna) {
  'use strict';

  /**
   * Attaches freehand brush-drawing to a canvas. Works with mouse and touch.
   * @param {HTMLCanvasElement} canvas
   * @param {{color: string, lineWidth?: number, onStroke?: Function}} opts
   * @returns {Function} cleanup function
   */
  function attachBrush(canvas, opts) {
    const ctx = canvas.getContext('2d');
    let drawing = false;
    let lastX = 0, lastY = 0;
    let currentColor = opts.color || '#333333';
    let lineWidth = opts.lineWidth || 14;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    function getPos(e) {
      const rect = canvas.getBoundingClientRect();
      const point = e.touches ? e.touches[0] : e;
      // Scale for canvases whose CSS size differs from their pixel buffer size
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (point.clientX - rect.left) * scaleX,
        y: (point.clientY - rect.top) * scaleY,
      };
    }

    function start(e) {
      drawing = true;
      const pos = getPos(e);
      lastX = pos.x;
      lastY = pos.y;
      // Draw a dot for a simple tap (no drag)
      ctx.beginPath();
      ctx.fillStyle = currentColor;
      ctx.arc(pos.x, pos.y, lineWidth / 2, 0, Math.PI * 2);
      ctx.fill();
      e.preventDefault();
    }

    function move(e) {
      if (!drawing) return;
      const pos = getPos(e);
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      lastX = pos.x;
      lastY = pos.y;
      if (opts.onStroke) opts.onStroke(pos);
      e.preventDefault();
    }

    function end() {
      drawing = false;
    }

    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('mousemove', move);
    canvas.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('mouseup', end);
    window.addEventListener('touchend', end);

    return {
      setColor: (c) => { currentColor = c; },
      setLineWidth: (w) => { lineWidth = w; },
      cleanup: () => {
        canvas.removeEventListener('mousedown', start);
        canvas.removeEventListener('touchstart', start);
        canvas.removeEventListener('mousemove', move);
        canvas.removeEventListener('touchmove', move);
        window.removeEventListener('mouseup', end);
        window.removeEventListener('touchend', end);
      },
    };
  }

  /**
   * Flood-fill paint bucket, starting at (x, y) in canvas pixel space.
   * Simple 4-directional stack-based fill with a color-distance tolerance
   * so anti-aliased line edges don't leave white slivers.
   */
  function floodFill(canvas, x, y, fillColorHex) {
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || y < 0 || x >= width || y >= height) return;

    const startIdx = (y * width + x) * 4;
    const startColor = [data[startIdx], data[startIdx + 1], data[startIdx + 2], data[startIdx + 3]];
    const fillColor = hexToRgba(fillColorHex);

    if (colorsMatch(startColor, fillColor, 0)) return; // already this color

    const tolerance = 40;
    const stack = [[x, y]];
    const visited = new Uint8Array(width * height);

    while (stack.length) {
      const [cx, cy] = stack.pop();
      if (cx < 0 || cy < 0 || cx >= width || cy >= height) continue;
      const vIdx = cy * width + cx;
      if (visited[vIdx]) continue;

      const idx = vIdx * 4;
      const pixelColor = [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];
      if (!colorsMatch(pixelColor, startColor, tolerance)) continue;

      visited[vIdx] = 1;
      data[idx] = fillColor[0];
      data[idx + 1] = fillColor[1];
      data[idx + 2] = fillColor[2];
      data[idx + 3] = 255;

      stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
    }

    ctx.putImageData(imageData, 0, 0);
  }

  function colorsMatch(a, b, tolerance) {
    return (
      Math.abs(a[0] - b[0]) <= tolerance &&
      Math.abs(a[1] - b[1]) <= tolerance &&
      Math.abs(a[2] - b[2]) <= tolerance &&
      Math.abs(a[3] - b[3]) <= tolerance
    );
  }

  function hexToRgba(hex) {
    const clean = hex.replace('#', '');
    const bigint = parseInt(clean, 16);
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255, 255];
  }

  function clearCanvas(canvas, bgColor) {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = bgColor || '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  Luna.canvasEngine = { attachBrush, floodFill, clearCanvas, hexToRgba };
})(window.Luna = window.Luna || {});
