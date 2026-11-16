/**
 * Ofertas reales de la tienda (docs/GeoSpeed_Ofertas.md). Dos tipos, con el mismo descuento en Google Play y en la web:
 *  - Bienvenida: el primer mes de Pro mensual a mitad de precio para quien nunca compró Pro.
 *  - Campañas con fecha: N % menos en Pro anual / de por vida hasta una fecha real (tabla store_campaigns).
 * El servidor (store_offers) dice cuáles hay; en la web el descuento lo cobra mercadopago-checkout y en Android
 * Google Play (oferta "bienvenida" del plan mensual, oferta "campana" del plan anual, producto pro_lifetime_promo).
 * Sin dependencias pesadas: la Tienda lo importa directo; el cliente de Supabase se carga al pedir las ofertas.
 */
import { useEffect, useState } from 'react';

export interface StoreCampaign { id: string; name_es: string; name_en: string; percent: number; products: string[]; ends_at: string }
export interface StoreOffers {
  server_now: string;
  welcome: { eligible: boolean; percent: number; product: string };
  campaigns: StoreCampaign[];
}
export interface ProductOffer { kind: 'welcome' | 'campaign'; percent: number; campaign?: StoreCampaign }

const KEY = 'geospeed_store_offers';
export const STORE_OFFERS_EVENT = 'geospeed:store-offers';

function readCache(): StoreOffers | null {
  try { const raw = localStorage.getItem(KEY); return raw ? (JSON.parse(raw) as StoreOffers) : null; } catch { return null; }
}

let inflight: Promise<StoreOffers | null> | null = null;
/** Lee las ofertas del servidor (y las guarda). Sin red o sin la migración devuelve lo último guardado. */
export function fetchStoreOffers(): Promise<StoreOffers | null> {
  if (!inflight) {
    inflight = (async () => {
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data, error } = await (supabase.rpc as unknown as (fn: string) => Promise<{ data: unknown; error: unknown }>)('store_offers');
        if (error || !data) return readCache();
        const offers = data as StoreOffers;
        try { localStorage.setItem(KEY, JSON.stringify(offers)); } catch { /* sin espacio */ }
        try { window.dispatchEvent(new Event(STORE_OFFERS_EVENT)); } catch { /* fuera del navegador */ }
        return offers;
      } catch {
        return readCache();
      } finally {
        inflight = null;
      }
    })();
  }
  return inflight;
}

/** La oferta que corresponde a un producto (la de mayor descuento), o null. Las campañas vencidas no cuentan. */
export function offerFor(productId: string, offers: StoreOffers | null, now = Date.now()): ProductOffer | null {
  if (!offers) return null;
  let best: ProductOffer | null = null;
  if (productId === offers.welcome?.product && offers.welcome.eligible) best = { kind: 'welcome', percent: offers.welcome.percent };
  for (const c of offers.campaigns ?? []) {
    if (!c.products.includes(productId) || Date.parse(c.ends_at) <= now) continue;
    if (!best || c.percent > best.percent) best = { kind: 'campaign', percent: c.percent, campaign: c };
  }
  return best;
}

/** Precio en US$ con el descuento aplicado (la web muestra dólares; Mercado Pago cobra el equivalente en COP) */
export function discountedUsd(priceCents: number, percent: number): string {
  const cents = Math.round((priceCents * (100 - percent)) / 100);
  return `US$${(cents / 100).toFixed(2)}`;
}

/** Ofertas vigentes: las guardadas al instante y las del servidor cuando llegan (se pide al montar) */
export function useStoreOffers(): StoreOffers | null {
  const [offers, setOffers] = useState<StoreOffers | null>(() => readCache());
  useEffect(() => {
    const on = () => setOffers(readCache());
    window.addEventListener(STORE_OFFERS_EVENT, on);
    void fetchStoreOffers().then((o) => { if (o) setOffers(o); });
    return () => window.removeEventListener(STORE_OFFERS_EVENT, on);
  }, []);
  return offers;
}
