/**
 * puzzle-game.js
 * -----------------------------------------------------------------------
 * Drag 4 pieces into a 2x2 frame to reconstruct a picture.
 * Interaction pattern: reuses drag-and-drop, adding only "slice a picture
 * into quadrants" on top — done once via an offscreen canvas rendered to
 * a data URL, then used as a CSS background-position trick for both the
 * draggable pieces and their target slots. This is more reliable than
 * slicing an emoji glyph, which renders inconsistently across browsers/
 * fonts and would make pieces not line up.
 * -----------------------------------------------------------------------
 */
(function (Atasha) {
  'use strict';

  const PIECE_SIZE = 110;
  const BOARD_SIZE = PIECE_SIZE * 2;

  const PICTURES = [
    {
      id: 'rocket',
      label: 'Rocket',
      draw: (ctx) => {
        ctx.fillStyle = '#BFE3F7';
        ctx.fillRect(0, 0, BOARD_SIZE, BOARD_SIZE);
        // Clouds
        ctx.fillStyle = '#fff';
        [[40, 40], [180, 70]].forEach(([x, y]) => {
          ctx.beginPath();
          ctx.arc(x, y, 16, 0, Math.PI * 2);
          ctx.arc(x + 16, y + 4, 12, 0, Math.PI * 2);
          ctx.arc(x - 14, y + 6, 11, 0, Math.PI * 2);
          ctx.fill();
        });
        const cx = BOARD_SIZE / 2;
        // Flame
        ctx.fillStyle = '#F4C94F';
        ctx.beginPath();
        ctx.moveTo(cx - 14, BOARD_SIZE - 55);
        ctx.lineTo(cx, BOARD_SIZE - 15);
        ctx.lineTo(cx + 14, BOARD_SIZE - 55);
        ctx.fill();
        // Body
        ctx.fillStyle = '#E85D5D';
        ctx.beginPath();
        ctx.moveTo(cx, 30);
        ctx.quadraticCurveTo(cx + 38, 90, cx + 30, 175);
        ctx.lineTo(cx - 30, 175);
        ctx.quadraticCurveTo(cx - 38, 90, cx, 30);
        ctx.fill();
        // Fins
        ctx.fillStyle = '#A374D6';
        ctx.beginPath();
        ctx.moveTo(cx - 30, 150); ctx.lineTo(cx - 55, 180); ctx.lineTo(cx - 30, 180); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx + 30, 150); ctx.lineTo(cx + 55, 180); ctx.lineTo(cx + 30, 180); ctx.fill();
        // Window
        ctx.fillStyle = '#BFE3F7';
        ctx.beginPath();
        ctx.arc(cx, 90, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 4;
        ctx.stroke();
      },
    },
    {
      id: 'house',
      label: 'Sunny House',
      draw: (ctx) => {
        ctx.fillStyle = '#BFE3F7';
        ctx.fillRect(0, 0, BOARD_SIZE, BOARD_SIZE / 2);
        ctx.fillStyle = '#B7E3A8';
        ctx.fillRect(0, BOARD_SIZE / 2, BOARD_SIZE, BOARD_SIZE / 2);
        // Sun
        ctx.fillStyle = '#F4C94F';
        ctx.beginPath();
        ctx.arc(45, 45, 24, 0, Math.PI * 2);
        ctx.fill();
        const cx = BOARD_SIZE / 2;
        // House body
        ctx.fillStyle = '#FFC98B';
        ctx.fillRect(cx - 55, 120, 110, 90);
        // Roof
        ctx.fillStyle = '#E85D5D';
        ctx.beginPath();
        ctx.moveTo(cx - 65, 120);
        ctx.lineTo(cx, 65);
        ctx.lineTo(cx + 65, 120);
        ctx.fill();
        // Door
        ctx.fillStyle = '#7A5C3E';
        ctx.fillRect(cx - 15, 165, 30, 45);
        // Window
        ctx.fillStyle = '#5C9FE0';
        ctx.fillRect(cx - 40, 135, 22, 22);
        ctx.fillRect(cx + 18, 135, 22, 22);
      },
    },
  ];

  let cleanupFns = [];
  let placedCount = 0;
  let api = null;
  let picture = null;
  let dataUrl = null;

  function renderPicture() {
    const canvas = document.createElement('canvas');
    canvas.width = BOARD_SIZE;
    canvas.height = BOARD_SIZE;
    const ctx = canvas.getContext('2d');
    picture.draw(ctx);
    return canvas.toDataURL('image/png');
  }

  function offsetFor(index) {
    const col = index % 2, row = Math.floor(index / 2);
    return `-${col * PIECE_SIZE}px -${row * PIECE_SIZE}px`;
  }

  function buildSlot(index, container) {
    const slot = Atasha.helpers.el('div', 'pz-slot', { 'data-index': String(index) });
    container.appendChild(slot);
    return slot;
  }

  function buildPiece(index, container) {
    const piece = Atasha.helpers.el('div', 'pz-piece', { 'data-index': String(index) });
    piece.style.backgroundImage = `url(${dataUrl})`;
    piece.style.backgroundPosition = offsetFor(index);
    container.appendChild(piece);
    return piece;
  }

  function attachDrag(pieceEl, index, slots, onPlaced) {
    const cleanup = Atasha.helpers.makeDraggable(pieceEl, (x, y) => {
      const targetSlot = slots.find((s) => Atasha.helpers.isPointInside(x, y, s));
      if (targetSlot && Number(targetSlot.dataset.index) === index) {
        targetSlot.style.backgroundImage = `url(${dataUrl})`;
        targetSlot.style.backgroundPosition = offsetFor(index);
        targetSlot.classList.add('pz-slot-filled');
        pieceEl.style.display = 'none';
        api.playSound('success');
        onPlaced();
      } else {
        api.playSound(targetSlot ? 'tryAgain' : 'tap');
        pieceEl.style.position = '';
        pieceEl.style.left = '';
        pieceEl.style.top = '';
        pieceEl.style.zIndex = '';
      }
    });
    cleanupFns.push(cleanup);
  }

  function init(container, gameApi) {
    api = gameApi;
    placedCount = 0;
    cleanupFns = [];
    picture = Atasha.helpers.shuffle(PICTURES)[0];
    dataUrl = renderPicture();

    container.innerHTML = `
      <div class="game-header">
        <h2>🧩 Puzzle</h2>
        <p class="game-instructions">Put the ${picture.label} back together!</p>
      </div>
      <div class="pz-board"></div>
      <div class="pz-tray"></div>
    `;

    const board = container.querySelector('.pz-board');
    board.style.width = `${BOARD_SIZE}px`;
    board.style.height = `${BOARD_SIZE}px`;

    const slots = [0, 1, 2, 3].map((i) => buildSlot(i, board));
    const tray = container.querySelector('.pz-tray');

    Atasha.helpers.shuffle([0, 1, 2, 3]).forEach((index) => {
      const piece = buildPiece(index, tray);
      attachDrag(piece, index, slots, () => {
        placedCount += 1;
        if (placedCount === 4) setTimeout(() => finishRound(container), 500);
      });
    });

    api.speak(`Let's put the ${picture.label} puzzle together! Drag each piece into its spot.`);
  }

  function finishRound(container) {
    api.playSound('complete');
    api.speak('You solved the puzzle! Amazing!');
    const result = api.awardStars(3);
    container.querySelector('.game-instructions').textContent = 'Puzzle complete! Great job! ⭐⭐⭐';
    setTimeout(() => api.onComplete(result), 1800);
  }

  function destroy() {
    cleanupFns.forEach((fn) => fn());
    cleanupFns = [];
  }

  Atasha.gameRegistry.register({
    id: 'puzzle-game',
    title: 'Puzzle',
    emoji: '🧩',
    colorTheme: 'theme-peach',
    description: 'Piece together a picture',
    init,
    destroy,
  });
})(window.Atasha = window.Atasha || {});
