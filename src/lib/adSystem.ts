/**
 * GeoSpeed IQ Challenge — Ad System
 *
 * Abstraction layer for ad integration. Currently uses placeholder UI.
 * When ready for production, replace the showInterstitial / showRewarded
 * implementations with your ad provider (AdMob, AdSense, Unity Ads, etc).
 *
 * Supported flows:
 *  1. Interstitial: shown between games (every 3 games for free users)
 *  2. Rewarded: user opts in to watch ad for +1 life
 */

import { isPro } from './premiumSystem';

// ─── Configuration ──────────────────────────────────────────────────
const AD_CONFIG = {
  // Replace these with real ad unit IDs when integrating
  interstitialId: 'ca-app-pub-XXXXXXX/interstitial',
  rewardedId: 'ca-app-pub-XXXXXXX/rewarded',
  // Simulated ad duration (ms) for dev/testing
  devAdDuration: 2000,
};

type AdResult = 'completed' | 'skipped' | 'error' | 'blocked';

// ─── State ──────────────────────────────────────────────────────────
let adProviderReady = false;

/**
 * Initialize ad SDK. Call once on app load.
 * In production, this would load the AdMob/AdSense script.
 */
export function initAds(): void {
  if (isPro()) return;
  // TODO: Load ad provider SDK here
  // e.g., window.adsbygoogle, admob.initialize(), etc.
  adProviderReady = true;
}

// ─── Interstitial Ads ───────────────────────────────────────────────
/**
 * Show a full-screen interstitial ad.
 * Returns a promise that resolves when the ad is closed.
 *
 * In dev mode, shows a simulated overlay for testing flow.
 */
export async function showInterstitial(): Promise<AdResult> {
  if (isPro()) return 'blocked';

  // TODO: Replace with real ad provider call
  // e.g.: await admob.showInterstitial(AD_CONFIG.interstitialId);

  // Dev simulation — resolves after configured duration
  return new Promise((resolve) => {
    const overlay = createAdOverlay('interstitial');
    document.body.appendChild(overlay);

    setTimeout(() => {
      overlay.remove();
      resolve('completed');
    }, AD_CONFIG.devAdDuration);
  });
}

// ─── Rewarded Ads ───────────────────────────────────────────────────
/**
 * Show a rewarded ad (user opts in for a reward).
 * Returns 'completed' if the user watched the full ad.
 */
export async function showRewardedAd(): Promise<AdResult> {
  if (isPro()) return 'blocked';

  // TODO: Replace with real ad provider call
  // e.g.: const result = await admob.showRewarded(AD_CONFIG.rewardedId);

  // Dev simulation
  return new Promise((resolve) => {
    const overlay = createAdOverlay('rewarded');
    document.body.appendChild(overlay);

    setTimeout(() => {
      overlay.remove();
      resolve('completed');
    }, AD_CONFIG.devAdDuration + 1000); // rewarded ads are slightly longer
  });
}

// ─── Dev overlay (placeholder) ──────────────────────────────────────
function createAdOverlay(type: 'interstitial' | 'rewarded'): HTMLDivElement {
  const overlay = document.createElement('div');
  overlay.id = 'geospeed-ad-overlay';
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.92);
    backdrop-filter: blur(8px);
    color: white;
    font-family: system-ui, sans-serif;
    animation: fadeIn 300ms ease;
  `;

  const isRewarded = type === 'rewarded';
  const duration = isRewarded
    ? (AD_CONFIG.devAdDuration + 1000) / 1000
    : AD_CONFIG.devAdDuration / 1000;

  overlay.innerHTML = `
    <div style="text-align: center; max-width: 320px; padding: 24px;">
      <div style="font-size: 48px; margin-bottom: 16px;">
        ${isRewarded ? '🎬' : '📺'}
      </div>
      <p style="font-size: 18px; font-weight: 800; margin-bottom: 8px;">
        ${isRewarded ? 'Anuncio recompensado' : 'Anuncio'}
      </p>
      <p style="font-size: 13px; color: #aaa; margin-bottom: 20px;">
        ${isRewarded
          ? 'Mira este anuncio para recibir +1 vida'
          : 'El juego continuará en unos segundos'}
      </p>
      <div style="
        width: 200px; height: 6px; background: #333; border-radius: 3px;
        overflow: hidden; margin: 0 auto;
      ">
        <div style="
          height: 100%; background: #f5c842; border-radius: 3px;
          animation: adProgress ${duration}s linear forwards;
        "></div>
      </div>
      <p style="font-size: 11px; color: #666; margin-top: 12px;">
        [Espacio publicitario — Modo desarrollo]
      </p>
    </div>
    <style>
      @keyframes adProgress { from { width: 0%; } to { width: 100%; } }
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    </style>
  `;

  return overlay;
}

/**
 * Check if ad provider is initialized and ready.
 */
export function isAdReady(): boolean {
  return adProviderReady && !isPro();
}
