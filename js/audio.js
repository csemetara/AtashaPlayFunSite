/**
 * audio.js
 * -----------------------------------------------------------------------
 * Single Responsibility: sound effects.
 * All effects are synthesized in-browser with the Web Audio API — no mp3
 * files, no CDN, no licensing risk, and it works with zero network access.
 * Every game calls Atasha.audio.play('success') etc.; none of them touch
 * AudioContext directly (Dependency Inversion — games depend on this
 * interface, not on the Web Audio API itself).
 * -----------------------------------------------------------------------
 */
(function (Atasha) {
  'use strict';

  let ctx = null;

  function getContext() {
    if (!ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      ctx = new AudioContextClass();
    }
    // Browsers suspend AudioContext until a user gesture; resume on demand.
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function isMuted() {
    return !!Atasha.storage.get('muted');
  }

  function getVolume() {
    const v = Atasha.storage.get('volume');
    return typeof v === 'number' ? v : 0.8;
  }

  /**
   * Plays a short tone or sequence of tones.
   * @param {Array<{freq:number, dur:number, type?:OscillatorType, delay?:number}>} notes
   */
  function playNotes(notes) {
    if (isMuted()) return;
    const audioCtx = getContext();
    const baseVolume = getVolume();

    notes.forEach(({ freq, dur, type = 'sine', delay = 0 }) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.value = freq;

      const startTime = audioCtx.currentTime + delay;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(baseVolume * 0.3, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

      osc.connect(gain).connect(audioCtx.destination);
      osc.start(startTime);
      osc.stop(startTime + dur + 0.05);
    });
  }

  // Named preset effects — kept gentle and non-startling by design.
  const PRESETS = {
    tap: () => playNotes([{ freq: 440, dur: 0.08, type: 'sine' }]),
    success: () => playNotes([
      { freq: 523.25, dur: 0.15 },
      { freq: 659.25, dur: 0.15, delay: 0.12 },
      { freq: 783.99, dur: 0.25, delay: 0.24 },
    ]),
    tryAgain: () => playNotes([
      { freq: 349.23, dur: 0.18, type: 'sine' },
      { freq: 293.66, dur: 0.22, delay: 0.14 },
    ]),
    starEarned: () => playNotes([
      { freq: 659.25, dur: 0.1 },
      { freq: 783.99, dur: 0.1, delay: 0.08 },
      { freq: 1046.5, dur: 0.3, delay: 0.16 },
    ]),
    complete: () => playNotes([
      { freq: 523.25, dur: 0.15 },
      { freq: 659.25, dur: 0.15, delay: 0.13 },
      { freq: 783.99, dur: 0.15, delay: 0.26 },
      { freq: 1046.5, dur: 0.4, delay: 0.39 },
    ]),
  };

  function play(presetName) {
    const preset = PRESETS[presetName];
    if (!preset) {
      console.warn(`[audio] Unknown sound preset: ${presetName}`);
      return;
    }
    // In calm mode, soften everything to a single short tone
    if (Atasha.storage.get('calmMode') && presetName !== 'tap') {
      playNotes([{ freq: 523.25, dur: 0.18 }]);
      return;
    }
    preset();
  }

  /**
   * Plays a single arbitrary-frequency tone. Used by instrument-style
   * games (Music Piano) that need real musical notes rather than one of
   * the fixed UI presets above.
   */
  function playTone(freq, duration = 0.4) {
    playNotes([{ freq, dur: duration, type: 'sine' }]);
  }

  Atasha.audio = { play, playTone, isMuted, getVolume };
})(window.Atasha = window.Atasha || {});
