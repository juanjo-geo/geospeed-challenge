// ═══════════════════════════════════════════════════════════════════════════
// GeoSpeed IQ Challenge — JUICE-TIER Audio Engine
// ═══════════════════════════════════════════════════════════════════════════
//
// 8 Essential sounds + anti-monotony system + dynamic intensity
//
// DESIGN PRINCIPLES:
// 1. Pitch Randomization ±10-20% — no two triggers sound identical
// 2. Gain Variation ±20% — organic, alive feel
// 3. Multiple variations per event — Candy Crush technique
// 4. Streak-reactive pitch scaling — musical progression
// 5. iOS AudioContext unlock on first user gesture
//
// All synthesis via Web Audio API — zero external dependencies.

type AudioCtxClass = typeof AudioContext;

let ctx: AudioContext | null = null;
let unlocked = false;
let globalListenerInstalled = false;

function getAudioCtxClass(): AudioCtxClass | null {
  if (typeof window === 'undefined') return null;
  return (
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: AudioCtxClass }).webkitAudioContext ||
    null
  );
}

/**
 * Ensure AudioContext exists. Does NOT resume — that requires a user gesture.
 */
function ensureCtx(): AudioContext | null {
  try {
    const Cls = getAudioCtxClass();
    if (!Cls) return null;
    if (!ctx) ctx = new Cls();
    return ctx;
  } catch (_) {
    return null;
  }
}

/**
 * The real iOS unlock — must run synchronously inside a user-gesture call stack.
 *
 * iOS Safari requirements:
 * 1. AudioContext must be created OR resumed inside a direct user gesture (touchend/click)
 * 2. A buffer source must be started in the same synchronous call stack
 * 3. resume() must be called synchronously (we don't just rely on the promise)
 */
function doUnlock(): void {
  const c = ensureCtx();
  if (!c) return;

  // Always try to resume — iOS may re-suspend the context after inactivity
  if (c.state === 'suspended') {
    // Synchronous call in the gesture stack — iOS Safari checks this
    c.resume().catch(() => {});
  }

  // Play a silent buffer — this is the critical iOS unlock trick.
  // Must happen in the same call stack as the user gesture.
  // We do this every time if not yet confirmed running, since iOS
  // can silently fail the first attempt.
  if (!unlocked || c.state !== 'running') {
    try {
      const silent = c.createBuffer(1, 1, c.sampleRate);
      const src = c.createBufferSource();
      src.buffer = silent;
      src.connect(c.destination);
      src.start(0);
      // Also create and immediately start+stop an oscillator
      // Some iOS versions need this as well
      const osc = c.createOscillator();
      osc.frequency.value = 1;
      const g = c.createGain();
      g.gain.value = 0; // silent
      osc.connect(g);
      g.connect(c.destination);
      osc.start(0);
      osc.stop(c.currentTime + 0.001);
    } catch (_) { /* ignore */ }
  }

  if (c.state === 'running') {
    unlocked = true;
  }
}

/**
 * Install a global "first touch" listener that unlocks audio on the very
 * first user interaction. This catches cases where individual button handlers
 * go through React's synthetic event system (which iOS sometimes doesn't
 * consider a "direct user gesture").
 */
function installGlobalUnlockListener(): void {
  if (globalListenerInstalled || typeof document === 'undefined') return;
  globalListenerInstalled = true;

  const events = ['touchstart', 'touchend', 'click', 'keydown'] as const;
  const handler = () => {
    doUnlock();
    if (unlocked) {
      // Success — remove all listeners
      events.forEach(e => document.removeEventListener(e, handler, true));
    }
  };
  events.forEach(e => document.addEventListener(e, handler, { capture: true, passive: true }));
}

// Install immediately on module load — catches first tap anywhere
installGlobalUnlockListener();

/**
 * Call from any user-gesture handler to ensure audio works on iOS.
 * Safe to call multiple times.
 */
export function unlockAudio(): void {
  doUnlock();
  installGlobalUnlockListener(); // ensure it's there
}

