/**
 * dress-up.js
 * -----------------------------------------------------------------------
 * Drag accessories onto the character. Variant of the drag-and-drop
 * pattern: instead of "correct target only," EVERY accessory is correct
 * as long as it lands anywhere on the character — it then snaps to its
 * own preset anchor point and layers visually with whatever's already
 * equipped. No wrong answers at all, by design (dress-up has no "right"
 * outfit) — the only feedback is delighted rather than corrective.
 * -----------------------------------------------------------------------
 */
(function (Atasha) {
  'use strict';

  const STAGE_W = 260, STAGE_H = 320;

  // Anchors are percentages of the character stage, so accessories always
  // land in the same visual spot on the character regardless of exactly
  // where within the stage the child dropped them.
  const ACCESSORIES = [
    { id: 'crown', emoji: '👑', label: 'Crown', anchor: { left: '50%', top: '6%' }, size: '2.6rem' },
    { id: 'bow', emoji: '🎀', label: 'Bow', anchor: { left: '50%', top: '34%' }, size: '2.2rem' },
    { id: 'wand', emoji: '🪄', label: 'Wand', anchor: { left: '84%', top: '55%' }, size: '2.4rem' },
    { id: 'shoes', emoji: '✨', label: 'Sparkly Shoes', anchor: { left: '50%', top: '92%' }, size: '2.2rem' },
    { id: 'pet', emoji: '🐰', label: 'Bunny Friend', anchor: { left: '14%', top: '84%' }, size: '2.6rem' },
  ];

  function drawCharacter(ctx) {
    ctx.clearRect(0, 0, STAGE_W, STAGE_H);
    const cx = STAGE_W / 2;
    // Dress (trapezoid)
    ctx.fillStyle = '#E88BC6';
    ctx.beginPath();
    ctx.moveTo(cx - 30, 140);
    ctx.lineTo(cx + 30, 140);
    ctx.lineTo(cx + 65, 260);
    ctx.lineTo(cx - 65, 260);
    ctx.closePath();
    ctx.fill();
    // Arms
    ctx.strokeStyle = '#FFD9B3';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - 28, 155); ctx.lineTo(cx - 55, 200);
    ctx.moveTo(cx + 28, 155); ctx.lineTo(cx + 55, 200);
    ctx.stroke();
    // Head
    ctx.fillStyle = '#FFD9B3';
    ctx.beginPath();
    ctx.arc(cx, 95, 42, 0, Math.PI * 2);
    ctx.fill();
    // Hair
    ctx.fillStyle = '#7A5C3E';
    ctx.beginPath();
    ctx.arc(cx, 80, 46, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(cx - 46, 75, 14, 60);
    ctx.fillRect(cx + 32, 75, 14, 60);
    // Face
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(cx - 14, 95, 3.5, 0, Math.PI * 2);
    ctx.arc(cx + 14, 95, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, 105, 12, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  }

  let cleanupFns = [];
  let equippedCount = 0;
  let api = null;

  function buildStage(container) {
    const stage = Atasha.helpers.el('div', 'du-stage');
    stage.style.width = `${STAGE_W}px`;
    stage.style.height = `${STAGE_H}px`;
    const canvas = document.createElement('canvas');
    canvas.width = STAGE_W;
    canvas.height = STAGE_H;
    canvas.className = 'du-character-canvas';
    drawCharacter(canvas.getContext('2d'));
    stage.appendChild(canvas);
    container.appendChild(stage);
    return stage;
  }

  function buildTrayItem(accessory, container) {
    const item = Atasha.helpers.el('div', 'du-tray-item', { 'data-id': accessory.id });
    item.style.fontSize = accessory.size;
    item.textContent = accessory.emoji;
    container.appendChild(item);
    return item;
  }

  function equip(stage, accessory) {
    const worn = Atasha.helpers.el('div', 'du-worn-item');
    worn.style.left = accessory.anchor.left;
    worn.style.top = accessory.anchor.top;
    worn.style.fontSize = accessory.size;
    worn.textContent = accessory.emoji;
    stage.appendChild(worn);
  }

  function attachDrag(itemEl, accessory, stage, onEquipped) {
    const cleanup = Atasha.helpers.makeDraggable(itemEl, (x, y) => {
      if (Atasha.helpers.isPointInside(x, y, stage)) {
        equip(stage, accessory);
        itemEl.style.display = 'none';
        api.playSound('success');
        api.speak(`${accessory.label} on!`);
        onEquipped();
      } else {
        itemEl.style.position = '';
        itemEl.style.left = '';
        itemEl.style.top = '';
        itemEl.style.zIndex = '';
      }
    });
    cleanupFns.push(cleanup);
  }

  function init(container, gameApi) {
    api = gameApi;
    equippedCount = 0;
    cleanupFns = [];

    container.innerHTML = `
      <div class="game-header">
        <h2>👑 Dress-Up</h2>
        <p class="game-instructions">Drag accessories onto your character!</p>
      </div>
      <div class="du-layout">
        <div class="du-stage-wrap"></div>
        <div class="du-tray"></div>
      </div>
      <button class="cw-done-button du-done-button">✅ All Done!</button>
    `;

    const stageWrap = container.querySelector('.du-stage-wrap');
    const stage = buildStage(stageWrap);
    const tray = container.querySelector('.du-tray');

    Atasha.helpers.shuffle(ACCESSORIES).forEach((accessory) => {
      const item = buildTrayItem(accessory, tray);
      attachDrag(item, accessory, stage, () => {
        equippedCount += 1;
      });
    });

    container.querySelector('.du-done-button').addEventListener('click', () => {
      finishRound(container);
    });

    api.speak('Dress up your character any way you like!');
  }

  function finishRound(container) {
    api.playSound('complete');
    api.speak('You look amazing!');
    const result = api.awardStars(3);
    setTimeout(() => api.onComplete(result), 1200);
  }

  function destroy() {
    cleanupFns.forEach((fn) => fn());
    cleanupFns = [];
  }

  Atasha.gameRegistry.register({
    id: 'dress-up',
    title: 'Dress-Up',
    emoji: '👑',
    colorTheme: 'theme-berry',
    description: 'Style your character',
    init,
    destroy,
  });
})(window.Atasha = window.Atasha || {});
