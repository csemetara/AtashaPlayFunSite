/**
 * speech.js
 * -----------------------------------------------------------------------
 * Single Responsibility: spoken narration.
 * Wraps the Web Speech API (SpeechSynthesis) behind a small interface so
 * games never touch `window.speechSynthesis` directly. Falls back to a
 * silent no-op if the browser doesn't support it, so nothing ever throws.
 * -----------------------------------------------------------------------
 */
(function (Luna) {
  'use strict';

  const supported = 'speechSynthesis' in window;
  let preferredVoice = null;

  function pickVoice() {
    if (!supported) return null;
    const voices = window.speechSynthesis.getVoices();
    // Prefer a friendly-sounding English voice if available; otherwise first voice.
    return (
      voices.find((v) => /en-(US|GB)/i.test(v.lang) && /female|samantha|victoria|zira/i.test(v.name)) ||
      voices.find((v) => /^en/i.test(v.lang)) ||
      voices[0] ||
      null
    );
  }

  if (supported) {
    // Voice list loads asynchronously in some browsers.
    window.speechSynthesis.onvoiceschanged = () => {
      preferredVoice = pickVoice();
    };
    preferredVoice = pickVoice();
  }

  /**
   * Speaks a short phrase aloud.
   * @param {string} text
   * @param {{onEnd?: Function}} [opts]
   */
  function speak(text, opts = {}) {
    if (!supported || Luna.storage.get('muted')) {
      if (opts.onEnd) opts.onEnd();
      return;
    }
    window.speechSynthesis.cancel(); // don't stack narration
    const utter = new SpeechSynthesisUtterance(text);
    const calm = Luna.storage.get('calmMode');
    utter.voice = preferredVoice;
    utter.rate = calm ? 0.85 : 0.95;   // slightly slower for a 4-year-old
    utter.pitch = calm ? 1.0 : 1.15;   // warm, a little playful unless calm mode
    utter.volume = Luna.storage.get('volume') ?? 0.8;
    if (opts.onEnd) utter.onend = opts.onEnd;
    window.speechSynthesis.speak(utter);
  }

  function stop() {
    if (supported) window.speechSynthesis.cancel();
  }

  Luna.speech = { speak, stop, isSupported: () => supported };
})(window.Luna = window.Luna || {});
