
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
  function available(v) { return !(v?.stock && typeof v.stock.inStock === 'number' && v.stock.inStock <= 0); }

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
    twitch: `<svg class="social-icon-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M4.3 2h16.4v11.3l-4.7 4.7h-3.6L10 20.4H7.6V18H4.3V2Zm2.2 2.2v11.6h3.3v2l2-2h4.1l2.6-2.6v-9H6.5Zm4.2 2.8h2.1v5.5h-2.1V7Zm4.1 0h2.1v5.5h-2.1V7Z"/>
    </svg>`,
    instagram: `<svg class="social-icon-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M7.2 2h9.6A5.2 5.2 0 0 1 22 7.2v9.6a5.2 5.2 0 0 1-5.2 5.2H7.2A5.2 5.2 0 0 1 2 16.8V7.2A5.2 5.2 0 0 1 7.2 2Zm0 2A3.2 3.2 0 0 0 4 7.2v9.6A3.2 3.2 0 0 0 7.2 20h9.6a3.2 3.2 0 0 0 3.2-3.2V7.2A3.2 3.2 0 0 0 16.8 4H7.2Zm10.2 1.5a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"/>
    </svg>`
  };

  function enhanceStoreChrome() {
    // Preserve the existing working links; only replace their visual icon.
    $$('.socials .social-link').forEach(link => {
      const label = (link.textContent || '').trim().toLowerCase();
      const type = label.includes('twitch') ? 'twitch' : label.includes('instagram') ? 'instagram' : null;
      if (!type) return;
      const visibleLabel = type === 'twitch' ? 'Twitch' : 'Instagram';
      link.innerHTML = `${SOCIAL_ICONS[type]}<span>${visibleLabel}</span>`;
      link.setAttribute('aria-label', visibleLabel);
    });

    // Use the exact same IF logo asset as the header in every footer.
    $$('.footer-brand').forEach(brand => {
      brand.innerHTML = `<img class="footer-logo-img" src="assets/if-logo.png" alt="IF">`;
    });

    // Keep currency options consistent on every page.
    $$('[data-currency]').forEach(select => {
      select.innerHTML = FOURTHWALL_CURRENCIES
        .map(([code, label]) => `<option value="${code}">${label}</option>`)
        .join('');
    });
  }

  enhanceStoreChrome();

  // Nav / prelaunch
  $$('[data-minimal-nav]').forEach(el => { if (!cfg.showMinimalInNavigation) el.hidden = true; });
  const teaser = $('[data-minimal-teaser]'); if (teaser && !cfg.showMinimalTeaserOnHome) teaser.hidden = true;
  const file = location.pathname.split('/').pop() || 'index.html';
  $$('[data-nav-link]').forEach(a => { if ((a.getAttribute('href')||'').split('?')[0] === file) a.classList.add('active'); });
  const toggle=$('[data-menu-toggle]'), menu=$('[data-mobile-menu]');
  if(toggle&&menu) toggle.addEventListener('click',()=>{const o=menu.classList.toggle('open');document.body.classList.toggle('menu-open',o);toggle.setAttribute('aria-expanded',String(o));});

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
  function injectCart(){
    const desktop=$('.desktop-nav'); if(desktop && !desktop.querySelector('[data-cart-open]')) desktop.insertAdjacentHTML('beforeend',`<button class="cart-trigger" data-cart-open>Cart <span class="cart-count" data-cart-count>0</span></button>`);
    const mobile=$('[data-mobile-menu]'); if(mobile && !mobile.querySelector('[data-cart-open]')) mobile.insertAdjacentHTML('beforeend',`<button data-cart-open>Cart <span data-cart-count>0</span></button>`);
    document.body.insertAdjacentHTML('beforeend',`<div class="cart-overlay" data-cart-overlay><aside class="cart-drawer" role="dialog" aria-modal="true" aria-label="Shopping cart"><div class="cart-head"><h2>Your bag</h2><button class="cart-close" data-cart-close aria-label="Close cart">×</button></div><div class="cart-body" data-cart-body><div class="cart-empty">Your bag is empty.</div></div><div class="cart-foot"><div class="cart-subtotal"><span>Subtotal</span><strong data-cart-subtotal>—</strong></div><button class="btn btn-primary btn-block" data-checkout>Checkout →</button><p class="cart-note">Secure checkout is completed with Fourthwall.</p></div></aside></div><div class="toast" data-toast></div>`);
    $$('[data-cart-open]').forEach(b=>b.addEventListener('click',openCart));
    $('[data-cart-close]').addEventListener('click',closeCart); $('[data-cart-overlay]').addEventListener('click',e=>{if(e.target===e.currentTarget)closeCart();}); $('[data-checkout]').addEventListener('click',checkout);
  }
  function openCart(){ $('[data-cart-overlay]').classList.add('open'); document.body.classList.add('cart-open'); refreshCart(); }
  function closeCart(){ $('[data-cart-overlay]')?.classList.remove('open'); document.body.classList.remove('cart-open'); }
  function toast(msg){const el=$('[data-toast]');if(!el)return;el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1900);}
  function updateCartCount(){const count=(cart?.items||[]).reduce((n,i)=>n+(i.quantity||0),0);$$('[data-cart-count]').forEach(e=>e.textContent=count);}

  async function request(path, opts={}){
    if(!cfg.storefrontToken) throw new Error('NO_TOKEN');
    const res=await fetch(apiUrl(path),opts); if(!res.ok) throw new Error(`Fourthwall ${res.status}`); return res.json();
  }
  async function refreshCart(){
    const id=localStorage.getItem('ysmf_cart_id'); if(!id){cart=null;renderCart();return;}
    try{cart=await request(`/carts/${encodeURIComponent(id)}`);renderCart();}catch{localStorage.removeItem('ysmf_cart_id');cart=null;renderCart();}
  }
  async function addVariant(variantId, quantity=1){
    if(!cfg.storefrontToken){toast('Connect Fourthwall first');return;}
    try{
      const id=localStorage.getItem('ysmf_cart_id');
      if(!id){cart=await request('/carts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:[{variantId,quantity}]})});localStorage.setItem('ysmf_cart_id',cart.id);}
      else {try{cart=await request(`/carts/${encodeURIComponent(id)}/add`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:[{variantId,quantity}]})});}catch{localStorage.removeItem('ysmf_cart_id');return addVariant(variantId,quantity);}}
      renderCart();openCart();toast('Added to bag');
    }catch(e){console.error(e);toast('Could not add item');}
  }
  async function changeQty(variantId, quantity){
    const id=localStorage.getItem('ysmf_cart_id'); if(!id)return;
    if(quantity<=0) return removeItem(variantId,1);
    try{cart=await request(`/carts/${encodeURIComponent(id)}/change`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:[{variantId,quantity}]})});renderCart();}catch(e){console.error(e);toast('Could not update bag');}
  }
  async function removeItem(variantId, quantity){
    const id=localStorage.getItem('ysmf_cart_id'); if(!id)return;
    try{cart=await request(`/carts/${encodeURIComponent(id)}/remove`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:[{variantId,quantity}]})});renderCart();}catch(e){console.error(e);toast('Could not remove item');}
  }
  function renderCart(){
    updateCartCount(); const body=$('[data-cart-body]'), sub=$('[data-cart-subtotal]'); if(!body)return;
    const items=cart?.items||[]; if(!items.length){body.innerHTML='<div class="cart-empty">Your bag is empty.</div>';sub.textContent='—';return;}
    let total=0,curr=currency(); body.innerHTML='';
    items.forEach(item=>{const v=item.variant||{}; const p=v.unitPrice||{}; curr=p.currency||curr; total+=Number(p.value||0)*Number(item.quantity||0); const img=imageOf(v.images?.[0]); const desc=v.attributes?.description||[v.attributes?.color?.name,v.attributes?.size?.name].filter(Boolean).join(' / '); const wrap=document.createElement('div');wrap.className='cart-item';wrap.innerHTML=`<div class="cart-item-img">${img?`<img src="${img}" alt="">`:''}</div><div><p class="cart-item-name">${escapeHtml(v.product?.name||v.name||'Product')}</p><p class="cart-item-variant">${escapeHtml(desc||'')}</p><div class="cart-item-price">${money(p.value||0,p.currency||curr)}</div><div class="cart-item-actions"><div class="mini-qty"><button data-dec>−</button><span>${item.quantity}</span><button data-inc>+</button></div><button class="remove-item" data-remove>Remove</button></div></div>`;wrap.querySelector('[data-dec]').onclick=()=>changeQty(v.id,Math.max(0,item.quantity-1));wrap.querySelector('[data-inc]').onclick=()=>changeQty(v.id,item.quantity+1);wrap.querySelector('[data-remove]').onclick=()=>removeItem(v.id,item.quantity);body.appendChild(wrap);});
    sub.textContent=money(total,curr);
  }
  function checkout(){const id=localStorage.getItem('ysmf_cart_id');if(!id){toast('Your bag is empty');return;}const params=new URLSearchParams({cartId:id,currency:currency()});location.href=`${String(cfg.fourthwallShopUrl||'').replace(/\/$/,'')}/cart/checkout?${params.toString()}`;}

  // Products / collections
  async function fetchCollection(slug){return request(`/collections/${encodeURIComponent(slug)}/products?size=50`);}
  function category(name=''){const n=name.toLowerCase();if(/hoodie/.test(n))return'Hoodie';if(/t-shirt|tee/.test(n))return'Tee';if(/sweatshirt|crewneck/.test(n))return'Crewneck';if(/hat|cap/.test(n))return'Headwear';if(/beanie/.test(n))return'Beanie';return'Signature';}
  function rank(name=''){const n=name.toLowerCase();if(n.includes('hoodie'))return 0;if(/t-shirt|tee/.test(n))return 1;if(/sweatshirt|crewneck/.test(n))return 2;if(/hat|cap|beanie/.test(n))return 3;if(/tumbler|mug/.test(n))return 5;if(/phone|case|mouse|mat|towel|poster/.test(n))return 8;return 6;}
  function minPrice(product){const vs=product.variants||[];if(!vs.length)return null;return vs.reduce((a,v)=>!a||Number(v.unitPrice?.value)<Number(a.value)?v.unitPrice:a,null);}
  function card(product){const imgs=product.images||[];const img1=imageOf(imgs[0]),img2=imageOf(imgs[1]);const price=minPrice(product);const a=document.createElement('article');a.className=`product-card${img2?' has-secondary':''}`;a.innerHTML=`<a class="product-card-link" href="product.html?slug=${encodeURIComponent(product.slug)}"><div class="product-image"><span class="product-badge">${category(product.name)}</span>${img1?`<img class="product-image-primary" loading="lazy" src="${img1}" alt="${escapeHtml(product.name)}">`:''}${img2?`<img class="product-image-secondary" loading="lazy" src="${img2}" alt="">`:''}</div><div class="product-info"><div class="product-meta"><div><h3 class="product-name">${escapeHtml(product.name)}</h3><p class="product-price">${price?money(price.value,price.currency):'View piece'}</p></div><span class="product-view">→</span></div></div></a>`;return a;}
  async function loadGrid(grid){
    let slug=grid.dataset.collection||'all';if(slug==='signature')slug=cfg.signatureCollectionSlug||'signature-collection';if(slug==='minimal')slug=cfg.minimalCollectionSlug||'ysmf-minimal';grid.innerHTML='<div class="loading">Loading pieces…</div>';
    if(!cfg.storefrontToken){grid.innerHTML='<div class="api-note"><strong>Fourthwall connection missing.</strong><br>Keep your existing Storefront token in <code>assets/config.js</code>.</div>';return;}
    if(grid.dataset.collection==='minimal'&&!cfg.minimalIsLive){grid.innerHTML='<div class="empty-state">Drop 01 products are still private on Fourthwall. This grid will populate automatically when the collection goes public.</div>';return;}
    try{const data=await fetchCollection(slug);let products=[...(data.results||[])];if(grid.dataset.sort==='apparel-first')products.sort((a,b)=>rank(a.name)-rank(b.name)||String(a.name).localeCompare(String(b.name)));const limit=Number(grid.dataset.limit||0);if(limit)products=products.slice(0,limit);grid.innerHTML='';products.forEach(p=>grid.appendChild(card(p)));if(!products.length)grid.innerHTML='<div class="empty-state">No public products are currently available here.</div>';}catch(e){console.error(e);grid.innerHTML='<div class="api-note">Could not load products. Check the collection slug in <code>assets/config.js</code>.</div>';}
  }

  // Minimal hidden/preview page
  function setupMinimal(){const locked=$('[data-minimal-locked]'),full=$('[data-minimal-full]');if(!locked||!full)return;const preview=new URLSearchParams(location.search).get('preview')==='1';if(cfg.minimalIsLive||preview){locked.hidden=true;full.hidden=false;if(preview&&!cfg.minimalIsLive)document.body.insertAdjacentHTML('beforeend','<div class="preview-flag">Private preview</div>');}else{locked.hidden=false;full.hidden=true;}}

  // Product detail
  function sanitize(html=''){const d=new DOMParser().parseFromString(html,'text/html');d.querySelectorAll('script,style,iframe,object,embed').forEach(n=>n.remove());return d.body.innerHTML;}
  async function loadProductPage(){const mount=$('[data-product-page]');if(!mount)return;const slug=new URLSearchParams(location.search).get('slug');if(!slug){mount.innerHTML='<div class="empty-state">Product not found.</div>';return;}if(!cfg.storefrontToken){mount.innerHTML='<div class="api-note">Connect your Fourthwall Storefront token first.</div>';return;}try{const p=await request(`/products/${encodeURIComponent(slug)}`);document.title=`${p.name} — itsFains`;renderProduct(p,mount);}catch(e){console.error(e);mount.innerHTML='<div class="empty-state">This product could not be loaded.</div>';}}
  function renderProduct(p,mount){
    const variants=(p.variants||[]).filter(available); if(!variants.length){mount.innerHTML='<div class="empty-state">This piece is currently unavailable.</div>';return;}
    let selected=variants[0], qty=1; let images=(selected.images?.length?selected.images:p.images)||[];
    const colors=[...new Set(variants.map(v=>v.attributes?.color?.name).filter(Boolean))]; const sizes=[...new Set(variants.map(v=>v.attributes?.size?.name).filter(Boolean))];
    const price=selected.unitPrice||minPrice(p)||{value:0,currency:currency()};
    const info=(p.additionalInformation||[]).map(x=>`<details><summary>${escapeHtml(x.title||x.type||'Details')}</summary><div class="details-body">${sanitize(x.bodyHtml||'')}</div></details>`).join('');
    mount.innerHTML=`<div class="product-detail"><div class="product-gallery"><div class="product-thumbs" data-thumbs></div><div class="product-main-image"><img data-main-img alt="${escapeHtml(p.name)}"></div></div><div class="product-detail-info"><a class="back-link" href="shop.html">← Back to shop</a><div class="brand-line">itsFains / ${escapeHtml(category(p.name))}</div><h1>${escapeHtml(p.name)}</h1><div class="detail-price" data-detail-price>${money(price.value,price.currency)}</div><div class="detail-description">${sanitize(p.description||'')}</div><div data-variants></div><div class="purchase-row"><div class="qty"><button data-qty-minus>−</button><input data-qty value="1" inputmode="numeric" aria-label="Quantity"><button data-qty-plus>+</button></div><button class="add-cart" data-add>Add to bag</button></div><div class="product-more">${info}${p.sizeGuide?.previewUrl?`<details><summary>Size guide</summary><div class="details-body"><a class="text-link" href="${p.sizeGuide.previewUrl}" target="_blank" rel="noopener">Open size guide ↗</a></div></details>`:''}</div></div></div>`;
    const thumbs=$('[data-thumbs]',mount), main=$('[data-main-img]',mount), varMount=$('[data-variants]',mount), priceEl=$('[data-detail-price]',mount), add=$('[data-add]',mount);
    function setImages(){images=(selected.images?.length?selected.images:p.images)||[];thumbs.innerHTML='';images.forEach((im,i)=>{const u=imageOf(im);const b=document.createElement('button');b.className=`thumb${i===0?' active':''}`;b.innerHTML=`<img src="${u}" alt="">`;b.onclick=()=>{$$('.thumb',thumbs).forEach(x=>x.classList.remove('active'));b.classList.add('active');main.src=u;};thumbs.appendChild(b);});main.src=imageOf(images[0])||'';priceEl.textContent=money(selected.unitPrice?.value||0,selected.unitPrice?.currency||currency());}
    function choose(){
      const c=varMount.querySelector('[data-color].active')?.dataset.color; const s=varMount.querySelector('[data-size].active')?.dataset.size;
      const found=variants.find(v=>(!c||v.attributes?.color?.name===c)&&(!s||v.attributes?.size?.name===s)); if(found){selected=found;add.disabled=false;setImages();}else add.disabled=true;
      $$('.size-btn',varMount).forEach(b=>{const ok=variants.some(v=>(!c||v.attributes?.color?.name===c)&&v.attributes?.size?.name===b.dataset.size);b.disabled=!ok;});
    }
    if(colors.length){varMount.insertAdjacentHTML('beforeend',`<div class="variant-block"><div class="variant-label"><span>Colour</span><span data-color-name>${escapeHtml(selected.attributes?.color?.name||'')}</span></div><div class="swatches">${colors.map(c=>{const v=variants.find(x=>x.attributes?.color?.name===c);const sw=v?.attributes?.color?.swatch||'#222';return `<button class="swatch-btn${c===selected.attributes?.color?.name?' active':''}" data-color="${escapeHtml(c)}"><span class="swatch-dot" style="background:${escapeHtml(sw)}"></span>${escapeHtml(c)}</button>`}).join('')}</div></div>`);$$('[data-color]',varMount).forEach(b=>b.onclick=()=>{$$('[data-color]',varMount).forEach(x=>x.classList.remove('active'));b.classList.add('active');$('[data-color-name]',varMount).textContent=b.dataset.color;choose();});}
    if(sizes.length){varMount.insertAdjacentHTML('beforeend',`<div class="variant-block"><div class="variant-label"><span>Size</span></div><div class="sizes">${sizes.map(s=>`<button class="size-btn${s===selected.attributes?.size?.name?' active':''}" data-size="${escapeHtml(s)}">${escapeHtml(s)}</button>`).join('')}</div></div>`);$$('[data-size]',varMount).forEach(b=>b.onclick=()=>{$$('[data-size]',varMount).forEach(x=>x.classList.remove('active'));b.classList.add('active');choose();});}
    if(!colors.length&&!sizes.length&&variants.length>1){varMount.insertAdjacentHTML('beforeend',`<div class="variant-block"><div class="variant-label"><span>Option</span></div><div class="sizes">${variants.map(v=>`<button class="variant-option${v.id===selected.id?' active':''}" data-variant="${v.id}">${escapeHtml(v.attributes?.description||v.name)}</button>`).join('')}</div></div>`);$$('[data-variant]',varMount).forEach(b=>b.onclick=()=>{$$('[data-variant]',varMount).forEach(x=>x.classList.remove('active'));b.classList.add('active');selected=variants.find(v=>v.id===b.dataset.variant)||selected;setImages();});}
    $('[data-qty-minus]',mount).onclick=()=>{qty=Math.max(1,qty-1);$('[data-qty]',mount).value=qty};$('[data-qty-plus]',mount).onclick=()=>{qty+=1;$('[data-qty]',mount).value=qty};$('[data-qty]',mount).onchange=e=>{qty=Math.max(1,parseInt(e.target.value||'1',10)||1);e.target.value=qty};add.onclick=()=>addVariant(selected.id,qty);setImages();choose();
  }

  injectCart(); setupMinimal(); $$('[data-products-grid]').forEach(loadGrid); loadProductPage(); refreshCart();
})();
