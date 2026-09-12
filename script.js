const toggle = document.querySelector('.mobile-toggle');
const links = document.querySelector('.nav-links');
if (toggle && links) {
  toggle.addEventListener('click', () => links.classList.toggle('open'));
  links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
}

// Keep the primary navigation consistent with the homepage on shared-site pages.
(() => {
  const nav = document.querySelector('.nav');
  const navLinks = nav?.querySelector('.nav-links');
  if (!nav || !navLinks || document.body.classList.contains('home-page')) return;

  const sayHi = navLinks.querySelector('.nav-btn, .cta');
  const hasProjects = [...navLinks.querySelectorAll('a')].some(a => /projects/i.test(a.textContent));
  const hasAwards = [...navLinks.querySelectorAll('a')].some(a => /awards/i.test(a.textContent));

  const insertBeforeSayHi = (label, href) => {
    const a = document.createElement('a');
    a.href = href;
    a.textContent = label;
    if (sayHi) navLinks.insertBefore(a, sayHi); else navLinks.appendChild(a);
  };
  if (!hasProjects) insertBeforeSayHi('Projects', 'index.html#projects');
  if (!hasAwards) insertBeforeSayHi('Awards', 'index.html#awards');
  if (sayHi) {
    sayHi.textContent = 'Say hi ↗';
    sayHi.href = 'index.html#contact';
    sayHi.classList.add('nav-btn');
  }

  const style = document.createElement('style');
  style.id = 'unified-site-nav';
  style.textContent = `
    body:not(.home-page) .nav{
      background:rgba(244,241,233,.88)!important;
      border-bottom:1px solid rgba(10,15,24,.10)!important;
      backdrop-filter:blur(18px)!important;
      -webkit-backdrop-filter:blur(18px)!important;
      color:#0a0f18!important;
    }
    body:not(.home-page) .nav .brand{
      color:#0a0f18!important;
      font-family:"Space Grotesk",Inter,system-ui,sans-serif!important;
      font-size:20px!important;
      font-weight:700!important;
      letter-spacing:-.04em!important;
    }
    body:not(.home-page) .nav .brand span{color:#875cff!important}
    body:not(.home-page) .nav .nav-links{
      display:flex!important;
      align-items:center!important;
      gap:24px!important;
      color:#20262f!important;
    }
    body:not(.home-page) .nav .nav-links>a{
      padding:0!important;
      margin:0!important;
      border-radius:0!important;
      background:transparent!important;
      box-shadow:none!important;
      color:#20262f!important;
      font-family:"DM Sans",Inter,system-ui,sans-serif!important;
      font-size:14px!important;
      line-height:1.2!important;
      font-weight:700!important;
      letter-spacing:0!important;
      text-transform:none!important;
    }
    body:not(.home-page) .nav .nav-links>a:hover,
    body:not(.home-page) .nav .nav-links>a.active{color:#0a0f18!important}
    body:not(.home-page) .nav .nav-links>a.nav-btn,
    body:not(.home-page) .nav .nav-links>a.cta{
      padding:12px 18px!important;
      border-radius:999px!important;
      background:#0a0f18!important;
      color:#fff!important;
      box-shadow:none!important;
    }
    @media(max-width:680px){
      body:not(.home-page) .nav .nav-links{
        display:none!important;
        position:absolute!important;
        top:72px!important;
        left:12px!important;
        right:12px!important;
        padding:16px!important;
        border:1px solid rgba(10,15,24,.1)!important;
        border-radius:18px!important;
        background:#fff!important;
        box-shadow:0 20px 60px rgba(10,15,24,.12)!important;
        flex-direction:column!important;
        align-items:stretch!important;
        gap:16px!important;
      }
      body:not(.home-page) .nav .nav-links.open{display:flex!important}
      body:not(.home-page) .nav .nav-links>a.nav-btn,
      body:not(.home-page) .nav .nav-links>a.cta{text-align:center!important}
    }
  `;
  document.head.appendChild(style);
})();

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

