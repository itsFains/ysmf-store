/* Accessible navigation and bag behaviour, independent of catalogue loading. */
(() => {
  const menu=document.querySelector('[data-mobile-menu]');
  const toggle=document.querySelector('[data-menu-toggle]');
  const header=document.querySelector('.site-header');
  const focusable=root=>[...root.querySelectorAll('a[href],button:not([disabled]),input,select,[tabindex="0"]')].filter(el=>el.getClientRects().length&&!el.closest('[inert]'));
  let cartOpener=null;
  function closeMenu(returnFocus=false){
    if(!menu||!toggle)return;
    menu.classList.remove('open');document.body.classList.remove('menu-open');
    toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Open menu');
    if(returnFocus)toggle.focus();
  }
  toggle?.addEventListener('click',()=>{
    const open=menu.classList.contains('open');toggle.setAttribute('aria-label',open?'Close menu':'Open menu');
    if(open){menu.style.top=`${header.getBoundingClientRect().bottom}px`;focusable(menu)[0]?.focus();}
  });
  menu?.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});
  window.addEventListener('resize',()=>{if(innerWidth>900)closeMenu();else if(menu?.classList.contains('open'))menu.style.top=`${header.getBoundingClientRect().bottom}px`;});
  document.querySelectorAll('[data-cart-open]').forEach(button=>button.addEventListener('pointerdown',()=>cartOpener=button));
  document.addEventListener('ysmf:cart-open',()=>{if(!cartOpener)cartOpener=document.activeElement;closeMenu();});
  document.addEventListener('ysmf:cart-close',()=>{(cartOpener?.getClientRects().length?cartOpener:document.querySelector('.mobile-bag')?.getClientRects().length?document.querySelector('.mobile-bag'):document.querySelector('[data-cart-open]'))?.focus();cartOpener=null;});
  document.addEventListener('keydown',e=>{
    const cart=document.querySelector('[data-cart-overlay].open');
    const navOpen=menu?.classList.contains('open');
    if(e.key==='Escape'){e.target.closest?.('[data-nav-dropdown]')?.querySelector('[data-dropdown-toggle]')?.focus();if(cart)cart.querySelector('[data-cart-close]').click();else if(navOpen)closeMenu(true);}
    if(e.key!=='Tab')return;
    const items=cart?focusable(cart):navOpen?[toggle,...focusable(menu)]:[];
    if(!items.length)return;
    const first=items[0],last=items[items.length-1];
    if(e.shiftKey&&(document.activeElement===first||!items.includes(document.activeElement))){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&(document.activeElement===last||!items.includes(document.activeElement))){e.preventDefault();first.focus();}
  });
  // An old campaign link now resolves to the dedicated Softer Side page.
  if(location.pathname==='/minimal/'&&location.hash==='#softer-side')document.getElementById('softer-side')?.scrollIntoView();
})();
