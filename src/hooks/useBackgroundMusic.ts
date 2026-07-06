// ═══════════════════════════════════════════════════════════════════════════
// GeoSpeed — Background Music System (single track)
// ═══════════════════════════════════════════════════════════════════════════
//
// En iOS `audio.volume` se IGNORA, por eso enrutamos la música por Web Audio
// (GainNode) para controlar volumen y mute. Mutear = ganancia 0 SIN pausar el
// <audio>, lo que mantiene viva la sesión de audio de iOS y NO afecta los SFX.

import { useEffect, useCallback, useState } from 'react';
import { getSharedAudioContext } from '@/lib/sounds';

export type MusicTrack = 'on' | 'none';

const TRACK_SRC = '/music/track-menu.mp3';
const BASE_VOLUME = 0.42; // ganancia base (0-1); iOS la respeta vía Web Audio (bajado ~30%)
const FADE_DURATION = 800; // ms

// ── Global singleton state ──
let audioEl: HTMLAudioElement | null = null;
let isPlaying = false;
let isMuted = false;
let fadeInterval: ReturnType<typeof setInterval> | null = null;

// Web Audio routing
let musicGain: GainNode | null = null;
let musicSource: MediaElementAudioSourceNode | null = null;
let audioCtx: AudioContext | null = null;

try {
  isMuted = localStorage.getItem('geospeed_music_muted') === 'true';
} catch (_) {}

function getAudio(): HTMLAudioElement {
  if (!audioEl) {
    audioEl = new Audio();
    audioEl.loop = true;
    audioEl.volume = 1; // el volumen real lo controla la ganancia de Web Audio
    audioEl.preload = 'auto';
    audioEl.setAttribute('playsinline', '');
    audioEl.src = TRACK_SRC;
  }
  return audioEl;
}

/** Enruta el <audio> por Web Audio (una sola vez). */
function ensureRouting(): boolean {
  if (musicGain) return true;
  try {
    const ctx = getSharedAudioContext();
    if (!ctx) return false;
    audioCtx = ctx;
    const audio = getAudio();
    musicSource = ctx.createMediaElementSource(audio);
    musicGain = ctx.createGain();
    musicGain.gain.value = 0;
    musicSource.connect(musicGain);
    musicGain.connect(ctx.destination);
    return true;
  } catch (_) {
    return false;
  }
}

function currentLevel(): number {
  if (musicGain) return musicGain.gain.value;
  return getAudio().volume;
}

function setLevel(v: number) {
  const vol = Math.max(0, Math.min(1, v));
  if (musicGain && audioCtx) {
    try { musicGain.gain.setValueAtTime(vol, audioCtx.currentTime); }
    catch (_) { musicGain.gain.value = vol; }
  } else {
    getAudio().volume = vol; // fallback escritorio (iOS ignora)
  }
}

/** Reanuda el audio tras bloqueo/desbloqueo del móvil (iOS suspende el contexto). */
function wakeAudio() {
  ensureRouting();
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  const audio = getAudio();
  if (isPlaying && audio.paused) {
    const p = audio.play();
    if (p) p.catch(() => {});
  }
}

function stopFade() {
  if (fadeInterval) {
    clearInterval(fadeInterval);
    fadeInterval = null;
  }
}

function fadeTo(targetVol: number, onDone?: () => void) {
  stopFade();
  ensureRouting();
  const startVol = currentLevel();
  const diff = targetVol - startVol;
  if (Math.abs(diff) < 0.01) {
    setLevel(targetVol);
    onDone?.();
    return;
  }
  const steps = 20;
  const stepTime = FADE_DURATION / steps;
  let step = 0;
  fadeInterval = setInterval(() => {
    step++;
    const eased = 1 - Math.pow(1 - step / steps, 2);
    setLevel(startVol + diff * eased);
    if (step >= steps) {
      stopFade();
      setLevel(targetVol);
      onDone?.();
    }
  }, stepTime);
}

function startMusic() {
  const audio = getAudio();
  ensureRouting();
  if (isPlaying && !audio.paused) { if (!isMuted) fadeTo(BASE_VOLUME); return; }
  isPlaying = true;
  setLevel(0);
  const p = audio.play();
  if (p) p.catch(() => {
    installPlayRetry();
  });
  ensureRouting();
  if (!isMuted) fadeTo(BASE_VOLUME);
}

let retryInstalled = false;
function installPlayRetry() {
  if (retryInstalled || typeof document === 'undefined') return;
  retryInstalled = true;
  const retry = () => {
    if (!isPlaying) return;
    const audio = getAudio();
    ensureRouting();
    if (audio.paused) {
      setLevel(0);
      const p = audio.play();
      if (p) p.then(() => {
        if (!isMuted) fadeTo(BASE_VOLUME);
        removeRetry();
      }).catch(() => {});
    } else {
      removeRetry();
    }
  };
  const removeRetry = () => {
    ['touchstart', 'touchend', 'mousedown', 'click', 'keydown', 'pointerdown'].forEach(e => {
      document.removeEventListener(e, retry, true);
    });
  };
  ['touchstart', 'touchend', 'mousedown', 'click', 'keydown', 'pointerdown'].forEach(e => {
    document.addEventListener(e, retry, { capture: true, passive: true, once: false });
  });
}

function stopMusic() {
  const audio = getAudio();
  if (audio.paused) {
    isPlaying = false;
    return;
  }
  fadeTo(0, () => {
    audio.pause();
    isPlaying = false;
  });
}

function setMuted(muted: boolean) {
  wakeAudio();
  isMuted = muted;
  try {
    localStorage.setItem('geospeed_music_muted', muted ? 'true' : 'false');
  } catch (_) {}
  const audio = getAudio();
  ensureRouting();
  if (muted) {
    // Ganancia a 0 pero el <audio> SIGUE reproduciendo → mantiene la sesión iOS, no toca los SFX.
    fadeTo(0);
  } else if (isPlaying) {
    if (audio.paused) { const p = audio.play(); if (p) p.catch(() => {}); }
    fadeTo(BASE_VOLUME);
  }
}

function toggleMuted(): boolean {
  setMuted(!isMuted);
  return isMuted;
}

// ── Visibility: pause when tab hidden, resume on focus ──
let visibilityInstalled = false;
function installVisibilityHandler() {
  if (visibilityInstalled || typeof document === 'undefined') return;
  visibilityInstalled = true;
  document.addEventListener('visibilitychange', () => {
    const audio = getAudio();
    if (document.hidden) {
      if (!audio.paused) audio.pause();
    } else if (isPlaying) {
      wakeAudio();
    }
  });
}
installVisibilityHandler();

// ═══════════════════════════════════════════════════════════════════════════
// React Hook
// ═══════════════════════════════════════════════════════════════════════════

export function useBackgroundMusic(initialTrack: MusicTrack = 'none') {
  const [mutedState, setMutedState] = useState(isMuted);

  useEffect(() => {
    if (initialTrack === 'on') {
      startMusic();
    } else {
      stopMusic();
    }
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
