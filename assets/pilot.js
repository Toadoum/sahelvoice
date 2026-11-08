// Pilot request form: builds a structured message and opens WhatsApp or the mail app.
// No server: nothing is stored on the website.
(function(){
  var f = document.getElementById('pform');
  if (!f) return;
  var L = JSON.parse(f.getAttribute('data-l'));
  var WA = '23566049094', MAIL = 'contact@sahelvoice.app';
  var err = f.querySelector('.err');
  function val(name){
    var els = f.querySelectorAll('[name="' + name + '"]');
    if (els.length > 1 || (els[0] && els[0].type === 'checkbox')) {
      return Array.prototype.filter.call(els, function(e){ return e.checked; }).map(function(e){ return e.value; }).join(', ');
    }
    return els[0] ? els[0].value.trim() : '';
  }
  function check(){
    var bad = null;
    f.querySelectorAll('[required]').forEach(function(el){
      var ok = el.type === 'checkbox' ? el.checked : el.value.trim() !== '';
      if (el.name === 'email' && el.value.trim() && !/^\S+@\S+\.\S+$/.test(el.value.trim())) ok = false;
      el.setAttribute('aria-invalid', ok ? 'false' : 'true');
      if (!ok && !bad) bad = el;
    });
    if (!val('phone') && !val('email')) {
      bad = bad || f.querySelector('[name="phone"]');
      f.querySelector('[name="phone"]').setAttribute('aria-invalid', 'true');
    }
    err.textContent = bad ? L.missing : '';
    if (bad) bad.focus();
    return !bad;
  }
  function message(){
    var lines = [L.title, ''];
    L.fields.forEach(function(k){
      var v = val(k[0]);
      if (v) lines.push(k[1] + ' : ' + v);
    });
    return lines.join('\n');
  }
  f.addEventListener('input', function(e){ if (e.target.getAttribute('aria-invalid') === 'true') e.target.setAttribute('aria-invalid', 'false'); });
  f.querySelector('.wa').addEventListener('click', function(){
    if (!check()) return;
    window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(message()), '_blank', 'noopener');
  });
  f.querySelector('.mail').addEventListener('click', function(){
    if (!check()) return;
    var org = val('org');
    location.href = 'mailto:' + MAIL + '?subject=' + encodeURIComponent(L.subject + (org ? ' - ' + org : '')) + '&body=' + encodeURIComponent(message());
  });
})();