/**
 * Get AudioContext, attempting resume if suspended.
 * For non-gesture contexts (setTimeout callbacks etc.), this will
 * return the context even if suspended — the next user gesture will resume it.
 */
function getCtx(): AudioContext | null {
  const c = ensureCtx();
  if (!c) return null;
  // Try to resume if suspended — will only work if in a gesture stack
  if (c.state === 'suspended') {
    c.resume().catch(() => {});
  }
  return c;
}

// ── Anti-Monotony Helpers ─────────────────────────────────────────────────
// Every single sound randomizes pitch and gain so no two hits feel the same.

/** Randomize a value by ±pct */
function vary(base: number, pct = 0.15): number {
  return base * (1 + (Math.random() - 0.5) * 2 * pct);
}

/** Pick a random item from an array */
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Core Synthesis Primitives ─────────────────────────────────────────────

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  gain = 0.15,
  opts?: { attack?: number; detune?: number }
) {
  const c = getCtx();
  if (!c) return;
  try {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.value = vary(freq, 0.10);
    if (opts?.detune) osc.detune.value = opts.detune;
    const finalGain = vary(gain, 0.2);
    const attack = opts?.attack ?? 0.005;
    g.gain.setValueAtTime(0.001, c.currentTime);
    g.gain.linearRampToValueAtTime(finalGain, c.currentTime + attack);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    osc.connect(g);
    g.connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + duration);
  } catch (_) { /* ignore */ }
}

