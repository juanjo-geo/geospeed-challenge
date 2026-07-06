// ═══════════════════════════════════════════════════════════════════════════
// GeoSpeed — Background Music System (Web Audio AudioBuffer, single track)
// ═══════════════════════════════════════════════════════════════════════════
//
// La música se carga como AudioBuffer y se reproduce con AudioBufferSourceNode
// (NO <audio> ni MediaElementSource). Motivo: en iOS, tras bloquear/desbloquear
// el móvil, un MediaElementSource deja el AudioContext en mal estado y ni la
// música ni los SFX vuelven. Un grafo Web Audio puro sobrevive al suspend/resume
// del contexto (basta reanudarlo con un gesto). Volumen y mute se controlan por
// GainNode (iOS lo respeta; ignora audio.volume). El AudioBuffer se comparte
// entre contextos, así que si el contexto se recrea, sólo reconstruimos el grafo.

import { useEffect, useCallback, useState } from 'react';
import { getSharedAudioContext } from '@/lib/sounds';

export type MusicTrack = 'on' | 'none';

const TRACK_SRC = '/music/track-menu.mp3';
const BASE_VOLUME = 0.13; // ganancia base (0-1); bajada adicional
const FADE_DURATION = 800; // ms

// ── Estado singleton global ──
let ctx: AudioContext | null = null;
let buffer: AudioBuffer | null = null;
let bufferPromise: Promise<AudioBuffer | null> | null = null;
let source: AudioBufferSourceNode | null = null;
let gain: GainNode | null = null;
let isPlaying = false;
let isMuted = false;
let fadeInterval: ReturnType<typeof setInterval> | null = null;

try {
  isMuted = localStorage.getItem('geospeed_music_muted') === 'true';
} catch (_) {}

/** Devuelve el contexto compartido; si cambió (se recreó tras cerrarse), descarta el grafo viejo. */
function ensureCtx(): AudioContext | null {
  const c = getSharedAudioContext();
  if (c && c !== ctx) {
    ctx = c;
    gain = null;   // pertenecían al contexto anterior
    source = null; // (el AudioBuffer sí se reutiliza entre contextos)
  } else if (c) {
    ctx = c;
  }
  return ctx;
}

function ensureGain(): GainNode | null {
  const c = ensureCtx();
  if (!c) return null;
  if (!gain) {
    gain = c.createGain();
    gain.gain.value = 0;
    gain.connect(c.destination);
  }
  return gain;
}

/** Carga y decodifica el track una sola vez (buffer compartible entre contextos). */
function loadBuffer(): Promise<AudioBuffer | null> {
  if (buffer) return Promise.resolve(buffer);
  if (bufferPromise) return bufferPromise;
  const c = ensureCtx();
  if (!c) return Promise.resolve(null);
  bufferPromise = fetch(TRACK_SRC)
    .then((r) => r.arrayBuffer())
    .then((a) => c.decodeAudioData(a))
    .then((b) => { buffer = b; return b; })
    .catch(() => { bufferPromise = null; return null; });
  return bufferPromise;
}

function currentLevel(): number {
  return gain ? gain.gain.value : 0;
}

function setLevel(v: number) {
  const g = ensureGain();
  const c = ctx;
  const vol = Math.max(0, Math.min(1, v));
  if (g && c) {
    try { g.gain.setValueAtTime(vol, c.currentTime); }
    catch (_) { g.gain.value = vol; }
  }
}

function stopFade() {
  if (fadeInterval) { clearInterval(fadeInterval); fadeInterval = null; }
}

function fadeTo(target: number, onDone?: () => void) {
  stopFade();
  ensureGain();
  const start = currentLevel();
  const diff = target - start;
  if (Math.abs(diff) < 0.01) { setLevel(target); onDone?.(); return; }
  const steps = 20;
  const stepTime = FADE_DURATION / steps;
  let step = 0;
  fadeInterval = setInterval(() => {
    step++;
    const eased = 1 - Math.pow(1 - step / steps, 2);
    setLevel(start + diff * eased);
    if (step >= steps) { stopFade(); setLevel(target); onDone?.(); }
  }, stepTime);
}

/** Crea el AudioBufferSourceNode en loop y lo arranca (si no hay uno vivo). */
function startSource() {
  const c = ensureCtx();
  const g = ensureGain();
  if (!c || !g || !buffer || source) return;
  const s = c.createBufferSource();
  s.buffer = buffer;
  s.loop = true;
  s.connect(g);
  try { s.start(0); } catch (_) {}
  source = s;
}

