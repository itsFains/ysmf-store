(() => {
  'use strict';
  const grid=document.querySelector('[data-products-grid]');
  if(grid) {
    const tidy=()=>{const error=grid.querySelector('.api-note');if(error&&!error.dataset.homeFriendly){error.dataset.homeFriendly='true';error.textContent='Our products could not load just now. Please refresh, or browse the store using the link below.';}};
    new MutationObserver(tidy).observe(grid,{childList:true});tidy();
  }
})();
