// SahelVoice site: remembers the chosen language so the switch stays consistent.
(function(){
  document.querySelectorAll('[data-setlang]').forEach(function(a){
    a.addEventListener('click', function(){
      try { localStorage.setItem('sv-lang', a.getAttribute('data-setlang')); } catch(e) {}
    });
  });
})();
