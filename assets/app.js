
(() => {
  const cfg = window.STORE_CONFIG || {};
  const API = 'https://storefront-api.fourthwall.com/v1';
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const currency = () => (localStorage.getItem('ysmf_currency') || cfg.defaultCurrency || 'GBP').toUpperCase();
  const apiUrl = (path) => `${API}${path}${path.includes('?')?'&':'?'}storefront_token=${encodeURIComponent(cfg.storefrontToken || '')}&currency=${encodeURIComponent(currency())}`;

  function escapeHtml(str='') { return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
  function money(value, curr=currency()) { try { return new Intl.NumberFormat('en-GB',{style:'currency',currency:curr}).format(Number(value)); } catch { return `${curr} ${Number(value).toFixed(2)}`; } }
  function imageOf(x) { return x?.transformedUrl || x?.url || ''; }
  function available(v) { return v?.stock?.type!=='OUT_OF_STOCK' && v?.stock?.inStock!==false && !(typeof v?.stock?.inStock==='number' && v.stock.inStock<=0); }

  // Consent-aware ecommerce tracking. consent.js only exposes gtag/fbq after the
  // visitor has chosen the matching analytics/marketing permission level.
  function ecommerceItem(product={}, variant={}, quantity=1) {
    const price = variant.unitPrice || minPrice(product) || {};
    const attributes = variant.attributes || {};
    const variantName = attributes.description || [attributes.color?.name, attributes.size?.name].filter(Boolean).join(' / ');
    return {
      item_id: String(variant.id || product.id || product.slug || product.name || 'ysmf-product'),
      item_name: String(product.name || variant.product?.name || variant.name || 'YSMF product'),
      item_brand: 'YSMF',
      item_category: category(product.name || variant.product?.name || variant.name || ''),
      item_variant: String(variantName || ''),
      price: Number(price.value || 0),
      quantity: Math.max(1, Number(quantity || 1))
    };
  }

  function cartEcommerceItems() {
    return (cart?.items || []).map(entry => {
      const variant = entry.variant || {};
      const product = variant.product || { name: variant.name || 'YSMF product' };
      return ecommerceItem(product, variant, entry.quantity || 1);
    });
  }

  function commerceTotal(items=[]) {
    return items.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0);
  }

  function trackCommerce(eventName, items=[], extra={}) {
    const cleanItems = items.filter(Boolean);
    if (!cleanItems.length) return false;

    const curr = String(extra.currency || currency()).toUpperCase();
    const value = Number(extra.value ?? commerceTotal(cleanItems));
    const gaPayload = { currency: curr, value, items: cleanItems, ...extra };
    let sent = false;

    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, gaPayload);
      sent = true;
    }

    if (typeof window.fbq === 'function') {
      const metaEvent = {
        view_item: 'ViewContent',
        add_to_cart: 'AddToCart',
        begin_checkout: 'InitiateCheckout'
      }[eventName];

      if (metaEvent) {
        window.fbq('track', metaEvent, {
          content_ids: cleanItems.map(item => item.item_id),
          contents: cleanItems.map(item => ({
            id: item.item_id,
            quantity: item.quantity,
            item_price: item.price
          })),
          content_name: cleanItems.length === 1 ? cleanItems[0].item_name : 'YSMF bag',
          content_type: 'product',
          currency: curr,
          value,
          num_items: cleanItems.reduce((sum, item) => sum + Number(item.quantity || 1), 0)
        });
        sent = true;
      }
    }

    return sent;
  }

  // Global storefront UI: real social icons, shared footer logo, full Fourthwall currencies
  const FOURTHWALL_CURRENCIES = [
    ['USD', 'USD — US Dollar'],
    ['EUR', 'EUR — Euro'],
    ['CAD', 'CAD — Canadian Dollar'],
    ['GBP', 'GBP — British Pound'],
    ['AUD', 'AUD — Australian Dollar'],
    ['NZD', 'NZD — New Zealand Dollar'],
    ['BRL', 'BRL — Brazilian Real'],
    ['MXN', 'MXN — Mexican Peso'],
    ['SEK', 'SEK — Swedish Krona'],
    ['NOK', 'NOK — Norwegian Krone'],
    ['DKK', 'DKK — Danish Krone'],
    ['PLN', 'PLN — Polish Złoty'],
    ['JPY', 'JPY — Japanese Yen'],
    ['INR', 'INR — Indian Rupee'],
    ['MYR', 'MYR — Malaysian Ringgit'],
    ['SGD', 'SGD — Singapore Dollar'],
    ['CHF', 'CHF — Swiss Franc']
  ];

  const SOCIAL_ICONS = {
    facebook: `<svg class="social-icon-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M13.5 22v-9h3l.5-3.5h-3.5V7.3c0-1 .3-1.8 1.8-1.8H17V2.4c-.3 0-1.3-.1-2.6-.1-2.6 0-4.4 1.6-4.4 4.5v2.7H7V13h3v9h3.5Z"/></svg>`,
    twitch: `<svg class="social-icon-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M4.3 2h16.4v11.3l-4.7 4.7h-3.6L10 20.4H7.6V18H4.3V2Zm2.2 2.2v11.6h3.3v2l2-2h4.1l2.6-2.6v-9H6.5Zm4.2 2.8h2.1v5.5h-2.1V7Zm4.1 0h2.1v5.5h-2.1V7Z"/>
    </svg>`,
    instagram: `<svg class="social-icon-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M7.2 2h9.6A5.2 5.2 0 0 1 22 7.2v9.6a5.2 5.2 0 0 1-5.2 5.2H7.2A5.2 5.2 0 0 1 2 16.8V7.2A5.2 5.2 0 0 1 7.2 2Zm0 2A3.2 3.2 0 0 0 4 7.2v9.6A3.2 3.2 0 0 0 7.2 20h9.6a3.2 3.2 0 0 0 3.2-3.2V7.2A3.2 3.2 0 0 0 16.8 4H7.2Zm10.2 1.5a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"/>
    </svg>`,
    tiktok: `<svg class="social-icon-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M14.4 3h2.8c.2 1.7 1.2 3 2.8 3.7v2.8a8 8 0 0 1-2.8-1v5.7A6.1 6.1 0 1 1 12 8.2V11a3.3 3.3 0 1 0 2.4 3.2V3Z"/></svg>`
  };

  function enhanceStoreChrome() {
    // Preserve the existing working links; only replace their visual icon.
    $$('.socials .social-link').forEach(link => {
      const label = (link.getAttribute('aria-label') || link.textContent || '').trim().toLowerCase();
      const type = label.includes('twitch') ? 'twitch' : label.includes('instagram') ? 'instagram' : label.includes('tiktok') ? 'tiktok' : label.includes('facebook') ? 'facebook' : null;
      if (!type) return;
      const visibleLabel = type === 'twitch' ? 'Twitch' : type === 'instagram' ? 'Instagram' : type === 'facebook' ? 'Facebook' : 'TikTok';
      link.innerHTML = `${SOCIAL_ICONS[type]}<span>${visibleLabel}</span>`;
      link.setAttribute('aria-label', visibleLabel);
    });

    // Keep YSMF as the master brand in every footer.
    $$('.footer-brand').forEach(brand => {
      brand.innerHTML = `<img class="footer-logo-img" src="/assets/ysmf-wordmark.png" alt="YSMF">`;
    });

    // Keep currency options consistent on every page.
    $$('[data-currency]').forEach(select => {
      select.innerHTML = FOURTHWALL_CURRENCIES
        .map(([code, label]) => `<option value="${code}">${label}</option>`)
        .join('');
    });
  }

  enhanceStoreChrome();

  // Navigation / collection dropdowns / prelaunch
  const teaser = $('[data-minimal-teaser]'); if (teaser && !cfg.showMinimalTeaserOnHome) teaser.hidden = true;
  const normalizePath = (p='') => {
    let path = String(p || '/').split('?')[0].split('#')[0];
    path = path.replace(/\/index\.html$/i, '/').replace(/\/+/g, '/');
    if (!path.startsWith('/')) path = '/' + path;
    if (path !== '/' && !path.endsWith('/')) path += '/';
    return path;
  };
  const currentPath = normalizePath(location.pathname);

  // PUBLIC COLLECTION LINK GATES
  // The pages remain directly reachable for owner/QA preview, but public links can be switched off independently.
  const collectionLinkGates = [
    {
      path: '/minimal/',
      enabled: cfg.minimalNavigationEnabled === true,
      title: 'YSMF Minimal launches 18 September 2026'
    },
    {
      path: '/midnight-luxe/',
      enabled: cfg.midnightLuxeNavigationEnabled === true,
      title: 'YSMF Midnight Luxe launches 30 October 2026'
    }
  ];

  $$('a[href]').forEach(link => {
    const rawHref = link.getAttribute('href') || '';
    if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) return;
    let linkPath = '';
    try { linkPath = normalizePath(new URL(rawHref, location.origin).pathname); } catch { return; }
    const gate = collectionLinkGates.find(item => item.path === linkPath);
    if (!gate || gate.enabled) return;

    link.dataset.lockedHref = rawHref;
    link.classList.add('is-locked');
    link.setAttribute('aria-disabled', 'true');
    link.setAttribute('title', gate.title);
    link.setAttribute('tabindex', '-1');
    link.removeAttribute('href');
    link.addEventListener('click', event => event.preventDefault());
  });
  $$('[data-nav-link]').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (!href || href.startsWith('#')) return;
    const path = normalizePath(new URL(href, location.origin).pathname);
    if (path === currentPath) a.classList.add('active');
  });

  // If a collection child is active, mark the Collections parent active too.
  $$('[data-collections-nav]').forEach(group => {
    if (group.querySelector('[data-nav-link].active')) group.classList.add('active');
  });

  // Desktop dropdown: hover works in CSS; click is provided for keyboard/touch laptops.
  $$('[data-nav-dropdown]').forEach(drop => {
    const btn = $('[data-dropdown-toggle]', drop);
    if (!btn) return;
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const open = drop.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });
  });
  document.addEventListener('click', () => {
    $$('[data-nav-dropdown].open').forEach(drop => {
      drop.classList.remove('open');
      $('[data-dropdown-toggle]', drop)?.setAttribute('aria-expanded', 'false');
    });
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      $$('[data-nav-dropdown].open').forEach(drop => drop.classList.remove('open'));
      $$('[data-dropdown-toggle]').forEach(btn => btn.setAttribute('aria-expanded','false'));
    }
  });

  const toggle=$('[data-menu-toggle]'), menu=$('[data-mobile-menu]');
  if(toggle&&menu) toggle.addEventListener('click',()=>{const o=menu.classList.toggle('open');document.body.classList.toggle('menu-open',o);toggle.setAttribute('aria-expanded',String(o));});

  const mobileCollectionsToggle = $('[data-mobile-collections-toggle]');
  const mobileCollectionsMenu = $('[data-mobile-collections-menu]');
  if (mobileCollectionsToggle && mobileCollectionsMenu) {
    const hasActive = !!mobileCollectionsMenu.querySelector('[data-nav-link].active');
    if (hasActive) {
      mobileCollectionsMenu.classList.add('open');
      mobileCollectionsToggle.setAttribute('aria-expanded','true');
      mobileCollectionsToggle.parentElement?.classList.add('active');
    }
    mobileCollectionsToggle.addEventListener('click', () => {
      const open = mobileCollectionsMenu.classList.toggle('open');
      mobileCollectionsToggle.setAttribute('aria-expanded', String(open));
      const symbol = mobileCollectionsToggle.querySelector('span');
      if (symbol) symbol.textContent = open ? '−' : '+';
    });
  }

  // Currency
  $$('[data-currency]').forEach(curSel => {
    const current = currency();
    // If a previously saved value is no longer supported, fall back safely.
    if ([...curSel.options].some(o => o.value === current)) curSel.value = current;
    else {
      curSel.value = cfg.defaultCurrency || 'GBP';
      localStorage.setItem('ysmf_currency', curSel.value);
    }
    curSel.addEventListener('change', () => {
      localStorage.setItem('ysmf_currency', curSel.value);
      location.reload();
    });
  });

  // Cart shell
  let cart = null;
  let lastCartViewSignature = '';
  function injectCart(){
    const desktop=$('.desktop-nav'); if(desktop && !desktop.querySelector('[data-cart-open]')) desktop.insertAdjacentHTML('beforeend',`<button class="cart-trigger" data-cart-open>Cart <span class="cart-count" data-cart-count>0</span></button>`);
    const mobile=$('[data-mobile-menu]'); if(mobile && !mobile.querySelector('[data-cart-open]')) mobile.insertAdjacentHTML('beforeend',`<button data-cart-open>Cart <span data-cart-count>0</span></button>`);
    document.body.insertAdjacentHTML('beforeend',`<div class="cart-overlay" data-cart-overlay inert><aside class="cart-drawer" role="dialog" aria-modal="true" aria-label="Shopping cart"><div class="cart-head"><h2>Your bag</h2><button class="cart-close" data-cart-close aria-label="Close cart">×</button></div><div class="cart-body" data-cart-body><div class="cart-empty">Your bag is empty.<a href="/shop/">Find your next piece ↗</a></div></div><div class="cart-foot"><div class="cart-subtotal"><span>Subtotal</span><strong data-cart-subtotal>—</strong></div><button class="btn btn-primary btn-block" data-checkout>Checkout →</button><p class="cart-note">Secure checkout is completed with Fourthwall.</p></div></aside></div><div class="toast" data-toast role="status" aria-live="polite"></div>`);
    $$('[data-cart-open]').forEach(b=>b.addEventListener('click',openCart));
    $('[data-cart-close]').addEventListener('click',closeCart); $('[data-cart-overlay]').addEventListener('click',e=>{if(e.target===e.currentTarget)closeCart();}); $('[data-checkout]').addEventListener('click',checkout);
  }
  async function openCart(){
    const overlay=$('[data-cart-overlay]');overlay.inert=false;overlay.classList.add('open');document.dispatchEvent(new Event('ysmf:cart-open'));$('[data-cart-close]').focus();
    document.body.classList.add('cart-open');
    await refreshCart();
    const items = cartEcommerceItems();
    const signature = items.map(item => `${item.item_id}:${item.quantity}`).join('|');
    if (items.length && signature !== lastCartViewSignature) {
      trackCommerce('view_cart', items);
      lastCartViewSignature = signature;
    }
  }
  function closeCart(){const overlay=$('[data-cart-overlay]');overlay.classList.remove('open');document.body.classList.remove('cart-open');document.dispatchEvent(new Event('ysmf:cart-close'));overlay.inert=true;}
  function toast(msg){const el=$('[data-toast]');if(!el)return;el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1900);}
  function updateCartCount(){const count=(cart?.items||[]).reduce((n,i)=>n+(i.quantity||0),0);$$('[data-cart-count]').forEach(e=>e.textContent=count);}

  async function request(path, opts={}){
    if(!cfg.storefrontToken) throw new Error('NO_TOKEN');
    const res=await fetch(apiUrl(path),{signal:AbortSignal.timeout(15000),...opts}); if(!res.ok) throw Object.assign(new Error(`Fourthwall ${res.status}`),{status:res.status}); return res.json();
  }
  async function refreshCart(){
    const id=localStorage.getItem('ysmf_cart_id'); if(!id){cart=null;renderCart();return;}
    try{cart=await request(`/carts/${encodeURIComponent(id)}`);renderCart();}catch(error){if(error.status===404||error.status===410){localStorage.removeItem('ysmf_cart_id');cart=null;renderCart();}else{toast('Your bag could not refresh. Please try again.');}}
  }
  async function addVariant(variantId, quantity=1, trackingItem=null){
    if(!cfg.storefrontToken){toast('Connect Fourthwall first');return;}
    try{
      const id=localStorage.getItem('ysmf_cart_id');
      if(!id){cart=await request('/carts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:[{variantId,quantity}]})});localStorage.setItem('ysmf_cart_id',cart.id);}
      else {try{cart=await request(`/carts/${encodeURIComponent(id)}/add`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:[{variantId,quantity}]})});}catch(error){if(error.status===404||error.status===410){localStorage.removeItem('ysmf_cart_id');return addVariant(variantId,quantity,trackingItem);}throw error;}}
      if (trackingItem) trackCommerce('add_to_cart', [{ ...trackingItem, quantity }]);
      lastCartViewSignature = '';
      renderCart();openCart();toast('Added to bag');
    }catch(e){console.error(e);toast('Could not add item');}
  }
  async function changeQty(variantId, quantity){
    const id=localStorage.getItem('ysmf_cart_id'); if(!id)return;
    if(quantity<=0) return removeItem(variantId,1);
    const existing=(cart?.items||[]).find(item=>item.variant?.id===variantId);
    const previousQuantity=Number(existing?.quantity||0);
    const trackedItem=existing?ecommerceItem(existing.variant?.product||{},existing.variant,Math.abs(quantity-previousQuantity)):null;
    try{
      cart=await request(`/carts/${encodeURIComponent(id)}/change`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:[{variantId,quantity}]})});
      if(trackedItem&&quantity>previousQuantity)trackCommerce('add_to_cart',[trackedItem]);
      if(trackedItem&&quantity<previousQuantity)trackCommerce('remove_from_cart',[trackedItem]);
      lastCartViewSignature='';
      renderCart();
    }catch(e){console.error(e);toast('Could not update bag');}
  }
  async function removeItem(variantId, quantity){
    const id=localStorage.getItem('ysmf_cart_id'); if(!id)return;
    const existing=(cart?.items||[]).find(item=>item.variant?.id===variantId);
    const trackedQuantity=Math.min(Number(quantity||1),Number(existing?.quantity||quantity||1));
    const trackedItem=existing?ecommerceItem(existing.variant?.product||{},existing.variant,trackedQuantity):null;
    try{
      cart=await request(`/carts/${encodeURIComponent(id)}/remove`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:[{variantId,quantity}]})});
      if(trackedItem)trackCommerce('remove_from_cart',[trackedItem]);
      lastCartViewSignature='';
      renderCart();
    }catch(e){console.error(e);toast('Could not remove item');}
  }
  function renderCart(){
    updateCartCount(); const body=$('[data-cart-body]'), sub=$('[data-cart-subtotal]'); if(!body)return;
    const items=cart?.items||[]; $('[data-checkout]').disabled=!items.length; if(!items.length){body.innerHTML='<div class="cart-empty">Your bag is empty.<a href="/shop/">Find your next piece ↗</a></div>';sub.textContent='—';return;}
    let total=0,curr=currency(); body.innerHTML='';
    items.forEach(item=>{const v=item.variant||{}; const p=v.unitPrice||{}; curr=p.currency||curr; total+=Number(p.value||0)*Number(item.quantity||0); const img=imageOf(v.images?.[0]); const desc=v.attributes?.description||[v.attributes?.color?.name,v.attributes?.size?.name].filter(Boolean).join(' / '); const wrap=document.createElement('div');wrap.className='cart-item';wrap.innerHTML=`<div class="cart-item-img">${img?`<img src="${img}" alt="">`:''}</div><div><p class="cart-item-name">${escapeHtml(v.product?.name||v.name||'Product')}</p><p class="cart-item-variant">${escapeHtml(desc||'')}</p><div class="cart-item-price">${money(p.value||0,p.currency||curr)}</div><div class="cart-item-actions"><div class="mini-qty"><button aria-label="Decrease quantity" data-dec>−</button><span>${item.quantity}</span><button aria-label="Increase quantity" data-inc>+</button></div><button class="remove-item" data-remove>Remove</button></div></div>`;wrap.querySelector('[data-dec]').onclick=()=>changeQty(v.id,Math.max(0,item.quantity-1));wrap.querySelector('[data-inc]').onclick=()=>changeQty(v.id,item.quantity+1);wrap.querySelector('[data-remove]').onclick=()=>removeItem(v.id,item.quantity);body.appendChild(wrap);});
    sub.textContent=money(total,curr);
  }
  function checkout(){
    const id=localStorage.getItem('ysmf_cart_id');
    if(!id){toast('Your bag is empty');return;}
    const params=new URLSearchParams({cartId:id,currency:currency()});
    const destination=`${String(cfg.fourthwallShopUrl||'').replace(/\/$/,'')}/cart/checkout?${params.toString()}`;
    const items=cartEcommerceItems();
    const sent=trackCommerce('begin_checkout',items,{transport_type:'beacon'});
    if(sent)setTimeout(()=>{location.href=destination;},150);
    else location.href=destination;
  }

  // Products / collections
  const collectionCache = new Map();
  async function fetchCollection(slug) {
    if (!collectionCache.has(slug)) collectionCache.set(slug, (async () => {
      const results=[];
      for(let page=0;page<20;page++) {
        const data=await request(`/collections/${encodeURIComponent(slug)}/products?size=50&page=${page}`);
        const batch=data.results||[];
        const fresh=batch.filter(p=>!results.some(x=>(x.id||x.slug)===(p.id||p.slug)));
        results.push(...fresh);
        if(batch.length<50||!fresh.length||results.length>=(data.totalResults||data.totalElements||Infinity))break;
      }
      return {results};
    })().catch(error=>{collectionCache.delete(slug);throw error;}));
    return collectionCache.get(slug);
  }
  const softProduct = product => /softer[ -]?side|pigment|lavender|sky blue|bubblegum|sage|bay printed|beige/i.test(product.name||'');
  async function collectionProducts(kind) {
    const minimal=cfg.minimalCollectionSlug||'ysmf-minimal';
    const midnight=cfg.midnightLuxeCollectionSlug||'ysmf-midnight-luxe-winter-2026';
    if(kind==='clothing') {
      const lists=await Promise.all([fetchCollection(minimal),fetchCollection(midnight)]);
      return [...new Map(lists.flatMap((x,i)=>x.results.map(p=>({...p,_collection:i===0?'minimal':'midnight'}))).map(p=>[p.id||p.slug,p])).values()];
    }
    const slug=({minimal,soft:minimal,midnight,signature:cfg.signatureCollectionSlug})[kind]||kind;
    const data=await fetchCollection(slug);
    return kind==='soft'?data.results.filter(softProduct):data.results;
  }
  function category(name='') {
    const n=name.toLowerCase();
    if(/windbreaker|wind.breaker/.test(n))return 'Windbreaker';
    if(/jogger|sweatpant/.test(n))return 'Joggers';
    if(/hoodie|hooded/.test(n))return 'Hoodie';
    if(/long[ -]?sleeve/.test(n))return 'Long sleeve';
    if(/t[ -]?shirt|\btee\b/.test(n))return 'Tee';
    if(/sweatshirt|crewneck/.test(n))return 'Sweatshirt';
    if(/beanie|\bhat\b|\bcap\b/.test(n))return 'Headwear';
    return 'Accessories';
  }
  function productLine(product={}){const name=String(product.name||'');if(/YSMF Minimal\b/i.test(name))return'YSMF Minimal';if(/Midnight Luxe\b/i.test(name))return'YSMF Midnight Luxe';if(/^YSMF\b/i.test(name))return'YSMF';return'itsFains';}
  function rank(name=''){const n=name.toLowerCase();if(n.includes('hoodie'))return 0;if(/t-shirt|tee/.test(n))return 1;if(/sweatshirt|crewneck/.test(n))return 2;if(/hat|cap|beanie/.test(n))return 3;if(/tumbler|mug/.test(n))return 5;if(/phone|case|mouse|mat|towel|poster/.test(n))return 8;return 6;}
  function minPrice(product){const vs=product.variants||[];if(!vs.length)return null;return vs.reduce((a,v)=>!a||Number(v.unitPrice?.value)<Number(a.value)?v.unitPrice:a,null);}
  function card(product){const imgs=product.images||[];const img1=imageOf(imgs[0]),img2=imageOf(imgs[1]);const price=minPrice(product);const a=document.createElement('article');a.className=`product-card${img2?' has-secondary':''}`;a.innerHTML=`<a class="product-card-link" href="/product/?slug=${encodeURIComponent(product.slug)}"><div class="product-image"><span class="product-badge">${category(product.name)}</span>${img1?`<img class="product-image-primary" loading="lazy" src="${img1}" alt="${escapeHtml(product.name)}">`:''}${img2?`<img class="product-image-secondary" loading="lazy" data-secondary-src="${img2}" alt="">`:''}</div><div class="product-info"><div class="product-meta"><div><h3 class="product-name">${escapeHtml(product.name.replace(/^Title:\s*/i,''))}</h3><p class="product-price">${price?money(price.value,price.currency):'View piece'}</p></div><span class="product-view">→</span></div></div></a>`;const link=$('.product-card-link',a);const secondary=$('[data-secondary-src]',a);if(secondary){const loadSecondary=()=>{if(!secondary.src)secondary.src=secondary.dataset.secondarySrc;};a.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')loadSecondary();});secondary.addEventListener('load',()=>a.classList.add('secondary-ready'));secondary.addEventListener('error',()=>secondary.remove());link.addEventListener('focus',loadSecondary,{once:true});}link?.addEventListener('click',()=>{const variant=(product.variants||[]).find(available)||product.variants?.[0]||{};trackCommerce('select_item',[ecommerceItem(product,variant,1)],{item_list_name:'YSMF storefront'});});return a;}
  // Public catalogue only: hidden Fourthwall products are never synthesized locally.
  function midnightTracksuit(product) {
    return /jogger|tracksuit/i.test(product.name || '') ||
      /black/i.test(product.name || '') && /hoodie/i.test(product.name || '');
  }
  // Resolve campaign links from the public catalogue; never guess product slugs.
  function linkMidnightProducts(products) {
    const patterns = {
      hoodie: /hoodie/i,
      tee: /t[ -]?shirt|tee/i,
      'long-sleeve': /long[ -]?sleeve/i,
      beanie: /beanie/i
    };
    $$('[data-ml-shop]').forEach(link => {
      const pattern = patterns[link.dataset.mlShop];
      const product = products.find(p => !midnightTracksuit(p) && pattern?.test(p.name || '') &&
        (link.dataset.mlShop !== 'tee' || !patterns['long-sleeve'].test(p.name || '')));
      link.href = product?.slug ? `/product/?slug=${encodeURIComponent(product.slug)}` : '#shop-midnight';
    });
  }
  function midnightRelease(part) {
    return Date.parse(part === 'tracksuit'
      ? cfg.midnightLuxeTracksuitReleaseAt || '2026-11-01T00:00:00Z'
      : cfg.midnightLuxeReleaseAt || '2026-10-30T00:00:00Z');
  }
  function productCategoryMatch(product, value) {
    const kind=category(product.name);
    return value==='all' || ({hoodie:['Hoodie','Sweatshirt'],tee:['Tee','Long sleeve'],windbreaker:['Windbreaker'],jogger:['Joggers'],headwear:['Headwear']})[value]?.includes(kind);
  }
  function gridError(grid, retry) {
    grid.innerHTML='<div class="api-note" role="status">The collection could not load. Please try again, or browse our store directly.<br><button type="button">Try again</button> <a href="'+escapeHtml(cfg.fourthwallShopUrl)+'">Open the store ↗</a></div>';
    grid.querySelector('button').onclick=retry;
  }
  async function loadGrid(grid) {
    if(grid.hasAttribute('data-catalog-grid')) return setupCatalogue(grid);
    grid.setAttribute('aria-busy','true');
    grid.innerHTML='<div class="loading" role="status">Loading pieces…</div>';
    try {
      let products=[...await collectionProducts(grid.dataset.collection||'all')];
      if(grid.dataset.midnightPart)products=products.filter(p=>midnightTracksuit(p)===(grid.dataset.midnightPart==='tracksuit'));
      if(grid.dataset.sort==='apparel-first')products.sort((a,b)=>rank(a.name)-rank(b.name)||a.name.localeCompare(b.name));if(grid.dataset.collection==='clothing'&&grid.dataset.limit){const featured=['ysmf-minimal-essential-windbreaker','ysmf-minimal-pigment-blue-embroidered-hoodie','midnight-luxe-black-hoodie','ysmf-minimal-pigment-pink-embroidered-hoodie'];products.sort((a,b)=>(featured.includes(a.slug)?featured.indexOf(a.slug):99)-(featured.includes(b.slug)?featured.indexOf(b.slug):99));}
      const limit=Number(grid.dataset.limit||0);if(limit)products=products.slice(0,limit);
      grid.replaceChildren(...products.map(card));
      if(!products.length)grid.innerHTML='<p class="empty-state">No pieces are available here right now. <a href="/shop/">Explore all clothing ↗</a></p>';
      if(grid.dataset.midnightPart==='original')linkMidnightProducts(products);
    }catch(e){gridError(grid,()=>loadGrid(grid));}
    finally{grid.setAttribute('aria-busy','false');}
  }
  async function setupCatalogue(grid) {
    if(grid.dataset.catalogReady)return;
    grid.dataset.catalogReady='true';
    const form=$('[data-catalog-controls]'),count=$('[data-results-count]');
    const search=form.elements.q, collection=form.elements.collection,sort=form.elements.sort;
    let products=[],selected='all',failed=false;
    function readState(){
      const params=new URLSearchParams(location.search);
      selected=['all','hoodie','tee','windbreaker','jogger','headwear'].includes(params.get('category'))?params.get('category'):'all';
      collection.value=['clothing','minimal','soft','midnight'].includes(params.get('collection'))?params.get('collection'):'clothing';
      sort.value=['featured','price-low','price-high','name'].includes(params.get('sort'))?params.get('sort'):'featured';
      search.value=params.get('q')||'';
    }
    function draw(updateUrl=true){
      if(failed)return;
      const needle=search.value.trim().toLowerCase();
      let visible=products.filter(p=>productCategoryMatch(p,selected));
      if(collection.value==='minimal')visible=visible.filter(p=>p._collection==='minimal');
      if(collection.value==='midnight')visible=visible.filter(p=>p._collection==='midnight');
      if(collection.value==='soft')visible=visible.filter(softProduct);
      if(needle)visible=visible.filter(p=>[p.name,...(p.variants||[]).map(v=>v.attributes?.color?.name||'')].join(' ').toLowerCase().includes(needle));
      const price=p=>Number(minPrice(p)?.value??Infinity);
      visible.sort((a,b)=>sort.value==='price-low'?price(a)-price(b):sort.value==='price-high'?price(b)-price(a):sort.value==='name'?a.name.localeCompare(b.name):rank(a.name)-rank(b.name)||a.name.localeCompare(b.name));
      grid.replaceChildren(...visible.map(card));
      if(!visible.length){grid.innerHTML='<div class="empty-state">No pieces match those filters. <button type="button" data-empty-reset>Show all clothing</button></div>';grid.querySelector('button').onclick=reset;}
      count.textContent=`${visible.length} ${visible.length===1?'piece':'pieces'}`;
      $$('[data-category]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category===selected)));
      if(updateUrl){const url=new URL(location.href);for(const [key,value,defaultValue] of [['category',selected,'all'],['collection',collection.value,'clothing'],['sort',sort.value,'featured'],['q',search.value.trim(),'']]){if(value===defaultValue)url.searchParams.delete(key);else url.searchParams.set(key,value);}history.replaceState(null,'',url);}
    }
    function reset(){selected='all';search.value='';collection.value='clothing';sort.value='featured';draw();}
    async function load(){failed=false;grid.setAttribute('aria-busy','true');count.textContent='Loading the collection…';grid.innerHTML='<div class="loading">Loading pieces…</div>';try{products=await collectionProducts('clothing');draw(false);}catch(e){failed=true;count.textContent='The collection is temporarily unavailable.';gridError(grid,load);}finally{grid.setAttribute('aria-busy','false');}}
    readState();
    $$('[data-category]').forEach(b=>b.onclick=()=>{selected=b.dataset.category;draw();});
    form.addEventListener('submit',e=>{e.preventDefault();draw();});
    search.addEventListener('input',()=>draw());collection.addEventListener('change',()=>draw());sort.addEventListener('change',()=>draw());
    $('[data-reset-catalog]').onclick=reset;
    window.addEventListener('popstate',()=>{readState();draw(false);});
    if(location.hash==='#search')search.focus();
    await load();
  }

  // Minimal hidden/preview page
  function setupMinimal(){const locked=$('[data-minimal-locked]'),full=$('[data-minimal-full]');if(!locked||!full)return;const preview=new URLSearchParams(location.search).get('preview')==='1';if(cfg.minimalIsLive||preview){locked.hidden=true;full.hidden=false;if(preview&&!cfg.minimalIsLive)document.body.insertAdjacentHTML('beforeend','<div class="preview-flag">Private preview</div>');}else{locked.hidden=false;full.hidden=true;}}

  // Product detail
  function sanitize(html='') {
    const d=new DOMParser().parseFromString(html,'text/html');
    d.querySelectorAll('script,style,iframe,object,embed,form,input,button,link,meta,base').forEach(n=>n.remove());
    d.querySelectorAll('*').forEach(el=>{for(const attribute of [...el.attributes]){const name=attribute.name.toLowerCase(),value=attribute.value.trim();if(name.startsWith('on')||name==='srcdoc'||(['href','src','xlink:href'].includes(name)&&!/^https?:|^\/|^#|^mailto:/i.test(value)))el.removeAttribute(attribute.name);}if(el.tagName==='A'&&el.target==='_blank')el.rel='noopener noreferrer';});
    return d.body.innerHTML;
  }
  async function loadProductPage(){const mount=$('[data-product-page]');if(!mount)return;const slug=new URLSearchParams(location.search).get('slug');if(slug){let canonical=document.querySelector('link[rel="canonical"]');if(!canonical){canonical=document.createElement('link');canonical.rel='canonical';document.head.appendChild(canonical);}canonical.href=`${location.origin}/product/?slug=${encodeURIComponent(slug)}`;}if(!slug){mount.innerHTML='<div class="empty-state">Product not found.</div>';return;}if(!cfg.storefrontToken){mount.innerHTML='<div class="api-note">Connect your Fourthwall Storefront token first.</div>';return;}try{const p=await request(`/products/${encodeURIComponent(slug)}`);document.title=`${p.name} — YSMF`;updateProductMetadata(p);renderProduct(p,mount);}catch(e){console.error(e);mount.innerHTML='<div class="empty-state">This product could not be loaded. <a href="/shop/">Back to the shop</a> · <a href="'+escapeHtml(cfg.fourthwallShopUrl)+'">Open the store ↗</a></div>';}}
  function updateProductMetadata(product) {
    const plain=new DOMParser().parseFromString(product.description||'','text/html').body.textContent.trim().replace(/\s+/g,' ').slice(0,160);
    const description=document.querySelector('meta[name="description"]');if(description&&plain)description.content=plain;
    const variants=(product.variants||[]).filter(available),prices=variants.map(v=>Number(v.unitPrice?.value)).filter(Number.isFinite);
    const schema={'@context':'https://schema.org','@type':'Product',name:product.name,description:plain,image:(product.images||[]).slice(0,3).map(imageOf),brand:{'@type':'Brand',name:'YSMF'},url:document.querySelector('link[rel="canonical"]')?.href};
    if(prices.length)schema.offers={'@type':'AggregateOffer',priceCurrency:variants[0].unitPrice?.currency||currency(),lowPrice:Math.min(...prices),highPrice:Math.max(...prices),offerCount:variants.length};
    let el=document.getElementById('product-schema');if(!el){el=document.createElement('script');el.type='application/ld+json';el.id='product-schema';document.head.append(el);}el.textContent=JSON.stringify(schema);
  }
  let sizeGuideData;
  function safeGuideUrl(value) {
    try { const url = new URL(value); return url.protocol === 'https:' ? url.href : ''; } catch { return ''; }
  }
  async function renderSizeGuide(product, target) {
    if (!target) return;
    const guide = product.sizeGuide || {};
    const apparel = /hoodie|tee|shirt|jogger|windbreaker|crewneck|beanie|hat|cap/i.test(product.name);
    if (!apparel && !product.sizeGuide) { target.closest("details").remove(); return; }
    if (!apparel) target.closest("details").querySelector("summary").textContent = "Dimensions & measuring guide";
    if (!sizeGuideData) sizeGuideData = fetch('/assets/size-guides.json?v=20261114').then(r => { if (!r.ok) throw Error('guide'); return r.json(); }).catch(() => ({}));
    const records = await sizeGuideData;
    if (!target.isConnected) return;
    const record = records[product.slug];
    // Never attach one garment's measurements to another product.
    const rows = record && record.previewUrl === guide.previewUrl ? record.variants : [];
    const preview = safeGuideUrl(guide.previewUrl);
    const file = safeGuideUrl(guide.fileUrl);
    const fitImages = (guide.fitGuideUrls || []).map(safeGuideUrl).filter(Boolean);
    const cleanGuide = html => {
      const doc = new DOMParser().parseFromString(sanitize(html || ''), 'text/html');
      doc.querySelectorAll('[style]').forEach(el => el.removeAttribute('style'));
      return doc.body.innerHTML;
    };
    target.innerHTML = `${rows?.length ? '<div class="size-unit-controls" role="group" aria-label="Measurement units"><button type="button" data-size-unit="CM" aria-pressed="true">Centimetres</button><button type="button" data-size-unit="IN" aria-pressed="false">Inches</button></div><div class="size-table-wrap" data-size-table tabindex="0" role="region" aria-label="Size measurements"></div><p class="size-chart-note">Supplier measurements. Follow the measuring instructions below; garment width is not body circumference.</p>' : ''}
      ${apparel && !rows?.length && !file ? '<p>Numeric size measurements are not supplied by the store connection for this item. Please confirm your size with us before ordering.</p>' : ''}
      ${file ? `<p><a href="${escapeHtml(file)}" target="_blank" rel="noopener">Open full supplier size chart ↗</a></p>` : ''}
      ${preview ? `<img class="size-guide-diagram" src="${escapeHtml(preview)}" alt="How to measure ${escapeHtml(product.name)}" loading="lazy"><p data-guide-image-error hidden>Measuring diagram could not load. Please use the written instructions below.</p>` : ''}
      <div class="size-guide-instructions">${cleanGuide(guide.description)}${cleanGuide(guide.fitGuideDescription)}</div>
      ${fitImages.map(url => `<img class="size-guide-diagram" src="${escapeHtml(url)}" alt="Supplier fit guide" loading="lazy">`).join('')}`;
    target.querySelector('.size-guide-diagram')?.addEventListener('error', event => { event.target.hidden = true; const note=target.querySelector('[data-guide-image-error]'); if(note) note.hidden=false; });
    if (!rows?.length) return;
    const availableSizes = new Set((product.variants || []).map(v => v.attributes?.size?.name));
    const labels = [...new Set(rows.flatMap(row => row.values.map(value => value.label)))];
    function draw(unit) {
      const format = value => {
        if (!value) return '—';
        const factor = value.unit === unit ? 1 : unit === 'CM' ? 2.54 : 1 / 2.54;
        const number = n => Number((n * factor).toFixed(1)).toString();
        return value.values.min === value.values.max ? number(value.values.min) : `${number(value.values.min)}–${number(value.values.max)}`;
      };
      target.querySelector('[data-size-table]').innerHTML = `<table><caption>${escapeHtml(product.name)} — ${unit === 'CM' ? 'cm' : 'inches'}</caption><thead><tr><th scope="col">Size</th>${labels.map(label => `<th scope="col">${escapeHtml(label.toLowerCase())}</th>`).join('')}</tr></thead><tbody>${rows.filter(row => [...availableSizes].some(size => String(size).toLowerCase() === row.label.toLowerCase())).map(row => `<tr><th scope="row">${escapeHtml(row.label)}</th>${labels.map(label => `<td>${format(row.values.find(v => v.label === label))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
      target.querySelectorAll('[data-size-unit]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.sizeUnit === unit)));
    }
    target.querySelectorAll('[data-size-unit]').forEach(button => button.addEventListener('click', () => draw(button.dataset.sizeUnit)));
    draw('CM');
  }

  // YSMF trust fix — 26 Nov 2026, authorised by Ashleigh: Lavender MORE DETAILS fabric copy.
  // Fourthwall supplies the MORE DETAILS block per product, listing every colour's fabric mix.
  // For the Lavender hoodie only, drop the lines that state a fabric percentage for another
  // colour, keeping Lavender's 65% cotton / 35% polyester. Non-fabric lines are left alone,
  // and if the Lavender mix is not found the block is left exactly as supplied.
  function tidyLavenderMoreDetails(info) {
    info.forEach(function (item) {
      if (item.type !== 'MORE_DETAILS' || !item.bodyHtml) return;
      if (!/65%\s*cotton/i.test(item.bodyHtml)) return;
      const doc = new DOMParser().parseFromString(item.bodyHtml, 'text/html');
      doc.querySelectorAll('li, p').forEach(function (el) {
        if (el.querySelector('li, p')) return; // container, not a single line
        const text = el.textContent || '';
        if (!/%/.test(text)) return;
        if (/lavender/i.test(text) || /65%\s*cotton/i.test(text)) {
          // One line mixing Lavender with other colours: keep only the Lavender / 65% cotton segments.
          if ((text.match(/%/g) || []).length > 1) {
            const parts = el.innerHTML.split(/<br\s*\/?>|;/i).filter(function (seg) {
              const s = seg.replace(/<[^>]+>/g, '');
              return !/%/.test(s) || /lavender/i.test(s) || /65%\s*cotton/i.test(s);
            });
            if (parts.length && parts.join('').length < el.innerHTML.length) el.innerHTML = parts.join('<br>');
          }
          return;
        }
        el.remove();
      });
      const cleaned = doc.body.innerHTML;
      if (/65%\s*cotton/i.test(cleaned)) item.bodyHtml = cleaned;
    });
  }

  function productInformation(product) {
    const info = (product.additionalInformation || []).map(item => ({...item}));
    const textOf = html => new DOMParser().parseFromString(html || '', 'text/html').body.textContent.replace(/\u00a0/g, ' ').trim();
    const fit = info.find(item => item.type === 'SIZE_AND_FIT');
    if (fit && textOf(fit.bodyHtml)) return info;
    const sources = info.filter(item => item.type === 'MORE_DETAILS').map(item => item.bodyHtml || '');
    const facts = [];
    for (const html of sources) {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      doc.querySelectorAll('li, p').forEach(el => {
        const text = el.textContent.replace(/\u00a0/g, ' ').trim();
        if (text && /\b(?:regular|relaxed|oversized|slim|classic|loose|tight|standard|retail|athletic)\s+fit\b|\bunisex sizing\b|\bone size fits most\b/i.test(text) && !facts.includes(text)) facts.push(text);
      });
    }
    if (facts.length) {
      const bodyHtml = '<ul>' + facts.map(text => '<li>' + escapeHtml(text) + '</li>').join('') + '</ul>';
      if (fit) fit.bodyHtml = bodyHtml;
      else info.push({type:'SIZE_AND_FIT', title:'Size & Fit', bodyHtml});
    }
    // Do not present an empty accordion when the supplier provides no information.
    if (product.slug === 'ysmf-minimal-lavender-embroidered-hoodie') tidyLavenderMoreDetails(info);
    return info.filter(item => item.type !== 'SIZE_AND_FIT' || textOf(item.bodyHtml));
  }

  async function addMatchingPiece(product,mount) {
    if(!/Midnight Luxe/i.test(product.name)||!midnightTracksuit(product))return;
    try {
      const products=await collectionProducts('midnight');
      const partner=products.find(p=>p.id!==product.id && midnightTracksuit(p) && (/jogger/i.test(product.name)?/black/i.test(p.name)&&/hoodie/i.test(p.name):/jogger/i.test(p.name)));
      if(!partner||!mount.isConnected)return;
      const box=document.createElement('section');box.className='matching-piece';
      const price=minPrice(partner);
      box.innerHTML=`<h2>Complete the look.</h2><p>Matching pieces, sold separately. Choose a size for each.</p><a href="/product/?slug=${encodeURIComponent(partner.slug)}"><img src="${escapeHtml(imageOf(partner.images?.[0]))}" alt="" loading="lazy"><span>${escapeHtml(partner.name)}<br>${price?money(price.value,price.currency):'View piece'} ↗</span></a>`;
      $('.product-detail-info',mount).append(box);
    }catch{ /* Related products never block the product being viewed. */ }
  }
  function renderProduct(p,mount){
    // YSMF trust fix — 26 Nov 2026, authorised by Ashleigh: runs-small warning (Lavender only).
    const LAVENDER_SLUG = 'ysmf-minimal-lavender-embroidered-hoodie';
    const isLavender = p.slug === LAVENDER_SLUG;
    const RUNS_SMALL_HTML = '<p class="ysmf-runs-small" style="border:1px solid #ddd;border-radius:10px;padding:10px 12px;margin:10px 0;font-size:14px;line-height:1.5"><strong>This hoodie runs small.</strong> For the perfect fit, we recommend ordering one size larger than your usual size. Regular fit but can run a bit tight. Unisex sizing.</p>';
    const variants=(p.variants||[]).filter(available); if(!variants.length){mount.innerHTML='<div class="empty-state">This piece is currently unavailable. <a href="/shop/">Explore other clothing ↗</a></div>';return;}
    let selected=variants[0], qty=1;let sizeChosen=false; let images=(selected.images?.length?selected.images:p.images)||[];
    const colors=[...new Set(variants.map(v=>v.attributes?.color?.name).filter(Boolean))]; const sizes=[...new Set(variants.map(v=>v.attributes?.size?.name).filter(Boolean))];
    const price=selected.unitPrice||minPrice(p)||{value:0,currency:currency()};
    const info=productInformation(p).map(x=>`<details><summary>${escapeHtml(x.title||x.type||'Details')}</summary><div class="details-body">${sanitize(x.bodyHtml||'')}</div></details>`).join('');
    mount.innerHTML=`<div class="product-detail"><div class="product-gallery"><div class="product-thumbs" data-thumbs></div><div class="product-main-image"><img data-main-img alt="${escapeHtml(p.name)}"></div></div><div class="product-detail-info"><a class="back-link" href="/shop/">← Back to shop</a><div class="brand-line">${escapeHtml(productLine(p))} / ${escapeHtml(category(p.name))}</div><h1>${escapeHtml(p.name)}</h1><div class="detail-price" data-detail-price>${money(price.value,price.currency)}</div><details class="product-description-details"><summary>About this piece</summary><div class="detail-description">${sanitize(p.description||'')}</div></details><div data-variants></div><details class="ysmf-size-guide"><summary>Size guide &amp; measurements</summary><div class="details-body" data-size-guide aria-live="polite">Loading size guide…</div></details><div class="purchase-row"><div class="qty"><button aria-label="Decrease quantity" data-qty-minus>−</button><input data-qty value="1" inputmode="numeric" aria-label="Quantity"><button aria-label="Increase quantity" data-qty-plus>+</button></div><button class="add-cart" data-add>Add to bag</button></div><div class="ysmf-shipping" style="border:1px solid #ddd;border-radius:10px;padding:12px 14px;margin:12px 0;font-size:14px;line-height:1.5">
  <strong>Delivery:</strong> Delivery costs depend on where you're ordering from — we ship internationally.<br>
  Shipping costs and tax can vary depending on your location.<br>
  Made to order, so please allow 7–10 business days.
</div><p class="ysmf-fit-note" style="font-size:14px;line-height:1.5;margin:12px 0">
  <strong>Made to order just for you</strong> — so we can't take it back for a wrong size.
  Check the full measurements before you order, and DM us if you're between sizes.
  Between sizes? Size up for oversized, size down for a regular fit.
</p><p class="purchase-note">Delivery costs and estimates shown at checkout.<br><a href="/help/">Delivery & returns</a> · Secure checkout with Fourthwall.</p><div class="product-more">${info}</div></div></div>`;
    const thumbs=$('[data-thumbs]',mount), main=$('[data-main-img]',mount), varMount=$('[data-variants]',mount), priceEl=$('[data-detail-price]',mount), add=$('[data-add]',mount);
    renderSizeGuide(p, mount.querySelector('[data-size-guide]')); addMatchingPiece(p,mount);
    function setImages(){images=(selected.images?.length?selected.images:p.images)||[];thumbs.innerHTML='';images.forEach((im,i)=>{const u=imageOf(im);const b=document.createElement('button');b.className=`thumb${i===0?' active':''}`;b.setAttribute('aria-label',`View product image ${i+1}`);b.setAttribute('aria-pressed',String(i===0));b.innerHTML=`<img src="${u}" alt="">`;b.onclick=()=>{$$('.thumb',thumbs).forEach(x=>{x.classList.remove('active');x.setAttribute('aria-pressed','false');});b.classList.add('active');b.setAttribute('aria-pressed','true');main.src=u;};thumbs.appendChild(b);});main.src=imageOf(images[0])||'';priceEl.textContent=money(selected.unitPrice?.value||0,selected.unitPrice?.currency||currency());}
    function choose(){
      const c=varMount.querySelector('[data-color].active')?.dataset.color; const s=varMount.querySelector('[data-size].active')?.dataset.size;
      const found=(!colors.length&&!sizes.length)?selected:variants.find(v=>(!c||v.attributes?.color?.name===c)&&(!s||v.attributes?.size?.name===s)); if(found){selected=found;add.disabled=sizes.length>0&&!sizeChosen;setImages();}else add.disabled=true;add.textContent=add.disabled?(sizes.length&&!sizeChosen?'Choose your size':'Unavailable'):'Add to bag';$$('[data-size],[data-color]',varMount).forEach(b=>b.setAttribute('aria-pressed',String(b.classList.contains('active'))));
      $$('.size-btn',varMount).forEach(b=>{const ok=variants.some(v=>(!c||v.attributes?.color?.name===c)&&v.attributes?.size?.name===b.dataset.size);b.disabled=!ok;});
    }
    if(colors.length){varMount.insertAdjacentHTML('beforeend',`<div class="variant-block"><div class="variant-label"><span>Colour</span><span data-color-name>${escapeHtml(selected.attributes?.color?.name||'')}</span></div><div class="swatches">${colors.map(c=>{const v=variants.find(x=>x.attributes?.color?.name===c);const sw=v?.attributes?.color?.swatch||'#222';return `<button class="swatch-btn${c===selected.attributes?.color?.name?' active':''}" data-color="${escapeHtml(c)}"><span class="swatch-dot" style="background:${escapeHtml(sw)}"></span>${escapeHtml(c)}</button>`}).join('')}</div></div>`);$$('[data-color]',varMount).forEach(b=>b.onclick=()=>{$$('[data-color]',varMount).forEach(x=>x.classList.remove('active'));b.classList.add('active');$('[data-color-name]',varMount).textContent=b.dataset.color;choose();});}
    if(sizes.length){varMount.insertAdjacentHTML('beforeend',`<div class="variant-block"><div class="variant-label"><span>Size</span></div><div class="sizes">${sizes.map(s=>`<button class="size-btn" data-size="${escapeHtml(s)}">${escapeHtml(s)}</button>`).join('')}</div></div>`);if(isLavender){varMount.insertAdjacentHTML('beforeend',RUNS_SMALL_HTML);}$$('[data-size]',varMount).forEach(b=>b.onclick=()=>{$$('[data-size]',varMount).forEach(x=>x.classList.remove('active'));b.classList.add('active');sizeChosen=true;choose();});}
    if(!colors.length&&!sizes.length&&variants.length>1){varMount.insertAdjacentHTML('beforeend',`<div class="variant-block"><div class="variant-label"><span>Option</span></div><div class="sizes">${variants.map(v=>`<button class="variant-option${v.id===selected.id?' active':''}" data-variant="${v.id}">${escapeHtml(v.attributes?.description||v.name)}</button>`).join('')}</div></div>`);$$('[data-variant]',varMount).forEach(b=>b.onclick=()=>{$$('[data-variant]',varMount).forEach(x=>x.classList.remove('active'));b.classList.add('active');selected=variants.find(v=>v.id===b.dataset.variant)||selected;setImages();});}
    $('[data-qty-minus]',mount).onclick=()=>{qty=Math.max(1,qty-1);$('[data-qty]',mount).value=qty};$('[data-qty-plus]',mount).onclick=()=>{qty+=1;$('[data-qty]',mount).value=qty};$('[data-qty]',mount).onchange=e=>{qty=Math.max(1,parseInt(e.target.value||'1',10)||1);e.target.value=qty};add.onclick=async()=>{if(add.disabled)return;add.disabled=true;add.textContent='Adding…';await addVariant(selected.id,qty,ecommerceItem(p,selected,qty));choose();};setImages();choose();trackCommerce('view_item',[ecommerceItem(p,selected,1)]);
  }

  injectCart(); setupMinimal(); $$('[data-products-grid]').forEach(loadGrid); loadProductPage(); refreshCart();
})();
