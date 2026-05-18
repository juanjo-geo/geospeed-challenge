/**
 * GeoSpeed — Analytics Module
 *
 * Lightweight event tracking using Google Analytics 4 (gtag.js).
 * Tracks key events for retention and monetization optimization:
 *
 * - session_start: App opens
 * - game_start: Player begins a game (mode, difficulty)
 * - game_complete: Player finishes a game (score, rounds, mode, difficulty, duration)
 * - rage_quit: Player exits mid-game (round, time_played)
 * - daily_challenge: Player plays the daily challenge
 * - share: Player shares result (method: image/video/challenge)
 * - store_view: Player opens the store
 * - purchase: Player buys something (product_id, price)
 * - ad_shown: Interstitial ad displayed
 * - level_up: Player reaches a new XP level
 * - battlepass_level: Player advances in battle pass
 * - signup: Player creates an account
 * - error: Unhandled error caught
 *
 * Usage:
 *   import { trackEvent, initAnalytics } from '@/lib/analytics';
 *   initAnalytics(); // Call once on app load
 *   trackEvent('game_complete', { score: 5000, mode: 'world' });
 */

// ─── Config ──────────────────────────────────────────────────────────

// Replace with your actual GA4 Measurement ID
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || '';

// Internal state
let initialized = false;
let sessionStartTime = 0;

// ─── gtag type declarations ──────────────────────────────────────────

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

// ─── Initialization ──────────────────────────────────────────────────

/**
 * Inject the GA4 gtag.js script and initialize tracking.
 * Safe to call multiple times — only loads once.
 */
export function initAnalytics(): void {
  if (initialized) return;
  initialized = true;
  sessionStartTime = Date.now();

  // Skip in development if no measurement ID
  if (!GA_MEASUREMENT_ID) {
    console.info('[Analytics] No GA_MEASUREMENT_ID configured — tracking disabled');
    return;
  }

  // Inject gtag.js script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize dataLayer and gtag
  window.dataLayer = window.dataLayer || [];
  window.gtag = function (...args: unknown[]) {
    window.dataLayer.push(args);
  };

  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: true,
    cookie_flags: 'SameSite=None;Secure',
  });

  // Track session start
  trackEvent('session_start', {
    platform: getPlatform(),
    screen_width: window.innerWidth,
    screen_height: window.innerHeight,
    locale: navigator.language,
    referrer: document.referrer || 'direct',
  });

  // Track page visibility changes (for session duration / rage quit detection)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      trackEvent('session_background', {
        session_duration_s: Math.round((Date.now() - sessionStartTime) / 1000),
      });
    }
  });

  console.info('[Analytics] GA4 initialized:', GA_MEASUREMENT_ID);
}

// ─── Event Tracking ──────────────────────────────────────────────────

/**
 * Track a custom event.
 * In development (no GA_MEASUREMENT_ID), logs to console.
 */
export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>,
): void {
  const eventData = {
    ...params,
    timestamp: Date.now(),
    session_duration_s: Math.round((Date.now() - sessionStartTime) / 1000),
  };

  // Always log in development for debugging
  if (!GA_MEASUREMENT_ID) {
    if (import.meta.env.DEV) {
      console.debug(`[Analytics] ${eventName}`, eventData);
    }
    return;
  }

  try {
    window.gtag('event', eventName, eventData);
  } catch (e) {
    console.warn('[Analytics] Failed to track event:', eventName, e);
  }
}

// ─── Convenience Trackers ────────────────────────────────────────────

export function trackGameStart(mode: string, difficulty: string): void {
  trackEvent('game_start', { mode, difficulty });
}

export function trackGameComplete(data: {
  score: number;
  rounds: number;
  mode: string;
  difficulty: string;
  avgDistance: number;
  reason: 'timeout' | 'complete';
  durationMs: number;
}): void {
  trackEvent('game_complete', {
    score: data.score,
    rounds: data.rounds,
    mode: data.mode,
    difficulty: data.difficulty,
    avg_distance_km: Math.round(data.avgDistance),
    reason: data.reason,
    duration_s: Math.round(data.durationMs / 1000),
  });
}

