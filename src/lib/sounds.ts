// Synthetic sound effects using Web Audio API — no external deps or API keys needed
//
// JUICE DESIGN: Every sound uses pitch randomization (±15%) and gain variation (±20%)
// to avoid monotony. No two consecutive triggers sound identical.
// Reference: Guía de Estilo Visual "Neon-Velocity" — bfxr-style pitch/volume variation
//
// MOBILE AUDIO NOTE:
// iOS Safari requires AudioContext to be created and first unlocked inside a
// direct user-gesture handler (tap/click). Call unlockAudio() from any interactive
// element's click handler to pre-activate the context so subsequent sounds work.

type AudioCtxClass = typeof AudioContext;

let ctx: AudioContext | null = null;
let unlocked = false;

function getAudioCtxClass(): AudioCtxClass | null {
  if (typeof window === 'undefined') return null;
  return (
    window.AudioContext ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as unknown as { webkitAudioContext?: AudioCtxClass }).webkitAudioContext ||
    null
  );
}

/**
 * Call this once from any direct user-gesture handler (tap, click) to activate
 * the AudioContext on mobile browsers (especially iOS Safari).
 * Already called internally on every playX() function for convenience.
 */
export function unlockAudio(): void {
  try {
    const Cls = getAudioCtxClass();
    if (!Cls) return;
    if (!ctx) ctx = new Cls();
    if (ctx.state === 'suspended') {
      ctx.resume().then(() => { unlocked = true; }).catch(() => {});
    } else {
      unlocked = true;
    }
  } catch (_) { /* ignore */ }
}

function getCtx(): AudioContext | null {
  try {
    const Cls = getAudioCtxClass();
    if (!Cls) return null;
    if (!ctx) {
      ctx = new Cls();
      ctx.resume().then(() => { unlocked = true; }).catch(() => {});
    } else if (ctx.state === 'suspended') {
      ctx.resume().then(() => { unlocked = true; }).catch(() => {});
    } else {
      unlocked = true;
    }
    return ctx;
  } catch (_) {
    return null;
  }
}

// ── Juice helpers: pitch & gain variation ──────────────────────────────────
// Every sound call randomizes pitch ±15% and gain ±20% for organic feel.
// This is the #1 technique from Candy Crush / bfxr to avoid auditory fatigue.

/** Randomize a value by ±pct (e.g. 0.15 = ±15%) */
function vary(base: number, pct = 0.15): number {
  return base * (1 + (Math.random() - 0.5) * 2 * pct);
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', gain = 0.15) {
  const c = getCtx();
  if (!c) return;
  try {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.value = vary(freq, 0.08); // ±8% pitch variation
    const finalGain = vary(gain, 0.2);      // ±20% volume variation
    g.gain.setValueAtTime(finalGain, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    osc.connect(g);
    g.connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + duration);
  } catch (_) { /* ignore */ }
}

function playNoise(duration: number, gain = 0.08) {
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
    filter.type = 'highpass';
    filter.frequency.value = vary(3000, 0.15);
    g.gain.setValueAtTime(vary(gain, 0.2), c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    source.connect(filter);
    filter.connect(g);
    g.connect(c.destination);
    source.start();
  } catch (_) { /* ignore */ }
}

/** Soft click when tapping the map */
export function playClick() {
  unlockAudio();
  playTone(vary(800, 0.12), 0.08, 'sine', 0.1);
  playNoise(0.05, 0.04);
}

/** Perfect hit — rich chord with shimmer (<50km) */
export function playPerfect() {
  const c = getCtx();
  if (!c) return;
  // Play a full major chord + octave for maximum satisfaction
  const baseFreq = vary(523, 0.05); // C5 base
  playTone(baseFreq, 0.2, 'sine', 0.14);
  setTimeout(() => playTone(baseFreq * 1.25, 0.2, 'sine', 0.12), 40);  // E5
  setTimeout(() => playTone(baseFreq * 1.5, 0.2, 'sine', 0.12), 80);   // G5
  setTimeout(() => playTone(baseFreq * 2, 0.35, 'sine', 0.16), 120);    // C6 octave
  // Shimmer noise for "sparkle" effect
  setTimeout(() => playNoise(0.12, 0.06), 100);
}

