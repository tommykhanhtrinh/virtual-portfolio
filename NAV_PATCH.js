// Fridgi global navigation patch.
// The current live repo already contains this logic in script.js.
// Keep this file only if you need to apply the update to an older local copy.
(() => {
  const nav = document.querySelector('.nav');
  const navLinks = nav?.querySelector('.nav-links');
  if (!nav || !navLinks) return;

  const anchors = () => [...navLinks.querySelectorAll('a')];
  const sayHi = navLinks.querySelector('.nav-btn, .cta');

  if (!anchors().some(a => /fridgi/i.test(a.textContent))) {
    const fridgi = document.createElement('a');
    fridgi.href = 'feat.html';
    fridgi.textContent = 'Fridgi';

    const service = anchors().find(a => /^service$/i.test(a.textContent.trim()));
    const projects = anchors().find(a => /projects/i.test(a.textContent));

    if (service?.nextSibling) navLinks.insertBefore(fridgi, service.nextSibling);
    else if (projects) navLinks.insertBefore(fridgi, projects);
    else if (sayHi) navLinks.insertBefore(fridgi, sayHi);
    else navLinks.appendChild(fridgi);
  }

  if (document.body.classList.contains('feat-page')) {
    navLinks.querySelectorAll('a').forEach(a => a.classList.remove('active'));
    [...navLinks.querySelectorAll('a')].find(a => /fridgi/i.test(a.textContent))?.classList.add('active');
  }
})();
