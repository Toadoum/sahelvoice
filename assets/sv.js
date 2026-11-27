/* SahelVoice website (2026-11 redesign). Calm by default: one sequence in the hero, the rest on demand. */

/* Header: a hairline once the page scrolls. */
(function(){
  var top = document.querySelector('.top'); if (!top) return;
  var on = function(){ top.classList.toggle('scrolled', window.scrollY > 4); };
  on(); window.addEventListener('scroll', on, { passive: true });
})();

/* Hero listening card: the question is read by the real SahelVoice voice (on demand);
   the reply is "heard", written, then becomes a line of data. */
(function(){
  var card = document.querySelector('.listen-card'); if (!card) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function bars(el, n, seed){ var h = ''; for (var i = 0; i < n; i++){ var v = .25 + .75 * Math.abs(Math.sin(i * 1.7 + seed) * Math.cos(i * .53 + seed * 2)); h += '<i style="height:' + Math.round(5 + 22 * v) + 'px"></i>'; } el.innerHTML = h; return el.querySelectorAll('i'); }
  function fmt(x){ x = Math.max(0, Math.round(x || 0)); return Math.floor(x / 60) + ':' + String(x % 60).padStart(2, '0'); }
  // question: real audio
  var q = card.querySelector('.vn.q'), qb = bars(q.querySelector('.vn-wave'), 26, 1), qt = q.querySelector('.vn-t');
  var a = new Audio(); a.preload = 'metadata'; a.src = q.dataset.src;
  a.addEventListener('loadedmetadata', function(){ qt.textContent = fmt(a.duration); });
  a.addEventListener('error', function(){ q.querySelector('.vn-play').disabled = true; q.querySelector('.vn-play').style.opacity = .5; });
  a.addEventListener('timeupdate', function(){ var k = a.currentTime / (a.duration || 1); qb.forEach(function(b, i){ b.classList.toggle('on', i / qb.length < k); }); qt.textContent = fmt(a.currentTime); });
  a.addEventListener('ended', function(){ q.classList.remove('playing'); qb.forEach(function(b){ b.classList.remove('on'); }); qt.textContent = fmt(a.duration); });
  q.querySelector('.vn-play').addEventListener('click', function(){
    if (!a.paused){ a.pause(); q.classList.remove('playing'); return; }
    q.classList.add('playing'); a.play().catch(function(){ q.classList.remove('playing'); });
  });
  // reply: heard -> written -> data -> verified
  var r = card.querySelector('.vn.r'), rb = bars(r.querySelector('.vn-wave'), 22, 4), rt = r.querySelector('.vn-t');
  var words = card.querySelectorAll('.lc-v .w'), pend = card.querySelectorAll('.lc-pend'), status = card.querySelector('[data-status]');
  var running = false;
  function run(){
    if (running) return; running = true;
    words.forEach(function(w){ w.classList.remove('on'); }); pend.forEach(function(p){ p.classList.remove('on'); });
    status.textContent = status.dataset.wait; status.classList.remove('lc-ok');
    if (reduce){ rb.forEach(function(b){ b.classList.add('on'); }); words.forEach(function(w){ w.classList.add('on'); }); pend.forEach(function(p){ p.classList.add('on'); }); status.textContent = status.dataset.done; status.classList.add('lc-ok'); running = false; return; }
    var t0 = null, D = 2600;
    function step(ts){
      if (t0 === null) t0 = ts; var k = Math.min(1, (ts - t0) / D);
      rb.forEach(function(b, i){ b.classList.toggle('on', i / rb.length < k); }); rt.textContent = fmt(3 * k);
      words.forEach(function(w, i){ if (k > (i + .5) / words.length * .9) w.classList.add('on'); });
      if (k < 1) return requestAnimationFrame(step);
      setTimeout(function(){ pend[0] && pend[0].classList.add('on'); }, 250);
      setTimeout(function(){ pend[1] && pend[1].classList.add('on'); }, 700);
      setTimeout(function(){ status.textContent = status.dataset.done; status.classList.add('lc-ok'); running = false; }, 1500);
    }
    requestAnimationFrame(step);
  }
  r.querySelector('.vn-play').addEventListener('click', run);
  if ('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(es){ if (es[0].isIntersecting){ io.disconnect(); setTimeout(run, 500); } }, { threshold: .5 });
    io.observe(card);
  } else run();
})();

