// Arranque previo a React: idioma, fondo y "reducir movimiento" antes del primer pintado.
// Va como archivo (no inline) porque la CSP de vercel.json bloquea scripts en línea.
(function () {
  var d = document.documentElement;
  d.classList.add('neon');
  d.style.background = '#0B1F3A';
  // La pantalla de carga estática (index.html) solo en las rutas que la usan: las del juego, no /auth,
  // /privacy, /support, la TV de la sala… (mismas rutas con <Index> en App.tsx)
  if (/^\/($|daily(\/|$)|d\/|challenge\/|duel\/|reto\/|q\/|sala\/[^/]+\/?$|conquista(\/|$))/.test(location.pathname)) d.classList.add('has-splash');
  try {
    var l = localStorage.getItem('geospeed_locale');
    if (!l) l = navigator.language && navigator.language.indexOf('en') === 0 ? 'en' : 'es';
    d.lang = l;
    var p = JSON.parse(localStorage.getItem('geospeed_prefs') || '{}');
    if (p.reduceMotion) d.classList.add('reduce-motion');
  } catch (e) { /* sin almacenamiento */ }

  // El módulo de entrada (link[data-entry], ver deferEntry en vite.config.ts) se inserta después del primer
  // pintado, para que la pantalla de carga estática se vea antes de que React empiece a trabajar. Si la
  // pestaña está oculta no hay pintado que proteger: se inserta al terminar de analizar el HTML; y nunca
  // más tarde de 1 s. En desarrollo no hay data-entry (Vite inserta el módulo directamente).
  var injected = false;
  function injectEntry() {
    if (injected) return;
    var entry = document.querySelector('link[data-entry]');
    if (!entry) return;
    injected = true;
    var s = document.createElement('script');
    s.type = 'module';
    s.crossOrigin = 'anonymous';
    s.src = entry.href;
    document.head.appendChild(s);
  }
  if (document.visibilityState !== 'hidden' && typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(function () { requestAnimationFrame(injectEntry); });
  }
  document.addEventListener('DOMContentLoaded', injectEntry);
  setTimeout(injectEntry, 1000);

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
    if (!mounted) {
      var ss = document.getElementById('static-splash');
      if (ss) ss.remove();
      fb.style.display = 'flex';
    }
  }, 12000);
})();
