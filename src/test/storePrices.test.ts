import { beforeEach, describe, expect, it } from 'vitest';
import { STORE_PRODUCTS } from '@/lib/premiumSystem';
import { displayPrice, localPrice, resetLocalPrices, setLocalPrices, STORE_PRICES_KEY } from '@/lib/storePrices';

const ES = { month: '/mes', year: '/año' };
const EN = { month: '/mo', year: '/yr' };
const prod = (id: string) => STORE_PRODUCTS.find(p => p.id === id)!;

describe('precios locales de la tienda', () => {
  beforeEach(() => resetLocalPrices());

  it('sin precios de la tienda muestra los US$ del catálogo con el periodo traducido', () => {
    expect(displayPrice(prod('lives_5'), ES)).toBe('US$0.99');
    expect(displayPrice(prod('pro_monthly'), ES)).toBe('US$2.99/mes');
    expect(displayPrice(prod('pro_yearly'), EN)).toBe('US$17.99/yr');
  });

  it('con precios de Google Play muestra la moneda local y agrega el periodo a las suscripciones', () => {
    setLocalPrices({ pro_monthly: 'COP 11.900', pro_lifetime: 'COP 119.900', lives_5: 'COP 3.900' });
    expect(displayPrice(prod('pro_monthly'), ES)).toBe('COP 11.900/mes');
    expect(displayPrice(prod('pro_lifetime'), ES)).toBe('COP 119.900');
    expect(displayPrice(prod('lives_5'), EN)).toBe('COP 3.900');
    // Lo que no llegó sigue en US$
    expect(displayPrice(prod('pro_yearly'), ES)).toBe('US$17.99/año');
  });

  it('se recuerda entre aperturas y descarta valores raros', () => {
    setLocalPrices({ lives_15: 'MX$39.00', lives_50: 42, pro_yearly: '', x: 'a'.repeat(40) });
    expect(JSON.parse(localStorage.getItem(STORE_PRICES_KEY)!)).toEqual({ lives_15: 'MX$39.00' });
    // otra "apertura": se lee de localStorage
    const saved = localStorage.getItem(STORE_PRICES_KEY)!;
    resetLocalPrices();
    localStorage.setItem(STORE_PRICES_KEY, saved);
    expect(localPrice('lives_15')).toBe('MX$39.00');
    expect(localPrice('lives_50')).toBeNull();
  });

  it('las ofertas usan {price} en ambos idiomas', async () => {
    const es = (await import('@/i18n/es')).default as Record<string, string>;
    const en = (await import('@/i18n/en')).default as Record<string, string>;
    for (const d of [es, en]) {
      for (const k of ['offer_zeroLives_cta', 'offer_pro_cta', 'offer_close_cta']) {
        expect(d[k]).toContain('{price}');
        expect(d[k]).not.toContain('US$');
      }
    }
  });
});
