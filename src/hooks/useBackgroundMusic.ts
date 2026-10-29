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
import { afterAppLoad, firstInteraction } from '@/lib/idle';

export type MusicTrack = 'on' | 'none';

const TRACK_SRC = '/music/track-menu.mp3';
const BASE_VOLUME = 0.085; // ganancia base (0-1); -35% adicional
const FADE_DURATION = 800; // ms

// ── Estado singleton global ──
let ctx: AudioContext | null = null;
let buffer: AudioBuffer | null = null;
let bufferPromise: Promise<AudioBuffer | null> | null = null;
let source: AudioBufferSourceNode | null = null;
let gain: GainNode | null = null;
// Filtro entre el track y el volumen: con el combo la música "se abre" (puntaje v2, ver setMusicIntensity)
let filter: BiquadFilterNode | null = null;
let intensity = 0;
const FILTER_HZ = [7500, 7500, 7500, 11000, 20000];
const INTENSITY_BOOST = [1, 1, 1, 1.12, 1.28];
let isPlaying = false;
let isMuted = false;
let fadeInterval: ReturnType<typeof setInterval> | null = null;
let systemPaused = false;   // el usuario pausó desde el control de la pantalla de bloqueo
let mediaSessionSet = false;

try {
  isMuted = localStorage.getItem('geospeed_music_muted') === 'true';
} catch (_) {}

/** Devuelve el contexto compartido; si cambió (se recreó tras cerrarse), descarta el grafo viejo. */
function ensureCtx(): AudioContext | null {
  const c = getSharedAudioContext();
  if (c && c !== ctx) {
    ctx = c;
    gain = null;   // pertenecían al contexto anterior
    filter = null;
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
  if (!filter) {
    filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = FILTER_HZ[intensity];
    filter.connect(gain);
  }
  return gain;
}

/** Volumen objetivo de la música según el nivel de combo actual */
const targetVolume = () => BASE_VOLUME * INTENSITY_BOOST[intensity];

// La pista pesa ~850 KB y crear el AudioContext cuesta más de 100 ms de CPU: hacerlo mientras abre la app
// le quitaba red y procesador a la pantalla de carga y al Inicio, y sin un gesto del jugador el navegador
// deja el contexto suspendido de todos modos. Por eso: los bytes de la pista se descargan cuando la app ya
// abrió y el navegador quedó libre (o antes, con el primer gesto), y el contexto + la decodificación solo
// se crean con el primer toque o tecla (así la música suena enseguida al tocar, sin costo antes).
const MUSIC_PREFETCH_MS = 5000;
let armed = false; // ya pasó el primer gesto: se puede crear el contexto de audio
let gesture: Promise<void> | null = null;
const whenGesture = () => (gesture ??= firstInteraction().then(() => { armed = true; }));
let bytesPromise: Promise<ArrayBuffer | null> | null = null;
/** Descarga la pista (sin tocar el audio). Reutilizable: la decodificación recibe una copia. */
function prefetchBytes(): Promise<ArrayBuffer | null> {
  return (bytesPromise ??= fetch(TRACK_SRC)
    .then((r) => r.arrayBuffer())
    .catch(() => { bytesPromise = null; return null; }));
}

/** Decodifica el track una sola vez (buffer compartible entre contextos). Requiere contexto (gesto previo). */
function loadBuffer(): Promise<AudioBuffer | null> {
  if (buffer) return Promise.resolve(buffer);
  if (bufferPromise) return bufferPromise;
  const c = ensureCtx();
  if (!c) return Promise.resolve(null);
  bufferPromise = prefetchBytes()
    .then((a) => (a ? c.decodeAudioData(a.slice(0)) : null)) // decodeAudioData vacía el buffer que recibe
    .then((b) => {
      if (!b) { bufferPromise = null; return null; }
      buffer = b;
      return b;
    })
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
  s.connect(filter ?? g);
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
  if (!isPlaying || !armed) return;
  const c = ensureCtx();
  if (!c) { installPlayRetry(); return; }
  if (c.state === 'suspended') c.resume().catch(() => {});
  ensureGain();
  if (!source) {
    if (buffer) {
      startSource();
      if (!isMuted) fadeTo(targetVolume());
    } else {
      loadBuffer().then((b) => {
        if (b && isPlaying) { startSource(); if (!isMuted) fadeTo(targetVolume()); }
      });
    }
  }
  // Si el usuario pausó desde el bloqueo, al volver restauramos la música.
  if (systemPaused && !isMuted) { systemPaused = false; fadeTo(targetVolume()); }
  markPlaying();
}

/** Marca a iOS que estamos "reproduciendo" (estado del control del bloqueo). */
function markPlaying() {
  try {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      (navigator as unknown as { mediaSession: { playbackState: string } }).mediaSession.playbackState = 'playing';
    }
  } catch (_) {}
}

/**
 * Doma el control de la pantalla de bloqueo: al pausar NO se tumba el audio.
 * Pausar = baja la música (el contexto y los efectos siguen vivos); al volver
 * al juego o dar play, la música se restaura sola.
 */
