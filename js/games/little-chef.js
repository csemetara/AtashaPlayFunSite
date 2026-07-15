/**
 * little-chef.js
 * -----------------------------------------------------------------------
 * Drag ingredients into the pot; each one reveals its slot on the recipe
 * card. Interaction pattern proved here: PROGRESSIVE / SEQUENTIAL REVEAL.
 *
 * Deliberately un-strict: ingredients can be added in ANY order. A real
 * step-locked recipe would introduce a "wrong step" state, which conflicts
 * with the no-failure-screen requirement — here the reward is watching the
 * recipe card fill in, not passing a sequence test.
 * -----------------------------------------------------------------------
 */
(function (Atasha) {
  'use strict';

  const RECIPES = [
    {
      id: 'fruit-salad',
      name: 'Fruit Salad',
      resultEmoji: '🥗',
      ingredients: [
        { emoji: '🍓', name: 'strawberry' },
        { emoji: '🍌', name: 'banana' },
        { emoji: '🫐', name: 'blueberry' },
      ],
    },
    {
      id: 'veggie-soup',
      name: 'Veggie Soup',
      resultEmoji: '🍲',
      ingredients: [
        { emoji: '🥕', name: 'carrot' },
        { emoji: '🥔', name: 'potato' },
        { emoji: '🌽', name: 'corn' },
      ],
    },
  ];

  let cleanupFns = [];
  let addedCount = 0;
  let recipe = null;
  let api = null;

  function buildRecipeCard(container) {
    const card = Atasha.helpers.el('div', 'lc-recipe-card');
    card.innerHTML = `<h3>${recipe.name}</h3><div class="lc-slots"></div>`;
    const slots = card.querySelector('.lc-slots');
    recipe.ingredients.forEach((ing) => {
      const slot = Atasha.helpers.el('div', 'lc-slot', { 'data-name': ing.name });
      slot.textContent = '❔';
      slots.appendChild(slot);
    });
    container.appendChild(card);
    return card;
  }

  function revealSlot(card, name, emoji) {
    const slot = card.querySelector(`.lc-slot[data-name="${name}"]`);
    if (slot) {
      slot.textContent = emoji;
      slot.classList.add('lc-slot-filled');
    }
  }

  function buildPot(container) {
    const pot = Atasha.helpers.el('div', 'lc-pot');
    pot.innerHTML = `<div class="lc-pot-emoji">🍳</div><div class="lc-pot-label">Pot</div>`;
    container.appendChild(pot);
    return pot;
  }

  function buildTray(container) {
    const tray = Atasha.helpers.el('div', 'lc-tray');
    container.appendChild(tray);
    return tray;
  }

  function attachDrag(itemEl, ingredient, pot, card) {
    const cleanup = Atasha.helpers.makeDraggable(itemEl, (x, y) => {
      if (Atasha.helpers.isPointInside(x, y, pot)) {
        itemEl.classList.add('lc-item-added');
        itemEl.style.pointerEvents = 'none';
        api.playSound('success');
        api.speak(`Yum, you added the ${ingredient.name}!`);
        revealSlot(card, ingredient.name, ingredient.emoji);
        addedCount += 1;
        if (addedCount === recipe.ingredients.length) {
          setTimeout(() => finishRecipe(itemEl.closest('.game-body')), 700);
        }
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
    addedCount = 0;
    cleanupFns = [];
    recipe = Atasha.helpers.shuffle(RECIPES)[0];

    container.innerHTML = `
      <div class="game-header">
        <h2>🍳 Little Chef</h2>
        <p class="game-instructions">Let's make ${recipe.name}! Drag food into the pot.</p>
      </div>
      <div class="game-body lc-layout">
        <div class="lc-card-wrap"></div>
        <div class="lc-kitchen"></div>
      </div>
    `;

    const cardWrap = container.querySelector('.lc-card-wrap');
    const kitchen = container.querySelector('.lc-kitchen');
    const card = buildRecipeCard(cardWrap);
    const pot = buildPot(kitchen);
    const tray = buildTray(kitchen);

    Atasha.helpers.shuffle(recipe.ingredients).forEach((ing) => {
      const item = Atasha.helpers.el('div', 'lc-item');
      item.textContent = ing.emoji;
      tray.appendChild(item);
      attachDrag(item, ing, pot, card);
    });

    api.speak(`Let's cook ${recipe.name} together! Drag the food into the pot.`);
  }

  function finishRecipe(gameBody) {
    api.playSound('complete');
    api.speak(`Yay! You made ${recipe.name}! Delicious!`);
    Atasha.storage.update((state) => {
      if (!state.cookbook.includes(recipe.id)) state.cookbook.push(recipe.id);
    });
    const result = api.awardStars(3);
    if (gameBody) {
      gameBody.insertAdjacentHTML(
        'beforeend',
        `<div class="lc-celebration">${recipe.resultEmoji}<br/>${recipe.name} is ready!</div>`
      );
    }
    setTimeout(() => api.onComplete(result), 2000);
  }

  function destroy() {
    cleanupFns.forEach((fn) => fn());
    cleanupFns = [];
  }

  Atasha.gameRegistry.register({
    id: 'little-chef',
    title: 'Little Chef',
    emoji: '🍳',
    colorTheme: 'theme-peach',
    description: 'Cook a fun recipe',
    init,
    destroy,
  });
})(window.Atasha = window.Atasha || {});
