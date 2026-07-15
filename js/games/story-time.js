/**
 * story-time.js
 * -----------------------------------------------------------------------
 * A short narrated picture book. Each page auto-narrates on arrival, has
 * one gentle tap-interaction (a little animated flourish + sound — never
 * a right/wrong test), and Next/Prev/Replay controls.
 * New engine: page sequencing with per-page narration + a single
 * decorative interactive element, distinct from the multi-choice "stage
 * loops" used elsewhere (no correctness check here at all).
 * -----------------------------------------------------------------------
 */
(function (Atasha) {
  'use strict';

  const STORIES = [
    {
      id: 'bunny',
      title: "Little Bunny's Big Day",
      pages: [
        { text: 'Once there was a little bunny who loved to hop.', emoji: '🐰', tapEmoji: '🌼', tapText: 'Boing!' },
        { text: 'Bunny hopped through the green forest.', emoji: '🌳🐰🌳', tapEmoji: '🦋', tapText: 'Flutter flutter!' },
        { text: 'Bunny found a shiny pond and looked at the sky.', emoji: '🐰💧', tapEmoji: '☁️', tapText: 'Whoosh!' },
        { text: 'Bunny made a new friend, a little bird!', emoji: '🐰🐦', tapEmoji: '🎵', tapText: 'Tweet tweet!' },
        { text: 'Bunny hopped home happy, ready for a cozy sleep.', emoji: '🐰🌙', tapEmoji: '⭐', tapText: 'Twinkle!' },
      ],
    },
    {
      id: 'puppy',
      title: 'The Lost Puppy',
      pages: [
        { text: 'A little puppy wandered away from home.', emoji: '🐶', tapEmoji: '👣', tapText: 'Pitter patter!' },
        { text: 'Puppy looked all around the park.', emoji: '🐶🌳', tapEmoji: '🍃', tapText: 'Rustle rustle!' },
        { text: 'A kind squirrel helped puppy find the way.', emoji: '🐶🐿️', tapEmoji: '🌰', tapText: 'Pop!' },
        { text: 'Puppy saw home in the distance and ran fast!', emoji: '🐶🏠', tapEmoji: '💨', tapText: 'Zoom!' },
        { text: 'Puppy was home again, safe and loved.', emoji: '🐶❤️', tapEmoji: '💖', tapText: 'Yay!' },
      ],
    },
  ];

  let api = null;
  let story = null;
  let pageIndex = 0;

  function renderPage(container) {
    const page = story.pages[pageIndex];
    const isLast = pageIndex === story.pages.length - 1;

    container.innerHTML = `
      <div class="game-header">
        <h2>📖 ${story.title}</h2>
      </div>
      <div class="st-page">
        <div class="st-page-emoji">${page.emoji}</div>
        <button class="st-tap-element" aria-label="Tap for a surprise">${page.tapEmoji}</button>
        <p class="st-page-text">${page.text}</p>
      </div>
      <div class="st-controls">
        <button class="st-prev-btn" ${pageIndex === 0 ? 'disabled' : ''}>⬅ Back</button>
        <button class="st-replay-btn">🔁 Replay</button>
        <button class="st-next-btn">${isLast ? '🎉 The End' : 'Next ➡'}</button>
      </div>
      <div class="st-page-dots">${story.pages.map((_, i) => `<span class="st-dot ${i === pageIndex ? 'st-dot-active' : ''}"></span>`).join('')}</div>
    `;

    container.querySelector('.st-tap-element').addEventListener('click', (e) => {
      const tapEl = e.currentTarget;
      tapEl.classList.add('st-tap-bounce');
      setTimeout(() => tapEl.classList.remove('st-tap-bounce'), 500);
      api.playSound('tap');
      api.speak(page.tapText);
    });

    const prevBtn = container.querySelector('.st-prev-btn');
    if (prevBtn) prevBtn.addEventListener('click', () => { pageIndex -= 1; renderPage(container); });

    container.querySelector('.st-replay-btn').addEventListener('click', () => api.speak(page.text));

    container.querySelector('.st-next-btn').addEventListener('click', () => {
      if (isLast) {
        finishStory(container);
      } else {
        pageIndex += 1;
        renderPage(container);
      }
    });

    api.speak(page.text);
  }

  function init(container, gameApi) {
    api = gameApi;
    story = Atasha.helpers.shuffle(STORIES)[0];
    pageIndex = 0;
    renderPage(container);
  }

  function finishStory(container) {
    api.playSound('complete');
    api.speak('The end! What a lovely story!');
    const result = api.awardStars(3);
    container.innerHTML = `
      <div class="game-header">
        <h2>📖 ${story.title}</h2>
        <p class="game-instructions">The End! Great listening! ⭐⭐⭐</p>
      </div>
    `;
    setTimeout(() => api.onComplete(result), 1800);
  }

  function destroy() {
    // No timers/listeners persist beyond the container's own lifecycle
    // (each renderPage call replaces innerHTML, detaching old listeners).
  }

  Atasha.gameRegistry.register({
    id: 'story-time',
    title: 'Story Time',
    emoji: '📖',
    colorTheme: 'theme-peach',
    description: 'Listen to a story',
    init,
    destroy,
  });
})(window.Atasha = window.Atasha || {});
