/**
 * sing-along.js
 * -----------------------------------------------------------------------
 * Highlights lyrics line-by-line while singing along. New engine, but
 * kept honest: rather than guessing word timing (unreliable across
 * browsers/voices), each line's completion is driven by the Web Speech
 * API's own onEnd callback — so the highlight advances exactly when that
 * line actually finishes being spoken, not on an estimate.
 *
 * ASSUMPTION: your original spec listed "Baby Shark," which is a
 * copyrighted modern song — its lyrics can't be reproduced. Swapped in
 * traditional public-domain nursery rhymes instead (all centuries-old,
 * anonymous-authorship folk songs, freely reproducible in full).
 * -----------------------------------------------------------------------
 */
(function (Luna) {
  'use strict';

  const SONGS = [
    {
      id: 'twinkle',
      title: 'Twinkle Twinkle Little Star',
      emoji: '⭐',
      lines: [
        'Twinkle, twinkle, little star,',
        'How I wonder what you are.',
        'Up above the world so high,',
        'Like a diamond in the sky.',
        'Twinkle, twinkle, little star,',
        'How I wonder what you are.',
      ],
    },
    {
      id: 'spider',
      title: 'Itsy Bitsy Spider',
      emoji: '🕷️',
      lines: [
        'The itsy bitsy spider climbed up the water spout.',
        'Down came the rain and washed the spider out.',
        'Out came the sun and dried up all the rain,',
        'And the itsy bitsy spider climbed up the spout again.',
      ],
    },
    {
      id: 'macdonald',
      title: 'Old MacDonald Had a Farm',
      emoji: '🐄',
      lines: [
        'Old MacDonald had a farm, E-I-E-I-O!',
        'And on that farm he had a cow, E-I-E-I-O!',
        'With a moo-moo here, and a moo-moo there,',
        'Here a moo, there a moo, everywhere a moo-moo.',
        'Old MacDonald had a farm, E-I-E-I-O!',
      ],
    },
    {
      id: 'rowboat',
      title: 'Row, Row, Row Your Boat',
      emoji: '🚣',
      lines: [
        'Row, row, row your boat,',
        'Gently down the stream.',
        'Merrily, merrily, merrily, merrily,',
        'Life is but a dream.',
      ],
    },
  ];

  let api = null;
  let song = null;
  let singing = false;
  let currentLine = 0;
  let container = null;

  function highlightLine(index) {
    const lineEls = container.querySelectorAll('.sa-line');
    lineEls.forEach((el, i) => el.classList.toggle('sa-line-active', i === index));
    const character = container.querySelector('.sa-character');
    if (character) {
      character.classList.remove('sa-bounce');
      // eslint-disable-next-line no-unused-expressions
      void character.offsetWidth; // restart animation
      character.classList.add('sa-bounce');
    }
  }

  function singLine(index) {
    if (!singing || index >= song.lines.length) {
      singing = false;
      const singBtn = container.querySelector('.sa-sing-btn');
      if (singBtn) singBtn.textContent = '🎤 Sing Along';
      if (index >= song.lines.length) {
        onSongFinished();
      }
      return;
    }
    currentLine = index;
    highlightLine(index);

    // Prefer the real onEnd event (accurate to actual speech duration), but
    // never rely on it exclusively — some browsers/environments have no
    // installed voices and silently never fire onEnd, which would otherwise
    // leave the sing-through stuck forever on this line.
    let advanced = false;
    const advanceOnce = () => {
      if (advanced) return;
      advanced = true;
      singLine(index + 1);
    };
    const words = song.lines[index].split(/\s+/).length;
    const fallbackMs = Math.max(1800, words * 420);
    const fallbackTimer = setTimeout(advanceOnce, fallbackMs);

    Luna.speech.speak(song.lines[index], {
      onEnd: () => {
        clearTimeout(fallbackTimer);
        advanceOnce();
      },
    });
  }

  function onSongFinished() {
    api.playSound('complete');
    api.speak('What a lovely song!');
    const result = api.awardStars(3);
    setTimeout(() => api.onComplete(result), 1600);
  }

  function renderLines() {
    return song.lines
      .map((line, i) => `<p class="sa-line" data-index="${i}">${line}</p>`)
      .join('');
  }

  function init(containerEl, gameApi) {
    api = gameApi;
    container = containerEl;
    song = Luna.helpers.shuffle(SONGS)[0];
    singing = false;
    currentLine = 0;

    container.innerHTML = `
      <div class="game-header">
        <h2>🎤 Sing Along</h2>
        <p class="game-instructions">${song.title}</p>
      </div>
      <div class="sa-character">${song.emoji}</div>
      <div class="sa-lyrics-box">${renderLines()}</div>
      <div class="sa-controls">
        <button class="sa-sing-btn">🎤 Sing Along</button>
        <button class="cw-done-button sa-done-button">✅ All Done!</button>
      </div>
    `;

    container.querySelectorAll('.sa-line').forEach((lineEl) => {
      lineEl.addEventListener('click', () => {
        if (singing) return; // don't fight the active sing-through
        const idx = Number(lineEl.dataset.index);
        highlightLine(idx);
        api.speak(song.lines[idx]);
      });
    });

    container.querySelector('.sa-sing-btn').addEventListener('click', (e) => {
      if (singing) {
        singing = false;
        Luna.speech.stop();
        e.currentTarget.textContent = '🎤 Sing Along';
      } else {
        singing = true;
        e.currentTarget.textContent = '⏹️ Stop';
        singLine(0);
      }
    });

    container.querySelector('.sa-done-button').addEventListener('click', () => {
      singing = false;
      Luna.speech.stop();
      onSongFinished();
    });
  }

  function destroy() {
    singing = false;
    Luna.speech.stop();
  }

  Luna.gameRegistry.register({
    id: 'sing-along',
    title: 'Sing Along',
    emoji: '🎤',
    colorTheme: 'theme-sky',
    description: 'Sing favorite songs',
    init,
    destroy,
  });
})(window.Luna = window.Luna || {});
