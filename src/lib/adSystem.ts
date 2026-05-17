/**
 * GeoSpeed — Ad System
 *
 * Dual-mode ad integration:
 * 1. Google AdSense (web) — production ads for web browsers
 * 2. Dev Placeholder — simulated overlay for testing
 *
 * AdSense integration uses the standard "Auto ads" approach:
 * - A script tag loads the AdSense library
 * - Interstitials are triggered via the adsbygoogle push API
 * - Rewarded ads use the experimental AdSense rewarded format
 *
 * When migrating to native apps, replace with AdMob calls.
 *
 * Setup:
 * 1. Set VITE_ADSENSE_CLIENT_ID in .env (e.g., "ca-pub-1234567890")
 * 2. Set VITE_ADSENSE_SLOT_INTERSTITIAL and VITE_ADSENSE_SLOT_REWARDED
 * 3. The script auto-loads on initAds()
 */

import { isPro } from './premiumSystem';
import { trackAdShown } from './analytics';

// ─── Configuration ──────────────────────────────────────────────────

const ADSENSE_CLIENT = import.meta.env.VITE_ADSENSE_CLIENT_ID || '';
const ADSENSE_SLOT_INTERSTITIAL = import.meta.env.VITE_ADSENSE_SLOT_INTERSTITIAL || '';
const ADSENSE_SLOT_REWARDED = import.meta.env.VITE_ADSENSE_SLOT_REWARDED || '';

const DEV_AD_DURATION = 2000; // ms for dev placeholder

type AdResult = 'completed' | 'skipped' | 'error' | 'blocked';

// ─── State ──────────────────────────────────────────────────────────

let adProviderReady = false;
let useRealAds = false;

declare global {
  interface Window {
    adsbygoogle: Array<Record<string, unknown>>;
  }
}

// ─── Initialization ─────────────────────────────────────────────────

/**
 * Initialize ad system. Call once on app load.
 * Loads Google AdSense script if client ID is configured.
 */
export function initAds(): void {
  if (isPro()) return;
  adProviderReady = true;

  if (!ADSENSE_CLIENT) {
    console.info('[Ads] No VITE_ADSENSE_CLIENT_ID — using dev placeholder');
    return;
  }

  // Load AdSense script
  try {
    const existing = document.querySelector(`script[src*="adsbygoogle"]`);
    if (!existing) {
      const script = document.createElement('script');
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
      document.head.appendChild(script);

      script.onload = () => {
        useRealAds = true;
        console.info('[Ads] AdSense loaded successfully');
      };
      script.onerror = () => {
        console.warn('[Ads] AdSense failed to load — using dev placeholder');
      };
    } else {
      useRealAds = true;
    }

    window.adsbygoogle = window.adsbygoogle || [];
  } catch (e) {
    console.warn('[Ads] AdSense init error:', e);
  }
}

// ─── Interstitial Ads ───────────────────────────────────────────────

/**
 * Show a full-screen interstitial ad.
 * Uses AdSense if available, otherwise shows dev placeholder.
 */
export async function showInterstitial(): Promise<AdResult> {
  if (isPro()) return 'blocked';

  trackAdShown('interstitial');

  // Real AdSense interstitial
  if (useRealAds && ADSENSE_SLOT_INTERSTITIAL) {
    return showAdSenseInterstitial();
  }

  // Dev placeholder
  return showDevOverlay('interstitial');
}

/**
 * Show AdSense interstitial via an overlay ad container.
 */
async function showAdSenseInterstitial(): Promise<AdResult> {
  return new Promise((resolve) => {
    try {
      // Create ad container
      const container = document.createElement('div');
      container.id = 'geospeed-adsense-interstitial';
      container.style.cssText = `
        position: fixed; inset: 0; z-index: 9999;
        display: flex; align-items: center; justify-content: center;
        background: rgba(0,0,0,0.92); backdrop-filter: blur(8px);
      `;

      // Close button (appears after 3s)
      const closeBtn = document.createElement('button');
      closeBtn.textContent = '✕ Cerrar';
      closeBtn.style.cssText = `
        position: absolute; top: 16px; right: 16px;
        background: rgba(255,255,255,0.15); color: white;
        border: 1px solid rgba(255,255,255,0.3);
        padding: 8px 16px; border-radius: 8px;
        font-size: 14px; font-weight: 600; cursor: pointer;
        opacity: 0; transition: opacity 0.3s;
      `;
      closeBtn.onclick = () => {
        container.remove();
        resolve('completed');
      };
      setTimeout(() => { closeBtn.style.opacity = '1'; }, 3000);

      // Ad unit
      const adIns = document.createElement('ins');
      adIns.className = 'adsbygoogle';
      adIns.style.cssText = 'display:block; width:336px; height:280px;';
      adIns.setAttribute('data-ad-client', ADSENSE_CLIENT);
      adIns.setAttribute('data-ad-slot', ADSENSE_SLOT_INTERSTITIAL);
      adIns.setAttribute('data-ad-format', 'auto');
      adIns.setAttribute('data-full-width-responsive', 'true');

      container.appendChild(adIns);
      container.appendChild(closeBtn);
      document.body.appendChild(container);

      // Push ad request
      (window.adsbygoogle = window.adsbygoogle || []).push({});

      // Safety timeout: if ad doesn't load in 8s, close
      setTimeout(() => {
        if (document.getElementById('geospeed-adsense-interstitial')) {
          container.remove();
          resolve('error');
        }
      }, 8000);
    } catch (e) {
      console.warn('[Ads] AdSense interstitial error:', e);
      resolve('error');
    }
  });
}

