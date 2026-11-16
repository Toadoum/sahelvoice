// SahelVoice site: scroll reveal + animated AI console.
// Each page sets window.SV = { examples: [...], waiting: '...' } before loading this file.
(function(){
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cfg = window.SV || { examples: [], waiting: '' };

  // remember the chosen language (used only to keep the switch consistent)
  document.querySelectorAll('[data-setlang]').forEach(function(a){
    a.addEventListener('click', function(){
      try { localStorage.setItem('sv-lang', a.getAttribute('data-setlang')); } catch(e) {}
    });
  });

  // reveal on scroll
  var rv = document.querySelectorAll('.rv');
  if (reduce || !('IntersectionObserver' in window)) {
    rv.forEach(function(e){ e.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
    }, {rootMargin:'0px 0px -8% 0px'});
    rv.forEach(function(e){ io.observe(e); });
  }

  // journey timeline: line grows with scroll, steps light up
  var tl = document.querySelector('.tl');
  if (tl) {
    var steps = tl.querySelectorAll('.step');
    var tick = function(){
      var r = tl.getBoundingClientRect(), vh = window.innerHeight;
      var p = Math.min(1, Math.max(0, (vh * .7 - r.top) / r.height));
      tl.style.setProperty('--p', reduce ? 1 : p);
      steps.forEach(function(st){ if (reduce || st.getBoundingClientRect().top < vh * .72) st.classList.add('in'); });
    };
    window.addEventListener('scroll', tick, {passive:true}); window.addEventListener('resize', tick); tick();
  }

  // cursor spotlight on cards
  document.querySelectorAll('.ai-card,.lang,.feat > div,.aud article,.trust > div,.nowgrid article,.tier,.how article,.plan').forEach(function(el){
    el.addEventListener('pointermove', function(e){
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
    el.addEventListener('pointerleave', function(){ el.style.removeProperty('--mx'); el.style.removeProperty('--my'); });
  });

  // ticker: duplicate items so the loop is seamless
  document.querySelectorAll('.feed-track').forEach(function(tr){
    if (reduce) return;
    Array.prototype.slice.call(tr.children).forEach(function(c){
      var k = c.cloneNode(true); k.setAttribute('aria-hidden', 'true'); tr.appendChild(k);
    });
  });

  // language wave bars
  document.querySelectorAll('.lw').forEach(function(lw){
    [40,70,100,55,85,35,65,90,50,75,30,60].forEach(function(h,i){
      var b = document.createElement('b'); b.style.height = h + '%'; b.style.animationDelay = (i * .07) + 's'; lw.appendChild(b);
    });
  });


  // headline: each word rises like a voice level (variable font weight and width), once
  var h1 = document.querySelector('.hero h1');
  if (h1 && !reduce) {
    var i = 0;
    (function split(node){
      Array.prototype.slice.call(node.childNodes).forEach(function(n){
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function(part){
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var w = document.createElement('span'); w.className = 'w'; w.style.setProperty('--i', i++);
            w.textContent = part; frag.appendChild(w);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) split(n);
      });
    })(h1);
    var paint = function(){                       // one gradient running through the highlighted words, line after line
      var ws = h1.querySelectorAll('.hl .w'), total = 0, gap = 12, at = [];
      ws.forEach(function(w){ at.push(total); total += w.offsetWidth + gap; });
      ws.forEach(function(w, k){ w.style.setProperty('--bw', total + 'px'); w.style.setProperty('--bx', (-at[k]) + 'px'); });
    };
    paint(); window.addEventListener('resize', paint);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(paint);
    setTimeout(paint, 1400);
  }

  // dot fields: a grid of dots that ripples like sound (follows the pointer too), or an equaliser
  document.querySelectorAll('canvas.dotfield').forEach(function(cv){
    var ctx = cv.getContext('2d'); if (!ctx) return;
    var mode = cv.getAttribute('data-mode') || 'ripple';
    var host = cv.parentElement, w = 0, h = 0, dpr = Math.min(1.5, window.devicePixelRatio || 1);
    var on = false, last = 0, t0 = performance.now(), ptr = {x: -1, y: -1, at: -1e9};
    var GAP = mode === 'eq' ? 18 : 26;
    function size(){
      var r = host.getBoundingClientRect(); w = r.width; h = r.height;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function col(u, a){                          // green on the left, violet on the right
      var r = Math.round(61 + (143 - 61) * u), g = Math.round(220 + (156 - 220) * u), b = Math.round(151 + (255 - 151) * u);
      return 'rgba(' + r + ',' + g + ',' + b + ',' + a.toFixed(3) + ')';
    }
    function ripple(t){
      var S = [
        {x: w * (.5 + .36 * Math.sin(t * .11)), y: h * (.5 + .3 * Math.cos(t * .14)), k: 1},
        {x: w * (.5 + .4 * Math.cos(t * .07 + 2)), y: h * (.5 + .34 * Math.sin(t * .09 + 1)), k: .8}
      ];
      var age = (performance.now() - ptr.at) / 1000;
      if (age < 3) S.push({x: ptr.x, y: ptr.y, k: 1.3 * (1 - age / 3)});
      var R = Math.max(w, h) * .45;
      for (var y = GAP / 2; y < h; y += GAP) for (var x = GAP / 2; x < w; x += GAP) {
        var v = 0;
        for (var j = 0; j < S.length; j++) {
          var dx = x - S[j].x, dy = y - S[j].y, d = Math.sqrt(dx * dx + dy * dy);
          var wave = .5 + .5 * Math.sin(d * .05 - t * 2.4 + j * 1.7);
          v += S[j].k * Math.pow(wave, 6) * Math.exp(-d / R);
        }
        v = Math.min(1, v);
        ctx.beginPath(); ctx.arc(x, y, .7 + 2.1 * v, 0, 6.283);
        ctx.fillStyle = col(x / w, .12 + .6 * v); ctx.fill();
      }
    }
    function eq(t){
      var cols = Math.ceil(w / GAP), rows = Math.ceil(h / GAP);
      for (var c = 0; c < cols; c++) {
        var x = c * GAP + GAP / 2;
        var lv = (.5 + .5 * Math.sin(c * .31 + t * 1.3)) * (.55 + .45 * Math.sin(c * .09 - t * .6)) + .15 * Math.sin(c * 1.7 + t * 3.1);
        var lit = Math.max(1, Math.round(rows * .55 * Math.max(0, lv)));
        for (var r = 0; r < rows; r++) {
          var y = h - (r * GAP + GAP / 2), up = r < lit;
          ctx.beginPath(); ctx.arc(x, y, up ? 2 : 1, 0, 6.283);
          ctx.fillStyle = col(c / cols, up ? .55 - .35 * (r / lit) : .06); ctx.fill();
        }
      }
    }
    function draw(t){ ctx.clearRect(0, 0, w, h); (mode === 'eq' ? eq : ripple)(t); }
    size(); draw(3);
    if (window.ResizeObserver) new ResizeObserver(function(){ size(); draw((performance.now() - t0) / 1000); }).observe(host);
    if (reduce) return;
    host.addEventListener('pointermove', function(e){
      var r = host.getBoundingClientRect(); ptr = {x: e.clientX - r.left, y: e.clientY - r.top, at: performance.now()};
    }, {passive: true});
    if ('IntersectionObserver' in window) new IntersectionObserver(function(es){ on = es[0].isIntersecting; }).observe(host);
    else on = true;
    (function loop(now){
      if (on && !document.hidden && now - last > 33) { last = now; draw((now - t0) / 1000); }
      requestAnimationFrame(loop);
    })(performance.now());
  });

  // animated voice-wave background
  document.querySelectorAll('canvas.wavefield').forEach(function(cv){
    var ctx = cv.getContext('2d'); if (!ctx) return;
    var w = 0, h = 0, dpr = Math.min(2, window.devicePixelRatio || 1), on = true, t0 = performance.now();
    var base = parseFloat(cv.getAttribute('data-y') || '.72');
    var L = [
      {a:42, f:.0085, s:.55,  p:0,   c:'61,220,151',  o:.55, dy:0},
      {a:30, f:.013,  s:-.42, p:1.3, c:'143,156,255', o:.45, dy:.02},
      {a:58, f:.006,  s:.28,  p:2.1, c:'61,220,151',  o:.20, dy:-.02},
      {a:22, f:.019,  s:.75,  p:.7,  c:'168,240,207', o:.28, dy:.04},
      {a:48, f:.0075, s:-.22, p:3.3, c:'143,156,255', o:.18, dy:-.04}
    ];
    var P = [];
    for (var i = 0; i < 42; i++) P.push({x:Math.random(), y:Math.random(), r:Math.random()*1.5+.4, v:Math.random()*.018+.004, o:Math.random()*.35+.1});
    function size(){
      var r = cv.getBoundingClientRect(); w = r.width; h = r.height;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); ctx.setTransform(dpr,0,0,dpr,0,0);
    }
    function draw(t){
      ctx.clearRect(0,0,w,h);
      for (var j = 0; j < L.length; j++){
        var l = L[j]; ctx.beginPath();
        for (var x = 0; x <= w + 4; x += 4){
          var u = x / w;
          var env = Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, u))), 1.4) * (.55 + .45 * Math.sin(t * .7 + u * 6 + l.p));
          var y = h * (base + l.dy) + Math.sin(x * l.f + t * l.s * 2 + l.p) * l.a * env + Math.sin(x * l.f * 2.3 - t * l.s * 1.3) * l.a * .35 * env;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = 'rgba(' + l.c + ',' + l.o + ')'; ctx.lineWidth = 1.4; ctx.stroke();
      }
      for (var k = 0; k < P.length; k++){
        var p = P[k], py = ((p.y - t * p.v) % 1 + 1) % 1;
        ctx.beginPath(); ctx.arc(p.x * w, py * h, p.r, 0, 6.283);
        ctx.fillStyle = 'rgba(190,240,215,' + (p.o * Math.sin(Math.PI * py)) + ')'; ctx.fill();
      }
    }
    size(); draw(1.5);
    if (window.ResizeObserver) new ResizeObserver(function(){ size(); draw(reduce ? 2 : (performance.now() - t0) / 1000); }).observe(cv);
    if (reduce) { draw(2); return; }
    if ('IntersectionObserver' in window) new IntersectionObserver(function(es){ on = es[0].isIntersecting; }).observe(cv);
    (function loop(now){
      if (on && !document.hidden) draw((now - t0) / 1000);
      requestAnimationFrame(loop);
    })(performance.now());
  });

  // waveform bars
  var wave = document.getElementById('wave');
  if (!wave) return;
  [30,55,80,45,95,60,35,70,100,50,75,40,65,85,45,30,55,35].forEach(function(h,i){
    var b = document.createElement('b');
    b.style.height = h + '%';
    b.style.animationDelay = (i * 0.06) + 's';
    wave.appendChild(b);
  });

  var stages = document.querySelectorAll('.stage');
  var prog = document.querySelectorAll('.prog i');
  if (reduce || !cfg.examples.length) { stages.forEach(function(s){ s.classList.add('done'); }); return; }

  var EX = cfg.examples;
  var $ = function(id){ return document.getElementById(id); };
  var tr = $('c-tr'), gl = $('c-gl'), rows = $('c-rows');
  var visible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function(es){ visible = es[0].isIntersecting; }).observe($('console'));
  }
  function sleep(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }
  async function waitVisible(){ while(!visible || document.hidden){ await sleep(300); } }
  function setStage(k){
    stages.forEach(function(s,i){ s.classList.toggle('on', i===k); s.classList.toggle('done', i<k); });
    prog.forEach(function(p,i){ p.classList.toggle('on', i<=k); });
  }
  function esc(s){ return s.replace(/[&<>]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c]; }); }

  async function typeTranscript(ex){
    var full = ex.before + ex.key + ex.after, out = '';
    for (var i = 0; i < full.length; i++){
      out += full[i];
      tr.innerHTML = '« ' + esc(out) + '<span class="caret"></span>';
      await sleep(42);
    }
    tr.innerHTML = '« ' + esc(ex.before) + '<span class="kw">' + esc(ex.key) + '</span>' + esc(ex.after) + ' »';
    if (gl && ex.gloss) gl.textContent = ex.gloss;
  }

  async function run(){
    var k = 0;
    rows.innerHTML = '';
    while (true){
      var ex = EX[k % EX.length];
      await waitVisible();
      $('c-n').textContent = ex.n; $('c-q').textContent = ex.q; $('c-dur').textContent = ex.dur;
      tr.innerHTML = '<span class="caret"></span>';
      if (gl) gl.textContent = '';
      $('c-field').textContent = ex.field; $('c-type').textContent = ex.type; $('c-val').textContent = '…';
      $('c-chk').innerHTML = '<span style="color:var(--dim)">' + esc(cfg.waiting) + '</span>';
      setStage(0); await sleep(1800);
      setStage(1); await typeTranscript(ex); await sleep(gl ? 900 : 500);
      setStage(2);
      var kw = tr.querySelector('.kw'); if (kw){ kw.outerHTML = '<mark>' + esc(ex.key) + '</mark>'; }
      await sleep(700); $('c-val').textContent = ex.val; await sleep(1100);
      setStage(3); $('c-chk').innerHTML = ex.chk; await sleep(1700);
      setStage(4);
      var trEl = document.createElement('tr'); trEl.className = 'new';
      trEl.innerHTML = ex.row.map(function(c){ return '<td>' + esc(c) + '</td>'; }).join('');
      rows.insertBefore(trEl, rows.firstChild);
      while (rows.children.length > 3) rows.removeChild(rows.lastChild);
      await sleep(2600);
      k++;
    }
  }
  run();
})();
