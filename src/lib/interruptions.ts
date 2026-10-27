/**
 * Reglas comunes para las ventanas que el juego abre sin que el jugador las pida
 * (cofre diario, permiso de notificaciones, mensajes de compras…). Acordadas con JuanJo el 2026-10-19:
 *
 *  1. Nunca durante la carga, la cuenta regresiva ni la partida: lo que llegue en ese momento espera.
 *  2. Una sola ventana por visita al inicio: si ya salió una (p. ej. el cofre), las demás esperan a la
 *     próxima vez que el jugador vuelva al inicio.
 *
 * El estado vive en el módulo (no en React) para que HomeScreen e Index lo compartan sin props.
 */

/** Fases en las que no se interrumpe al jugador (ver Index.tsx `Phase`). */
export const BUSY_PHASES = new Set<string>([
  'splash', 'countdown', 'playing', 'daily', 'tutorial',
  'ta-playing', 'wc-playing', 'mp-playing', 'mp-waiting', 'mp-spectate', 'room', 'conq-practice',
]);

export const isBusyPhase = (phase: string) => BUSY_PHASES.has(phase);

let shownThisHomeVisit = false;

/** Al salir del inicio: la próxima visita puede volver a mostrar una ventana. */
export function resetHomeVisit(): void { shownThisHomeVisit = false; }

/** Una ventana ya ocupó esta visita al inicio. */
export function markHomeInterruption(): void { shownThisHomeVisit = true; }

/** ¿Ya se mostró una ventana en esta visita al inicio? */
export function homeInterruptionShown(): boolean { return shownThisHomeVisit; }

/** Fecha local AAAA-MM-DD (el "día" del jugador es el de su reloj, no el de Londres). */
export function localDate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