// ─── Rewarded Ads ───────────────────────────────────────────────────

/**
 * Show a rewarded ad (user opts in for +1 life).
 * Returns 'completed' if the user watched the full ad.
 */
export async function showRewardedAd(): Promise<AdResult> {
  if (isPro()) return 'blocked';

  trackAdShown('rewarded');

  if (useRealAds && ADSENSE_SLOT_REWARDED) {
    return showAdSenseRewarded();
  }

  return showDevOverlay('rewarded');
}

async function showAdSenseRewarded(): Promise<AdResult> {
  return new Promise((resolve) => {
    try {
      const container = document.createElement('div');
      container.id = 'geospeed-adsense-rewarded';
      container.style.cssText = `
        position: fixed; inset: 0; z-index: 9999;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        background: rgba(0,0,0,0.95); backdrop-filter: blur(8px);
      `;

      const label = document.createElement('p');
      label.textContent = '🎬 Mira el anuncio para recibir +1 vida';
      label.style.cssText = 'color: #f5c842; font-size: 14px; font-weight: 600; margin-bottom: 16px; font-family: system-ui;';

      const adIns = document.createElement('ins');
      adIns.className = 'adsbygoogle';
      adIns.style.cssText = 'display:block; width:336px; height:280px;';
      adIns.setAttribute('data-ad-client', ADSENSE_CLIENT);
      adIns.setAttribute('data-ad-slot', ADSENSE_SLOT_REWARDED);

      container.appendChild(label);
      container.appendChild(adIns);
      document.body.appendChild(container);

      (window.adsbygoogle = window.adsbygoogle || []).push({});

      // Rewarded = must watch for 5s minimum
      setTimeout(() => {
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✓ Reclamar vida';
        closeBtn.style.cssText = `
          position: absolute; bottom: 40px;
          background: #f5c842; color: #0A0E18;
          padding: 12px 32px; border-radius: 12px; border: none;
          font-size: 16px; font-weight: 800; cursor: pointer;
          font-family: system-ui;
        `;
        closeBtn.onclick = () => {
          container.remove();
          resolve('completed');
        };
        container.appendChild(closeBtn);
      }, 5000);

      // Safety timeout
      setTimeout(() => {
        if (document.getElementById('geospeed-adsense-rewarded')) {
          container.remove();
          resolve('completed');
        }
      }, 15000);
    } catch (e) {
      console.warn('[Ads] AdSense rewarded error:', e);
      resolve('error');
    }
  });
}

// ─── Dev Overlay (placeholder for testing) ──────────────────────────

function showDevOverlay(type: 'interstitial' | 'rewarded'): Promise<AdResult> {
  return new Promise((resolve) => {
    const isRewarded = type === 'rewarded';
    const duration = isRewarded ? DEV_AD_DURATION + 1000 : DEV_AD_DURATION;

    const overlay = document.createElement('div');
    overlay.id = 'geospeed-ad-overlay';
    overlay.style.cssText = `
      position: fixed; inset: 0; z-index: 9999;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      background: rgba(0, 0, 0, 0.92); backdrop-filter: blur(8px);
      color: white; font-family: system-ui, sans-serif;
      animation: fadeIn 300ms ease;
    `;

    overlay.innerHTML = `
      <div style="text-align: center; max-width: 320px; padding: 24px;">
        <div style="font-size: 48px; margin-bottom: 16px;">
          ${isRewarded ? '🎬' : '📺'}
        </div>
        <p style="font-size: 18px; font-weight: 800; margin-bottom: 8px;">
          ${isRewarded ? 'Anuncio recompensado' : 'Anuncio'}
        </p>
        <p style="font-size: 13px; color: #aaa; margin-bottom: 20px;">
          ${isRewarded ? 'Mira este anuncio para recibir +1 vida' : 'El juego continuará en unos segundos'}
        </p>
        <div style="width: 200px; height: 6px; background: #333; border-radius: 3px; overflow: hidden; margin: 0 auto;">
          <div style="height: 100%; background: #f5c842; border-radius: 3px; animation: adProgress ${duration / 1000}s linear forwards;"></div>
        </div>
        <p style="font-size: 11px; color: #666; margin-top: 12px;">
          [Espacio publicitario — Configura VITE_ADSENSE_CLIENT_ID]
        </p>
      </div>
      <style>
        @keyframes adProgress { from { width: 0%; } to { width: 100%; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      </style>
    `;

    document.body.appendChild(overlay);

    setTimeout(() => {
      overlay.remove();
      resolve('completed');
    }, duration);
  });
}

/**
 * Check if ad provider is initialized and ready.
 */
export function isAdReady(): boolean {
  return adProviderReady && !isPro();
}
