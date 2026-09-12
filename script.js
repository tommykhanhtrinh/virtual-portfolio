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


// Live model status
const viewer = document.getElementById('pushbackViewer');
const viewerStatus = document.getElementById('viewerStatus');
if (viewer && viewerStatus) {
  viewer.addEventListener('load', () => {
    viewerStatus.textContent = 'model loaded / orbit ready';
  });
  viewer.addEventListener('error', () => {
    viewerStatus.textContent = 'preview unavailable';
  });
}

// Detailed digital twin HUD + particle field
const particleHost = document.querySelector('.field-particles');
if (particleHost && !particleHost.children.length) {
  const dots = [
    [8,12,6,14,-12,.2],[18,26,-10,18,-22,1.1],[31,14,14,-16,-10,.8],[46,24,8,10,-14,1.6],[58,18,-9,15,-18,2.1],[73,13,12,-10,-8,.4],[84,28,-8,12,-16,1.8],[92,14,10,8,-12,.6],
    [12,44,10,-12,-16,.9],[23,53,-11,14,-20,1.4],[39,48,8,10,-12,.3],[54,57,-9,16,-18,1.7],[67,47,12,-10,-12,.7],[78,56,-8,13,-20,2.3],[89,50,10,10,-15,1.2],
    [15,76,-10,12,-14,.5],[28,84,10,-8,-12,1.9],[42,73,-6,12,-18,.1],[57,82,8,8,-12,1.5],[71,76,-11,13,-16,.65],[85,86,12,-9,-12,2.05]
  ];
  dots.forEach(([l,t,dx,dy,dur,delay]) => {
    const s = document.createElement('span');
    s.style.left = `${l}%`;
    s.style.top = `${t}%`;
    s.style.setProperty('--dx', `${dx}px`);
    s.style.setProperty('--dy', `${dy}px`);
    s.style.setProperty('--dur', `${Math.abs(dur)}s`);
    s.style.setProperty('--delay', `${delay}s`);
    particleHost.appendChild(s);
  });
}

const azEl = document.getElementById('viewerAzimuth');
const elEl = document.getElementById('viewerElevation');
const distEl = document.getElementById('viewerDistance');

function readNumeric(value) {
  const n = parseFloat(String(value));
  return Number.isFinite(n) ? n : null;
}
function formatDeg(value) {
  if (value == null) return '—';
  return `${Math.round(value)}°`;
}
function formatMeters(value) {
  if (value == null) return '—';
  return `${value.toFixed(1)} m`;
}
function updateViewerHUD() {
  if (!viewer || !viewer.getCameraOrbit) return;
  try {
    const orbit = viewer.getCameraOrbit();
    const az = readNumeric(orbit.theta);
    const polar = readNumeric(orbit.phi);
    const radius = readNumeric(orbit.radius);
    if (azEl) azEl.textContent = formatDeg(az);
    if (elEl) elEl.textContent = formatDeg(polar);
    if (distEl) distEl.textContent = formatMeters(radius);
  } catch (err) {
    // noop
  }
}

if (viewer) {
  viewer.addEventListener('load', () => {
    updateViewerHUD();
    if (viewerStatus) viewerStatus.textContent = 'model loaded / free orbit';
  });
  viewer.addEventListener('camera-change', () => {
    updateViewerHUD();
  });
  viewer.addEventListener('pointerdown', () => {
    if (viewerStatus) viewerStatus.textContent = 'manual orbit / inspecting';
  });
  viewer.addEventListener('pointerup', () => {
    if (viewerStatus) viewerStatus.textContent = 'interactive orbit / ready';
  });
  viewer.addEventListener('mouseenter', () => {
    if (viewerStatus) viewerStatus.textContent = 'hover / ready to inspect';
  });
  viewer.addEventListener('mouseleave', () => {
    if (viewerStatus) viewerStatus.textContent = 'auto rotate / standby';
  });
  window.addEventListener('load', () => setTimeout(updateViewerHUD, 350));
}
