// Mobile menu + in-page links that scroll without adding "#..." to the address bar.
(function(){
  var nav = document.querySelector('.top nav'), links = nav && nav.querySelector('.links');
  if (!links) return;
  var fr = (document.documentElement.lang || 'fr').indexOf('fr') === 0;
  var b = document.createElement('button');
  b.type = 'button'; b.className = 'menubtn';
  b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-controls', 'menu');
  b.setAttribute('aria-label', fr ? 'Ouvrir le menu' : 'Open menu');
  b.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path class="l1" d="M4 7h16"/><path class="l2" d="M4 12h16"/><path class="l3" d="M4 17h16"/></svg>';
  links.id = 'menu';
  nav.appendChild(b);
  var set = function(open){
    nav.classList.toggle('open', open);
    b.setAttribute('aria-expanded', String(open));
    b.setAttribute('aria-label', open ? (fr ? 'Fermer le menu' : 'Close menu') : (fr ? 'Ouvrir le menu' : 'Open menu'));
  };
  b.addEventListener('click', function(){ set(!nav.classList.contains('open')); });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && nav.classList.contains('open')) { set(false); b.focus(); } });
  document.addEventListener('click', function(e){ if (nav.classList.contains('open') && !nav.contains(e.target)) set(false); });
  window.addEventListener('resize', function(){ if (window.innerWidth > 860) set(false); });

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var go = function(el){ el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); };
  document.addEventListener('click', function(e){
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var url = new URL(a.getAttribute('href'), location.href);
    if (!url.hash || url.pathname !== location.pathname || url.search !== location.search) { if (nav.contains(a)) set(false); return; }
    var el = url.hash === '#' ? document.body : document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (!el) return;
    e.preventDefault(); set(false); go(el);
    if (history.replaceState) history.replaceState(null, '', location.pathname + location.search);
  });
  // arriving from another page with #section: scroll there, then clean the address
  if (location.hash.length > 1) {
    var el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (el && history.replaceState) setTimeout(function(){ go(el); history.replaceState(null, '', location.pathname + location.search); }, 60);
  }
})();