/** Ascending chime — good result (≥500 pts) */
export function playGood() {
  const baseFreq = vary(523, 0.08); // Vary the root note each time
  playTone(baseFreq, 0.15, 'sine', 0.12);
  setTimeout(() => playTone(baseFreq * 1.26, 0.15, 'sine', 0.12), 80);   // ~E5
  setTimeout(() => playTone(baseFreq * 1.5, 0.25, 'sine', 0.14), 160);   // ~G5
}

/** Descending buzz — bad result (<500 pts) */
export function playBad() {
  playTone(vary(300, 0.1), 0.2, 'triangle', 0.1);
  setTimeout(() => playTone(vary(220, 0.1), 0.3, 'triangle', 0.08), 120);
}

/** Short tick for timer warning (last 5 seconds) — pitch rises as time runs out */
export function playTick(secondsLeft?: number) {
  // Pitch increases as time gets more urgent (higher = more panic)
  const basePitch = secondsLeft !== undefined ? 800 + (6 - Math.max(secondsLeft, 1)) * 80 : 1000;
  playTone(vary(basePitch, 0.05), 0.06, 'square', 0.06);
}

/** Heartbeat pulse for last 3 seconds — low thump */
export function playHeartbeat() {
  const c = getCtx();
  if (!c) return;
  try {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = 'sine';
    osc.frequency.value = vary(60, 0.1); // Deep bass thump
    g.gain.setValueAtTime(0.2, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
    osc.connect(g);
    g.connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + 0.15);
    // Second thump (heartbeat = "lub-dub")
    setTimeout(() => {
      const osc2 = c.createOscillator();
      const g2 = c.createGain();
      osc2.type = 'sine';
      osc2.frequency.value = vary(50, 0.1);
      g2.gain.setValueAtTime(0.15, c.currentTime);
      g2.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.12);
      osc2.connect(g2);
      g2.connect(c.destination);
      osc2.start();
      osc2.stop(c.currentTime + 0.12);
    }, 120);
  } catch (_) { /* ignore */ }
}

/** Streak sound — pitch scales with streak level */
export function playStreak(streakLevel: number) {
  // Each streak level raises pitch by a semitone (musical progression)
  const basePitch = 440 * Math.pow(2, (streakLevel - 1) / 12);
  playTone(vary(basePitch, 0.05), 0.12, 'sine', 0.1);
  setTimeout(() => playTone(vary(basePitch * 1.5, 0.05), 0.18, 'sine', 0.12), 60);
}

/** Game over — low descending tones */
export function playGameOver() {
  playTone(vary(440, 0.05), 0.3, 'sine', 0.12);
  setTimeout(() => playTone(vary(370, 0.05), 0.3, 'sine', 0.12), 200);
  setTimeout(() => playTone(vary(294, 0.05), 0.5, 'sine', 0.14), 400);
}

/** Victory fanfare — ascending with final sustain */
export function playVictory() {
  const base = vary(523, 0.05);
  playTone(base, 0.15, 'sine', 0.12);
  setTimeout(() => playTone(base * 1.26, 0.12, 'sine', 0.12), 100);
  setTimeout(() => playTone(base * 1.5, 0.12, 'sine', 0.12), 200);
  setTimeout(() => playTone(base * 2, 0.5, 'sine', 0.18), 300);
  // Shimmer on victory
  setTimeout(() => playNoise(0.15, 0.05), 350);
}

/** Countdown beep for last 3 seconds */
export function playCountdown() {
  playTone(vary(880, 0.03), 0.12, 'sine', 0.1);
}

/** Final countdown beep (GO!) */
export function playGo() {
  playTone(vary(1320, 0.03), 0.3, 'sine', 0.15);
  // Add a burst for emphasis
  setTimeout(() => playNoise(0.08, 0.06), 50);
}
