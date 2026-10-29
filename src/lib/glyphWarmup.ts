/**
 * Precalienta los emojis del Inicio mientras se ve la pantalla de carga.
 *
 * Causa: la primera vez que el navegador maqueta cada combinación (emoji, tamaño, grosor) tiene que
 * resolver la fuente de emojis y preparar el glifo. El Inicio usa unas 24 combinaciones y esa primera
 * maquetación costaba ~90 ms en un computador (varias veces más en un celular) justo cuando aparece el
 * Inicio: era la parte más grande de su tarea de montaje. Aquí se maquetan antes, en un contenedor
 * invisible y en ratos libres del navegador, para que después el Inicio aparezca sin ese costo.
 *
 * Las clases son las mismas que usan los componentes (EnergyBar, StreakChip, HomeScreen, SprintHomeCard).
 * Si cambian allá, aquí solo se pierde el ahorro; en desarrollo, checkGlyphCoverage avisa en consola de los
 * emojis del Inicio que falten en esta lista.
 */
const HOME_GLYPHS: [glyph: string, classes: string][] = [
  // Encabezado del celular: fichas de vidas y de racha
  ['❤️', 'text-sm font-extrabold'],
  ['🔥', 'text-sm font-extrabold'],
  // Banner "¿Cómo se juega?" y sus tres pasos
  ['📖', 'text-lg sm:text-2xl lg:text-3xl font-extrabold'],
  ['📘', 'text-base sm:text-xl'],
  ['👆', 'text-base sm:text-xl'],
  ['⭐', 'text-base sm:text-xl'],
  // Selectores de la aventura (categoría · región · dificultad); los de la selección por defecto
  ['🏙️', 'text-base sm:text-xl lg:text-2xl'],
  ['🌍', 'text-base sm:text-xl lg:text-2xl'],
  ['🎒', 'text-base sm:text-xl lg:text-2xl'],
  ['🚩', 'text-base sm:text-xl lg:text-2xl'],
  // Tarjetas de acceso y el enlace del diario
  ['📅', 'text-[1.7rem] sm:text-[2.5rem]'],
  ['📋', 'text-[1.7rem] sm:text-[2.5rem]'],
  ['🎯', 'text-[1.7rem] sm:text-[2.5rem]'],
  ['⚡', 'text-[1.7rem] sm:text-[2.5rem]'],
  ['🔗', 'text-xs'],
  // Tarjeta de Sprint
  ['⚡', 'text-3xl sm:text-4xl'],
  ['⚡', 'text-lg font-black'],
  ['⚡', 'text-sm font-black'],
  ['🔒', 'text-xs sm:text-sm'],
  // Franja de nivel (nivel 1 · estadísticas de computador · ranking / historial / invitar)
  ['🌱', 'text-xl sm:text-2xl'],
  ['🎮', 'text-xl'],
  ['🏆', 'text-xl'],
  ['📍', 'text-xl'],
  ['🏆', 'text-lg lg:text-base'],
  ['📊', 'text-lg lg:text-base'],
  ['🎁', 'text-lg lg:text-base'],
  // Repaso del día y aviso sin conexión (cuando aparecen)
  ['🧠', 'text-2xl sm:text-3xl'],
  ['📡', 'text-xs'],
];

type IdleWindow = Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number };

let started = false;

/**
 * Maqueta un glifo por rato libre (o por cuadro si el navegador no tiene requestIdleCallback). Uno solo:
 * cada glifo cuesta 2–13 ms y en tandas más largas aparecían tareas de ~40 ms que, multiplicadas por 4 en
 * la simulación de Lighthouse, cuentan como bloqueo del hilo principal.
 */
export function warmUpHomeGlyphs(): void {
  if (started || typeof document === 'undefined') return;
  started = true;
  const box = document.createElement('div');
  box.setAttribute('aria-hidden', 'true');
  box.style.cssText = 'position:absolute;left:-9999px;top:0;width:320px;visibility:hidden;pointer-events:none';
  document.body.appendChild(box);
  const queue = HOME_GLYPHS.slice();
  const ric = (window as IdleWindow).requestIdleCallback;

  const step = () => {
    const next = queue.shift();
    if (!next) { box.remove(); return; }
    const [glyph, classes] = next;
    const span = document.createElement('span');
    span.className = classes;
    span.textContent = glyph;
    box.appendChild(span);
    void span.offsetWidth; // fuerza la maquetación: aquí el navegador resuelve la fuente y prepara el glifo
    schedule();
  };
  const schedule = () => {
    if (ric) ric(step, { timeout: 500 });
    else requestAnimationFrame(step);
  };
  schedule();
}

/** Solo en desarrollo: avisa de los emojis que el Inicio muestra y esta lista no precalienta. */
export function checkGlyphCoverage(): void {
  if (!import.meta.env.DEV || typeof document === 'undefined') return;
  const known = new Set(HOME_GLYPHS.map(([g]) => g));
  const missing = new Set<string>();
  const root = document.querySelector('main') ?? document.body;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    for (const m of (node.textContent ?? '').matchAll(/\p{Extended_Pictographic}️?/gu)) {
      if (!known.has(m[0])) missing.add(m[0]);
    }
  }
  if (missing.size) console.info('[glyphWarmup] emojis del Inicio sin precalentar (agregarlos a HOME_GLYPHS):', [...missing].join(' '));
}
