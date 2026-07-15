/**
 * floatingObjects.js
 * -----------------------------------------------------------------------
 * Single Responsibility: spawning and animating objects that drift upward
 * inside a container, and detecting taps on them.
 * Neither Bubble Pop nor Balloon Game re-implement spawning/animation —
 * both configure this one engine differently (Open/Closed: new
 * "floating tap" games in the future configure this too, no edits here).
 *
 * Deliberately simple physics (linear drift + gentle horizontal sway) —
 * calm and predictable rather than fast or chaotic, per the no-startling
 * design principle for the whole app.
 * -----------------------------------------------------------------------
 */
(function (Atasha) {
  'use strict';

  /**
   * @param {HTMLElement} container - positioned (relative) element to spawn into
   * @param {{
   *   items: Array<any>,           // pool of data objects, one randomly chosen per spawn
   *   renderItem: (data) => HTMLElement,  // builds the visual element for one item
   *   speed?: number,               // px/second upward drift, default 60
   *   spawnIntervalMs?: number,     // default 1400
   *   maxOnScreen?: number,         // default 5
   *   onTap: (data, element) => void,
   * }} config
   * @returns {{ start: Function, stop: Function, destroy: Function }}
   */
  function create(container, config) {
    const speed = config.speed || 60;
    const spawnIntervalMs = config.spawnIntervalMs || 1400;
    const maxOnScreen = config.maxOnScreen || 5;

    let spawnTimer = null;
    let rafId = null;
    let running = false;
    const active = []; // { el, data, x, y, vy, sway, swayPhase }

    function spawnOne() {
      if (active.length >= maxOnScreen) return;
      const data = config.items[Math.floor(Math.random() * config.items.length)];
      const el = config.renderItem(data);
      el.classList.add('floating-object');
      const containerWidth = container.clientWidth || 400;
      const startX = 30 + Math.random() * Math.max(1, containerWidth - 90);

      el.style.position = 'absolute';
      el.style.left = `${startX}px`;
      el.style.top = `${container.clientHeight + 20}px`;
      container.appendChild(el);

      const entry = {
        el,
        data,
        x: startX,
        y: container.clientHeight + 20,
        vy: speed * (0.85 + Math.random() * 0.3),
        swayPhase: Math.random() * Math.PI * 2,
      };

      function handleTap(e) {
        e.stopPropagation();
        config.onTap(data, el);
        removeEntry(entry);
      }
      el.addEventListener('click', handleTap);
      el.addEventListener('touchstart', handleTap, { passive: true });
      entry._handleTap = handleTap;

      active.push(entry);
    }

    function removeEntry(entry) {
      const idx = active.indexOf(entry);
      if (idx !== -1) active.splice(idx, 1);
      if (entry.el && entry.el.parentNode) entry.el.parentNode.removeChild(entry.el);
    }

    let lastTs = null;
    function tick(ts) {
      if (!running) return;
      if (lastTs === null) lastTs = ts;
      const dt = (ts - lastTs) / 1000;
      lastTs = ts;

      for (let i = active.length - 1; i >= 0; i--) {
        const entry = active[i];
        entry.y -= entry.vy * dt;
        entry.swayPhase += dt * 1.2;
        const swayOffset = Math.sin(entry.swayPhase) * 8;
        entry.el.style.top = `${entry.y}px`;
        entry.el.style.transform = `translateX(${swayOffset}px)`;
        if (entry.y < -80) {
          removeEntry(entry); // drifted off top, gently disappears — no penalty
        }
      }
      rafId = requestAnimationFrame(tick);
    }

    function start() {
      if (running) return;
      running = true;
      lastTs = null;
      spawnTimer = setInterval(spawnOne, spawnIntervalMs);
      spawnOne();
      rafId = requestAnimationFrame(tick);
    }

    function stop() {
      running = false;
      if (spawnTimer) clearInterval(spawnTimer);
      if (rafId) cancelAnimationFrame(rafId);
      spawnTimer = null;
      rafId = null;
    }

    function destroy() {
      stop();
      active.slice().forEach(removeEntry);
    }

    return { start, stop, destroy };
  }

  Atasha.floatingObjects = { create };
})(window.Atasha = window.Atasha || {});
