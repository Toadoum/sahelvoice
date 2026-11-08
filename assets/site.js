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
