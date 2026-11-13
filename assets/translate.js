// French -> Ngambay translation on sahelvoice.app, with the SahelVoice server
// (app.sahelvoice.app), where the model Toadoum/ngambay-fr-v1 runs.
// Texts are translated and not kept. A document is kept in memory until it is
// downloaded once, or for one hour at most.
(function(){
  var root = document.getElementById('trx');
  if (!root) return;
  var BASE = 'https://app.sahelvoice.app';
  var L = JSON.parse(root.getAttribute('data-l'));
  var EN = (document.documentElement.lang || 'fr').indexOf('en') === 0;
  function fmt(s, o){ return s.replace(/\{(\w+)\}/g, function(_, k){ return o[k]; }); }

  // ---------- tabs ----------
  var tabs = root.querySelectorAll('[role=tab]');
  function show(tab){
    tabs.forEach(function(t){
      var on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
  }
  tabs.forEach(function(t, i){
    t.addEventListener('click', function(){ show(t); });
    t.addEventListener('keydown', function(e){
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      show(n); n.focus(); e.preventDefault();
    });
  });

  // ---------- text ----------
  var ta = root.querySelector('textarea'), out = root.querySelector('.trx-out'),
      btn = root.querySelector('.trx-run'), st = root.querySelector('.trx-status'),
      copy = root.querySelector('.trx-copy'), count = root.querySelector('.trx-count');
  function setStatus(el, t, err){ el.textContent = t || ''; el.classList.toggle('err', !!err); }
  function upd(){ count.textContent = ta.value.length + ' / ' + ta.maxLength; }
  ta.addEventListener('input', upd); upd();

  async function run(){
    var text = ta.value.trim();
    if (!text) { ta.focus(); return; }
    btn.disabled = true; copy.hidden = true;
    out.classList.remove('empty');
    out.innerHTML = '<span class="shimmer" style="width:92%"></span><span class="shimmer" style="width:78%"></span><span class="shimmer" style="width:55%"></span>';
    setStatus(st, L.working);
    var slow = setTimeout(function(){ setStatus(st, L.waking); }, 9000);
    var ctl = new AbortController(), kill = setTimeout(function(){ ctl.abort(); }, 60000);
    try {
      var r = await fetch(BASE + '/api/traduire', {method: 'POST', body: new URLSearchParams({text: text}), signal: ctl.signal});
      var d = await r.json().catch(function(){ return {}; });
      if (!r.ok || !d.translation) throw new Error(d.error || ('HTTP ' + r.status));
      out.textContent = d.translation.replace(/^\s*-\s*/, '');
      copy.hidden = false;
      setStatus(st, L.done);
    } catch (e) {
      out.classList.add('empty'); out.textContent = L.placeholder;
      setStatus(st, L.error, true);
    } finally {
      clearTimeout(slow); clearTimeout(kill); btn.disabled = false;
    }
  }
  btn.addEventListener('click', run);
  ta.addEventListener('keydown', function(e){ if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') run(); });
  root.querySelectorAll('.trx-ex button').forEach(function(b){
    b.addEventListener('click', function(){ ta.value = b.textContent; upd(); run(); });
  });
  copy.addEventListener('click', function(){
    try { navigator.clipboard.writeText(out.textContent); copy.textContent = L.copied;
          setTimeout(function(){ copy.textContent = L.copy; }, 1500); } catch(e) {}
  });

  // ---------- document ----------
  var file = root.querySelector('#doc-file');
  if (!file) return;
  var drop = root.querySelector('.drop'), dropT = root.querySelector('.drop-t'), dropN = root.querySelector('.drop-n'),
      bi = root.querySelector('#doc-bi'), go = root.querySelector('.doc-run'), dl = root.querySelector('.doc-dl'),
      ds = root.querySelector('.doc-status'), bar = root.querySelector('.doc-bar'), fill = bar.querySelector('i');
  var dropT0 = dropT.textContent, dropN0 = dropN.textContent, busy = false;
  var OK = /\.(docx|pdf|txt)$/i, MAX = 3 * 1024 * 1024;

  function picked(){
    var f = file.files[0];
    dl.hidden = true; bar.hidden = true;
    if (!f) { drop.classList.remove('has'); dropT.textContent = dropT0; dropN.textContent = dropN0; setStatus(ds, ''); return; }
    drop.classList.add('has'); dropT.textContent = f.name;
    dropN.textContent = (f.size / 1024 < 1024 ? Math.max(1, Math.round(f.size / 1024)) + ' Ko' : (f.size / 1048576).toFixed(1) + ' Mo').replace('Ko', EN ? 'KB' : 'Ko').replace('Mo', EN ? 'MB' : 'Mo');
    if (!OK.test(f.name)) setStatus(ds, L.pick, true);
    else if (f.size > MAX) setStatus(ds, L.toobig, true);
    else setStatus(ds, '');
  }
  file.addEventListener('change', picked);
  ['dragenter', 'dragover'].forEach(function(ev){ drop.addEventListener(ev, function(){ drop.classList.add('over'); }); });
  ['dragleave', 'drop'].forEach(function(ev){ drop.addEventListener(ev, function(){ drop.classList.remove('over'); }); });

  function serverError(status, msg){
    if (!EN) return msg || L.error;
    if (status === 429) return 'You translated several documents recently. Try again in an hour.';
    if (status === 400) return 'This file cannot be translated. Send a .docx, .pdf or .txt file with text in it, under 3 MB and about 3 pages.';
    return L.error;
  }
  function sleep(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }

  async function translateDoc(){
    var f = file.files[0];
    if (!f || !OK.test(f.name)) { setStatus(ds, L.pick, true); file.focus(); return; }
    if (f.size > MAX) { setStatus(ds, L.toobig, true); return; }
    if (busy) return;
    busy = true; go.disabled = true; dl.hidden = true; bar.hidden = false; fill.style.width = '3%';
    setStatus(ds, L.sending);
    try {
      var fd = new FormData(); fd.append('file', f, f.name); fd.append('bilingual', bi.checked ? '1' : '0');
      var r = await fetch(BASE + '/api/traduire-document', {method: 'POST', body: fd});
      var d = await r.json().catch(function(){ return {}; });
      if (!r.ok || !d.job) throw {status: r.status, msg: d.error};
      var id = d.job, started = Date.now();
      while (true) {
        await sleep(1500);
        var s = await fetch(BASE + '/api/traduire-document/' + encodeURIComponent(id), {cache: 'no-store'});
        var j = await s.json().catch(function(){ return {}; });
        if (s.status === 404) throw {status: 404, msg: L.lost};
        if (!s.ok) throw {status: s.status, msg: j.error};
        if (j.status === 'error') throw {status: 400, msg: j.error};
        if (j.status === 'queued') { setStatus(ds, fmt(L.queued, {n: j.position || 1})); }
        if (j.status === 'working') {
          var pct = j.total ? Math.round(100 * j.done / j.total) : 5;
          fill.style.width = Math.max(5, pct) + '%';
          setStatus(ds, fmt(L.progress, {d: j.done, t: j.total}));
        }
        if (j.status === 'done') break;
        if (Date.now() - started > 15 * 60 * 1000) throw {status: 0};
      }
      fill.style.width = '100%';
      dl.href = BASE + '/api/traduire-document/' + encodeURIComponent(id) + '/fichier';
      dl.hidden = false; dl.focus();
      setStatus(ds, L.ready);
    } catch (e) {
      bar.hidden = true;
      setStatus(ds, e && e.status === 404 ? L.lost : serverError(e && e.status, e && e.msg), true);
    } finally {
      busy = false; go.disabled = false;
    }
  }
  go.addEventListener('click', translateDoc);
  dl.addEventListener('click', function(){
    setTimeout(function(){ dl.hidden = true; bar.hidden = true; setStatus(ds, L.taken); }, 400);
  });
})();
