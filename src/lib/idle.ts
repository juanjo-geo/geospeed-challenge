// Trabajo que no debe competir con la primera pantalla (música, Google Analytics, service worker):
// en celulares con red lenta, descargarlo durante el arranque retrasaba varios segundos la pantalla
// de carga y el Inicio. Estas utilidades lo dejan para cuando la app ya abrió o el jugador ya tocó.

type IdleWindow = Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number };

/** Se resuelve después del evento load, `delayMs` más y un momento libre del navegador. */
export function afterAppLoad(delayMs: number): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') { resolve(); return; }
    const idle = () => {
      const ric = (window as IdleWindow).requestIdleCallback;
      if (ric) ric(() => resolve(), { timeout: 2000 });
      else resolve();
    };
    const arm = () => setTimeout(idle, delayMs);
    if (document.readyState === 'complete') arm();
    else window.addEventListener('load', arm, { once: true });
  });
}

/** Se resuelve con el primer toque, clic o tecla del jugador. */
export function firstInteraction(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') { resolve(); return; }
    const events = ['pointerdown', 'touchstart', 'keydown'] as const;
    const done = () => {
      events.forEach((e) => window.removeEventListener(e, done, true));
      resolve();
    };
    events.forEach((e) => window.addEventListener(e, done, { capture: true, passive: true }));
  });
}
