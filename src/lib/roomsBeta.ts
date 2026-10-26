/**
 * Sala en vivo antes de abrirla a todos (interruptor remoto `live_rooms_enabled` apagado): `?salas=beta` en la URL la
 * activa en este teléfono para probarla; `?salas=off` la quita. Módulo aparte y mínimo porque lo lee el inicio.
 */
const BETA_KEY = 'geospeed_rooms_beta';

export function noteRoomsBetaParam(search: string): void {
  const v = new URLSearchParams(search).get('salas');
  try {
    if (v === 'beta') localStorage.setItem(BETA_KEY, '1');
    else if (v === 'off') localStorage.removeItem(BETA_KEY);
  } catch { /* sin almacenamiento */ }
}

export function roomsBetaOn(): boolean {
  try { return localStorage.getItem(BETA_KEY) === '1'; } catch { return false; }
}
