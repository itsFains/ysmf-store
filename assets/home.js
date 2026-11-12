(() => {
  'use strict';
  const video = document.querySelector('[data-home-film]');
  const toggle = document.querySelector('[data-film-toggle]');
  const frame = video?.parentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  let inView = false, userPaused = false, failed = false, started = false;
  function sync() {
    if (!video || failed) return;
    if (reduce.matches || document.hidden || !inView || userPaused) { video.pause(); return; }
    if (!started) { video.src = '/assets/windbreakerhero.mp4'; video.muted = true; started = true; }
    video.play().catch(() => { toggle.hidden = false; toggle.textContent = 'Play film ▶'; toggle.setAttribute('aria-label','Play windbreaker film'); });
  }
  if (video && toggle) {
    video.addEventListener('playing', () => { frame.classList.add('is-playing'); toggle.hidden = false; toggle.textContent = 'Pause film Ⅱ'; toggle.setAttribute('aria-label','Pause windbreaker film'); });
    video.addEventListener('pause', () => { toggle.textContent = 'Play film ▶'; toggle.setAttribute('aria-label','Play windbreaker film'); });
    video.addEventListener('error', () => { failed = true; frame.classList.remove('is-playing'); toggle.hidden = true; });
    toggle.addEventListener('click', () => { if (video.paused) { userPaused=false; video.play().catch(()=>{}); } else { userPaused=true; video.pause(); } });
    reduce.addEventListener('change', () => { if (reduce.matches) { video.pause();frame.classList.remove('is-playing');toggle.hidden=true; } else sync(); });
    document.addEventListener('visibilitychange', sync);
    if ('IntersectionObserver' in window) new IntersectionObserver(entries => { inView=entries[0].isIntersecting;sync(); },{threshold:.15}).observe(frame);
    else { inView=true;sync(); }
  }
  const grid=document.querySelector('[data-products-grid]');
  if(grid) {
    const tidy=()=>{const error=grid.querySelector('.api-note');if(error&&!error.dataset.homeFriendly){error.dataset.homeFriendly='true';error.textContent='Our products could not load just now. Please refresh, or browse the store using the link below.';}};
    new MutationObserver(tidy).observe(grid,{childList:true});tidy();
  }
})();
