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

/* ---------------------------------------------------------------- motion (2026-11-27) */
(function(){
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var IO = 'IntersectionObserver' in window;
  function once(el, cb, threshold){
    if (!el) return;
    if (!IO || reduce){ cb(el); return; }
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting){ io.unobserve(e.target); cb(e.target); } }); }, { threshold: threshold || .3 });
    io.observe(el);
  }

  /* titles rise word by word: the hero on load, the others when they come into view */
  function split(h){
    var walk = function(node){
      Array.prototype.slice.call(node.childNodes).forEach(function(n){
        if (n.nodeType === 3){
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function(part){
            if (!part) return;
            if (/^\s+$/.test(part)){ frag.appendChild(document.createTextNode(part)); return; }
            var w = document.createElement('span'); w.className = 'wd';
            var i = document.createElement('span'); i.textContent = part; w.appendChild(i); frag.appendChild(w);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && !n.classList.contains('wd') && !n.classList.contains('rot') && !n.classList.contains('sr')) walk(n);
      });
    };
    walk(h);
    h.classList.add('rise');
    h.querySelectorAll('.wd > span').forEach(function(s, k){ s.style.transitionDelay = (k * 0.055) + 's'; });
  }
  if (!reduce){
    var hero = document.querySelector('.hero h1, .page-head h1');
    if (hero){ split(hero); requestAnimationFrame(function(){ setTimeout(function(){ hero.classList.add('in'); }, 60); }); }
    document.querySelectorAll('.head h2, .cta-band h2, .needs h3.sub').forEach(function(h){ split(h); once(h, function(x){ x.classList.add('in'); }, .6); });
  }

  /* the three steps draw their rules in order */
  once(document.querySelector('.steps'), function(x){ x.classList.add('in'); }, .35);

  /* numbers count up */
  document.querySelectorAll('.facts b').forEach(function(b){
    var m = b.textContent.match(/^(\d+)(.*)$/); if (!m || +m[1] === 0 || reduce) return;
    var n = +m[1], rest = m[2]; b.textContent = '0' + rest;
    once(b, function(){
      var t0 = null;
      function step(ts){ if (t0 === null) t0 = ts; var k = Math.min(1, (ts - t0) / 900); b.textContent = Math.round(n * (1 - Math.pow(1 - k, 3))) + rest; if (k < 1) requestAnimationFrame(step); }
      requestAnimationFrame(step);
    }, .8);
  });

  /* AI examples type themselves */
  document.querySelectorAll('.rows .ex').forEach(function(ex, k){
    if (reduce) return;
    var html = ex.innerHTML, text = ex.textContent;
    ex.style.minHeight = ex.offsetHeight + 'px'; ex.textContent = '';
    once(ex, function(){
      var i = 0;
      setTimeout(function tick(){
        i++; ex.innerHTML = text.slice(0, i).replace(/&/g, '&amp;').replace(/</g, '&lt;') + '<span class="caret"></span>';
        if (i < text.length) setTimeout(tick, 22 + Math.random() * 30);
        else setTimeout(function(){ ex.innerHTML = html; }, 700);
      }, 150 + k * 120);
    }, .9);
  });

  /* closing band: a slow sound wave (only while visible) */
  var wave = document.querySelector('.cta-wave');
  if (wave){
    var paths = wave.querySelectorAll('path'), on = false, t = 0;
    function draw(){
      paths.forEach(function(p, j){
        var d = 'M0 ' + 100, amp = 26 - j * 6, f = .0055 + j * .0012, ph = t * (0.9 + j * .35) + j * 1.7;
        for (var x = 0; x <= 1440; x += 16){
          var env = Math.sin(Math.PI * x / 1440);
          var y = 100 + env * amp * (Math.sin(x * f + ph) * .7 + Math.sin(x * f * 2.3 - ph * 1.3) * .3);
          d += ' L' + x + ' ' + y.toFixed(1);
        }
        p.setAttribute('d', d);
      });
    }
    function loop(){ if (!on) return; t += 0.018; draw(); requestAnimationFrame(loop); }
    draw();
    if (IO && !reduce){ new IntersectionObserver(function(es){ on = es[0].isIntersecting; if (on) requestAnimationFrame(loop); }).observe(wave); }
  }

  /* footer: the giant word, filled with an equalizer that answers the pointer */
  var giant = document.querySelector('.giant');
  if (giant){
    var g = giant.querySelector('.giant-bars'), N = 96, W = 1200, H = 236, bw = W / N, bars = [], ns = 'http://www.w3.org/2000/svg';
    for (var i = 0; i < N; i++){
      var r = document.createElementNS(ns, 'rect'); r.setAttribute('x', (i * bw + bw * .18).toFixed(1)); r.setAttribute('width', (bw * .64).toFixed(1)); r.setAttribute('rx', 2);
      g.appendChild(r); bars.push({ el: r, h: 0, seed: Math.random() * 6.28, speed: .6 + Math.random() * .9 });
    }
    var px = -1, live = false, T = 0, svg = giant.querySelector('svg');
    function place(level){
      bars.forEach(function(b, i){
        var base = .32 + .26 * Math.sin(T * b.speed + b.seed) + .14 * Math.sin(T * .7 + i * .31);
        var near = px < 0 ? 0 : Math.max(0, 1 - Math.abs(i - px) / 9);
        var target = Math.min(1, Math.max(.06, base + near * .65)) * level;
        b.h += (target - b.h) * .12;
        var hh = b.h * H; b.el.setAttribute('y', (H - hh).toFixed(1)); b.el.setAttribute('height', hh.toFixed(1));
        b.el.classList.toggle('hot', near > .8);
      });
    }
    function frame(){ if (!live) return; T += .03; place(1); requestAnimationFrame(frame); }
    if (reduce || !IO){ T = 1; bars.forEach(function(b){ b.h = .4; }); place(1); bars.forEach(function(b){ b.h = .45; }); place(1); }
    else {
      new IntersectionObserver(function(es){ live = es[0].isIntersecting; if (live) requestAnimationFrame(frame); }).observe(giant);
      giant.addEventListener('pointermove', function(e){ var r = svg.getBoundingClientRect(); px = (e.clientX - r.left) / r.width * N; });
      giant.addEventListener('pointerleave', function(){ px = -1; });
    }
  }
})();

