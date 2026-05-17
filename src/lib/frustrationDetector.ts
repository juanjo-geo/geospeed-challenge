/**
 * Frustration Detector — identifies when a player is most likely to convert.
 *
 * Signals tracked:
 *  - Consecutive losses (timeout or low score)
 *  - High average distance (bad accuracy)
 *  - Zero lives remaining
 *  - Short session times (rage quit pattern)
 *  - Score declining across recent games
 *
 * When frustration is high, we surface contextual offers:
 *  - Life packs after lives depleted
 *  - Pro upsell after 3+ consecutive bad games
 *  - "Second chance" rewarded ad after timeout
 */

import { getEnergy } from './energySystem';
import { isPro } from './premiumSystem';
import { trackEvent } from './analytics';

const STORAGE_KEY = 'geospeed_frustration';

interface FrustrationState {
  recentScores: number[];       // last 5 game scores
  recentDistances: number[];    // last 5 avg distances
  consecutiveBadGames: number;  // games with score < threshold
  lastGameReason: 'timeout' | 'complete' | null;
  gamesThisSession: number;
  offersShown: number;          // prevent spam
  lastOfferTimestamp: number;
}

export type FrustrationLevel = 'none' | 'mild' | 'moderate' | 'high' | 'extreme';

export interface FrustrationOffer {
  type: 'lives_pack' | 'pro_upsell' | 'rewarded_ad' | 'streak_protect';
  headline: string;
  subtext: string;
  emoji: string;
  ctaLabel: string;
  ctaAction: string; // 'store' | 'pro' | 'ad' | 'streak'
  urgency: 'low' | 'medium' | 'high';
}

const BAD_SCORE_THRESHOLD = 2000; // below this = "bad game"
const MIN_OFFER_INTERVAL_MS = 90_000; // 90s between offers (no spam)
const MAX_OFFERS_PER_SESSION = 4;

function getState(): FrustrationState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {
    recentScores: [],
    recentDistances: [],
    consecutiveBadGames: 0,
    lastGameReason: null,
    gamesThisSession: 0,
    offersShown: 0,
    lastOfferTimestamp: 0,
  };
}

function saveState(state: FrustrationState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

/**
 * Record a completed game's results for frustration tracking.
 * Call this at the end of every game.
 */
export function recordGameResult(data: {
  score: number;
  avgDistance: number;
  reason: 'timeout' | 'complete';
}): void {
  const state = getState();

  // Keep last 5
  state.recentScores = [...state.recentScores, data.score].slice(-5);
  state.recentDistances = [...state.recentDistances, data.avgDistance].slice(-5);
  state.lastGameReason = data.reason;
  state.gamesThisSession += 1;

  if (data.score < BAD_SCORE_THRESHOLD || data.reason === 'timeout') {
    state.consecutiveBadGames += 1;
  } else {
    state.consecutiveBadGames = 0;
  }

  saveState(state);
}

/**
 * Assess current frustration level based on tracked signals.
 */
export function getFrustrationLevel(): FrustrationLevel {
  const state = getState();
  const energy = getEnergy();
  let score = 0;

  // Consecutive bad games (strongest signal)
  if (state.consecutiveBadGames >= 4) score += 4;
  else if (state.consecutiveBadGames >= 3) score += 3;
  else if (state.consecutiveBadGames >= 2) score += 2;
  else if (state.consecutiveBadGames >= 1) score += 1;

  // Zero lives — desperate moment
  if (energy.lives === 0) score += 3;
  else if (energy.lives === 1) score += 1;

  // Timeout on last game
  if (state.lastGameReason === 'timeout') score += 1;

  // Declining scores (last 3 decreasing)
  if (state.recentScores.length >= 3) {
    const last3 = state.recentScores.slice(-3);
    if (last3[2] < last3[1] && last3[1] < last3[0]) score += 1;
  }

  // High average distance (consistently bad)
  if (state.recentDistances.length >= 2) {
    const avgRecent = state.recentDistances.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, state.recentDistances.length);
    if (avgRecent > 3000) score += 2;
    else if (avgRecent > 2000) score += 1;
  }

  if (score >= 7) return 'extreme';
  if (score >= 5) return 'high';
  if (score >= 3) return 'moderate';
  if (score >= 1) return 'mild';
  return 'none';
}

/**
 * Get the best contextual offer based on current frustration state.
 * Returns null if no offer should be shown (cooldown, pro user, etc.)
 */
export function getContextualOffer(): FrustrationOffer | null {
  // Pro users never see monetization offers
  if (isPro()) return null;

  const state = getState();
  const now = Date.now();

  // Rate limiting — no spam
  if (state.offersShown >= MAX_OFFERS_PER_SESSION) return null;
  if (now - state.lastOfferTimestamp < MIN_OFFER_INTERVAL_MS) return null;

  const level = getFrustrationLevel();
  if (level === 'none') return null;

  const energy = getEnergy();

  // Priority 1: Zero lives — most urgent conversion moment
  if (energy.lives === 0) {
    trackEvent('frustration_offer', { type: 'lives_pack', level, lives: 0 });
    return {
      type: 'lives_pack',
      headline: '¡Se acabaron las vidas!',
      subtext: 'Recarga ahora y sigue jugando',
      emoji: '💔',
      ctaLabel: '+5 VIDAS — $0.99',
      ctaAction: 'store',
      urgency: 'high',
    };
  }

  // Priority 2: Extreme frustration — Pro upsell
  if (level === 'extreme' || (level === 'high' && state.consecutiveBadGames >= 3)) {
    trackEvent('frustration_offer', { type: 'pro_upsell', level, bad_games: state.consecutiveBadGames });
    return {
      type: 'pro_upsell',
      headline: '¿Partida difícil?',
      subtext: 'Con PRO tienes vidas infinitas y sin anuncios',
      emoji: '👑',
      ctaLabel: 'PROBAR PRO — $2.99/mes',
      ctaAction: 'pro',
      urgency: 'high',
    };
  }

  // Priority 3: Moderate frustration + low lives — rewarded ad
  if (level === 'moderate' && energy.lives <= 2) {
    trackEvent('frustration_offer', { type: 'rewarded_ad', level, lives: energy.lives });
    return {
      type: 'rewarded_ad',
      headline: '¿Necesitas una vida extra?',
      subtext: 'Mira un video corto y gana +1 vida gratis',
      emoji: '🎬',
      ctaLabel: 'VER VIDEO → +1 VIDA',
      ctaAction: 'ad',
      urgency: 'medium',
    };
  }

  // Priority 4: Mild frustration after timeout — encouragement + subtle upsell
  if (state.lastGameReason === 'timeout' && state.consecutiveBadGames >= 2) {
    trackEvent('frustration_offer', { type: 'lives_pack', level, reason: 'timeout_streak' });
    return {
      type: 'lives_pack',
      headline: '¡Tan cerca!',
      subtext: 'Un pack de vidas te da más intentos para mejorar',
      emoji: '🔥',
      ctaLabel: '+5 VIDAS — $0.99',
      ctaAction: 'store',
      urgency: 'medium',
    };
  }

  return null;
}

/**
 * Mark that an offer was shown (for rate limiting).
 */
export function markOfferShown(): void {
  const state = getState();
  state.offersShown += 1;
  state.lastOfferTimestamp = Date.now();
  saveState(state);
}

/**
 * Reset session counters (call on app start).
 */
export function resetSessionFrustration(): void {
  const state = getState();
  state.gamesThisSession = 0;
  state.offersShown = 0;
  saveState(state);
}