function stopSource() {
  if (source) {
    try { source.stop(); } catch (_) {}
    try { source.disconnect(); } catch (_) {}
    source = null;
  }
}

/**
 * Reanuda tras bloqueo/desbloqueo del móvil o cambio de pestaña: reanuda el
 * contexto (necesita gesto en iOS) y recrea el source si el contexto se recreó.
 */
function revive() {
  if (!isPlaying) return;
  const c = ensureCtx();
  if (!c) { installPlayRetry(); return; }
  if (c.state === 'suspended') c.resume().catch(() => {});
  ensureGain();
  if (!source) {
    if (buffer) {
      startSource();
      if (!isMuted) fadeTo(BASE_VOLUME);
    } else {
      loadBuffer().then((b) => {
        if (b && isPlaying) { startSource(); if (!isMuted) fadeTo(BASE_VOLUME); }
      });
    }
  }
}

function startMusic() {
  isPlaying = true;
  const c = ensureCtx();
  if (!c) { installPlayRetry(); return; }
  if (c.state === 'suspended') c.resume().catch(() => {});
  ensureGain();
  setLevel(0);
  loadBuffer().then((b) => {
    if (!b || !isPlaying) { if (!b) installPlayRetry(); return; }
    startSource();
    if (source) {
      if (!isMuted) fadeTo(BASE_VOLUME);
    } else {
      installPlayRetry();
    }
  });
}

let retryInstalled = false;
function installPlayRetry() {
  if (retryInstalled || typeof document === 'undefined') return;
  retryInstalled = true;
  const evts = ['touchstart', 'touchend', 'mousedown', 'click', 'keydown', 'pointerdown'];
  const removeRetry = () => evts.forEach((e) => document.removeEventListener(e, retry, true));
  function retry() {
    if (!isPlaying) { removeRetry(); retryInstalled = false; return; }
    const c = ensureCtx();
    if (!c) return;
    if (c.state === 'suspended') c.resume().catch(() => {});
    ensureGain();
    if (!source) revive();
    if (source) { removeRetry(); retryInstalled = false; }
  }
  evts.forEach((e) => document.addEventListener(e, retry, { capture: true, passive: true }));
}

function stopMusic() {
  if (!isPlaying) { stopSource(); return; }
  fadeTo(0, () => {
    stopSource();
    isPlaying = false;
  });
}

function setMuted(muted: boolean) {
  revive(); // asegura contexto/source vivos antes de togglear
  isMuted = muted;
  try { localStorage.setItem('geospeed_music_muted', muted ? 'true' : 'false'); } catch (_) {}
  if (muted) {
    fadeTo(0); // ganancia 0 pero el source sigue en loop → nada que reactivar
  } else if (isPlaying) {
    if (!source) revive();
    fadeTo(BASE_VOLUME);
  }
}

function toggleMuted(): boolean {
  setMuted(!isMuted);
  return isMuted;
}

// ── Visibilidad/foco: reanudar al volver de segundo plano o desbloqueo ──
let visibilityInstalled = false;
function installVisibilityHandler() {
  if (visibilityInstalled || typeof document === 'undefined') return;
  visibilityInstalled = true;
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && isPlaying) revive();
  });
  if (typeof window !== 'undefined') {
    window.addEventListener('focus', () => { if (isPlaying) revive(); });
  }
}
installVisibilityHandler();

// ═══════════════════════════════════════════════════════════════════════════
// React Hook
// ═══════════════════════════════════════════════════════════════════════════

export function useBackgroundMusic(initialTrack: MusicTrack = 'none') {
  const [mutedState, setMutedState] = useState(isMuted);

  useEffect(() => {
    if (initialTrack === 'on') startMusic();
    else stopMusic();
  }, [initialTrack]);

  const setTrack = useCallback((track: MusicTrack) => {
    if (track === 'on') startMusic();
    else stopMusic();
  }, []);

  const toggle = useCallback(() => {
    toggleMuted();
    setMutedState(isMuted);
  }, []);

  return { setTrack, toggle, muted: mutedState };
}

export function isMusicMuted(): boolean {
  return isMuted;
}

export { toggleMuted, setMuted };
