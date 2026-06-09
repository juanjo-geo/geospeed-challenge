const STORAGE_KEY = 'geospeed_energy';
const MAX_REGEN_LIVES = 5;          // Tope SOLO de las vidas que se regeneran solas
const REGEN_MINUTES = 20;           // Una vida se regenera cada 20 minutos

interface EnergyState {
  lives: number;                    // Vidas que se regeneran (0..MAX_REGEN_LIVES)
  bonusLives?: number;              // Vidas compradas/regaladas — SIN tope, no se regeneran
  lastRegenTimestamp: number;       // ms
}

function getState(): EnergyState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { lives: MAX_REGEN_LIVES, bonusLives: 0, lastRegenTimestamp: Date.now() };
  }
  const parsed = JSON.parse(raw) as EnergyState;
  if (parsed.bonusLives == null) parsed.bonusLives = 0; // migración de estados viejos
  return parsed;
}

function saveState(state: EnergyState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/**
 * Aplica regeneración pasiva y devuelve el estado actual.
 * `lives` es el TOTAL jugable (regenerables + compradas).
 * `maxLives` es el tope de las regenerables (para la UI de regeneración).
 * `bonusLives` son las compradas (sin tope).
 */
export function getEnergy(): {
  lives: number;          // total = regenLives + bonusLives
  regenLives: number;     // solo las que se regeneran (0..5)
  bonusLives: number;     // solo las compradas
  maxLives: number;       // tope de regeneración (5)
  nextRegenMs: number;
} {
  const state = getState();
  const now = Date.now();
  const elapsed = now - state.lastRegenTimestamp;
  const regenMs = REGEN_MINUTES * 60 * 1000;

  if (state.lives < MAX_REGEN_LIVES) {
    const livesRegened = Math.floor(elapsed / regenMs);
    if (livesRegened > 0) {
      state.lives = Math.min(MAX_REGEN_LIVES, state.lives + livesRegened);
      state.lastRegenTimestamp = state.lastRegenTimestamp + livesRegened * regenMs;
      saveState(state);
    }
  } else {
    state.lastRegenTimestamp = now;
    saveState(state);
  }

  const timeToNext = state.lives < MAX_REGEN_LIVES
    ? regenMs - (now - state.lastRegenTimestamp)
    : 0;

  const bonus = state.bonusLives ?? 0;
  return {
    lives: state.lives + bonus,
    regenLives: state.lives,
    bonusLives: bonus,
    maxLives: MAX_REGEN_LIVES,
    nextRegenMs: Math.max(0, timeToNext),
  };
}

/** Consume una vida. Devuelve false si no hay vidas. Gasta primero las compradas. */
export function consumeLife(): boolean {
  getEnergy(); // aplicar regen primero
  const state = getState();
  const bonus = state.bonusLives ?? 0;

  if (bonus > 0) {
    state.bonusLives = bonus - 1; // gastar primero las compradas (no tocan el timer de regen)
    saveState(state);
    return true;
  }

  if (state.lives <= 0) return false;

  const wasFull = state.lives >= MAX_REGEN_LIVES;
  state.lives -= 1;
  if (wasFull) {
    state.lastRegenTimestamp = Date.now(); // al bajar del tope, arrancar regeneración
  }
  saveState(state);
  return true;
}

/**
 * Añade vidas. Primero rellena las regenerables hasta 5; el resto va a "bonus" (sin tope).
 * Así una compra de 15 vidas con el medidor lleno suma 15 reales (no se pierden).
 */
export function addLives(count: number) {
  if (count <= 0) return;
  const state = getState();
  const roomInRegen = MAX_REGEN_LIVES - state.lives;
  const toRegen = Math.max(0, Math.min(roomInRegen, count));
  state.lives += toRegen;
  const remainder = count - toRegen;
  if (remainder > 0) {
    state.bonusLives = (state.bonusLives ?? 0) + remainder;
  }
  saveState(state);
}

export function formatRegenTime(ms: number): string {
  const totalSec = Math.ceil(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}
