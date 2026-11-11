// Live French -> Ngambay translation on sahelvoice.app.
// Calls the SahelVoice server (app.sahelvoice.app/api/traduire), where the model
// Toadoum/ngambay-fr-v1 runs. The text is translated and not stored.
(function(){
  var root = document.getElementById('trx');
  if (!root) return;
  var API = 'https://app.sahelvoice.app/api/traduire';
  var L = JSON.parse(root.getAttribute('data-l'));
  var ta = root.querySelector('textarea'), out = root.querySelector('.trx-out'),
      btn = root.querySelector('.trx-run'), st = root.querySelector('.trx-status'),
      copy = root.querySelector('.trx-copy'), count = root.querySelector('.trx-count');

  function setStatus(t, err){ st.textContent = t || ''; st.classList.toggle('err', !!err); }
  function upd(){ count.textContent = ta.value.length + ' / ' + ta.maxLength; }
  ta.addEventListener('input', upd); upd();

  async function call(text, signal){
    var r = await fetch(API, {method: 'POST', body: new URLSearchParams({text: text}), signal: signal});
    var d = await r.json().catch(function(){ return {}; });
    if (!r.ok || !d.translation) throw new Error(d.error || ('HTTP ' + r.status));
    return d.translation;
  }

  async function run(){
    var text = ta.value.trim();
    if (!text) { ta.focus(); return; }
    btn.disabled = true; copy.hidden = true;
    out.classList.remove('empty');
    out.innerHTML = '<span class="shimmer" style="width:92%"></span><span class="shimmer" style="width:78%"></span><span class="shimmer" style="width:55%"></span>';
    setStatus(L.working);
    var slow = setTimeout(function(){ setStatus(L.waking); }, 9000);
    var ctl = new AbortController(), kill = setTimeout(function(){ ctl.abort(); }, 60000);
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