/* ---------------------------------------------------------------- animated dashboard copy */
(function(){
  var dash = document.querySelector('.dash'); if (!dash) return;
  var inner = dash.querySelector('.d-in');
  function fit(){ inner.style.setProperty('--k', dash.clientWidth / 1020); }
  fit(); window.addEventListener('resize', fit);
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var start = function(){ return { done: 5, verify: 7, voice: 34, q1: { oui: 3, non: 2 }, q2: { Riz: 0, Huile: 1, Sorgho: 0, Sel: 0, Savon: 1 } }; };
  var s = start();
  var toast = dash.querySelector('.d-toast'), t1 = toast.querySelector('.d-t1'), t2 = toast.querySelector('.d-t2');
  function set(k, v, flash){
    dash.querySelectorAll('[data-k="' + k + '"]').forEach(function(el){
      if (el.textContent === String(v)) return;
      el.textContent = v;
      if (flash){ el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }
    });
  }
  function bars(flash){
    ['q1', 'q2'].forEach(function(q){
      var tot = 0, o; for (o in s[q]) tot += s[q][o];
      dash.querySelectorAll('.d-bar[data-q="' + q + '"]').forEach(function(b){
        var n = s[q][b.dataset.o], p = tot ? Math.round(100 * n / tot) : 0;
        var label = n + ' · ' + p + ' %', was = b.querySelector('b').textContent;
        b.querySelector('em').style.setProperty('--w', p + '%'); b.querySelector('b').textContent = label;
        b.classList.toggle('grew', flash && was && was !== label);
      });
    });
  }
  function paint(flash){
    set('done', s.done, flash); set('verify', s.verify, flash); set('voice', s.voice, flash);
    set('q1n', s.q1.oui + s.q1.non, flash); set('open', 0);
    bars(flash);
  }
  paint(false);
  if (reduce || !('IntersectionObserver' in window)) return;
  var steps = [
    { who: '7c1e', how: 'par la voix', voice: true, go: function(){ s.done++; s.q1.oui++; s.verify++; s.voice = 38; } },
    { who: 'b09a', how: 'par bouton', voice: false, go: function(){ s.done++; s.q1.non++; s.q2.Sel++; } },
    { who: '52d3', how: 'par la voix', voice: true, go: function(){ s.done++; s.q1.oui++; s.verify++; s.voice = 41; } }
  ];
  var timers = [], live = false, running = false;
  function later(fn, ms){ timers.push(setTimeout(fn, ms)); }
  function cycle(){
    if (!live){ running = false; return; }
    running = true;
    var t = 600;
    steps.forEach(function(st){
      later(function(){ toast.className = 'd-toast show' + (st.voice ? '' : ' btn'); t1.textContent = 'Nouvelle réponse'; t2.textContent = 'Participant ' + st.who + ' · ' + st.how; }, t);
      later(function(){ st.go(); paint(true); }, t + 900);
      if (st.voice){
        later(function(){ toast.className = 'd-toast show ok'; t1.textContent = '✓ Vérifiée par Achta'; t2.textContent = 'Le vocal a été réécouté'; s.verify--; paint(true); }, t + 2900);
        later(function(){ toast.className = 'd-toast'; }, t + 4300);
        t += 5000;
      } else {
        later(function(){ toast.className = 'd-toast'; }, t + 2600);
        t += 3300;
      }
    });
    later(function(){ dash.style.transition = 'opacity .5s'; dash.style.opacity = .35; }, t + 2500);
    later(function(){ s = start(); paint(false); dash.style.opacity = 1; }, t + 3100);
    later(cycle, t + 4200);
  }
  new IntersectionObserver(function(es){
    live = es[0].isIntersecting;
    if (live && !running) cycle();
    if (!live){ timers.forEach(clearTimeout); timers = []; running = false; toast.className = 'd-toast'; s = start(); paint(false); dash.style.opacity = 1; }
  }, { threshold: .35 }).observe(dash);
})();


