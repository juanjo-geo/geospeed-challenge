// ═══════════════════════════════════════════════════════════════════════════
// GeoSpeed — Background Music System
// ═══════════════════════════════════════════════════════════════════════════
//
// Two tracks: menu (chill) and gameplay (upbeat synthwave).
// Volume at 15%, fade in/out transitions, mute persisted in localStorage.
// Automatically pauses when tab is hidden and resumes on focus.

import { useEffect, useRef, useCallback } from 'react';

export type MusicTrack = 'menu' | 'gameplay' | 'none';

const TRACKS: Record<Exclude<MusicTrack, 'none'>, string> = {
  menu: '/music/track-menu.mp3',
  gameplay: '/music/track-gameplay.mp3',
};

const BASE_VOLUME = 0.10;
const FADE_DURATION = 800; // ms

// ── Global singleton state (shared across all hook instances) ──
let audioEl: HTMLAudioElement | null = null;
let currentTrack: MusicTrack = 'none';
let isMuted = false;
let fadeInterval: ReturnType<typeof setInterval> | null = null;

// Load muted preference from localStorage
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
    const progress = step / steps;
    // Ease-out curve for smooth fade
    const eased = 1 - Math.pow(1 - progress, 2);
    audio.volume = Math.max(0, Math.min(1, startVol + diff * eased));
    if (step >= steps) {
      stopFade();
      audio.volume = targetVol;
      onDone?.();
    }
  }, stepTime);
}

function playTrack(track: Exclude<MusicTrack, 'none'>) {
  const audio = getAudio();
  if (isMuted) {
    // Still load the track so it's ready when unmuted
    if (currentTrack !== track) {
      audio.src = TRACKS[track];
      audio.load();
      currentTrack = track;
    }
    return;
  }

  if (currentTrack === track && !audio.paused) {
    // Already playing this track
    return;
  }

  if (currentTrack !== 'none' && currentTrack !== track && !audio.paused) {
    // Different track playing → fade out, switch, fade in
    fadeTo(0, () => {
      audio.src = TRACKS[track];
      audio.volume = 0;
      currentTrack = track;
      const p = audio.play();
      if (p) p.catch(() => {});
      fadeTo(BASE_VOLUME);
    });
  } else {
    // No track playing or same track paused → load and fade in
    if (currentTrack !== track) {
      audio.src = TRACKS[track];
      currentTrack = track;
    }
    audio.volume = 0;
    const p = audio.play();
    if (p) p.catch(() => {});
    fadeTo(BASE_VOLUME);
  }
}

function stopMusic() {
  const audio = getAudio();
  if (audio.paused) {
    currentTrack = 'none';
    return;
  }
  fadeTo(0, () => {
    audio.pause();
    currentTrack = 'none';
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
  } else if (currentTrack !== 'none') {
    // Resume the current track
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

// ── Visibility change: pause when tab hidden, resume on focus ──
let visibilityInstalled = false;
function installVisibilityHandler() {
  if (visibilityInstalled || typeof document === 'undefined') return;
  visibilityInstalled = true;
  document.addEventListener('visibilitychange', () => {
    const audio = getAudio();
    if (document.hidden) {
      if (!audio.paused) audio.pause();
    } else if (currentTrack !== 'none' && !isMuted) {
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
 * Controls which background music track plays.
 *
 * Usage:
 *   const { setTrack, toggle, muted } = useBackgroundMusic('menu');
 *
 * The track auto-starts when the component mounts (respecting mute state)
 * and fades out when unmounting or switching tracks.
 */
export function useBackgroundMusic(initialTrack: MusicTrack = 'none') {
  const trackRef = useRef(initialTrack);
  const mutedRef = useRef(isMuted);

  // Start/switch track on mount or when initialTrack changes
  useEffect(() => {
    trackRef.current = initialTrack;
    if (initialTrack === 'none') {
      stopMusic();
    } else {
      playTrack(initialTrack);
    }
    // Cleanup: fade out when component unmounts
    return () => {
      // Don't stop if another instance is managing music
      // (only stop if this component's track is still active)
    };
  }, [initialTrack]);

  const setTrack = useCallback((track: MusicTrack) => {
    trackRef.current = track;
    if (track === 'none') {
      stopMusic();
    } else {
      playTrack(track);
    }
  }, []);

  const toggle = useCallback(() => {
    toggleMuted();
    mutedRef.current = isMuted;
  }, []);

  return {
    setTrack,
    toggle,
    get muted() { return isMuted; },
  };
}

/** Get current mute state (non-reactive, for one-off checks) */
export function isMusicMuted(): boolean {
  return isMuted;
}

/** Toggle mute from anywhere (e.g., a global button) */
export { toggleMuted, setMuted };
