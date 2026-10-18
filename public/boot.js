// Arranque previo a React: idioma, fondo y "reducir movimiento" antes del primer pintado.
// Va como archivo (no inline) porque la CSP de vercel.json bloquea scripts en línea.
(function () {
  var d = document.documentElement;
  d.classList.add('neon');
  d.style.background = '#0B1F3A';
  try {
    var l = localStorage.getItem('geospeed_locale');
    if (!l) l = navigator.language && navigator.language.indexOf('en') === 0 ? 'en' : 'es';
    d.lang = l;
    var p = JSON.parse(localStorage.getItem('geospeed_prefs') || '{}');
    if (p.reduceMotion) d.classList.add('reduce-motion');
  } catch (e) { /* sin almacenamiento */ }

  // Red de seguridad: si la app no logra montarse en 12 s (error de carga), mostrar cómo recargar
  // en vez de dejar la pantalla azul vacía.
  setTimeout(function () {
    var root = document.getElementById('root');
    var fb = document.getElementById('boot-fallback');
    if (!root || !fb) return;
    var mounted = false;
    for (var i = 0; i < root.children.length; i++) {
      if (root.children[i].id !== 'boot-fallback') { mounted = true; break; }
    }
    if (!mounted) fb.style.display = 'flex';
  }, 12000);
})();
