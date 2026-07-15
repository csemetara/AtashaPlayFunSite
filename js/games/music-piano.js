/**
 * music-piano.js
 * -----------------------------------------------------------------------
 * Tap keys to play notes; Record then Play to hear a melody played back
 * with its original timing. New engine: real musical frequencies via
 * Atasha.audio.playTone (added as a small additive export to audio.js).
 * Open-ended like Color World — no goal, completion is child-initiated.
 * -----------------------------------------------------------------------
 */
(function (Atasha) {
  'use strict';

  // C major scale, one octave — simple, always-consonant, no wrong notes.
  const KEYS = [
    { note: 'C', freq: 261.63, color: '#E85D5D' },
    { note: 'D', freq: 293.66, color: '#F0965C' },
    { note: 'E', freq: 329.63, color: '#F4C94F' },
    { note: 'F', freq: 349.23, color: '#5FBF7A' },
    { note: 'G', freq: 392.0, color: '#5C9FE0' },
    { note: 'A', freq: 440.0, color: '#A374D6' },
    { note: 'B', freq: 493.88, color: '#E88BC6' },
    { note: 'C2', freq: 523.25, color: '#E85D5D' },
  ];

  let api = null;
  let recording = false;
  let recordedNotes = []; // { freq, atMs }
  let recordStartTime = 0;
  let playbackTimers = [];

  function pressKey(keyEl, keyData) {
    keyEl.classList.add('mp-key-active');
    setTimeout(() => keyEl.classList.remove('mp-key-active'), 200);
    Atasha.audio.playTone(keyData.freq, 0.5);
    if (recording) {
      recordedNotes.push({ freq: keyData.freq, atMs: Date.now() - recordStartTime });
    }
  }

  function init(container, gameApi) {
    api = gameApi;
    recording = false;
    recordedNotes = [];
    playbackTimers.forEach(clearTimeout);
    playbackTimers = [];

    container.innerHTML = `
      <div class="game-header">
        <h2>🎹 Music Piano</h2>
        <p class="game-instructions">Tap the keys to make music!</p>
      </div>
      <div class="mp-toolbar">
        <button class="mp-record-btn">⏺️ Record</button>
        <button class="mp-play-btn">▶️ Play Back</button>
      </div>
      <div class="mp-keys-row"></div>
      <button class="cw-done-button mp-done-button">✅ All Done!</button>
    `;

    const keysRow = container.querySelector('.mp-keys-row');
    KEYS.forEach((keyData) => {
      const key = Atasha.helpers.el('button', 'mp-key', { 'aria-label': `Note ${keyData.note}` });
      key.style.background = keyData.color;
      key.addEventListener('click', () => pressKey(key, keyData));
      keysRow.appendChild(key);
    });

    const recordBtn = container.querySelector('.mp-record-btn');
    recordBtn.addEventListener('click', () => {
      recording = !recording;
      if (recording) {
        recordedNotes = [];
        recordStartTime = Date.now();
        recordBtn.textContent = '⏹️ Stop';
        recordBtn.classList.add('mp-recording');
        api.speak('Recording! Play something!');
      } else {
        recordBtn.textContent = '⏺️ Record';
        recordBtn.classList.remove('mp-recording');
        if (recordedNotes.length) api.speak('Got it! Tap Play Back to hear it!');
      }
    });

    container.querySelector('.mp-play-btn').addEventListener('click', () => {
      playbackTimers.forEach(clearTimeout);
      playbackTimers = [];
      if (!recordedNotes.length) {
        api.speak('Record something first!');
        return;
      }
      recordedNotes.forEach((n) => {
        const t = setTimeout(() => Atasha.audio.playTone(n.freq, 0.4), n.atMs);
        playbackTimers.push(t);
      });
    });

    container.querySelector('.mp-done-button').addEventListener('click', () => finishSession());

    api.speak('Play the piano! Tap any key to hear a note.');
  }

  function finishSession() {
    playbackTimers.forEach(clearTimeout);
    playbackTimers = [];
    api.playSound('complete');
    api.speak('Beautiful music!');
    const result = api.awardStars(3);
    setTimeout(() => api.onComplete(result), 1200);
  }

  function destroy() {
    playbackTimers.forEach(clearTimeout);
    playbackTimers = [];
  }

  Atasha.gameRegistry.register({
    id: 'music-piano',
    title: 'Music Piano',
    emoji: '🎹',
    colorTheme: 'theme-lavender',
    description: 'Play and record music',
    init,
    destroy,
  });
})(window.Atasha = window.Atasha || {});
