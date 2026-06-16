import { supabase } from '@/integrations/supabase/client';
import { trackEvent } from './analytics';

// ── Feature Flags Interface ──
export interface FeatureFlags {
  onboarding_hint_delays: number[];
  onboarding_timer_seconds: number;
  frustration_cooldown_seconds: number;
  frustration_max_per_session: number;
  interstitial_loss_cadence: number;
  interstitial_neutral_cadence: number;
  store_lives_5_price_cents: number;
  store_lives_15_price_cents: number;
  store_pro_monthly_price_cents: number;
  auto_advance_seconds: number;
  energy_regen_minutes: number;
  max_lives: number;
  enable_gamepad: boolean;
  enable_onboarding: boolean;
  world_challenge_event: boolean;
  ab_group: 'control' | 'variant_a' | 'variant_b';
}

// ── Defaults ──
const DEFAULT_FLAGS: FeatureFlags = {
  onboarding_hint_delays: [5, 10, 15],
  onboarding_timer_seconds: 30,
  frustration_cooldown_seconds: 90,
  frustration_max_per_session: 4,
  interstitial_loss_cadence: 2,
  interstitial_neutral_cadence: 3,
  store_lives_5_price_cents: 99,
  store_lives_15_price_cents: 199,
  store_pro_monthly_price_cents: 499,
  auto_advance_seconds: 2,
  energy_regen_minutes: 20,
  max_lives: 5,
  enable_gamepad: true,
  enable_onboarding: true,
  world_challenge_event: false, // activar durante Mundial/Copa para destacar el modo
  ab_group: 'control', // overridden per-user below
};

// ── Constants ──
const CACHE_KEY = 'geospeed_feature_flags';
const CACHE_TTL_KEY = 'geospeed_feature_flags_ttl';
const AB_GROUP_KEY = 'geospeed_ab_group';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ── Internal state ──
let currentFlags: FeatureFlags = { ...DEFAULT_FLAGS };
let initialized = false;

// ── A/B group assignment ──
function getOrAssignABGroup(): FeatureFlags['ab_group'] {
  const stored = localStorage.getItem(AB_GROUP_KEY);
  if (stored === 'control' || stored === 'variant_a' || stored === 'variant_b') {
    return stored;
  }
  const groups: FeatureFlags['ab_group'][] = ['control', 'variant_a', 'variant_b'];
  const assigned = groups[Math.floor(Math.random() * groups.length)];
  localStorage.setItem(AB_GROUP_KEY, assigned);
  return assigned;
}

// ── Cache helpers ──
function getCachedFlags(): FeatureFlags | null {
  try {
    const ttl = localStorage.getItem(CACHE_TTL_KEY);
    if (!ttl || Date.now() > Number(ttl)) return null;
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as FeatureFlags;
  } catch {
    return null;
  }
}

function setCachedFlags(flags: FeatureFlags): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(flags));
    localStorage.setItem(CACHE_TTL_KEY, String(Date.now() + CACHE_TTL_MS));
  } catch {
    // localStorage full or unavailable — ignore
  }
}

// ── Remote fetch ──
async function fetchRemoteFlags(): Promise<Partial<FeatureFlags> | null> {
  try {
    const { data, error } = await (supabase
      .from('feature_flags' as any)
      .select('flags')
      .eq('id', 1)
      .single() as any);
    if (error || !data?.flags) return null;
    return data.flags as Partial<FeatureFlags>;
  } catch {
    return null;
  }
}

// ── Public API ──

/**
 * Initialize feature flags. Call once on app startup.
 * Tries remote fetch, falls back to cache, then defaults.
 */
export async function initFeatureFlags(): Promise<void> {
  const abGroup = getOrAssignABGroup();

  // 1. Try cache first (fast path)
  const cached = getCachedFlags();
  if (cached) {
    currentFlags = { ...DEFAULT_FLAGS, ...cached, ab_group: abGroup };
    initialized = true;
    trackEvent('feature_flags_loaded', { source: 'cache', ab_group: abGroup });

    // Refresh from remote in background (non-blocking)
    fetchRemoteFlags().then((remote) => {
      if (remote) {
        currentFlags = { ...DEFAULT_FLAGS, ...remote, ab_group: abGroup };
        setCachedFlags(currentFlags);
      }
    }).catch(() => {});
    return;
  }

  // 2. Try remote fetch
  const remote = await fetchRemoteFlags();
  if (remote) {
    currentFlags = { ...DEFAULT_FLAGS, ...remote, ab_group: abGroup };
    setCachedFlags(currentFlags);
    initialized = true;
    trackEvent('feature_flags_loaded', { source: 'remote', ab_group: abGroup });
    return;
  }

  // 3. Fall back to defaults
  currentFlags = { ...DEFAULT_FLAGS, ab_group: abGroup };
  initialized = true;
  trackEvent('feature_flags_loaded', { source: 'defaults', ab_group: abGroup });
}

/**
 * Get a single feature flag value.
 */
export function getFlag<K extends keyof FeatureFlags>(key: K): FeatureFlags[K] {
  return currentFlags[key];
}

/**
 * Get all feature flags.
 */
export function getAllFlags(): FeatureFlags {
  return { ...currentFlags };
}

/**
 * Get the user's A/B group.
 */
export function getABGroup(): string {
  return currentFlags.ab_group;
}
