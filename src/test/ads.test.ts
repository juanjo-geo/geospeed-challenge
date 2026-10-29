import { describe, it, expect, afterEach } from 'vitest';
import { adRetryDelayMs, admobTesting, isAdAvailable, showRewardedAd, showInterstitial, adPrivacyOptionsRequired } from '@/lib/adSystem';

const asNative = () => { (window as unknown as { Capacitor: unknown }).Capacitor = { isNativePlatform: () => true }; };

describe('Anuncios: AdMob en la app nativa', () => {
  afterEach(() => { delete (window as unknown as { Capacitor?: unknown }).Capacitor; });

  it('una carga fallida se reintenta con espera creciente, hasta 10 minutos', () => {
    expect(adRetryDelayMs(1)).toBe(30_000);
    expect(adRetryDelayMs(2)).toBe(60_000);
    expect(adRetryDelayMs(3)).toBe(120_000);
    expect(adRetryDelayMs(10)).toBe(600_000);
  });

  it('un build de desarrollo pide anuncios de prueba de Google', () => {
    expect(admobTesting()).toBe(true);
  });

  it('en la app, sin un anuncio cargado no se ofrece "Ver video"', () => {
    asNative();
    expect(isAdAvailable()).toBe(false);
  });

  it('en la app, sin anuncio listo responde error al instante (la partida sigue)', async () => {
    asNative();
    expect(await showRewardedAd()).toBe('error');
    expect(await showInterstitial()).toBe('error');
  });

  it('en la web de desarrollo se sigue usando el anuncio de prueba', () => {
    expect(isAdAvailable()).toBe(true);
  });

  it('"Privacidad de los anuncios" solo aparece en la app (y solo si Google lo pide)', () => {
    expect(adPrivacyOptionsRequired()).toBe(false);
    asNative();
    expect(adPrivacyOptionsRequired()).toBe(false);
  });
});
