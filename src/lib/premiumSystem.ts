/**
 * GeoSpeed — Premium / Monetization System
 *
 * Manages:
 *  - Pro subscription state (infinite lives, no ads, exclusive features)
 *  - Life packs (one-time purchases)
 *  - Game counter for interstitial ad cadence
 *  - Server-side validation via Supabase player_data table
 *  - localStorage as cache, Supabase as source of truth for logged-in users
 */

import { addLives } from './energySystem';
import { supabase } from '@/integrations/supabase/client';

// ─── Types ──────────────────────────────────────────────────────────
export interface ProStatus {
  isPro: boolean;
  expiresAt: string | null;   // ISO date or null if not pro
  source: 'subscription' | 'lifetime' | null;
}

export interface StoreProduct {
  id: string;
  type: 'lives' | 'pro_monthly' | 'pro_yearly' | 'pro_lifetime';
  label: string;
  description: string;
  emoji: string;
  lives?: number;             // only for life packs
  price: string;              // display string
  priceCents: number;         // actual price in cents (for payment processor)
  highlight?: boolean;        // featured product
  badge?: string;             // e.g. "POPULAR", "MEJOR VALOR"
}

// ─── Store catalog ──────────────────────────────────────────────────
export const STORE_PRODUCTS: StoreProduct[] = [
  // Life packs
  {
    id: 'lives_5',
    type: 'lives',
    label: '5 Vidas',
    description: 'Recarga inmediata',
    emoji: '❤️',
    lives: 5,
    price: '$0.99',
    priceCents: 99,
  },
  {
    id: 'lives_15',
    type: 'lives',
    label: '15 Vidas',
    description: '3× más por menos',
    emoji: '💖',
    lives: 15,
    price: '$1.99',
    priceCents: 199,
    badge: 'POPULAR',
  },
  {
    id: 'lives_50',
    type: 'lives',
    label: '50 Vidas',
    description: 'Pack mega',
    emoji: '💝',
    lives: 50,
    price: '$4.99',
    priceCents: 499,
    badge: 'MEJOR VALOR',
  },
  // Pro subscriptions
  {
    id: 'pro_monthly',
    type: 'pro_monthly',
    label: 'Pro Mensual',
    description: 'Vidas infinitas · Sin anuncios · Modos exclusivos',
    emoji: '⭐',
    price: '$2.99/mes',
    priceCents: 299,
    highlight: true,
  },
  {
    id: 'pro_yearly',
    type: 'pro_yearly',
    label: 'Pro Anual',
    description: 'Ahorra 50% vs mensual',
    emoji: '🌟',
    price: '$17.99/año',
    priceCents: 1799,
    badge: '-50%',
  },
  {
    id: 'pro_lifetime',
    type: 'pro_lifetime',
    label: 'Pro para siempre',
    description: 'Pago único · Todo desbloqueado · Para siempre',
    emoji: '👑',
    price: '$29.99',
    priceCents: 2999,
  },
];

// ─── Constants ──────────────────────────────────────────────────────
const STORAGE_KEY = 'geospeed_premium';
const GAMES_COUNTER_KEY = 'geospeed_games_since_ad';
const INTERSTITIAL_CADENCE = 3; // show ad every N games

interface PremiumState {
  isPro: boolean;
  proExpiresAt: string | null;
  proSource: 'subscription' | 'lifetime' | null;
  totalLivesPurchased: number;
  totalSpentCents: number;
}

function getState(): PremiumState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {
    isPro: false,
    proExpiresAt: null,
    proSource: null,
    totalLivesPurchased: 0,
    totalSpentCents: 0,
  };
}

function saveState(state: PremiumState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

// ─── Server-validated Pro cache ─────────────────────────────────────
// For logged-in users, the server is the source of truth.
// We cache the server response for 5 minutes to avoid excessive queries.
let _serverProCache: { isPro: boolean; checkedAt: number } | null = null;
const SERVER_PRO_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Validates Pro status against Supabase for logged-in users.
 * Falls back to localStorage for guests or if the query fails.
 */
export async function validateProFromServer(): Promise<ProStatus> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return getProStatus(); // Guest → use local

    const { data, error } = await supabase
      .from('player_data')
      .select('premium')
      .eq('user_id', user.id)
      .single();

    if (error || !data) return getProStatus(); // Table missing or no row → use local

    const premium = data.premium as { isPro?: boolean; proExpiresAt?: string | null; proSource?: string | null } | null;
    if (!premium) return getProStatus();

    // Check expiration server-side
    let isActive = premium.isPro === true;
    if (isActive && premium.proSource === 'subscription' && premium.proExpiresAt) {
      if (new Date(premium.proExpiresAt) < new Date()) {
        isActive = false;
        // Expire it on server too
        await supabase
          .from('player_data')
          .update({ premium: { isPro: false, proExpiresAt: null, proSource: null }, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);
      }
    }

    // Update local cache to match server
    const localState = getState();
    localState.isPro = isActive;
    localState.proExpiresAt = isActive ? (premium.proExpiresAt ?? null) : null;
    localState.proSource = isActive ? (premium.proSource as 'subscription' | 'lifetime' | null) : null;
    saveState(localState);

    _serverProCache = { isPro: isActive, checkedAt: Date.now() };

    return {
      isPro: isActive,
      expiresAt: premium.proExpiresAt ?? null,
      source: premium.proSource as 'subscription' | 'lifetime' | null,
    };
  } catch {
    return getProStatus(); // Network error → use local
  }
}

