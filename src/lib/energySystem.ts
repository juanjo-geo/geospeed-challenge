const STORAGE_KEY = 'geospeed_energy';
const MAX_LIVES = 5;
const REGEN_MINUTES = 20; // One life regenerates every 20 minutes

interface EnergyState {
  lives: number;
  lastRegenTimestamp: number; // ms
}

function getState(): EnergyState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { lives: MAX_LIVES, lastRegenTimestamp: Date.now() };
  }
  return JSON.parse(raw) as EnergyState;
}

function saveState(state: EnergyState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/** Apply passive regeneration and return current state */
export function getEnergy(): { lives: number; maxLives: number; nextRegenMs: number } {
  const state = getState();
  const now = Date.now();
  const elapsed = now - state.lastRegenTimestamp;
  const regenMs = REGEN_MINUTES * 60 * 1000;

  if (state.lives < MAX_LIVES) {
    const livesRegened = Math.floor(elapsed / regenMs);
    if (livesRegened > 0) {
      state.lives = Math.min(MAX_LIVES, state.lives + livesRegened);
      state.lastRegenTimestamp = state.lastRegenTimestamp + livesRegened * regenMs;
      saveState(state);
    }
  } else {
    state.lastRegenTimestamp = now;
    saveState(state);
  }

  const timeToNext = state.lives < MAX_LIVES
    ? regenMs - (now - state.lastRegenTimestamp)
    : 0;

  return { lives: state.lives, maxLives: MAX_LIVES, nextRegenMs: Math.max(0, timeToNext) };
}

/** Consume one life. Returns false if no lives available. */
export function consumeLife(): boolean {
  const state = getState();
  // Apply regen first
  getEnergy();
  const fresh = getState();
  if (fresh.lives <= 0) return false;
  fresh.lives -= 1;
  if (fresh.lives < MAX_LIVES && fresh.lastRegenTimestamp === state.lastRegenTimestamp) {
    // If we just went below max, start regen timer
    fresh.lastRegenTimestamp = Date.now();
  }
  saveState(fresh);
  return true;
}

/** Add lives (e.g., reward) */
export function addLives(count: number) {
  const state = getState();
  state.lives = Math.min(MAX_LIVES, state.lives + count);
  saveState(state);
}

export function formatRegenTime(ms: number): string {
  const totalSec = Math.ceil(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}