/* ---------------------------------------------------------------- hero: the green sentence changes every 6 s */
(function(){
  var rot = document.querySelector('.rot'); if (!rot) return;
  var items = Array.prototype.slice.call(rot.querySelectorAll('.rot-i'));
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || items.length < 2) return;
  items.forEach(function(it){
    var words = it.textContent.split(/\s+/).filter(Boolean); it.textContent = '';
    words.forEach(function(w, k){
      if (k) it.appendChild(document.createTextNode(' '));
      var o = document.createElement('span'); o.className = 'wd';
      var i = document.createElement('span'); i.textContent = w; i.style.transitionDelay = (k * 0.06) + 's';
      o.appendChild(i); it.appendChild(o);
    });
  });
  rot.classList.add('ready');
  // the first sentence rises with the rest of the headline
  items[0].classList.remove('on');
  setTimeout(function(){ items[0].classList.add('on'); }, 380);
  var cur = 0, timer = null;
  function next(){
    var a = items[cur], b = items[(cur + 1) % items.length];
    a.classList.remove('on'); a.classList.add('out');
    setTimeout(function(){ b.classList.remove('out'); b.classList.add('on'); }, 380);
    setTimeout(function(){ a.classList.remove('out'); }, 1300);
    cur = (cur + 1) % items.length;
  }
  function play(){ if (!timer) timer = setInterval(next, 6000); }
  function stop(){ clearInterval(timer); timer = null; }
  play();
  document.addEventListener('visibilitychange', function(){ document.hidden ? stop() : play(); });
  if ('IntersectionObserver' in window) new IntersectionObserver(function(es){ es[0].isIntersecting ? play() : stop(); }).observe(rot);
})();
