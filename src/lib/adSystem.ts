import { BRAND } from '@/lib/theme';
/**
 * GeoSpeed — Ad System
 *
 * Tres modos:
 * 1. App nativa (Capacitor): AdMob con @capacitor-community/admob — recompensado (+1 vida) e
 *    intersticial entre partidas. Los anuncios se precargan; si no hay uno listo, no se ofrece.
 * 2. Web: Google AdSense si VITE_ADSENSE_CLIENT_ID está configurado (hoy no lo está → sin anuncios).
 * 3. Desarrollo: overlay de prueba para recorrer los flujos.
 *
 * AdMob (nativo):
 * - IDs en .env: VITE_ADMOB_REWARDED_ID y VITE_ADMOB_INTERSTITIAL_ID (públicos); el App ID va en
 *   android/app/src/main/AndroidManifest.xml (sin él la app se cierra al iniciar).
 * - VITE_ADMOB_TESTING=true (o un build de desarrollo) pide anuncios de prueba de Google: así un AAB
 *   de prueba interna no genera tráfico inválido.
 * - Consentimiento: el SDK de mensajes de usuario de Google (UMP) pregunta en Europa / Reino Unido
 *   según el mensaje configurado en AdMob → Privacidad y mensajes; en el resto del mundo no pregunta.
 */

import { isPro } from './premiumSystem';
import { trackAdShown } from './analytics';
import { isNativeApp } from './assetUrl';
import type { PluginListenerHandle } from '@capacitor/core';

// ─── Configuration ──────────────────────────────────────────────────

const ADSENSE_CLIENT = import.meta.env.VITE_ADSENSE_CLIENT_ID || '';
const ADSENSE_SLOT_INTERSTITIAL = import.meta.env.VITE_ADSENSE_SLOT_INTERSTITIAL || '';
const ADSENSE_SLOT_REWARDED = import.meta.env.VITE_ADSENSE_SLOT_REWARDED || '';

const ADMOB_REWARDED_ID = import.meta.env.VITE_ADMOB_REWARDED_ID || '';
const ADMOB_INTERSTITIAL_ID = import.meta.env.VITE_ADMOB_INTERSTITIAL_ID || '';

const DEV_AD_DURATION = 2000; // ms for dev placeholder

type AdResult = 'completed' | 'skipped' | 'error' | 'blocked';

// ─── State ──────────────────────────────────────────────────────────

let adProviderReady = false;
let useRealAds = false;

// ¿Estamos en build de desarrollo? Solo entonces se permite el overlay placeholder.
function isDevBuild(): boolean {
  try { return Boolean((import.meta as any).env?.DEV); } catch { return false; }
}

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

  if (isNativeApp()) {
    void initNativeAds();
    return;
  }

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

  if (isNativeApp()) return showNativeInterstitial();

  trackAdShown('interstitial');

  // Real AdSense interstitial
  if (useRealAds && ADSENSE_SLOT_INTERSTITIAL) {
    return showAdSenseInterstitial();
  }

  // Sin proveedor real: en producción NO mostrar placeholder (molesta al usuario).
  // En nativo, aquí entrará AdMob en el futuro. En dev mostramos el overlay para probar.
  if (isDevBuild()) return showDevOverlay('interstitial');
  return 'blocked';
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

  if (isNativeApp()) return showNativeRewarded();

  trackAdShown('rewarded');

  if (useRealAds && ADSENSE_SLOT_REWARDED) {
    return showAdSenseRewarded();
  }

  // Sin proveedor real: en dev mostramos placeholder para probar el flujo; en
  // producción (web sin AdSense) no hay anuncio que ofrecer → 'blocked'.
  // En la app nativa, aquí entrará el rewarded de AdMob.
  if (isDevBuild()) return showDevOverlay('rewarded');
  return 'blocked';
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
      label.style.cssText = `color: ${BRAND.yellow}; font-size: 14px; font-weight: 600; margin-bottom: 16px; font-family: system-ui;`;

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
          background: ${BRAND.yellow}; color: ${BRAND.navyDeep};
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
          <div style="height: 100%; background: ${BRAND.yellow}; border-radius: 3px; animation: adProgress ${duration / 1000}s linear forwards;"></div>
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

