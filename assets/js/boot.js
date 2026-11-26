/* Runs before the page is drawn: refuse to be shown inside another site's frame, then pick the motion mode. */
if (window.top !== window.self && !/^(127\.0\.0\.1|localhost)$/.test(location.hostname)) {
  document.documentElement.style.display = 'none';
  try { window.top.location = window.self.location.href; } catch (error) { /* the frame stays blank */ }
}
document.documentElement.classList.add('js');
let savedMotion = null;
try { savedMotion = localStorage.getItem('motion'); } catch (error) { /* storage blocked */ }
if (!matchMedia('(prefers-reduced-motion: reduce)').matches && savedMotion !== 'off') {
  document.documentElement.classList.add('motion');
}
