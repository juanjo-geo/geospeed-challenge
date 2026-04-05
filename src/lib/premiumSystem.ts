/**
 * GeoSpeed IQ Challenge — Premium / Monetization System
 *
 * Manages:
 *  - Pro subscription state (infinite lives, no ads, exclusive features)
 *  - Life packs (one-time purchases)
 *  - Game counter for interstitial ad cadence
 *  - Persistent state in localStorage + Supabase sync when logged in
 */

import { addLives } from './energySystem';

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

// ─── Pro status ─────────────────────────────────────────────────────
export function getProStatus(): ProStatus {
  const state = getState();
  // Check expiration for subscriptions
  if (state.isPro && state.proSource === 'subscription' && state.proExpiresAt) {
    if (new Date(state.proExpiresAt) < new Date()) {
      // Subscription expired
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

// ─── Purchase handlers ──────────────────────────────────────────────
// These are called after successful payment verification.
// In production, the server validates the payment and then calls these.
// For now, they work with localStorage for the MVP.

export function activatePro(source: 'subscription' | 'lifetime', durationDays?: number): void {
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

// ─── Ad cadence tracking ────────────────────────────────────────────
export function incrementGameCounter(): void {
  if (isPro()) return; // Pro users never see ads
  try {
    const count = parseInt(localStorage.getItem(GAMES_COUNTER_KEY) || '0', 10);
    localStorage.setItem(GAMES_COUNTER_KEY, String(count + 1));
  } catch { /* ignore */ }
}

export function shouldShowInterstitial(): boolean {
  if (isPro()) return false;
  try {
    const count = parseInt(localStorage.getItem(GAMES_COUNTER_KEY) || '0', 10);
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