// Service Learning image lightbox: click any story image to inspect it full-screen.
if (document.body.classList.contains('service-shell')) {
  const serviceImages = document.querySelectorAll('.service-collage img, .service-media img, .chapter-hero-media img, .chapter-grid img');
  if (serviceImages.length) {
    const style = document.createElement('style');
    style.id = 'service-lightbox-style';
    style.textContent = `
      .service-shell .service-collage img,
      .service-shell .service-media img,
      .service-shell .chapter-hero-media img,
      .service-shell .chapter-grid img{cursor:zoom-in}
      .service-lightbox{position:fixed;inset:0;z-index:2000;display:grid;place-items:center;padding:32px;background:rgba(5,10,8,.92);backdrop-filter:blur(12px);opacity:0;visibility:hidden;transition:opacity .2s ease,visibility .2s ease}
      .service-lightbox.open{opacity:1;visibility:visible}
      .service-lightbox-inner{position:relative;max-width:min(1400px,96vw);max-height:92vh;display:grid;gap:12px;justify-items:center}
      .service-lightbox img{display:block;max-width:100%;max-height:84vh;width:auto;height:auto;object-fit:contain;border-radius:18px;box-shadow:0 28px 90px rgba(0,0,0,.42);background:#111}
      .service-lightbox-caption{max-width:900px;color:#f5f7f4;text-align:center;font-size:13px;line-height:1.5}
      .service-lightbox-close{position:fixed;right:22px;top:20px;width:48px;height:48px;border:1px solid rgba(255,255,255,.22);border-radius:50%;background:rgba(255,255,255,.1);color:#fff;font-size:28px;line-height:1;cursor:pointer;display:grid;place-items:center}
      @media(max-width:680px){.service-lightbox{padding:16px}.service-lightbox-close{right:12px;top:12px}.service-lightbox img{max-height:78vh}}
    `;
    document.head.appendChild(style);

    const lightbox = document.createElement('div');
    lightbox.className = 'service-lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', 'Expanded service learning photo');
    lightbox.innerHTML = `<button class="service-lightbox-close" aria-label="Close image">×</button><div class="service-lightbox-inner"><img alt=""><div class="service-lightbox-caption"></div></div>`;
    document.body.appendChild(lightbox);
    const modalImg = lightbox.querySelector('img');
    const caption = lightbox.querySelector('.service-lightbox-caption');
    const closeBtn = lightbox.querySelector('.service-lightbox-close');

    const close = () => {
      lightbox.classList.remove('open');
      document.documentElement.style.overflow = '';
    };
    serviceImages.forEach(img => {
      img.addEventListener('click', e => {
        e.preventDefault();
        const fig = img.closest('figure');
        const cap = fig?.querySelector('figcaption')?.innerText?.trim();
        modalImg.src = img.currentSrc || img.src;
        modalImg.alt = img.alt || 'Expanded service learning photo';
        caption.textContent = cap || img.alt || '';
        lightbox.classList.add('open');
        document.documentElement.style.overflow = 'hidden';
      });
    });
    closeBtn.addEventListener('click', close);
    lightbox.addEventListener('click', e => { if (e.target === lightbox) close(); });
    window.addEventListener('keydown', e => { if (e.key === 'Escape' && lightbox.classList.contains('open')) close(); });
  }
}

