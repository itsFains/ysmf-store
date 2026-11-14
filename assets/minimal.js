/* Page-local presentation only. Product links, prices and checkout remain owned by app.js. */
(() => {
  'use strict';
  const grid = document.querySelector('[data-products-grid][data-collection="minimal"]');
  if (!grid) return;
  const buttons = [...document.querySelectorAll('[data-minimal-filter]')];
  const count = document.querySelector('[data-minimal-count]');
  const empty = document.querySelector('[data-minimal-empty]');
  const status = document.querySelector('[data-windbreaker-status]');
  const note = document.querySelector('[data-windbreaker-note]');
  const patterns = {
    windbreaker: /windbreaker|wind[ -]?breaker/i,
    hoodie: /hoodie|hooded sweatshirt/i,
    tee: /t[ -]?shirt|\btee\b/i,
    crewneck: /crewneck|crew[ -]?neck|sweatshirt/i,
    headwear: /beanie|\bhat\b|\bcap\b/i
  };
  let selected = 'all';
  function update() {
    const cards = [...grid.querySelectorAll('.product-card')];
    let visible = 0;
    let windbreakers = 0;
    for (const card of cards) {
      const name = card.querySelector('.product-name')?.textContent || '';
      const isWindbreaker = patterns.windbreaker.test(name);
      if (isWindbreaker) {
        windbreakers++;
        const badge = card.querySelector('.product-badge');
        if (badge && badge.textContent !== 'Windbreaker') badge.textContent = 'Windbreaker';
      }
      const matches = selected === 'all' || (patterns[selected].test(name) &&
        !(selected === 'crewneck' && patterns.hoodie.test(name)));
      card.hidden = !matches;
      if (matches) visible++;
    }
    count.textContent = cards.length ? `${visible} ${visible === 1 ? 'piece' : 'pieces'}` : '';
    empty.hidden = !cards.length || visible > 0;
    empty.textContent = selected === 'windbreaker'
      ? 'Windbreakers are not showing here right now. Please use the Minimal store link below.'
      : 'No pieces in this category right now. Explore all pieces.';
    status.textContent = 'Essential Windbreaker / Out now';
    note.textContent = 'Black, navy and forest green. Shop the collection below.';
    const error = grid.querySelector('.api-note');
    if (error && !error.dataset.minimalFriendly) {
      error.dataset.minimalFriendly = 'true';
      error.textContent = 'Our products could not load right now. Please refresh, or use the store link below.';
    }
  }
  function select(value) {
    selected = value;
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.minimalFilter === value)));
    update();
  }
  buttons.forEach(button => button.addEventListener('click', () => select(button.dataset.minimalFilter)));
  document.querySelector('[data-show-windbreakers]')?.addEventListener('click', () => select('windbreaker'));
  document.querySelectorAll('[data-reset-minimal]').forEach(link => link.addEventListener('click', () => select('all')));
  // Existing app replaces cards when the visitor changes currency.
  const observer = new MutationObserver(update);
  observer.observe(grid, {childList:true});
  document.addEventListener('visibilitychange', () => { if (!document.hidden) update(); });
  if (new URLSearchParams(location.search).get('category') === 'windbreaker') select('windbreaker');
  else update();
})();