export function trackRageQuit(data: {
  round: number;
  totalRounds: number;
  timePlayedMs: number;
  mode: string;
  difficulty: string;
}): void {
  trackEvent('rage_quit', {
    round: data.round,
    total_rounds: data.totalRounds,
    time_played_s: Math.round(data.timePlayedMs / 1000),
    mode: data.mode,
    difficulty: data.difficulty,
    abandon_pct: Math.round((data.round / data.totalRounds) * 100),
  });
}

export function trackShare(method: 'image' | 'video' | 'challenge' | 'daily_link'): void {
  trackEvent('share', { method });
}

export function trackStoreView(): void {
  trackEvent('store_view');
}

export function trackPurchase(productId: string, priceCents: number): void {
  trackEvent('purchase', {
    product_id: productId,
    price_usd: priceCents / 100,
    currency: 'USD',
  });
}

export function trackAdShown(type: 'interstitial' | 'rewarded'): void {
  trackEvent('ad_shown', { ad_type: type });
}

export function trackLevelUp(level: number, title: string): void {
  trackEvent('level_up', { level, title });
}

export function trackBattlePassLevel(level: number): void {
  trackEvent('battlepass_level', { level });
}

export function trackSignup(method: string): void {
  trackEvent('signup', { method });
}

export function trackError(error: string, context?: string): void {
  trackEvent('error', { error_message: error.substring(0, 200), context: context || 'unknown' });
}

// ─── Monetization Funnel Events ─────────────────────────────────────

export function trackLivesDepleted(): void {
  trackEvent('lives_depleted', { session_games: getSessionGames() });
}

export function trackPurchaseIntent(productId: string): void {
  trackEvent('purchase_intent', { product_id: productId });
}

export function trackPurchaseComplete(productId: string, priceCents: number): void {
  trackEvent('purchase_complete', {
    product_id: productId,
    price_usd: priceCents / 100,
    currency: 'USD',
  });
}

export function trackFrustrationOffer(data: {
  type: string;
  level: string;
  accepted: boolean;
}): void {
  trackEvent('frustration_offer', {
    offer_type: data.type,
    frustration_level: data.level,
    accepted: data.accepted,
  });
}

export function trackStreakProtect(days: number, accepted: boolean): void {
  trackEvent('streak_protect', { streak_days: days, accepted });
}

export function trackSmartInterstitial(data: {
  trigger: 'post_loss' | 'post_rage' | 'cadence';
  shown: boolean;
  reason?: string;
}): void {
  trackEvent('smart_interstitial', {
    trigger: data.trigger,
    shown: data.shown,
    skip_reason: data.reason || '',
  });
}

export function trackRetention(milestone: string, daysSinceInstall: number): void {
  trackEvent('track_retention', { milestone, days_since_install: daysSinceInstall });
}

export function trackOnboarding(action: 'start' | 'complete', data?: Record<string, string | number>): void {
  trackEvent(`onboarding_${action}`, data || {});
}

// ─── Session game counter (in-memory) ───────────────────────────────
let _sessionGames = 0;
export function incrementSessionGames(): void { _sessionGames++; }
function getSessionGames(): number { return _sessionGames; }

// ─── Helpers ─────────────────────────────────────────────────────────

function getPlatform(): string {
  const ua = navigator.userAgent;
  if (/iPad|Tablet/i.test(ua)) return 'tablet';
  if (/iPhone|Android.*Mobile/i.test(ua)) return 'mobile';
  if (/Xbox|PlayStation/i.test(ua)) return 'console';
  return 'desktop';
}

/**
 * Get the current session duration in seconds.
 * Useful for rage quit detection.
 */
export function getSessionDurationMs(): number {
  return Date.now() - sessionStartTime;
}