/* Ready templates: sector tabs, WhatsApp preview, question read by the SahelVoice voice. */
(function(){
  var tabs = document.querySelectorAll('.mdl-tabs [role=tab]');
  if (!tabs.length) return;
  var audio = null, current = null;
  function fmt(s){ s = Math.max(0, Math.round(s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
  function stop(){ if (audio){ audio.pause(); } if (current){ current.classList.remove('playing'); } }
  document.querySelectorAll('.mdl-wave').forEach(function(w, n){
    var h = ''; for (var i = 0; i < 30; i++){ var v = .25 + .75 * Math.abs(Math.sin(i * 1.7 + n) * Math.cos(i * .53 + n * 2)); h += '<i style="height:' + Math.round(6 + 24 * v) + 'px"></i>'; }
    w.innerHTML = h;
  });
  function paint(box, k){ var b = box.querySelectorAll('.mdl-wave i'); for (var i = 0; i < b.length; i++) b[i].classList.toggle('on', i / b.length < k); }
  document.querySelectorAll('.mdl-voice').forEach(function(box){
    // check once that the sample exists; hide the player if the server cannot read it aloud
    var probe = new Audio(); probe.preload = 'metadata'; probe.src = box.dataset.src;
    probe.addEventListener('loadedmetadata', function(){ box.querySelector('.mdl-t').textContent = fmt(probe.duration); });
    probe.addEventListener('error', function(){ box.classList.add('off'); });
    box.querySelector('.mdl-play').addEventListener('click', function(){
      if (current === box && audio && !audio.paused){ stop(); return; }
      stop();
      audio = probe; current = box;
      audio.ontimeupdate = function(){ paint(box, audio.currentTime / (audio.duration || 1)); box.querySelector('.mdl-t').textContent = fmt(audio.currentTime); };
      audio.onended = function(){ box.classList.remove('playing'); paint(box, 0); box.querySelector('.mdl-t').textContent = fmt(audio.duration); };
      box.classList.add('playing');
      audio.play().catch(function(){ box.classList.remove('playing'); });
    });
  });
  function select(t, focus){
    stop();
    tabs.forEach(function(x){ var on = x === t; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1;
      var p = document.getElementById(x.getAttribute('aria-controls')); p.hidden = !on;
      if (on){ p.querySelectorAll('.mdl-b').forEach(function(b){ b.style.animation = 'none'; void b.offsetWidth; b.style.animation = ''; }); } });
    if (focus) t.focus();
  }
  tabs.forEach(function(t, i){
    t.addEventListener('click', function(){ select(t); });
    t.addEventListener('keydown', function(e){
      var k = e.key, n = tabs.length, j = null;
      if (k === 'ArrowDown' || k === 'ArrowRight') j = (i + 1) % n;
      if (k === 'ArrowUp' || k === 'ArrowLeft') j = (i - 1 + n) % n;
      if (k === 'Home') j = 0; if (k === 'End') j = n - 1;
      if (j !== null){ e.preventDefault(); select(tabs[j], true); }
    });
  });
})();

/* API examples: tabs and copy. */
(function(){
  var card = document.querySelector('.api-card');
  if (!card) return;
  var tabs = card.querySelectorAll('[role=tab]'), copy = card.querySelector('.api-copy');
  function select(t, focus){
    tabs.forEach(function(x){ var on = x === t; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1;
      document.getElementById(x.getAttribute('aria-controls')).hidden = !on; });
    copy.hidden = t.id === 'at-xl';
    if (focus) t.focus();
  }
  tabs.forEach(function(t, i){
    t.addEventListener('click', function(){ select(t); });
    t.addEventListener('keydown', function(e){
      var j = null; if (e.key === 'ArrowRight') j = (i + 1) % tabs.length; if (e.key === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length;
      if (j !== null){ e.preventDefault(); select(tabs[j], true); }
    });
  });
  copy.addEventListener('click', function(){
    var on = card.querySelector('[role=tab][aria-selected=true]'), pre = document.getElementById(on.getAttribute('aria-controls')).querySelector('pre');
    if (!pre || !navigator.clipboard) return;
    navigator.clipboard.writeText(pre.textContent).then(function(){ copy.textContent = copy.dataset.lDone; setTimeout(function(){ copy.textContent = copy.dataset.lCopy; }, 1600); });
  });
})();