// ─── Pro status (synchronous — uses local + server cache) ──────────
export function getProStatus(): ProStatus {
  const state = getState();
  // If server cache is fresh and says NOT pro, override localStorage
  // This prevents the localStorage hack
  if (_serverProCache && (Date.now() - _serverProCache.checkedAt) < SERVER_PRO_CACHE_TTL) {
    if (!_serverProCache.isPro && state.isPro) {
      // Server says not pro but localStorage says pro → trust server
      state.isPro = false;
      state.proExpiresAt = null;
      state.proSource = null;
      saveState(state);
    }
  }
  // Check expiration for subscriptions
  if (state.isPro && state.proSource === 'subscription' && state.proExpiresAt) {
    if (new Date(state.proExpiresAt) < new Date()) {
      state.isPro = false;
      state.proExpiresAt = null;
      state.proSource = null;
      saveState(state);
    }
  }
  return {
    isPro: state.isPro,
    expiresAt: state.proExpiresAt,
    source: state.proSource,
  };
}

export function isPro(): boolean {
  return getProStatus().isPro;
}

/** Resetea el estado Pro local (para pruebas: limpiar un Pro falso del modo mock). */
export function resetPro(): void {
  const state = getState();
  state.isPro = false;
  state.proExpiresAt = null;
  state.proSource = null;
  saveState(state);
  _serverProCache = { isPro: false, checkedAt: Date.now() };
}

// ─── Purchase handlers ──────────────────────────────────────────────
// These are called after successful payment verification.
// In production, the server validates the payment and then calls these.
// For now, they work with localStorage for the MVP.

export async function activatePro(source: 'subscription' | 'lifetime', durationDays?: number): Promise<void> {
  const state = getState();
  state.isPro = true;
  state.proSource = source;
  if (source === 'lifetime') {
    state.proExpiresAt = null; // never expires
  } else if (durationDays) {
    const expires = new Date();
    expires.setDate(expires.getDate() + durationDays);
    state.proExpiresAt = expires.toISOString();
  }
  saveState(state);

  // Persist to server for logged-in users
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const premiumPayload = {
        isPro: state.isPro,
        proExpiresAt: state.proExpiresAt,
        proSource: state.proSource,
      };
      await supabase
        .from('player_data')
        .upsert({
          user_id: user.id,
          premium: premiumPayload,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      _serverProCache = { isPro: true, checkedAt: Date.now() };
    }
  } catch { /* Silent — local state is already saved */ }
}

export function purchaseLives(productId: string): boolean {
  const product = STORE_PRODUCTS.find(p => p.id === productId);
  if (!product || product.type !== 'lives' || !product.lives) return false;

  const state = getState();
  state.totalLivesPurchased += product.lives;
  state.totalSpentCents += product.priceCents;
  saveState(state);

  addLives(product.lives);
  return true;
}

// ─── Smart Ad Cadence Tracking ──────────────────────────────────────
// Context-aware interstitial timing:
//  - After a LOSS (timeout): always show (player is resetting anyway)
//  - After a WIN with good score: never show (don't interrupt the high)
//  - After a mediocre game: show every N games (standard cadence)

export function incrementGameCounter(): void {
  if (isPro()) return;
  try {
    const count = parseInt(localStorage.getItem(GAMES_COUNTER_KEY) || '0', 10);
    localStorage.setItem(GAMES_COUNTER_KEY, String(count + 1));
  } catch { /* ignore */ }
}

/**
 * Smart interstitial decision based on game context.
 * @param context - 'loss' for timeout/bad game, 'win' for good game, 'neutral' for default cadence
 */
export function shouldShowInterstitial(context: 'loss' | 'win' | 'neutral' = 'neutral'): boolean {
  if (isPro()) return false;
  try {
    const count = parseInt(localStorage.getItem(GAMES_COUNTER_KEY) || '0', 10);

    // Never interrupt a victory moment
    if (context === 'win') return false;

    // After a loss, show more aggressively (every 2 games instead of 3)
    if (context === 'loss') {
      return count > 0 && count % 2 === 0;
    }

    // Standard cadence for neutral games
    return count > 0 && count % INTERSTITIAL_CADENCE === 0;
  } catch {
    return false;
  }
}

export function resetGameCounter(): void {
  try {
    localStorage.setItem(GAMES_COUNTER_KEY, '0');
  } catch { /* ignore */ }
}

// ─── Rewarded ad callback ───────────────────────────────────────────
export function rewardAdWatched(): void {
  addLives(1);
}

// ─── Stats ──────────────────────────────────────────────────────────
export function getPurchaseStats() {
  const state = getState();
  return {
    totalLivesPurchased: state.totalLivesPurchased,
    totalSpentCents: state.totalSpentCents,
  };
}
