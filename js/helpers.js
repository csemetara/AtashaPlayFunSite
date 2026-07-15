/**
 * helpers.js
 * -----------------------------------------------------------------------
 * Small, pure, reusable utility functions with no dependencies on other
 * Atasha modules — safe to use anywhere, including future non-game UI.
 * -----------------------------------------------------------------------
 */
(function (Atasha) {
  'use strict';

  function shuffle(array) {
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function el(tag, className, attrs = {}) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    Object.entries(attrs).forEach(([key, value]) => {
      if (key === 'text') node.textContent = value;
      else node.setAttribute(key, value);
    });
    return node;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Sets up unified pointer-based dragging (works for touch AND mouse,
   * unlike native HTML5 drag-and-drop which is unreliable on tablets).
   * @param {HTMLElement} dragEl - the element being dragged
   * @param {Function} onDrop - called with (clientX, clientY) on release
   */
  function makeDraggable(dragEl, onDrop) {
    let offsetX = 0, offsetY = 0, dragging = false;

    function start(e) {
      dragging = true;
      dragEl.classList.add('is-dragging');
      const point = e.touches ? e.touches[0] : e;
      const rect = dragEl.getBoundingClientRect();
      offsetX = point.clientX - rect.left;
      offsetY = point.clientY - rect.top;
      dragEl.style.position = 'fixed';
      dragEl.style.zIndex = 1000;
      move(e);
      e.preventDefault();
    }

    function move(e) {
      if (!dragging) return;
      const point = e.touches ? e.touches[0] : e;
      dragEl.style.left = `${point.clientX - offsetX}px`;
      dragEl.style.top = `${point.clientY - offsetY}px`;
    }

    function end(e) {
      if (!dragging) return;
      dragging = false;
      dragEl.classList.remove('is-dragging');
      const point = e.changedTouches ? e.changedTouches[0] : e;
      onDrop(point.clientX, point.clientY);
    }

    dragEl.addEventListener('mousedown', start);
    dragEl.addEventListener('touchstart', start, { passive: false });
    window.addEventListener('mousemove', move);
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('mouseup', end);
    window.addEventListener('touchend', end);

    // Return a cleanup function so games can remove listeners on destroy()
    return function cleanup() {
      dragEl.removeEventListener('mousedown', start);
      dragEl.removeEventListener('touchstart', start);
      window.removeEventListener('mousemove', move);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('mouseup', end);
      window.removeEventListener('touchend', end);
    };
  }

  function isPointInside(x, y, targetEl) {
    const rect = targetEl.getBoundingClientRect();
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  Atasha.helpers = { shuffle, el, clamp, makeDraggable, isPointInside };
})(window.Atasha = window.Atasha || {});
