// ═══════════════════════════════════════════════════════════════════════════
// GeoSpeed — Background Music System (single track)
// ═══════════════════════════════════════════════════════════════════════════
//
// One continuous track that plays from splash through all phases.
// Volume at 25% of pre-mastered MP3 (~3.75% effective).
// Mute persisted in localStorage. Pauses when tab hidden, resumes on focus.

import { useEffect, useCallback, useState } from 'react';

export type MusicTrack = 'on' | 'none';

const TRACK_SRC = '/music/track-menu.mp3';
const BASE_VOLUME = 0.19; // Reduced 25% (was 0.25) so SFX cut through
const FADE_DURATION = 800; // ms

// ── Global singleton state ──
let audioEl: HTMLAudioElement | null = null;
let isPlaying = false;
let isMuted = false;
let fadeInterval: ReturnType<typeof setInterval> | null = null;

try {
  isMuted = localStorage.getItem('geospeed_music_muted') === 'true';
} catch (_) {}

function getAudio(): HTMLAudioElement {
  if (!audioEl) {
    audioEl = new Audio();
    audioEl.loop = true;
    audioEl.volume = 0;
    audioEl.preload = 'auto';
    audioEl.setAttribute('playsinline', '');
    audioEl.src = TRACK_SRC;
  }
  return audioEl;
}

function stopFade() {
  if (fadeInterval) {
    clearInterval(fadeInterval);
    fadeInterval = null;
  }
}

function fadeTo(targetVol: number, onDone?: () => void) {
  const audio = getAudio();
  stopFade();
  const startVol = audio.volume;
  const diff = targetVol - startVol;
  if (Math.abs(diff) < 0.01) {
    audio.volume = targetVol;
    onDone?.();
    return;
  }
  const steps = 20;
  const stepTime = FADE_DURATION / steps;
  let step = 0;
  fadeInterval = setInterval(() => {
    step++;
    const eased = 1 - Math.pow(1 - step / steps, 2);
    audio.volume = Math.max(0, Math.min(1, startVol + diff * eased));
    if (step >= steps) {
      stopFade();
      audio.volume = targetVol;
      onDone?.();
    }
  }, stepTime);
}

function startMusic() {
  const audio = getAudio();
  if (isMuted) {
    audio.load();
    isPlaying = true;
    return;
  }
  if (isPlaying && !audio.paused) return;
  isPlaying = true;
  audio.volume = 0;
  const p = audio.play();
  if (p) p.catch(() => {
    // Autoplay blocked — retry on first user gesture
    installPlayRetry();
  });
  fadeTo(BASE_VOLUME);
}

let retryInstalled = false;
function installPlayRetry() {
  if (retryInstalled || typeof document === 'undefined') return;
  retryInstalled = true;
  const retry = () => {
    if (!isPlaying || isMuted) return;
    const audio = getAudio();
    if (audio.paused) {
      audio.volume = 0;
      const p = audio.play();
      if (p) p.then(() => {
        fadeTo(BASE_VOLUME);
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
  isMuted = muted;
  try {
    localStorage.setItem('geospeed_music_muted', muted ? 'true' : 'false');
  } catch (_) {}

  const audio = getAudio();
  if (muted) {
    fadeTo(0, () => { audio.pause(); });
  } else if (isPlaying) {
    audio.volume = 0;
    const p = audio.play();
    if (p) p.catch(() => {});
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
    } else if (isPlaying && !isMuted) {
      const p = audio.play();
      if (p) p.catch(() => {});
    }
  });
}
installVisibilityHandler();

// ═══════════════════════════════════════════════════════════════════════════
// React Hook
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Single-track background music.
 *
 * Usage:
 *   const { toggle, muted } = useBackgroundMusic('on');
 *
 * Pass 'on' to start playing (from splash onward).
 * Music continues uninterrupted across all phases.
 */
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
