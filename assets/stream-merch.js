(() => {
  'use strict';
  const cfg = window.STORE_CONFIG || {};
  const api = 'https://storefront-api.fourthwall.com/v1';
  const currency = () => (localStorage.getItem('ysmf_currency') || cfg.defaultCurrency || 'GBP').toUpperCase();
  const escape = (value = '') => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[c]));
  const imageOf = item => item?.transformedUrl || item?.url || '';
  const chaosName = value => /chaos[\s_\/-]*0?1\b/i.test(value || '');
  let collectionLookup;
  let revision = 0;

  async function request(path, code) {
    const params = new URLSearchParams({storefront_token: cfg.storefrontToken || '', currency: code});
    const response = await fetch(`${api}${path}${path.includes('?') ? '&' : '?'}${params}`, {signal: AbortSignal.timeout(12000)});
    if (!response.ok) { const error = new Error(`Catalogue ${response.status}`); error.status = response.status; throw error; }
    return response.json();
  }
  async function list(path, code) {
    const results = [];
    for (let page = 0; page < 20; page++) {
      const data = await request(`${path}?size=50&page=${page}`, code);
      const batch = data.results || [];
      const fresh = batch.filter(item => !results.some(prior => (prior.id || prior.slug) === (item.id || item.slug)));
      results.push(...fresh);
      if (batch.length < 50 || !fresh.length || results.length >= (data.totalResults || data.totalElements || Infinity)) break;
    }
    return results;
  }
  async function chaosSlug(code) {
    if (!collectionLookup) {
      collectionLookup = list('/collections', code)
        .then(items => items.find(item => chaosName(item.name) || chaosName(item.slug))?.slug || 'ysmf-chaos-01')
        .catch(() => 'ysmf-chaos-01');
    }
    return collectionLookup;
  }
  async function productsFor(kind, code) {
    const slug = kind === 'chaos' ? await chaosSlug(code) : cfg.signatureCollectionSlug || 'you-sexy-motherfuckers-signature-collection';
    try {
      const products = await list(`/collections/${encodeURIComponent(slug)}/products`, code);
      return kind === 'signature' ? products.filter(p => !chaosName(p.name) && !chaosName(p.slug)) : products;
    } catch (error) {
      if (kind !== 'chaos' || error.status !== 404) throw error;
      // A newly-created/private collection can be absent while its public product is already available.
      const products = await list('/collections/all/products', code);
      return products.filter(p => chaosName(p.name) || chaosName(p.slug));
    }
  }
  function rank(product) {
    const name = (product.name || '').toLowerCase();
    if (/hoodie/.test(name)) return 0;
    if (/tee|t-shirt|tshirt/.test(name)) return 1;
    if (/crewneck|sweatshirt|jogger/.test(name)) return 2;
    if (/cap|hat|beanie/.test(name)) return 3;
    return 4;
  }
  function card(product, kind, code) {
    const primary = imageOf(product.images?.[0]);
    const secondary = imageOf(product.images?.[1]);
    const priced = (product.variants || []).filter(v => v.unitPrice && Number.isFinite(Number(v.unitPrice.value)));
    const cheapest = priced.reduce((min, item) => !min || Number(item.unitPrice.value) < Number(min.unitPrice.value) ? item : min, null);
    const price = cheapest ? new Intl.NumberFormat('en-GB',{style:'currency',currency:cheapest.unitPrice.currency || code}).format(cheapest.unitPrice.value) : 'View product';
    const article = document.createElement('article');
    article.className = `product-card${secondary ? ' has-secondary' : ''}`;
    article.innerHTML = `<a class="product-card-link" href="/product/?slug=${encodeURIComponent(product.slug)}"><div class="product-image"><span class="product-badge">${kind === 'chaos' ? 'Chaos 01' : 'Signature'}</span>${primary ? `<img class="product-image-primary" src="${escape(primary)}" alt="${escape(product.name)}" loading="lazy" decoding="async">` : ''}${secondary ? `<img class="product-image-secondary" src="${escape(secondary)}" alt="" loading="lazy" decoding="async">` : ''}</div><div class="product-info"><h3 class="product-name">${escape(product.name)}</h3><p class="product-price">${escape(price)}</p><div class="sm-product-link"><span>View product</span><span aria-hidden="true">↗</span></div></div></a>`;
    article.querySelector('a').addEventListener('click', () => {
      if (typeof window.gtag === 'function') window.gtag('event','select_item',{item_list_name:kind === 'chaos' ? 'Stream Merch / Chaos 01' : 'Stream Merch / Signature',items:[{item_id:cheapest?.id || product.id,item_name:product.name,item_brand:'YSMF',price:Number(cheapest?.unitPrice?.value || 0),quantity:1}],currency:cheapest?.unitPrice?.currency || code});
    });
    return article;
  }
  async function loadGrid(grid, requestRevision) {
    const kind = grid.dataset.streamGrid;
    const code = currency();
    grid.setAttribute('aria-busy','true');
    grid.innerHTML = '<div class="sm-load-state" role="status">Loading the collection…</div>';
    try {
      const products = await productsFor(kind, code);
      if (requestRevision !== revision) return;
      products.sort((a,b) => rank(a) - rank(b) || String(a.name).localeCompare(String(b.name)));
      grid.replaceChildren();
      grid.dataset.count = products.length;
      if (products.length) products.forEach(product => grid.appendChild(card(product,kind,code)));
      else grid.innerHTML = '<div class="sm-load-state" role="status">There are no pieces available to shop here right now.</div>';
    } catch (error) {
      if (requestRevision !== revision) return;
      grid.innerHTML = '<div class="sm-load-state" role="status"><p>The collection couldn’t load. Please try again.</p><button class="sm-retry" type="button">Reload collection ↻</button></div>';
      grid.querySelector('button').addEventListener('click', () => {collectionLookup = undefined;loadGrid(grid,revision);});
    } finally {
      if (requestRevision === revision) grid.setAttribute('aria-busy','false');
    }
  }
  function refresh() {
    revision++;
    document.querySelectorAll('[data-stream-grid]').forEach(grid => loadGrid(grid,revision));
  }
  document.querySelectorAll('[data-currency]').forEach(select => select.addEventListener('change', refresh));
  window.addEventListener('pageshow', event => {if (event.persisted) refresh();});
  document.addEventListener('visibilitychange', () => {if (!document.hidden) refresh();});
  refresh();

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const saver = navigator.connection?.saveData;
  document.querySelectorAll('[data-sm-video]').forEach(video => {
    const button = video.parentElement.querySelector('[data-video-toggle]');
    let userPaused = reduced.matches || saver;
    let wasPlaying = false;
    function sync() {button.textContent = video.paused ? 'Play film' : 'Pause film';button.setAttribute('aria-label',video.paused ? 'Play collection film' : 'Pause collection film');}
    function reveal() {video.classList.add('is-playing');sync();}
    function play() {
      if (!video.querySelector('source').getAttribute('src')) {
        video.querySelector('source').src = video.querySelector('source').dataset.src;
        video.load();
      }
      video.play().catch(() => {video.classList.remove('is-playing');sync();});
    }
    video.muted = true;
    video.addEventListener('playing',reveal);
    video.addEventListener('pause',sync);
    video.addEventListener('error',() => {video.classList.remove('is-playing');sync();});
    button.addEventListener('click',() => {if(video.paused){userPaused=false;play();}else{userPaused=true;video.pause();}});
    const observer = new IntersectionObserver(entries => {
      if(entries[0].isIntersecting && !document.hidden && !userPaused) play();
      else video.pause();
    },{threshold:.15});
    observer.observe(video);
    document.addEventListener('visibilitychange',() => {
      if(document.hidden){wasPlaying=!video.paused;video.pause();}
      else if(wasPlaying&&!userPaused) play();
    });
    reduced.addEventListener('change',() => {if(reduced.matches){userPaused=true;video.pause();video.classList.remove('is-playing');}});
    sync();
  });
})();