/**
 * ¿Hay realmente un anuncio que mostrar al usuario?
 * - App nativa → solo si AdMob ya tiene un recompensado cargado (una app nueva o sin inventario
 *   puede no recibir anuncios: no se ofrece un botón que no hace nada)
 * - Web con AdSense configurado → sí
 * - Build de desarrollo (placeholder) → sí
 * - Web de producción SIN AdSense → no
 */
export function isAdAvailable(): boolean {
  if (isPro()) return false;
  if (isNativeApp()) return native.rewardedLoaded;
  if (useRealAds && (ADSENSE_SLOT_REWARDED || ADSENSE_SLOT_INTERSTITIAL)) return true;
  if (isDevBuild()) return true;
  return false;
}

// ─── AdMob (app nativa) ─────────────────────────────────────────────

type AdMobModule = typeof import('@capacitor-community/admob');

/** Evento global cuando cambia la disponibilidad del recompensado (para refrescar botones). */
export const ADS_AVAILABILITY_EVENT = 'geospeed:ads-availability';

const native = {
  mod: null as AdMobModule | null,
  ready: false,
  /** false si el usuario de Europa aún no da su consentimiento (UMP): no se piden anuncios */
  canRequestAds: true,
  /** Europa / Reino Unido: Ajustes debe ofrecer "Privacidad de los anuncios" */
  privacyOptionsRequired: false,
  rewardedLoaded: false,
  rewardedLoading: false,
  rewardedFails: 0,
  interstitialLoaded: false,
  interstitialLoading: false,
  interstitialFails: 0,
};

/** Anuncios de prueba de Google: builds de desarrollo o un AAB de prueba interna (VITE_ADMOB_TESTING=true). */
export function admobTesting(): boolean {
  return isDevBuild() || import.meta.env.VITE_ADMOB_TESTING === 'true';
}

/** Espera antes de reintentar una carga fallida: 30 s, 1 min, 2 min… hasta 10 min. */
export function adRetryDelayMs(fails: number): number {
  return Math.min(10 * 60_000, 30_000 * 2 ** Math.max(0, fails - 1));
}

async function initNativeAds(): Promise<void> {
  if (native.mod) return;
  try {
    const mod = await import('@capacitor-community/admob');
    native.mod = mod;
    const { AdMob } = mod;
    await AdMob.initialize({ initializeForTesting: admobTesting() });
    // Consentimiento (UMP). Sin mensaje configurado en AdMob o fuera de Europa responde NOT_REQUIRED.
    try {
      let info = await AdMob.requestConsentInfo();
      if (info.isConsentFormAvailable && info.status === 'REQUIRED') info = await AdMob.showConsentForm();
      native.canRequestAds = info.canRequestAds !== false;
      native.privacyOptionsRequired = info.privacyOptionsRequirementStatus === 'REQUIRED';
    } catch (e) {
      console.info('[Ads] Consentimiento de AdMob no disponible:', e);
    }
    native.ready = true;
    void preloadRewarded();
    void preloadInterstitial();
  } catch (e) {
    console.warn('[Ads] AdMob no se pudo iniciar:', e);
  }
}

function setRewardedLoaded(v: boolean): void {
  if (native.rewardedLoaded === v) return;
  native.rewardedLoaded = v;
  try { window.dispatchEvent(new CustomEvent(ADS_AVAILABILITY_EVENT, { detail: { rewarded: v } })); } catch { /* ignore */ }
}

async function preloadRewarded(): Promise<void> {
  const m = native.mod;
  if (!m || !native.ready || !native.canRequestAds || !ADMOB_REWARDED_ID || isPro()) return;
  if (native.rewardedLoaded || native.rewardedLoading) return;
  native.rewardedLoading = true;
  try {
    await m.AdMob.prepareRewardVideoAd({ adId: ADMOB_REWARDED_ID, isTesting: admobTesting() });
    native.rewardedFails = 0;
    setRewardedLoaded(true);
  } catch {
    native.rewardedFails++;
    setRewardedLoaded(false);
    setTimeout(() => { void preloadRewarded(); }, adRetryDelayMs(native.rewardedFails));
  } finally {
    native.rewardedLoading = false;
  }
}

