import { describe, it, expect } from 'vitest';
import { discountedUsd, offerFor, type StoreOffers } from '../lib/storeOffers';

const base = (o: Partial<StoreOffers> = {}): StoreOffers => ({
  server_now: '2026-11-17T00:00:00Z',
  welcome: { eligible: true, percent: 50, product: 'pro_monthly' },
  campaigns: [],
  ...o,
});
const campaign = { id: 'lanz', name_es: 'Lanzamiento', name_en: 'Launch', percent: 30, products: ['pro_yearly', 'pro_lifetime'], ends_at: '2026-11-20T04:59:00Z' };
const now = Date.parse('2026-11-18T12:00:00Z');

describe('ofertas de la tienda', () => {
  it('bienvenida solo en Pro mensual y solo si el servidor dice que puede usarla', () => {
    expect(offerFor('pro_monthly', base(), now)).toEqual({ kind: 'welcome', percent: 50 });
    expect(offerFor('pro_yearly', base(), now)).toBeNull();
    expect(offerFor('pro_monthly', base({ welcome: { eligible: false, percent: 50, product: 'pro_monthly' } }), now)).toBeNull();
  });
  it('campaña en sus productos hasta su fecha real', () => {
    const o = base({ campaigns: [campaign] });
    expect(offerFor('pro_lifetime', o, now)?.kind).toBe('campaign');
    expect(offerFor('lives_5', o, now)).toBeNull();
    expect(offerFor('pro_lifetime', o, Date.parse('2026-11-21T00:00:00Z'))).toBeNull(); // vencida
  });
  it('gana el mayor descuento', () => {
    const o = base({ campaigns: [{ ...campaign, products: ['pro_monthly'], percent: 30 }] });
    expect(offerFor('pro_monthly', o, now)?.kind).toBe('welcome');
  });
  it('precio rebajado en dólares', () => {
    expect(discountedUsd(299, 50)).toBe('US$1.50');
    expect(discountedUsd(2999, 30)).toBe('US$20.99');
  });
  it('sin ofertas no se promete nada', () => {
    expect(offerFor('pro_monthly', null, now)).toBeNull();
  });
});