function playFilteredNoise(
  duration: number,
  gain = 0.08,
  filterFreq = 3000,
  filterType: BiquadFilterType = 'highpass'
) {
  const c = getCtx();
  if (!c) return;
  try {
    const bufferSize = Math.floor(c.sampleRate * duration);
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const source = c.createBufferSource();
    source.buffer = buffer;
    const g = c.createGain();
    const filter = c.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = vary(filterFreq, 0.15);
    g.gain.setValueAtTime(vary(gain, 0.2), c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    source.connect(filter);
    filter.connect(g);
    g.connect(c.destination);
    source.start();
  } catch (_) { /* ignore */ }
}

/** Impact/thud — short low-freq burst with body */
function playImpact(freq = 80, duration = 0.12, gain = 0.18) {
  const c = getCtx();
  if (!c) return;
  try {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(vary(freq * 2, 0.1), c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(vary(freq, 0.1), c.currentTime + duration * 0.3);
    g.gain.setValueAtTime(vary(gain, 0.2), c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    osc.connect(g);
    g.connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + duration);
  } catch (_) { /* ignore */ }
}

/** Metallic bell / coin sound */
function playCoinBell(freq = 2400, duration = 0.25, gain = 0.08) {
  const c = getCtx();
  if (!c) return;
  try {
    // Two detuned oscillators for metallic shimmer
    [0, 7].forEach(detune => {
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = 'sine';
      osc.frequency.value = vary(freq, 0.08);
      osc.detune.value = detune;
      const finalGain = vary(gain, 0.2);
      g.gain.setValueAtTime(finalGain, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
      osc.connect(g);
      g.connect(c.destination);
      osc.start();
      osc.stop(c.currentTime + duration);
    });
  } catch (_) { /* ignore */ }
}

/** Glass shatter — filtered noise with descending filter sweep */
function playGlassShatter(gain = 0.06) {
  const c = getCtx();
  if (!c) return;
  try {
    const duration = 0.35;
    const bufferSize = Math.floor(c.sampleRate * duration);
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const source = c.createBufferSource();
    source.buffer = buffer;
    const g = c.createGain();
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 2;
    filter.frequency.setValueAtTime(vary(8000, 0.15), c.currentTime);
    filter.frequency.exponentialRampToValueAtTime(800, c.currentTime + duration);
    g.gain.setValueAtTime(vary(gain, 0.2), c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    source.connect(filter);
    filter.connect(g);
    g.connect(c.destination);
    source.start();
  } catch (_) { /* ignore */ }
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. CLICK EN EL MAPA — Thud suave + Pop
// ═══════════════════════════════════════════════════════════════════════════

export function playClick() {
  unlockAudio();
  // Soft thud (low impact)
  playImpact(vary(pick([180, 200, 220]), 0.12), 0.08, 0.07);
  // Pop (high click)
  playTone(vary(pick([900, 1000, 1100]), 0.12), 0.06, 'sine', 0.06);
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. ACIERTO PERFECTO (<50km) — Coin explosion + campana aguda
// ═══════════════════════════════════════════════════════════════════════════

export function playPerfect() {
  unlockAudio();
  const variation = pick([0, 1, 2]); // 3 variations

  if (variation === 0) {
    // Variation A: Major chord burst + coin bells
    const base = vary(587, 0.06); // D5
    playTone(base, 0.18, 'sine', 0.13);
    setTimeout(() => playTone(base * 1.25, 0.18, 'sine', 0.11), 35);     // F#5
    setTimeout(() => playTone(base * 1.5, 0.22, 'sine', 0.12), 70);      // A5
    setTimeout(() => playTone(base * 2, 0.35, 'sine', 0.15), 105);       // D6
    // Coin bells cascade
    setTimeout(() => playCoinBell(vary(3200, 0.1), 0.2, 0.06), 60);
    setTimeout(() => playCoinBell(vary(4000, 0.1), 0.18, 0.05), 120);
    setTimeout(() => playCoinBell(vary(4800, 0.1), 0.15, 0.04), 180);
    // Sparkle shimmer
    setTimeout(() => playFilteredNoise(0.15, 0.05, 5000, 'highpass'), 100);
  } else if (variation === 1) {
    // Variation B: Power chord + bell ring
    const base = vary(523, 0.06); // C5
    playTone(base, 0.2, 'sine', 0.13);
    setTimeout(() => playTone(base * 1.5, 0.2, 'sine', 0.12), 50);       // G5
    setTimeout(() => playTone(base * 2, 0.3, 'sine', 0.14), 100);        // C6
    // High bell
    setTimeout(() => playCoinBell(vary(3600, 0.1), 0.25, 0.07), 80);
    setTimeout(() => playCoinBell(vary(4400, 0.1), 0.2, 0.05), 150);
    setTimeout(() => playFilteredNoise(0.12, 0.04, 6000, 'highpass'), 120);
  } else {
    // Variation C: Ascending arpeggio + shower
    const base = vary(659, 0.06); // E5
    [1, 1.2, 1.414, 1.68, 2].forEach((ratio, i) => {
      setTimeout(() => playTone(base * ratio, 0.18, 'sine', 0.11), i * 40);
    });
    // Coin shower
    setTimeout(() => {
      for (let i = 0; i < 4; i++) {
        setTimeout(() => playCoinBell(vary(3000 + i * 500, 0.15), 0.15, 0.04), i * 45);
      }
    }, 100);
    setTimeout(() => playFilteredNoise(0.18, 0.05, 4500, 'highpass'), 80);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. ACIERTO BUENO (≥500pts) — Chime positivo
// ═══════════════════════════════════════════════════════════════════════════

export function playGood() {
  unlockAudio();
  const variation = pick([0, 1, 2]);

  if (variation === 0) {
    // Rising third
    const base = vary(523, 0.1);
    playTone(base, 0.14, 'sine', 0.11);
    setTimeout(() => playTone(base * 1.26, 0.14, 'sine', 0.11), 75);
    setTimeout(() => playTone(base * 1.5, 0.22, 'sine', 0.13), 150);
  } else if (variation === 1) {
    // Two-note bright
    const base = vary(587, 0.1);
    playTone(base, 0.12, 'sine', 0.10);
    setTimeout(() => playTone(base * 1.335, 0.2, 'sine', 0.12), 90);
    setTimeout(() => playCoinBell(vary(2800, 0.1), 0.12, 0.03), 140);
  } else {
    // Quick arpeggio
    const base = vary(494, 0.1);
    playTone(base, 0.1, 'sine', 0.10);
    setTimeout(() => playTone(base * 1.26, 0.1, 'sine', 0.10), 60);
    setTimeout(() => playTone(base * 1.5, 0.18, 'sine', 0.12), 120);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. FALLO (>2000km) — Whomp grave + cristal rompiéndose suave
// ═══════════════════════════════════════════════════════════════════════════

export function playBad() {
  unlockAudio();
  const variation = pick([0, 1, 2]);

  if (variation === 0) {
    // Descending whomp
    playTone(vary(300, 0.12), 0.2, 'triangle', 0.10);
    setTimeout(() => playTone(vary(200, 0.12), 0.3, 'triangle', 0.08), 100);
    setTimeout(() => playGlassShatter(0.03), 150);
  } else if (variation === 1) {
    // Low buzz + crack
    playTone(vary(260, 0.12), 0.25, 'sawtooth', 0.06);
    setTimeout(() => playTone(vary(180, 0.12), 0.3, 'triangle', 0.08), 120);
    setTimeout(() => playGlassShatter(0.025), 180);
  } else {
    // Minor second dissonance + fade
    const base = vary(280, 0.1);
    playTone(base, 0.22, 'triangle', 0.08);
    playTone(base * 1.06, 0.22, 'triangle', 0.06); // Minor second = tension
    setTimeout(() => playTone(vary(160, 0.1), 0.3, 'triangle', 0.07), 140);
    setTimeout(() => playGlassShatter(0.02), 200);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. ALERTA DE TIEMPO (<5s) — Tick-tock acelerado con presión creciente
// ═══════════════════════════════════════════════════════════════════════════

export function playTick(secondsLeft?: number) {
  unlockAudio();
  // Pitch + volume increase as time runs out → psychological pressure
  const urgency = secondsLeft !== undefined ? Math.max(0, 6 - secondsLeft) : 3;
  const basePitch = 800 + urgency * 100;
  const baseGain = 0.05 + urgency * 0.012;
  playTone(vary(basePitch, 0.05), 0.05, 'square', baseGain);
  // Double-tick on last 3 seconds
  if (secondsLeft !== undefined && secondsLeft <= 3) {
    setTimeout(() => playTone(vary(basePitch * 1.2, 0.05), 0.04, 'square', baseGain * 0.8), 80);
  }
}

/** Heartbeat pulse for last 3 seconds — lub-dub with body */
export function playHeartbeat() {
  unlockAudio();
  const c = getCtx();
  if (!c) return;
  try {
    // "Lub" — deep thump
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = 'sine';
    const freq = vary(55, 0.1);
    osc.frequency.setValueAtTime(freq * 1.5, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq, c.currentTime + 0.08);
    g.gain.setValueAtTime(vary(0.22, 0.15), c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
    osc.connect(g);
    g.connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + 0.15);
    // "Dub" — slightly lighter
    setTimeout(() => {
      try {
        const osc2 = c.createOscillator();
        const g2 = c.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(vary(48, 0.1), c.currentTime);
        g2.gain.setValueAtTime(vary(0.16, 0.15), c.currentTime);
        g2.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.12);
        osc2.connect(g2);
        g2.connect(c.destination);
        osc2.start();
        osc2.stop(c.currentTime + 0.12);
        // Subtle body resonance
        playImpact(vary(40, 0.1), 0.08, 0.05);
      } catch (_) { /* ignore */ }
    }, 110);
  } catch (_) { /* ignore */ }
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. RACHAS (x3+) — Escala musical ascendente (power-up)
// ═══════════════════════════════════════════════════════════════════════════

export function playStreak(streakLevel: number) {
  unlockAudio();
  // Each streak level raises pitch by a semitone — musical scale ascent
  const semitones = Math.min(streakLevel - 1, 12); // cap at one octave
  const basePitch = 440 * Math.pow(2, semitones / 12);
  const gain = Math.min(0.08 + streakLevel * 0.008, 0.16); // louder with streak

  // Power-up: root + fifth
  playTone(vary(basePitch, 0.04), 0.14, 'sine', gain);
  setTimeout(() => playTone(vary(basePitch * 1.5, 0.04), 0.2, 'sine', gain * 1.1), 50);

  // Sparkle on high streaks (5+)
  if (streakLevel >= 5) {
    setTimeout(() => playCoinBell(vary(basePitch * 3, 0.08), 0.15, 0.03), 80);
    setTimeout(() => playFilteredNoise(0.08, 0.03, 6000, 'highpass'), 100);
  }

  // Mega streak (8+): add harmonic overtone
  if (streakLevel >= 8) {
    setTimeout(() => playTone(vary(basePitch * 2, 0.04), 0.25, 'sine', gain * 0.7), 100);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 7. GAME OVER — Descenso melódico + impacto
// ═══════════════════════════════════════════════════════════════════════════

export function playGameOver() {
  unlockAudio();
  const variation = pick([0, 1]);

  if (variation === 0) {
    // Descending minor triad + impact
    const base = vary(440, 0.05);
    playTone(base, 0.28, 'sine', 0.12);
    setTimeout(() => playTone(base * 0.84, 0.28, 'sine', 0.12), 200);     // minor third down
    setTimeout(() => playTone(base * 0.67, 0.35, 'sine', 0.13), 400);     // fifth down
    setTimeout(() => playTone(base * 0.5, 0.5, 'sine', 0.14), 600);       // octave down
    // Final impact thud
    setTimeout(() => playImpact(vary(50, 0.15), 0.25, 0.15), 650);
    // Subtle glass for finality
    setTimeout(() => playGlassShatter(0.025), 700);
  } else {
    // Chromatic descent + rumble
    const base = vary(494, 0.05); // B4
    [0, -1, -3, -5, -7].forEach((semi, i) => {
      const freq = base * Math.pow(2, semi / 12);
      setTimeout(() => playTone(freq, 0.25, 'sine', 0.11), i * 150);
    });
    // Low rumble impact
    setTimeout(() => {
      playImpact(vary(40, 0.1), 0.3, 0.18);
      playFilteredNoise(0.2, 0.04, 400, 'lowpass');
    }, 700);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 8. VICTORY FANFARE — Ascending + sustain + sparkle
// ═══════════════════════════════════════════════════════════════════════════

export function playVictory() {
  unlockAudio();
  const base = vary(523, 0.05); // C5

  // Triumphant ascending fourth → fifth → octave
  playTone(base, 0.15, 'sine', 0.12);
  setTimeout(() => playTone(base * 1.335, 0.12, 'sine', 0.12), 100);     // F5
  setTimeout(() => playTone(base * 1.5, 0.12, 'sine', 0.12), 200);       // G5
  setTimeout(() => {
    // Final sustain chord
    playTone(base * 2, 0.5, 'sine', 0.16);                                // C6
    playTone(base * 2.52, 0.45, 'sine', 0.10);                            // E6
    playTone(base * 3, 0.4, 'sine', 0.08);                                // G6
  }, 300);

  // Coin cascade celebration
  setTimeout(() => {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => playCoinBell(vary(3000 + i * 400, 0.12), 0.18, 0.04), i * 50);
    }
  }, 350);

  // Final sparkle
  setTimeout(() => playFilteredNoise(0.2, 0.05, 5000, 'highpass'), 500);
}

// ═══════════════════════════════════════════════════════════════════════════
// COUNTDOWN BEEPS
// ═══════════════════════════════════════════════════════════════════════════

/** Countdown beep for 3-2-1 */
export function playCountdown() {
  unlockAudio();
  playTone(vary(880, 0.03), 0.12, 'sine', 0.10);
  // Subtle sub-bass hit for weight
  playImpact(vary(100, 0.1), 0.06, 0.06);
}

/** Final countdown beep (GO!) */
export function playGo() {
  unlockAudio();
  // Bright ascending burst
  playTone(vary(1320, 0.03), 0.25, 'sine', 0.14);
  setTimeout(() => playTone(vary(1760, 0.03), 0.3, 'sine', 0.12), 50);
  // Impact + shimmer
  setTimeout(() => playImpact(vary(120, 0.1), 0.1, 0.10), 30);
  setTimeout(() => playFilteredNoise(0.1, 0.05, 4000, 'highpass'), 60);
}
