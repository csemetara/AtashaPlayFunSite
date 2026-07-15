/**
 * ui.js
 * -----------------------------------------------------------------------
 * Single Responsibility: rendering the home screen and parent dashboard.
 * Reads the game list from Atasha.gameRegistry (never hardcoded), so adding
 * a new game automatically adds a new home card with zero UI edits.
 * -----------------------------------------------------------------------
 */
(function (Atasha) {
  'use strict';

  function renderTopBar(container, { showBack, onBack } = {}) {
    const bar = Atasha.helpers.el('div', 'top-bar');
    const calmOn = !!Atasha.storage.get('calmMode');
    const mutedOn = !!Atasha.storage.get('muted');

    bar.innerHTML = `
      ${showBack ? '<button class="top-bar-back" aria-label="Back">⬅</button>' : '<div></div>'}
      <div class="top-bar-controls">
        <button class="pill-toggle ${calmOn ? 'active' : ''}" data-action="calm" aria-pressed="${calmOn}">
          🌙 Calm Mode
        </button>
        <button class="pill-toggle ${mutedOn ? 'active' : ''}" data-action="mute" aria-pressed="${mutedOn}">
          ${mutedOn ? '🔇' : '🔊'} Sound
        </button>
        <span class="star-count">⭐ ${Atasha.rewards.getStars()}</span>
      </div>
    `;

    container.appendChild(bar);

    if (showBack) {
      bar.querySelector('.top-bar-back').addEventListener('click', onBack);
    }
    bar.querySelector('[data-action="calm"]').addEventListener('click', () => {
      Atasha.storage.set('calmMode', !calmOn);
      rerenderCurrentView(container);
    });
    bar.querySelector('[data-action="mute"]').addEventListener('click', () => {
      Atasha.storage.set('muted', !mutedOn);
      rerenderCurrentView(container);
    });
  }

  function rerenderCurrentView(root) {
    if (root.classList.contains('view-dashboard')) {
      renderDashboard(root, { onBack: window.__AtashaOpenHome });
    } else {
      renderHome(root, { onSelectGame: window.__AtashaSelectGame, onOpenDashboard: window.__AtashaOpenDashboard });
    }
  }

  function ensureChildName() {
    let name = Atasha.storage.get('childName');
    if (!name) {
      // Simple one-time prompt; parent sets this up once for a personal greeting.
      name = window.prompt("What's your child's name? (used just for a friendly greeting)") || 'Friend';
      Atasha.storage.set('childName', name);
    }
    return name;
  }

  function renderHome(root, { onSelectGame, onOpenDashboard }) {
    window.__AtashaSelectGame = onSelectGame;
    window.__AtashaOpenDashboard = onOpenDashboard;

    const name = ensureChildName();
    root.innerHTML = '';
    root.className = 'view-home';

    renderTopBar(root, { showBack: false });

    const hero = Atasha.helpers.el('div', 'home-hero');
    hero.innerHTML = `
      <div class="hero-character">🌙</div>
      <h1>Hi ${name}! Welcome back!</h1>
      <p>Let's play together with Atasha! ✨</p>
    `;
    root.appendChild(hero);

    const grid = Atasha.helpers.el('div', 'game-grid');
    Atasha.gameRegistry.getAll().forEach((game) => {
      const card = Atasha.helpers.el('button', `game-card ${game.colorTheme || ''}`, {
        'aria-label': game.title,
      });
      card.innerHTML = `
        <div class="game-card-emoji">${game.emoji}</div>
        <div class="game-card-title">${game.title}</div>
        <div class="game-card-desc">${game.description || ''}</div>
      `;
      card.addEventListener('click', () => {
        Atasha.audio.play('tap');
        Atasha.speech.speak(game.title);
        onSelectGame(game.id);
      });
      grid.appendChild(card);
    });
    root.appendChild(grid);

    const dashboardLink = Atasha.helpers.el('button', 'dashboard-link', {
      text: '👨‍👩‍👧 Parent Dashboard',
    });
    dashboardLink.addEventListener('click', onOpenDashboard);
    root.appendChild(dashboardLink);

    Atasha.speech.speak(`Hi ${name}! Welcome back! Let's play together!`);
  }

  function renderDashboard(root, { onBack }) {
    window.__AtashaOpenHome = onBack;
    root.innerHTML = '';
    root.className = 'view-dashboard';
    renderTopBar(root, { showBack: true, onBack });

    const state = Atasha.storage.readAll();
    const wrap = Atasha.helpers.el('div', 'dashboard-wrap');

    const gamesPlayed = Object.keys(state.gameStats).length;
    const totalCompletions = Object.values(state.gameStats).reduce((sum, s) => sum + s.timesCompleted, 0);

    wrap.innerHTML = `
      <h1>📊 ${state.childName || 'Your Child'}'s Progress</h1>
      <div class="dashboard-stats">
        <div class="stat-card"><span class="stat-num">${state.stars}</span><span class="stat-label">Stars Earned</span></div>
        <div class="stat-card"><span class="stat-num">${gamesPlayed}</span><span class="stat-label">Games Tried</span></div>
        <div class="stat-card"><span class="stat-num">${totalCompletions}</span><span class="stat-label">Rounds Completed</span></div>
        <div class="stat-card"><span class="stat-num">${state.streakDays}</span><span class="stat-label">Day Streak</span></div>
      </div>

      <h2>🏅 Badges</h2>
      <div class="badge-row">
        ${Atasha.rewards.BADGES.map((b) => `
          <div class="badge ${state.badges.includes(b.id) ? 'earned' : 'locked'}">
            ${state.badges.includes(b.id) ? '🏅' : '🔒'} ${b.label}
          </div>
        `).join('')}
      </div>

      <h2>🎮 By Game</h2>
      <div class="game-stats-list">
        ${Atasha.gameRegistry.getAll().map((game) => {
          const stat = state.gameStats[game.id];
          return `
            <div class="game-stat-row">
              <span>${game.emoji} ${game.title}</span>
              <span>${stat ? `${stat.timesCompleted} rounds` : 'Not tried yet'}</span>
            </div>
          `;
        }).join('')}
      </div>

      <h2>🍳 Cookbook</h2>
      <p class="dashboard-note">${state.cookbook.length ? state.cookbook.join(', ') : 'No recipes cooked yet.'}</p>

      <p class="dashboard-footnote">All data is stored only on this device (browser LocalStorage) — nothing is sent anywhere.</p>
    `;

    root.appendChild(wrap);
  }

  Atasha.ui = { renderHome, renderDashboard };
})(window.Atasha = window.Atasha || {});