function setupMediaSession() {
  if (mediaSessionSet || typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
  mediaSessionSet = true;
  try {
    const ms = (navigator as unknown as { mediaSession: any }).mediaSession;
    try {
      const MM = (window as unknown as { MediaMetadata?: any }).MediaMetadata;
      if (MM) ms.metadata = new MM({ title: 'GeoSpeed Challenge', artist: 'GeoSpeed' });
    } catch (_) {}
    ms.setActionHandler('play', () => {
      systemPaused = false;
      revive();
      if (!isMuted) fadeTo(targetVolume());
      try { ms.playbackState = 'playing'; } catch (_) {}
    });
    ms.setActionHandler('pause', () => {
      systemPaused = true;
      fadeTo(0); // baja la música pero NO detiene el source ni el contexto → efectos intactos
      try { ms.playbackState = 'paused'; } catch (_) {}
    });
  } catch (_) {}
}

function startMusic() {
  isPlaying = true;
  if (armed) { beginPlayback(); return; }
  void afterAppLoad(MUSIC_PREFETCH_MS).then(() => { if (isPlaying) void prefetchBytes(); });
  void whenGesture().then(() => { if (isPlaying) beginPlayback(); });
}

function beginPlayback() {
  const c = ensureCtx();
  if (!c) { installPlayRetry(); return; }
  if (c.state === 'suspended') c.resume().catch(() => {});
  ensureGain();
  setLevel(0);
  loadBuffer().then((b) => {
    if (!b || !isPlaying) { if (!b) installPlayRetry(); return; }
    startSource();
    if (source) {
      if (!isMuted) fadeTo(targetVolume());
      setupMediaSession();
      markPlaying();
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
  if (!isPlaying || !armed) { isPlaying = false; stopSource(); return; }
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
    fadeTo(targetVolume());
  }
}

/**
 * Puntaje v2 — juice por combo: la música suena algo apagada (filtro a 7,5 kHz) y se abre con el combo:
 * ¡Turbo! (nivel 3) a 11 kHz y +12 % de volumen, ¡EN LLAMAS! (4) completa y +28 %. Al romperse el combo
 * o terminar la partida vuelve a 0. No toca nada si la música está silenciada o en pausa.
 */
export function setMusicIntensity(level: number) {
  const lvl = Math.max(0, Math.min(4, Math.round(level)));
  if (lvl === intensity) return;
  intensity = lvl;
  const c = ctx;
  if (!c) return;
  try {
    filter?.frequency.setTargetAtTime(FILTER_HZ[lvl], c.currentTime, 0.25);
    if (gain && isPlaying && !isMuted && !systemPaused && !backgroundPaused && !fadeInterval) {
      gain.gain.setTargetAtTime(targetVolume(), c.currentTime, 0.3);
    }
  } catch (_) { /* ignore */ }
}

function toggleMuted(): boolean {
  setMuted(!isMuted);
  return isMuted;
}

// ── Segundo plano: pausar ──
// Con audioSession.type = 'playback' (sounds.ts) + mediaSession, iOS trata la página como un
// reproductor y deja sonar la música con la app en segundo plano o el teléfono bloqueado.
// Al ocultarse: ganancia a 0, contexto suspendido y control del bloqueo en "pausa".
// No se usan ensureCtx/ensureGain aquí: pasan por getSharedAudioContext, que REANUDA el contexto.
let backgroundPaused = false;
function pauseForBackground() {
  if (!isPlaying || backgroundPaused) return;
  backgroundPaused = true;
  stopFade();
  if (gain && ctx) {
    try { gain.gain.setValueAtTime(0, ctx.currentTime); } catch (_) { gain.gain.value = 0; }
  }
  try { ctx?.suspend().catch(() => {}); } catch (_) {}
  try {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      (navigator as unknown as { mediaSession: { playbackState: string } }).mediaSession.playbackState = 'paused';
    }
  } catch (_) {}
}

/** Al volver al frente: reanuda el contexto y sube la música con fundido (si no está silenciada). */
function resumeFromBackground() {
  if (!backgroundPaused) return;
  backgroundPaused = false;
  revive();
  if (isPlaying && !isMuted && !systemPaused) fadeTo(targetVolume());
}

// ── Visibilidad/foco: pausar al ir a segundo plano, reanudar al volver o desbloquear ──
let visibilityInstalled = false;
function installVisibilityHandler() {
  if (visibilityInstalled || typeof document === 'undefined') return;
  visibilityInstalled = true;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { pauseForBackground(); return; }
    if (backgroundPaused) resumeFromBackground();
    else if (isPlaying) revive();
  });
  if (typeof window !== 'undefined') {
    // pagehide: iOS a veces cierra/congela la PWA sin un visibilitychange fiable
    window.addEventListener('pagehide', pauseForBackground);
    window.addEventListener('focus', () => {
      if (document.hidden) return;
      if (backgroundPaused) resumeFromBackground();
      else if (isPlaying) revive();
    });
  }
  // Recuperación tras interrupción de iOS (notificación push, llamada, Siri): si el
  // contexto compartido se recreó o la música quedó muda, reconstruir el grafo en el
  // próximo gesto del usuario (cada toque en el mapa durante la partida cuenta).
  const onGesture = () => {
    if (!isPlaying) return;
    const c = getSharedAudioContext(); // reanuda/recrea el contexto en sounds.ts
    if (c !== ctx || !source || (c && c.state !== 'running')) revive();
  };
  ['pointerdown', 'touchstart'].forEach((e) =>
    document.addEventListener(e, onGesture, { capture: true, passive: true }),
  );
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
