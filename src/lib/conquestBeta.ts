/**
 * Conquista el mapa antes de abrirla a todos (interruptor remoto `conquest_enabled` apagado): `?conquista=beta` en la
 * URL la activa en este teléfono para probarla con el grupo de prueba; `?conquista=off` la quita. Módulo aparte y mínimo
 * porque lo lee el inicio.
 * C7: también se activa sola en el teléfono que crea un grupo, entra a uno o ya pertenece a alguno. Así el grupo de
 * prueba la ve en la app instalada (en el iPhone la app de inicio no comparte datos con Safari y no tiene barra de
 * direcciones): basta escribir el código del grupo en "Jugar con amigos".
 */
const BETA_KEY = 'geospeed_conquest_beta';

export function noteConquestBetaParam(search: string): void {
  const v = new URLSearchParams(search).get('conquista');
  try {
    if (v === 'beta') localStorage.setItem(BETA_KEY, '1');
    else if (v === 'off') localStorage.removeItem(BETA_KEY);
  } catch { /* sin almacenamiento */ }
}

export function enableConquestBeta(): void {
  try { localStorage.setItem(BETA_KEY, '1'); } catch { /* sin almacenamiento */ }
}

export function conquestBetaOn(): boolean {
  try { return localStorage.getItem(BETA_KEY) === '1'; } catch { return false; }
}
