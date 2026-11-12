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
    const beforeLaunch = Date.now() < Date.parse('2026-11-14T00:00:00Z');
    empty.textContent = selected === 'windbreaker'
      ? (beforeLaunch ? 'The windbreaker arrives 14 November. Explore the other Minimal pieces while you wait.' : 'The windbreakers are not available in the store yet. Please check back soon.')
      : 'No pieces in this category right now. Explore all pieces.';
    // Availability follows the public catalogue, not a guessed release time.
    status.textContent = windbreakers ? 'Essential Windbreaker / Available now' : beforeLaunch ? 'Launching 14 November 2026' : 'Essential Windbreaker / Explore the collection';
    note.textContent = windbreakers ? 'Explore the available colourways in the collection below.' : beforeLaunch ? 'Arriving 14 November. Explore the current collection below.' : 'Check the collection below for the latest availability.';
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
  update();
})();
