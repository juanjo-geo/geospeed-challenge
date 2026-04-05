// Synthetic sound effects using Web Audio API — no external deps or API keys needed
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
      // Try to resume — this only succeeds inside a user gesture
      ctx.resume().then(() => { unlocked = true; }).catch(() => {});
    } else if (ctx.state === 'suspended') {
      ctx.resume().then(() => { unlocked = true; }).catch(() => {});
    } else {
      unlocked = true;
    }
    // Return even if suspended — Android/Chrome queues sounds fine.
    // iOS will silently discard if not unlocked; that is acceptable.
    return ctx;
  } catch (_) {
    return null;
  }
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', gain = 0.15) {
  const c = getCtx();
  if (!c) return;
  try {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(gain, c.currentTime);
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
    filter.frequency.value = 3000;
    g.gain.setValueAtTime(gain, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    source.connect(filter);
    filter.connect(g);
    g.connect(c.destination);
    source.start();
  } catch (_) { /* ignore */ }
}

/** Soft click when tapping the map */
export function playClick() {
  unlockAudio(); // ensures context is activated on the gesture that triggered the click
  playTone(800, 0.08, 'sine', 0.1);
  playNoise(0.05, 0.04);
}

/** Ascending chime — good result (≥500 pts) */
export function playGood() {
  playTone(523, 0.15, 'sine', 0.12);  // C5
  setTimeout(() => playTone(659, 0.15, 'sine', 0.12), 80);   // E5
  setTimeout(() => playTone(784, 0.25, 'sine', 0.14), 160);  // G5
}

/** Descending buzz — bad result (<500 pts) */
export function playBad() {
  playTone(300, 0.2, 'triangle', 0.1);
  setTimeout(() => playTone(220, 0.3, 'triangle', 0.08), 120);
}

/** Short tick for timer warning (last 5 seconds) */
export function playTick() {
  playTone(1000, 0.06, 'square', 0.06);
}

/** Game over — low descending tones */
export function playGameOver() {
  playTone(440, 0.3, 'sine', 0.12);
  setTimeout(() => playTone(370, 0.3, 'sine', 0.12), 200);
  setTimeout(() => playTone(294, 0.5, 'sine', 0.14), 400);
}

/** Victory fanfare */
export function playVictory() {
  playTone(523, 0.15, 'sine', 0.12);
  setTimeout(() => playTone(659, 0.12, 'sine', 0.12), 100);
  setTimeout(() => playTone(784, 0.12, 'sine', 0.12), 200);
  setTimeout(() => playTone(1047, 0.4, 'sine', 0.16), 300);
}

/** Countdown beep for last 3 seconds */
export function playCountdown() {
  playTone(880, 0.12, 'sine', 0.1);
}

/** Final countdown beep (GO!) */
export function playGo() {
  playTone(1320, 0.3, 'sine', 0.15);
}