// Season 01 hero: keep it readable, energetic, and visually distinct from the shared site hero.
if ((location.pathname.endsWith('/vex-2024-2025.html') || location.pathname.endsWith('vex-2024-2025.html')) && document.body.classList.contains('s1')) {
  const heroCopy = document.querySelector('.hero-copy');
  const heroTitle = heroCopy?.querySelector('h1');
  const heroLead = heroCopy?.querySelector(':scope > p');
  const proofRow = heroCopy?.querySelector('.hero-proof');

  if (heroTitle) {
    heroTitle.innerHTML = 'I came to build a robot.<span>I left thinking in systems.</span>';
  }

  if (heroLead) {
    heroLead.textContent = 'High Stakes was my first full VEX cycle. Every jam, misalignment, and rushed rebuild pushed me beyond “make it work” toward a more deliberate loop: design, test, diagnose, rebuild.';
  }

  if (proofRow && !document.querySelector('.hero-mindset')) {
    proofRow.insertAdjacentHTML('beforebegin', `
      <div class="hero-mindset" aria-label="Engineering mindset progression">
        <span>Mindset shift</span>
        <strong>WORKING ONCE</strong><b>→</b>
        <strong>WORKING REPEATEDLY</strong><b>→</b>
        <strong>ENGINEERING FOR CHANGE</strong>
      </div>
    `);
  }

  const style = document.createElement('style');
  style.id = 'season-one-hero-polish';
  style.textContent = `
    .s1 .hero-copy{background:transparent!important;color:var(--s1-ink)!important;border-radius:0!important;padding:0!important;min-height:0!important;display:block!important;box-shadow:none!important;overflow:visible!important;position:relative!important}
    .s1 .hero-copy:before{display:none!important}
    .s1 .hero-copy .eyebrow{color:#111827!important;background:rgba(255,255,255,.72)!important;border:1px solid rgba(8,11,18,.13)!important;box-shadow:0 8px 24px rgba(8,11,18,.05)}
    .s1 .hero-copy h1{color:#080b12!important;max-width:760px!important;margin:24px 0 24px!important;text-wrap:balance}
    .s1 .hero-copy h1 span{display:block;color:transparent!important;background:linear-gradient(96deg,#5368ff 4%,#7b5cff 48%,#198c78 100%);-webkit-background-clip:text;background-clip:text;padding-bottom:.05em}
    .s1 .hero-copy>p{color:#4d5665!important;font-size:clamp(17px,1.45vw,20px)!important;line-height:1.58!important;max-width:650px!important;margin:0!important;padding-left:18px!important;border-left:3px solid #6475ff}
    .s1 .hero-mindset{margin-top:24px;max-width:710px;display:flex;align-items:center;gap:9px;flex-wrap:wrap;padding:13px 15px;border-radius:18px;background:rgba(255,255,255,.62);border:1px solid rgba(8,11,18,.09);box-shadow:0 12px 30px rgba(8,11,18,.05);backdrop-filter:blur(10px)}
    .s1 .hero-mindset span{padding:7px 10px;border-radius:999px;background:#080b12;color:#fff;font-size:9px;font-weight:900;letter-spacing:.09em;text-transform:uppercase}
    .s1 .hero-mindset strong{color:#303947;font-size:9px;font-weight:900;letter-spacing:.075em;white-space:nowrap}.s1 .hero-mindset b{color:#6475ff;font-size:13px}
    .s1 .hero-proof{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px!important;max-width:720px;margin-top:20px!important;align-items:stretch}
    .s1 .hero-proof .proof{position:relative;min-height:138px;padding:20px 18px 17px!important;border:1px solid rgba(8,11,18,.09)!important;border-radius:24px!important;box-shadow:0 16px 35px rgba(8,11,18,.07)!important;overflow:hidden;transition:transform .28s ease,box-shadow .28s ease;isolation:isolate}
    .s1 .hero-proof .proof:nth-child(1){background:linear-gradient(145deg,#c7ff8d,#a7ff52)!important;transform:rotate(-1.2deg)}
    .s1 .hero-proof .proof:nth-child(2){background:linear-gradient(145deg,#dbf8ff,#79e2ff)!important;transform:translateY(8px) rotate(.7deg)}
    .s1 .hero-proof .proof:nth-child(3){background:linear-gradient(145deg,#e7eaff,#cbd2ff)!important;transform:rotate(-.6deg)}
    .s1 .hero-proof .proof:hover{transform:translateY(-6px) rotate(0deg)!important;box-shadow:0 24px 48px rgba(8,11,18,.12)!important}
    .s1 .hero-proof .proof:after{position:absolute;right:12px;top:6px;font:700 54px/1 "Space Grotesk",sans-serif;letter-spacing:-.08em;color:rgba(8,11,18,.07);z-index:-1}.s1 .hero-proof .proof:nth-child(1):after{content:'01'}.s1 .hero-proof .proof:nth-child(2):after{content:'02'}.s1 .hero-proof .proof:nth-child(3):after{content:'03'}
    .s1 .hero-proof .proof:before{display:block;margin-bottom:18px;color:#505968;font-size:8px;font-weight:900;letter-spacing:.1em;text-transform:uppercase}.s1 .hero-proof .proof:nth-child(1):before{content:'NATIONALS'}.s1 .hero-proof .proof:nth-child(2):before{content:'SKILLS'}.s1 .hero-proof .proof:nth-child(3):before{content:'QUALIFIER'}
    .s1 .hero-proof .proof strong{display:block!important;color:#080b12!important;font:700 clamp(29px,3vw,42px)/.95 "Space Grotesk",sans-serif!important;letter-spacing:-.055em!important;margin-bottom:10px}
    .s1 .hero-proof .proof span{display:block!important;color:#374151!important;font-size:9px!important;line-height:1.4!important;font-weight:900!important;letter-spacing:.065em!important;text-transform:uppercase!important}
    @media(max-width:900px){.s1 .hero-proof{grid-template-columns:1fr 1fr!important}.s1 .hero-proof .proof:nth-child(3){grid-column:1/-1}}
    @media(max-width:640px){.s1 .hero-copy h1{font-size:clamp(46px,15vw,68px)!important}.s1 .hero-proof{grid-template-columns:1fr!important}.s1 .hero-proof .proof:nth-child(2){transform:rotate(.7deg)!important}.s1 .hero-proof .proof:nth-child(3){grid-column:auto}.s1 .hero-mindset{gap:7px}.s1 .hero-mindset strong{white-space:normal}}
  `;
  document.head.appendChild(style);
}

// Home portrait: subtle floating motion and hover depth while keeping the original hero layout.
if (document.body.classList.contains('home-page')) {
  const style = document.createElement('style');
  style.id = 'home-portrait-polish';
  style.textContent = `
    @keyframes heroPortraitFloat{0%,100%{translate:0 0}50%{translate:0 -8px}}
    .home-page .portrait-frame{
      animation:heroPortraitFloat 7s ease-in-out infinite;
      transition:transform .38s cubic-bezier(.2,.8,.2,1),box-shadow .38s ease;
    }
    .home-page .portrait-frame img{
      transition:transform .8s cubic-bezier(.2,.8,.2,1);
    }
    .home-page .portrait-frame:hover{
      transform:rotate(.5deg) translateY(-5px);
      box-shadow:0 42px 100px rgba(23,28,23,.22);
    }
    .home-page .portrait-frame:hover img{transform:scale(1.065)}
    @media(prefers-reduced-motion:reduce){.home-page .portrait-frame{animation:none!important}}
  `;
  document.head.appendChild(style);
}
