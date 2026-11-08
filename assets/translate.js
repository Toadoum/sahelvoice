// Live French -> Ngambay translation on sahelvoice.app.
// Calls the Gradio API of the Hugging Face Space Toadoum/ngambay-french-c2translate
// (model Toadoum/ngambay-fr-v1), function translate_text_simple(text).
(function(){
  var root = document.getElementById('trx');
  if (!root) return;
  var BASE = 'https://toadoum-ngambay-french-c2translate.hf.space';
  var FN = 'translate_text_simple';
  var L = JSON.parse(root.getAttribute('data-l'));
  var ta = root.querySelector('textarea'), out = root.querySelector('.trx-out'),
      btn = root.querySelector('.trx-run'), st = root.querySelector('.trx-status'),
      copy = root.querySelector('.trx-copy'), count = root.querySelector('.trx-count');

  function setStatus(t, err){ st.textContent = t || ''; st.classList.toggle('err', !!err); }
  function upd(){ count.textContent = ta.value.length + ' / ' + ta.maxLength; }
  ta.addEventListener('input', upd); upd();

  function parseSSE(body){
    var blocks = body.split(/\n\n/), result = null, error = null;
    blocks.forEach(function(b){
      var ev = (b.match(/^event:\s*(.+)$/m) || [])[1], data = (b.match(/^data:\s*([\s\S]*)$/m) || [])[1];
      if (ev === 'complete' && data) { try { result = JSON.parse(data); } catch(e){} }
      if (ev === 'error') error = data || 'error';
    });
    if (error) throw new Error(error);
    if (!result) throw new Error('no result');
    var v = Array.isArray(result) ? result[0] : result;
    return typeof v === 'string' ? v : JSON.stringify(v);
  }

  async function call(text, signal){
    var last;
    for (var p of ['/gradio_api/call/', '/call/']){
      try {
        var r = await fetch(BASE + p + FN, {method:'POST', headers:{'Content-Type':'application/json'},
                                            body: JSON.stringify({data:[text]}), signal: signal});
        if (!r.ok) { last = new Error('HTTP ' + r.status); continue; }
        var id = (await r.json()).event_id;
        var s = await fetch(BASE + p + FN + '/' + id, {signal: signal});
        return parseSSE(await s.text());
      } catch (e) { if (e.name === 'AbortError') throw e; last = e; }
    }
    throw last || new Error('unreachable');
  }

  async function run(){
    var text = ta.value.trim();
    if (!text) { ta.focus(); return; }
    btn.disabled = true; copy.hidden = true;
    out.classList.remove('empty');
    out.innerHTML = '<span class="shimmer" style="width:92%"></span><span class="shimmer" style="width:78%"></span><span class="shimmer" style="width:55%"></span>';
    setStatus(L.working);
    var slow = setTimeout(function(){ setStatus(L.waking); }, 7000);
    var ctl = new AbortController(), kill = setTimeout(function(){ ctl.abort(); }, 150000);
    try {
      var res = await call(text, ctl.signal);
      out.textContent = res.replace(/^\s*-\s*/, '');
      copy.hidden = false;
      setStatus(L.done);
    } catch (e) {
      out.classList.add('empty'); out.textContent = L.placeholder;
      setStatus(L.error, true);
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
})();
