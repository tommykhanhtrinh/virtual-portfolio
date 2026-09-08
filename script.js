const toggle = document.querySelector('.mobile-toggle');
const links = document.querySelector('.nav-links');
if (toggle && links) {
  toggle.addEventListener('click', () => links.classList.toggle('open'));
  links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
}

// Scroll reveal
const revealEls = document.querySelectorAll('.reveal-up, .reveal-scale');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14 });
  revealEls.forEach((el, i) => {
    el.style.transitionDelay = `${Math.min((i % 4) * 70, 210)}ms`;
    observer.observe(el);
  });
} else {
  revealEls.forEach(el => el.classList.add('is-visible'));
}

// Scroll progress
const progress = document.querySelector('.scroll-progress');
function updateProgress() {
  if (!progress) return;
  const doc = document.documentElement;
  const max = doc.scrollHeight - doc.clientHeight;
  const pct = max > 0 ? (doc.scrollTop / max) * 100 : 0;
  progress.style.width = `${pct}%`;
}
window.addEventListener('scroll', updateProgress, { passive: true });
updateProgress();

// Subtle cursor follower on desktop
const orb = document.querySelector('.cursor-orb');
if (orb && window.matchMedia('(pointer:fine)').matches) {
  let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y;
  window.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; });
  const tick = () => {
    x += (tx - x) * .18; y += (ty - y) * .18;
    orb.style.left = `${x}px`; orb.style.top = `${y}px`;
    requestAnimationFrame(tick);
  };
  tick();
  document.querySelectorAll('a,.tilt-card').forEach(el => {
    el.addEventListener('mouseenter', () => { orb.style.width = '48px'; orb.style.height = '48px'; orb.style.background = 'rgba(156,255,87,.18)'; });
    el.addEventListener('mouseleave', () => { orb.style.width = '26px'; orb.style.height = '26px'; orb.style.background = 'rgba(135,92,255,.17)'; });
  });
}

// Gentle tilt on selected work cards
if (window.matchMedia('(pointer:fine)').matches) {
  document.querySelectorAll('.tilt-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - .5;
      const py = (e.clientY - r.top) / r.height - .5;
      card.style.transform = `perspective(1000px) rotateX(${py * -2.4}deg) rotateY(${px * 2.4}deg) translateY(-3px)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
}

// Count-up milestone numbers once visible
const counters = document.querySelectorAll('[data-counter]');
const countOne = el => {
  const target = Number(el.dataset.counter || 0);
  const duration = 900;
  const start = performance.now();
  const step = now => {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(target * eased);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};
if ('IntersectionObserver' in window) {
  const countObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { countOne(entry.target); countObserver.unobserve(entry.target); }
  }), { threshold: .45 });
  counters.forEach(c => countObserver.observe(c));
}
