(() => {
  'use strict';
  const root = document.querySelector('[data-midnight-preview]');
  if (!root) return;
  const slides = [...root.querySelectorAll('[data-ml-slide]')];
  const tabs = [...root.querySelectorAll('[data-ml-tab]')];
  const title = root.querySelector('[data-ml-title]');
  const description = root.querySelector('[data-ml-description]');
  const counter = root.querySelector('[data-ml-counter]');
  let current = 0;
  function showSlide(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => { slide.hidden = i !== current; });
    tabs.forEach((tab, i) => tab.setAttribute('aria-current', String(i === current)));
    title.textContent = slides[current].dataset.title;
    description.textContent = slides[current].dataset.description;
    counter.textContent = `${String(current + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
  }
  tabs.forEach((tab, i) => tab.addEventListener('click', () => showSlide(i)));
  root.querySelector('[data-ml-prev]').addEventListener('click', () => showSlide(current - 1));
  root.querySelector('[data-ml-next]').addEventListener('click', () => showSlide(current + 1));
  const carousel = root.querySelector('[data-ml-carousel]');
  carousel.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    showSlide(current + (event.key === 'ArrowLeft' ? -1 : 1));
  });
  let touchStart;
  carousel.addEventListener('touchstart', event => {
    const touch = event.touches[0];
    touchStart = {x:touch.clientX, y:touch.clientY};
  }, {passive:true});
  carousel.addEventListener('touchend', event => {
    if (!touchStart) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStart.x;
    const dy = touch.clientY - touchStart.y;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5) showSlide(current + (dx < 0 ? 1 : -1));
    touchStart = null;
  }, {passive:true});
  root.querySelectorAll('[data-ml-controls]').forEach(el => { el.hidden = false; });

  const dialog = document.querySelector('[data-ml-dialog]');
  let opener;
  root.querySelectorAll('[data-ml-enlarge]').forEach(button => {
    button.addEventListener('click', () => {
      opener = button;
      const image = dialog.querySelector('img');
      image.src = button.dataset.image;
      image.alt = button.dataset.label;
      dialog.querySelector('h2').textContent = button.dataset.label;
      dialog.showModal();
    });
  });
  dialog.querySelector('[data-ml-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => opener?.focus());

  const canvas = document.querySelector('[data-ml-snow]');
  const toggle = document.querySelector('[data-ml-snow-toggle]');
  const context = canvas.getContext('2d');
  if (!context) return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let enabled = !motion.matches;
  let animation = 0;
  let lastFrame = 0;
  let width = 0;
  let height = 0;
  let flakes = [];
  let manuallyChosen = false;
  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    flakes = Array.from({length:width < 700 ? 25 : 55}, () => ({
      x:Math.random() * width, y:Math.random() * height,
      radius:.6 + Math.random() * 1.6, speed:12 + Math.random() * 23,
      drift:Math.random() * Math.PI * 2, opacity:.15 + Math.random() * .45
    }));
  }
  function draw(now) {
    animation = 0;
    if (!enabled || document.hidden) return;
    if (now - lastFrame < 33) { animation = requestAnimationFrame(draw); return; }
    const elapsed = Math.min((now - lastFrame) / 1000 || .033, .1);
    lastFrame = now;
    context.clearRect(0, 0, width, height);
    flakes.forEach(flake => {
      flake.y += flake.speed * elapsed;
      flake.x += Math.sin(now / 4000 + flake.drift) * elapsed * 8;
      if (flake.y > height + 4) { flake.y = -4; flake.x = Math.random() * width; }
      if (flake.x < -4) flake.x = width + 4;
      if (flake.x > width + 4) flake.x = -4;
      context.beginPath();
      context.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
      context.fillStyle = `rgba(224,239,248,${flake.opacity})`;
      context.fill();
    });
    animation = requestAnimationFrame(draw);
  }
  function syncSnow() {
    cancelAnimationFrame(animation);
    animation = 0;
    lastFrame = performance.now();
    context.clearRect(0, 0, width, height);
    toggle.setAttribute('aria-pressed', String(enabled));
    toggle.textContent = enabled ? 'Snow: on' : 'Snow: off';
    if (enabled && !document.hidden) animation = requestAnimationFrame(draw);
  }
  toggle.hidden = false;
  toggle.addEventListener('click', () => { manuallyChosen = true; enabled = !enabled; syncSnow(); });
  motion.addEventListener('change', () => {
    if (!manuallyChosen) { enabled = !motion.matches; syncSnow(); }
  });
  window.addEventListener('resize', resize, {passive:true});
  document.addEventListener('visibilitychange', syncSnow);
  resize();
  syncSnow();
})();
