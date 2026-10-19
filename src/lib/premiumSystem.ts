/**
 * GeoSpeed — Premium / Monetization System
 *
 * Manages:
 *  - Pro subscription state (infinite lives, no ads, exclusive features)
 *  - Life packs (one-time purchases)
 *  - Game counter for interstitial ad cadence
 *  - Lo comprado según el servidor (tabla purchases vía my_entitlements / claim_purchased_lives)
 *  - localStorage as cache, the server as source of truth whenever there is a session
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
  price: string;              // display string (en US$: en Latinoamérica "$" se lee como pesos)
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
    price: 'US$0.99',
    priceCents: 99,
  },
  {
    id: 'lives_15',
    type: 'lives',
    label: '15 Vidas',
    description: '3× más por menos',
    emoji: '💖',
    lives: 15,
    price: 'US$1.99',
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
    price: 'US$4.99',
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
    price: 'US$2.99/mes',
    priceCents: 299,
    highlight: true,
  },
  {
    id: 'pro_yearly',
    type: 'pro_yearly',
    label: 'Pro Anual',
    description: 'Ahorra 50% vs mensual',
    emoji: '🌟',
    price: 'US$17.99/año',
    priceCents: 1799,
    badge: '-50%',
  },
  {
    id: 'pro_lifetime',
    type: 'pro_lifetime',
    label: 'Pro para siempre',
    description: 'Pago único · Todo desbloqueado · Para siempre',
    emoji: '👑',
    price: 'US$29.99',
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

// ─── Lo comprado según el servidor ──────────────────────────────────
// Web (Mercado Pago): el webhook registra cada pago en `purchases` y el servidor es la única
// fuente de verdad (my_entitlements / claim_purchased_lives, migración 20261018160000).
// Nativo (RevenueCat): el Pro vive en la tienda; se combina con lo del servidor.
// La caché evita que un Pro falso en localStorage sobreviva a la última consulta.
let _serverProCache: { isPro: boolean; checkedAt: number } | null = null;
const SERVER_PRO_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/** Evento global cuando llegan vidas compradas o se activa el Pro (detail: EntitlementsResult). */
export const ENTITLEMENTS_EVENT = 'geospeed:entitlements';
/** Marca de compra web en curso (se acredita al volver o días después, p.ej. pago en efectivo). */
export const PURCHASE_PENDING_KEY = 'geospeed_purchase_pending';

export interface EntitlementsResult {
  /** false = no se pudo consultar (sin sesión, sin red o sin la migración): se conserva lo local */
  checked: boolean;
  isPro: boolean;
  /** el Pro se activó en esta consulta (antes no lo era) */
  proActivated: boolean;
  /** vidas compradas recogidas en esta consulta */
  livesAdded: number;
}

interface ServerEntitlements {
  is_pro: boolean;
  source: 'subscription' | 'lifetime' | null;
  expires_at: string | null;
  lives_pending: number;
}

function isNativeApp(): boolean {
  const cap = (typeof window !== 'undefined' ? (window as any).Capacitor : null);
  if (!cap) return false;
  return typeof cap.isNativePlatform === 'function' ? cap.isNativePlatform() : true;
}

/** Pro de la tienda nativa (RevenueCat). null en web o si la tienda no responde. */
async function getStorePro(): Promise<{ isActive: boolean; expiresAt: string | null } | null> {
  if (!isNativeApp()) return null;
  try {
    const { paymentProvider } = await import('./paymentProvider');
    const st = await paymentProvider.getSubscriptionStatus();
    return st.source === 'revenuecat' || st.isActive ? { isActive: st.isActive, expiresAt: st.expiresAt } : null;
  } catch {
    return null;
  }
}

let _refreshing: Promise<EntitlementsResult> | null = null;

/**
 * Consulta lo comprado (servidor + tienda nativa), recoge las vidas compradas pendientes y
 * actualiza el estado Pro local. Seguro de llamar a menudo: las llamadas simultáneas se unen.
 */
export function refreshEntitlements(): Promise<EntitlementsResult> {
  if (!_refreshing) _refreshing = doRefreshEntitlements().finally(() => { _refreshing = null; });
  return _refreshing;
}

async function doRefreshEntitlements(): Promise<EntitlementsResult> {
  const wasPro = getProStatus().isPro;
  let server: ServerEntitlements | null = null;
  let livesAdded = 0;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data, error } = await supabase.rpc('my_entitlements');
      if (!error && data) server = data as unknown as ServerEntitlements;
      if (server && server.lives_pending > 0) {
        const { data: n, error: claimError } = await supabase.rpc('claim_purchased_lives');
        if (!claimError && typeof n === 'number' && n > 0) {
          addLives(n);
          livesAdded = n;
          const st = getState();
          st.totalLivesPurchased += n;
          saveState(st);
        }
      }
    }
  } catch { /* sin red: se conserva lo local */ }

  const store = await getStorePro();
  if (!server && !store) {
    return { checked: false, isPro: wasPro, proActivated: false, livesAdded };
  }

  const serverPro = !!server?.is_pro;
  const storePro = !!store?.isActive;
  const isActive = serverPro || storePro;
  const state = getState();
  state.isPro = isActive;
  if (serverPro) {
    state.proSource = server!.source;
    state.proExpiresAt = server!.source === 'lifetime' ? null : server!.expires_at;
  } else if (storePro) {
    state.proSource = store!.expiresAt ? 'subscription' : 'lifetime';
    state.proExpiresAt = store!.expiresAt;
  } else {
    state.proSource = null;
    state.proExpiresAt = null;
  }
  saveState(state);
  _serverProCache = { isPro: isActive, checkedAt: Date.now() };

  const result: EntitlementsResult = { checked: true, isPro: isActive, proActivated: isActive && !wasPro, livesAdded };
  if (livesAdded > 0 || result.proActivated) {
    try { localStorage.removeItem(PURCHASE_PENDING_KEY); } catch { /* ignore */ }
    try { window.dispatchEvent(new CustomEvent(ENTITLEMENTS_EVENT, { detail: result })); } catch { /* ignore */ }
  }
  return result;
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
  // Solo estado local: lo usan la tienda nativa (RevenueCat, que guarda el Pro en la tienda) y el
  // proveedor mock. El Pro web lo da el servidor (refreshEntitlements); player_data.premium ya no
  // es escribible por los clientes.
  _serverProCache = { isPro: true, checkedAt: Date.now() };
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
