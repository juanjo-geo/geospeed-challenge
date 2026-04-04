// Synthetic sound effects using Web Audio API — no external deps or API keys needed

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', gain = 0.15) {
  const c = getCtx();
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
}

function playNoise(duration: number, gain = 0.08) {
  const c = getCtx();
  const bufferSize = c.sampleRate * duration;
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
}

/** Soft click when tapping the map */
export function playClick() {
  playTone(800, 0.08, 'sine', 0.1);
  playNoise(0.05, 0.04);
}

/** Ascending chime — good result (≥500 pts) */
export function playGood() {
  playTone(523, 0.15, 'sine', 0.12);  // C5
  setTimeout(() => playTone(659, 0.15, 'sine', 0.12), 80);  // E5
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