async function preloadInterstitial(): Promise<void> {
  const m = native.mod;
  if (!m || !native.ready || !native.canRequestAds || !ADMOB_INTERSTITIAL_ID || isPro()) return;
  if (native.interstitialLoaded || native.interstitialLoading) return;
  native.interstitialLoading = true;
  try {
    await m.AdMob.prepareInterstitial({ adId: ADMOB_INTERSTITIAL_ID, isTesting: admobTesting() });
    native.interstitialFails = 0;
    native.interstitialLoaded = true;
  } catch {
    native.interstitialFails++;
    native.interstitialLoaded = false;
    setTimeout(() => { void preloadInterstitial(); }, adRetryDelayMs(native.interstitialFails));
  } finally {
    native.interstitialLoading = false;
  }
}

/**
 * Muestra un anuncio ya cargado y espera a que se cierre. `listen` registra los eventos del tipo
 * de anuncio; `finish` resuelve una sola vez y quita los oyentes. Un tope evita quedar colgados si
 * el SDK no avisa el cierre.
 */
function runNativeAd(
  register: (finish: (r: AdResult) => void) => Promise<PluginListenerHandle[]>,
  show: () => Promise<unknown>,
  onShown: (value: unknown) => void,
  timeoutMs: number,
): Promise<AdResult> {
  return new Promise<AdResult>((resolve) => {
    let done = false;
    let handles: PluginListenerHandle[] = [];
    let timer: ReturnType<typeof setTimeout> | null = null;
    const finish = (r: AdResult) => {
      if (done) return;
      done = true;
      if (timer) clearTimeout(timer);
      handles.forEach((h) => { void h.remove(); });
      resolve(r);
    };
    register(finish)
      .then((hs) => {
        handles = hs;
        if (done) { hs.forEach((h) => { void h.remove(); }); return; }
        timer = setTimeout(() => finish('error'), timeoutMs);
        return show().then(onShown);
      })
      .catch(() => finish('error'));
  });
}

async function showNativeRewarded(): Promise<AdResult> {
  const m = native.mod;
  if (!m || !native.rewardedLoaded) { void preloadRewarded(); return 'error'; }
  trackAdShown('rewarded');
  setRewardedLoaded(false);
  let rewarded = false;
  const result = await runNativeAd(
    async (finish) => [
      await m.AdMob.addListener(m.RewardAdPluginEvents.Rewarded, () => { rewarded = true; }),
      await m.AdMob.addListener(m.RewardAdPluginEvents.Dismissed, () => finish(rewarded ? 'completed' : 'skipped')),
      await m.AdMob.addListener(m.RewardAdPluginEvents.FailedToShow, () => finish('error')),
    ],
    () => m.AdMob.showRewardVideoAd(),
    // En Android la promesa trae el premio ganado; el cierre llega por Dismissed
    (item) => { if (item && typeof item === 'object' && 'amount' in item) rewarded = true; },
    3 * 60_000,
  );
  void preloadRewarded();
  // Si el SDK no avisó el cierre pero sí el premio, el jugador vio el anuncio completo
  return result === 'error' && rewarded ? 'completed' : result;
}

async function showNativeInterstitial(): Promise<AdResult> {
  const m = native.mod;
  if (!m || !native.interstitialLoaded) { void preloadInterstitial(); return 'error'; }
  trackAdShown('interstitial');
  native.interstitialLoaded = false;
  const result = await runNativeAd(
    async (finish) => [
      await m.AdMob.addListener(m.InterstitialAdPluginEvents.Dismissed, () => finish('completed')),
      await m.AdMob.addListener(m.InterstitialAdPluginEvents.FailedToShow, () => finish('error')),
    ],
    () => m.AdMob.showInterstitial(),
    () => { /* el cierre llega por Dismissed */ },
    2 * 60_000,
  );
  void preloadInterstitial();
  return result;
}

/** Europa / Reino Unido: hay que ofrecer cambiar el consentimiento de anuncios (Ajustes). */
export function adPrivacyOptionsRequired(): boolean {
  return isNativeApp() && native.privacyOptionsRequired;
}

/** Abre el formulario de privacidad de anuncios de Google. */
export async function showAdPrivacyOptions(): Promise<void> {
  const m = native.mod;
  if (!m) return;
  try {
    await m.AdMob.showPrivacyOptionsForm();
    const info = await m.AdMob.requestConsentInfo();
    native.canRequestAds = info.canRequestAds !== false;
    if (native.canRequestAds) { void preloadRewarded(); void preloadInterstitial(); }
  } catch (e) {
    console.warn('[Ads] Formulario de privacidad no disponible:', e);
  }
}
